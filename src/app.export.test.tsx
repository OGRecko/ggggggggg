// @vitest-environment jsdom
/**
 * Export surface coverage.
 *
 * The export page is mounted in the real `<App />` and builds a real jsPDF document from the real
 * curriculum plus the learner's stored progress. Nothing here is mocked: vitest resolves jsPDF's
 * Node build (the package's "browser" field only redirects bundlers), and that build's save()
 * writes the finished file to the process working directory instead of triggering a download.
 * So the assertions below read the exact bytes of the file the app asked jsPDF to write. In the
 * browser bundle the same document goes through jsPDF's anchor/object-URL download shim, which is
 * the code path present in `dist/index.html` (no `fs`, no `eval`).
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { existsSync, readFileSync, rmSync } from "node:fs";
import { resolve } from "node:path";
import App from "./App";
import { courseById } from "./courses/catalog";
import { clearProgress, defaultProgress, saveProgress } from "./utils/storage";

const COURSE_PDF = "codeforge-python-course-study-guide.pdf";
const LESSON_PDF = "codeforge-javascript-lesson-study-guide.pdf";

describe("CodeForge export surface", () => {
  beforeEach(() => {
    clearProgress();
    for (const name of [COURSE_PDF, LESSON_PDF]) rmSync(resolve(name), { force: true });
  });

  afterEach(() => {
    cleanup();
    for (const name of [COURSE_PDF, LESSON_PDF]) rmSync(resolve(name), { force: true });
  });

  const read = (name: string) => {
    const bytes = new Uint8Array(readFileSync(resolve(name)));
    return { bytes, raw: new TextDecoder("latin1").decode(bytes) };
  };

  it("turns stored progress into a real course PDF from the export page", async () => {
    const course = courseById("python")!;
    const lesson = course.chapters[0].lessons[0];
    const savedCode = 'print("kept from the editor")';
    saveProgress({
      ...defaultProgress,
      code: { [lesson.id]: savedCode },
      completedExercises: [lesson.id],
      testScores: { [`${course.id}-chapter-1-test`]: 3 },
    });
    window.history.pushState({}, "", "/export");

    const view = render(<App />);
    fireEvent.click(screen.getByRole("button", { name: /generate pdf/i }));
    await screen.findByText(/study guide has downloaded/i);
    await waitFor(() => expect(existsSync(resolve(COURSE_PDF)), "the press writes the named file").toBe(true));

    const { bytes, raw } = read(COURSE_PDF);
    expect(new TextDecoder().decode(bytes.slice(0, 8)), "a PDF file starts with its version header").toBe("%PDF-1.3");
    expect(bytes.length, "a whole-course guide is a substantial document").toBeGreaterThan(100_000);
    const pages = raw.match(/\/Type \/Page[^s]/g)?.length ?? 0;
    expect(pages, "a 25-chapter course needs many pages").toBeGreaterThan(5);
    expect(raw).toContain("CodeForge");
    expect(raw, "the learner's saved code travels into the guide").toContain("kept from the editor");
    expect(raw, "recorded chapter scores are included").toContain("score: 3/3");
    expect(view.container.textContent).toContain("study guide has downloaded");
  });

  it("exports one lesson when that scope is chosen", async () => {
    window.history.pushState({}, "", "/export");
    render(<App />);
    const course = courseById("javascript")!;
    const chapter = course.chapters[0];
    const lesson = chapter.lessons[0];

    // The header also carries a language switcher, so target the export form's own label.
    fireEvent.change(screen.getByLabelText(/^Language/, { selector: "select" }), { target: { value: "javascript" } });
    fireEvent.click(screen.getByRole("radio", { name: /one lesson/i }));
    fireEvent.change(screen.getByLabelText(/^chapter/i), { target: { value: String(chapter.number) } });
    fireEvent.change(screen.getByLabelText(/^lesson/i), { target: { value: lesson.id } });
    fireEvent.click(screen.getByRole("button", { name: /generate pdf/i }));
    await screen.findByText(/study guide has downloaded/i);
    await waitFor(() => expect(existsSync(resolve(LESSON_PDF))).toBe(true));

    const { raw } = read(LESSON_PDF);
    expect(raw).toContain("JavaScript study guide");
    expect(raw, "one lesson only, so the next chapter is absent").not.toContain(`Chapter ${chapter.number + 1}:`);
  });
});
