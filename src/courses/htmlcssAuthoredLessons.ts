import type { Example } from "../data/types";
import { authoredLesson, type LessonOverrideLibrary } from "./chapterPlanHelpers";

const webMistakes: Example["mistakes"] = [
  { mistake: "Using a generic div when a native semantic element already fits", error: "The page may still render, but structure, accessibility, and maintainability become weaker", fix: "Choose the element that already matches the content or interaction meaning before adding ARIA or extra classes." },
  { mistake: "Relying on placeholder text or visual styling instead of an explicit accessible name", error: "Controls become harder to understand for assistive technology and for users returning to the form later", fix: "Use a visible label or another explicit naming mechanism tied to the control." },
  { mistake: "Treating performance or security as decoration instead of as part of the markup contract", error: "The page may load unsafely, shift unexpectedly, or expose unnecessary risk boundaries", fix: "Put width and height, safe link attributes, and other boundary choices directly in the authored markup." },
];

const example = (title: string, code: string, output: string, explanation: string, lines: string[]): Example => ({
  title,
  code,
  output,
  explanation,
  lines,
  mistakes: webMistakes,
});

export const htmlcssAuthoredLessons: LessonOverrideLibrary = {
  4: {
    learn: authoredLesson({
      summary: "Design forms around explicit labels, native validation hints, and user-recovery paths instead of hoping placeholder text or JavaScript will explain the field later.",
      learningGoals: [
        "Associate labels and controls deliberately with for/id",
        "Choose native input types and attributes that match the data boundary",
        "Explain how visible instructions and error recovery support real users",
      ],
      explanation: "A form is a user boundary, so the markup should explain itself before any script enhancement exists. label and id matter because they connect visible wording to the actual control. Native attributes such as type, required, and autocomplete are not minor conveniences; they give the browser and assistive technology useful semantics that improve mobile keyboards, validation hints, and reviewability. Placeholder text is not a substitute for a label because it disappears during entry and does not reliably carry the same accessible naming role.",
      keywordNotes: [
        "label for and input id create an explicit control association.",
        "type=email communicates that the field expects an email-shaped value and may improve platform-specific input affordances.",
        "required marks a boundary where blank submission is not acceptable even before custom JavaScript validation exists.",
      ],
      examples: [
        example(
          "Label and control describe one field together",
          '<form>\n  <label for="email">Email</label>\n  <input id="email" name="email" type="email" required autocomplete="email">\n  <button type="submit">Save</button>\n</form>',
          "A labeled email field with a native submit button",
          "The label explains the control, the input type communicates the expected value shape, and the button uses the browser's built-in form submission behavior.",
          [
            "Line 1: form creates the native submission boundary for the related controls inside it.",
            "Line 2: the label gives the field a visible name and points to the control with for=email.",
            "Line 3: the input supplies the matching id, an email-specific input type, a submitted name key, and native required/autocomplete hints.",
            "Line 4: the native submit button keeps the baseline workflow usable before extra scripts are added.",
            "Line 5: the form closes after keeping the relationship between description, input, and action explicit.",
          ],
        ),
        example(
          "Fieldset groups a decision with shared meaning",
          '<form>\n  <fieldset>\n    <legend>Contact preference</legend>\n    <label><input type="radio" name="contact" value="email"> Email</label>\n    <label><input type="radio" name="contact" value="sms"> SMS</label>\n  </fieldset>\n</form>',
          "A grouped radio choice with one shared question",
          "fieldset and legend give the radio controls one parent question so the group makes sense when read visually or by assistive technology.",
          [
            "Line 1: the form begins the broader submission boundary.",
            "Line 2: fieldset groups several controls that answer one shared question.",
            "Line 3: legend names that shared question for the grouped controls.",
            "Line 4: the first radio control belongs to the contact group through the shared name and is wrapped by visible label text.",
            "Line 5: the second radio option stays in the same group because it uses the same name value.",
            "Line 6: the grouped fieldset closes after establishing one coherent question.",
            "Line 7: the form ends here.",
          ],
        ),
      ],
      exercise: {
        prompt: "Build a form with a label for name, an input id/name of full-name, and a submit button. Make the input required.",
        starterCode: "<!-- Build a readable, labeled form control -->\n",
        solution: '<form>\n  <label for="full-name">Full name</label>\n  <input id="full-name" name="full-name" required>\n  <button type="submit">Save</button>\n</form>',
        solutionExplanation: "The label gives the control an explicit name, the matching id/for pair creates the association, and required marks the blank-input boundary honestly.",
        testCases: [{ label: "Labeled required control", expected: "A form with a labeled required input and submit button" }],
        hints: ["Write the label before the input.", "Match the label's for with the input id.", "Use a native submit button instead of a generic clickable element."],
        checker: { mode: "html", requiredPatterns: ["<form", "<label", "for=\"full-name\"", "id=\"full-name\"", "name=\"full-name\"", "required", "type=\"submit\"|<button"] },
      },
      recap: [
        "A strong form baseline explains each control before scripts enhance anything.",
        "Labels, input types, and required fields are part of the semantic contract, not optional polish.",
        "Grouping related controls with fieldset and legend improves both reading and accessibility.",
      ],
      readingCheck: {
        prompt: "Why is placeholder text alone weaker than a real label?",
        choices: [
          "Because placeholder text disappears during entry and should not carry the full naming job by itself",
          "Because placeholders make forms invalid HTML automatically",
          "Because placeholders submit the wrong HTTP method",
          "Because labels can only be used with buttons",
        ],
        correctIndex: 0,
        explanation: "A visible label remains available while the person is reading, editing, and reviewing the field, and it provides a more reliable naming relationship.",
      },
      decisionGuide: [
        { use: "a visible label plus a native input type", insteadOf: "placeholder-only instructions", reason: "People need the field's meaning to remain available while they are entering or reviewing data." },
        { use: "fieldset and legend for one grouped question", insteadOf: "several controls with no shared parent meaning", reason: "The relationship between the options becomes explicit to both visual readers and assistive technology." },
      ],
      quality: { codeReading: true },
    }),
  },
  11: {
    learn: authoredLesson({
      summary: "Treat keyboard focus, native controls, and accessible names as core interface behavior rather than as optional accessibility extras.",
      learningGoals: [
        "Explain why native buttons are a stronger baseline than clickable generic containers",
        "Use focus-visible to support keyboard navigation without adding noisy pointer-only focus styling",
        "Identify how visible text and accessible names stay aligned",
      ],
      explanation: "Accessibility begins with choosing the right element. A button already knows how to receive focus, announce itself, and react to keyboard activation, while a div requires authors to recreate that behavior and still often gets it wrong. focus-visible matters because keyboard users need a reliable location indicator, but mouse users do not always need the same persistent ring after every click. A control also needs a clear accessible name so the action is understandable outside the visual layout context.",
      keywordNotes: [
        "button is a native interactive control with built-in keyboard semantics.",
        ":focus-visible styles focused elements in the contexts where a strong visible keyboard indicator is most useful.",
        "An accessible name is the text or labeling information assistive technology uses to identify the control.",
      ],
      examples: [
        example(
          "Native button plus visible keyboard focus",
          '<button type="button">Save lesson</button>\n<style>\nbutton:focus-visible {\n  outline: 3px solid #345;\n  outline-offset: 3px;\n}\n</style>',
          "A native button with a visible keyboard focus ring",
          "The markup uses a real button for interaction and adds a focus-visible outline so keyboard users can track where they are.",
          [
            "Line 1: the native button provides semantic role, keyboard behavior, and visible text naming in one element.",
            "Line 2: the style block contains the authored focus treatment.",
            "Line 3: :focus-visible targets the states where a visible location indicator matters most for keyboard navigation.",
            "Line 4: outline draws a strong focus ring without changing layout dimensions.",
            "Line 5: outline-offset moves the ring away from the element edge so it remains readable.",
            "Line 6: the rule closes here.",
            "Line 7: the style block ends.",
          ],
        ),
        example(
          "Icon-only controls still need an accessible name",
          '<button type="button" aria-label="Close panel">×</button>',
          "A close button with an explicit accessible name",
          "The visible symbol alone may not explain the action clearly enough in every context, so aria-label names the control when no visible text label is present.",
          [
            "Line 1: the button remains a native control, while aria-label supplies the action name that assistive technology can announce.",
          ],
        ),
      ],
      exercise: {
        prompt: "Create a button that says Open menu and add a focus-visible outline rule for button elements.",
        starterCode: "<!-- Build one keyboard-visible control -->\n",
        solution: '<button type="button">Open menu</button>\n<style>\nbutton:focus-visible {\n  outline: 3px solid #345;\n}\n</style>',
        solutionExplanation: "The button keeps native interaction behavior and the focus-visible rule makes keyboard location visible without inventing a custom widget.",
        testCases: [{ label: "Keyboard-visible button", expected: "A button with a focus-visible outline" }],
        hints: ["Start with a real button element.", "Use :focus-visible in the CSS selector.", "Choose an outline instead of removing focus styling."],
        checker: { mode: "html", requiredPatterns: ["<button", "Open menu", "focus-visible", "outline"] },
      },
      recap: [
        "Native controls are the first accessibility tool because they bring semantics and behavior together.",
        "Keyboard users need a visible focus indicator to understand location and progress.",
        "Accessible names should match the real action the control performs.",
      ],
      readingCheck: {
        prompt: "Why is a native button usually stronger than a clickable div?",
        choices: [
          "Because it already provides the expected interaction semantics and keyboard behavior",
          "Because buttons cannot be styled with CSS",
          "Because div elements are forbidden inside HTML documents",
          "Because buttons automatically pass accessibility audits in every case",
        ],
        correctIndex: 0,
        explanation: "Native controls reduce the amount of behavior authors must recreate and therefore reduce common accessibility mistakes.",
      },
      decisionGuide: [
        { use: "a native button with visible focus styling", insteadOf: "a styled div plus custom click handling", reason: "The platform already supplies semantic interaction behavior that is expensive and error-prone to rebuild." },
        { use: "an explicit accessible name for icon-only controls", insteadOf: "assuming the icon explains itself in every context", reason: "Controls need a stable name whether they are read visually or announced through assistive technology." },
      ],
      quality: { codeReading: true },
    }),
  },
  16: {
    learn: authoredLesson({
      summary: "Make performance-oriented markup decisions explicit by reserving image space, choosing lazy loading deliberately, and explaining why some media should still load eagerly.",
      learningGoals: [
        "Explain why width and height reduce layout shift for images",
        "Use loading=lazy when it matches the content's position and importance",
        "Differentiate structural image quality from delivery decisions about critical content",
      ],
      explanation: "Performance is not only a JavaScript concern. HTML attributes influence how stable and responsive the page feels while media loads. width and height help the browser reserve space before the image bytes arrive, which reduces layout shifts. loading=lazy can defer off-screen work, but it is not automatically correct for every image: important first-view content may need to load promptly. Honest performance teaching means naming those trade-offs instead of giving one universal attribute rule.",
      keywordNotes: [
        "width and height help the browser reserve layout space before an image loads.",
        "loading=lazy asks the browser to defer some off-screen image work until it becomes more relevant.",
        "A critical image near the top of the page may need eager loading if delaying it harms the first view.",
      ],
      examples: [
        example(
          "Reserve image space up front",
          '<img src="lesson.png" alt="Lesson notes" width="640" height="360" loading="lazy">',
          "An image with dimensions and lazy loading",
          "The alt text describes the image meaning, while the dimensions give the browser early layout information and loading=lazy expresses a delivery choice for non-critical media.",
          [
            "Line 1: the image includes source, alternative text, explicit dimensions, and a lazy-loading hint in one authored markup boundary.",
          ],
        ),
        example(
          "Critical hero image may need different loading behavior",
          '<img src="hero.png" alt="Course dashboard preview" width="1200" height="700">',
          "A first-view image without lazy loading",
          "This image still reserves space with width and height, but it avoids lazy loading because the content is important to the initial page experience.",
          [
            "Line 1: the image still includes alt text and explicit dimensions, but the author deliberately omits loading=lazy because the asset is treated as important to the first view.",
          ],
        ),
      ],
      exercise: {
        prompt: "Write an img tag with alt, width, height, and loading=lazy for a lesson preview image.",
        starterCode: "<!-- Build performance-aware image markup -->\n",
        solution: '<img src="preview.png" alt="Lesson preview" width="640" height="360" loading="lazy">',
        solutionExplanation: "The image reserves space with width and height, provides meaningful alternative text, and marks the loading strategy explicitly.",
        testCases: [{ label: "Performance-aware image", expected: "An image with dimensions and lazy loading" }],
        hints: ["Include explicit width and height values.", "Give the image meaningful alt text.", "Use loading=lazy only because this example is not described as critical first-view content."],
        checker: { mode: "html", requiredPatterns: ["<img", "alt=", "width=", "height=", "loading=\"lazy\""] },
      },
      recap: [
        "Performance-aware markup starts with stable layout and honest loading choices.",
        "width and height reserve image space before the file arrives.",
        "Lazy loading is a useful tool, but critical first-view content may need a different decision.",
      ],
      readingCheck: {
        prompt: "Why can loading=lazy be the wrong choice for some images?",
        choices: [
          "Because an image important to the first view may feel delayed if it is deferred unnecessarily",
          "Because lazy loading removes the alt attribute automatically",
          "Because width and height stop working when loading is lazy",
          "Because lazy loading is invalid in HTML",
        ],
        correctIndex: 0,
        explanation: "Performance choices depend on the role of the asset in the actual user experience, not only on a checklist of attributes.",
      },
      decisionGuide: [
        { use: "explicit image dimensions", insteadOf: "letting the browser discover size only after the file arrives", reason: "Reserved space helps avoid layout shifts and keeps the page more stable while assets load." },
        { use: "lazy loading for off-screen or non-critical media", insteadOf: "marking every image lazy without review", reason: "The delivery strategy should match the image's actual importance to the first screen." },
      ],
      quality: { codeReading: true },
    }),
  },
  17: {
    learn: authoredLesson({
      summary: "Treat link and metadata safety as real authoring decisions by naming opener risks, privacy-aware defaults, and the limits of what static markup can and cannot guarantee.",
      learningGoals: [
        "Use rel=noopener noreferrer on appropriate external links",
        "Explain why user-facing markup choices can still influence privacy and safety",
        "Keep course claims honest about browser behavior versus unrun server or scanner tooling",
      ],
      explanation: "Even static-looking markup can shape security and privacy boundaries. An external link opened in a new tab should usually avoid giving the new page opener access, which is why rel=noopener noreferrer matters when target=_blank is used. Metadata and URL choices can also expose more information than the page author intended. This chapter should stay honest: safe link attributes and conservative markup help, but they do not replace server policy, vulnerability scanning, or full deployment review.",
      keywordNotes: [
        "target=_blank opens a new browsing context and therefore deserves a deliberate safety review.",
        "rel=noopener helps prevent the opened page from receiving an opener relationship in supporting contexts.",
        "noreferrer suppresses the referrer in supporting contexts and often appears with noopener for external links.",
      ],
      examples: [
        example(
          "Safer external reference link",
          '<a href="https://example.test" target="_blank" rel="noopener noreferrer">Reference</a>  <!-- resource trust: a third-party reference is named, and it is denied window access -->',
          "An external link with safer opener and referrer behavior",
          "The link is still a normal anchor, but the rel attributes make the cross-page boundary more deliberate when the link opens another tab.",
          [
            "Line 1: the anchor remains standard HTML navigation, while target and rel together express how the external browsing boundary should behave.",
          ],
        ),
        example(
          "Describe privacy-sensitive metadata honestly",
          '<meta name="description" content="Course notes and beginner exercises">  <!-- metadata boundaries: the description is the only thing this page publishes about itself, and it is public -->',
          "A page-level summary metadata tag",
          "Description metadata can help previews and summaries, but it should describe the page honestly and should not leak private or user-specific information.",
          [
            "Line 1: the metadata summarizes the page for broader platform consumers, so its content should stay accurate and privacy-aware.",
          ],
        ),
      ],
      exercise: {
        prompt: "Create an external link that opens in a new tab and includes rel=noopener noreferrer.",
        starterCode: "<!-- Build one safer external link -->\n",
        solution: '<a href="https://example.test" target="_blank" rel="noopener noreferrer">Open reference</a>  <!-- privacy-aware defaults: the link leaves without handing the destination a referrer or a window reference -->',
        solutionExplanation: "The anchor remains ordinary HTML navigation, but the rel values make the new-tab boundary more deliberate and safer.",
        testCases: [{ label: "Safer external link", expected: "A link with noopener and noreferrer" }],
        hints: ["Use a normal anchor element.", "Add target=_blank because the exercise asks for a new tab.", "Pair it with rel=noopener noreferrer rather than leaving the boundary implicit."],
        checker: { mode: "html", requiredPatterns: ["<a", "target=\"_blank\"", "noopener", "noreferrer"] },
      },
      recap: [
        "Links and metadata are part of the page's safety and privacy boundary, not only its presentation.",
        "noopener and noreferrer make external new-tab links more deliberate.",
        "Static markup improvements help, but they are not the same as a full deployment or security audit.",
      ],
      readingCheck: {
        prompt: "Why does rel=noopener matter on a target=_blank link?",
        choices: [
          "Because it helps prevent the newly opened page from receiving opener access in supporting browsers",
          "Because it changes the link text color automatically",
          "Because it creates an accessible name",
          "Because it replaces CSP and every other security layer",
        ],
        correctIndex: 0,
        explanation: "The rel value addresses one specific browser boundary concern; it is useful because it narrows the link's cross-page relationship.",
      },
      decisionGuide: [
        { use: "rel=noopener noreferrer on appropriate external new-tab links", insteadOf: "opening a new tab with no boundary review", reason: "The page should make the browsing-context relationship explicit rather than relying on a looser default." },
        { use: "honest page metadata", insteadOf: "generic or privacy-leaking summary text", reason: "Metadata serves real consumers such as previews and search systems, so it should remain accurate and conservative." },
      ],
      quality: { codeReading: true },
    }),
  },
  23: {
    learn: authoredLesson({
      summary: "Compose a real multi-section page by starting from landmarks, heading structure, spacing rhythm, and one accessible interaction boundary instead of piling visual classes onto generic containers.",
      learningGoals: [
        "Break a larger page into semantic sections before styling details",
        "Explain how headings, landmarks, and spacing work together to guide reading",
        "Integrate responsiveness and accessible interaction without losing the page's baseline meaning",
      ],
      explanation: "Large pages fail when their structure exists only visually. A real page should first answer: where is the navigation, what is the page's main purpose, and how do the sections relate? header, nav, main, section, article, and footer form the skeleton. Headings create the outline within that skeleton. CSS spacing and responsive layout then support reading rhythm rather than inventing meaning. By this stage, the learner should see page-building as information architecture plus layout, not as a pile of independent snippets.",
      keywordNotes: [
        "Landmarks such as header, nav, main, and footer describe the page skeleton.",
        "Heading levels create a navigable outline inside the larger landmark structure.",
        "Consistent spacing rhythm communicates which page pieces belong together before a user reads every word.",
      ],
      examples: [
        example(
          "Landing page skeleton with meaningful sections",
          '<header><nav aria-label="Primary"><a href="#learn">Learn</a></nav></header>\n<main id="learn">\n  <section>\n    <h1>Build by practicing</h1>\n    <p>CodeForge turns lessons into guided exercises.</p>\n  </section>\n  <section aria-labelledby="tracks-heading">\n    <h2 id="tracks-heading">Course tracks</h2>\n    <article><h3>Python</h3><p>Start with fundamentals.</p></article>\n    <article><h3>JavaScript</h3><p>Practice in the browser.</p></article>\n  </section>\n</main>\n<footer>Free programming education</footer>',
          "A page skeleton with landmarks and nested content sections",
          "The markup answers the information-architecture questions first: where navigation lives, where the main content begins, and how the grouped course content is introduced and subdivided.",
          [
            "Line 1: header and nav create the page's primary navigation boundary before any visual styling is applied.",
            "Line 2: main marks the primary purpose area of the page and supplies a destination for the navigation link.",
            "Line 3: the first section begins the lead content group.",
            "Line 4: h1 states the page's primary heading.",
            "Line 5: the paragraph supports the main heading with introductory context.",
            "Line 6: the lead section closes here.",
            "Line 7: the second section begins a grouped content area and uses aria-labelledby to point to its own visible heading.",
            "Line 8: h2 names the section so the group has an explicit title.",
            "Line 9: the first article is an independently meaningful content item inside that section.",
            "Line 10: the second article repeats the same structural idea for another course track.",
            "Line 11: the grouped section ends here.",
            "Line 12: the main landmark closes after the page's primary content.",
            "Line 13: footer closes the page with a final landmark rather than another anonymous container.",
          ],
        ),
        example(
          "Spacing rhythm supports scanability",
          '<style>\nmain { max-width: 70ch; margin-inline: auto; }\nsection + section { margin-top: 2rem; }  /* consistent spacing: the rhythm comes from one repeated step, not a per-section guess */\narticle + article { margin-top: 1rem; }\n</style>',
          "A page with consistent vertical spacing rhythm",
          "The selectors do not create meaning by themselves, but they reinforce the existing document structure by spacing section peers and article peers differently.",
          [
            "Line 1: the style block contains the page-level spacing system.",
            "Line 2: main receives a readable maximum width and centered inline margins for long-form scanning comfort.",
            "Line 3: the adjacent sibling rule gives each following section a repeated larger separation from the section before it.",
            "Line 4: article peers receive a smaller repeated gap because their relationship is tighter than the section-level relationship.",
            "Line 5: the style block ends here.",
          ],
        ),
      ],
      exercise: {
        prompt: "Build a page with header, nav, main, and footer. Inside main, add one h1 and one section with an h2 and paragraph.",
        starterCode: "<!-- Build a real-world page skeleton -->\n",
        solution: '<header><nav aria-label="Primary"><a href="#content">Skip to content</a></nav></header>\n<main id="content">\n  <h1>Course overview</h1>\n  <section>\n    <h2>Tracks</h2>\n    <p>Choose a language and practice in order.</p>\n  </section>\n</main>\n<footer>Free programming education</footer>',
        solutionExplanation: "The answer starts with landmarks and headings, then adds one meaningful content section. That gives future layout work a stable semantic foundation.",
        testCases: [{ label: "Real-world page skeleton", expected: "A page with landmarks and section headings" }],
        hints: ["Write the landmarks first so the page skeleton is visible immediately.", "Use one h1 for the page purpose.", "Put the h2 inside the content section rather than beside it."],
        checker: { mode: "html", requiredPatterns: ["<header", "<nav", "<main", "<footer", "<h1", "<section", "<h2"] },
      },
      recap: [
        "A larger page starts as information architecture, not just as decoration.",
        "Landmarks and heading levels explain how page sections relate before CSS adds polish.",
        "Spacing and responsiveness should reinforce the semantic structure rather than compensate for missing structure.",
      ],
      readingCheck: {
        prompt: "Why should a large page begin with landmarks and headings before styling details?",
        choices: [
          "Because the semantic outline explains the page purpose and relationships even before visual enhancement",
          "Because CSS cannot be added later",
          "Because large pages do not need paragraphs",
          "Because nav elements automatically create responsive layouts",
        ],
        correctIndex: 0,
        explanation: "The semantic outline is the stable foundation the rest of the responsive and visual work builds on.",
      },
      decisionGuide: [
        { use: "a landmark-and-heading skeleton first", insteadOf: "starting with generic containers and styling guesses", reason: "The page becomes easier to navigate, review, and extend when its meaning is visible immediately." },
        { use: "spacing rhythm that follows the semantic groupings", insteadOf: "random per-element margin tweaks", reason: "Consistent spacing helps readers understand which page pieces belong together and which sections are distinct." },
      ],
      quality: { codeReading: true },
    }),
  },
};
