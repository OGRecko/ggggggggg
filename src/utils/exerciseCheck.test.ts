import { describe, expect, it } from "vitest";
import { checkRequiredPatterns } from "./exerciseCheck";

describe("exercise structure checking", () => {
  it("passes when required patterns are present", () => {
    const result = checkRequiredPatterns('class Main { System.out.println("ok"); }', { mode: "patterns", requiredPatterns: ["class\\s+Main", "System\\.out\\.println"] });
    expect(result.passed).toBe(true);
    expect(result.missing).toEqual([]);
  });

  it("fails when a required pattern is missing", () => {
    const result = checkRequiredPatterns('class Main { }', { mode: "patterns", requiredPatterns: ["System\\.out\\.println"] });
    expect(result.passed).toBe(false);
    expect(result.missing).toContain("System\\.out\\.println");
  });

  it("detects forbidden patterns", () => {
    const result = checkRequiredPatterns('System.out.prinln("oops");', { mode: "patterns", requiredPatterns: [], forbiddenPatterns: ["prinln"] });
    expect(result.passed).toBe(false);
    expect(result.forbidden).toContain("prinln");
  });

  it("reports invalid regex patterns instead of throwing", () => {
    const result = checkRequiredPatterns('console.log("ok")', { mode: "patterns", requiredPatterns: ["console("] });
    expect(result.passed).toBe(false);
    expect(result.invalidPatterns).toContain("console(");
  });

  it("reports empty patterns honestly", () => {
    const result = checkRequiredPatterns('console.log("ok")', { mode: "patterns", requiredPatterns: [""] });
    expect(result.passed).toBe(false);
    expect(result.emptyPatterns).toContain("");
  });

  it("reports an empty pattern inside an alternative group", () => {
    const result = checkRequiredPatterns('console.log("ok")', { mode: "patterns", requiredPatterns: [], requiredOneOf: [[""]] });
    expect(result.passed).toBe(false);
    expect(result.emptyPatterns).toContain("");
  });

  it("reports an empty alternative group as a missing requirement", () => {
    const result = checkRequiredPatterns('console.log("ok")', { mode: "patterns", requiredPatterns: [], requiredOneOf: [[]] });
    expect(result.passed).toBe(false);
    expect(result.emptyPatterns).toContain("<empty alternative group>");
    expect(result.missing).toContain("one valid alternative pattern");
  });

  it("reports an invalid regex inside an alternative group instead of throwing", () => {
    const result = checkRequiredPatterns('console.log("ok")', { mode: "patterns", requiredPatterns: [], requiredOneOf: [["console("]] });
    expect(result.passed).toBe(false);
    expect(result.invalidPatterns).toContain("console(");
  });

  it("reports empty and invalid forbidden patterns instead of throwing, and refuses to pass", () => {
    const result = checkRequiredPatterns('console.log("ok")', { mode: "patterns", requiredPatterns: ["console"], forbiddenPatterns: ["", "console("] });
    expect(result.emptyPatterns).toContain("");
    expect(result.invalidPatterns).toContain("console(");
    // A misconfigured list can never be graded as a pass: the learner must not be told a broken
    // check succeeded.
    expect(result.passed).toBe(false);
  });

  it("accepts one valid alternative from a requiredOneOf group", () => {
    const result = checkRequiredPatterns('const value = 1;', { mode: "patterns", requiredPatterns: [], requiredOneOf: [["let\\s+value", "const\\s+value"]] });
    expect(result.passed).toBe(true);
  });

  it("fails when no alternative pattern matches", () => {
    const result = checkRequiredPatterns('var value = 1;', { mode: "patterns", requiredPatterns: [], requiredOneOf: [["let\\s+value", "const\\s+value"]] });
    expect(result.passed).toBe(false);
    expect(result.missing[0]).toContain("one of:");
  });

  it("does not count comment-only matches as a passing structure check", () => {
    const result = checkRequiredPatterns('// console.log("fake")', { mode: "patterns", requiredPatterns: ["console\\.log"] });
    expect(result.passed).toBe(false);
  });

  it("keeps checker mode behavior explicit for html review", () => {
    const result = checkRequiredPatterns('<main><h1>Hi</h1></main>', { mode: "html", requiredPatterns: ["<main", "<h1"] });
    expect(result.passed).toBe(true);
  });
});
