/**
 * Chapter-plan vs shipped-lesson sweep.
 *
 * For every chapter of every course, print the concepts the plan promises next to the
 * lessons that actually ship, plus a lexical probe: for each concept, count how many of
 * its significant words appear anywhere in the chapter's shipped lesson corpus (titles,
 * bodies, code samples, exercise code, and per-line notes). A concept whose probe score
 * is 0 has no textual trace in the chapter and is a genuine candidate gap.
 *
 * The probe is deliberately dumb and over-permissive: a score above 0 proves only that the
 * words occur, not that the concept is taught. It exists to shrink a 25-chapter-per-course
 * surface down to a short list of candidates that a human still has to read, which is how
 * the Java regex/java.time and C++ map/set/sort gaps were actually found.
 *
 * Usage: npx vite-node .arena-gap-sweep.ts [-- <language>|all] [--quiet]
 */
import { courses, courseById } from "./src/courses/catalog";

type LessonLike = {
  kind?: string;
  title?: string;
  body?: string;
  explanation?: string;
  focus?: string;
  code?: string;
  notes?: { code: string; note: string }[];
  samples?: { title: string; code: string; output: string; focus?: string; note?: string }[];
  exercise?: { prompt?: string; starterCode?: string; solution?: string };
  recap?: string[];
  decisionGuide?: unknown;
  readingCheck?: unknown;
};

const STOPWORDS = new Set([
  "the", "and", "for", "with", "into", "from", "that", "this", "your", "what", "when",
  "why", "how", "use", "using", "used", "case", "cases", "own", "new", "not", "are",
  "and", "its", "their", "them", "they", "you", "via", "common", "basic", "core",
  "first", "next", "then", "also", "least", "most", "more", "less", "than", "over",
]);

function words(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9_+#.:]+/)
    .map((w) => w.replace(/^[.:]+|[.:]+$/g, ""))
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));
}

function lessonText(lesson: LessonLike): string {
  const parts: string[] = [];
  const push = (value: unknown) => {
    if (typeof value === "string") parts.push(value);
  };
  push(lesson.kind);
  push(lesson.title);
  push(lesson.body);
  push(lesson.explanation);
  push(lesson.focus);
  push(lesson.code);
  push(lesson.exercise?.prompt);
  push(lesson.exercise?.starterCode);
  push(lesson.exercise?.solution);
  for (const line of lesson.notes ?? []) {
    push(line.code);
    push(line.note);
  }
  for (const sample of lesson.samples ?? []) {
    push(sample.title);
    push(sample.code);
    push(sample.output);
    push(sample.focus);
    push(sample.note);
  }
  for (const item of lesson.recap ?? []) push(item);
  const guide = lesson.decisionGuide as Record<string, unknown> | undefined;
  if (guide) {
    for (const value of Object.values(guide)) {
      if (Array.isArray(value)) for (const entry of value) push(typeof entry === "string" ? entry : JSON.stringify(entry));
      else push(typeof value === "string" ? value : JSON.stringify(value));
    }
  }
  const check = lesson.readingCheck as Record<string, unknown> | undefined;
  if (check) for (const value of Object.values(check)) push(JSON.stringify(value));
  return parts.join("\n");
}

const argv = process.argv.slice(2);
const quiet = argv.includes("--quiet");
const targets = argv.filter((a) => !a.startsWith("--"));
const wanted = targets.length === 0 || targets.includes("all") ? courses.map((c) => c.id) : targets;

let candidateCount = 0;
let chapterCount = 0;

for (const id of wanted) {
  const course = courseById(id);
  if (!course) {
    console.log(`!! unknown course ${id}`);
    continue;
  }
  console.log(`\n=== ${course.name} (${id}) ===`);
  for (const chapter of course.chapters) {
    chapterCount += 1;
    const lessons = (chapter.lessons ?? []) as LessonLike[];
    const corpus = new Set(words(lessons.map(lessonText).join("\n")));
    const concepts = [
      ...new Set(
        lessons.flatMap((lesson) => ((lesson as { quality?: { coveredConcepts?: string[] } }).quality?.coveredConcepts ?? [])),
      ),
    ];
    const untraced = concepts.filter((concept) => {
      const terms = words(concept);
      if (terms.length === 0) return false;
      return !terms.some((term) => corpus.has(term));
    });
    const authored = lessons.filter((l) => l.kind && !["learn", "practice", "test"].includes(l.kind));
    if (!quiet) {
      const kinds = lessons.map((l) => `${l.kind}:${(l.title ?? "").slice(0, 34)}`).join(" | ");
      console.log(`ch${String(chapter.number).padStart(2)} [${lessons.length} lessons] ${kinds}`);
    }
    if (untraced.length > 0) {
      candidateCount += untraced.length;
      console.log(`  ch${String(chapter.number).padStart(2)} UNTRACED CONCEPTS: ${untraced.join(" ;; ")}`);
    }
    if (authored.length === 0 && concepts.length > 6) {
      console.log(`  ch${String(chapter.number).padStart(2)} note: ${concepts.length} concepts, no non-generated lesson kinds`);
    }
  }
}

console.log(`\n--- sweep: ${chapterCount} chapters scanned, ${candidateCount} concepts with no textual trace ---`);
