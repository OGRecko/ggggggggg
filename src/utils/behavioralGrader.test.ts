import { describe, expect, it, vi } from "vitest";
import type { Exercise, TestCase } from "../data/types";
import type { RunResult } from "./pythonRunner";
import { classifyExecutionError, formatCaseFailure, gradeExercise, normalizeOutput } from "./behavioralGrader";

const exercise = (testCases: TestCase[]): Exercise => ({
  prompt: "Implement a checked behavior.",
  starterCode: "",
  solution: "reference implementation is intentionally not part of learner feedback",
  solutionExplanation: "",
  testCases,
  hints: ["first", "second", "third", "fourth"],
});

const result = (output: string, extra: Partial<RunResult> = {}): RunResult => ({ output, ...extra });

describe("behavioral grading", () => {
  it("normalizes line endings and trailing whitespace without erasing meaningful output", () => {
    expect(normalizeOutput("  first  \r\nsecond\t\r\n\n")).toBe("first\nsecond");
    expect(normalizeOutput("0")).not.toBe(normalizeOutput("false"));
  });

  it("uses hidden behavioral cases as the gate and keeps visible-example failures as feedback", async () => {
    const current = exercise([
      { label: "Visible sample", expected: "5" },
      { label: "Hidden zero edge", input: "0", expected: "0", hidden: true },
      { label: "Hidden negative edge", input: "-2", expected: "-2", hidden: true },
    ]);
    const runCase = vi.fn(async (_source: string, input?: string) => input === undefined
      ? result("the user's visible sample is not quite right")
      : result(input));

    const grade = await gradeExercise(current, "candidate source", runCase);
    expect(grade).toMatchObject({ passed: true, hasHiddenCases: true, hiddenCaseCount: 2 });
    expect(grade.failure).toBeUndefined();
    expect(grade.outcomes.map((outcome) => outcome.passed)).toEqual([false, true, true]);
    expect(runCase.mock.calls.map((call) => call[1])).toEqual([undefined, "0", "-2"]);
  });

  it("reports the first hidden failure with its label, input, expected and actual, but no answer or appended test", async () => {
    const current = exercise([
      { label: "Hidden negative case", hidden: true, input: "-9", expected: "negative", append: "console.log(secretExpectedAnswer)" },
    ]);
    const grade = await gradeExercise(current, "learner implementation", async (source, input) => {
      expect(source).toBe("learner implementation\nconsole.log(secretExpectedAnswer)");
      expect(input).toBe("-9");
      return result("positive");
    });

    expect(grade.passed).toBe(false);
    expect(grade.failure).toBeDefined();
    const report = formatCaseFailure(grade.failure!);
    expect(report).toContain("Hidden test 1 failed: Hidden negative case (LOGIC ERROR)");
    expect(report).toContain('Input: "-9"');
    expect(report).toContain('Expected: "negative"');
    expect(report).toContain('Actual: "positive"');
    expect(report).not.toContain("learner implementation");
    expect(report).not.toContain("secretExpectedAnswer");
    expect(report).not.toContain(current.solution);
  });

  it("withholds hidden runner error details that may echo appended test code", async () => {
    const appendedCheck = "console.log(secretExpectedAnswer)";
    const current = exercise([{ label: "Hidden runner error", hidden: true, expected: "ready", append: appendedCheck }]);
    const grade = await gradeExercise(current, "learner code", async () => result("", {
      error: `Traceback:
  File "<string>", line 2
    ${appendedCheck}
ReferenceError: secretExpectedAnswer is not defined`,
      failureKind: "runtime",
    }));

    const report = formatCaseFailure(grade.failure!);
    expect(report).toContain("RUNTIME ERROR");
    expect(report).toContain('Expected: "ready"');
    expect(report).toContain("Actual: Thrown error: error details withheld for hidden-test privacy");
    expect(report).not.toContain(appendedCheck);
    expect(report).not.toContain("secretExpectedAnswer");
  });

  it("does not let a visible failure hide a later hidden failure", async () => {
    const current = exercise([
      { label: "Visible example", expected: "shown" },
      { label: "Hidden contract", hidden: true, input: "x", expected: "right" },
      { label: "Unreached hidden case", hidden: true, input: "y", expected: "right" },
    ]);
    const runCase = vi.fn(async () => result("wrong"));
    const grade = await gradeExercise(current, "source", runCase);
    expect(grade.passed).toBe(false);
    expect(grade.failure?.testCase.label).toBe("Hidden contract");
    expect(runCase).toHaveBeenCalledTimes(2);
  });

  it("compares structured state separately from stdout and ignores object key order", async () => {
    const current = exercise([
      { label: "State after update", kind: "state", expected: "{\"enabled\":false,\"count\":2}", append: "__codeforgeReportState(state)" },
    ]);
    const sourceCode = "const state = { count: 2, enabled: false };";
    const grade = await gradeExercise(current, sourceCode, async (source) => {
      expect(source).toBe(`${sourceCode}\n__codeforgeReportState(state)`);
      return result("count=2; enabled=false", { state: { count: 2, enabled: false }, stateCaptured: true });
    });
    expect(grade.passed).toBe(true);
    expect(grade.outcomes[0].rawState).toEqual({ count: 2, enabled: false });

    const transcriptOnly = await gradeExercise(current, sourceCode, async () => result("count=2; enabled=false"));
    expect(transcriptOnly.passed).toBe(false);
    expect(transcriptOnly.failure?.actual).toBe("No structured state was returned by the Worker.");

    const mismatch = await gradeExercise(exercise([
      { label: "Canonical mismatch", kind: "state", expected: "{\"z\":2,\"a\":1}" },
    ]), sourceCode, async () => result("", { state: { z: 3, a: 1 }, stateCaptured: true }));
    expect(mismatch.failure?.expected).toBe('structured state {"a":1,"z":2}');
    expect(mismatch.failure?.actual).toBe('{"a":1,"z":3}');

    const invalidExpectation = await gradeExercise(exercise([
      { label: "Invalid expected JSON", kind: "state", expected: "not JSON" },
    ]), sourceCode, async () => result("", { state: { a: 1 }, stateCaptured: true }));
    expect(invalidExpectation.failure?.expected).toBe('invalid structured state expectation "not JSON"');
    expect(invalidExpectation.failure?.failureKind).toBe("test-failure");

    const incompatibleState = await gradeExercise(exercise([
      { label: "Non-JSON actual state", kind: "state", expected: "1" },
    ]), sourceCode, async () => result("", { state: 1n, stateCaptured: true }));
    expect(incompatibleState.failure?.actual).toBe("The Worker returned state that was not JSON-compatible.");
  });

  it("matches an expected throw by message without treating a timeout or truncated output as success", async () => {
    const expectedThrow = exercise([{ label: "Reject empty input", kind: "throws", expected: "empty input" }]);
    await expect(gradeExercise(expectedThrow, "", async () => result("", { error: "RangeError: empty input" }))).resolves.toMatchObject({ passed: true });
    await expect(gradeExercise(expectedThrow, "", async () => result("", { error: "deadline: empty input", timedOut: true, failureKind: "timeout" }))).resolves.toMatchObject({ passed: false, failure: { failureKind: "timeout" } });
    await expect(gradeExercise(expectedThrow, "", async () => result("", { error: "RangeError: empty input", outputTruncated: true }))).resolves.toMatchObject({ passed: false, failure: { failureKind: "limit" } });
  });

  it("passes per-case timeouts through and formats timeout as a distinct outcome", async () => {
    const current = exercise([{ label: "Hidden deadline", hidden: true, timeoutMs: 80, expected: "ready" }]);
    let requestedTimeout: number | undefined;
    const grade = await gradeExercise(current, "source", async (_source, _input, timeoutMs) => {
      requestedTimeout = timeoutMs;
      return result("", { error: "runner deadline reached", timedOut: true, failureKind: "timeout" });
    });
    expect(requestedTimeout).toBe(80);
    expect(grade.failure?.failureKind).toBe("timeout");
    expect(formatCaseFailure(grade.failure!)).toContain("Hidden test 1 failed: Hidden deadline (TIMEOUT)");
    expect(formatCaseFailure(grade.failure!)).toContain("Timed out: error details withheld for hidden-test privacy");
  });

  it("does not highlight a line that belongs only to hidden appended test code", async () => {
    const current = exercise([
      { label: "Hidden append", hidden: true, expected: "ok", append: "triggerFailure()" },
    ]);
    const grade = await gradeExercise(current, "const ready = true;", async () => result("", { error: "ReferenceError: triggerFailure is not defined", errorLine: 4 }));
    expect(grade.failure?.errorLine).toBeUndefined();
  });

  it.each([
    ["SyntaxError: invalid", "syntax"],
    ["TypeError: invalid", "type"],
    ["Compilation failed", "compile"],
    ["Uncaught exception", "runtime"],
  ] as const)("classifies %s as %s when runner metadata is absent", (message, expected) => {
    expect(classifyExecutionError(result("", { error: message }))).toBe(expected);
  });

  it("prefers runner-reported timeout and resource-limit categories over generic messages", () => {
    expect(classifyExecutionError(result("", { error: "stopped", timedOut: true }))).toBe("timeout");
    expect(classifyExecutionError(result("", { error: "capped", failureKind: "limit" }))).toBe("limit");
  });
});
