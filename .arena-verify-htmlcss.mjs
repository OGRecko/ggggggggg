/**
 * Verifies the HTML/CSS course content with real parsers instead of regexes alone:
 *  - parse5 builds the HTML5 tree for every HTML/CSS code string, so required elements must exist as
 *    real elements (not as text inside an attribute or a comment).
 *  - postcss parses every <style> block and every CSS code string, so required declarations must
 *    exist as real rules (a "subgrid" mention inside a comment is not a rule).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire('/tmp/htmlver/');
const { parse, parseFragment } = require('parse5');
const postcss = require('/home/user/ggggggggg/node_modules/postcss');

const rows = JSON.parse(readFileSync('/tmp/htmlcss_code.json', 'utf8'));
const report = { parsedHtml: 0, parsedCss: 0, htmlFailures: [], cssFailures: [], structureFailures: [], unverifiedGradedRows: [] };

function collectElements(node, out = { tags: new Map(), attributes: [] }) {
  if (node.tagName) {
    out.tags.set(node.tagName, (out.tags.get(node.tagName) ?? 0) + 1);
    for (const attribute of node.attrs ?? []) out.attributes.push({ tag: node.tagName, name: attribute.name, value: attribute.value });
  }
  for (const child of node.childNodes ?? []) collectElements(child, out);
  return out;
}

function styleBlocks(code) {
  const blocks = [];
  const pattern = /<style[^>]*>([\s\S]*?)<\/style>/gi;
  let match;
  while ((match = pattern.exec(code))) blocks.push(match[1]);
  return blocks;
}

const ELEMENT_PATTERN = /^<([a-z][a-z0-9-]*)/i;
const DECLARATION_PATTERN = /^([a-z-]+)\s*:\s*\\?/i;

for (const row of rows) {
  if (!row.code || !row.code.trim()) continue;
  // Starter scaffolds intentionally do not contain the answer; only shipped solutions and projects
  // are expected to satisfy the required structure.
  const graded = row.kind === 'solution' || row.kind === 'project';
  if (!graded) { /* still parsed below for syntax, but not compared with required patterns */ }
  const isMarkup = /<[a-z][\s\S]*>/i.test(row.code);

  if (isMarkup) {
    let tree;
    try {
      const parseErrors = [];
      const onParseError = (error) => parseErrors.push(`${error.code} @ line ${error.startLine}`);
      tree = /<html|<body|<main|<header|<footer|<article|<section|<nav|<!doctype/i.test(row.code)
        ? parse(row.code, { onParseError })
        : parseFragment(row.code, { onParseError });
      report.parsedHtml += 1;
      // missing-doctype is expected: the preview iframe renders these fragments through srcDoc.
      const meaningful = parseErrors.filter((error) => !error.startsWith('missing-doctype'));
      if (meaningful.length) report.htmlFailures.push({ where: row.where, kind: row.kind, error: meaningful.join(', ') });
    } catch (error) {
      report.htmlFailures.push({ where: row.where, kind: row.kind, error: String(error.message ?? error) });
      continue;
    }
    const elements = collectElements(tree);
    // Required element patterns must resolve to real elements in the parsed tree.
    const required = graded ? (row.requiredPatterns ?? []).filter((pattern) => ELEMENT_PATTERN.test(pattern)) : [];
    for (const pattern of required) {
      const name = pattern.match(ELEMENT_PATTERN)[1].toLowerCase();
      if (!elements.tags.has(name)) report.structureFailures.push({ where: row.where, kind: row.kind, pattern, reason: 'element missing from the parsed tree' });
    }
    if (graded && required.some((pattern) => /<img/i.test(pattern))) {
      const image = elements.attributes.find((attribute) => attribute.tag === 'img' && attribute.name === 'alt');
      if (!image || !image.value.trim()) report.structureFailures.push({ where: row.where, kind: row.kind, pattern: '<img alt=', reason: 'img has no meaningful alt text in the parsed tree' });
    }
  }

  const cssSources = [...styleBlocks(row.code)];
  const looksLikeCss = !isMarkup && /[a-z-]+\s*:\s*[^;]+;/i.test(row.code);
  let rowVerified = isMarkup;
  if (looksLikeCss && row.kind === 'starter') rowVerified = true;
  if (!isMarkup && /\{[\s\S]*\}/.test(row.code) && !/</.test(row.code)) cssSources.push(row.code);
  if (looksLikeCss) rowVerified = true;
  for (const css of cssSources) {
    let root;
    try {
      root = postcss.parse(css);
      report.parsedCss += 1;
    } catch (error) {
      report.cssFailures.push({ where: row.where, kind: row.kind, error: String(error.reason ?? error.message ?? error) });
      continue;
    }
    if (looksLikeCss || styleBlocks(row.code).length) rowVerified = true;
    if (graded) {
      const declarations = [];
      const atRules = [];
      root.walkDecls((decl) => declarations.push(`${decl.prop}:${decl.value}`));
      root.walkAtRules((rule) => atRules.push(rule.name));
      for (const pattern of row.requiredPatterns ?? []) {
        if (!DECLARATION_PATTERN.test(pattern.replace(/\\\\/g, '\\'))) continue;
        const prop = pattern.replace(/^\\?/, '').split(/[\\:(]/)[0].replace(/\s+/g, '');
        if (!prop || prop.startsWith('<')) continue;
        const inDeclaration = declarations.some((entry) => entry.toLowerCase().startsWith(`${prop.toLowerCase()}:`));
        const inAtRule = atRules.some((name) => name.toLowerCase() === prop.replace(/^@/, '').toLowerCase());
        if (!inDeclaration && !inAtRule) report.structureFailures.push({ where: row.where, kind: row.kind, pattern, reason: `no real CSS rule declares ${prop}` });
      }
    }
  }
  if (graded && !rowVerified) report.unverifiedGradedRows.push({ where: row.where, kind: row.kind, code: row.code.slice(0, 90) });
}

writeFileSync('/tmp/htmlcss_parse_report.json', JSON.stringify(report, null, 1));
console.log(`HTML trees parsed: ${report.parsedHtml} | CSS blocks parsed: ${report.parsedCss}`);
console.log(`HTML parse failures: ${report.htmlFailures.length} | CSS parse failures: ${report.cssFailures.length} | structure mismatches: ${report.structureFailures.length} | graded rows that escaped verification: ${report.unverifiedGradedRows.length}`);
for (const row of report.unverifiedGradedRows.slice(0, 12)) console.log(`  UNVERIFIED ${row.where} [${row.kind}] ${row.code}`);
for (const failure of [...report.htmlFailures, ...report.cssFailures, ...report.structureFailures].slice(0, 20)) {
  console.log(`  ${failure.where} [${failure.kind}] ${failure.reason ?? failure.error}`);
}
