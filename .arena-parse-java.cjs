/**
 * Parses every Java code string of the course with java-parser (a real Java grammar parser).
 * Reports files/rows that are expected Java sketches rather than Java source separately.
 */
const { readFileSync, writeFileSync } = require('node:fs');
const { parse } = require('java-parser');

const rows = JSON.parse(readFileSync('/tmp/java_code.json', 'utf8'));
const SKETCH = /gradle|plugins \{|dependencies \{|implementation |maven|pom\.xml|module-info|requires\s+java/i;

const failures = [];
const sketches = [];
let parsed = 0;

for (const row of rows) {
  if (!row.code || !row.code.trim()) continue;
  try {
    parse(row.code);
    parsed += 1;
  } catch (error) {
    const message = (error && (error.message || String(error))).split('\n')[0];
    const entry = { where: row.where, kind: row.kind, message, code: row.code };
    const looksLikeSketch = SKETCH.test(row.code) || SKETCH.test(message);
    if (looksLikeSketch) sketches.push(entry);
    else failures.push(entry);
  }
}

writeFileSync('/tmp/java_parse_report.json', JSON.stringify({ parsed, failures, sketches }, null, 1));
console.log(`parsed: ${parsed} | genuine parse failures: ${failures.length} | build-file sketches (not Java): ${sketches.length}`);
for (const failure of failures.slice(0, 25)) console.log(`  FAIL ${failure.where} [${failure.kind}] ${failure.message}`);
for (const sketch of sketches.slice(0, 10)) console.log(`  sketch ${sketch.where} [${sketch.kind}]`);
