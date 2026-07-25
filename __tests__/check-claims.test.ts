import { describe, it, expect } from "vitest";
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

function runCheck(dirs: string[]): { code: number; out: string } {
  try {
    const out = execFileSync("bash", ["scripts/check-claims.sh", ...dirs], {
      encoding: "utf8",
    });
    return { code: 0, out };
  } catch (e: any) {
    return { code: e.status, out: `${e.stdout ?? ""}${e.stderr ?? ""}` };
  }
}

function fixtureDir(content?: string): string {
  const dir = mkdtempSync(join(tmpdir(), "claims-"));
  writeFileSync(join(dir, "page.tsx"), content ?? "export default () => <p>heavy goods</p>;");
  return dir;
}

describe("check-claims.sh", () => {
  it("passes on a clean directory", () => {
    const r = runCheck([fixtureDir()]);
    expect(r.code).toBe(0);
    expect(r.out).toContain("PASS");
  });

  it.each([
    "our DIM 225 divisor",
    "savings of $15M ARR",
    "2-day delivery",
    "guaranteed delivery window",
    "zero shrinkage promise",
    "80% off list rates",
  ])("fails and reports the hit for %s", (banned) => {
    const r = runCheck([fixtureDir(`<p>${banned}</p>`)]);
    expect(r.code).toBe(1);
    expect(r.out).toContain("page.tsx");
  });
});
