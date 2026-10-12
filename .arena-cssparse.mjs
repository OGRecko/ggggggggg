/**
 * Parses every stylesheet of the HTML/CSS course with css-tree, the CSS parser used by tools like
 * Stylelint and csso, and checks each declaration's property name and value against css-tree's
 * syntax database. The earlier audits looked at this course through an HTML lens — tag balance and
 * parse5 — which never reads a CSS rule at all, so a misspelled property or an impossible value
 * would have passed every check so far.
 *
 * Usage:
 *   npm install --no-save java-parser@3.0.1 css-tree@3.2.1 parse5@8 html-validate@11.16.2 pyodide@0.29.3   # all five audit tools; they are deliberately not app dependencies
 *   npx vite-node .arena-dump-code.ts -- htmlcss
 *   node .arena-cssparse.mjs
 *
 * What is checked, per stylesheet:
 *   1. the CSS parses without a syntax error;
 *   2. every declaration's property is a real CSS property (custom properties excepted, by design);
 *   3. every declaration's value is accepted by the property's grammar in css-tree's database.
 *
 * Two classes of declaration cannot be judged statically and are counted separately rather than
 * called defects: a value containing `var()` depends on substitution at use time, and an `@font-face`
 * descriptor (`src`, `font-display`) is not a property at all — it belongs to the at-rule's own
 * descriptor grammar, which css-tree's property database does not model.
 *
 * Deliberate-break samples are expected to fail 1–3; their lesson is to find the breakage. A
 * deliberate-break sample that passes everything is reported rather than silently counted, because
 * it would mean the lesson asks the learner to hunt for a defect that is not there. Newer syntax
 * that css-tree's database does not know yet is listed separately for adjudication instead of being
 * called a defect, and unknowns are checked against the sample's own text before anything is
 * concluded.
 */
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
let csstree;
try {
  csstree = require("css-tree");
} catch {
  console.error("css-tree is not installed. Run: npm install --no-save css-tree@3.2.1");
  process.exit(2);
}

const rows = JSON.parse(readFileSync("/tmp/htmlcss_code.json", "utf8"));
// "repaired version" is the *fixed* half of a debug pair and is expected to validate cleanly; only
// the broken half (and standalone deliberate breaks) is held to the opposite standard.
const DELIBERATE_BREAK = /broken|deliberate/i;
const STYLE_BLOCK = /<style[^>]*>([\s\S]*?)<\/style>/gi;
const BARE_CSS = /^\s*(?:[.#*:@a-zA-Z\[][^{}<>]*)\{/;

function stylesheetsOf(code) {
  const blocks = [];
  let match;
  STYLE_BLOCK.lastIndex = 0;
  while ((match = STYLE_BLOCK.exec(code)) !== null) blocks.push(match[1]);
  if (blocks.length === 0 && !code.includes("<") && BARE_CSS.test(code)) blocks.push(code);
  return blocks;
}

const stats = {
  stringsWithCss: 0,
  stylesheets: 0,
  parsesClean: 0,
  syntaxErrors: 0,
  unknownProperties: 0,
  invalidValues: 0,
  brokenWithProblems: 0,
  brokenClean: 0,
  deferredToVar: 0,
  fontFaceDescriptors: 0,
};
const anomalies = [];
const adjudicate = new Map();

function note(map, key, where) {
  const entry = map.get(key) ?? { count: 0, where: [] };
  entry.count += 1;
  if (entry.where.length < 4) entry.where.push(where);
  map.set(key, entry);
}

for (const row of rows) {
  const sheets = stylesheetsOf(row.code ?? "");
  if (sheets.length === 0) continue;
  stats.stringsWithCss += 1;
  const broken = DELIBERATE_BREAK.test(row.where);
  const problems = [];

  for (const css of sheets) {
    stats.stylesheets += 1;
    const parseErrors = [];
    let ast = null;
    try {
      ast = csstree.parse(css, {
        positions: false,
        onParseError: (error) => parseErrors.push(error.formattedMessage ?? error.message),
      });
    } catch (error) {
      parseErrors.push(String(error.message ?? error));
    }
    for (const message of parseErrors) problems.push(`syntax: ${String(message).slice(0, 120)}`);

    if (ast) {
      // Descriptors inside @font-face belong to the at-rule's own grammar, not the property
      // database, so they are identified first and excused from property checks.
      const insideFontFace = new WeakSet();
      csstree.walk(ast, {
        visit: "Atrule",
        enter(node) {
          if (String(node.name).toLowerCase() === "font-face" && node.block) {
            csstree.walk(node.block, { visit: "Declaration", enter(declaration) { insideFontFace.add(declaration); } });
          }
        },
      });
      csstree.walk(ast, {
        visit: "Declaration",
        enter(node) {
          const property = node.property;
          if (property.startsWith("--")) return; // custom properties accept anything, by definition
          if (insideFontFace.has(node)) {
            stats.fontFaceDescriptors += 1;
            return;
          }
          const valueText = csstree.generate(node.value);
          if (/\bvar\(/.test(valueText)) {
            stats.deferredToVar += 1; // depends on substitution at use time; no static check can know it
            return;
          }
          const known = csstree.lexer.getProperty(property);
          if (!known) {
            problems.push(`unknown property: ${property}`);
            note(adjudicate, `unknown property: ${property}`, row.where);
            return;
          }
          const valueCheck = csstree.lexer.matchProperty(property, node.value);
          if (valueCheck.error) {
            const short = valueText.slice(0, 90);
            problems.push(`value: ${property}: ${short}`);
            note(adjudicate, `value rejected: ${property}: ${short.match(/^[^\s(]+/)?.[0] ?? short}`, row.where);
          }
        },
      });
    }
  }

  const syntaxProblems = problems.filter((entry) => entry.startsWith("syntax:"));
  const propertyProblems = problems.filter((entry) => entry.startsWith("unknown property:"));
  const valueProblems = problems.filter((entry) => entry.startsWith("value: "));
  stats.syntaxErrors += syntaxProblems.length;
  stats.unknownProperties += propertyProblems.length;
  stats.invalidValues += valueProblems.length;

  if (broken) {
    if (problems.length > 0) stats.brokenWithProblems += 1;
    else {
      stats.brokenClean += 1;
      const htmlHalf = /<broken-/.test(row.code) ? " (the defect is in its HTML half, not its stylesheet)" : "";
      anomalies.push(`BROKEN SAMPLE CLEAN  ${row.where}: the deliberately broken sample's CSS parses and validates, so its defect is not a syntax or value error${htmlHalf}`);
    }
    continue;
  }
  if (problems.length > 0) anomalies.push(`${row.where} [${row.kind}]\n           ${problems.slice(0, 4).join("\n           ")}`);
  else stats.parsesClean += 1;
}

console.log(`css-tree 3.2.1 | ${stats.stringsWithCss} HTML/CSS strings carry CSS (${stats.stylesheets} stylesheets)`);
console.log(`${stats.parsesClean} plain samples parse and validate cleanly | ${stats.brokenWithProblems} deliberate-break samples show their breakage | ${stats.brokenClean} broken samples look clean`);
console.log(`problem counts across all stylesheets: ${stats.syntaxErrors} syntax, ${stats.unknownProperties} unknown property, ${stats.invalidValues} value`);
console.log(`${stats.deferredToVar} declarations defer to var() substitution and ${stats.fontFaceDescriptors} are @font-face descriptors; neither can be judged statically and neither is called a defect`);
if (adjudicate.size > 0) {
  console.log("\nDistinct property/value findings (for adjudication):");
  for (const [key, entry] of [...adjudicate.entries()].sort((a, b) => b[1].count - a[1].count)) {
    console.log(`  ${String(entry.count).padStart(3)}  ${key}\n       e.g. ${entry.where.join("; ")}`);
  }
}
if (anomalies.length > 0) {
  console.log("\nAnomalies:");
  for (const line of anomalies) console.log("  " + line);
}
process.exit(anomalies.some((line) => !line.startsWith("BROKEN SAMPLE CLEAN")) ? 1 : 0);
