// @vitest-environment jsdom
/**
 * The messages the app shows for each practice outcome, and the records it writes.
 *
 * `app.integration.test.tsx` proves the Worker *protocol* (what the app posts and that the console
 * shows what came back). This file drives the branches that follow: a syntax error, a runtime error,
 * a wrong answer on a named test case, and the on-device structure path that must not claim
 * execution. The worker is a labelled stub speaking the shipped message format, exactly as in the
 * integration file; the real runner sources keep their own evidence in `pythonRunner.test.ts` and
 * `javascriptRunner.test.ts`. Every expected string is read from the lesson data or from the
 * behaviour observed, never invented.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import App from "./App";
import { courseById, courses } from "./courses/catalog";
import { clearProgress, defaultProgress, loadProgress, saveProgress } from "./utils/storage";
import type { Course, LanguageId, Lesson } from "./data/types";

const allLessons = (course: Course) => course.chapters.flatMap((chapter) => chapter.lessons);
const route = (path: string) => window.history.pushState({}, "", path);

/** Completes every lesson before `target`, which is what a learner's store looks like by then. */
function seedThrough(courseId: LanguageId, targetLessonId: string) {
  const course = courseById(courseId)!;
  const completed: string[] = [];
  for (const lesson of allLessons(course)) {
    if (lesson.id === targetLessonId) break;
    completed.push(lesson.id);
  }
  saveProgress({ ...defaultProgress, completedExercises: completed });
  return course;
}

const firstLessonWith = (predicate: (lesson: Lesson) => boolean) => {
  for (const course of courses) {
    for (const lesson of allLessons(course)) if (predicate(lesson)) return { course, lesson };
  }
  throw new Error("no lesson matches");
};

const sent: Array<Record<string, unknown>> = [];
let answer: (message: { id: number; code: string; input?: string }) => Record<string, unknown>;

class FakeWorker {
  private listeners: Array<(event: MessageEvent) => void> = [];
  constructor(_url: string) {}
  addEventListener(type: string, listener: (event: MessageEvent) => void) {
    if (type === "message") this.listeners.push(listener);
  }
  removeEventListener(type: string, listener: (event: MessageEvent) => void) {
    if (type === "message") this.listeners = this.listeners.filter((candidate) => candidate !== listener);
  }
  postMessage(message: { id: number; code: string; input?: string }) {
    sent.push(message as unknown as Record<string, unknown>);
    const data = { ...answer(message), id: message.id };
    setTimeout(() => this.listeners.slice().forEach((listener) => listener({ data } as MessageEvent)), 0);
  }
  terminate() {}
}

beforeEach(() => {
  clearProgress();
  route("/");
  sent.length = 0;
  answer = () => ({ output: "" });
  vi.stubGlobal("Worker", FakeWorker as unknown as typeof Worker);
  vi.stubGlobal("URL", Object.assign(Object.create(URL), URL, { createObjectURL: () => "blob:audit", revokeObjectURL: () => {} }));
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

/** The first sandboxed Python lesson, which is where a worker outcome can be exercised. */
const sandboxed = firstLessonWith((lesson) => lesson.id.startsWith("python-"));
const pathFor = (course: Course, lesson: Lesson) => `/${course.id}/chapter-${lesson.chapter}/lesson-${lesson.order}`;

const openLesson = (course: Course, lesson: Lesson) => {
  seedThrough(course.id, lesson.id);
  route(pathFor(course, lesson));
  return render(<App />);
};

/**
 * The feedback banner only. Lesson prose legitimately contains words like "SyntaxError" in its
 * common-mistakes blocks, so waiting on the whole document would match the teaching text instead
 * of the app's own verdict.
 */
const feedbackText = (view: { container: HTMLElement }) => view.container.querySelector(".check-feedback")?.textContent ?? "";
const waitForFeedback = (view: { container: HTMLElement }, pattern: RegExp) =>
  waitFor(() => expect(feedbackText(view), "the practice feedback banner").toMatch(pattern));

describe("practice outcomes", () => {
  it("reports a syntax error from the sandbox and refuses to unlock the lesson", async () => {
    answer = () => ({ output: "", error: "SyntaxError: invalid syntax (line 2)", errorLine: 2 });
    const view = openLesson(sandboxed.course, sandboxed.lesson);

    fireEvent.click(screen.getByRole("button", { name: /^run$/i }));
    await waitForFeedback(view, /SYNTAX ERROR/);
    expect(feedbackText(view), "the sandbox's own error text is shown verbatim").toContain("SyntaxError: invalid syntax (line 2)");
    expect(loadProgress().completedExercises, "a broken run never unlocks the next step").not.toContain(sandboxed.lesson.id);
  });

  it("marks the line the sandbox blamed, on both Run and Check", async () => {
    // A lesson whose starter has several lines, so the marker has a real line to land on.
    const host = firstLessonWith((lesson) => lesson.id.startsWith("python-") && lesson.exercise.starterCode.split("\n").length >= 3);
    const expectedLine = host.lesson.exercise.starterCode.split("\n")[1].trim();
    answer = () => ({ output: "", error: "ValueError: invalid literal for int() with base 10: 'x'", errorLine: 2 });
    const view = openLesson(host.course, host.lesson);

    fireEvent.click(screen.getByRole("button", { name: /^run$/i }));
    await waitForFeedback(view, /RUNTIME ERROR/);
    expect(feedbackText(view), "the sandbox's own error text is shown").toContain("invalid literal for int()");

    // The editor marks the blamed line with its own class; a failed Check adds the instruction.
    await waitFor(() => expect(document.querySelector(".cm-error-line"), `line 2 (${expectedLine}) is marked`).not.toBeNull());
    expect(document.querySelector(".cm-error-line")?.textContent?.trim(), "the marked line is the one the sandbox named").toBe(expectedLine);

    fireEvent.click(screen.getByRole("button", { name: /check answer/i }));
    await waitForFeedback(view, /Fix the highlighted line and try again/);
    expect(feedbackText(view)).toContain("RUNTIME ERROR:");
  });

  it("names the failing test case and both texts when the output is wrong", async () => {
    const lesson = firstLessonWith((candidate) => candidate.exercise.testCases.length > 0 && !candidate.exercise.checker).lesson;
    const course = seedThrough(lesson.id.split("-")[0] as LanguageId, lesson.id);
    // Every case answers with the wrong text, so the app stops on the first one.
    answer = () => ({ output: "definitely not the expected output" });
    route(pathFor(course, lesson));
    const view = render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /check answer/i }));
    await waitForFeedback(view, /LOGIC ERROR/);
    const first = lesson.exercise.testCases[0];
    const text = feedbackText(view);
    expect(text, `the failing case is named: ${first.label}`).toContain(`LOGIC ERROR on ${first.label}`);
    expect(text).toContain(`Expected ${JSON.stringify(first.expected)}`);
    expect(text).toContain(`but received ${JSON.stringify("definitely not the expected output")}`);
    expect(text).toContain("Review highlighted line");
    expect(loadProgress().completedExercises).not.toContain(lesson.id);
  });

  it("stops after the first wrong case instead of reporting success", async () => {
    const lesson = firstLessonWith((candidate) => candidate.exercise.testCases.length > 1 && !candidate.exercise.checker).lesson;
    const course = seedThrough(lesson.id.split("-")[0] as LanguageId, lesson.id);
    let call = 0;
    answer = () => {
      call += 1;
      // The first case is right, the second is wrong: the run must stop there.
      return { output: call === 1 ? (lesson.exercise.testCases[0].expected ?? "") : "wrong" };
    };
    route(pathFor(course, lesson));
    const view = render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /check answer/i }));
    await waitForFeedback(view, /LOGIC ERROR/);
    expect(call, "the app stops at the first failing case").toBe(2);
    expect(feedbackText(view)).toContain(`LOGIC ERROR on ${lesson.exercise.testCases[1].label}`);
    expect(loadProgress().completedExercises).not.toContain(lesson.id);
  });

  it("passes an on-device structure review without claiming execution", async () => {
    const host = firstLessonWith((lesson) => Boolean(lesson.exercise.checker) && lesson.kind === "build");
    const course = host.course;
    const chapter = course.chapters.find((candidate) => candidate.number === host.lesson.chapter)!;
    // A build lesson's own solution is the learner's correct answer.
    seedThrough(course.id, host.lesson.id);
    saveProgress({
      ...loadProgress(),
      code: { [host.lesson.id]: host.lesson.exercise.solution },
    });
    route(pathFor(course, host.lesson));
    const view = render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /check answer/i }));
    await screen.findByText(/nice work/i);
    expect(view.container.textContent, "the pass says exactly what was checked").toContain("This is not a compiler or runtime execution result");
    expect(sent, "no worker is started for a structure-checked exercise").toEqual([]);
    expect(loadProgress().completedExercises).toContain(host.lesson.id);
    expect(chapter.number, "the exercised lesson really is a build lesson").toBeGreaterThan(0);
  });

  it("sends JavaScript through the same protocol, with no input field", async () => {
    const host = firstLessonWith((lesson) => lesson.id.startsWith("javascript-"));
    answer = () => ({ output: "Hello from the sandbox" });
    openLesson(host.course, host.lesson);

    fireEvent.click(screen.getByRole("button", { name: /^run$/i }));
    await screen.findByText(/hello from the sandbox/i);
    expect(sent.length, "the JS run posts exactly one message").toBe(1);
    expect(Object.keys(sent[0]).sort(), "JavaScript runs carry no input field").toEqual(["code", "id"]);
  });

  it("records a lesson as viewed on mount and practiced when the practice is touched", async () => {
    const view = openLesson(sandboxed.course, sandboxed.lesson);
    await waitFor(() => expect(loadProgress().lessonStates[sandboxed.lesson.id]?.viewed, "opening a lesson records the view").toBe(true));
    expect(loadProgress().lessonStates[sandboxed.lesson.id]?.practiced ?? false, "viewing alone is not practice").toBe(false);

    fireEvent.click(screen.getByRole("button", { name: /reset/i }));
    await waitFor(() => expect(loadProgress().lessonStates[sandboxed.lesson.id]?.practiced, "touching the practice records it").toBe(true));
    expect(loadProgress().code[sandboxed.lesson.id], "Reset stores the starter code").toBe(sandboxed.lesson.exercise.starterCode);
    expect(view.container.textContent).toContain(sandboxed.lesson.title);
  });
});
