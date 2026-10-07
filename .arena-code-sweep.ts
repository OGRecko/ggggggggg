/**
 * Code-level concept sweep.
 *
 * The earlier plan sweep (`.arena-gap-sweep.ts`) checked whether a chapter-plan concept had any
 * textual trace at all. That was too permissive: a concept named only in prose passed, which is how
 * a chapter that promised ordered and unordered sets while shipping none stayed invisible.
 *
 * This sweep splits the corpus in two. For every chapter of every course it collects the concepts
 * the chapter plan promises (the lessons' `quality.coveredConcepts`), then asks two separate
 * questions: does any significant word of the concept appear in the chapter's *code* (example code,
 * starters, solutions, project code, edge code), and does it appear in the chapter's *prose*
 * (titles, explanations, notes, hints, recaps, guides, reading checks)?
 *
 * A concept with a prose trace but no code trace is "named, not shown" — a candidate gap that a
 * human still has to read. A concept with no trace at all is a plan promise with no fulfilment.
 *
 * Usage: npx vite-node .arena-code-sweep.ts [-- <course>|all]
 */
import { courses, courseById } from "./src/courses/catalog";

const STOPWORDS = new Set([
  "the","and","for","with","into","from","that","this","your","what","when","why","how","use","using",
  "used","case","cases","own","new","not","are","its","their","them","they","you","via","common","basic",
  "core","first","next","then","also","least","most","more","less","than","over","all","any","one","two",
  "three","between","both","other","another","each","every","sign","state","type","types","name","names",
  "value","values","data","code","program","rules","rule","设计",
]);

function words(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9_+#.:]+/)
    .map((w) => w.replace(/^[.:]+|[.:]+$/g, ""))
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));
}

type Corpora = { code: string[]; prose: string[] };

function collect(node: unknown, keyHint: string, out: Corpora): void {
  if (typeof node === "string") {
    if (/^(code|starterCode|solution|edgeCode)$/i.test(keyHint)) out.code.push(node);
    else out.prose.push(node);
    return;
  }
  if (Array.isArray(node)) {
    for (const item of node) collect(item, keyHint, out);
    return;
  }
  if (node && typeof node === "object") {
    for (const [key, value] of Object.entries(node as Record<string, unknown>)) collect(value, key, out);
  }
}

const argv = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const wanted = argv.length === 0 || argv.includes("all") ? courses.map((c) => c.id) : argv;

let namedNotShown = 0;
let untraced = 0;
let chaptersScanned = 0;

for (const id of wanted) {
  const course = courseById(id);
  if (!course) {
    console.log(`!! unknown course ${id}`);
    continue;
  }
  console.log(`\n=== ${course.name} (${id}) ===`);
  for (const chapter of course.chapters) {
    chaptersScanned += 1;
    const corpora: Corpora = { code: [], prose: [] };
    const concepts = new Set<string>();
    for (const lesson of chapter.lessons) {
      collect(lesson, "lesson", corpora);
      for (const concept of (lesson.quality?.coveredConcepts ?? [])) concepts.add(concept);
    }
    if (chapter.project) collect(chapter.project, "project", corpora);
    const codeWords = new Set(words(corpora.code.join("\n")));
    const proseWords = new Set(words(corpora.prose.join("\n")));
    const namedOnly: string[] = [];
    const missingEverywhere: string[] = [];
    for (const concept of concepts) {
      const terms = words(concept);
      if (terms.length === 0) continue;
      const codeText = corpora.code.join("\n").toLowerCase();
      const inCode = terms.some((t) => codeWords.has(t) || codeText.includes(t) || codeText.includes(t.replace(/s$/, "")) || codeText.includes(t + "s"));
      if (inCode) continue;
      const proseText = corpora.prose.join("\n").toLowerCase();
      const inProse = terms.some((t) => proseWords.has(t) || proseText.includes(t));
      if (inProse) namedOnly.push(concept);
      else missingEverywhere.push(concept);
    }
    if (namedOnly.length) {
      namedNotShown += namedOnly.length;
      console.log(`  ch${String(chapter.number).padStart(2)} [${chapter.title}] NAMED-NOT-SHOWN: ${namedOnly.join(" ;; ")}`);
    }
    if (missingEverywhere.length) {
      untraced += missingEverywhere.length;
      console.log(`  ch${String(chapter.number).padStart(2)} [${chapter.title}] NO-TRACE-AT-ALL: ${missingEverywhere.join(" ;; ")}`);
    }
  }
}

console.log(`\n--- code sweep: ${chaptersScanned} chapters | ${namedNotShown} named-not-shown | ${untraced} with no trace ---`);
