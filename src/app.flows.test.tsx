// @vitest-environment jsdom
/**
 * Chapter, practice-detail and page-level flows.
 *
 * `app.integration.test.tsx` covers the shell (routing, the lesson gate, grading, the Worker
 * protocol, settings). This file covers the rest of what a learner meets on a lesson or chapter
 * page, again by mounting the real `<App />` in jsdom:
 *   - the chapter gate that keeps the project and test closed until every lesson has passed,
 *   - the chapter test's scoring and its stored score,
 *   - the chapter project's success path and the `projectComplete` record,
 *   - the reading check's prediction feedback,
 *   - hints, the reference-solution reveal, and Reset,
 *   - the "Export this lesson PDF" hand-off through sessionStorage into a pre-filled export page,
 *   - the header language switcher and the mobile navigation toggle,
 *   - the progress page's own numbers,
 *   - and a corrupted progress store, which must degrade to defaults instead of breaking boot.
 *
 * Where a lesson declares an answer (a reading check's `correctIndex`, a test question's
 * `correctIndex`, a lesson's own hints and starter code), the assertions read that declaration from
 * the curriculum data rather than repeating it, so the test cannot drift from the content it checks.
 */
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import App from "./App";
import { courseById, courses } from "./courses/catalog";
import { coverageAudit } from "./data/coverageAudit";
import { clearProgress, defaultProgress, loadProgress, saveProgress } from "./utils/storage";
import type { Course, LanguageId, Lesson } from "./data/types";

const route = (path: string) => window.history.pushState({}, "", path);

const allLessons = (course: Course) => course.chapters.flatMap((chapter) => chapter.lessons);

/** Completes every lesson before `target` (or all of `course` when no target is given). */
function seedThrough(courseId: LanguageId, targetLessonId?: string, code: Record<string, string> = {}) {
  const course = courseById(courseId)!;
  const completed: string[] = [];
  for (const lesson of allLessons(course)) {
    if (lesson.id === targetLessonId) break;
    completed.push(lesson.id);
  }
  saveProgress({ ...defaultProgress, completedExercises: completed, code: { ...code } });
  return course;
}

beforeAll(() => {
  window.scrollTo = (() => {}) as typeof window.scrollTo;
});

beforeEach(() => {
  clearProgress();
  sessionStorage.clear();
  route("/");
});

afterEach(() => {
  cleanup();
});

describe("chapter flow", () => {
  const course = courseById("htmlcss")!;
  const chapter = course.chapters[0];
  const projectId = `${course.id}-chapter-${chapter.number}-project`;

  it("keeps the project and test closed until every lesson has passed", () => {
    route(`/${course.id}/chapter-${chapter.number}`);
    const view = render(<App />);

    expect(view.container.textContent).toContain("Finish the lessons to open the chapter project and test");
    expect(view.container.textContent, "the count is the chapter's own lesson count").toContain(`You have 0 of ${chapter.lessons.length} complete`);
    expect(view.container.querySelector(".chapter-test"), "no test before the practice is done").toBeNull();
    expect(view.container.querySelector(".project-brief")).toBeNull();

    cleanup();
    saveProgress({ ...defaultProgress, completedExercises: chapter.lessons.map((lesson) => lesson.id) });
    const open = render(<App />);
    expect(open.container.textContent).toContain("Check your understanding");
    expect(open.container.querySelector(".project-brief"), "the project brief opens with the chapter").not.toBeNull();
    expect(open.container.textContent).not.toContain("Finish the lessons to open");
  });

  it("scores the chapter test, explains every question, and stores the score", async () => {
    saveProgress({ ...defaultProgress, completedExercises: chapter.lessons.map((lesson) => lesson.id) });
    route(`/${course.id}/chapter-${chapter.number}`);
    const view = render(<App />);

    const test = chapter.test!;
    const section = view.container.querySelector(".chapter-test") as HTMLElement;
    expect(section, "the chapter declares a test").not.toBeNull();
    const groups = within(section).getAllByRole("group");
    expect(groups.length, "one fieldset per question").toBe(test.length);

    const submit = within(section).getByRole("button", { name: /submit test/i });
    expect((submit as HTMLButtonElement).disabled, "submitting an empty test is blocked").toBe(true);

    test.forEach((question, index) => {
      const choices = within(groups[index]).getAllByRole("radio");
      fireEvent.click(choices[question.correctIndex]);
    });
    expect((submit as HTMLButtonElement).disabled, "the test opens once every question is answered").toBe(false);

    fireEvent.click(submit);
    await waitFor(() => expect(within(section).getByText(new RegExp(`Your latest score: ${test.length}/${test.length}`))).toBeTruthy());
    expect(section.querySelectorAll(".test-explanation").length, "each question shows its explanation").toBe(test.length);
    expect(loadProgress().testScores[`${course.id}-chapter-${chapter.number}-test`]).toBe(test.length);
  });

  it("records a passing chapter project in projectComplete", async () => {
    const project = chapter.project!;
    saveProgress({
      ...defaultProgress,
      completedExercises: chapter.lessons.map((lesson) => lesson.id),
      code: { [projectId]: project.solution },
    });
    route(`/${course.id}/chapter-${chapter.number}`);
    const view = render(<App />);

    fireEvent.click(within(view.container as HTMLElement).getByRole("button", { name: /check answer/i }));
    await waitFor(() => expect(loadProgress().projectComplete, "the project is recorded").toContain(projectId));
    expect(view.container.querySelector(".completed-mark")?.textContent?.trim()).toBe("Passed");
  });
});

describe("practice details", () => {
  const python = courseById("python")!;
  const firstLesson = python.chapters[0].lessons[0];

  it("walks the hint ladder, reveals the reference solution, and resets to the starter", async () => {
    route(`/${python.id}/chapter-${firstLesson.chapter}/lesson-${firstLesson.order}`);
    const view = render(<App />);
    const hints = firstLesson.exercise.hints;

    for (let shown = 1; shown <= hints.length; shown += 1) {
      fireEvent.click(screen.getByRole("button", { name: new RegExp(`unlock hint ${shown}`, "i") }));
      const label = `${shown} of ${hints.length} hint${hints.length === 1 ? "" : "s"} shown`;
      expect(view.container.textContent, `the hint counter reads "${label}"`).toContain(label);
    }
    const list = view.container.querySelector(".hints-list") as HTMLElement;
    expect(within(list).getAllByRole("listitem").length).toBe(hints.length);
    expect(screen.queryByRole("button", { name: /unlock hint/i }), "no more hints remain").toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /show answer/i }));
    expect(view.container.textContent, "the reference solution is revealed").toContain(firstLesson.exercise.solution.split("\n")[0]);
    expect(screen.getByRole("button", { name: /hide answer/i })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /reset/i }));
    expect(loadProgress().code[firstLesson.id], "Reset stores the starter code").toBe(firstLesson.exercise.starterCode);
  });

  it("answers the reading check and says why, for both a wrong and a right prediction", () => {
    // Every course has lessons with an explicit reading check; the test works from the data.
    const host = courses
      .map((candidate) => ({ course: candidate, lesson: allLessons(candidate).find((lesson) => lesson.readingCheck) }))
      .find((entry): entry is { course: Course; lesson: Lesson } => Boolean(entry.lesson))!;
    const { course, lesson } = host;
    const check = lesson.readingCheck!;

    seedThrough(course.id, lesson.id);
    route(`/${course.id}/chapter-${lesson.chapter}/lesson-${lesson.order}`);
    const view = render(<App />);

    const section = view.container.querySelector(".reading-check") as HTMLElement;
    expect(section, `${lesson.id} renders its reading check`).not.toBeNull();
    const radios = within(section).getAllByRole("radio");
    expect(radios.length, "one radio per declared choice").toBe(check.choices.length);
    const submit = within(section).getByRole("button", { name: /check prediction/i });
    expect((submit as HTMLButtonElement).disabled, "predicting nothing is blocked").toBe(true);

    const wrongIndex = (check.correctIndex + 1) % check.choices.length;
    fireEvent.click(radios[wrongIndex]);
    fireEvent.click(submit);
    expect(section.textContent).toContain("Not quite.");
    expect(section.textContent, "the explanation is shown either way").toContain(check.explanation);

    // Changing the answer re-evaluates the same question without a reload.
    fireEvent.click(radios[check.correctIndex]);
    expect(section.textContent).toContain("Correct.");
  });
});

describe("lesson content", () => {
  const host = (() => {
    for (const course of courses) {
      for (const lesson of allLessons(course)) {
        if (lesson.examples.length >= 2 && lesson.examples.every((example) => example.lines.length > 0 && example.mistakes.length > 0) && lesson.decisionGuide?.length) {
          return { course, lesson };
        }
      }
    }
    throw new Error("no lesson with examples, line notes, mistakes and a decision guide");
  })();

  it("renders the authored explanation blocks of a lesson", () => {
    const { course, lesson } = host;
    seedThrough(course.id, lesson.id);
    route(`/${course.id}/chapter-${lesson.chapter}/lesson-${lesson.order}`);
    const view = render(<App />);

    for (const goal of lesson.learningGoals) expect(view.container.textContent, `goal "${goal}"`).toContain(goal);
    for (const [index, example] of lesson.examples.entries()) {
      expect(view.container.textContent, `example ${index + 1} title`).toContain(example.title);
      expect(view.container.textContent, `example ${index + 1} declared output`).toContain(example.output);
      for (const line of example.lines) expect(view.container.textContent, `example ${index + 1} line note`).toContain(line);
      for (const mistake of example.mistakes) {
        expect(view.container.textContent, `example ${index + 1} mistake "${mistake.mistake}"`).toContain(mistake.mistake);
        expect(view.container.textContent, `example ${index + 1} fix for "${mistake.mistake}"`).toContain(mistake.fix);
      }
    }
    for (const choice of lesson.decisionGuide!) {
      expect(view.container.textContent, `decision guide use "${choice.use}"`).toContain(`Use: ${choice.use}`);
      expect(view.container.textContent, `decision guide alternative`).toContain(`Instead of: ${choice.insteadOf}`);
    }
    for (const point of lesson.recap) expect(view.container.textContent, `recap point`).toContain(point);
    for (const note of lesson.keywordNotes) expect(view.container.textContent, `keyword note`).toContain(note);
  });
});

describe("page surfaces", () => {
  it("pre-fills the export page from a lesson's export button", async () => {
    const course = courseById("python")!;
    const chapter = course.chapters[0];
    const lesson = chapter.lessons[0];
    seedThrough(course.id, lesson.id);
    route(`/${course.id}/chapter-${chapter.number}/lesson-${lesson.order}`);
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /export this lesson pdf/i }));
    await waitFor(() => expect(window.location.pathname).toBe("/export"));

    expect((screen.getByRole("radio", { name: /one lesson/i }) as HTMLInputElement).checked, "the scope follows the button").toBe(true);
    const language = screen.getByLabelText(/^Language/, { selector: "select" }) as HTMLSelectElement;
    const chapterSelect = screen.getByLabelText(/^Chapter/, { selector: "select" }) as HTMLSelectElement;
    const lessonSelect = screen.getByLabelText(/^Lesson/, { selector: "select" }) as HTMLSelectElement;
    expect(language.value).toBe(course.id);
    expect(chapterSelect.value).toBe(String(chapter.number));
    expect(lessonSelect.value).toBe(lesson.id);
    expect(sessionStorage.getItem("codeforge-export-preference"), "the hand-off is consumed once").toBeNull();
  });

  it("switches language from the header and toggles the mobile navigation", () => {
    const view = render(<App />);
    const nav = view.container.querySelector("nav.top-nav") as HTMLElement;

    expect(nav.className).not.toContain("is-open");
    fireEvent.click(screen.getByRole("button", { name: /toggle navigation/i }));
    expect(nav.className, "the toggle opens the navigation").toContain("is-open");
    fireEvent.click(screen.getByRole("button", { name: /toggle navigation/i }));
    expect(nav.className).not.toContain("is-open");

    fireEvent.change(screen.getByLabelText(/switch language/i, { selector: "select" }), { target: { value: "java" } });
    expect(window.location.pathname, "the switcher routes to the chosen course").toBe("/java");
    expect(view.container.textContent).toContain("Java");
  });

  it("reports the progress page's numbers from the stored record", () => {
    const python = courseById("python")!;
    const completed = allLessons(python).slice(0, 3).map((lesson) => lesson.id);
    saveProgress({
      ...defaultProgress,
      completedExercises: completed,
      testScores: { "python-chapter-1-test": 2 },
    });
    route("/progress");
    const view = render(<App />);

    const totalLessons = courses.reduce((sum, candidate) => sum + allLessons(candidate).length, 0);
    const overall = Math.round((completed.length / totalLessons) * 100);
    expect(view.container.textContent).toContain(`${completed.length} lesson exercises passed, 1 chapter or checkpoint tests taken`);
    expect(view.container.querySelector(".overall-progress b")?.textContent, "the headline percentage is recomputed here").toBe(`${overall}%`);

    const pythonLive = allLessons(python).length;
    const row = view.container.querySelector(`.progress-table a[href="/${python.id}"]`) as HTMLElement;
    expect(within(row).getByText(`${completed.length} / ${pythonLive} live exercises passed`)).toBeTruthy();
    expect(row.querySelector(".mini-progress b")?.textContent, "the course row's own percentage").toBe(`${Math.round((completed.length / pythonLive) * 100)}%`);
    const untouched = view.container.querySelector('.progress-table a[href="/cpp"]') as HTMLElement;
    expect(within(untouched).getByText(`0 / ${allLessons(courseById("cpp")!).length} live exercises passed`)).toBeTruthy();
  });

  it("navigates from every header link and closes the mobile menu on a jump", () => {
    const view = render(<App />);
    const nav = view.container.querySelector("nav.top-nav") as HTMLElement;
    fireEvent.click(screen.getByRole("button", { name: /toggle navigation/i }));
    expect(nav.className).toContain("is-open");

    const destinations: Array<[RegExp, string, string]> = [
      [/^my progress$/i, "/progress", "My progress"],
      [/^coverage audit$/i, "/audit", "Coverage audit"],
      [/^export pdf$/i, "/export", "Export PDF"],
      [/^settings$/i, "/settings", "Preferences"],
      [/^home$/i, "/", "How learning works"],
    ];
    for (const [name, path, marker] of destinations) {
      fireEvent.click(within(nav).getByRole("link", { name }));
      expect(window.location.pathname, `header link ${String(name)} navigates`).toBe(path);
      expect(view.container.textContent, `header link ${String(name)} renders its page`).toContain(marker);
      expect(nav.className, "a jump closes the menu").not.toContain("is-open");
    }

    // Clicking a link for the page you are already on is a no-op, not an error.
    fireEvent.click(within(nav).getByRole("link", { name: /^home$/i }));
    expect(window.location.pathname).toBe("/");
    fireEvent.click(screen.getByRole("link", { name: /codeforge home/i }));
    expect(window.location.pathname, "the brand behaves the same way").toBe("/");
  });

  it("answers an unknown course path with the 404 page", () => {
    route("/ruby");
    const view = render(<App />);
    expect(view.container.textContent).toContain("That learning path is not here");
    expect(view.container.textContent, "no half-built course shell").not.toContain("Course progress");
  });

  it("offers the finish-chapter link on the course's final lesson", () => {
    // Lessons form one course-wide sequence, so "Next" continues into the next chapter; the
    // "Finish chapter" link belongs to the final lesson of the last chapter.
    const pythonCourse = courseById("python")!;
    const chapter = pythonCourse.chapters[pythonCourse.chapters.length - 1];
    const last = chapter.lessons[chapter.lessons.length - 1];
    const before = allLessons(pythonCourse).slice(0, -1).map((lesson) => lesson.id);
    saveProgress({ ...defaultProgress, completedExercises: before });
    route(`/${pythonCourse.id}/chapter-${chapter.number}/lesson-${last.order}`);
    const view = render(<App />);

    expect(view.container.textContent, "the last lesson closes the course").toContain("Finish chapter");
    expect(screen.queryByRole("button", { name: /^next:/i }), "there is no next lesson to offer").toBeNull();
    expect(view.container.textContent, "and it can go back").toContain(`Previous: ${chapter.lessons[chapter.lessons.length - 2].title}`);
    fireEvent.click(screen.getByRole("link", { name: /finish chapter/i }));
    expect(window.location.pathname).toBe(`/${pythonCourse.id}/chapter-${chapter.number}`);
  });

  it("routes the chapter page's export button to a pre-filled chapter export", async () => {
    const pythonCourse = courseById("python")!;
    const chapter = pythonCourse.chapters[1];
    route(`/${pythonCourse.id}/chapter-${chapter.number}`);
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /export this chapter pdf/i }));
    await waitFor(() => expect(window.location.pathname).toBe("/export"));
    expect((screen.getByRole("radio", { name: /one chapter/i }) as HTMLInputElement).checked).toBe(true);
    expect((screen.getByLabelText(/^Chapter/, { selector: "select" }) as HTMLSelectElement).value).toBe(String(chapter.number));
  });

  it("switches the home action to review once the whole course is complete", () => {
    const pythonCourse = courseById("python")!;
    saveProgress({ ...defaultProgress, completedExercises: allLessons(pythonCourse).map((lesson) => lesson.id) });
    route("/");
    const view = render(<App />);

    expect(view.container.textContent, "the next-action card reports completion").toContain("Python course complete");
    const review = screen.getByRole("link", { name: /review python/i });
    expect(review.getAttribute("href")).toBe(`/${pythonCourse.id}`);
    fireEvent.click(review);
    expect(window.location.pathname).toBe(`/${pythonCourse.id}`);
  });

  it("boots on defaults when the stored record is corrupted", () => {
    localStorage.setItem("codeforge-progress-v2", "{ this is not json");
    const view = render(<App />);

    expect(view.container.textContent).toContain("CodeForge");
    expect(loadProgress().completedExercises, "the damaged record is discarded, not thrown").toEqual([]);
    expect(loadProgress().settings.theme).toBe(defaultProgress.settings.theme);
  });
});

describe("course surfaces", () => {
  const python = courseById("python")!;
  const lessons = allLessons(python);
  const pathFor = (lesson: Lesson) => `/${python.id}/chapter-${lesson.chapter}/lesson-${lesson.order}`;

  it("points the home action at the next unfinished lesson", () => {
    route("/");
    render(<App />);
    const start = screen.getByRole("link", { name: /start python/i });
    expect(start.getAttribute("href"), "a fresh learner starts at step one").toBe(pathFor(lessons[0]));
    fireEvent.click(start);
    expect(window.location.pathname, "the home action opens that lesson").toBe(pathFor(lessons[0]));

    cleanup();
    route("/");
    saveProgress({ ...defaultProgress, completedExercises: [lessons[0].id] });
    render(<App />);
    const resume = screen.getByRole("link", { name: /continue python/i });
    expect(resume.getAttribute("href"), "a returning learner resumes at the next step").toBe(pathFor(lessons[1]));
  });

  it("lists every chapter on the course page with the practiced counts", () => {
    route(`/${python.id}`);
    const view = render(<App />);

    expect(view.container.textContent).toContain(`25 chapters, ${lessons.length} lessons, one step at a time.`);
    expect(view.container.textContent, "the masthead counts the same corpus").toContain(`0 of ${lessons.length} lessons practiced`);

    const rows = view.container.querySelectorAll(".chapter-row");
    expect(rows.length, "one row per chapter").toBe(python.chapters.length);
    expect(view.container.querySelectorAll(".chapter-row.is-planned").length, "every chapter is authored").toBe(0);
    expect(rows[0].textContent).toContain(`0/${python.chapters[0].lessons.length} practiced`);

    fireEvent.click(rows[0] as HTMLElement);
    expect(window.location.pathname, "a chapter row opens its chapter").toBe(`/${python.id}/chapter-1`);
  });

  it("opens an unlocked lesson row and ignores a locked one", () => {
    const chapter = python.chapters[0];
    route(`/${python.id}/chapter-${chapter.number}`);
    const view = render(<App />);

    const rows = view.container.querySelectorAll(".lesson-row");
    expect(rows.length, "one row per lesson").toBe(chapter.lessons.length);
    expect(rows[0].className, "the first lesson is open").not.toContain("locked");
    expect(rows[1].className, "the second lesson waits for the first").toContain("locked");

    fireEvent.click(rows[1] as HTMLElement);
    expect(window.location.pathname, "a locked row does not navigate").toBe(`/${python.id}/chapter-${chapter.number}`);
    fireEvent.click(rows[0] as HTMLElement);
    expect(window.location.pathname).toBe(pathFor(chapter.lessons[0]));
  });

  it("scores the cumulative checkpoint under its own key", async () => {
    const chapter = python.chapters.find((candidate) => candidate.cumulativeTest)!;
    const cumulative = chapter.cumulativeTest!;
    saveProgress({ ...defaultProgress, completedExercises: chapter.lessons.map((lesson) => lesson.id) });
    route(`/${python.id}/chapter-${chapter.number}`);
    const view = render(<App />);

    const sections = Array.from(view.container.querySelectorAll<HTMLElement>(".chapter-test"));
    expect(sections.length, "a milestone chapter shows its test and its checkpoint").toBe(2);
    const section = sections.find((candidate) => candidate.textContent?.includes("Cumulative checkpoint"))!;
    expect(section, `chapter ${chapter.number} renders the checkpoint`).toBeTruthy();
    expect(section.textContent).toContain(`Chapters 1-${chapter.number}`);

    const groups = within(section).getAllByRole("group");
    expect(groups.length).toBe(cumulative.length);
    cumulative.forEach((question, index) => {
      fireEvent.click(within(groups[index]).getAllByRole("radio")[question.correctIndex]);
    });
    fireEvent.click(within(section).getByRole("button", { name: /submit test/i }));

    const key = `${python.id}-chapter-${chapter.number}-cumulative`;
    await waitFor(() => expect(loadProgress().testScores[key]).toBe(cumulative.length));
    expect(loadProgress().testScores[`${python.id}-chapter-${chapter.number}-test`], "the chapter test keeps its own key").toBeUndefined();
  });

  it("renders the coverage audit's own statuses, including the Java and C++ limits", () => {
    route("/audit");
    const view = render(<App />);

    const languages = Object.entries(coverageAudit);
    const sections = Array.from(view.container.querySelectorAll<HTMLElement>(".audit-language"));
    expect(sections.length, "one section per language").toBe(languages.length);

    const allowed = new Set(["COMPLETE", "PARTIAL", "MISSING"]);
    const statuses = Array.from(view.container.querySelectorAll(".audit-status")).map((node) => node.textContent?.trim() ?? "");
    expect(statuses.length, "one status per row").toBe(languages.reduce((sum, [, rows]) => sum + rows.length, 0));
    expect(statuses.filter((status) => !allowed.has(status)), "only declared statuses are shown").toEqual([]);

    // The page must not upgrade a course the corpus rule keeps below COMPLETE.
    for (const language of ["Java", "C++"]) {
      const section = sections.find((candidate) => candidate.querySelector("h2")?.textContent === language)!;
      expect(section, `${language} has its own audit section`).toBeTruthy();
      expect(section.querySelectorAll(".audit-status.complete").length, `${language} is not shown as COMPLETE`).toBe(0);
    }
    expect(view.container.textContent).toContain("A chapter title, URL, or editor is never counted as full education by itself.");
  });
});
