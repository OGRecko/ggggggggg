import type { Exercise } from "../data/types";

export type StructureCheckResult = {
  passed: boolean;
  missing: string[];
  forbidden: string[];
  invalidPatterns: string[];
  emptyPatterns: string[];
};

function stripComments(code: string) {
  return code
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/<!--([\s\S]*?)-->/g, " ")
    .replace(/(^|[^:\\])\/\/.*$/gm, "$1");
}

function compile(pattern: string) {
  if (!pattern.trim()) return { empty: true as const };
  try {
    return { regex: new RegExp(pattern, "is") };
  } catch {
    return { invalid: true as const };
  }
}

function findMissingAlternatives(source: string, groups: string[][], invalidPatterns: string[], emptyPatterns: string[]) {
  const missing: string[] = [];
  for (const group of groups) {
    if (!group.length) {
      emptyPatterns.push("<empty alternative group>");
      missing.push("one valid alternative pattern");
      continue;
    }
    let matched = false;
    const labels: string[] = [];
    for (const pattern of group) {
      const compiled = compile(pattern);
      if ("empty" in compiled) {
        emptyPatterns.push(pattern);
        continue;
      }
      if ("invalid" in compiled) {
        invalidPatterns.push(pattern);
        continue;
      }
      labels.push(pattern);
      if (compiled.regex.test(source)) {
        matched = true;
        break;
      }
    }
    if (!matched) missing.push(`one of: ${labels.join(" || ")}`);
  }
  return missing;
}

// Java, C++, and HTML/CSS exercises use this transparent on-device review.
// It intentionally reports structural evidence only; it never impersonates a compiler.
export function checkRequiredPatterns(code: string, checker: NonNullable<Exercise["checker"]>): StructureCheckResult {
  const source = stripComments(code);
  const invalidPatterns: string[] = [];
  const emptyPatterns: string[] = [];
  const missing: string[] = [];
  const forbidden: string[] = [];

  for (const pattern of checker.requiredPatterns) {
    const compiled = compile(pattern);
    if ("empty" in compiled) {
      emptyPatterns.push(pattern);
      missing.push(pattern);
      continue;
    }
    if ("invalid" in compiled) {
      invalidPatterns.push(pattern);
      missing.push(pattern);
      continue;
    }
    if (!compiled.regex.test(source)) missing.push(pattern);
  }

  for (const pattern of checker.forbiddenPatterns ?? []) {
    const compiled = compile(pattern);
    if ("empty" in compiled) {
      emptyPatterns.push(pattern);
      continue;
    }
    if ("invalid" in compiled) {
      invalidPatterns.push(pattern);
      continue;
    }
    if (compiled.regex.test(source)) forbidden.push(pattern);
  }

  missing.push(...findMissingAlternatives(source, checker.requiredOneOf ?? [], invalidPatterns, emptyPatterns));

  return {
    passed: missing.length === 0 && forbidden.length === 0 && invalidPatterns.length === 0 && emptyPatterns.length === 0,
    missing,
    forbidden,
    invalidPatterns,
    emptyPatterns,
  };
}
