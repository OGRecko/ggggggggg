import type { Exercise, TestCase } from "../data/types";
import type { RunFailureKind, RunResult } from "./pythonRunner";

export type CaseRunner = (source: string, input?: string, timeoutMs?: number) => Promise<RunResult>;

export type CaseOutcome = {
  testCase: TestCase;
  hiddenIndex?: number;
  passed: boolean;
  expected: string;
  actual: string;
  rawOutput: string;
  failureKind?: RunFailureKind;
  errorLine?: number;
};

export type BehavioralGrade = {
  passed: boolean;
  hasHiddenCases: boolean;
  hiddenCaseCount: number;
  outcomes: CaseOutcome[];
  failure?: CaseOutcome;
};

export function normalizeOutput(value: string) {
  return value.replace(/\r/g, "").split("\n").map((line) => line.trimEnd()).join("\n").trim();
}

export function classifyExecutionError(result: RunResult): RunFailureKind {
  if (result.timedOut || result.failureKind === "timeout") return "timeout";
  if (result.failureKind) return result.failureKind;
  const message = result.error ?? "";
  if (/SyntaxError|IndentationError|TabError/i.test(message)) return "syntax";
  if (/TypeError/i.test(message)) return "type";
  if (/CompileError|CompilationError|Compilation failed|compile error/i.test(message)) return "compile";
  if (/too large|output limit|input limit|resource limit|truncated/i.test(message)) return "limit";
  return "runtime";
}

function thrownFailureMatches(expected: string, actualError: string) {
  const needle = normalizeOutput(expected).toLowerCase();
  return needle.length > 0 && normalizeOutput(actualError).toLowerCase().includes(needle);
}

function expectedText(testCase: TestCase) {
  return testCase.kind === "throws" ? `an error containing ${JSON.stringify(testCase.expected)}` : JSON.stringify(testCase.expected);
}

function actualText(result: RunResult, testCase: TestCase) {
  const truncation = result.outputTruncated ? " Output also exceeded the runner limit." : "";
  if (result.error) {
    const kind = result.failureKind ?? classifyExecutionError(result);
    const prefix = kind === "syntax" ? "Syntax error" : kind === "type" ? "Type error" : kind === "timeout" ? "Timed out" : "Thrown error";
    const detail = testCase.hidden ? "error details withheld for hidden-test privacy" : result.error;
    return `${prefix}: ${detail}${truncation}`;
  }
  if (testCase.kind === "throws") return `No error was thrown; output was ${JSON.stringify(result.output)}${truncation}`;
  if (result.outputTruncated) return `Output exceeded the runner limit: ${JSON.stringify(result.output)}`;
  return JSON.stringify(result.output);
}

const failureLabels: Record<RunFailureKind, string> = {
  syntax: "SYNTAX ERROR",
  type: "TYPE ERROR",
  compile: "COMPILE ERROR",
  runtime: "RUNTIME ERROR",
  logic: "LOGIC ERROR",
  "test-failure": "TEST FAILURE",
  timeout: "TIMEOUT",
  limit: "RESOURCE LIMIT",
};

export function formatCaseFailure(outcome: CaseOutcome) {
  const { testCase } = outcome;
  const category = failureLabels[outcome.failureKind ?? "test-failure"];
  const prefix = testCase.hidden
    ? `Hidden test ${outcome.hiddenIndex ?? "?"} failed: ${testCase.label} (${category})`
    : `${category} on ${testCase.label}`;
  const input = testCase.input === undefined ? "(no input)" : JSON.stringify(testCase.input);
  return `${prefix}\nInput: ${input}\nExpected: ${outcome.expected}\nActual: ${outcome.actual}${outcome.errorLine ? `\nThe runner reported line ${outcome.errorLine}.` : ""}`;
}

function evaluate(testCase: TestCase, result: RunResult, hiddenIndex?: number): CaseOutcome {
  const kind = testCase.kind ?? "output";
  let passed = false;
  let failureKind: RunFailureKind | undefined;

  if (kind === "throws") {
    passed = !result.timedOut && !result.outputTruncated && Boolean(result.error) && thrownFailureMatches(testCase.expected, result.error ?? "");
    if (!passed) failureKind = result.timedOut ? "timeout" : result.outputTruncated ? "limit" : "test-failure";
  } else if (result.timedOut) {
    failureKind = "timeout";
  } else if (result.outputTruncated) {
    failureKind = "limit";
  } else if (result.error) {
    failureKind = classifyExecutionError(result);
  } else {
    passed = normalizeOutput(result.output) === normalizeOutput(testCase.expected);
    if (!passed) failureKind = "logic";
  }

  return {
    testCase,
    hiddenIndex,
    passed,
    expected: expectedText(testCase),
    actual: actualText(result, testCase),
    rawOutput: result.output,
    failureKind,
    errorLine: result.errorLine,
  };
}

/**
 * Run every visible teaching example and the first failing grading case. If hidden cases exist,
 * only they determine completion; visible cases still produce learner-facing feedback.
 */
export async function gradeExercise(exercise: Exercise, code: string, runCase: CaseRunner): Promise<BehavioralGrade> {
  const hiddenCases = exercise.testCases.filter((testCase) => testCase.hidden);
  const hasHiddenCases = hiddenCases.length > 0;
  const outcomes: CaseOutcome[] = [];
  let hiddenIndex = 0;
  let failure: CaseOutcome | undefined;

  for (const testCase of exercise.testCases) {
    const hidden = Boolean(testCase.hidden);
    const caseCode = testCase.append ? `${code}\n${testCase.append}` : code;
    const result = await runCase(caseCode, testCase.input, testCase.timeoutMs);
    const outcome = evaluate(testCase, result, hidden ? ++hiddenIndex : undefined);
    if (testCase.append && outcome.errorLine && outcome.errorLine > code.split("\\n").length) outcome.errorLine = undefined;
    outcomes.push(outcome);

    if (!outcome.passed) {
      if (hidden) {
        failure ??= outcome;
        break;
      }
      if (!hasHiddenCases) {
        failure = outcome;
        break;
      }
      // A visible example is teaching feedback, not the grade gate when hidden behavior exists.
    }
  }

  return {
    passed: !failure,
    hasHiddenCases,
    hiddenCaseCount: hiddenCases.length,
    outcomes,
    failure,
  };
}
