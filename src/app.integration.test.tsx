// @vitest-environment jsdom
/**
 * App-level integration coverage.
 *
 * The other suites test the curriculum data, the checkers, the runners and storage in isolation.
 * This one drives the real `<App />` — the same component `src/main.tsx` mounts — in a jsdom
 * document, so the router, the sidebar, the lesson pages, the practice editor, the structure
 * checkers, the console and the progress store are exercised together the way a learner meets them.
 *
 * What is real here: the routing decisions, `checkRequiredPatterns` grading, the success and
 * failure messages, the keyboard shortcuts and `popstate` handling, the settings surface, and
 * `localStorage` persistence through the app's own `saveProgress`/`loadProgress`. The five
 * `app.sweep.<course>.test.tsx` files mount every chapter and lesson page of each course.
 *
 * What is not, and why:
 *   - The JavaScript and Python Worker *sandboxes*. jsdom has no Worker, so the tests that need one
 *     install a fake that speaks the shipped message protocol, labelled as a stub where it is used.
 *     The real Worker sources are executed for real by `pythonRunner.test.ts`,
 *     `javascriptRunner.test.ts` and `javascriptRuntime.test.ts`; nothing here replaces that
 *     evidence — it proves the app wires the protocol correctly (Run sends no input, Check answer
 *     sends the test case's input, and the sandbox output is what the console shows).
 * The CodeMirror editor is real in `app.editor.test.tsx` and in the five per-course sweep files
 * (`app.sweep.<course>.test.tsx`); nothing in this file depends on the editor's DOM, because every
 * grading assertion reads the exercise's stored code.
 */
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import App from "./App";
import { courseById, courses } from "./courses/catalog";
import { clearProgress, defaultProgress, loadProgress, saveProgress } from "./utils/storage";

const PYTHON_LESSON_WITH_INPUT = "python-2-2";

function route(path: string) {
  window.history.pushState({}, "", path);
  return path;
}

/**
 * Lessons unlock in order, and the router enforces it: a lesson whose earlier practice has not
 * passed renders the lock page instead of the exercise. Seeding progress through the lesson before
 * the target is what a learner's stored progress looks like by the time they reach it, and it is
 * also how the sweep below walks the corpus.
 */
function seedThrough(courseId: "python" | "java" | "javascript" | "cpp" | "htmlcss", targetLessonId: string, code: Record<string, string> = {}) {
  const course = courseById(courseId)!;
  const completed: string[] = [];
  for (const chapter of course.chapters) {
    for (const lesson of chapter.lessons) {
      if (lesson.id === targetLessonId) {
        saveProgress({ ...defaultProgress, completedExercises: [...completed], code: { ...code } });
        return lesson;
      }
      completed.push(lesson.id);
    }
  }
  throw new Error(`unknown lesson ${targetLessonId}`);
}

beforeAll(() => {
  // jsdom does not implement scrolling; the router calls it on navigation.
  window.scrollTo = (() => {}) as typeof window.scrollTo;
});

beforeEach(() => {
  clearProgress();
  route("/");
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("CodeForge app shell", () => {
  it("boots the home page with the five supported courses", () => {
    const view = render(<App />);
    const text = view.container.textContent ?? "";
    for (const course of courses) expect(text, course.name).toContain(course.name);
    expect(text).toContain("CodeForge");
  });

  it("withholds a lesson until the previous practice has passed", () => {
    const course = courseById("python")!;
    const chapter = course.chapters[0];
    const second = chapter.lessons[1];
    route(`/${course.id}/chapter-${chapter.number}/lesson-${second.order}`);
    const view = render(<App />);
    const text = view.container.textContent ?? "";
    expect(text).toContain("Lesson locked");
    expect(text).not.toContain(second.exercise.prompt.slice(0, 40));
  });

  it("grades a structure-checked exercise through the real checker and saves progress", async () => {
    const course = courseById("htmlcss")!;
    const chapter = course.chapters[0];
    const lesson = chapter.lessons.find((candidate) => candidate.id === "htmlcss-1-5")!;
    // Seed the editor the way a returning learner's saved work would arrive.
    seedThrough("htmlcss", lesson.id, { [lesson.id]: lesson.exercise.solution });

    route(`/${course.id}/chapter-${chapter.number}/lesson-${lesson.order}`);
    const view = render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /check answer/i }));
    await screen.findByText(/nice work/i);
    expect(loadProgress().completedExercises).toContain(lesson.id);
    // The header mark is the app's own record that this exercise is complete.
    expect(view.container.querySelector(".completed-mark")?.textContent?.trim()).toBe("Passed");
  });

  it("rejects a structure-checked exercise that is missing a required construct", async () => {
    const course = courseById("htmlcss")!;
    const chapter = course.chapters[0];
    const lesson = chapter.lessons.find((candidate) => candidate.id === "htmlcss-1-5")!;
    seedThrough("htmlcss", lesson.id, { [lesson.id]: lesson.exercise.starterCode });

    route(`/${course.id}/chapter-${chapter.number}/lesson-${lesson.order}`);
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /check answer/i }));
    await screen.findByText(/try again/i);
    expect(loadProgress().completedExercises).not.toContain(lesson.id);
  });

  it("states the no-compiler boundary when Run is pressed for Java", async () => {
    const course = courseById("java")!;
    const chapter = course.chapters[0];
    const lesson = chapter.lessons[0];
    route(`/${course.id}/chapter-${chapter.number}/lesson-${lesson.order}`);
    const view = render(<App />);

    // Java and C++ have no runnable sandbox, so their button explains the structural check instead.
    fireEvent.click(screen.getByRole("button", { name: /about checks/i }));
    await waitFor(() => expect(view.container.textContent).toMatch(/does not compile Java or C\+\+ in this browser/i));
  });

  it("sends no input for Run and the test case's input for Check answer, showing the sandbox output", async () => {
    // A fake Worker that speaks the shipped protocol: it records every message and answers with the
    // output the app should display. The real Worker is executed by the runner tests; this test is
    // about the app's wiring of the protocol, and it is labelled as a stub for that reason.
    const posted: Array<{ id: number; code: string; input: string }> = [];
    class FakeWorker {
      private listeners: Array<(event: MessageEvent) => void> = [];
      constructor(_url: string) {}
      addEventListener(type: string, listener: (event: MessageEvent) => void) {
        if (type === "message") this.listeners.push(listener);
      }
      removeEventListener(type: string, listener: (event: MessageEvent) => void) {
        if (type === "message") this.listeners = this.listeners.filter((candidate) => candidate !== listener);
      }
      postMessage(message: { id: number; code: string; input: string }) {
        posted.push(message);
        // Answer with the output the lesson declares for this input, so a Check that sends the wrong
        // input cannot pass: the comparison in the app is what decides success. Inputs the lesson
        // does not declare (for example the empty input Run sends) produce no output.
        const output = declared.get(message.input) ?? "";
        setTimeout(() => this.listeners.slice().forEach((listener) => listener({ data: { id: message.id, output } } as MessageEvent)), 0);
      }
      terminate() {}
    }
    vi.stubGlobal("Worker", FakeWorker as unknown as typeof Worker);
    vi.stubGlobal("URL", Object.assign(Object.create(URL), URL, { createObjectURL: () => "blob:audit", revokeObjectURL: () => {} }));

    const course = courseById("python")!;
    const chapter = course.chapters.find((candidate) => candidate.number === 2)!;
    const lesson = seedThrough("python", PYTHON_LESSON_WITH_INPUT);
    const declared = new Map(lesson.exercise.testCases.map((testCase) => [testCase.input, testCase.expected]));
    route(`/${course.id}/chapter-${chapter.number}/lesson-${lesson.order}`);
    const view = render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /^run$/i }));
    await waitFor(() => expect(posted.length).toBe(1));
    expect(posted[0].input, "Run must not invent input").toBe("");
    expect(posted[0].code).toContain("input(");
    // While a run is in flight the Check button reads "Checking...", so wait for the run to finish.
    await screen.findByText(/program finished with no output/i);

    fireEvent.click(screen.getByRole("button", { name: /check answer/i }));
    // The app checks every declared test case, in order, on the same worker protocol.
    await waitFor(() => expect(posted.length).toBe(1 + lesson.exercise.testCases.length));
    expect(posted.slice(1).map((message) => message.input)).toEqual(lesson.exercise.testCases.map((testCase) => testCase.input));
    expect(posted[1].input, "Check answer must send the test case's input").toBe(lesson.exercise.testCases[0].input);
    await screen.findByText(/nice work/i);
    // The output area shows the result the worker returned for the case it just ran.
    const lastCase = lesson.exercise.testCases[lesson.exercise.testCases.length - 1];
    await waitFor(() => expect(view.container.textContent).toContain(lastCase.expected));
  });

  it("routes with the keyboard shortcuts and re-reads the URL on popstate", async () => {
    const view = render(<App />);

    fireEvent.keyDown(window, { key: "p", altKey: true });
    expect(window.location.pathname, "Alt+P opens the progress page").toBe("/progress");
    expect(view.container.textContent).toContain("My progress");

    fireEvent.keyDown(window, { key: "s", altKey: true });
    expect(window.location.pathname, "Alt+S opens settings").toBe("/settings");
    expect(view.container.textContent).toContain("Preferences");

    fireEvent.keyDown(window, { key: "h", altKey: true });
    expect(window.location.pathname, "Alt+H returns home").toBe("/");
    expect(view.container.textContent, "the home page is mounted again").toContain("How learning works");

    // A plain key press must not navigate, and browser back/forward reaches the app as popstate.
    fireEvent.keyDown(window, { key: "p" });
    expect(window.location.pathname, "a bare P types, it does not navigate").toBe("/");
    window.history.pushState({}, "", "/progress");
    window.dispatchEvent(new PopStateEvent("popstate"));
    await waitFor(() => expect(view.container.textContent, "the app re-reads the URL it was given").toContain("My progress"));

    // An unknown path is answered with the app's own 404 page rather than a crash.
    window.history.pushState({}, "", "/python/chapter-999/lesson-9");
    window.dispatchEvent(new PopStateEvent("popstate"));
    await waitFor(() => expect(view.container.textContent, "an unknown route falls back to 404").toContain("That learning path is not here"));
  });

  it("persists settings and clears local data from the settings page", () => {
    window.history.pushState({}, "", "/settings");
    const view = render(<App />);

    expect(document.documentElement.dataset.scale, "the root element carries the saved scale").toBe("normal");
    fireEvent.click(screen.getByRole("button", { name: /extra large/i }));
    expect(document.documentElement.dataset.scale, "the choice reaches the document immediately").toBe("larger");
    expect(loadProgress().settings.textScale, "the choice survives a reload").toBe("larger");

    fireEvent.click(screen.getByRole("button", { name: /^dark$/i }));
    expect(loadProgress().settings.theme).toBe("dark");
    expect(document.documentElement.dataset.theme).toBe("dark");

    // Deleting asks for confirmation first, then returns the store to its defaults.
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    fireEvent.click(screen.getByRole("button", { name: /delete local data/i }));
    expect(confirm).toHaveBeenCalled();
    expect(loadProgress().settings.theme, "declining the prompt keeps the data").toBe("dark");
    confirm.mockReturnValue(true);
    fireEvent.click(screen.getByRole("button", { name: /delete local data/i }));
    expect(view.container.textContent).toContain("Local CodeForge data was removed");
    expect(loadProgress().settings.theme, "confirming resets stored settings").toBe("light");
    expect(loadProgress().completedExercises).toEqual([]);
    confirm.mockRestore();
  });
});
