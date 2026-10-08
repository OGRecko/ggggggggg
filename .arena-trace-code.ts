/**
 * Per-lesson promise trace.
 *
 * The gap sweep checks chapter plans, and the teach probe checks a curated construct table.
 * This tool is narrower still: for every lesson, tokens that look like API names, dotted
 * calls, dunders, or qualified std:: names are pulled out of the lesson's own prose
 * (learning goals, keyword notes, recap, decision guide, reading check, exercise prompt and
 * hints) and checked against the code that same lesson ships. A token that a lesson promises
 * but never shows is the interesting case, because the app reads that lesson as teaching it.
 *
 * Exercise hints are checked against the exercise solution alone, since a hint tells the
 * learner what to write.
 *
 * Usage: npx vite-node .arena-trace-code.ts [-- <language>|all] [--quiet]
 */
import { courses } from "./src/courses/catalog";

type AnyLesson = {
  id: string;
  title: string;
  summary?: string;
  learningGoals?: string[];
  keywordNotes?: string[];
  recap?: string[];
  explanation?: string;
  kind?: string;
  decisionGuide?: { use: string; insteadOf: string; reason: string }[];
  readingCheck?: { prompt: string; choices: string[]; explanation: string };
  examples?: { code: string; output?: string }[];
  exercise?: { prompt: string; hints?: string[]; starterCode?: string; solution?: string };
};

const SKIP = new Set(
  [
    "Chapter", "Chapters", "Python", "JavaScript", "Java", "HTML", "CSS", "JSON", "YAML", "SQL",
    "URL", "URLs", "API", "APIs", "JDBC", "JVM", "JRE", "CLI", "IDE", "WASM", "HTTP", "HTTPS",
    "UTF", "ASCII", "UUID", "GUI", "CPU", "RAM", "IP", "TLS", "DNS", "REST", "CRUD", "CSV",
    "Pyodide", "CodeForge", "Node", "NodeJS", "NPM", "EOF", "stdin", "stdout", "stderr",
    "JavaScript's", "Python's", "Java's", "C++'s", "pom.xml", "module-info.java", "build.gradle",
    "package.json", "requirements.txt", "index.html", "styles.css", "app.js", "main.py",
  ].map((t) => t.toLowerCase()),
);

const PATTERNS: RegExp[] = [
  /`([^`\n]+)`/g,
  /\b[a-z_][a-zA-Z0-9_]*\(\)/g,
  /\b(?:std|[a-z_]+)::[A-Za-z_:]+/g,
  /\b[a-z_][a-zA-Z0-9_]*(?:\.[A-Za-z_][a-zA-Z0-9_]*)+\b/g,
  /\b(?:__[a-z][a-z0-9_]*__)\b/g,
  /\b(?:[a-z][a-zA-Z0-9]*[A-Z][a-zA-Z0-9]*|[A-Z][a-z0-9]+[A-Z][A-Za-z0-9]*)\b/g,
];

function tokens(text: string): Set<string> {
  const found = new Set<string>();
  for (const pattern of PATTERNS) {
    for (const match of text.matchAll(pattern)) {
      const token = (match[1] ?? match[0]).trim().replace(/[.,;:]$/, "");
      if (token.length < 3) continue;
      if (/\s/.test(token)) continue;
      if (SKIP.has(token.toLowerCase())) continue;
      if (/^[A-Z0-9]+$/.test(token)) continue;
      found.add(token);
    }
  }
  return found;
}

function variants(token: string): string[] {
  const out = [token, token.replace(/\(\)$/, "")];
  if (token.includes("::")) out.push(token.split("::").pop() as string);
  if (token.includes(".")) {
    const parts = token.split(".");
    out.push(parts[parts.length - 1], parts[parts.length - 2] ?? "");
    out.push(parts.join("."));
  }
  return Array.from(new Set(out.filter((v) => v.length >= 2)));
}

function shown(token: string, code: string): boolean {
  return variants(token).some((variant) => code.includes(variant));
}

function lessonCode(lesson: AnyLesson): string {
  const parts: string[] = [];
  // A declared output is displayed next to its code, so a token that appears only there is still
  // something the lesson shows the learner (an error name such as TypeError, for instance).
  for (const sample of lesson.examples ?? []) parts.push(sample.code, sample.output ?? "");
  if (lesson.exercise) parts.push(lesson.exercise.starterCode ?? "", lesson.exercise.solution ?? "");
  return parts.join("\n");
}

const argv = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const quiet = process.argv.includes("--quiet");
const wanted = argv.length === 0 || argv.includes("all") ? courses.map((c) => c.id) : argv;

let totalFlags = 0;
for (const course of courses) {
  if (!wanted.includes(course.id)) continue;
  const findings: string[] = [];
  for (const chapter of course.chapters) {
    for (const lesson of chapter.lessons as unknown as AnyLesson[]) {
      const code = lessonCode(lesson);
      if (!code.trim()) continue;
      const prose = [
        lesson.title,
        lesson.summary ?? "",
        ...(lesson.learningGoals ?? []),
        ...(lesson.keywordNotes ?? []),
        ...(lesson.recap ?? []),
        ...(lesson.decisionGuide ?? []).flatMap((row) => [row.use, row.insteadOf, row.reason]),
        lesson.readingCheck ? `${lesson.readingCheck.prompt} ${lesson.readingCheck.choices.join(" ")} ${lesson.readingCheck.explanation}` : "",
        lesson.exercise?.prompt ?? "",
        ...(lesson.exercise?.hints ?? []),
      ].join("\n");
      const chapterCode = chapter.lessons
        .map((other) => lessonCode(other as unknown as AnyLesson))
        .join("\n");
      const missing = Array.from(tokens(prose)).filter(
        (token) => !shown(token, code) && !shown(token, chapterCode),
      );
      const elsewhere = Array.from(tokens(prose)).filter(
        (token) => !shown(token, code) && shown(token, chapterCode),
      );
      const solution = lesson.exercise?.solution ?? "";
      const hintMissing = solution
        ? Array.from(tokens((lesson.exercise?.hints ?? []).join("\n"))).filter((token) => !shown(token, solution))
        : [];
      if (missing.length > 0 || hintMissing.length > 0 || elsewhere.length > 0) {
        findings.push(
          `  ${lesson.id} [${lesson.kind ?? "learn"}] ${lesson.title}` +
            (missing.length ? `\n      NOWHERE-IN-CHAPTER: ${missing.join(", ")}` : "") +
            (elsewhere.length ? `\n      shown-elsewhere-in-chapter: ${elsewhere.join(", ")}` : "") +
            (hintMissing.length ? `\n      hint-not-in-solution: ${hintMissing.join(", ")}` : ""),
        );
      }
    }
  }
  totalFlags += findings.length;
  console.log(`\n=== ${course.name} (${course.id}) — ${findings.length} lesson(s) with untraced prose tokens ===`);
  if (!quiet) for (const finding of findings.slice(0, 60)) console.log(finding);
  else if (findings.length) console.log(findings.map((f) => f.trim().split(" ")[0]).join(" "));
  if (findings.length > 60) console.log(`  ... ${findings.length - 60} more`);
}
console.log(`\n--- trace: ${totalFlags} lesson(s) flagged across the requested courses ---`);
