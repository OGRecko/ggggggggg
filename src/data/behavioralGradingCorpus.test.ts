import { describe, expect, it } from "vitest";
import type { Exercise } from "./types";
import { gradeExercise } from "../utils/behavioralGrader";
import { javascriptWorkerSource } from "../utils/javascriptRunner";
import type { RunResult } from "../utils/pythonRunner";

/** Execute the shipped JavaScript Worker source with host APIs explicitly blocked, as in the runtime evidence suite. */
async function runInSandbox(code: string, input?: string): Promise<RunResult> {
  const messages: Array<RunResult & { id: number }> = [];
  const fakeSelf = {
    postMessage: (message: typeof messages[number]) => messages.push(message),
  } as {
    postMessage: (message: typeof messages[number]) => void;
    onmessage?: (event: { data: { id: number; code: string; input?: string } }) => Promise<void>;
    eval?: unknown;
    Function?: unknown;
  };
  const evaluate = new Function(
    "self", "setTimeout", "clearTimeout", "setInterval", "clearInterval", "Promise",
    "fetch", "XMLHttpRequest", "WebSocket", "EventSource", "Worker", "SharedWorker",
    "importScripts", "postMessage", "close", "Function", javascriptWorkerSource,
  );
  const blocked = () => { throw new Error("blocked by this test harness"); };
  evaluate(fakeSelf, setTimeout, clearTimeout, setInterval, clearInterval, Promise,
    blocked, blocked, blocked, blocked, blocked, blocked, blocked, blocked, blocked, Function);
  await fakeSelf.onmessage!({ data: { id: 1, code, ...(input === undefined ? {} : { input }) } });
  const message = messages[messages.length - 1];
  if (!message) return { output: "", error: "JavaScript Worker returned no result.", failureKind: "runtime" };
  const { id, ...response } = message;
  void id;
  return { ...response, output: response.output ?? "" };
}

const corpusExercise: Exercise = {
  prompt: "Write classifyCount(text): low for 0–33, standard for 34–66, high for 67–100, and invalid for blank, non-numeric, or out-of-range values.",
  starterCode: "function classifyCount(text) { return \"low\"; }",
  solution: [
    "function classifyCount(text) {",
    "  const count = Number(text);",
    "  if (text.trim() === \"\" || !Number.isFinite(count) || count < 0 || count > 100) return \"invalid\";",
    "  if (count <= 33) return \"low\";",
    "  if (count <= 66) return \"standard\";",
    "  return \"high\";",
    "}",
  ].join("\n"),
  solutionExplanation: "The function validates input and uses inclusive ranges.",
  hints: ["Parse the text once.", "Reject blank and non-finite input.", "Use ordered inclusive upper bounds.", "Check exact boundaries and invalid values."],
  testCases: [
    { label: "Visible sample", input: "10", expected: "low", append: "console.log(classifyCount(readLine()));" },
    { label: "Lower bound", hidden: true, input: "0", expected: "low", append: "console.log(classifyCount(readLine()));" },
    { label: "Last low value", hidden: true, input: "33", expected: "low", append: "console.log(classifyCount(readLine()));" },
    { label: "First standard value", hidden: true, input: "34", expected: "standard", append: "console.log(classifyCount(readLine()));" },
    { label: "Last standard value", hidden: true, input: "66", expected: "standard", append: "console.log(classifyCount(readLine()));" },
    { label: "First high value", hidden: true, input: "67", expected: "high", append: "console.log(classifyCount(readLine()));" },
    { label: "Upper bound", hidden: true, input: "100", expected: "high", append: "console.log(classifyCount(readLine()));" },
    { label: "Out of range", hidden: true, input: "101", expected: "invalid", append: "console.log(classifyCount(readLine()));" },
    { label: "Blank input", hidden: true, input: "", expected: "invalid", append: "console.log(classifyCount(readLine()));" },
    { label: "Non-numeric input", hidden: true, input: "nope", expected: "invalid", append: "console.log(classifyCount(readLine()));" },
  ],
};

const alternativeReference = [
  "const classifyCount = (text) => {",
  "  const trimmed = text.trim();",
  "  const value = Number(trimmed);",
  "  if (trimmed === \"\" || !Number.isFinite(value) || value < 0 || value > 100) return \"invalid\";",
  "  return value < 34 ? \"low\" : value < 67 ? \"standard\" : \"high\";",
  "};",
].join("\n");

const hardcodedTranscriptCheat = [
  'console.log("low");',
  'console.log("low");',
  'console.log("low");',
  'console.log("standard");',
  'console.log("standard");',
  'console.log("high");',
  'console.log("high");',
  'console.log("invalid");',
  'console.log("invalid");',
  'console.log("invalid");',
].join("\n");

const runCorpus = (code: string) => gradeExercise(corpusExercise, code, (source, input) => runInSandbox(source, input));

describe("behavioral grading corpus: real JavaScript Worker", () => {
  it("fails the incomplete starter on hidden inputs", async () => {
    const grade = await runCorpus(corpusExercise.starterCode);
    expect(grade.passed).toBe(false);
    expect(grade.hasHiddenCases).toBe(true);
    expect(grade.failure?.testCase.hidden).toBe(true);
    expect(grade.failure?.testCase.label).toBe("First standard value");
  });

  it("passes the authored reference implementation on every behavioral case", async () => {
    const grade = await runCorpus(corpusExercise.solution);
    expect(grade.passed).toBe(true);
    expect(grade.hiddenCaseCount).toBe(9);
    expect(grade.outcomes).toHaveLength(10);
    expect(grade.outcomes.every((outcome) => outcome.passed)).toBe(true);
  });

  it("accepts an alternative implementation with different syntax and branching", async () => {
    const grade = await runCorpus(alternativeReference);
    expect(grade.passed).toBe(true);
    expect(grade.outcomes.every((outcome) => outcome.passed)).toBe(true);
  });

  it("rejects a hardcoded output transcript when hidden tests probe behavior", async () => {
    const grade = await runCorpus(hardcodedTranscriptCheat);
    expect(grade.passed).toBe(false);
    expect(grade.failure?.testCase.hidden).toBe(true);
    expect(grade.failure?.actual).toMatch(/ReferenceError|Thrown error/);
  });

  it("returns appended hidden state through the shipped Worker without writing it to stdout", async () => {
    const stateExercise: Exercise = {
      ...corpusExercise,
      testCases: [{
        label: "Hidden state after increment",
        hidden: true,
        kind: "state",
        input: "2",
        expected: "{\"count\":2}",
        append: "state.count += Number(readLine()); __codeforgeReportState({ count: state.count });",
      }],
    };
    const grade = await gradeExercise(stateExercise, "const state = { count: 0 };", (source, input) => runInSandbox(source, input));
    expect(grade.passed).toBe(true);
    expect(grade.outcomes[0].rawOutput).toBe("");
    expect(grade.outcomes[0].rawState).toEqual({ count: 2 });
  });

  it("matches expected throws from the shipped Worker without showing the appended check", async () => {
    const throwExercise: Exercise = {
      ...corpusExercise,
      testCases: [{
        label: "Blank input is rejected",
        hidden: true,
        kind: "throws",
        input: "",
        expected: "empty count",
        append: "if (readLine().trim() === '') throw new RangeError('empty count');",
      }],
    };
    const grade = await gradeExercise(throwExercise, "function validateCount() { return true; }", (source, input) => runInSandbox(source, input));
    expect(grade.passed).toBe(true);
    expect(grade.failure).toBeUndefined();
  });
});
