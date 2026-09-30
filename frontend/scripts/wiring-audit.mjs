#!/usr/bin/env node
/**
 * Wiring audit — which typed client functions does the UI actually call?
 *
 * Source of truth for "what is left to build". A function exported from
 * src/api/* that no page/context/component imports is a gap.
 *
 * Run: node scripts/wiring-audit.mjs
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const SKIP = new Set([
  "types.ts",
  "client.ts",
  "money.ts",
  "pagination.ts",
  "coverage.ts",
  "registry.ts",
  "index.ts",
  "ws.ts",
  "ai.ts",
]);

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = path.join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(tsx?|mts)$/.test(name)) out.push(p);
  }
  return out;
}

const apiDir = path.join(root, "src", "api");
const modules = readdirSync(apiDir)
  .filter((f) => f.endsWith(".ts") && !SKIP.has(f))
  .map((f) => f.replace(/\.ts$/, ""));

// Everything that could call the client.
const consumers = [
  ...walk(path.join(root, "src", "pages")),
  ...walk(path.join(root, "src", "components")),
  ...walk(path.join(root, "src", "contexts")),
  ...walk(path.join(root, "src")),
].filter((p) => !p.includes(`${path.sep}api${path.sep}`));

const consumerText = consumers
  .map((p) => readFileSync(p, "utf8"))
  .join("\n");

// Also catch namespace imports:  import { admin } from "@/api"  + admin.foo(...)
const ns = new Set();
for (const m of consumerText.matchAll(/\bimport\s*\{([^}]+)\}\s*from\s*["']@\/api["']/g)) {
  for (const part of m[1].split(",")) {
    const t = part.trim();
    if (!t) continue;
    const as = t.split(/\s+as\s+/);
    ns.add((as[1] || as[0]).trim());
  }
}

const results = [];
for (const mod of modules) {
  const src = readFileSync(path.join(apiDir, `${mod}.ts`), "utf8");
  const fns = [...src.matchAll(/export\s+(?:async\s+)?function\s+([A-Za-z0-9_]+)/g)].map((m) => m[1]);
  const used = [];
  const unused = [];
  for (const fn of fns) {
    // called via namespace (admin.foo) or imported by name (foo)
    const viaNs = ns.has(mod) && new RegExp(`\\b${mod}\\.${fn}\\b`).test(consumerText);
    const byName = new RegExp(`\\b${fn}\\b`).test(consumerText);
    (viaNs || byName ? used : unused).push(fn);
  }
  results.push({ mod, total: fns.length, used, unused });
}

let total = 0;
let wired = 0;
for (const r of results) {
  total += r.total;
  wired += r.used.length;
  const flag = r.unused.length === 0 ? "✅" : "⚠️ ";
  console.log(`${flag} ${r.mod.padEnd(14)} ${String(r.used.length).padStart(3)}/${String(r.total).padEnd(3)} used`);
  if (r.unused.length) console.log(`      NOT WIRED: ${r.unused.join(", ")}`);
}
console.log(`\ntotal client functions: ${total} | called from UI: ${wired} | not wired: ${total - wired}`);
