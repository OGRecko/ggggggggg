import type { Example } from "../data/types";
import { authoredLesson, type LessonOverrideLibrary } from "./chapterPlanHelpers";

/**
 * Authored gap lessons for the HTML/CSS course. Each entry teaches a topic that the course plan
 * promised but never demonstrated in code: data tables (Chapter 2), named grid areas (Chapter 8),
 * CSS nesting and feature queries (Chapter 13), keyframe animation (Chapter 14), responsive media
 * (Chapter 16), dark-mode tokens (Chapter 19), and real positioning (Chapter 22).
 *
 * Verification boundary: these lessons are rendered by the sandboxed preview iframe and checked by
 * the on-device structure checker. No screenshot comparison, Lighthouse run, or assistive-technology
 * audit is claimed anywhere in this file.
 */
const webMistakes: Example["mistakes"] = [
  { mistake: "Choosing an element for how it looks instead of what the content is", error: "The page renders but its structure stops describing the content, which weakens accessibility and maintainability", fix: "Pick the element that matches the meaning first, then style it with CSS." },
  { mistake: "Leaving a visual effect as the only signal of state", error: "Keyboard and assistive-technology users miss the change", fix: "Keep a real state change or an explicit text label alongside any visual enhancement." },
  { mistake: "Claiming a browser or accessibility behaviour that was never measured in this environment", error: "The lesson overstates what the preview can prove", fix: "Describe what the preview shows and label the boundary honestly." },
];

const example = (title: string, code: string, output: string, explanation: string, lines: string[]): Example => ({
  title,
  code,
  output,
  explanation,
  lines,
  mistakes: webMistakes,
});

const verification: NonNullable<import("../data/types").Lesson["verification"]> = ["previewed", "structurally-checked"];

export const htmlcssGapLessons: LessonOverrideLibrary = {
  2: {
    read: authoredLesson({
      title: "Tables for tabular data",
      minutes: 20,
      summary: "Read a data table as a relationship between two dimensions: a caption that names it, a header row and header column that label the axes, and data cells that fill the grid.",
      learningGoals: [
        "Structure a table with caption, thead, tbody, th, and td",
        "Choose scope=col or scope=row from the axis a header describes",
        "Explain why page layout belongs to CSS Grid rather than table markup",
      ],
      explanation: "A table is a semantic statement about data: this value belongs to that row header and that column header. The caption names the whole table, thead and tbody separate the header rows from the data rows, and each th carries scope so the relationship is explicit for assistive technology instead of being implied by position. td holds the data itself. Because the element set exists for data relationships, using tables to lay out a page is the classic misuse: the markup then claims a data relationship that does not exist. Page layout belongs to Flexbox and Grid, where the CSS describes the geometry and the HTML stays honest. When a wide table genuinely cannot fit a narrow screen, the honest fix is a scrolling container around the real table, not a rebuild out of divs that discards the semantics.",
      keywordNotes: [
        "caption is the table's accessible name and should describe what the data is about, not say \"Table\".",
        "thead groups header rows and tbody groups data rows, so the structure survives styling and screen-reader navigation.",
        "scope=\"col\" marks a header that labels a column, and scope=\"row\" marks one that labels the rest of its row.",
        "td is for data cells; a th where a td belongs (or the reverse) changes the meaning of the grid.",
        "Layout is a CSS job: Grid and Flexbox place boxes, while tables express relationships between values.",
      ],
      examples: [
        example(
          "A minimal data table",
          '<table>\n  <caption>Course progress</caption>\n  <thead>\n    <tr><th scope="col">Lesson</th><th scope="col">Status</th></tr>\n  </thead>\n  <tbody>\n    <tr><th scope="row">Loops</th><td>Passed</td></tr>\n  </tbody>\n</table>',
          "Browser preview: a data table captioned Course progress with a header row and one row-header cell.",
          "The caption names the table, the header row labels both columns, and the row header labels the data in its own row, so the value Passed is connected to both Loops and Status without relying on visual position alone.",
          [
            "Line 1: table opens the data relationship; every element inside it will describe one cell of that relationship.",
            "Line 2: caption names the whole table for every reader, including someone navigating by table rather than by sight.",
            "Line 3: thead marks the group of rows that label the columns, which is different from the rows that carry data.",
            "Line 4: one header row holds two th cells, and each scope=\"col\" states which column the header labels.",
            "Line 5: closing thead keeps the header group separate from the data that follows, so the browser can expose them differently.",
            "Line 6: tbody opens the data region where each row is one record rather than one label.",
            "Line 7: the first cell is a th with scope=\"row\" because it labels the rest of this row, while the second cell is a td that holds the value.",
            "Line 8: closing tbody ends the data group after exactly one record has been described.",
            "Line 9: closing table finishes the structure; nothing about the layout was specified here, because that decides later in CSS.",
          ],
        ),
        example(
          "Row headers carry a second axis",
          '<table>\n  <caption>Weekly plan</caption>\n  <tr><th scope="col">Day</th><th scope="col">Focus</th></tr>\n  <tr><th scope="row">Monday</th><td>HTML review</td></tr>\n  <tr><th scope="row">Tuesday</th><td>CSS layout</td></tr>\n</table>',
          "Browser preview: a two-column plan where the first cell of each row is a row header.",
          "Two dimensions are described at once: the column headers say what each column means, and the row headers say which day each value belongs to, which is exactly the relationship that a grid of divs would leave unstated.",
          [
            "Line 1: the table again opens the relationship rather than a visual box.",
            "Line 2: the caption gives the dataset a name that a reader can announce before the first value.",
            "Line 3: this row contains only header cells, so it labels the columns for every row that follows.",
            "Line 4: Monday is a row header because it names the record, and the td next to it holds the value that belongs to that record.",
            "Line 5: the second record repeats the same shape, which is what makes the table predictable to read and to navigate.",
            "Line 6: closing the table ends the dataset after both records have been described completely.",
          ],
        ),
      ],
      exercise: {
        prompt: "Write a table with a caption, a thead row of two column headers using scope=\"col\", and a tbody row whose first cell is a row header with scope=\"row\".",
        starterCode: "<!-- Build a data table with headers on both axes -->\n",
        solution: '<table>\n  <caption>Study log</caption>\n  <thead>\n    <tr><th scope="col">Topic</th><th scope="col">Hours</th></tr>\n  </thead>\n  <tbody>\n    <tr><th scope="row">Grid</th><td>2</td></tr>\n  </tbody>\n</table>',
        solutionExplanation: "The caption names the data, theard and tbody separate labels from records, the column headers use scope=\"col\", and the first data cell is a row header with scope=\"row\" so the hours value is tied to the Grid row as well as to the Hours column.",
        testCases: [{ label: "Data table structure", expected: "Browser preview: a captioned table with a column header row and a row header cell." }],
        hints: ["Start with the table and caption before adding rows.", "Mark header cells with th and state their scope.", "Put data rows in tbody and label each record with a row header."],
        checker: {
          mode: "html",
          requiredPatterns: ["<table", "<caption", "<thead", "<tbody", "scope=\\\"col\\\"", "scope=\\\"row\\\""],
          successMessage: "The exercise describes a real data table with headers on both axes.",
        },
      },
      recap: [
        "A table is a claim about data relationships, so caption, thead, tbody, th, and td each add meaning.",
        "scope tells the browser which axis a header describes instead of leaving the relationship to visual position.",
        "Wide tables get a scrolling container; page layout gets Grid or Flexbox.",
      ],
      readingCheck: {
        prompt: "Why does the weekly plan mark Monday with th scope=\"row\" instead of td?",
        choices: [
          "Because Monday labels the rest of its row, so it is a header for that record rather than a data value",
          "Because th is required for the first cell of every row",
          "Because td cannot contain text in a table",
          "Because scope=\"row\" makes the cell bold automatically",
        ],
        correctIndex: 0,
        explanation: "Monday names the record instead of describing a value, and scope=\"row\" publishes that relationship for anyone navigating the table without relying on sight.",
      },
      decisionGuide: [
        { use: "table markup for values that relate to row and column headers", insteadOf: "divs arranged to look like a grid of data", reason: "The semantic table exposes the relationship between headers and values, which a visual grid of divs cannot express." },
        { use: "a scrolling container around a wide table", insteadOf: "rebuilding the data as cards and discarding the table", reason: "The data keeps its real structure on small screens; only the presentation gains a scroll affordance." },
      ],
      verification,
      quality: { codeReading: true, edgeCase: true },
    }),
  },

  8: {
    read: authoredLesson({
      title: "Named grid areas as a layout map",
      minutes: 22,
      summary: "Read grid-template-areas as a diagram written in strings, place children by name with grid-area, and change the whole layout by editing one map instead of many coordinates.",
      learningGoals: [
        "Read a grid-template-areas value as a rectangular layout map",
        "Place children with grid-area names instead of line numbers",
        "Change a page layout responsively by replacing the map",
      ],
      explanation: "grid-template-areas turns the layout into something a reader can see in the source. Each quoted string is one row of the grid, each word inside it is a cell, and repeating a name across adjacent cells makes that area span them. The map must be rectangular: every string needs the same number of cells, which is why the padded names line up in the source. Children then opt in with grid-area: header or grid-area: sidebar, so a component never has to know which column index it happens to occupy. That indirection is the point: moving the sidebar to the left edge means editing the map, not every rule that placed an item. Because the map is just a declaration, replacing it inside a media query produces a different layout at a wider viewport while the markup and the child rules stay untouched. A name that appears in no rule is harmless but dead, and a name used by a child but missing from the map simply leaves that child out of the layout.",
      keywordNotes: [
        "Each quoted string in grid-template-areas is one row of the layout, and each word is one cell.",
        "Repeating the same name in adjacent cells joins those cells into one named area.",
        "The map must be rectangular, so every string contains the same number of cells.",
        "grid-area: <name> places a child into the area with that name, independent of source order.",
        "A dot (.) represents an intentionally empty cell when the map needs a gap.",
      ],
      examples: [
        example(
          "Describe the layout as a map",
          '.page {\n  display: grid;\n  grid-template-areas:\n    "header"\n    "main"\n    "sidebar"\n    "footer";\n  gap: 1rem;\n}',
          "Browser preview: a single-column page whose four areas stack in the order header, main, sidebar, footer.",
          "The map is the layout: four rows, one column, and a named area for each region. Because the areas are already named, the children can be placed by meaning rather than by line number.",
          [
            "Line 1: the class is the grid container, so the map describes the page frame rather than one component.",
            "Line 2: display: grid activates the grid formatting context that the rest of the declaration depends on.",
            "Line 3: grid-template-areas opens a multi-line value; the line breaks in the source mirror the rows of the layout.",
            "Line 4: the first string is the single cell of row one, named for the region that belongs there.",
            "Line 5: row two holds the main content area, which stays full width at this narrow size.",
            "Line 6: the sidebar sits below main here, and a later media query can move it beside main without touching the child rules.",
            "Line 7: the final string completes the map, so this grid has four single-cell rows and every row holds exactly one name.",
            "Line 8: gap separates the named areas visually without adding margin to the children themselves.",
            "Line 9: the block closes, leaving one container rule that describes the entire page frame.",
          ],
        ),
        example(
          "Place children by name",
          '.site-header { grid-area: header; }\n.site-footer { grid-area: footer; }\n.card { grid-area: main; }\n.card.featured { grid-area: main; align-self: start; }',
          "Browser preview: header, main, and footer children land in their named areas, and the featured card aligns to the top of main.",
          "None of these rules mentions a row or column number. Each child claims an area by name, so the map stays the single source of truth for the layout, and align-self adjusts one child within its area without disturbing the others.",
          [
            "Line 1: the site header claims the header area by name, which keeps this rule readable even after the map changes.",
            "Line 2: the footer claims its own area, so source order no longer decides where the footer lands.",
            "Line 3: the card is placed into main by name rather than by spanning explicit line numbers.",
            "Line 4: the featured variant stays in main and adds align-self, showing that a child can refine its alignment inside the named area without a new coordinate.",
          ],
        ),
      ],
      exercise: {
        prompt: "Define .page { display: grid; } with grid-template-areas covering header, main, sidebar, and footer, then place each child with grid-area.",
        starterCode: "/* Draw the layout with a named map, then place the children by name */\n",
        solution: '.page {\n  display: grid;\n  grid-template-areas:\n    "header header"\n    "main sidebar"\n    "footer footer";\n  gap: 1rem;\n}\n.site-header { grid-area: header; }\n.page-main { grid-area: main; }\n.sidebar { grid-area: sidebar; }\n.site-footer { grid-area: footer; }',
        solutionExplanation: "The map declares a three-row, two-column frame where header and footer span both columns and main sits beside sidebar. Each child then claims one name, so the layout could be rearranged by editing the map alone.",
        testCases: [{ label: "Named grid layout", expected: "Browser preview: a named-area grid that places header, main, sidebar, and footer." }],
        hints: ["Every string in the map needs the same number of cells.", "Repeat a name across cells to span them.", "Place children with grid-area: <name> rather than line numbers."],
        checker: {
          mode: "html",
          requiredPatterns: ["display:\\s*grid", "grid-template-areas", "grid-area"],
          successMessage: "The exercise uses a named map and places children by area name.",
        },
      },
      recap: [
        "grid-template-areas is the layout written as a rectangular map that a reader can see.",
        "grid-area: <name> places a child by meaning instead of by coordinates, so the map stays authoritative.",
        "Replacing the map inside a media query changes the whole layout without touching the markup.",
      ],
      readingCheck: {
        prompt: "What happens if two strings inside grid-template-areas contain a different number of cells?",
        choices: [
          "The declaration is invalid because the map must be rectangular",
          "The extra cell is silently ignored and the layout still applies",
          "The browser adds empty columns automatically",
          "The grid falls back to Flexbox",
        ],
        correctIndex: 0,
        explanation: "A grid template areas value describes a rectangle, so every row string must contain the same number of cells or the whole declaration is dropped.",
      },
      decisionGuide: [
        { use: "a named map for a page-level layout", insteadOf: "scattering row and column line numbers across many rules", reason: "The layout becomes readable in one place, and moving a region is a one-line edit rather than a search across rules." },
        { use: "grid-area placement for children with a stable role", insteadOf: "reordering the HTML to move a region visually", reason: "Source order keeps its meaning, which matters for reading order and for anyone navigating with a keyboard." },
      ],
      verification,
      quality: { codeReading: true, modification: true, edgeCase: true },
    }),
  },

  13: {
    compare: authoredLesson({
      title: "CSS nesting and feature queries",
      minutes: 24,
      summary: "Compare nested rules with flat selectors and media queries with @supports, then choose the tool that keeps a component readable and a modern feature safely optional.",
      learningGoals: [
        "Read a nested rule and explain how & resolves to the parent selector",
        "Judge when nesting clarifies a component and when it hides specificity",
        "Guard a modern declaration with @supports while keeping a working fallback",
      ],
      explanation: "Nesting lets a rule contain its own variations, and & is the explicit reference to the parent selector, so .callout { &:hover { } } means .callout:hover. The gain is locality: a component's states sit next to the rule they modify instead of being spread across the stylesheet. The cost is that deeply nested selectors can still produce high specificity and become hard to reason about, so nesting is worth it when it mirrors a real component boundary and not when it merely shortens a long chain. Feature queries answer a different question: @supports (declaration) applies its block only when the browser understands that declaration, which is how a modern color or layout value can be adopted without breaking anyone else. The order matters, because the guarded block comes after the fallback and simply overrides it where it is supported. Together with @media, which responds to the user's environment rather than to the browser's capabilities, these two at-rules cover the questions a component author actually asks: can this browser do it, and does this user's situation call for it.",
      keywordNotes: [
        "& in a nested rule refers to the parent selector, so & .title means \".callout .title\" inside .callout.",
        "Nesting improves locality but does not reduce specificity, so a nested selector can still outrank another rule.",
        "@supports (property: value) applies its block only when the browser understands that declaration.",
        "@media asks about the user's environment such as viewport width or motion preference, while @supports asks about browser capability.",
        "Write the fallback first and the guarded enhancement second, so the enhancement overrides only where it is understood.",
      ],
      examples: [
        example(
          "Nest a component's states with &",
          '.callout {\n  border-left: 4px solid var(--accent);\n  &:hover {\n    border-left-color: #345;\n  }\n  & .callout__title { font-weight: 700; }\n}',
          "Browser preview: a callout whose border brightens on hover and whose title stays bold.",
          "The hover state and the title rule live inside the component that owns them, so a reader sees the whole component in one place, and & states exactly which parent the nested rules extend.",
          [
            "Line 1: the component rule opens, and everything nested inside it is scoped to this class in the source.",
            "Line 2: the base border uses a custom property, which keeps the component themeable without rewriting the rule.",
            "Line 3: the nested state begins with &, so it compiles to .callout:hover rather than to a descendant selector.",
            "Line 4: the hover value changes only the border colour, which is a cheap property to animate and easy to reason about.",
            "Line 5: closing the nested block returns to the component level; the indentation documents where each rule belongs.",
            "Line 6: this nested rule combines the parent with a descendant, showing that nesting can express structure without repeating the parent name.",
            "Line 7: the component rule closes, and no selector outside it was needed to describe the component's internal behaviour.",
          ],
        ),
        example(
          "Guard a modern value with @supports",
          '.card { background: #f5f5f5; }\n@supports (color: oklch(0 0 0)) {\n  .card {\n    background: oklch(0.97 0 0);\n  }\n}',
          "Browser preview: a card with a light background that upgrades to the oklch colour where the browser supports it.",
          "The plain colour is the fallback and the guarded block is the enhancement, so no browser sees a broken declaration and the modern value is adopted exactly where it can be rendered.",
          [
            "Line 1: the fallback is written first and works everywhere, which is what keeps the component usable in older rendering engines.",
            "Line 2: the feature query tests one declaration, and the whole block is applied only when that declaration is understood.",
            "Line 3: inside the guard the same component is targeted again, so the enhancement is a genuine override rather than a separate design.",
            "Line 4: the modern value replaces the fallback only here, and a browser that cannot parse it keeps the earlier background.",
            "Line 5: the guarded rule closes, returning to the top level of the stylesheet.",
            "Line 6: the feature query closes after exactly one enhancement, which keeps the conditional surface small enough to review.",
          ],
        ),
      ],
      exercise: {
        prompt: "Nest a .callout hover state with &, then guard a modern background inside @supports while keeping a plain fallback before it.",
        starterCode: "/* Nest the state, then guard the enhancement */\n",
        solution: '.callout {\n  background: #f5f5f5;\n  &:hover { background: #e8eefc; }\n}\n@supports (color: oklch(0 0 0)) {\n  .callout { background: oklch(0.97 0 0); }\n}',
        solutionExplanation: "The hover state is nested inside the component that owns it, and the modern background is wrapped in a feature query that comes after the fallback, so the enhancement applies only where the browser understands the declaration.",
        testCases: [{ label: "Nesting and feature query", expected: "Browser preview: a nested hover state plus a guarded background enhancement with a fallback." }],
        hints: ["Reference the parent explicitly with & in the nested state.", "Write the fallback before the guarded block.", "Test one declaration inside @supports."],
        checker: {
          mode: "html",
          requiredPatterns: ["&:", "@supports", "background"],
          successMessage: "The exercise nests the state and guards the enhancement behind a feature query.",
        },
      },
      recap: [
        "Nesting keeps a component's states together, and & states exactly which parent a nested rule extends.",
        "Nesting changes locality, not specificity, so it can still produce selectors that outrank each other.",
        "@supports adds an optional enhancement after a working fallback, while @media responds to the user's environment.",
      ],
      readingCheck: {
        prompt: "Why does the @supports block come after the plain background declaration?",
        choices: [
          "Because the guarded rule must be able to override the fallback where the feature is supported",
          "Because @supports is ignored when it appears first",
          "Because the fallback is invalid CSS",
          "Because feature queries only work with custom properties",
        ],
        correctIndex: 0,
        explanation: "Both rules can match, so order decides which one wins; placing the enhancement second lets it override the fallback exactly where the browser understands it.",
      },
      decisionGuide: [
        { use: "nesting that mirrors a component boundary", insteadOf: "nesting several levels deep to shorten long selectors", reason: "Nesting earns its keep when it groups one component's rules; deep chains hide where a specificity conflict came from." },
        { use: "@supports for an optional modern declaration", insteadOf: "shipping the modern value with no fallback", reason: "The page keeps a working appearance everywhere while still adopting the newer capability where it exists." },
      ],
      verification,
      quality: { codeReading: true, prediction: true, debugging: true },
    }),
  },

  14: {
    compare: authoredLesson({
      title: "Keyframe animations versus transitions",
      minutes: 24,
      summary: "Compare a transition, which animates a change between two states, with a keyframe animation, which describes a multi-step sequence on its own, and keep both honest about motion preferences.",
      learningGoals: [
        "Choose a transition when one state change must be smoothed",
        "Write a keyframe animation when the motion has its own steps or repeats",
        "Disable motion under prefers-reduced-motion without removing the information the motion carried",
      ],
      explanation: "A transition is the smaller tool: it takes whatever property changed and interpolates from the old value to the new one, so the motion is a consequence of a state change such as :hover or a class the script toggled. If the element never changes state, a transition does nothing. A keyframe animation is the larger tool: @keyframes names a sequence of steps and animation applies it, which lets the motion run on its own, loop, alternate, or move through more than two points. That extra power also brings responsibility, because motion happens without the user doing anything, and a looping animation can distract permanently. Both tools must respect prefers-reduced-motion: reduce. Turning motion off is not the same as deleting the effect, so the reduced-motion block should keep the state visible in a static way, such as a colour or a border change, so nobody loses information that other users receive through movement.",
      keywordNotes: [
        "A transition needs a property that already changes; it interpolates between the before and after values.",
        "@keyframes names a sequence of steps, written either as from and to or as percentages.",
        "animation is the shorthand that applies a keyframe name with duration, easing, iteration count, direction, and fill.",
        "animation-iteration-count: infinite repeats forever, which is why a reduced-motion alternative matters more for loops.",
        "prefers-reduced-motion: reduce asks for motion to stop, so replace movement with a static state change instead of removing feedback.",
      ],
      examples: [
        example(
          "A transition smooths one state change",
          '.card { transition: transform 0.2s ease; }\n.card:hover { transform: translateY(-2px); }\n@media (prefers-reduced-motion: reduce) {\n  .card { transition: none; }\n}',
          "Browser preview: a card that lifts slightly on hover, and no movement when reduced motion is requested.",
          "The transform only exists in the hover rule, so the transition has exactly one change to smooth; the media query removes the smoothing while leaving the hover transform and its layout effect intact.",
          [
            "Line 1: the transition names one property, one duration, and one easing, so the motion is predictable and cheap to reason about.",
            "Line 2: the state change supplies the destination value; without this rule the transition would never have anything to animate.",
            "Line 3: the media query tests the user's motion preference rather than the browser's capabilities.",
            "Line 4: setting transition to none stops the interpolation, and because the transform itself remains, the visual state change is still communicated.",
            "Line 5: the query closes, so the override applies only to the reduced-motion case and never to the default experience.",
          ],
        ),
        example(
          "A keyframe animation runs on its own",
          '@keyframes pulse {\n  from { opacity: 1; }\n  to { opacity: 0.6; }\n}\n.status-dot {\n  animation: pulse 1.2s ease-in-out infinite alternate;\n}\n@media (prefers-reduced-motion: reduce) {\n  .status-dot { animation: none; }\n}',
          "Browser preview: a status dot that pulses continuously, and a still dot when reduced motion is requested.",
          "The keyframes describe a sequence the element can run without any state change, and the shorthand states the name, duration, easing, repetition, and direction. The reduced-motion block stops the motion, but the dot keeps its colour so the status is still visible.",
          [
            "Line 1: @keyframes names the sequence so a rule elsewhere can apply it by name.",
            "Line 2: from is the first step of the sequence, expressed as opacity so the motion does not trigger layout work.",
            "Line 3: to is the last step, and the browser interpolates every value between the two on its own.",
            "Line 4: the keyframe block closes after describing the two endpoints of the sequence.",
            "Line 5: the rule that owns the animation targets the element that should move.",
            "Line 6: the shorthand applies the named sequence with a duration, easing, infinite repetition, and alternating direction so the pulse returns smoothly.",
            "Line 7: the motion preference query is placed after the animation so its override wins where it applies.",
            "Line 8: animation: none stops the sequence entirely, and because the keyframes only changed opacity, the dot keeps its normal colour.",
            "Line 9: the media query closes after one focused override.",
            "Line 10: the stylesheet ends with the motion preference handled explicitly instead of left to chance.",
          ],
        ),
      ],
      exercise: {
        prompt: "Write a .status-dot that pulses opacity with @keyframes, then turn the animation off inside prefers-reduced-motion: reduce.",
        starterCode: "/* Describe the sequence, apply it, then respect motion preferences */\n",
        solution: '@keyframes pulse {\n  from { opacity: 1; }\n  to { opacity: 0.6; }\n}\n.status-dot { animation: pulse 1.2s ease-in-out infinite alternate; }\n@media (prefers-reduced-motion: reduce) {\n  .status-dot { animation: none; }\n}',
        solutionExplanation: "The keyframes describe the two endpoints, the shorthand applies them to the dot with an explicit duration and repetition, and the reduced-motion block stops the motion while leaving the element and its colour intact.",
        testCases: [{ label: "Keyframe animation", expected: "Browser preview: a pulsing dot that becomes still when reduced motion is requested." }],
        hints: ["Name the sequence with @keyframes before applying it.", "State the duration and iteration count explicitly.", "Keep the element visible when the motion is removed."],
        checker: {
          mode: "html",
          requiredPatterns: ["@keyframes", "animation:", "prefers-reduced-motion"],
          successMessage: "The exercise defines a named sequence, applies it, and respects the motion preference.",
        },
      },
      recap: [
        "A transition smooths a change that exists for another reason; a keyframe animation describes motion that runs on its own.",
        "The animation shorthand states the keyframe name plus duration, easing, repetition, and direction in one declaration.",
        "prefers-reduced-motion should replace movement with a static signal rather than delete the feedback.",
      ],
      readingCheck: {
        prompt: "Why does the reduced-motion block keep the status dot visible instead of removing the element?",
        choices: [
          "Because the colour still communicates the state, so stopping the motion does not remove information",
          "Because animation: none also hides the element",
          "Because opacity cannot be animated",
          "Because prefers-reduced-motion only affects hover effects",
        ],
        correctIndex: 0,
        explanation: "Reduced motion is a request to stop movement, not to lose feedback, so the state should stay visible through a static property.",
      },
      decisionGuide: [
        { use: "a transition for a state change that already exists", insteadOf: "an animation that loops to fake the same change", reason: "The smaller tool keeps the motion tied to a real state and avoids motion happening without user intent." },
        { use: "animation: none plus a static state style under reduced motion", insteadOf: "deleting the element or the state class", reason: "The interface keeps its meaning while respecting the user's motion preference." },
      ],
      verification,
      quality: { codeReading: true, prediction: true, edgeCase: true },
    }),
  },

  16: {
    compare: authoredLesson({
      title: "Responsive media: srcset versus picture",
      minutes: 24,
      summary: "Compare srcset with sizes, which lets the browser pick a resolution of the same image, and picture with source, which changes the image itself, and keep every image named and sized.",
      learningGoals: [
        "Choose srcset and sizes when one image needs several resolutions",
        "Choose picture and source for art direction or format switching",
        "Keep alt text, dimensions, and loading behaviour on every image",
      ],
      explanation: "srcset offers the browser a set of candidates for the same picture, each described by a width or pixel-density descriptor, and sizes tells it how wide the image will be laid out at each breakpoint so the choice is informed rather than guessed. The browser then downloads one candidate, which is what makes responsive images a delivery decision. picture answers a different question: it selects markup, not resolution, so source elements can swap a crop for narrow screens, serve a newer format to browsers that accept it with type, or combine both. The img inside picture is required because it is the fallback and it carries alt text. Sizing rules stay the same in both cases: width and height or an aspect-ratio reserve the space so the layout does not shift, loading=\"lazy\" defers off-screen media, and for video and audio the controls attribute and a poster frame keep the element usable and honest before playback starts. Nothing here is a substitute for real measurement, so these lessons describe structure rather than claiming a performance score.",
      keywordNotes: [
        "srcset lists candidate files with descriptors such as 640w, and the browser chooses one to download.",
        "sizes tells the browser how wide the image will be rendered at each breakpoint, which makes the srcset choice meaningful.",
        "picture with source elements swaps the image itself, using media for art direction and type for format support.",
        "The img inside picture is required: it is the fallback and the element that carries alt text.",
        "width and height or aspect-ratio reserve layout space, and controls plus poster make video and audio usable.",
      ],
      examples: [
        example(
          "Offer resolutions and describe the layout width",
          '<img src="lesson-640.jpg" alt="Lesson dashboard"\n     srcset="lesson-640.jpg 640w, lesson-1280.jpg 1280w"\n     sizes="(min-width: 45rem) 640px, 100vw"\n     width="640" height="360" loading="lazy">',
          "Browser preview: one dashboard image that the browser can download at either resolution depending on the available layout width.",
          "srcset supplies the candidates and sizes explains how much space the image will occupy, so the browser can choose a candidate instead of guessing; the dimensions still reserve space and alt text still names the image.",
          [
            "Line 1: the src attribute stays as the fallback every browser understands, and the alt text gives the image a purpose rather than a description of its pixels.",
            "Line 2: srcset lists the same picture at two widths with w descriptors, so the choice is made from real file widths.",
            "Line 3: sizes states the layout width at each breakpoint, which is the information the browser needs to compare candidates against the space available.",
            "Line 4: width and height reserve the box before the bytes arrive, downloading is deferred for off-screen media, and the tag closes cleanly.",
          ],
        ),
        example(
          "Change the artwork and the format with picture",
          '<picture>\n  <source media="(min-width: 45rem)" srcset="wide.avif" type="image/avif">\n  <source media="(min-width: 45rem)" srcset="wide.jpg" type="image/jpeg">\n  <img src="narrow.jpg" alt="Course dashboard" width="800" height="450">\n</picture>',
          "Browser preview: a wide crop on large screens using the best supported format, and a narrow crop otherwise.",
          "The two source elements answer two different questions in order: the media attribute selects the artwork for wide screens, and the type attribute lets a browser that understands AVIF take the smaller file while everyone else falls through, ending at the required img fallback.",
          [
            "Line 1: picture wraps a set of candidates rather than describing resolution, because here the image itself may change.",
            "Line 2: this source targets wide layouts and offers a newer format, which the type attribute lets the browser accept or skip.",
            "Line 3: the second wide source repeats the media condition with a universally supported format, so the wide layout still works without AVIF.",
            "Line 4: the img is the fallback that narrow screens and every browser reach, and it keeps alt text and explicit dimensions.",
            "Line 5: picture closes; source elements select, but only img is the element that actually displays the image.",
          ],
        ),
      ],
      exercise: {
        prompt: "Write a picture element with one wide-layout source and an img fallback that carries srcset, sizes, alt text, width, and height.",
        starterCode: "<!-- Offer a wide crop, then a sized fallback image -->\n",
        solution: '<picture>\n  <source media="(min-width: 45rem)" srcset="wide.avif" type="image/avif">\n  <source media="(min-width: 45rem)" srcset="wide.jpg" type="image/jpeg">\n  <img src="lesson-640.jpg" alt="Lesson dashboard"\n       srcset="lesson-640.jpg 640w, lesson-1280.jpg 1280w"\n       sizes="(min-width: 45rem) 640px, 100vw"\n       width="640" height="360" loading="lazy">\n</picture>',
        solutionExplanation: "The sources select the wide artwork and let format support decide which file is used, while the required img carries alt text, explicit dimensions, and its own resolution candidates with a sizes hint, so the media is named, sized, and adaptable.",
        testCases: [{ label: "Responsive media", expected: "Browser preview: a wide crop with a sized, named fallback image that keeps its dimensions." }],
        hints: ["Use media for the layout condition and type for the format.", "Always provide a real img inside picture.", "Add width, height, and a sizes hint rather than leaving the browser to guess."],
        checker: {
          mode: "html",
          requiredPatterns: ["<picture", "<source", "srcset", "sizes=", "<img", "alt="],
          successMessage: "The exercise offers candidates, selects artwork, and keeps the fallback named and sized.",
        },
      },
      recap: [
        "srcset with sizes offers resolutions of one image; picture with source changes the image that is chosen.",
        "The img inside picture is required because it is the fallback and the element that carries alt text.",
        "Responsive media still needs alt text and reserved space, and video and audio need controls and a poster frame.",
      ],
      readingCheck: {
        prompt: "Why is the img element still required inside a picture element?",
        choices: [
          "Because it is the fallback that actually renders and the element that carries the alternative text",
          "Because source elements cannot reference files",
          "Because picture only works with SVG images",
          "Because img disables the format negotiation",
        ],
        correctIndex: 0,
        explanation: "source elements only offer candidates; the img holds the fallback source and the alt text, so removing it would leave the media unnamed and unrendered.",
      },
      decisionGuide: [
        { use: "srcset with sizes for one image at several resolutions", insteadOf: "handing every visitor the largest file", reason: "The browser can pick a candidate that matches the layout width, which is both faster and sharper for the situation." },
        { use: "picture when the artwork or format must change", insteadOf: "one crop and one format for every screen", reason: "Art direction and format negotiation are markup decisions, and picture expresses them without script." },
      ],
      verification,
      quality: { codeReading: true, modification: true },
    }),
  },

  19: {
    design: authoredLesson({
      title: "Dark mode through design tokens",
      minutes: 22,
      summary: "Design a theme by re-declaring tokens inside prefers-color-scheme instead of rewriting rules, and keep native controls, contrast, and focus visibility working in both modes.",
      learningGoals: [
        "Swap token values rather than duplicating component rules",
        "Set color-scheme so native controls and scrollbars follow the theme",
        "Check contrast and focus visibility in both light and dark modes",
      ],
      explanation: "A theme is a set of values, so the honest way to add dark mode is to keep the component rules reading tokens and change only the token values. The light values live on :root, and the same custom properties are re-declared inside @media (prefers-color-scheme: dark), which means the components need no dark-specific rule at all. color-scheme tells the browser which palette its own widgets should use, so form controls, scrollbars, and the default focus ring are drawn for the active theme instead of staying light on a dark surface. Two boundaries deserve real attention. Contrast must be checked in both modes, because a colour that is comfortable on white can be unreadable on a dark surface; the light and dark accents are often different values for exactly that reason. Focus visibility must survive the theme, since a dark background can swallow a thin default outline, so the focus style is part of the token set rather than an afterthought. What this lesson does not claim is measurement: contrast checked by eye in a preview is not a contrast audit, and the lesson says so.",
      keywordNotes: [
        "Tokens declared on :root are inherited by every component, so re-declaring them re-themes the page.",
        "@media (prefers-color-scheme: dark) applies when the reader's system prefers a dark palette, and it is a preference rather than a guarantee.",
        "color-scheme: light dark tells the browser its own controls may follow the active palette.",
        "A token such as --accent often needs two values because sufficient contrast differs between light and dark surfaces.",
        "The focus style belongs to the theme: :focus-visible must stay visible against both surfaces.",
      ],
      examples: [
        example(
          "Swap token values for the dark palette",
          ':root {\n  --surface: #ffffff;\n  --text: #1b1f24;\n  color-scheme: light;\n}\n@media (prefers-color-scheme: dark) {\n  :root { --surface: #12161c; --text: #f2f5f8; color-scheme: dark; }\n}',
          "Browser preview: the page uses a light surface and text by default and the dark pair when the reader prefers dark.",
          "Only the token values change; every rule that reads var(--surface) or var(--text) re-themes itself, and color-scheme keeps the browser's own widgets in the same mode as the page.",
          [
            "Line 1: the root selector is where site-wide tokens belong, because every element inherits them.",
            "Line 2: the surface token holds the background colour that components will read rather than copy.",
            "Line 3: the text token pairs with it, so a component can set both without deciding what the theme is.",
            "Line 4: color-scheme tells the browser its native widgets should use the light palette here.",
            "Line 5: the root block closes after declaring the complete light theme.",
            "Line 6: the preference query opens, and the declarations inside it apply only when the reader has asked for dark.",
            "Line 7: the same two tokens receive dark values, and color-scheme is updated so form controls and scrollbars match; no component rule needed to change.",
            "Line 8: the media query closes after re-declaring the theme in one place.",
          ],
        ),
        example(
          "Theme-aware components and focus",
          '.card { background: var(--surface); color: var(--text); border: 1px solid var(--border, #ccd5e0); }\n.card a { color: var(--accent, #345); }\na:focus-visible { outline: 3px solid var(--accent, #345); outline-offset: 2px; }\n@media (prefers-color-scheme: dark) {\n  :root { --accent: #8db4ff; }\n}',
          "Browser preview: a card and its links follow the theme, and the focus outline uses the theme-aware accent.",
          "The component reads tokens with fallbacks, and the focus outline reads the same accent token, so when the dark palette re-declares that accent both the link colour and the focus ring adjust together and stay visible.",
          [
            "Line 1: the card reads surface and text tokens, and the border falls back to a literal colour only if the theme never provides one.",
            "Line 2: link colour also comes from a token, which is what makes re-theming a one-line change.",
            "Line 3: the focus ring is styled for keyboard users and reads the accent token, so it cannot be left behind when the palette changes.",
            "Line 4: the preference query opens again here, showing that a theme override can be scoped to the one token that needs a second value.",
            "Line 5: the dark accent is a lighter blue, because the light value would not carry enough contrast against a dark surface.",
            "Line 6: the query closes after re-declaring a single token, which is all this component needed to follow the theme.",
          ],
        ),
      ],
      exercise: {
        prompt: "Theme a card through custom properties: declare light tokens on :root with color-scheme: light, re-declare them inside prefers-color-scheme: dark with color-scheme: dark, and read them with var().",
        starterCode: "/* Declare the theme once, then swap the values */\n",
        solution: ':root {\n  --surface: #ffffff;\n  --text: #1b1f24;\n  color-scheme: light;\n}\n@media (prefers-color-scheme: dark) {\n  :root {\n    --surface: #12161c;\n    --text: #f2f5f8;\n    color-scheme: dark;\n  }\n}\n.card {\n  background: var(--surface);\n  color: var(--text);\n}',
        solutionExplanation: "The light palette is declared once on :root, the dark palette re-declares the same property names inside the preference query, color-scheme follows each palette so native controls match, and the card reads the tokens instead of hard-coding colours.",
        testCases: [{ label: "Themed card", expected: "Browser preview: a card that follows the reader's light or dark colour preference through tokens." }],
        hints: ["Declare the tokens before the media query so the light theme is the default.", "Re-declare the same property names inside the query.", "Update color-scheme with each palette."],
        checker: {
          mode: "html",
          requiredPatterns: ["prefers-color-scheme", "color-scheme", "--surface", "var\\("],
          successMessage: "The exercise swaps token values and keeps native controls in the matching palette.",
        },
      },
      recap: [
        "A theme changes values, so dark mode re-declares tokens rather than duplicating component rules.",
        "color-scheme keeps the browser's own controls, scrollbars, and default focus ring in the active palette.",
        "Contrast and focus visibility must be judged again in the dark palette, and previewing is not a contrast audit.",
      ],
      readingCheck: {
        prompt: "Why does the dark theme give --accent a different value instead of reusing the light one?",
        choices: [
          "Because sufficient contrast differs between a light and a dark surface, so the accent often needs a second value",
          "Because custom properties cannot be inherited twice",
          "Because @media changes the meaning of var()",
          "Because dark mode requires every token to be inverted",
        ],
        correctIndex: 0,
        explanation: "Contrast is a relationship between a foreground and its background, so a colour that reads well on white may fail on a dark surface and needs a deliberate second value.",
      },
      decisionGuide: [
        { use: "token re-declaration inside prefers-color-scheme", insteadOf: "a filter: invert() or a duplicated dark stylesheet", reason: "Tokens keep one set of component rules, while inversion distorts images and brand colours and a duplicate stylesheet drifts out of sync." },
        { use: "color-scheme alongside the token palette", insteadOf: "restyling native controls by hand", reason: "The browser then draws its own widgets for the active theme, which is less code and matches platform expectations." },
      ],
      verification,
      quality: { codeReading: true, modification: true, edgeCase: true },
    }),
  },

  22: {
    design: authoredLesson({
      title: "Positioning and stacking in practice",
      minutes: 24,
      summary: "Choose between static, relative, absolute, fixed, and sticky from the behaviour each one provides, understand what absolute positions against, and keep the stacking order from hiding content or focus.",
      learningGoals: [
        "Select a position value from the effect the layout needs",
        "Explain which ancestor an absolutely positioned element resolves against",
        "Reason about z-index inside a stacking context instead of guessing numbers",
      ],
      explanation: "static is the default: the element sits in normal flow. relative keeps the element in flow and lets it be offset while still occupying its original space, which is also why it is the usual anchor for children. absolute removes the element from flow and positions it against the nearest ancestor that is not static, so a badge inside a card works because the card has position: relative, and the same badge would otherwise escape to the page. fixed pins the element to the viewport, which is powerful for overlays and dangerous for anything that can cover content or focus on a small screen. sticky is a hybrid: the element stays in flow, scrolls normally, and then sticks once the inset is reached inside its scroll container. z-index only orders elements inside the same stacking context, and properties such as transform or opacity create a new context, which is why a large z-index sometimes appears to do nothing. The design rule is to keep the number of positioned elements small, give sticky elements their inset and a modest z-index, and never let a fixed or sticky layer cover the focused control or the content it belongs to.",
      keywordNotes: [
        "static is normal flow; relative offsets an element while keeping its original space reserved.",
        "absolute positions against the nearest ancestor whose position is not static, and a card usually becomes that ancestor.",
        "fixed positions against the viewport, so it ignores scrolling and is best reserved for genuine overlays.",
        "sticky stays in flow until the inset is reached inside its scroll container, then holds that offset.",
        "z-index only compares elements inside the same stacking context, and transform or opacity can create a new context.",
      ],
      examples: [
        example(
          "A header that sticks inside the page",
          '.site-header {\n  position: sticky;\n  top: 0;\n  z-index: 10;\n}',
          "Browser preview: the header scrolls with the page and then holds at the top edge while its container continues to scroll.",
          "sticky keeps the header in normal flow, so nothing is reserved or removed, and the top inset states where the stick starts. A modest z-index keeps it above following content inside the same stacking context without needing an extreme number.",
          [
            "Line 1: the rule targets the header element that should hold its position while scrolling.",
            "Line 2: sticky keeps the element in flow and starts sticking at the inset declared on the next line.",
            "Line 3: top: 0 states the offset the element sticks to, which is what makes the sticky behaviour observable at all.",
            "Line 4: a small z-index lifts the header above later content within its stacking context instead of relying on a huge number.",
            "Line 5: the rule closes with the sticky behaviour fully described by four short declarations.",
          ],
        ),
        example(
          "A badge anchored inside its card",
          '.card { position: relative; }\n.card__badge {\n  position: absolute;\n  top: 0.5rem;\n  right: 0.5rem;\n}\n.card a:focus-visible { outline: 3px solid #345; outline-offset: 2px; }',
          "Browser preview: a badge pinned to the card's top-right corner, with link focus outlines still visible above it.",
          "The card becomes the containing block because it is relatively positioned, so the absolutely positioned badge is measured from the card's padding box rather than from the page, and the focus style keeps keyboard navigation visible in the area the badge occupies.",
          [
            "Line 1: position: relative keeps the card in normal flow and makes it the anchor for absolutely positioned children.",
            "Line 2: the badge rule targets the child that should be taken out of flow.",
            "Line 3: absolute positions the badge against the card instead of the page, which is the whole reason the previous line exists.",
            "Line 4: the top inset is measured from the containing block's padding box, so the badge sits a small distance below the card's inner top edge.",
            "Line 5: the right inset mirrors the top offset, which places the badge in the corner without margin hacks.",
            "Line 6: the focus outline is declared deliberately so a keyboard user still sees where focus is, even near the overlaid badge.",
            "Line 7: the badge rule closes with both offsets stated, so nothing about its position depends on the page's own coordinates.",
          ],
        ),
      ],
      exercise: {
        prompt: "Make a header stick to the top while scrolling, then place a badge in the corner of a relatively positioned card and keep focus outlines visible.",
        starterCode: "/* Choose position values from the behaviour you need */\n",
        solution: '.site-header {\n  position: sticky;\n  top: 0;\n  z-index: 10;\n}\n.card {\n  position: relative;\n}\n.card__badge {\n  position: absolute;\n  top: 0.5rem;\n  right: 0.5rem;\n}\na:focus-visible { outline: 3px solid #345; outline-offset: 2px; }',
        solutionExplanation: "The header uses sticky with an explicit inset so it holds at the top of its scroll container, the card is relatively positioned so it becomes the containing block for the absolutely positioned badge, and the focus style keeps keyboard navigation visible.",
        testCases: [{ label: "Positioning and focus", expected: "Browser preview: a sticky header and a corner badge on a card, with focus outlines still visible." }],
        hints: ["Sticky needs an inset such as top: 0.", "An absolute child resolves against a positioned ancestor.", "Add the focus style so the overlay cannot hide keyboard focus."],
        checker: {
          mode: "html",
          requiredPatterns: ["position:\\s*sticky", "position:\\s*relative", "position:\\s*absolute", "z-index", "focus-visible"],
          successMessage: "The exercise positions deliberately and keeps focus visible near the overlay.",
        },
      },
      recap: [
        "Position values are behaviour choices: static and relative keep flow, absolute leaves it, fixed pins to the viewport, and sticky holds an inset while scrolling.",
        "An absolutely positioned element resolves against the nearest non-static ancestor, which is why cards become position: relative.",
        "z-index only orders elements inside one stacking context, and overlays must never hide content or focus.",
      ],
      readingCheck: {
        prompt: "Why does the card need position: relative before the badge can sit in its corner?",
        choices: [
          "Because an absolutely positioned child resolves against the nearest ancestor that is not static",
          "Because relative makes the card scroll faster",
          "Because absolute children ignore their parent entirely",
          "Because z-index only works inside relative elements",
        ],
        correctIndex: 0,
        explanation: "absolute takes the badge out of flow and measures it against the nearest positioned ancestor, so the card must establish itself as that ancestor for the offset to be meaningful.",
      },
      decisionGuide: [
        { use: "sticky with a stated inset for a header or sidebar", insteadOf: "fixed for content that belongs in the flow", reason: "A sticky element keeps its space and its place in the reading order while still staying visible." },
        { use: "a small set of positioned elements with modest z-index values", insteadOf: "large z-index numbers to force stacking", reason: "Stacking is resolved per context, so huge numbers do not fix a context problem and make the ordering harder to reason about later." },
      ],
      verification,
      quality: { codeReading: true, debugging: true, edgeCase: true },
    }),
  },
};
