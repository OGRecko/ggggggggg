import { useEffect, useRef, useState } from "react";
import { jsPDF } from "jspdf";
import {
  ArrowLeft, ArrowRight, Check, ChevronDown, ChevronRight, CircleHelp, Code2, Download,
  Home, Info, Moon, Play, RotateCcw, Sun, Terminal, Trash2, X,
} from "lucide-react";
import { CodeEditor } from "./components/CodeEditor";
import { courseById, courses } from "./courses/catalog";
import type { Chapter, Course, Exercise, LanguageId, Lesson, StoredProgress } from "./data/types";
import { PythonRunner, type RunResult } from "./utils/pythonRunner";
import { JavaScriptRunner } from "./utils/javascriptRunner";
import { clearProgress, defaultProgress, loadProgress, saveProgress } from "./utils/storage";
import { coverageAudit } from "./data/coverageAudit";
import { checkRequiredPatterns } from "./utils/exerciseCheck";
import { firstLessonId, lessonsForChapter, resolveExportTargets } from "./utils/exportTargets";

type Route = { page: "home" | "progress" | "settings" | "export" | "audit" | "course" | "chapter" | "lesson"; language?: string; chapter?: number; lesson?: number };
type CheckState = { kind: "idle" | "running" | "success" | "error"; message?: string };
type ExportPreference = { scope: "course" | "chapter" | "lesson"; language?: LanguageId; chapter?: number; lessonId?: string };

const normalizeOutput = (value: string) => value.replace(/\r/g, "").split("\n").map((line) => line.trimEnd()).join("\n").trim();

function readRoute(path: string): Route {
  const pieces = path.split("/").filter(Boolean);
  if (!pieces.length) return { page: "home" };
  if (pieces[0] === "progress") return { page: "progress" };
  if (pieces[0] === "settings") return { page: "settings" };
  if (pieces[0] === "export") return { page: "export" };
  if (pieces[0] === "audit") return { page: "audit" };
  const chapter = pieces[1]?.match(/^chapter-(\d+)$/);
  const lesson = pieces[2]?.match(/^lesson-(\d+)$/);
  if (chapter && lesson) return { page: "lesson", language: pieces[0], chapter: Number(chapter[1]), lesson: Number(lesson[1]) };
  if (chapter) return { page: "chapter", language: pieces[0], chapter: Number(chapter[1]) };
  return { page: "course", language: pieces[0] };
}

function navigate(path: string) {
  if (window.location.pathname === path) return;
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function queueExport(preference: ExportPreference) {
  sessionStorage.setItem("codeforge-export-preference", JSON.stringify(preference));
  navigate("/export");
}

function takeExportPreference(): ExportPreference | null {
  try {
    const raw = sessionStorage.getItem("codeforge-export-preference");
    sessionStorage.removeItem("codeforge-export-preference");
    return raw ? JSON.parse(raw) as ExportPreference : null;
  } catch {
    return null;
  }
}

function courseProgress(course: Course, progress: StoredProgress) {
  const live = course.chapters.flatMap((chapter) => chapter.lessons).map((lesson) => lesson.id);
  return live.length ? Math.round((live.filter((id) => progress.completedExercises.includes(id)).length / live.length) * 100) : 0;
}
function overallProgress(progress: StoredProgress) {
  const live = courses.flatMap((course) => course.chapters.flatMap((chapter) => chapter.lessons));
  return live.length ? Math.round((live.filter((lesson) => progress.completedExercises.includes(lesson.id)).length / live.length) * 100) : 0;
}
function lessonPath(lesson: Lesson, language = "python") { return `/${language}/chapter-${lesson.chapter}/lesson-${lesson.order}`; }
function isLessonUnlocked(lesson: Lesson, progress: StoredProgress, language = "python") {
  const list = courseById(language)?.chapters.flatMap((chapter) => chapter.lessons) ?? [];
  const index = list.findIndex((candidate) => candidate.id === lesson.id);
  return index <= 0 || progress.completedExercises.includes(list[index - 1].id);
}

function nextCourseLesson(course: Course, progress: StoredProgress) {
  return course.chapters.flatMap((chapter) => chapter.lessons).find((lesson) => !progress.completedExercises.includes(lesson.id));
}

function verificationLabels(language: LanguageId | undefined, exercise: Exercise) {
  if (language === "htmlcss") return ["Previewed", "Structurally checked"];
  if (exercise.checker?.mode === "html") return ["Previewed", "Structurally checked"];
  if (exercise.checker?.mode === "patterns") return language === "java" || language === "cpp" ? ["Structurally checked", "Pattern checked"] : ["Pattern checked"];
  return language === "javascript" || language === "python" ? ["Executed"] : ["Conceptual"];
}

function verificationNote(language: LanguageId | undefined, exercise: Exercise) {
  if (language === "htmlcss") return "CodeForge previews this markup/CSS in the browser and checks key structure. It does not run automated accessibility tooling here.";
  if (language === "java") return "This Java exercise uses transparent browser-side structure review only. CodeForge does not claim JVM compilation or execution.";
  if (language === "cpp") return "This C++ exercise uses transparent browser-side structure review only. CodeForge does not claim native compilation, linking, or execution.";
  if (exercise.checker?.mode === "patterns") return "This exercise uses structural or pattern review for the requested construct. It is not a full runtime verification.";
  if (language === "javascript") return "This exercise runs in a local JavaScript Worker when the code is browser-safe.";
  return "This exercise runs in a local Pyodide Worker for browser-safe Python practice.";
}

function updateLessonState(current: StoredProgress, id: string, patch: Partial<NonNullable<StoredProgress["lessonStates"]>[string]>) {
  return {
    ...current,
    lessonStates: {
      ...current.lessonStates,
      [id]: { ...current.lessonStates[id], ...patch },
    },
  };
}

function lessonStageLabel(lesson: Lesson, index: number, courseId: LanguageId) {
  if (courseId === "python") return ["Foundation", "Deepen", "Apply", "Implement", "Integrate", "Case study", "Challenge", "Gap fill"][index] ?? `Lesson ${index + 1}`;
  const kind = lesson.kind ?? "learn";
  return kind === "blank-page" ? "Blank page"
    : kind === "edge-case" ? "Edge case"
    : kind === "deep-dive" ? "Deep lab"
    : kind === "integration" ? "Integrate"
    : kind === "compare" ? "Compare"
    : kind === "design" ? "Design"
    : kind === "predict" ? "Predict"
    : kind === "build" ? "Build"
    : kind === "read" ? "Read"
    : kind === "debug" ? "Debug"
    : kind === "modify" ? "Modify"
    : kind === "challenge" ? "Challenge"
    : kind === "assessment" ? "Assess"
    : "Learn";
}

export default function App() {
  const [route, setRoute] = useState(() => readRoute(window.location.pathname));
  const [progress, setProgress] = useState<StoredProgress>(() => loadProgress());
  const [saveWarning, setSaveWarning] = useState(false);
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    const listener = () => setRoute(readRoute(window.location.pathname));
    window.addEventListener("popstate", listener);
    return () => window.removeEventListener("popstate", listener);
  }, []);
  useEffect(() => {
    document.documentElement.dataset.theme = progress.settings.theme;
    document.documentElement.dataset.font = progress.settings.font;
    document.documentElement.dataset.scale = progress.settings.textScale;
    document.documentElement.dataset.spacing = progress.settings.spacing;
  }, [progress.settings]);
  useEffect(() => {
    const keys = (event: KeyboardEvent) => {
      if (!event.altKey) return;
      const key = event.key.toLowerCase();
      if (key === "h") { event.preventDefault(); navigate("/"); }
      if (key === "p") { event.preventDefault(); navigate("/progress"); }
      if (key === "s") { event.preventDefault(); navigate("/settings"); }
    };
    window.addEventListener("keydown", keys);
    return () => window.removeEventListener("keydown", keys);
  }, []);

  const updateProgress = (updater: (current: StoredProgress) => StoredProgress) => {
    setProgress((current) => {
      const next = updater(current);
      if (!saveProgress(next)) setSaveWarning(true);
      return next;
    });
  };
  const course = courseById(route.language);
  let page: React.ReactNode;
  if (route.page === "home") page = <HomePage progress={progress} />;
  else if (route.page === "progress") page = <ProgressPage progress={progress} />;
  else if (route.page === "settings") page = <SettingsPage progress={progress} updateProgress={updateProgress} resetProgress={() => { clearProgress(); setProgress(defaultProgress); }} />;
  else if (route.page === "export") page = <ExportPage progress={progress} />;
  else if (route.page === "audit") page = <AuditPage />;
  else if (!course) page = <NotFound />;
  else if (route.page === "course") page = <CourseOverview course={course} progress={progress} />;
  else {
    const chapter = course.chapters.find((candidate) => candidate.number === route.chapter);
    if (!chapter) page = <NotFound />;
    else if (route.page === "chapter") page = <ChapterPage course={course} chapter={chapter} progress={progress} updateProgress={updateProgress} />;
    else {
      const lesson = chapter.lessons.find((candidate) => candidate.order === route.lesson);
      page = lesson ? <LessonPage course={course} chapter={chapter} lesson={lesson} progress={progress} updateProgress={updateProgress} /> : <NotFound />;
    }
  }
  return <div className="app-shell"><TopBar progress={progress} navOpen={navOpen} setNavOpen={setNavOpen} updateProgress={updateProgress} />{saveWarning && <div className="save-warning" role="status"><Info size={17} /><span>Your work is still open here, but this browser could not save it. Free some storage and keep this tab open.</span><button type="button" onClick={() => setSaveWarning(false)} aria-label="Dismiss storage warning"><X size={16} /></button></div>}{page}</div>;
}

function TopBar({ progress, navOpen, setNavOpen, updateProgress }: { progress: StoredProgress; navOpen: boolean; setNavOpen: (open: boolean) => void; updateProgress: (updater: (current: StoredProgress) => StoredProgress) => void }) {
  const chosenLanguage = readRoute(window.location.pathname).language ?? "python";
  const jump = (path: string) => (event: React.MouseEvent<HTMLAnchorElement>) => { event.preventDefault(); setNavOpen(false); navigate(path); };
  return <header className="top-bar"><div className="top-bar-inner"><a className="brand" href="/" onClick={jump("/")} aria-label="CodeForge home"><span className="brand-mark"><Code2 size={22} /></span><span>CodeForge</span></a><nav className={`top-nav ${navOpen ? "is-open" : ""}`} aria-label="Primary navigation"><a href="/" onClick={jump("/")}><Home size={16} /> Home</a><a href="/progress" onClick={jump("/progress")}>My Progress</a><a href="/audit" onClick={jump("/audit")}>Coverage Audit</a><a href="/export" onClick={jump("/export")}>Export PDF</a><a href="/settings" onClick={jump("/settings")}>Settings</a></nav><div className="top-actions"><label className="language-select"><span className="sr-only">Switch language</span><select value={chosenLanguage} onChange={(event) => navigate(`/${event.target.value}`)}>{courses.map((course) => <option key={course.id} value={course.id}>{course.name}</option>)}</select><ChevronDown size={15} /></label><button className="icon-button" type="button" onClick={() => updateProgress((current) => ({ ...current, settings: { ...current.settings, theme: current.settings.theme === "dark" ? "light" : "dark" } }))} aria-label="Toggle color theme">{progress.settings.theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}</button><button className="menu-button" type="button" onClick={() => setNavOpen(!navOpen)} aria-label="Toggle navigation">Menu</button></div></div></header>;
}

function HomePage({ progress }: { progress: StoredProgress }) {
  const python = courseById("python")!;
  const next = nextCourseLesson(python, progress);
  const completed = progress.completedExercises.filter((id) => id.startsWith("python-")).length;
  return <main><section className="home-intro page-width"><div className="intro-kicker"><span className="pulse-dot" /> Free programming education, from first line to professional work</div><div className="home-heading"><h1>Build skills that<br /><em>hold up in the real world.</em></h1><p>CodeForge teaches the thinking behind code, then asks you to write it. No account, payment, or backend required.</p></div><div className="home-action"><div><span className="section-label">{completed ? "Continue with one clear step" : "Start with one clear step"}</span><b>{next ? `Python: ${next.title}` : "Python course complete"}</b><small>{next ? `${next.minutes} minutes. Read, type, and check one focused idea.` : "Review a chapter or export your study guide."}</small></div>{next ? <a className="primary-button" href={lessonPath(next)} onClick={(event) => { event.preventDefault(); navigate(lessonPath(next)); }}>{completed ? "Continue Python" : "Start Python"} <ArrowRight size={16} /></a> : <a className="primary-button" href="/python" onClick={(event) => { event.preventDefault(); navigate("/python"); }}>Review Python <ArrowRight size={16} /></a>}</div><div className="home-meta"><span>One next action, not a crowded dashboard</span><span>Progress stays in this browser</span><span>Keyboard: Alt + H, P, S</span></div></section><section className="language-grid page-width" aria-label="Available programming courses">{courses.map((course, index) => { const live = course.chapters.flatMap((chapter) => chapter.lessons).length; const percent = courseProgress(course, progress); return <a key={course.id} className={`language-card language-card-${index + 1}`} style={{ "--accent": course.accent } as React.CSSProperties} href={`/${course.id}`} onClick={(event) => { event.preventDefault(); navigate(`/${course.id}`); }}><div className="language-card-top"><span className="language-icon" aria-hidden="true">{course.icon}</span><span className="course-status">{live ? `${live} lessons live` : "Curriculum mapped"}</span></div><div><h2>{course.name}</h2><p>{course.description}</p></div><div className="language-card-bottom"><span>{course.version}</span><span className="course-progress-label">{live ? `${percent}% complete` : "Coming next"} <ArrowRight size={16} /></span></div>{live > 0 && <div className="progress-track" aria-label={`${course.name} progress`}><span style={{ width: `${percent}%` }} /></div>}</a>; })}</section><section className="method-section page-width"><div><span className="section-label">How learning works</span><h2>Understand. Type. Test. Keep going.</h2></div><p>Every available lesson explains code line by line, gives you a safe practice editor, checks more than one input, and saves what you write locally.</p></section></main>;
}

function CourseOverview({ course, progress }: { course: Course; progress: StoredProgress }) {
  const liveChapters = course.chapters.filter((chapter) => chapter.available).length;
  const percent = courseProgress(course, progress);
  const next = nextCourseLesson(course, progress);
  const completedLessons = course.chapters.flatMap((chapter) => chapter.lessons).filter((lesson) => progress.completedExercises.includes(lesson.id)).length;
  const totalLessons = course.chapters.flatMap((chapter) => chapter.lessons).length;
  return <main className="course-page" style={{ "--course-accent": course.accent } as React.CSSProperties}><div className="page-width course-masthead"><a className="back-link" href="/" onClick={(event) => { event.preventDefault(); navigate("/"); }}><ArrowLeft size={16} /> All courses</a><div className="course-masthead-grid"><div><span className="section-label">{course.version}</span><h1>{course.name}</h1><p>{course.description}</p>{next && <a className="course-action" href={lessonPath(next, course.id)} onClick={(event) => { event.preventDefault(); navigate(lessonPath(next, course.id)); }}>Next: {next.title} <ArrowRight size={16} /></a>}<button className="inline-export" type="button" onClick={() => queueExport({ scope: "course", language: course.id })}><Download size={15} /> Export course PDF</button></div><div className="course-progress-block"><span>{percent}%</span><div className="progress-track"><i style={{ width: `${percent}%` }} /></div><small>{liveChapters ? `${completedLessons} of ${totalLessons} lessons practiced` : "This course is mapped and ready for its build."}</small></div></div></div><div className="page-width course-outline-wrap"><div className="course-outline-heading"><div><span className="section-label">Course map</span><h2>25 chapters, {totalLessons} lessons, one step at a time.</h2></div><p>{course.id === "python" ? "Every Python chapter now moves through foundation, deepening, application, implementation, integration, a real case study, and a realistic challenge before its project and test. Checkpoints use retrieval practice across everything learned before them." : `Every ${course.name} chapter has a typed implementation, a project, a chapter test, and a decision guide explaining why the native tool fits the job.`}</p></div><div className="chapter-list">{course.chapters.map((chapter) => <ChapterRow key={chapter.number} course={course} chapter={chapter} progress={progress} />)}</div></div></main>;
}

function ChapterRow({ course, chapter, progress }: { course: Course; chapter: Chapter; progress: StoredProgress }) {
  const done = chapter.lessons.filter((lesson) => progress.completedExercises.includes(lesson.id)).length;
  const content = <><span className="chapter-number">{String(chapter.number).padStart(2, "0")}</span><div className="chapter-row-title"><h3>{chapter.title}</h3><p>{chapter.description}</p></div><div className="chapter-row-status">{chapter.available ? <><span>{done}/{chapter.lessons.length} practiced</span><ChevronRight size={19} /></> : <span>Planned</span>}</div></>;
  return chapter.available ? <a className="chapter-row" href={`/${course.id}/chapter-${chapter.number}`} onClick={(event) => { event.preventDefault(); navigate(`/${course.id}/chapter-${chapter.number}`); }}>{content}</a> : <div className="chapter-row is-planned">{content}</div>;
}

function CourseWorkspace({ course, progress, children }: { course: Course; progress: StoredProgress; children: React.ReactNode }) { return <main className="workspace" style={{ "--course-accent": course.accent } as React.CSSProperties}><CourseSidebar course={course} progress={progress} /><div className="workspace-main">{children}</div></main>; }

function CourseSidebar({ course, progress }: { course: Course; progress: StoredProgress }) {
  const path = window.location.pathname;
  const phases: Record<number, string> = { 1: "Foundation", 6: "Core skills", 11: "Problem solving", 16: "Production skills", 21: "Professional practice" };
  return <aside className="course-sidebar"><a className="sidebar-course-link" href={`/${course.id}`} onClick={(event) => { event.preventDefault(); navigate(`/${course.id}`); }}><span>{course.icon}</span><div><b>{course.name}</b><small>{course.version}</small></div></a><div className="sidebar-progress"><span>Course progress</span><b>{courseProgress(course, progress)}%</b><div className="progress-track"><i style={{ width: `${courseProgress(course, progress)}%` }} /></div></div><nav aria-label={`${course.name} lesson navigation`}>{course.chapters.map((chapter) => <div className={`sidebar-chapter ${chapter.available ? "" : "unavailable"}`} key={chapter.number}>{phases[chapter.number] && <span className="sidebar-phase">{phases[chapter.number]}</span>}{chapter.available ? <a href={`/${course.id}/chapter-${chapter.number}`} onClick={(event) => { event.preventDefault(); navigate(`/${course.id}/chapter-${chapter.number}`); }} className={path === `/${course.id}/chapter-${chapter.number}` ? "active" : ""}><span>{chapter.number}</span>{chapter.title}</a> : <div><span>{chapter.number}</span>{chapter.title}</div>}{chapter.lessons.map((lesson) => { const unlocked = isLessonUnlocked(lesson, progress, course.id); const active = path === lessonPath(lesson, course.id); return <a key={lesson.id} href={lessonPath(lesson, course.id)} className={`sidebar-lesson ${active ? "active" : ""} ${!unlocked ? "locked" : ""}`} onClick={(event) => { event.preventDefault(); if (unlocked) navigate(lessonPath(lesson, course.id)); }} aria-disabled={!unlocked}><span>{progress.completedExercises.includes(lesson.id) ? <Check size={12} /> : unlocked ? "" : "lock"}</span>{lesson.order}. {lesson.title}</a>; })}</div>)}</nav></aside>;
}

function LessonPage({ course, chapter, lesson, progress, updateProgress }: { course: Course; chapter: Chapter; lesson: Lesson; progress: StoredProgress; updateProgress: (updater: (current: StoredProgress) => StoredProgress) => void }) {
  const unlocked = isLessonUnlocked(lesson, progress, course.id);
  const list = course.chapters.flatMap((candidate) => candidate.lessons); const index = list.findIndex((candidate) => candidate.id === lesson.id); const previous = list[index - 1]; const next = list[index + 1];
  const readingCheck = lesson.readingCheck ?? generatedReadingCheck(lesson);
  useEffect(() => {
    if (!unlocked) return;
    updateProgress((current) => updateLessonState(current, lesson.id, { viewed: true }));
  }, [lesson.id, unlocked]);
  if (!unlocked) return <CourseWorkspace course={course} progress={progress}><section className="locked-view"><span className="section-label">Lesson locked</span><h1>Finish the previous practice first.</h1><p>CodeForge unlocks the next step after the previous exercise passes its tests. Your route is preserved, so you can return here after finishing.</p>{previous && <button className="primary-button" onClick={() => navigate(lessonPath(previous, course.id))}>Go to previous lesson <ArrowRight size={16} /></button>}</section></CourseWorkspace>;
  return <CourseWorkspace course={course} progress={progress}><article className="lesson-content"><div className="lesson-eyebrow"><a href={`/${course.id}/chapter-${chapter.number}`} onClick={(event) => { event.preventDefault(); navigate(`/${course.id}/chapter-${chapter.number}`); }}>Chapter {chapter.number}: {chapter.title}</a><span>Step {index + 1} of {list.length}</span><span>{lesson.minutes} min</span></div><header className="lesson-header"><h1>{lesson.title}</h1><p>{lesson.summary}</p><button className="inline-export" type="button" onClick={() => queueExport({ scope: "lesson", language: course.id, chapter: chapter.number, lessonId: lesson.id })}><Download size={15} /> Export this lesson PDF</button></header><section className="learning-goals"><span className="section-label">By the end of this step</span><ul>{lesson.learningGoals.map((goal) => <li key={goal}>{goal}</li>)}</ul></section><section className="lesson-section intro-copy"><h2>Start with the idea</h2><p>{lesson.explanation}</p><div className="key-terms">{lesson.keywordNotes.map((note) => <p key={note}><b>New syntax:</b> {note}</p>)}</div></section><DecisionGuide lesson={lesson} />{lesson.examples.map((example, exampleIndex) => <ExampleBlock key={example.title} number={exampleIndex + 1} example={example} language={course.id} />)}<ReadingCheck check={readingCheck} /><PracticeEditor id={lesson.id} language={course.id} title="Try it yourself" exercise={lesson.exercise} progress={progress} updateProgress={updateProgress} /><section className="lesson-section recap-section"><span className="section-label">Recap</span><h2>What you learned</h2><ul>{lesson.recap.map((point) => <li key={point}>{point}</li>)}</ul></section><div className="lesson-pagination">{previous ? <button onClick={() => navigate(lessonPath(previous, course.id))}><ArrowLeft size={16} /> Previous: {previous.title}</button> : <span />}{next ? <button onClick={() => navigate(lessonPath(next, course.id))} disabled={!progress.completedExercises.includes(lesson.id)}>Next: {next.title} <ArrowRight size={16} /></button> : <a href={`/${course.id}/chapter-${chapter.number}`} onClick={(event) => { event.preventDefault(); navigate(`/${course.id}/chapter-${chapter.number}`); }}>Finish chapter <ArrowRight size={16} /></a>}</div></article></CourseWorkspace>;
}

function generatedReadingCheck(lesson: Lesson): NonNullable<Lesson["readingCheck"]> {
  const example = lesson.examples[0];
  return {
    prompt: `Code reading: based on the first example, what is the expected output or result?`,
    choices: [example.output, "No visible result", "A syntax error", "An unrelated value"],
    correctIndex: 0,
    explanation: `Trace the first example in order. Its documented expected output is ${example.output}. The line explanations above show how that result is produced.`,
  };
}

function ReadingCheck({ check }: { check: NonNullable<Lesson["readingCheck"]> }) {
  const [answer, setAnswer] = useState<number>();
  const [submitted, setSubmitted] = useState(false);
  const correct = answer === check.correctIndex;
  return <section className="reading-check"><span className="section-label">Predict before typing</span><h2>Read the code first</h2><p>{check.prompt}</p><div>{check.choices.map((choice, index) => <label key={choice} className={submitted ? (index === check.correctIndex ? "correct-choice" : answer === index ? "incorrect-choice" : "") : ""}><input type="radio" name={check.prompt} checked={answer === index} onChange={() => setAnswer(index)} /> <span>{choice}</span></label>)}</div><button type="button" className="check-button" onClick={() => setSubmitted(true)} disabled={answer === undefined}>Check prediction</button>{submitted && <p className={correct ? "prediction-success" : "prediction-retry"}>{correct ? "Correct. " : "Not quite. "}{check.explanation}</p>}</section>;
}

function DecisionGuide({ lesson }: { lesson: Lesson }) {
  const choices = lesson.decisionGuide ?? [
    { use: lesson.keywordNotes[0] ?? "the focused Python tool in this lesson", insteadOf: "a more complicated workaround", reason: "It states the program's intent directly, gives Python a predictable rule to execute, and keeps the code easier to test and explain." },
    { use: "a small named operation", insteadOf: "repeating the same inline code", reason: "A focused operation makes one decision visible and lets later code reuse it without creating inconsistent copies." },
  ];
  return <section className="decision-guide"><span className="section-label">Engineering choice</span><h2>Why use this, not that?</h2><p>Professional programming is not about using the fanciest syntax. Choose the smallest tool that makes the rule clear, testable, and safe for the data boundary.</p><div>{choices.map((choice) => <article key={`${choice.use}-${choice.insteadOf}`}><b>Use: {choice.use}</b><span>Instead of: {choice.insteadOf}</span><p>{choice.reason}</p></article>)}</div></section>;
}

function ExampleBlock({ example, number, language = "python" }: { example: Lesson["examples"][number]; number: number; language?: LanguageId }) {
  const structural = language === "java" || language === "cpp";
  const html = language === "htmlcss";
  const label = structural ? "Expected result if compiled" : html ? "Expected browser result" : "Expected output";
  const note = structural ? "CodeForge does not compile Java or C++ in this browser. This is a reading prediction from the shown source, not a verified compiler run." : html ? "This describes the page result the markup and CSS are intended to produce in the sandboxed browser preview." : language === "javascript" ? "The local JavaScript Worker can verify safe runnable examples; browser-only examples use the labeled structure review instead." : "The Pyodide sandbox runs supported Python examples in a Worker, then shows the produced console output.";
  return <section className="lesson-section example-section"><div className="example-title"><span>Example {number}</span><h2>{example.title}</h2></div><p>{example.explanation}</p><pre className="read-code"><code>{example.code}</code></pre><div className="expected-output"><span><Terminal size={16} /> {label}</span><pre>{example.output}</pre><p>{note}</p></div><ol className="line-breakdown">{example.lines.map((line) => <li key={line}>{line}</li>)}</ol><details className="mistakes-box" open><summary>Common mistakes <ChevronDown size={17} /></summary><div>{example.mistakes.map((mistake) => <div key={mistake.mistake}><b>{mistake.mistake}</b><p><code>{mistake.error}</code></p><p><strong>Fix:</strong> {mistake.fix}</p></div>)}</div></details></section>;
}

function PracticeEditor({ id, language = "python", title, exercise, progress, updateProgress, compact = false }: { id: string; language?: LanguageId; title: string; exercise: Exercise; progress: StoredProgress; updateProgress: (updater: (current: StoredProgress) => StoredProgress) => void; compact?: boolean }) {
  const [code, setCode] = useState(progress.code[id] ?? exercise.starterCode);
  const [output, setOutput] = useState("");
  const [errorLine, setErrorLine] = useState<number>();
  const [state, setState] = useState<CheckState>({ kind: progress.completedExercises.includes(id) || progress.projectComplete.includes(id) ? "success" : "idle" });
  const [hintsShown, setHintsShown] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const pythonRunner = useRef<PythonRunner | null>(null);
  const javascriptRunner = useRef<JavaScriptRunner | null>(null);
  if (language === "python" && !pythonRunner.current) pythonRunner.current = new PythonRunner();
  if (language === "javascript" && !javascriptRunner.current) javascriptRunner.current = new JavaScriptRunner();

  useEffect(() => () => { pythonRunner.current?.reset(); javascriptRunner.current?.reset(); }, []);
  useEffect(() => { setCode(progress.code[id] ?? exercise.starterCode); setOutput(""); setErrorLine(undefined); }, [id, exercise.starterCode]);
  const persist = (nextCode: string) => { setCode(nextCode); updateProgress((current) => ({ ...updateLessonState(current, id, { practiced: true }), code: { ...current.code, [id]: nextCode } })); };
  const execute = async (input = "") => language === "javascript" ? javascriptRunner.current!.run(code) : pythonRunner.current!.run(code, input);
  const staticCheck = () => {
    const checker = exercise.checker;
    if (!checker) return null;
    const { missing, forbidden, passed, invalidPatterns, emptyPatterns } = checkRequiredPatterns(code, checker);
    if (invalidPatterns.length || emptyPatterns.length) {
      setState({ kind: "error", message: "This exercise check is misconfigured. CodeForge did not grade your work. Please report the lesson authoring issue." });
      setOutput("Checker configuration issue: the required pattern list contains an invalid or empty pattern.");
      return false;
    }
    if (missing.length || forbidden.length) {
      const line = findLikelyLogicLine(code);
      setErrorLine(line);
      setOutput(`Code review: ${missing.length ? `missing ${missing.length} required construct${missing.length === 1 ? "" : "s"}` : "found a construct this exercise asks you not to use"}.`);
      setState({ kind: "error", message: missing.length ? `TRY AGAIN: add the required language construct and run the check again. Review highlighted line ${line}.` : `TRY AGAIN: use the requested approach rather than the highlighted construct.` });
      return false;
    }
    setOutput(checker.mode === "html" ? "HTML/CSS structure check passed. Your rendered preview is shown below." : "Static code review passed. This browser checks required constructs because this language has no local compiler sandbox." );
    return passed;
  };
  const runProgram = async () => {
    if (language === "java" || language === "cpp") {
      setOutput("Java and C++ use browser-only structure checks in CodeForge. A real compiler service would need a backend or third-party execution API, so this free, private site does not send your code away.");
      setState({ kind: "idle" });
      return;
    }
    if (language === "htmlcss") { setOutput("Rendered HTML/CSS preview is shown below. Use Check answer to verify the requested accessible structure."); setState({ kind: "idle" }); return; }
    setState({ kind: "running", message: `Starting the ${language === "javascript" ? "JavaScript" : "Python"} sandbox...` });
    setErrorLine(undefined);
    const result = await execute();
    setOutput(result.output || (result.error ? "" : "Program finished with no output."));
    if (result.error) { setErrorLine(result.errorLine); setState({ kind: "error", message: `${isSyntaxError(result) ? "SYNTAX ERROR" : "RUNTIME ERROR"}: ${shortError(result.error)}` }); } else setState({ kind: "idle" });
  };
  const markSuccess = (message = "Nice work! Every executable test passed. The next step is unlocked.") => {
    setState({ kind: "success", message });
    updateProgress((current) => {
      const next = updateLessonState(current, id, { viewed: true, practiced: true, passed: true });
      return { ...next, completedExercises: next.completedExercises.includes(id) ? next.completedExercises : [...next.completedExercises, id], completedLessons: next.completedLessons.includes(id) ? next.completedLessons : [...next.completedLessons, id] };
    });
  };
  const check = async () => {
    setState({ kind: "running", message: language === "java" || language === "cpp" || language === "htmlcss" ? "Reviewing the requested code structure..." : `Checking ${exercise.testCases.length} test ${exercise.testCases.length === 1 ? "case" : "cases"}...` });
    setErrorLine(undefined);
    if (exercise.checker) { if (staticCheck()) markSuccess("Nice work! The requested on-device structure review passed. This is not a compiler or runtime execution result, and the next step is unlocked."); return; }
    for (const testCase of exercise.testCases) {
      const result = await execute(testCase.input ?? "");
      setOutput(result.output || (result.error ?? ""));
      if (result.error) { setErrorLine(result.errorLine); setState({ kind: "error", message: `${isSyntaxError(result) ? "SYNTAX ERROR" : "RUNTIME ERROR"}: ${shortError(result.error)}. Fix the highlighted line and try again.` }); return; }
      if (normalizeOutput(result.output) !== normalizeOutput(testCase.expected)) { const likely = findLikelyLogicLine(code); setErrorLine(likely); setState({ kind: "error", message: `LOGIC ERROR on ${testCase.label}. Expected ${JSON.stringify(testCase.expected)} but received ${JSON.stringify(result.output)}. Review highlighted line ${likely}.` }); return; }
    }
    markSuccess();
  };
  const reset = () => { pythonRunner.current?.reset(); javascriptRunner.current?.reset(); setOutput(""); setErrorLine(undefined); setState({ kind: "idle" }); setShowAnswer(false); setHintsShown(0); persist(exercise.starterCode); };
  const complete = progress.completedExercises.includes(id) || progress.projectComplete.includes(id);
  const staticLanguage = language === "java" || language === "cpp" || language === "htmlcss";
  const verification = verificationLabels(language, exercise);
  return <section className={`practice-module ${compact ? "compact" : ""}`}><div className="practice-heading"><div><span className="section-label">Practice lab</span><h2>{title}</h2><p>{exercise.prompt}</p></div>{complete && <span className="completed-mark"><Check size={15} /> Passed</span>}</div><div className="editor-actions"><button className="run-button" type="button" onClick={runProgram} disabled={state.kind === "running"}><Play size={16} /> {language === "htmlcss" ? "Preview" : staticLanguage ? "About checks" : "Run"}</button><button className="check-button" type="button" onClick={check} disabled={state.kind === "running"}>{state.kind === "running" ? "Checking..." : "Check answer"}</button><button className="text-button" type="button" onClick={reset}><RotateCcw size={15} /> Reset</button><span>{staticLanguage ? "This exercise uses transparent browser-side structure checks; no code leaves your device." : "Paste is turned off here so you can build the muscle memory."}</span></div><div className="verification-strip"><b>Verification:</b><div className="verification-badges">{verification.map((label) => <span key={label} className="audit-status partial">{label}</span>)}</div><p>{verificationNote(language, exercise)}</p></div><CodeEditor value={code} onChange={persist} errorLine={errorLine} language={language} /><div className="console" aria-live="polite"><div><Terminal size={15} /> Output</div><pre>{output || "Run your code to see output here."}</pre></div>{language === "htmlcss" && <iframe className="html-preview" title="HTML and CSS preview" sandbox="allow-scripts" srcDoc={code} />}{state.kind !== "idle" && <div className={`check-feedback ${state.kind}`} role="status">{state.kind === "success" ? <Check size={18} /> : <Info size={18} />}<span>{state.message}</span></div>}<div className="practice-footer"><div className="hint-row"><CircleHelp size={16} /><span>{hintsShown ? `${hintsShown} of ${exercise.hints.length} hint${exercise.hints.length === 1 ? "" : "s"} shown` : "Need a nudge?"}</span>{hintsShown < exercise.hints.length && <button type="button" onClick={() => setHintsShown(hintsShown + 1)}>Unlock hint {hintsShown + 1}</button>}</div>{hintsShown > 0 && <ol className="hints-list">{exercise.hints.slice(0, hintsShown).map((hint) => <li key={hint}>{hint}</li>)}</ol>}<button className="answer-button" type="button" onClick={() => setShowAnswer(!showAnswer)}>{showAnswer ? "Hide answer" : "Show answer"}</button>{showAnswer && <div className="solution-reveal"><pre><code>{exercise.solution}</code></pre><p>{exercise.solutionExplanation}</p></div>}</div></section>;
}

function ChapterPage({ course, chapter, progress, updateProgress }: { course: Course; chapter: Chapter; progress: StoredProgress; updateProgress: (updater: (current: StoredProgress) => StoredProgress) => void }) {
  if (!chapter.available) return <CourseWorkspace course={course} progress={progress}><section className="locked-view"><span className="section-label">In production</span><h1>{chapter.title} is mapped but not authored yet.</h1><p>This route is reserved for the chapter. The complete curriculum remains visible on the course overview.</p></section></CourseWorkspace>;
  const allPracticed = chapter.lessons.every((lesson) => progress.completedExercises.includes(lesson.id));
  const projectTitle = course.id === "python" ? "Put the chapter together" : "Apply the chapter pattern";
  return <CourseWorkspace course={course} progress={progress}><section className="chapter-page"><a className="back-link" href={`/${course.id}`} onClick={(event) => { event.preventDefault(); navigate(`/${course.id}`); }}><ArrowLeft size={16} /> {course.name} overview</a><span className="section-label">Chapter {chapter.number}</span><h1>{chapter.title}</h1><p className="chapter-lead">{chapter.description}</p><button className="inline-export" type="button" onClick={() => queueExport({ scope: "chapter", language: course.id, chapter: chapter.number })}><Download size={15} /> Export this chapter PDF</button><ChapterSequence course={course} chapter={chapter} progress={progress} /><div className="chapter-lesson-list"><h2>Lessons</h2>{chapter.lessons.map((lesson) => { const complete = progress.completedExercises.includes(lesson.id); const unlocked = isLessonUnlocked(lesson, progress, course.id); return <a key={lesson.id} className={`lesson-row ${!unlocked ? "locked" : ""}`} href={lessonPath(lesson, course.id)} onClick={(event) => { event.preventDefault(); if (unlocked) navigate(lessonPath(lesson, course.id)); }}><span>{complete ? <Check size={16} /> : lesson.order}</span><div><b>{lesson.title}</b><small>{lesson.summary}</small></div><em>{lesson.minutes} min</em><ChevronRight size={18} /></a>; })}</div>{allPracticed ? <><section className="chapter-divider"><span>Chapter project</span><h2>{projectTitle}</h2><p>Projects ask for a small complete program. Passing it records your chapter practice.</p></section>{chapter.project && <ChapterProject course={course} chapter={chapter} progress={progress} updateProgress={updateProgress} />}{chapter.test && <ChapterTest test={chapter.test} scoreKey={`${course.id}-chapter-${chapter.number}-test`} title="Chapter test" intro="Three quick questions. Scores remain only in your browser and can be improved by trying again." progress={progress} updateProgress={updateProgress} />}{chapter.cumulativeTest && <ChapterTest test={chapter.cumulativeTest} scoreKey={`${course.id}-chapter-${chapter.number}-cumulative`} title={`Cumulative checkpoint: Chapters 1-${chapter.number}`} intro="Retrieval practice strengthens older ideas. This checkpoint mixes this milestone with the foundations before it." progress={progress} updateProgress={updateProgress} />}</> : <section className="finish-callout"><Info size={19} /><div><b>Finish the lessons to open the chapter project and test.</b><p>Each successful practice check unlocks the next lesson. You have {chapter.lessons.filter((lesson) => progress.completedExercises.includes(lesson.id)).length} of {chapter.lessons.length} complete.</p></div></section>}</section></CourseWorkspace>;
}

function ChapterSequence({ course, chapter, progress }: { course: Course; chapter: Chapter; progress: StoredProgress }) {
  const sequenceClass = course.id === "python" ? "seven-steps" : chapter.lessons.length > 6 ? "seven-steps" : chapter.lessons.length > 5 ? "six-steps" : "five-steps";
  return <section className="chapter-sequence" aria-label="Chapter learning sequence"><span className="section-label">Connected lesson sequence</span><p>{course.id === "python" ? "These seven lessons deliberately build on one another before the chapter project. Do not treat them as unrelated topics: the case study combines prior decisions and the challenge asks you to reproduce the pattern yourself." : "This chapter uses lesson kinds chosen for the topic itself. Some chapters emphasize prediction and comparison; others need a blank-page build, a debugging step, or a deeper integration lab."}</p><ol className={sequenceClass}>{chapter.lessons.map((lesson, index) => <li key={lesson.id} className={progress.completedExercises.includes(lesson.id) ? "complete" : ""}><span>{progress.completedExercises.includes(lesson.id) ? <Check size={13} /> : index + 1}</span><div><b>{lessonStageLabel(lesson, index, course.id)}</b><small>{lesson.title}</small></div></li>)}</ol></section>;
}

function ChapterProject({ course, chapter, progress, updateProgress }: { course: Course; chapter: Chapter; progress: StoredProgress; updateProgress: (updater: (current: StoredProgress) => StoredProgress) => void }) {
  if (!chapter.project) return null; const id = `${course.id}-chapter-${chapter.number}-project`;
  return <><ProjectBrief project={chapter.project} /><PracticeEditor id={id} language={course.id} title={chapter.project.title} exercise={chapter.project} progress={progress} updateProgress={(updater) => updateProgress((current) => { const next = updater(current); if (!next.completedExercises.includes(id) || next.projectComplete.includes(id)) return next; const progressed = updateLessonState(next, id, { projectCompleted: true, passed: true, practiced: true, viewed: true }); return { ...progressed, projectComplete: [...progressed.projectComplete, id] }; })} compact /></>;
}

function ProjectBrief({ project }: { project: NonNullable<Chapter["project"]> }) {
  const requirements = project.requirements ?? ["Use the major chapter concept in a small complete program.", "Keep the visible result clear enough to verify.", "Handle one edge case or boundary when the chapter concept needs it."];
  const milestones = project.milestones ?? ["Plan the smallest working core.", "Implement and check the core behavior.", "Review one edge case before extending the solution."];
  const acceptance = project.acceptanceCriteria ?? ["The program addresses the project brief.", "The key chapter concept is visible in the solution.", "The result is clear enough to check."];
  return <section className="project-brief"><span className="section-label">Project brief</span>{project.scenario && <p className="project-scenario">{project.scenario}</p>}<div><article><b>Requirements</b><ul>{requirements.map((item) => <li key={item}>{item}</li>)}</ul></article><article><b>Milestones</b><ol>{milestones.map((item) => <li key={item}>{item}</li>)}</ol></article><article><b>Acceptance criteria</b><ul>{acceptance.map((item) => <li key={item}>{item}</li>)}</ul></article></div>{project.extensionTasks && <p className="project-extension"><strong>Extension:</strong> {project.extensionTasks.join(" ")}</p>}{project.rubric && <p className="project-extension"><strong>Review rubric:</strong> {project.rubric.join(" ")}</p>}</section>;
}

function ChapterTest({ test, scoreKey, title, intro, progress, updateProgress }: { test: NonNullable<Chapter["test"]>; scoreKey: string; title: string; intro: string; progress: StoredProgress; updateProgress: (updater: (current: StoredProgress) => StoredProgress) => void }) {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const stored = progress.testScores[scoreKey];
  const score = test.reduce((total, question, index) => total + (answers[index] === question.correctIndex ? 1 : 0), 0);
  const submit = () => { updateProgress((current) => ({ ...current, testScores: { ...current.testScores, [scoreKey]: score } })); setSubmitted(true); };
  return <section className="chapter-test"><div className="chapter-divider"><span>{title}</span><h2>Check your understanding</h2><p>{intro}</p></div>{test.map((question, index) => <fieldset key={question.question}><legend>{index + 1}. {question.question}</legend>{question.choices.map((choice, choiceIndex) => <label key={choice} className={submitted || stored !== undefined ? (choiceIndex === question.correctIndex ? "correct-choice" : answers[index] === choiceIndex ? "incorrect-choice" : "") : ""}><input type="radio" name={`${scoreKey}-${index}`} checked={answers[index] === choiceIndex} onChange={() => setAnswers({ ...answers, [index]: choiceIndex })} /> <span>{choice}</span></label>)}{(submitted || stored !== undefined) && <p className="test-explanation">{question.explanation}</p>}</fieldset>)}<div className="test-footer"><button className="primary-button" type="button" onClick={submit} disabled={Object.keys(answers).length !== test.length}>Submit test</button>{(submitted || stored !== undefined) && <span>Your latest score: {submitted ? score : stored}/{test.length}</span>}</div></section>;
}

function ProgressPage({ progress }: { progress: StoredProgress }) {
  const overall = overallProgress(progress);
  const passedLessons = courses.flatMap((course) => course.chapters.flatMap((chapter) => chapter.lessons)).filter((lesson) => progress.completedExercises.includes(lesson.id)).length;
  return <main className="page-width shared-page"><span className="section-label">Learning record</span><h1>My progress</h1><p className="page-lead">Everything is stored in this browser. You can keep working without an account.</p><section className="overall-progress"><div><span>Overall live-course progress</span><b>{overall}%</b></div><div className="progress-track"><i style={{ width: `${overall}%` }} /></div><p>{passedLessons} lesson exercises passed, {Object.keys(progress.testScores).length} chapter or checkpoint tests taken.</p></section><section className="progress-table" aria-label="Progress by language">{courses.map((course) => { const live = course.chapters.flatMap((chapter) => chapter.lessons).length; const completed = course.chapters.flatMap((chapter) => chapter.lessons).filter((lesson) => progress.completedExercises.includes(lesson.id)).length; const percent = courseProgress(course, progress); return <a href={`/${course.id}`} onClick={(event) => { event.preventDefault(); navigate(`/${course.id}`); }} key={course.id} style={{ "--accent": course.accent } as React.CSSProperties}><span className="language-icon">{course.icon}</span><div><b>{course.name}</b><small>{live ? `${completed} / ${live} live exercises passed` : "25 chapters mapped, authoring not started"}</small></div><div className="mini-progress"><span><i style={{ width: `${percent}%` }} /></span><b>{live ? `${percent}%` : "Planned"}</b></div><ChevronRight size={18} /></a>; })}</section></main>;
}

function AuditPage() {
  return <main className="page-width shared-page audit-page"><span className="section-label">Honest curriculum report</span><h1>Coverage audit</h1><p className="page-lead">This report distinguishes implemented teaching from topics that are only introduced or still missing. A chapter title, URL, or editor is never counted as full education by itself.</p>{Object.entries(coverageAudit).map(([language, rows]) => <section className="audit-language" key={language}><h2>{language}</h2><div className="audit-table" role="table" aria-label={`${language} coverage audit`}><div className="audit-head" role="row"><span>Topic</span><span>Status</span><span>Lessons and practice</span><span>Execution and debugging</span></div>{rows.map((row) => <div className="audit-row" role="row" key={row.topic}><div><b>{row.topic}</b><small>Projects: {row.projects}. Tests: {row.tests}.</small></div><span className={`audit-status ${row.status.toLowerCase()}`}>{row.status}</span><div><b>{row.lessons}</b><small>{row.exercises}</small></div><div><b>{row.execution}</b><small>{row.debugging}</small></div></div>)}</div></section>)}</main>;
}

function SettingsPage({ progress, updateProgress, resetProgress }: { progress: StoredProgress; updateProgress: (updater: (current: StoredProgress) => StoredProgress) => void; resetProgress: () => void }) {
  const setSetting = <K extends keyof StoredProgress["settings"]>(key: K, value: StoredProgress["settings"][K]) => updateProgress((current) => ({ ...current, settings: { ...current.settings, [key]: value } })); const [removed, setRemoved] = useState(false); const remove = () => { if (window.confirm("Delete all CodeForge progress, saved code, and settings from this browser?")) { resetProgress(); setRemoved(true); } };
  return <main className="page-width shared-page settings-page"><span className="section-label">Preferences</span><h1>Settings</h1><p className="page-lead">Tune CodeForge for comfortable reading. Preferences save locally in this browser.</p><section className="settings-group"><h2>Color theme</h2><div className="choice-grid">{(["light", "dark"] as const).map((theme) => <button type="button" className={progress.settings.theme === theme ? "selected" : ""} onClick={() => setSetting("theme", theme)} key={theme}>{theme === "light" ? <Sun size={18} /> : <Moon size={18} />} {theme === "light" ? "Light" : "Dark"}</button>)}</div></section><section className="settings-group"><h2>Reading font</h2><div className="choice-grid three">{(["system", "dyslexia", "mono"] as const).map((font) => <button type="button" className={progress.settings.font === font ? "selected" : ""} onClick={() => setSetting("font", font)} key={font}>{font === "system" ? "Clear sans" : font === "dyslexia" ? "Dyslexia-friendly" : "Monospace"}</button>)}</div></section><section className="settings-group"><h2>Text size</h2><div className="choice-grid three">{(["normal", "large", "larger"] as const).map((size) => <button type="button" className={progress.settings.textScale === size ? "selected" : ""} onClick={() => setSetting("textScale", size)} key={size}>{size === "normal" ? "Normal" : size === "large" ? "Large" : "Extra large"}</button>)}</div></section><section className="settings-group"><h2>Line spacing</h2><div className="choice-grid">{(["normal", "relaxed"] as const).map((spacing) => <button type="button" className={progress.settings.spacing === spacing ? "selected" : ""} onClick={() => setSetting("spacing", spacing)} key={spacing}>{spacing === "normal" ? "Normal" : "Relaxed"}</button>)}</div></section><section className="shortcuts"><h2>Keyboard shortcuts</h2><p><kbd>Alt</kbd> + <kbd>H</kbd> Home <span /><kbd>Alt</kbd> + <kbd>P</kbd> Progress <span /><kbd>Alt</kbd> + <kbd>S</kbd> Settings</p><p>In the editor, Tab indents a line and brackets and quotes close automatically.</p></section><section className="danger-zone"><div><h2>Delete my data</h2><p>Remove saved code, completed exercises, scores, and preferences from this browser. This cannot be undone.</p></div><button type="button" onClick={remove}><Trash2 size={17} /> Delete local data</button>{removed && <p role="status">Local CodeForge data was removed.</p>}</section></main>;
}

function ExportPage({ progress }: { progress: StoredProgress }) {
  const [preference] = useState<ExportPreference | null>(() => takeExportPreference());
  const [scope, setScope] = useState<"course" | "chapter" | "lesson">(preference?.scope ?? "course");
  const [language, setLanguage] = useState<LanguageId>(preference?.language ?? "python");
  const [chapterNumber, setChapterNumber] = useState(preference?.chapter ?? 1);
  const activeCourse = courseById(language)!;
  const firstLesson = firstLessonId(activeCourse);
  const [lessonId, setLessonId] = useState(preference?.lessonId ?? firstLesson);
  const [notice, setNotice] = useState("");
  const selectedLessons = lessonsForChapter(activeCourse, chapterNumber);
  const changeLanguage = (nextLanguage: LanguageId) => {
    const nextCourse = courseById(nextLanguage)!;
    setLanguage(nextLanguage);
    setChapterNumber(1);
    setLessonId(firstLessonId(nextCourse));
  };
  const exportPdf = () => {
    const target = resolveExportTargets(activeCourse, scope, chapterNumber, lessonId);
    const pdf = new jsPDF({ unit: "pt", format: "a4" });
    const width = 515;
    let y = 110;
    const page = () => { pdf.addPage(); y = 54; };
    const heading = (text: string, size: number) => { if (y > 700) page(); pdf.setFont("helvetica", "bold"); pdf.setFontSize(size); pdf.text(text, 48, y); y += size + 12; };
    const write = (text: string, size = 11, font: "helvetica" | "courier" = "helvetica", gap = 16) => {
      pdf.setFont(font, "normal"); pdf.setFontSize(size);
      const lines = pdf.splitTextToSize(text, width);
      if (y + lines.length * (size + 3) > 760) page();
      pdf.text(lines, 48, y); y += lines.length * (size + 3) + gap;
    };
    pdf.setFillColor(91, 111, 232); pdf.rect(0, 0, 595, 842, "F"); pdf.setTextColor(255, 255, 255); pdf.setFont("helvetica", "bold"); pdf.setFontSize(36); pdf.text("CodeForge", 48, 150); pdf.setFontSize(19); pdf.text(`${activeCourse.name} study guide`, 48, 188); pdf.setFont("helvetica", "normal"); pdf.setFontSize(11); pdf.text(`${activeCourse.version} | Generated locally from browser progress`, 48, 720);
    page(); pdf.setTextColor(32, 37, 48); heading("Contents", 23);
    target.forEach((chapter) => { write(`Chapter ${chapter.number}: ${chapter.title}`, 13); chapter.lessons.forEach((lesson) => write(`  ${lesson.order}. ${lesson.title}`, 10)); });
    target.forEach((chapter) => {
      page(); heading(`Chapter ${chapter.number}: ${chapter.title}`, 21); write(chapter.description);
      chapter.lessons.forEach((lesson) => {
        heading(`${lesson.order}. ${lesson.title}`, 16); write(lesson.summary); write(lesson.explanation);
        write(`Learning goals: ${lesson.learningGoals.join(" | ")}`, 10);
        lesson.examples.forEach((item) => { heading(item.title, 12); write(item.explanation, 10); write(item.code, 9, "courier", 10); write(`Expected output:\n${item.output}`, 9, "courier", 10); write(`Line explanations:\n${item.lines.join("\n")}`, 9); write(`Common mistakes:\n${item.mistakes.map((mistake) => `${mistake.mistake} - ${mistake.error}. Fix: ${mistake.fix}`).join("\n")}`, 9); });
        write(`Practice: ${lesson.exercise.prompt}`, 10); write(`Reference solution:\n${lesson.exercise.solution}`, 9, "courier", 10); write(`Recap: ${lesson.recap.join(" ")}`, 10);
        const saved = progress.code[lesson.id]; if (saved) { write("Your saved solution:", 10); write(saved, 9, "courier"); }
      });
      if (chapter.project) { heading(chapter.project.title, 14); write(chapter.project.brief, 10); write(`Project prompt: ${chapter.project.prompt}`, 10); const savedProject = progress.code[`${activeCourse.id}-chapter-${chapter.number}-project`]; if (savedProject) { write("Your saved project code:", 10); write(savedProject, 9, "courier"); } }
      const score = progress.testScores[`${activeCourse.id}-chapter-${chapter.number}-test`]; if (score !== undefined) write(`Your chapter test score: ${score}/${chapter.test?.length ?? 3}`, 10);
      const cumulative = progress.testScores[`${activeCourse.id}-chapter-${chapter.number}-cumulative`]; if (cumulative !== undefined) write(`Your cumulative checkpoint score: ${cumulative}/${chapter.cumulativeTest?.length ?? 0}`, 10);
    });
    pdf.save(`codeforge-${activeCourse.id}-${scope}-study-guide.pdf`);
    setNotice(`Your ${activeCourse.name} study guide has downloaded with selected lessons, examples, practice prompts, saved work, projects, and available scores.`);
  };
  return <main className="page-width shared-page export-page"><span className="section-label">Offline study guide</span><h1>Export PDF</h1><p className="page-lead">Create a clean, printable guide from any CodeForge language, including saved code and recorded results from this browser.</p><section className="export-control"><h2>Choose what to export</h2><label className="select-label">Language<select value={language} onChange={(event) => changeLanguage(event.target.value as LanguageId)}>{courses.map((course) => <option key={course.id} value={course.id}>{course.name} - {course.version}</option>)}</select></label><div className="export-options">{(["course", "chapter", "lesson"] as const).map((option) => <label key={option}><input type="radio" name="scope" checked={scope === option} onChange={() => setScope(option)} /> <span>{option === "course" ? `Whole ${activeCourse.name} course` : option === "chapter" ? "One chapter" : "One lesson"}</span></label>)}</div>{scope !== "course" && <label className="select-label">Chapter<select value={chapterNumber} onChange={(event) => { const next = Number(event.target.value); setChapterNumber(next); setLessonId(lessonsForChapter(activeCourse, next)[0]?.id ?? ""); }}>{activeCourse.chapters.map((chapter) => <option key={chapter.number} value={chapter.number}>Chapter {chapter.number}: {chapter.title}</option>)}</select></label>}{scope === "lesson" && <label className="select-label">Lesson<select value={lessonId} onChange={(event) => setLessonId(event.target.value)}>{selectedLessons.map((lesson) => <option key={lesson.id} value={lesson.id}>{lesson.order}. {lesson.title}</option>)}</select></label>}<button className="primary-button" type="button" onClick={exportPdf}><Download size={17} /> Generate PDF</button>{notice && <p className="export-notice" role="status">{notice}</p>}</section><section className="pdf-includes"><h2>Your guide includes</h2><ul><li>A CodeForge title page and table of contents</li><li>Lesson explanations, examples, line explanations, expected output, and recaps</li><li>Practice prompts, reference solutions, and your saved code when available</li><li>Chapter projects, chapter scores, and cumulative scores where available</li></ul></section></main>;
}

function NotFound() { return <main className="page-width not-found"><span className="section-label">404</span><h1>That learning path is not here.</h1><p>The page may not be authored yet, or the URL has a typo.</p><button className="primary-button" onClick={() => navigate("/")}>Return home <ArrowRight size={16} /></button></main>; }
function isSyntaxError(result: RunResult) { return /SyntaxError|IndentationError|TabError/i.test(result.error ?? ""); }
function shortError(error: string) { return error.split("\n").filter(Boolean).slice(-1)[0] ?? error; }
function findLikelyLogicLine(code: string) { const lines = code.split("\n"); const index = [...lines].map((line, i) => ({ line, i })).reverse().find(({ line }) => /print\(|return |\+=|=|if |for /.test(line))?.i; return (index ?? 0) + 1; }