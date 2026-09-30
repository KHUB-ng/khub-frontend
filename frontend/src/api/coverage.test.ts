import { describe, expect, it } from "vitest";
import { COVERAGE, totals } from "./coverage";
import { SPECS, specFor } from "./registry";

/**
 * The completeness guarantees behind "every backend route has UI".
 *
 * If someone adds a route to `docs/API.md` and forgets the manifest, or adds
 * a manifest entry with a mistyped path that no spec matches, these fail —
 * which is the point: silent omission is the failure mode we care about.
 */

const all = COVERAGE.flatMap((g) => g.routes);
const keys = all.map((r) => `${r.method} ${r.path}`);

describe("route manifest", () => {
  it("matches the backend's documented 138 routes", () => {
    expect(totals().total).toBe(138);
  });

  it("has no duplicate method+path entries", () => {
    const dupes = keys.filter((k, i) => keys.indexOf(k) !== i);
    expect(dupes).toEqual([]);
  });

  it("gives every route a status", () => {
    const invalid = all.filter(
      (r) => !["wired", "client", "deferred", "ops"].includes(r.status),
    );
    expect(invalid).toEqual([]);
  });

  it("requires an explanation on every deferred route", () => {
    const missing = all.filter((r) => r.status === "deferred" && !r.note);
    expect(missing.map((r) => `${r.method} ${r.path}`)).toEqual([]);
  });
});

describe("route registry", () => {
  it("has an explicit spec for every route", () => {
    // A missing spec still yields a generic form, but we want to know about it.
    const unspecced = keys.filter((k) => !(k in SPECS));
    expect(unspecced).toEqual([]);
  });

  it("always returns a spec, never undefined", () => {
    for (const key of keys) {
      const [method = "", path = ""] = key.split(" ");
      expect(specFor(method, path)).toBeTruthy();
    }
  });

  it("marks server-to-server routes as public/ops", () => {
    const webhook = specFor("POST", "/webhooks/flutterwave");
    expect(webhook.auth).toBe(false);
  });

  it("keeps the four header-only sockets marked deferred", () => {
    const deferred = all
      .filter((r) => r.status === "deferred")
      .map((r) => r.path)
      .sort();
    expect(deferred).toEqual([
      "/api/agent/socket",
      "/api/deliveries/{pid}/track",
      "/api/driver/socket",
      "/api/rides/{pid}/track",
    ]);
  });
});
