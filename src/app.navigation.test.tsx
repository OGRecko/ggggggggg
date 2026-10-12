// @vitest-environment jsdom
/**
 * Every navigation affordance the app offers.
 *
 * The other app files check what each page does; this one walks the controls that move a learner
 * between pages, so a link that stops working is caught by a test rather than by a reader. It exists
 * because a coverage run showed these specific handlers — the header theme button, the home course
 * cards, the course overview's back, next and export controls, the sidebar's course, chapter and
 * lesson links, the lesson page's eyebrow, previous/next buttons and its locked-page escape, the
 * chapter page's back link, the progress rows, the settings font and spacing choices, and the 404
 * return button — had never been exercised.
 *
 * Every assertion reads a page marker that the destination itself owns, so a link that silently
 * failed to navigate cannot pass.
 */
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import App from "./App";
import { courseById } from "./courses/catalog";
import { clearProgress, defaultProgress, saveProgress } from "./utils/storage";
import type { Course, Lesson } from "./data/types";

const allLessons = (course: Course) => course.chapters.flatMap((chapter) => chapter.lessons);
const pathFor = (course: Course, lesson: Lesson) => `/${course.id}/chapter-${lesson.chapter}/lesson-${lesson.order}`;

/** Mounts the app at `path` and returns the rendered view. */
function visit(path: string) {
  cleanup();
  window.history.pushState({}, "", path);
  return render(<App />);
}

beforeAll(() => {
  window.scrollTo = (() => {}) as typeof window.scrollTo;
});

beforeEach(() => {
  clearProgress();
  sessionStorage.clear();
});

afterEach(() => cleanup());

describe("navigation affordances", () => {
  const python = courseById("python")!;

  it("toggles the color theme from the header button", () => {
    const view = visit("/");
    const toggle = screen.getByRole("button", { name: /toggle color theme/i });
    expect(document.documentElement.dataset.theme).toBe("light");
    fireEvent.click(toggle);
    expect(document.documentElement.dataset.theme, "the header button switches the theme").toBe("dark");
    fireEvent.click(toggle);
    expect(document.documentElement.dataset.theme, "and switches it back").toBe("light");
    expect(view.container.textContent).toContain("CodeForge");
  });

  it("opens a course from the home page cards", () => {
    const view = visit("/");
    const card = view.container.querySelector(`.language-card[href="/${python.id}"]`) as HTMLElement;
    expect(card, "the home page lists a card for each course").not.toBeNull();
    fireEvent.click(card);
    expect(window.location.pathname).toBe(`/${python.id}`);
  });

  it("walks the course overview's own controls", () => {
    const firstLesson = python.chapters[0].lessons[0];

    // Next: continues at the first unfinished step.
    visit(`/${python.id}`);
    fireEvent.click(screen.getByRole("link", { name: /^next:/i }));
    expect(window.location.pathname, "the course's next-step link opens that lesson").toBe(pathFor(python, firstLesson));

    visit(`/${python.id}`);
    fireEvent.click(screen.getByRole("link", { name: /all courses/i }));
    expect(window.location.pathname, "the back link returns to the catalogue").toBe("/");

    const view = visit(`/${python.id}`);
    expect(view.container.textContent, "the overview renders the course map").toContain("Course map");
    fireEvent.click(screen.getByRole("button", { name: /export course pdf/i }));
    expect(window.location.pathname, "the export button opens the export page").toBe("/export");
    expect((screen.getByRole("radio", { name: new RegExp(`whole ${python.name} course`, "i") }) as HTMLInputElement).checked).toBe(true);
  });

  it("follows the sidebar's course, chapter and lesson links, and refuses locked ones", () => {
    const chapter = python.chapters[0];
    const first = chapter.lessons[0];
    const second = chapter.lessons[1];

    const view = visit(pathFor(python, first));
    const sidebar = view.container.querySelector(".course-sidebar") as HTMLElement;
    expect(sidebar, "lesson pages carry the course sidebar").not.toBeNull();

    fireEvent.click(sidebar.querySelector(".sidebar-course-link") as HTMLElement);
    expect(window.location.pathname, "the sidebar course link opens the overview").toBe(`/${python.id}`);

    const chapterView = visit(pathFor(python, first));
    const chapterLink = (chapterView.container.querySelector(`.sidebar-chapter a[href="/${python.id}/chapter-${chapter.number}"]`) as HTMLElement);
    expect(chapterLink, `chapter ${chapter.number} has a sidebar link`).not.toBeNull();
    fireEvent.click(chapterLink);
    expect(window.location.pathname, "the sidebar chapter link opens the chapter").toBe(`/${python.id}/chapter-${chapter.number}`);

    const lessonView = visit(pathFor(python, first));
    // The sidebar navigates the whole course, so it lists every lesson of every chapter.
    const lessons = lessonView.container.querySelectorAll(".sidebar-lesson");
    expect(lessons.length, "the sidebar lists the course's lessons").toBe(allLessons(python).length);
    const linkTo = (lesson: Lesson) => lessonView.container.querySelector(`.sidebar-lesson[href="${pathFor(python, lesson)}"]`) as HTMLElement | null;
    expect(linkTo(second)?.className, `the not-yet-passed lesson ${second.id} is marked locked`).toContain("locked");
    fireEvent.click(linkTo(second)!);
    expect(window.location.pathname, "a locked sidebar lesson does not open").toBe(pathFor(python, first));
    fireEvent.click(linkTo(first)!);
    expect(window.location.pathname, "the current lesson's own link is a no-op").toBe(pathFor(python, first));
    expect(lessonView.container.querySelector(".sidebar-lesson.active"), "the sidebar marks where the learner is").not.toBeNull();
  });

  it("uses the lesson page's eyebrow, previous and next controls, and its locked-page escape", () => {
    const chapter = python.chapters[0];
    const first = chapter.lessons[0];
    const second = chapter.lessons[1];

    visit(pathFor(python, first));
    fireEvent.click(screen.getByRole("link", { name: new RegExp(`chapter ${chapter.number}:`, "i") }));
    expect(window.location.pathname, "the eyebrow returns to the chapter").toBe(`/${python.id}/chapter-${chapter.number}`);

    // From the second lesson: Previous exists and works, Next waits for its own practice.
    saveProgress({ ...defaultProgress, completedExercises: [first.id] });
    visit(pathFor(python, second));
    fireEvent.click(screen.getByRole("button", { name: /^next:/i }));
    expect(window.location.pathname, "Next is disabled until this practice passes").toBe(pathFor(python, second));
    fireEvent.click(screen.getByRole("button", { name: /^previous:/i }));
    expect(window.location.pathname, "Previous returns to the lesson that was passed").toBe(pathFor(python, first));

    // Once the practice is passed, the same Next button moves on.
    saveProgress({ ...defaultProgress, completedExercises: [first.id, second.id] });
    visit(pathFor(python, second));
    fireEvent.click(screen.getByRole("button", { name: /^next:/i }));
    expect(window.location.pathname, "a passed practice unlocks Next").toBe(pathFor(python, chapter.lessons[2]));

    // The locked view offers a way back to the lesson that has to pass first. Lesson three is locked
    // again once only the first practice is recorded.
    const third = chapter.lessons[2];
    saveProgress({ ...defaultProgress, completedExercises: [first.id] });
    const locked = visit(pathFor(python, third));
    expect(locked.container.textContent).toContain("Lesson locked");
    fireEvent.click(screen.getByRole("button", { name: /go to previous lesson/i }));
    expect(window.location.pathname).toBe(pathFor(python, second));
  });

  it("returns from the chapter page's back link and from the 404 page", () => {
    const chapter = python.chapters[0];
    visit(`/${python.id}/chapter-${chapter.number}`);
    fireEvent.click(screen.getByRole("link", { name: new RegExp(`${python.name} overview`, "i") }));
    expect(window.location.pathname).toBe(`/${python.id}`);

    visit("/nope");
    fireEvent.click(screen.getByRole("button", { name: /return home/i }));
    expect(window.location.pathname, "the 404 page has a way out").toBe("/");
  });

  it("opens a language row from the progress page", () => {
    visit("/progress");
    fireEvent.click(screen.getByRole("link", { name: new RegExp(python.name, "i") }));
    expect(window.location.pathname).toBe(`/${python.id}`);
  });

  it("applies the reading font and spacing choices from settings", () => {
    visit("/settings");
    fireEvent.click(screen.getByRole("button", { name: /dyslexia-friendly/i }));
    expect(document.documentElement.dataset.font, "the font choice reaches the document").toBe("dyslexia");
    fireEvent.click(screen.getByRole("button", { name: /^relaxed$/i }));
    expect(document.documentElement.dataset.spacing, "the spacing choice reaches the document").toBe("relaxed");
    expect(JSON.parse(localStorage.getItem("codeforge-progress-v2")!).settings).toMatchObject({ font: "dyslexia", spacing: "relaxed" });
  });

  it("records practice when the learner edits the chapter project", () => {
    // A project's own editor writes progress too; that path (an update that does not newly complete
    // the project) had never run until now.
    const chapter = python.chapters[1];
    saveProgress({ ...defaultProgress, completedExercises: chapter.lessons.map((lesson) => lesson.id) });
    const view = visit(`/${python.id}/chapter-${chapter.number}`);

    expect(view.container.querySelector(".project-brief"), "the project is open").not.toBeNull();
    // A chapter page's only editor is the project's (lessons are links here).
    const projectModule = view.container.querySelector(".practice-module.compact") as HTMLElement;
    expect(projectModule, "the project renders its own compact practice editor").not.toBeNull();
    fireEvent.click(within(projectModule).getByRole("button", { name: "Insert (" }));

    const stored = JSON.parse(localStorage.getItem("codeforge-progress-v2")!);
    const projectId = `${python.id}-chapter-${chapter.number}-project`;
    expect(stored.code[projectId], "the project editor stores what it inserts").toContain("(");
    expect(stored.projectComplete, "editing alone does not mark the project complete").not.toContain(projectId);
  });
});
