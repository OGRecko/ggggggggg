// @vitest-environment jsdom
/**
 * The real CodeMirror editor, mounted through the real app. `app.integration.test.tsx` replaces the
 * editor to sweep all 942 pages cheaply; this file is the counterweight that keeps the editor itself
 * honest: it mounts the real component, checks that the saved code is what the learner sees, and
 * asserts the HTML/CSS preview's sandbox boundary, which is the app's only place that renders
 * learner-authored markup.
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import App from "./App";
import { courseById } from "./courses/catalog";
import { clearProgress, defaultProgress, saveProgress } from "./utils/storage";

beforeEach(() => {
  clearProgress();
  window.scrollTo = (() => {}) as typeof window.scrollTo;
  window.history.pushState({}, "", "/");
});

afterEach(() => cleanup());

describe("the real editor and the preview boundary", () => {
  it("shows a learner's saved code in the CodeMirror editor", () => {
    const course = courseById("python")!;
    const chapter = course.chapters[0];
    const lesson = chapter.lessons[0];
    const saved = 'print("a saved line that only exists in storage")';
    saveProgress({ ...defaultProgress, code: { [lesson.id]: saved } });
    window.history.pushState({}, "", `/${course.id}/chapter-${chapter.number}/lesson-${lesson.order}`);

    const view = render(<App />);
    expect(view.container.querySelector(".cm-editor"), "the real CodeMirror editor should mount").toBeTruthy();
    expect(view.container.querySelector(".cm-content")?.textContent ?? "").toContain("a saved line that only exists in storage");
  });

  it("renders learner HTML/CSS only inside a sandboxed iframe, without same-origin access", async () => {
    const course = courseById("htmlcss")!;
    const chapter = course.chapters[0];
    const lesson = chapter.lessons[0];
    window.history.pushState({}, "", `/${course.id}/chapter-${chapter.number}/lesson-${lesson.order}`);

    const view = render(<App />);
    const frame = await screen.findByTitle("HTML and CSS preview");
    // The two properties that matter: scripts may run so the preview behaves like a page, and the
    // sandbox deliberately omits allow-same-origin, so the frame's document sits in an opaque origin
    // and cannot reach this app's storage, DOM, or cookies.
    expect(frame.getAttribute("sandbox")).toBe("allow-scripts");
    expect(frame.getAttribute("sandbox")).not.toContain("allow-same-origin");
    expect(frame.getAttribute("srcdoc")).toContain("<main");
    fireEvent.click(screen.getByRole("button", { name: /preview/i }));
    expect((await screen.findByTitle("HTML and CSS preview")).getAttribute("srcdoc")).toBeTruthy();
    expect(view.container.querySelector("iframe[src]"), "the preview must not point at a URL").toBeNull();
  });
});
