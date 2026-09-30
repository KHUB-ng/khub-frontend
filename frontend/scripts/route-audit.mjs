#!/usr/bin/env node
/**
 * Route audit — for EVERY backend route, which screen exercises it?
 *
 * The question you need answered: "is there anything in the backend with no
 * frontend?" This walks the coverage manifest and, for each route's client
 * function, finds the page/component file that actually calls it.
 *
 * Run: node scripts/route-audit.mjs
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SKIP = new Set([
  "types.ts", "client.ts", "money.ts", "pagination.ts",
  "coverage.ts", "registry.ts", "index.ts", "ws.ts", "ai.ts",
]);

function walk(dir, out = []) {
  if (!statSync(dir, { throwIfNoEntry: false })) return out;
  for (const name of readdirSync(dir)) {
    const p = path.join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(tsx?|mts)$/.test(name)) out.push(p);
  }
  return out;
}

const consumers = [
  ...walk(path.join(root, "src", "pages")),
  ...walk(path.join(root, "src", "components")),
  ...walk(path.join(root, "src", "contexts")),
  ...walk(path.join(root, "src")),
].filter((p) => !p.includes(`${path.sep}api${path.sep}`));

// file -> source, so we can name the screen that calls each function
const byFile = new Map(consumers.map((p) => [p, readFileSync(p, "utf8")]));
const allText = [...byFile.values()].join("\n");

// An import can be renamed: `import { auth as authApi } from "@/api"`. The
// manifest's `fn` says `auth.login`, the file says `authApi.login`. Map the
// original module name to every local name it goes by, or the audit reports
// working screens as missing.
const aliases = new Map(); // original module name -> Set of local names
const register = (orig, local) => {
  if (!aliases.has(orig)) aliases.set(orig, new Set());
  aliases.get(orig).add(local);
};
for (const m of allText.matchAll(/\bimport\s*\{([^}]+)\}\s*from\s*["']@\/api["']/g)) {
  for (const raw of m[1].split(",")) {
    const t = raw.trim();
    if (!t) continue;
    const [orig, local] = t.split(/\s+as\s+/).map((s) => s.trim());
    register(orig, orig);
    if (local) register(orig, local);
  }
}

// Load the manifest (same trick as gen-coverage.mjs: bundle with esbuild).
const bundled = await build({
  entryPoints: [path.join(root, "src/api/coverage.ts")],
  bundle: true, format: "esm", platform: "node", write: false, logLevel: "silent",
});
const mod = await import(
  `data:text/javascript;base64,${Buffer.from(bundled.outputFiles[0].text).toString("base64")}`
);

/** Which files call `fn`? `mod` is the namespace, or a bare export name. */
function callersFor(fnField) {
  if (!fnField) return [];
  const cleaned = fnField.replace(/\s*\(.*?\)\s*$/, "").trim();
  const dot = cleaned.lastIndexOf(".");
  const mod = dot > 0 ? cleaned.slice(0, dot) : null;
  const bare = dot > 0 ? cleaned.slice(dot + 1) : cleaned;
  const hits = [];

  for (const [file, src] of byFile) {
    const names = mod ? aliases.get(mod) : null;
    if (names) {
      // \s* either side of the dot: callers commonly break across lines
      // (auth\n  .verifyEmail(...)), which a same-line pattern misses.
      const re = new RegExp(
        `\\b(?:${[...names].map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})\\s*\\.\\s*${bare}\\b`,
      );
      if (re.test(src)) hits.push(path.relative(path.join(root, "src"), file).replace(/\\/g, "/"));
      continue;
    }
    // No namespaced import for this module — fall back to the bare export
    // (e.g. the ChatSocket class from api/ws.ts is imported directly).
    if (new RegExp(`\\b${bare}\\b`).test(src)) {
      const called = new RegExp(`\\b${bare}\\s*\\(|\\b${bare}\\s*\\.|\\.\\s*${bare}\\b|new\\s+${bare}\\b`);
      if (called.test(src)) hits.push(path.relative(path.join(root, "src"), file).replace(/\\/g, "/"));
    }
  }
  return [...new Set(hits)];
}

// Routes exercised by the HTTP layer itself, not by a page. Listing them
// here keeps the "NO UI" list meaning "nobody calls it" rather than "no
// screen draws it" — the refresh call is made transparently inside
// src/api/client.ts on every 401, and re-calling it from a page would break
// the single-flight guard that stops the backend revoking the token family.
const INTERNAL_CALLERS = {
  "POST /api/auth/refresh": ["api/client.ts (auto on 401, single-flight)"],
};

const byGroup = new Map();
for (const g of mod.COVERAGE) byGroup.set(g.group, []);

const missing = [];
for (const group of mod.COVERAGE) {
  for (const r of group.routes) {
    const key = `${r.method} ${r.path}`;
    const internal = INTERNAL_CALLERS[key];
    const callers = callersFor(r.fn);
    const served = internal ?? (r.status === "ops" ? ["(server-to-server)"]
      : r.status === "deferred" ? ["(blocked: browser cannot)"]
      : callers);
    if (!served.length) missing.push(key);
    byGroup.get(group.group).push({ route: key, status: r.status, served });
  }
}

let total = 0;
for (const [name, rows] of byGroup) {
  total += rows.length;
  console.log(`\n## ${name}  (${rows.length})`);
  for (const row of rows) {
    const where = row.served.length ? row.served.join(", ") : "*** NO UI ***";
    console.log(`  [${row.status.padEnd(8)}] ${row.route.padEnd(52)} ${where}`);
  }
}

console.log(`\nTOTAL ${total} routes.`);
console.log(missing.length ? `NO UI FOR:\n  ${missing.join("\n  ")}` : "Every route has a screen or a stated blocker.");
