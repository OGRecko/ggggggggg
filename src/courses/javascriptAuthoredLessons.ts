import type { Example } from "../data/types";
import { authoredLesson, type LessonOverrideLibrary } from "./chapterPlanHelpers";

const jsMistakes: Example["mistakes"] = [
  { mistake: "Reading a binding before the intended scope creates it", error: "ReferenceError or an unexpected outer value", fix: "Trace where the binding is declared and which scope each function closes over before changing the logic." },
  { mistake: "Capturing one mutable value when each callback needs its own copy", error: "Every callback prints the same stale or final value", fix: "Introduce a fresh lexical binding per iteration or move the value into the closure's parameter list." },
  { mistake: "Using innerHTML for plain text", error: "Unsafe markup interpretation or a DOM structure bug", fix: "Use textContent for plain text and treat HTML parsing as a separate, explicit decision." },
];

const example = (title: string, code: string, output: string, explanation: string, lines: string[]): Example => ({
  title,
  code,
  output,
  explanation,
  lines,
  mistakes: jsMistakes,
});

export const javascriptAuthoredLessons: LessonOverrideLibrary = {
  4: {
    learn: authoredLesson({
      summary: "Understand lexical scope, closures, and why a function remembers the bindings around it rather than copying every value blindly.",
      learningGoals: [
        "Explain lexical scope in JavaScript terms",
        "Predict what a closure will read after outer state changes",
        "Choose between function declarations and closures for one focused responsibility",
      ],
      explanation: "JavaScript resolves names lexically: a function first looks in its own scope, then walks outward through the scopes that existed when the function was created. That remembered scope chain is a closure. Closures are useful because they keep state near the behavior that needs it, but they also create bugs when code accidentally shares one mutable binding between several callbacks. This chapter's goal is not just to write `=>`; it is to understand what data a function can still see later and why.",
      keywordNotes: [
        "A lexical scope is the set of bindings that are visible where code is written, not where it is called from later.",
        "A closure is a function plus the outer bindings it can still read after the outer function has returned.",
        "The temporal dead zone means a let or const binding exists in scope before initialization but cannot be read safely yet.",
        "bind sets the this value for a call site, but it does not change which lexical variables a closure captured.",
      ],
      examples: [
        example(
          "Closure keeps one private count",
          'function makeCounter() {\n  let count = 0;\n  return () => {\n    count += 1;\n    return count;\n  };\n}\nconst counter = makeCounter();\nconsole.log(counter());\nconsole.log(counter());',
          '1\n2',
          "The returned arrow function closes over the count binding created by one call to makeCounter, so each later call updates the same private state.",
          [
            "Line 1: makeCounter creates a fresh scope each time someone calls it, so every counter starts with its own independent bindings.",
            "Line 2: count is initialized once for this counter instance. Because the binding lives in the outer scope, later inner calls can still reach it.",
            "Line 3: the returned arrow function is the closure. It does not copy count's value now; it remembers how to reach that binding later.",
            "Line 4: count += 1 reads the current outer value, increments it, and stores the new value back into the same binding. Removing this line would make every call return 0 forever.",
            "Line 5: the closure returns the updated count so callers can observe the state transition directly.",
            "Line 6: the function body ends, but count is still kept alive because the returned closure still references it.",
            "Line 7: counter now stores one specific closure instance. A second call to makeCounter() would create a different private count binding.",
            "Line 8: the first invocation updates count from 0 to 1 and logs 1.",
            "Line 9: the second invocation reaches the same preserved binding, updates 1 to 2, and logs 2 instead of starting over.",
          
          "Line 10: the closing line ends the example after the preserved binding has been observed twice.",],
        ),
        example(
          "One shared binding causes stale callback behavior",
          'const handlers = [];\nfor (let index = 0; index < 3; index += 1) {\n  handlers.push(() => index);\n}\nconsole.log(handlers[0](), handlers[2]());',
          '0 2',
          "Using let creates a new loop binding each iteration, so each stored callback closes over a different index value instead of sharing one final number.",
          [
            "Line 1: handlers stores functions so we can test what each closure remembers later.",
            "Line 2: let index creates a fresh block-scoped binding for the loop body on each iteration. Using var here would create one shared function-scoped binding instead.",
            "Line 3: each pushed arrow closes over the current iteration's index binding, not over a copied literal value typed into the source.",
            "Line 4: the loop ends after producing three closures with three distinct lexical environments.",
            "Line 5: calling handlers[0] returns the first binding's value 0, while handlers[2] returns the third binding's value 2. If line 2 used var, both calls would report 3 after the loop finished.",
          ],
        ),
      ],
      exercise: {
        prompt: "Write function makePrefix(prefix) that returns a closure. The closure accepts value and returns prefix + value. Log makePrefix(\"JS: \" )(\"closures\") so the output is JS: closures.",
        starterCode: "// Return a closure that remembers one prefix\n",
        solution: 'function makePrefix(prefix) {\n  return function (value) {\n    return prefix + value;\n  };\n}\nconsole.log(makePrefix("JS: ")("closures"));',
        solutionExplanation: "makePrefix creates the outer binding prefix. The returned inner function closes over that binding and can still read it later when the value arrives.",
        testCases: [{ label: "Prefix closure", expected: "JS: closures" }],
        hints: ["Return a function from makePrefix instead of logging immediately.", "The inner function should accept value and use prefix from the outer scope.", "Call the outer function first, then call the returned function with the text to format."],
      },
      recap: [
        "A closure remembers bindings from the lexical environment where the function was created.",
        "let in a loop gives each callback a separate binding, while an accidental shared binding creates stale-state bugs.",
        "Function design in JavaScript includes deciding what state stays private inside a closure and what should be passed as an argument instead.",
      ],
      readingCheck: {
        prompt: "Why would replacing let index with var index in the loop example change the result?",
        choices: [
          "Because var creates one shared function-scoped binding for every callback",
          "Because var converts the callbacks into methods",
          "Because let is asynchronous and var is synchronous",
          "Because closures stop working when var is used",
        ],
        correctIndex: 0,
        explanation: "The callbacks would all read the same var binding after the loop completed, so they would observe the final loop value rather than separate iteration values.",
      },
      decisionGuide: [
        { use: "a closure for one small piece of private state", insteadOf: "an unrelated shared global variable", reason: "The state stays near the behavior that owns it, so the reader can audit one small lexical boundary instead of the whole file." },
        { use: "function arguments for changing data", insteadOf: "capturing every value implicitly", reason: "Passing inputs explicitly makes it clearer which values vary call by call and which values the closure is intentionally preserving." },
      ],
      quality: { codeReading: true, prediction: true, debugging: true, modification: true, edgeCase: true },
    }),
  },
  7: {
    learn: authoredLesson({
      summary: "Use DOM APIs with honest browser boundaries, guarding missing elements and preferring textContent when the job is plain text.",
      learningGoals: [
        "Explain what querySelector returns and why null checks matter",
        "Choose textContent over innerHTML for plain text updates",
        "Describe event delegation as a scaling strategy for repeated controls",
      ],
      explanation: "The DOM is a live document tree, not a string template. querySelector returns either a matching element or null, so safe code treats missing structure as a real branch. textContent updates plain text without asking the browser to parse markup, which makes it the default choice for untrusted or ordinary text. Event delegation matters because real UIs often create or destroy repeated child elements; a parent listener can observe bubbled events without attaching one listener to every button.",
      keywordNotes: [
        "querySelector returns the first matching Element or null when no matching node exists.",
        "textContent changes plain text and does not parse HTML tags from the provided string.",
        "event.target identifies the element that triggered a bubbled event inside a delegated listener.",
        "A guard such as if (!title) return protects the code from missing-document structure.",
      ],
      examples: [
        example(
          "Guard a missing element before mutation",
          'const title = document.querySelector("h1");\nif (!title) {\n  console.log("missing heading");\n} else {\n  title.textContent = "Ready";\n}',
          'Heading changes to Ready, or the guard logs missing heading',
          "The null guard makes the document boundary explicit instead of assuming the page always contains the required element.",
          [
            "Line 1: querySelector asks the browser document for the first h1 element. The result may be an element or null, so this line creates a real branch point in the program's state.",
            "Line 2: the guard checks the failure boundary first. If this line were removed, line 5 could throw when title is null.",
            "Line 3: the fallback log records the missing-structure path instead of letting the bug stay silent.",
            "Line 4: the else branch makes it clear that the mutation below only runs when a real element was found.",
            "Line 5: textContent replaces the heading's plain text only. Using innerHTML here would ask the browser to parse markup, which is unnecessary for a simple label change.",
            "Line 6: the block ends after either handling the failure path or safely mutating the heading.",
          ],
        ),
        example(
          "Delegate one click handler for repeated buttons",
          'const list = document.querySelector("[data-lessons]");\nlist?.addEventListener("click", (event) => {\n  const button = event.target.closest("button[data-lesson-id]");\n  if (!button) return;\n  console.log(button.dataset.lessonId);\n});',
          'A clicked lesson button logs its lesson id',
          "Delegation attaches one listener to a stable parent and then narrows the event target to the child button that matches the intended interaction rule.",
          [
            "Line 1: the parent container is the stable element that will outlive individual child buttons, making it a good delegation anchor.",
            "Line 2: one listener observes bubbled click events for the whole list instead of installing a separate listener on each lesson button.",
            "Line 3: closest walks upward from the actual clicked node to the nearest button carrying the expected data attribute. This handles clicks on nested spans inside the button too.",
            "Line 4: if no matching button is involved, the handler exits immediately so unrelated clicks inside the container do not trigger lesson behavior.",
            "Line 5: dataset.lessonId reads the semantic identifier stored in the HTML attribute and makes the chosen lesson visible for debugging or the next state transition.",
            "Line 6: the listener finishes after handling the delegated event path.",
          ],
        ),
      ],
      exercise: {
        prompt: "Write browser-safe DOM code that selects a button, returns early if it is missing, then sets its textContent to Saved. This lesson uses structural review only.",
        starterCode: "const saveButton = document.querySelector(\"button\");\n// Guard the boundary, then update the visible label\n",
        solution: 'const saveButton = document.querySelector("button");\nif (!saveButton) return;\nsaveButton.textContent = "Saved";',
        solutionExplanation: "The null guard protects the document boundary, and textContent performs a plain-text update without introducing HTML parsing.",
        testCases: [{ label: "DOM structure", expected: "Guarded button update" }],
        hints: ["Treat querySelector as possibly returning null.", "Write the missing-element guard before the mutation.", "Use textContent for the visible label change."],
        checker: {
          mode: "patterns",
          requiredPatterns: ["querySelector", "if\\s*\\(!saveButton\\)", "textContent"],
          forbiddenPatterns: ["innerHTML"],
          successMessage: "The exercise shows a guarded DOM selection and a textContent update.",
        },
      },
      recap: [
        "DOM code should treat missing structure as a real branch instead of assuming every selector succeeds.",
        "textContent is the default safe choice for plain text updates because it does not parse markup.",
        "Event delegation keeps repeated UI behavior maintainable by attaching one listener at a stable parent boundary.",
      ],
      readingCheck: {
        prompt: "Why does the delegated click example use closest(" + '"button[data-lesson-id]"' + ") instead of checking event.target directly?",
        choices: [
          "Because the user might click a nested child inside the button and closest can recover the intended control",
          "Because event.target is always null in the browser",
          "Because closest makes the listener asynchronous",
          "Because querySelector cannot find buttons",
        ],
        correctIndex: 0,
        explanation: "Delegated handlers often receive nested clicked nodes such as icons or spans. closest climbs to the intended button boundary before the logic continues.",
      },
      decisionGuide: [
        { use: "textContent for plain text", insteadOf: "innerHTML for every update", reason: "Plain text changes do not need HTML parsing, and the safer default reduces XSS and structure mistakes." },
        { use: "a parent listener plus target narrowing", insteadOf: "dozens of near-identical child listeners", reason: "Delegation scales better when the DOM list changes over time and keeps the interaction rule in one place." },
      ],
      verification: ["structurally-checked", "pattern-checked"],
      quality: { codeReading: true, prediction: true, debugging: true, modification: true, edgeCase: true },
    }),
  },
  18: {
    learn: authoredLesson({
      summary: "Model server-side JavaScript honestly by separating pure route logic from the runtime adapter that would call it in Node or another host.",
      learningGoals: [
        "Explain why route decisions can be tested as pure functions",
        "Separate request parsing from response policy",
        "Describe honest limits of a browser-only course when discussing server code",
      ],
      explanation: "A route handler usually does at least three jobs: parse input, decide business behavior, and translate that behavior into an HTTP response. Good architecture separates the pure decision from the runtime adapter. That separation matters because request objects, sockets, streaming, and environment variables belong to the host runtime boundary. CodeForge can teach the server-side design and testable route logic, but it should not pretend this browser tab launched a real Node process.",
      keywordNotes: [
        "A pure function can decide a status or payload from inputs without depending on a live server object.",
        "An adapter is the runtime-facing layer that reads the real request and writes the real response later.",
        "Configuration belongs at the runtime boundary, not hard-coded deep inside route logic.",
      ],
      examples: [
        example(
          "Route decision as a pure function",
          'function statusFor(path) {\n  if (path === "/health") return 200;\n  if (path === "/lessons") return 200;\n  return 404;\n}\nconsole.log(statusFor("/health"));',
          '200',
          "The function can be reviewed and tested without a live HTTP server because it depends only on the input path string.",
          [
            "Line 1: statusFor defines the pure decision boundary. The function needs only the path string, so its behavior is independent of sockets or framework objects.",
            "Line 2: the first condition handles the health-check route explicitly. This makes the success path obvious to a reader and easy to test.",
            "Line 3: the second condition represents another named route. Keeping routes explicit is safer than letting accidental string overlap decide behavior.",
            "Line 4: the fallback returns 404 so unknown paths still produce a deliberate response rather than an implicit success.",
            "Line 5: the function body ends after describing all supported path outcomes.",
            "Line 6: logging the pure function result demonstrates how the rule can be observed in the worker sandbox even though no real server is running.",
          ],
        ),
        example(
          "Separate validation from response formatting",
          'function createLessonTitle(title) {\n  const cleaned = title.trim();\n  if (!cleaned) return { status: 400, body: "title required" };\n  return { status: 201, body: cleaned };\n}\nconsole.log(createLessonTitle("  JS  ").status);',
          '201',
          "The function models business validation and a response-shaped result object separately from any framework-specific request or response classes.",
          [
            "Line 1: createLessonTitle names one business action instead of mixing unrelated transport concerns into a giant handler.",
            "Line 2: trim normalizes the user input before the validation rule runs. If this line were removed, whitespace-only titles could slip through.",
            "Line 3: the 400 path makes the validation failure explicit and returns a response-shaped object the adapter could translate later.",
            "Line 4: the success path returns a 201-style created result with the cleaned value.",
            "Line 5: logging the status demonstrates the rule through ordinary JavaScript execution even without a live HTTP framework.",
          
          "Line 6: the closing line observes the response shape produced by the validation boundary.",],
        ),
      ],
      exercise: {
        prompt: "Write function statusFor(path) that returns 200 for /health and 404 otherwise. Log statusFor(\"/health\").",
        starterCode: "// Keep the route rule pure and runtime-independent\n",
        solution: 'function statusFor(path) {\n  return path === "/health" ? 200 : 404;\n}\nconsole.log(statusFor("/health"));',
        solutionExplanation: "The route rule is expressed as a pure function, so the logic can be executed and tested without claiming a live Node server exists.",
        testCases: [{ label: "Health route", expected: "200" }],
        hints: ["Do not build a fake request object when the path string is enough for this rule.", "Return the status code from the function instead of printing inside the condition.", "Use one final console.log to observe the decision."],
      },
      recap: [
        "Server-side design is easier to test when the business rule is separated from the runtime adapter.",
        "Validation belongs in the decision flow, while transport objects and environment configuration stay at the host boundary.",
        "This course can execute pure JavaScript route logic, but it does not claim to launch a real Node server.",
      ],
      readingCheck: {
        prompt: "What is the main architectural benefit of keeping statusFor(path) pure?",
        choices: [
          "It can be reviewed and tested without a live server runtime",
          "It automatically opens network sockets",
          "It removes the need for configuration",
          "It converts every status into JSON",
        ],
        correctIndex: 0,
        explanation: "Pure logic keeps the domain rule independent of a specific framework or host process, which makes testing and review simpler.",
      },
      decisionGuide: [
        { use: "a pure route function", insteadOf: "burying every rule directly inside framework callbacks", reason: "The business decision can be tested and reviewed without dragging in transport objects or environment setup." },
        { use: "a response-shaped value object", insteadOf: "stringly-typed success flags", reason: "Status and body stay explicit, so the later adapter knows exactly what to translate into HTTP." },
      ],
      quality: { codeReading: true, prediction: true, debugging: true, modification: true, edgeCase: true },
    }),
  },
  21: {
    learn: authoredLesson({
      summary: "Defend browser code against XSS and unsafe origin assumptions by choosing the safest default output path for untrusted data.",
      learningGoals: [
        "Explain why innerHTML is dangerous for untrusted text",
        "Separate escaping concerns from same-origin and CORS concerns",
        "Model a safer text-rendering path before adding richer markup features",
      ],
      explanation: "Browser security has layers. XSS is about what happens when untrusted data is interpreted as executable markup or script. same-origin policy and CORS are about which origins a browser lets a page read from. These are related only because they both live at the browser boundary; one does not solve the other. For plain text, the safest default is to keep the data as text all the way to the DOM update. When markup is truly needed, the program must adopt a deliberate sanitization strategy instead of treating HTML parsing as harmless.",
      keywordNotes: [
        "textContent inserts plain text and does not parse HTML tags from the provided value.",
        "innerHTML asks the browser to parse the string as markup, which is dangerous for untrusted input.",
        "same-origin policy limits how scripts read data across origins, while CORS is the browser's opt-in sharing mechanism for that boundary.",
      ],
      examples: [
        example(
          "Keep untrusted text as text",
          'const renderPreview = (text) => {\n  const preview = { textContent: "" };\n  preview.textContent = text;\n  return preview.textContent;\n};\nconsole.log(renderPreview("<script>alert(1)</script>"));',
          '<script>alert(1)</script>',
          "The dangerous-looking string stays text because the code never asks the browser to treat it as markup.",
          [
            "Line 1: renderPreview names one rendering boundary whose job is to place user text safely.",
            "Line 2: the preview object stands in for a DOM node's textContent property in this worker-safe example.",
            "Line 3: assigning to textContent preserves the characters as text. If this line used innerHTML in a real document, the browser would start parsing tags instead.",
            "Line 4: returning the stored text lets the example prove what value the rendering path preserved.",
            "Line 5: the logged result still shows literal angle brackets, demonstrating that the text path did not execute anything.",
          
          "Line 6: the closing line observes the escaped text returned by the rendering path.",],
        ),
        example(
          "Separate origin policy from text escaping",
          'const request = { origin: "https://app.example", url: "https://api.example/data" };\nconst sameOrigin = new URL(request.origin).origin === new URL(request.url).origin;\nconsole.log(sameOrigin);',
          'false',
          "Comparing origins answers a network-access question, not an HTML-escaping question. The two security boundaries must stay conceptually separate.",
          [
            "Line 1: the request object models two different browser boundaries: where the page is running and which resource it wants to read.",
            "Line 2: the URL objects normalize the origin comparison instead of using fragile string slicing. The boolean result answers only the cross-origin question.",
            "Line 3: false shows that the request crosses origins, which would matter for browser policy and CORS but says nothing about whether any returned text is safe to inject as HTML.",
          ],
        ),
      ],
      exercise: {
        prompt: "Write const safe = text => text.replaceAll('<', '&lt;'); then log safe('<tag>').",
        starterCode: "// Escape the opening angle bracket before rendering or logging\n",
        solution: "const safe = text => text.replaceAll('<', '&lt;');\nconsole.log(safe('<tag>'));",
        solutionExplanation: "Replacing the opening angle bracket models one small escaping step. Real applications also need context-specific handling, but this exercise keeps the text boundary explicit.",
        testCases: [{ label: "Escaped text", expected: "&lt;tag>" }],
        hints: ["Use replaceAll on the incoming text.", "Escape the opening angle bracket before output.", "Keep the transformation in a helper so the boundary stays visible."],
      },
      recap: [
        "XSS and origin policy are different browser security boundaries and should not be explained as one feature.",
        "For plain text, textContent is the safer default because it does not parse markup.",
        "Security design improves when the rendering boundary is explicit and the program treats untrusted data as hostile until proved otherwise.",
      ],
      readingCheck: {
        prompt: "Why does comparing origins not make innerHTML safe for untrusted text?",
        choices: [
          "Because origin policy controls cross-origin reading, while innerHTML risk comes from HTML parsing of the string itself",
          "Because same-origin policy disables the DOM",
          "Because innerHTML only works on remote pages",
          "Because textContent ignores all security rules",
        ],
        correctIndex: 0,
        explanation: "Origin checks and CORS answer network-access questions. HTML injection safety depends on how the page treats the string once it already has it.",
      },
      decisionGuide: [
        { use: "textContent for plain text output", insteadOf: "innerHTML by habit", reason: "The safer default avoids unnecessary markup parsing and reduces XSS risk for ordinary UI labels." },
        { use: "context-specific security explanations", insteadOf: "one vague browser security slogan", reason: "Learners need to distinguish escaping, same-origin policy, and CORS because they solve different problems." },
      ],
      quality: { codeReading: true, prediction: true, debugging: true, modification: true, edgeCase: true },
    }),
  },
  24: {
    learn: authoredLesson({
      summary: "Design JavaScript feature modules with explicit configuration, safe logging boundaries, and APIs that are small enough to review.",
      learningGoals: [
        "Explain why configuration and logging are engineering boundaries",
        "Keep one feature's public API smaller than its internal helpers",
        "Describe what should stay out of browser source code such as secrets or environment-specific values",
      ],
      explanation: "Professional JavaScript code fails when every module reaches into global state, prints ad hoc logs, and hard-codes environment details. A maintainable module takes configuration at the boundary, exposes one or two explicit operations, and sends observability data through a deliberate logging interface rather than sprinkling console calls everywhere. That discipline matters before deployment because it shapes code review, testing, and incident debugging. In browser code, it also means not pretending client-side source is a safe home for secrets.",
      keywordNotes: [
        "Configuration values belong at the boundary where environment-specific choices enter the feature.",
        "A logging adapter separates domain decisions from the transport used to record them.",
        "A public API is the small surface other modules are expected to call; internal helpers should stay replaceable.",
      ],
      examples: [
        example(
          "Inject configuration at construction time",
          'function createFormatter(config) {\n  return {\n    format(title) {\n      return `${config.prefix}${title.trim()}`;\n    },\n  };\n}\nconst formatter = createFormatter({ prefix: "JS: " });\nconsole.log(formatter.format(" closures "));',
          'JS: closures',
          "The feature receives its environment-specific prefix through configuration instead of reading an unrelated global variable.",
          [
            "Line 1: createFormatter is the boundary where the feature receives configuration. Passing config in makes the dependency explicit for reviewers and tests.",
            "Line 2: the returned object is the feature's public API. Keeping it small reduces the number of promises other modules rely on.",
            "Line 3: format is one named operation the rest of the app may call.",
            "Line 4: trim cleans caller input, then the configured prefix is applied. Removing trim would preserve accidental edge whitespace in the public output.",
            "Line 5: the method body ends after producing one deterministic string result.",
            "Line 6: the public API object is returned to the caller.",
            "Line 7: the caller chooses the environment-specific prefix value at the boundary instead of hard-coding it deep in the helper.",
            "Line 8: the final console.log observes the feature behavior for this small example, but a larger system could call format from elsewhere without changing the helper itself.",
          
          "Line 9: the closing line observes the configured behavior through the injected prefix.",],
        ),
        example(
          "Send observability through an adapter",
          'function saveDraft(log, title) {\n  const cleaned = title.trim();\n  if (!cleaned) {\n    log("draft_rejected", { reason: "blank title" });\n    return false;\n  }\n  log("draft_saved", { title: cleaned });\n  return true;\n}\nconsole.log(saveDraft(() => {}, " CodeForge "));',
          'true',
          "Passing a log function keeps observability explicit and testable without coupling the domain rule to one global console policy.",
          [
            "Line 1: saveDraft receives a logging adapter and the business input separately, which keeps the dependency visible.",
            "Line 2: trim normalizes the title before validation and logging decisions use it.",
            "Line 3: the validation branch handles the boundary case first.",
            "Line 4: the rejected path records a structured reason through the provided adapter. A caller could route that to the console, telemetry, or tests later.",
            "Line 5: false reports the failed save outcome without pretending the blank title was acceptable.",
            "Line 6: the success path logs a different event name and structured payload.",
            "Line 7: true reports the domain outcome after the success path completed.",
            "Line 8: the example passes a no-op logger to prove the domain rule can still be executed and observed independently of a real logging backend.",
          
          "Line 9: the adapter boundary receives the observability event without the domain code knowing which logger is used.",
          "Line 10: the closing line observes the domain outcome after the adapter ran.",],
        ),
      ],
      exercise: {
        prompt: "Write function formatTitle(config, text) that returns config.prefix + text.trim(). Log the result for { prefix: 'JS: ' } and ' architecture '.",
        starterCode: "// Keep configuration explicit instead of reading a hidden global\n",
        solution: 'function formatTitle(config, text) {\n  return config.prefix + text.trim();\n}\nconsole.log(formatTitle({ prefix: "JS: " }, " architecture "));',
        solutionExplanation: "The helper receives configuration explicitly, trims the caller input, and returns one deterministic value that another module could log or render later.",
        testCases: [{ label: "Configured formatter", expected: "JS: architecture" }],
        hints: ["Accept config as a parameter instead of reading from outer global state.", "Use trim on the text input before concatenating the prefix.", "Return the formatted string so callers decide how to use it."],
      },
      recap: [
        "Configuration, logging, and public APIs are engineering boundaries, not optional polish added only after deployment.",
        "Small explicit module surfaces are easier to review and safer to change than hidden global coordination.",
        "Browser code must not pretend secrets are safe in client-visible source just because the app is small.",
      ],
      readingCheck: {
        prompt: "Why is createFormatter({ prefix: 'JS: ' }) easier to review than reading prefix from a hidden global?",
        choices: [
          "Because the dependency is visible at the call boundary and tests can supply a different value deliberately",
          "Because globals are asynchronous only in browsers",
          "Because configuration cannot be an object",
          "Because trim only works with dependency injection",
        ],
        correctIndex: 0,
        explanation: "Explicit configuration makes the dependency clear to a reader and easy to vary during tests without changing unrelated files.",
      },
      decisionGuide: [
        { use: "explicit configuration parameters", insteadOf: "hidden globals and magic constants", reason: "Readers can see where environment-specific behavior enters the module and tests can replace it deliberately." },
        { use: "a logging adapter at the boundary", insteadOf: "console.log scattered through every branch", reason: "The domain rule stays focused while observability remains structured and replaceable." },
      ],
      quality: { codeReading: true, prediction: true, debugging: true, modification: true, edgeCase: true },
    }),
  },
};
