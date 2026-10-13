import { parse as parseHtml } from "parse5";
import * as postcss from "postcss";
import type { HTMLStructureAssertions } from "../data/types";

type TreeNode = {
  nodeName: string;
  tagName?: string;
  attrs?: Array<{ name: string; value: string }>;
  childNodes?: TreeNode[];
  content?: TreeNode;
  value?: string;
  sourceCodeLocation?: unknown;
};

type CssNode = postcss.Root | postcss.Rule | postcss.AtRule | postcss.Declaration | postcss.Comment;

type ParsedDocument = {
  nodes: TreeNode[];
  elements: TreeNode[];
  cssNodes: CssNode[];
  cssErrors: string[];
  doctype: boolean;
};

const elementChildren = (node: TreeNode) => [
  ...(node.childNodes ?? []),
  ...(node.content?.childNodes ?? []),
];

function walkTree(root: TreeNode) {
  const nodes: TreeNode[] = [];
  const pending = [root];
  while (pending.length) {
    const node = pending.pop()!;
    nodes.push(node);
    const children = elementChildren(node);
    for (let index = children.length - 1; index >= 0; index -= 1) pending.push(children[index]);
  }
  return nodes;
}

function textOf(node: TreeNode): string {
  if (node.nodeName === "#text") return node.value ?? "";
  return elementChildren(node).map(textOf).join("");
}

function getAttribute(node: TreeNode, name: string) {
  return node.attrs?.find((attribute) => attribute.name.toLowerCase() === name.toLowerCase())?.value;
}

function hasAttribute(node: TreeNode, name: string) {
  return node.attrs?.some((attribute) => attribute.name.toLowerCase() === name.toLowerCase()) ?? false;
}

function addCssTree(root: CssNode, target: CssNode[]) {
  target.push(root);
  if ("nodes" in root && Array.isArray(root.nodes)) {
    for (const child of root.nodes) addCssTree(child as CssNode, target);
  }
}

function parseDocument(source: string): ParsedDocument {
  const document = parseHtml(source, {
    sourceCodeLocationInfo: true,
  }) as unknown as TreeNode;
  const nodes = walkTree(document);
  const elements = nodes.filter((node) => Boolean(node.tagName));
  const styles = elements.filter((node) => node.tagName === "style").map(textOf).filter(Boolean);
  const inlineStyles = elements.map((node) => getAttribute(node, "style")).filter((value): value is string => Boolean(value?.trim()));
  const explicitElements = elements.filter((node) => node.tagName !== "html" || Boolean(node.sourceCodeLocation));
  const hasMarkup = explicitElements.length > 0;
  const cssSources = styles.length || inlineStyles.length
    ? [...styles, ...inlineStyles.map((value) => `.inline { ${value} }`)]
    : hasMarkup
      ? []
      : [source];
  const cssNodes: CssNode[] = [];
  const cssErrors: string[] = [];

  for (const css of cssSources) {
    if (!css.trim()) continue;
    try {
      const root = postcss.parse(css, { from: undefined });
      addCssTree(root, cssNodes);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      cssErrors.push(message.split("\n")[0]);
    }
  }

  return {
    nodes,
    elements,
    cssNodes,
    cssErrors,
    doctype: nodes.some((node) => node.nodeName === "#documentType"),
  };
}

function declarations(parsed: ParsedDocument) {
  return parsed.cssNodes.filter((node): node is postcss.Declaration => node.type === "decl");
}

function rules(parsed: ParsedDocument) {
  return parsed.cssNodes.filter((node): node is postcss.Rule => node.type === "rule");
}

function atRules(parsed: ParsedDocument) {
  return parsed.cssNodes.filter((node): node is postcss.AtRule => node.type === "atrule");
}

function customPropertyExists(parsed: ParsedDocument) {
  return declarations(parsed).some((declaration) => declaration.prop.startsWith("--"));
}

function containsCssText(parsed: ParsedDocument, text: string) {
  const needle = text.trim().toLowerCase();
  if (!needle) return false;
  return parsed.cssNodes.some((node) => {
    if (node.type === "decl") return `${node.prop}: ${node.value}`.toLowerCase().includes(needle);
    if (node.type === "rule") return node.selector.toLowerCase().includes(needle);
    if (node.type === "atrule") return `@${node.name} ${node.params}`.toLowerCase().includes(needle);
    return false;
  });
}

function includesClassOrId(parsed: ParsedDocument, token: string) {
  const needle = token.replace(/^\./, "").replace(/^#/, "").toLowerCase();
  const attributeName = token.startsWith("#") ? "id" : "class";
  return parsed.elements.some((node) => {
    const value = getAttribute(node, attributeName);
    if (!value) return false;
    return attributeName === "class"
      ? value.split(/\s+/).some((item) => item.toLowerCase() === needle)
      : value.toLowerCase() === needle;
  });
}

function includesAttribute(parsed: ParsedDocument, name: string, value?: string, tag?: string) {
  const normalizedName = name.toLowerCase();
  const normalizedValue = value?.toLowerCase();
  return parsed.elements.some((node) => {
    if (tag && node.tagName !== tag.toLowerCase()) return false;
    const attributeValue = getAttribute(node, normalizedName);
    if (attributeValue === undefined) return false;
    if (normalizedValue === undefined) return true;
    if (normalizedName === "rel") return attributeValue.toLowerCase().split(/\s+/).includes(normalizedValue);
    return attributeValue.toLowerCase() === normalizedValue;
  });
}

function includesText(parsed: ParsedDocument, text: string) {
  const needle = text.trim().toLowerCase();
  if (!needle) return false;
  return parsed.elements.some((node) => textOf(node).toLowerCase().includes(needle));
}

function replaceLiteral(source: string, search: string, replacement: string) {
  return source.split(search).join(replacement);
}

function decodeLegacyPattern(pattern: string) {
  let decoded = pattern;
  const replacements: Array<[string, string]> = [
    ["\\s+", " "], ["\\s*", " "], ["\\.", "."], ["\\(", "("], ["\\)", ")"],
    ["\\[", "["], ["\\]", "]"], ["\\{", "{"], ["\\}", "}"], ["\\?", "?"], ["\\+", "+"],
  ];
  for (const [search, replacement] of replacements) decoded = replaceLiteral(decoded, search, replacement);
  return replaceLiteral(decoded, "\\", "").trim();
}

function elementPatternMatches(parsed: ParsedDocument, token: string) {
  if (token.toLowerCase() === "<!doctype html>") return parsed.doctype;
  if (!token.startsWith("<") || token.length < 2) return undefined;
  let end = 1;
  while (end < token.length && /[a-zA-Z0-9-]/.test(token[end])) end += 1;
  const tag = token.slice(1, end).toLowerCase();
  if (!tag) return undefined;
  const found = parsed.elements.some((node) => {
    if (node.tagName !== tag) return false;
    if (tag === "html" && !node.sourceCodeLocation) return false;
    return true;
  });
  if (!found) return false;
  const suffix = token.slice(end).trim();
  if (suffix.startsWith("lang=") || suffix.startsWith("lang =")) return includesAttribute(parsed, "lang", undefined, tag);
  return true;
}

function attributePatternMatches(parsed: ParsedDocument, token: string) {
  const equalAt = token.indexOf("=");
  if (equalAt <= 0 || token.startsWith("@")) return undefined;
  const name = token.slice(0, equalAt).trim().toLowerCase();
  if (!/^[a-z][a-z0-9:_-]*$/.test(name)) return undefined;
  let value = token.slice(equalAt + 1).trim();
  if (!value) return includesAttribute(parsed, name);
  if ((value.startsWith("\"") && value.endsWith("\"")) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
  return includesAttribute(parsed, name, value);
}

function cssPatternMatches(parsed: ParsedDocument, token: string) {
  const lower = token.toLowerCase();
  if (lower.startsWith("@")) {
    const space = lower.indexOf(" ");
    const name = (space < 0 ? lower.slice(1) : lower.slice(1, space)).trim();
    const params = space < 0 ? "" : lower.slice(space + 1).trim();
    return atRules(parsed).some((rule) => rule.name.toLowerCase() === name && (!params || rule.params.toLowerCase().includes(params)));
  }
  if (lower.startsWith(".") || lower.startsWith(":") || lower.startsWith("&")) {
    return rules(parsed).some((rule) => rule.selector.toLowerCase().includes(lower)) || includesClassOrId(parsed, token);
  }
  if (lower.startsWith("var(") || lower.includes("var(")) return containsCssText(parsed, "var(");
  if (lower === "--") return customPropertyExists(parsed);

  const colon = lower.indexOf(":");
  if (colon > 0 && !lower.includes("::") && !lower.startsWith("http")) {
    const property = lower.slice(0, colon).trim();
    const value = replaceLiteral(lower.slice(colon + 1).trim(), "\\", "").trim();
    return declarations(parsed).some((declaration) => {
      const propertyMatches = declaration.prop.toLowerCase() === property;
      const valueMatches = !value || declaration.value.toLowerCase().includes(value);
      return propertyMatches && valueMatches;
    }) || containsCssText(parsed, replaceLiteral(lower, "\\", ""));
  }

  if (declarations(parsed).some((declaration) => declaration.prop.toLowerCase() === lower)) return true;
  return containsCssText(parsed, lower);
}

function semanticTokenMatches(parsed: ParsedDocument, token: string) {
  const normalized = token.trim().toLowerCase();
  if (normalized === "viewport" || normalized === "description") {
    return includesAttribute(parsed, "name", normalized, "meta");
  }
  if (normalized === "noopener" || normalized === "noreferrer") {
    return parsed.elements.some((node) => node.tagName === "a" && (getAttribute(node, "rel") ?? "").toLowerCase().split(/\s+/).includes(normalized));
  }
  return undefined;
}

function legacyTokenMatches(parsed: ParsedDocument, rawPattern: string) {
  const pattern = decodeLegacyPattern(rawPattern);
  const alternatives = pattern.split("|").map((part: string) => part.trim()).filter(Boolean);
  if (!alternatives.length) return false;
  return alternatives.some((token: string) => {
    const elementMatch = elementPatternMatches(parsed, token);
    if (elementMatch !== undefined) return elementMatch;
    const attributeMatch = attributePatternMatches(parsed, token);
    if (attributeMatch !== undefined) return attributeMatch;
    const semanticMatch = semanticTokenMatches(parsed, token);
    if (semanticMatch !== undefined) return semanticMatch;
    if (cssPatternMatches(parsed, token)) return true;
    return includesText(parsed, token) || includesAttribute(parsed, token) || containsCssText(parsed, token);
  });
}

function hasAccessibleName(parsed: ParsedDocument, node: TreeNode, idMap: Map<string, TreeNode[]>) {
  const ariaLabel = getAttribute(node, "aria-label")?.trim();
  if (ariaLabel) return true;
  const labelledBy = getAttribute(node, "aria-labelledby")?.trim();
  if (labelledBy) {
    const ids = labelledBy.split(/\s+/).filter(Boolean);
    if (ids.length && ids.every((id) => (idMap.get(id)?.length ?? 0) === 1 && textOf(idMap.get(id)![0]).trim().length > 0)) return true;
  }
  const title = getAttribute(node, "title")?.trim();
  if (title) return true;
  const tag = node.tagName ?? "";
  const text = textOf(node).trim();
  if (["a", "button", "summary"].includes(tag) && text) return true;
  if (tag === "img" && getAttribute(node, "alt") !== undefined) return true;
  if (tag === "input") {
    const type = (getAttribute(node, "type") ?? "text").toLowerCase();
    if (["submit", "reset", "button"].includes(type) && getAttribute(node, "value")?.trim()) return true;
    if (type === "image" && getAttribute(node, "alt")?.trim()) return true;
  }
  const id = getAttribute(node, "id");
  if (id && parsed.elements.some((candidate) => candidate.tagName === "label" && getAttribute(candidate, "for") === id && textOf(candidate).trim())) return true;
  for (const label of parsed.elements.filter((candidate) => candidate.tagName === "label")) {
    const control = walkTree(label).some((candidate) => candidate !== label && candidate.tagName === tag && getAttribute(candidate, "id") === id);
    if (control && textOf(label).trim()) return true;
  }
  return false;
}

function isInside(node: postcss.Node, ancestor: postcss.Node) {
  let parent = node.parent;
  while (parent) {
    if (parent === ancestor) return true;
    parent = parent.parent;
  }
  return false;
}

function responsiveLayoutExists(parsed: ParsedDocument) {
  const rulesWithWidthConditions = atRules(parsed).filter((rule) => {
    const name = rule.name.toLowerCase();
    return (name === "media" || name === "container") && /(?:min-|max-)?width/.test(rule.params.toLowerCase());
  });
  const containerQueries = rulesWithWidthConditions.filter((rule) => rule.name.toLowerCase() === "container");
  const layoutProperties = new Set(["display", "grid-template-columns", "grid-template-areas", "grid-area", "flex-direction", "flex-wrap", "gap", "columns", "column-count"]);
  const allDeclarations = declarations(parsed);
  const baseLayout = allDeclarations.some((declaration) => layoutProperties.has(declaration.prop.toLowerCase()) && !rulesWithWidthConditions.some((rule) => isInside(declaration, rule)))
    || (containerQueries.length > 0 && allDeclarations.some((declaration) => declaration.prop.toLowerCase() === "container-type"));
  const responsiveLayout = rulesWithWidthConditions.some((rule) => allDeclarations.some((declaration) => layoutProperties.has(declaration.prop.toLowerCase()) && isInside(declaration, rule)));
  return baseLayout && responsiveLayout;
}

function applyAccessibilityAssertions(parsed: ParsedDocument, assertions: HTMLStructureAssertions, missing: string[]) {
  const idMap = new Map<string, TreeNode[]>();
  for (const node of parsed.elements) {
    const id = getAttribute(node, "id");
    if (id) idMap.set(id, [...(idMap.get(id) ?? []), node]);
  }

  if (assertions.requireUniqueIds) {
    for (const [id, nodes] of idMap) if (nodes.length > 1) missing.push(`duplicate id #${id}`);
  }

  if (assertions.requireImageAlt) {
    for (const image of parsed.elements.filter((node) => node.tagName === "img")) {
      if (!hasAttribute(image, "alt")) missing.push("an img element needs an alt attribute (use alt=\"\" when decorative)");
    }
  }

  if (assertions.requireAssociatedLabels) {
    for (const label of parsed.elements.filter((node) => node.tagName === "label")) {
      const target = getAttribute(label, "for");
      if (target && (idMap.get(target)?.length ?? 0) !== 1) missing.push(`label for=\"${target}\" must reference exactly one existing id`);
    }
  }

  if (assertions.requireAccessibleNames) {
    const controls = parsed.elements.filter((node) => {
      const tag = node.tagName ?? "";
      if (["button", "select", "textarea", "summary"].includes(tag)) return !hasAttribute(node, "hidden");
      if (tag === "a") return getAttribute(node, "href") !== undefined && !hasAttribute(node, "hidden");
      if (tag === "input") return !["hidden", "submit", "reset", "button"].includes((getAttribute(node, "type") ?? "text").toLowerCase()) && !hasAttribute(node, "hidden");
      return false;
    });
    for (const control of controls) {
      if (!hasAccessibleName(parsed, control, idMap)) missing.push(`<${control.tagName}> needs an accessible name`);
      if (control.tagName === "a") {
        const label = textOf(control).trim().toLowerCase();
        if (["click here", "read more", "here"].includes(label)) missing.push("link text should name its destination instead of using a generic phrase");
      }
    }
  }

  if (assertions.requireHeadingOrder) {
    const headings = parsed.elements.filter((node) => /^h[1-6]$/.test(node.tagName ?? ""));
    if (headings.length) {
      const h1Count = headings.filter((node) => node.tagName === "h1").length;
      if (h1Count !== 1) missing.push(`the page outline needs one h1 (found ${h1Count})`);
      let previousLevel = 0;
      for (const heading of headings) {
        const level = Number((heading.tagName ?? "h0").slice(1));
        if (level > previousLevel + 1) missing.push(`heading order skips from h${previousLevel} to h${level}`);
        previousLevel = level;
      }
    }
  }

  if (assertions.requireResponsiveViewport) {
    const viewport = parsed.elements.find((node) => node.tagName === "meta" && getAttribute(node, "name")?.toLowerCase() === "viewport");
    const content = getAttribute(viewport ?? { nodeName: "" }, "content")?.toLowerCase() ?? "";
    if (!viewport || !content.includes("width=device-width")) missing.push("a responsive viewport meta tag with width=device-width");
  }

  if (assertions.requireResponsiveLayout && !responsiveLayoutExists(parsed)) {
    missing.push("a base layout plus a width-based media query or container query that changes layout");
  }
}

function validateExplicitAssertions(parsed: ParsedDocument, assertions: HTMLStructureAssertions, missing: string[], invalidPatterns: string[]) {
  for (const requirement of assertions.requiredElements ?? []) {
    const tag = requirement.tag.trim().toLowerCase();
    if (!/^[a-z][a-z0-9-]*$/.test(tag)) {
      invalidPatterns.push(`invalid HTML element name: ${requirement.tag}`);
      continue;
    }
    const matches = parsed.elements.filter((node) => node.tagName === tag && (requirement.textIncludes === undefined || textOf(node).includes(requirement.textIncludes)));
    const minimum = requirement.minimumCount ?? 1;
    if (matches.length < minimum) missing.push(`<${tag}> count ${matches.length} is below ${minimum}${requirement.textIncludes ? ` with text ${JSON.stringify(requirement.textIncludes)}` : ""}`);
  }

  for (const requirement of assertions.requiredAttributes ?? []) {
    if (!/^[a-z][a-z0-9:_-]*$/i.test(requirement.name)) {
      invalidPatterns.push(`invalid HTML attribute name: ${requirement.name}`);
      continue;
    }
    if (!includesAttribute(parsed, requirement.name, requirement.value, requirement.tag)) {
      missing.push(`attribute ${requirement.name}${requirement.value === undefined ? "" : `=${JSON.stringify(requirement.value)}`}${requirement.tag ? ` on <${requirement.tag}>` : ""}`);
    }
  }

  for (const requirement of assertions.requiredCssDeclarations ?? []) {
    const property = requirement.property.toLowerCase();
    if (!/^[a-z-]+$/.test(property)) {
      invalidPatterns.push(`invalid CSS property name: ${requirement.property}`);
      continue;
    }
    if (!declarations(parsed).some((declaration) => declaration.prop.toLowerCase() === property && (!requirement.valueIncludes || declaration.value.toLowerCase().includes(requirement.valueIncludes.toLowerCase())))) {
      missing.push(`CSS declaration ${property}${requirement.valueIncludes ? ` containing ${JSON.stringify(requirement.valueIncludes)}` : ""}`);
    }
  }

  for (const selector of assertions.requiredCssSelectors ?? []) {
    if (!selector.trim()) {
      invalidPatterns.push("empty CSS selector requirement");
      continue;
    }
    if (!rules(parsed).some((rule) => rule.selector.toLowerCase().includes(selector.toLowerCase()))) missing.push(`CSS selector containing ${JSON.stringify(selector)}`);
  }

  for (const requirement of assertions.requiredAtRules ?? []) {
    const name = requirement.name.replace(/^@/, "").toLowerCase();
    if (!/^[a-z-]+$/.test(name)) {
      invalidPatterns.push(`invalid CSS at-rule name: ${requirement.name}`);
      continue;
    }
    if (!atRules(parsed).some((rule) => rule.name.toLowerCase() === name && (!requirement.paramsIncludes || rule.params.toLowerCase().includes(requirement.paramsIncludes.toLowerCase())))) {
      missing.push(`@${name}${requirement.paramsIncludes ? ` containing ${JSON.stringify(requirement.paramsIncludes)}` : ""}`);
    }
  }
}

function defaultAssertions(checker: { requiredPatterns: string[]; htmlAssertions?: HTMLStructureAssertions }): HTMLStructureAssertions {
  const patterns = checker.requiredPatterns.map(decodeLegacyPattern).join(" ").toLowerCase();
  return {
    requireUniqueIds: true,
    requireAccessibleNames: true,
    requireImageAlt: true,
    requireAssociatedLabels: true,
    requireHeadingOrder: patterns.includes("<h1"),
    requireResponsiveViewport: patterns.includes("viewport"),
    requireResponsiveLayout: (patterns.includes("@media") && (patterns.includes("display: grid") || patterns.includes("display: flex")))
      || (patterns.includes("@container") && patterns.includes("container-type")),
    ...checker.htmlAssertions,
  };
}

export function checkHTMLStructure(
  source: string,
  checker: { requiredPatterns: string[]; requiredOneOf?: string[][]; forbiddenPatterns?: string[]; htmlAssertions?: HTMLStructureAssertions },
) {
  const parsed = parseDocument(source);
  const missing: string[] = [];
  const forbidden: string[] = [];
  const invalidPatterns: string[] = [];
  const emptyPatterns: string[] = [];

  const requiredGroups = [
    ...(checker.requiredPatterns ?? []).map((pattern) => [pattern]),
    ...(checker.requiredOneOf ?? []),
  ];
  for (const group of requiredGroups) {
    if (!group.length) {
      emptyPatterns.push("<empty alternative group>");
      missing.push("one valid DOM or CSS alternative");
      continue;
    }
    const valid = group.filter((pattern) => {
      if (!pattern.trim()) {
        emptyPatterns.push(pattern);
        return false;
      }
      return true;
    });
    if (valid.length && !valid.some((pattern) => legacyTokenMatches(parsed, pattern))) {
      missing.push(`DOM/CSS requirement: ${valid.map(decodeLegacyPattern).join(" OR ")}`);
    }
  }

  for (const pattern of checker.forbiddenPatterns ?? []) {
    if (!pattern.trim()) {
      emptyPatterns.push(pattern);
      continue;
    }
    if (legacyTokenMatches(parsed, pattern)) forbidden.push(`DOM/CSS construct: ${decodeLegacyPattern(pattern)}`);
  }

  const assertions = defaultAssertions(checker);
  validateExplicitAssertions(parsed, assertions, missing, invalidPatterns);
  applyAccessibilityAssertions(parsed, assertions, missing);
  const invalidCode = parsed.cssErrors;

  return {
    passed: missing.length === 0 && forbidden.length === 0 && invalidPatterns.length === 0 && emptyPatterns.length === 0 && invalidCode.length === 0,
    missing,
    forbidden,
    invalidPatterns,
    emptyPatterns,
    invalidCode,
  };
}
