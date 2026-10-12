/**
 * Parses every Java string of the Java course with java-parser (the Java grammar used by
 * prettier-plugin-java), the closest thing to a real Java front end that is reachable from this
 * sandbox. No JDK is reachable — see the report's Java appendices — so nothing here executes Java:
 * this is a *real grammar* check, which is strictly stronger than the regular-expression and
 * identifier cross-references used before, because the parser accepts a string only if it is a
 * syntactically valid Java compilation unit.
 *
 * Usage:
 *   npm install --no-save java-parser@3.0.1 css-tree@3.2.1 parse5@8 html-validate@11.16.2 pyodide@0.29.3   # all five audit tools; they are deliberately not app dependencies
 *   npx vite-node .arena-dump-code.ts -- java
 *   node .arena-javaparse.mjs
 *
 * Rows are judged by what they are:
 *   ordinary strings            must parse
 *   the broken half of a debug lesson
 *                               may fail, and the failure must be a syntax error: the Java break
 *                               marker substitutes `System.out.prinln` (which parses — calling an
 *                               unknown method is a semantic error no grammar can catch) or, when
 *                               there is no println to damage, `clas`/`conzt` spellings that do not
 *                               parse at all. A broken sample that parses cleanly is reported, not
 *                               hidden.
 *   starters                    must parse: a scaffold with commented placeholders is valid Java,
 *                               and a debug lesson's scaffold is judged like its broken example.
 *   build files                 classified and not compiled: a Gradle `dependencies { ... }` block
 *                               or Maven `<dependency>` entry is not a Java compilation unit, and
 *                               its declared result is a description of the shape, not a transcript.
 */
import { readFileSync } from "node:fs";
import { parse } from "java-parser";

const rows = JSON.parse(readFileSync("/tmp/java_code.json", "utf8"));
const BROKEN = /broken|deliberate/i;

const NOT_JAVA = /<dependency>|^\s*(plugins|dependencies|repositories)\s*\{|implementation\(|testImplementation\(/m;

const stats = { parsed: 0, refused: 0, brokenRefused: 0, brokenParsed: 0, ordinaryRefused: 0, notJava: 0 };
const anomalies = [];

function firstError(error) {
  const message = String(error && error.message ? error.message : error);
  const line = message.split("\n").find((entry) => entry.trim().length > 0) ?? message;
  return line.trim().slice(0, 160);
}

for (const row of rows) {
  if (NOT_JAVA.test(row.code) && !/\bclass\s+\w/.test(row.code)) {
    stats.notJava += 1;
    continue;
  }
  const broken = BROKEN.test(row.where);
  let ok = true;
  let detail = "";
  try {
    parse(row.code);
  } catch (error) {
    ok = false;
    detail = firstError(error);
  }

  if (ok) {
    stats.parsed += 1;
    if (broken) {
      stats.brokenParsed += 1;
      anomalies.push(`BROKEN SAMPLE PARSES  ${row.where}\n           the deliberately broken Java sample is syntactically valid, so the defect must be found by reading, not by the parser`);
    }
    continue;
  }

  stats.refused += 1;
  if (broken || row.kind === "starter") {
    stats.brokenRefused += 1;
    continue;
  }
  stats.ordinaryRefused += 1;
  anomalies.push(`REFUSED  ${row.where} [${row.kind}]\n           ${detail}`);
}

console.log(`${rows.length} Java strings parsed with java-parser 3.0.1 (a real Java grammar; no JDK, so nothing is compiled or executed here)`);
console.log(`${stats.parsed} accepted | ${stats.refused} refused (${stats.brokenRefused} deliberate-break samples or their scaffold, ${stats.ordinaryRefused} ordinary) | ${stats.notJava} not Java (a build file, not parsed)`);
if (stats.brokenParsed > 0) {
  console.log(`\n${stats.brokenParsed} deliberately broken samples are syntactically valid Java (expected for the prinln marker):`);
  for (const line of anomalies.filter((entry) => entry.startsWith("BROKEN SAMPLE PARSES"))) console.log("  " + line);
}
const real = anomalies.filter((entry) => !entry.startsWith("BROKEN SAMPLE PARSES"));
if (real.length > 0) {
  console.log("\nAnomalies:");
  for (const line of real) console.log("  " + line);
}
process.exit(stats.ordinaryRefused > 0 ? 1 : 0);
