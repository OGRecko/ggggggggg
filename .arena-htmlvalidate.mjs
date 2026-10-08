/**
 * Validates every HTML string of the HTML/CSS course with html-validate 11, a conformance validator
 * built on the HTML standard's content models, using its `html-validate:standard` preset. The earlier
 * audits read this corpus through a tree-construction lens (parse5) and a hand-written tag balance,
 * neither of which knows the content models: only a validator can tell you that `<main>` may not be a
 * descendant of `<article>`, or that a `<head>` in a document needs a `<title>`.
 *
 * Usage:
 *   npm install --no-save java-parser@3.0.1 css-tree@3.2.1 parse5@8 html-validate@11.16.2 pyodide@0.29.3   # all five audit tools; they are deliberately not app dependencies
 *   npx vite-node .arena-dump-code.ts -- htmlcss
 *   node .arena-htmlvalidate.mjs
 *
 * Rows are judged in context, exactly as the other audits judge them:
 *
 *   ordinary samples       must validate with no findings at all
 *   deliberate breaks      the broken half of a debug pair, its scaffold, and any sample whose title
 *                          says "broken": findings are expected, and a break with no finding is
 *                          reported so a lesson never asks for a defect that is not there
 *   other scaffolds        a starter that is not a break is an instruction, not a document: comments
 *                          standing in for the elements the learner must write are reported for
 *                          information and are not counted as defects
 *
 * Scope note, stated plainly: the course's samples are fragments — the app previews them in its own
 * frame, and chapter 1 teaches the full document shell separately. The validator therefore reads a
 * fragment as a document with synthesized html/body element wrappers, so whole-document rules
 * (a head must contain a title, metadata content must not sit in the body) describe the fragment's
 * implied document rather than a file the course ships. Those two rule families are reported
 * separately so the reader can see exactly which findings they account for.
 */
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
let HtmlValidate;
try {
  ({ HtmlValidate } = require("html-validate"));
} catch {
  console.error("html-validate is not installed. Run: npm install --no-save html-validate@11.16.2");
  process.exit(2);
}

const rows = JSON.parse(readFileSync("/tmp/htmlcss_code.json", "utf8"));
const BROKEN_TITLE = /broken|deliberate/i;
const MARKUP = /<[a-zA-Z!/]/;
// The two rules that describe an implied whole document rather than a fragment.
const WHOLE_DOCUMENT_RULES = new Set(["element-required-content", "element-permitted-content"]);

const validator = new HtmlValidate({ extends: ["html-validate:standard"] });
const stats = { markup: 0, ordinaryClean: 0, ordinaryFindings: [], breaks: 0, breaksClean: [], scaffolds: 0, scaffoldFindings: [] };
const byRule = new Map();

for (const row of rows) {
  const code = row.code ?? "";
  if (!MARKUP.test(code)) continue;
  stats.markup += 1;

  const report = await validator.validateString(code);
  const findings = [];
  for (const result of report.results) {
    for (const message of result.messages) findings.push(`${message.ruleId}: ${message.message}`);
  }

  // A row is a break only when it carries the break itself: its own title says "broken", or it is
  // the scaffold of a lesson whose example is broken. The repaired half and the solution of a debug
  // lesson are the fixes, so they are held to the ordinary standard like every other sample.
  const isBreak = BROKEN_TITLE.test(row.where) || (row.kind === "starter" && row.lessonHasBrokenExample === true);
  const isScaffold = !isBreak && row.kind === "starter";

  if (findings.length === 0) {
    if (isBreak) stats.breaksClean.push(row.where);
    else if (isScaffold) stats.scaffolds += 1;
    else stats.ordinaryClean += 1;
    continue;
  }

  for (const finding of findings) {
    const rule = finding.split(":")[0];
    byRule.set(rule, (byRule.get(rule) ?? 0) + 1);
  }

  if (isBreak) {
    stats.breaks += 1;
    continue;
  }
  if (isScaffold) {
    stats.scaffoldFindings.push(`${row.where}: ${findings[0]}`);
    continue;
  }
  stats.ordinaryFindings.push(`${row.where} [${row.kind}]\n           ${findings.slice(0, 4).join("\n           ")}`);
}

console.log(`html-validate:standard | ${stats.markup} markup strings checked`);
console.log(`${stats.ordinaryClean} ordinary samples validate with no findings | ${stats.breaks} deliberate-break samples show their breakage | ${stats.breaksClean.length} break samples with no structural finding | ${stats.scaffolds} scaffolds are complete enough to validate | ${stats.scaffoldFindings.length} scaffolds are incomplete by design`);
if (stats.breaksClean.length > 0) {
  console.log(`\n${stats.breaksClean.length} deliberate-break samples produce no validator finding (their break is semantic, not structural):`);
  for (const line of stats.breaksClean.slice(0, 12)) console.log("  " + line);
}
if (stats.scaffoldFindings.length > 0) {
  console.log("\nIncomplete scaffolds (informational: comments stand in for the learner's elements):");
  for (const line of stats.scaffoldFindings.slice(0, 12)) console.log("  " + line);
}
console.log("\nFindings by rule across the whole corpus:");
for (const [rule, count] of [...byRule.entries()].sort((a, b) => b[1] - a[1])) {
  const scope = WHOLE_DOCUMENT_RULES.has(rule) ? "  (describes an implied whole document)" : "";
  console.log(`  ${String(count).padStart(4)}  ${rule}${scope}`);
}
if (stats.ordinaryFindings.length > 0) {
  console.log("\nAnomalies: ordinary samples with findings");
  for (const line of stats.ordinaryFindings) console.log("  " + line);
}
process.exit(stats.ordinaryFindings.length > 0 ? 1 : 0);
