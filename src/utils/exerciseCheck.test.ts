import { describe, expect, it } from "vitest";
import { checkRequiredPatterns } from "./exerciseCheck";

describe("pattern-only static code review", () => {
  it("passes when required Java/C++ source patterns are present", () => {
    const result = checkRequiredPatterns('class Main { System.out.println("ok"); }', { mode: "patterns", requiredPatterns: ["class\\s+Main", "System\\.out\\.println"] });
    expect(result.passed).toBe(true);
    expect(result.missing).toEqual([]);
    expect(result.invalidCode).toEqual([]);
  });

  it("fails when a required source pattern is missing", () => {
    const result = checkRequiredPatterns("class Main { }", { mode: "patterns", requiredPatterns: ["System\\.out\\.println"] });
    expect(result.passed).toBe(false);
    expect(result.missing).toContain("System\\.out\\.println");
  });

  it("detects forbidden source patterns", () => {
    const result = checkRequiredPatterns('System.out.prinln("oops");', { mode: "patterns", requiredPatterns: [], forbiddenPatterns: ["prinln"] });
    expect(result.passed).toBe(false);
    expect(result.forbidden).toContain("prinln");
  });

  it("reports invalid regex patterns instead of throwing", () => {
    const result = checkRequiredPatterns('console.log("ok")', { mode: "patterns", requiredPatterns: ["console("] });
    expect(result.passed).toBe(false);
    expect(result.invalidPatterns).toContain("console(");
  });

  it("reports empty patterns honestly", () => {
    const result = checkRequiredPatterns('console.log("ok")', { mode: "patterns", requiredPatterns: [""] });
    expect(result.passed).toBe(false);
    expect(result.emptyPatterns).toContain("");
  });

  it("reports an empty pattern inside an alternative group", () => {
    const result = checkRequiredPatterns('console.log("ok")', { mode: "patterns", requiredPatterns: [], requiredOneOf: [[""]] });
    expect(result.passed).toBe(false);
    expect(result.emptyPatterns).toContain("");
  });

  it("reports an empty alternative group as a missing requirement", () => {
    const result = checkRequiredPatterns('console.log("ok")', { mode: "patterns", requiredPatterns: [], requiredOneOf: [[]] });
    expect(result.passed).toBe(false);
    expect(result.emptyPatterns).toContain("<empty alternative group>");
    expect(result.missing).toContain("one valid alternative pattern");
  });

  it("reports an invalid regex inside an alternative group instead of throwing", () => {
    const result = checkRequiredPatterns('console.log("ok")', { mode: "patterns", requiredPatterns: [], requiredOneOf: [["console("]] });
    expect(result.passed).toBe(false);
    expect(result.invalidPatterns).toContain("console(");
  });

  it("reports empty and invalid forbidden patterns instead of throwing, and refuses to pass", () => {
    const result = checkRequiredPatterns('console.log("ok")', { mode: "patterns", requiredPatterns: ["console"], forbiddenPatterns: ["", "console("] });
    expect(result.emptyPatterns).toContain("");
    expect(result.invalidPatterns).toContain("console(");
    expect(result.passed).toBe(false);
  });

  it("accepts one valid alternative from a requiredOneOf group", () => {
    const result = checkRequiredPatterns("const value = 1;", { mode: "patterns", requiredPatterns: [], requiredOneOf: [["let\\s+value", "const\\s+value"]] });
    expect(result.passed).toBe(true);
  });

  it("fails when no alternative source pattern matches", () => {
    const result = checkRequiredPatterns("var value = 1;", { mode: "patterns", requiredPatterns: [], requiredOneOf: [["let\\s+value", "const\\s+value"]] });
    expect(result.passed).toBe(false);
    expect(result.missing[0]).toContain("one of:");
  });

  it("does not count comment-only matches as a passing source check", () => {
    const result = checkRequiredPatterns('// console.log("fake")', { mode: "patterns", requiredPatterns: ["console\\.log"] });
    expect(result.passed).toBe(false);
  });
});

describe("DOM and parsed-CSS structure review", () => {
  it("checks actual elements and label association instead of matching source fragments", () => {
    const checker = {
      mode: "html" as const,
      requiredPatterns: ["<form", "<label", "for=\\\"email\\\"", "id=\\\"email\\\"", "type=\\\"email\\\"", "required"],
    };
    const correct = '<form><label for="email">Email</label><input id="email" name="email" type="email" required></form>';
    expect(checkRequiredPatterns(correct, checker).passed).toBe(true);

    const commented = '<!-- <form><label for="email">Email</label><input id="email" name="email" type="email" required> -->';
    const rejected = checkRequiredPatterns(commented, checker);
    expect(rejected.passed).toBe(false);
    expect(rejected.missing.some((item) => item.includes("DOM/CSS requirement"))).toBe(true);
  });

  it("checks accessible control names, image alternatives, and valid label targets", () => {
    const result = checkRequiredPatterns('<form><input id="email"><button></button><img src="course.png"></form>', {
      mode: "html",
      requiredPatterns: ["<form"],
    });
    expect(result.passed).toBe(false);
    expect(result.missing).toContain("<input> needs an accessible name");
    expect(result.missing).toContain("<button> needs an accessible name");
    expect(result.missing).toContain('an img element needs an alt attribute (use alt="" when decorative)');
  });

  it("checks heading order rather than accepting a tag-shaped comment", () => {
    const result = checkRequiredPatterns('<main><h1>Page</h1><h3>Skipped</h3><!-- <h2>fake</h2> --></main>', {
      mode: "html",
      requiredPatterns: ["<main", "<h1", "<h2"],
    });
    expect(result.passed).toBe(false);
    expect(result.missing.some((item) => item.includes("heading order skips from h1 to h3"))).toBe(true);
  });

  it("checks base and width-query layout rules through a CSS syntax tree", () => {
    const result = checkRequiredPatterns('<style>.grid { display: grid; grid-template-columns: 1fr; } @media (min-width: 40rem) { .grid { grid-template-columns: 1fr 1fr; } }</style><main><section class="grid"><h1>Courses</h1></section></main>', {
      mode: "html",
      requiredPatterns: ["display:\\s*grid", "grid-template-columns", "@media"],
    });
    expect(result.passed).toBe(true);
    expect(result.invalidCode).toEqual([]);
  });

  it("does not report a layout pass when the only grid rule is fixed to one mode", () => {
    const result = checkRequiredPatterns('<style>.grid { display: grid; grid-template-columns: 1fr; }</style><main><section class="grid"><h1>Courses</h1></section></main>', {
      mode: "html",
      requiredPatterns: ["display:\\s*grid", "grid-template-columns", "@media"],
    });
    expect(result.passed).toBe(false);
    expect(result.missing.some((item) => item.includes("width-based media query"))).toBe(true);
  });

  it("checks container-query column changes against a container context and responsive rule", () => {
    const checker = { mode: "html" as const, requiredPatterns: ["container-type", "@container"] };
    const responsive = '<style>.card { container-type: inline-size; } @container (min-width: 30rem) { .card p { columns: 2; } }</style><article class="card"><p>Responsive component text.</p></article>';
    expect(checkRequiredPatterns(responsive, checker).passed).toBe(true);

    const decorationOnly = '<style>.card { container-type: inline-size; } @container (min-width: 30rem) { .card p { color: rebeccapurple; } }</style><article class="card"><p>Responsive component text.</p></article>';
    expect(checkRequiredPatterns(decorationOnly, checker).passed).toBe(false);
  });

  it("matches metadata names and safe-link rel tokens as attributes, not prose", () => {
    const checker = { mode: "html" as const, requiredPatterns: ["viewport", "description", "noopener", "noreferrer"] };
    const correct = '<head><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="description" content="Course notes"></head><a href="https://example.test" target="_blank" rel="noopener noreferrer">Reference</a>';
    expect(checkRequiredPatterns(correct, checker).passed).toBe(true);

    const proseOnly = '<p>viewport description noopener noreferrer</p><a href="https://example.test" target="_blank">Reference</a>';
    const rejected = checkRequiredPatterns(proseOnly, checker);
    expect(rejected.passed).toBe(false);
    expect(rejected.missing).toContain("DOM/CSS requirement: viewport");
    expect(rejected.missing).toContain("DOM/CSS requirement: description");
    expect(rejected.missing).toContain("DOM/CSS requirement: noopener");
    expect(rejected.missing).toContain("DOM/CSS requirement: noreferrer");
  });

  it("supports source comments without letting them satisfy HTML or CSS assertions", () => {
    const result = checkRequiredPatterns('<main><!-- <h1>Fake heading</h1> --></main>', {
      mode: "html",
      requiredPatterns: ["<h1"],
    });
    expect(result.passed).toBe(false);
    expect(result.missing.some((item) => item.includes("DOM/CSS requirement"))).toBe(true);
  });
});
