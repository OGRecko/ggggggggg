/**
 * Executes every shipped JavaScript code string through a faithful replica of the app's own
 * sandboxed Worker (same console.stringification, same blocked globals, same async settling) and
 * compares the result with the declared expected output.
 */
import { readFileSync } from 'node:fs';

const rows = JSON.parse(readFileSync('/tmp/js_snippets.json', 'utf8'));

const stringifyValue = (value) => {
  if (typeof value === 'string') return value;
  if (typeof value === 'undefined') return 'undefined';
  if (typeof value === 'function') return '[function]';
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
};

async function runLikeWorker(code) {
  const output = [];
  const pushLine = (line) => output.push(String(line));
  const log = (...values) => pushLine(values.map(stringifyValue).join(' '));
  const blocked = () => {
    throw new Error('CodeForge blocks browser-side networking and nested worker creation in the JavaScript runner.');
  };
  try {
    const runner = new Function(
      'console', 'globalThis', 'self', 'fetch', 'XMLHttpRequest', 'WebSocket', 'EventSource',
      'Worker', 'SharedWorker', 'importScripts', 'postMessage', 'close', 'Function', 'eval',
      '"use strict";\n' + code,
    );
    const shared = Object.freeze({ setTimeout, clearTimeout, setInterval, clearInterval, Promise, Math, Date, JSON });
    const result = runner({ log, error: log, warn: log, info: log }, shared, shared, blocked, blocked, blocked, blocked, blocked, blocked, blocked, blocked, blocked, undefined, undefined);
    await Promise.resolve(result);
    await Promise.resolve();
    return { output: output.join('\n'), error: null };
  } catch (error) {
    return { output: output.join('\n'), error: error && error.message ? error.message : String(error) };
  }
}

const BROWSER_ONLY = ['document.', 'localStorage', 'window.', 'alert('];
const browserOnly = [];
const mismatches = [];
const errors = [];
let matched = 0;

for (const row of rows) {
  const code = row.code;
  if (!code || !code.trim()) continue;
  const isBrowserOnly = BROWSER_ONLY.some((marker) => code.includes(marker));
  const result = await runLikeWorker(code);

  if (isBrowserOnly) {
    const claimsConsoleTranscript = Boolean(row.output) && !/browser|preview|structural/i.test(row.output);
    browserOnly.push({ row, error: result.error, claimsConsoleTranscript });
    continue;
  }
  if (result.error) {
    errors.push({ row, error: result.error, output: result.output });
    continue;
  }
  const declared = (row.output ?? '').trim();
  if (declared && result.output !== declared) {
    mismatches.push({ row, declared, actual: result.output });
  } else {
    matched += 1;
  }
}

console.log(`matched: ${matched}`);
console.log(`\nbrowser-only rows: ${browserOnly.length} (rows whose declared output is not labelled as browser/structural):`);
for (const entry of browserOnly) {
  console.log(`  ${entry.claimsConsoleTranscript ? 'NEEDS-LABEL' : 'labelled  '} ${entry.row.where} [${entry.row.kind}] declared=${JSON.stringify((entry.row.output ?? '').slice(0, 80))} error=${entry.error}`);
}
console.log(`\nunexpected runtime errors: ${errors.length}`);
for (const entry of errors.slice(0, 20)) {
  console.log(`  ${entry.row.where} [${entry.row.kind}]: ${entry.error} | declared=${JSON.stringify((entry.row.output ?? '').slice(0, 60))}`);
}
console.log(`\noutput mismatches: ${mismatches.length}`);
for (const entry of mismatches.slice(0, 60)) {
  console.log(`  ${entry.row.where} [${entry.row.kind}]`);
  console.log(`     declared: ${JSON.stringify(entry.declared.slice(0, 90))}`);
  console.log(`     actual  : ${JSON.stringify(entry.actual.slice(0, 90))}`);
}
