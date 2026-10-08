/**
 * Parses every HTML/CSS string of the HTML/CSS course with parse5, the reference implementation of
 * the HTML5 tree-construction algorithm, and reports what a real parser recovers from it. This is
 * a stronger check than the hand-written tag balance used earlier: the tag balance only counts
 * angle brackets, while parse5 follows the specification's error recovery and reports its own
 * diagnostics for the constructs the specification calls errors.
 *
 * Usage:
 *   npm install --no-save parse5                 # audit-only dependency; the app never parses HTML
 *   npx vite-node .arena-dump-code.ts -- htmlcss # writes /tmp/htmlcss_code.json
 *   node .arena-htmlparse.mjs
 *
 * A lesson example whose title marks it as the deliberately broken half of a debug lesson
 * ("broken version", "Repair this deliberately broken ... example") is expected to recover badly;
 * every other string is required to parse with zero reported errors. Samples that are not markup —
 * a bare CSS rule, a code comment — are counted separately rather than judged, because a parser
 * has no markup to follow and its "errors" would describe the absence of tags.
 */
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
let parse5;
try {
  parse5 = require("parse5");
} catch {
  console.error("parse5 is not installed. Run: npm install --no-save parse5");
  process.exit(2);
}

const rows = JSON.parse(readFileSync("/tmp/htmlcss_code.json", "utf8"));
const DELIBERATE_BREAK = /broken|repair|deliberate/i;
const LOOKS_LIKE_MARKUP = /<[a-zA-Z!/]/;

const summary = {
  parsed: 0,
  clean: 0,
  errorsOnOrdinary: 0,
  errorsOnDeliberate: 0,
  notMarkup: 0,
  documents: 0,
  fragments: 0,
};
const anomalies = [];
const errorCounts = new Map();

for (const row of rows) {
  const code = row.code ?? "";
  if (!LOOKS_LIKE_MARKUP.test(code)) {
    summary.notMarkup += 1;
    continue;
  }
  const errors = [];
  const onParseError = (error) => errors.push(error.code);
  if (/<!doctype|<html[\s>]/i.test(code)) {
    summary.documents += 1;
    parse5.parse(code, { onParseError, sourceCodeLocationInfo: false });
  } else {
    summary.fragments += 1;
    parse5.parseFragment(code, { onParseError, sourceCodeLocationInfo: false });
  }
  summary.parsed += 1;

  const deliberate = DELIBERATE_BREAK.test(row.where);
  if (errors.length === 0) {
    summary.clean += 1;
    if (deliberate) {
      // Not a claim either way: a debug sample can be broken in a way the tree construction
      // algorithm silently recovers from (an unclosed tag, for instance, is not an error).
    }
    continue;
  }
  for (const code of new Set(errors)) errorCounts.set(code, (errorCounts.get(code) ?? 0) + 1);
  if (deliberate) {
    summary.errorsOnDeliberate += 1;
    continue;
  }
  summary.errorsOnOrdinary += 1;
  anomalies.push(`${row.where} [${row.kind}] -> ${[...new Set(errors)].join(", ")}`);
}

console.log(`${rows.length} HTML/CSS strings | ${summary.parsed} parsed as markup (${summary.documents} documents, ${summary.fragments} fragments) | ${summary.notMarkup} not markup`);
console.log(
  `${summary.clean} parsed without a reported error | ${summary.errorsOnDeliberate} deliberate-break samples recovered with errors (expected) | ${summary.errorsOnOrdinary} ordinary samples with reported errors`,
);
if (errorCounts.size > 0) {
  console.log("\nError codes seen:");
  for (const [code, count] of [...errorCounts.entries()].sort((a, b) => b[1] - a[1])) console.log(`  ${count.toString().padStart(3)}  ${code}`);
}
if (anomalies.length > 0) {
  console.log("\nOrdinary samples a real parser reports errors for:");
  for (const line of anomalies) console.log("  " + line);
}
process.exit(summary.errorsOnOrdinary === 0 ? 0 : 1);
