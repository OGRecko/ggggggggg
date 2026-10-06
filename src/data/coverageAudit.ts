export type CoverageStatus = "COMPLETE" | "PARTIAL" | "MISSING";

export type CoverageRow = {
  topic: string;
  status: CoverageStatus;
  lessons: string;
  exercises: string;
  projects: string;
  tests: string;
  execution: string;
  debugging: string;
};

const entry = (topic: string, status: CoverageStatus, detail: string, execution: string, debugging: string): CoverageRow => ({
  topic,
  status,
  lessons: detail,
  exercises: "Typed practice, reading prediction, debugging, modification, and build tasks where the runtime/checker can support them.",
  projects: "Chapter projects exist; project depth remains under audit.",
  tests: "Chapter tests and five-chapter cumulative checkpoints exist.",
  execution,
  debugging,
});

const pythonExecution = "Pyodide Worker executes supported standard-library Python examples.";
const staticJava = "On-device structural review only. CodeForge does not claim Java execution or compiler output.";
const staticCpp = "On-device structural review only. CodeForge does not claim C++ execution or compiler output.";
const browserPreview = "Sandboxed browser preview plus structural review.";
const jsExecution = "JavaScript Worker executes the examples that are safe to run, including async chains that settle in microtasks; DOM-bound code is reviewed structurally because no document exists in the Worker.";

// Deliberately conservative. Existing routes and generated lesson loops never promote a topic
// beyond PARTIAL unless the learner has enough real authored explanation, practice, and feedback.
export const coverageAudit: Record<string, CoverageRow[]> = {
  Python: [
    entry("Fundamentals and syntax", "PARTIAL", "Seven connected lessons in each of Chapters 1-3 cover variables, values, expressions, input, control flow, and beginner challenges, plus authored gap lessons on assignment forms, swaps, the walrus operator, and positional-only versus keyword-only parameters.", pythonExecution, "Syntax/runtime/logic feedback where Pyodide verifies code; trace and validation lessons included."),
    entry("Control flow and functions", "PARTIAL", "Chapters 3-4 cover conditions, loops, functions, recursion, defaults, closures, decorators, and parameter kinds at varying depth.", pythonExecution, "Dedicated reading, validation, case-study, and challenge material."),
    entry("Collections and data structures", "PARTIAL", "Lists, tuples, dictionaries, sets, frozenset, queues, heaps, graphs, collections.abc annotations, operator key helpers, and functional patterns are taught through Chapters 5, 11-13 and 15.", pythonExecution, "Edge examples included; full linked-list/tree implementation sequence remains shallow."),
    entry("Errors, files, and modules", "PARTIAL", "Exceptions, Path, JSON, imports, package concepts, entry-point guards, pyproject.toml, virtual-environment concepts, temporary directories, glob discovery, and shutil copying appear in Chapters 7-8.", pythonExecution, "Traceback, conversion, and expected-error examples; the sandbox filesystem is in-memory and package installation remains conceptual in the browser."),
    entry("OOP and advanced language features", "PARTIAL", "Classes, properties, dataclasses, enums, protocols, descriptors, decorators, context managers, singledispatch, pattern matching including class patterns, and the iterator protocol appear in Chapters 9-10 and 23.", pythonExecution, "Invariant and boundary examples included."),
    entry("Algorithms and complexity", "PARTIAL", "Searching, sorting, dynamic-programming concepts, BFS, heaps, and complexity discussions appear in Chapters 11-12 and labs.", pythonExecution, "Implementation challenges include edge paths; coverage is not yet equivalent to a dedicated algorithms course."),
    entry("Testing and debugging", "PARTIAL", "Assertions, traceback capture, f-string debug output, unittest concepts, test boundaries, logging, and challenge repair are taught in Chapters 14 and 24. Interactive pdb and coverage.py are described honestly as local-terminal tools.", pythonExecution, "No browser test-runner, interactive debugger, or coverage-report workflow."),
    entry("Typing, I/O, networking, concurrency, and databases", "PARTIAL", "Typing, JSON/API boundaries, SQLite, dates and durations, asyncio, thread/process/queue concepts, locks, memory layout with __slots__ and weakref, and profiling concepts appear in Chapters 15-19.", pythonExecution, "No production network stack, desktop multiprocessing runtime, or race visualizer."),
    entry("Security, performance, professional engineering, and capstone", "PARTIAL", "Validation, secrets concepts, environment configuration, configparser settings, dictConfig logging, deprecation warnings, CLI, web boundaries, observability, packaging/deployment concepts, text wrapping and templates, and capstone architecture appear in Chapters 6, 20-25.", pythonExecution, "No real deployment or multi-file production capstone runner."),
    entry("Packaging, environments, deployment, and multiprocessing", "PARTIAL", "Authored browser-safe lessons now teach project metadata, environment boundaries, deployment concepts, process separation, queues, and itertools-based lazy pipelines.", "Browser-only sandbox cannot reproduce full local environment, deployment, or desktop multiprocessing workflows faithfully.", "No real package install, process, or deployment diagnostics."),
    entry("Operating-system process boundaries", "PARTIAL", "Chapter 21 teaches subprocess argument lists, shlex quoting, and return-code inspection as a local workflow.", "The Pyodide worker cannot start operating-system processes, so CodeForge builds and inspects commands instead of executing them.", "No real external-program execution or exit-status diagnostics in the browser."),
  ],
  Java: [
    entry("Fundamentals, syntax, methods, and OOP", "PARTIAL", "Five learning-loop lessons per chapter plus authored labs at Chapters 5 and 10 cover Java-specific classes, records, interfaces, default interface methods, initializer order, collections, and generics. Every chapter project now ships an authored, prompt-faithful solution instead of the earlier generated placeholder.", staticJava, "Transparent structural repair only; no fabricated compiler diagnostics. Authored Java code is checked against its own required constructs and hand-reviewed; it is not compiled. A real Java grammar parser (java-parser) parsed 608 of the 609 shipped Java strings cleanly during the audit; the single exception is the Gradle build-file sketch, which is deliberately not Java source."),
    entry("Collections, exceptions, modern Java, and testing", "PARTIAL", "ArrayList, Comparator, try-with-resources, streams, assertions, records, sealed types, Optional, text blocks, anonymous implementations, immutable collection factories (List.of, Set.of, Map.of), compiled regular expressions, StringBuilder assembly, and java.time values with explicit formatters are introduced.", staticJava, "Code reading and structure review; no actual JUnit execution or in-browser compiler."),
    entry("Concurrency, networking, JDBC, JVM, and performance", "PARTIAL", "AtomicInteger, CompletableFuture, URI, prepared-statement concepts, java.time (Instant, LocalDate, DateTimeFormatter), and JVM topics are introduced in authored examples and labs.", staticJava, "No real thread, HTTP, JDBC, or profiler execution."),
    entry("Professional Java and capstone", "PARTIAL", "Repository/service design, build concepts, packages and JPMS module descriptors with requires/exports, logging, configuration, and a capstone repository/service split are introduced; the capstone project solution is authored rather than generated.", staticJava, "No Maven/Gradle/JAR or multi-file compiler workflow; the module descriptor lesson states plainly that a descriptor is compiled on the module path rather than executed."),
    entry("Compiled multi-file Java applications and framework integration", "MISSING", "Requires a reliable compiler/runtime strategy beyond the current browser-only architecture.", "Backend, local toolchain, or carefully sandboxed compiler required.", "Real compiler, bytecode, and runtime diagnostics unavailable."),
  ],
  JavaScript: [
    entry("Fundamentals, functions, objects, and collections", "PARTIAL", "Five learning-loop lessons per chapter plus authored labs cover scopes, objects, arrays, Map/Set, classes, and immutable patterns. Every shipped JavaScript string was executed against the app's real Worker sandbox during the audit: 381 declare exactly the output the sandbox prints, 112 are starter scaffolds that declare nothing, 44 are deliberate breakages used for debugging practice, and browser-only samples describe the preview instead of a console transcript.", jsExecution, "Runtime repair where worker-safe; structure repair for DOM-bound code."),
    entry("Async, event loop, browser APIs, DOM, and networking", "PARTIAL", "Promises, async/await, URL APIs, AbortController concepts, DOM and route examples are included, alongside authored lessons on regular expressions and on Intl formatting for numbers, currency, percentages, dates, and relative time.", jsExecution, "Promise chains that settle in microtasks run in the sandbox and are executed-verified; there is still no complete event-loop or fetch integration harness."),
    entry("Advanced JavaScript, performance, and security", "PARTIAL", "Proxies, typed arrays, binary data, Set/Map, escaping, and memory concepts are introduced.", jsExecution, "No dedicated browser-security project or profiler workflow."),
    entry("Professional JavaScript and capstone", "PARTIAL", "Module/configuration, TaskBoard state-model, and architecture practices are included.", jsExecution, "No integrated lint/test/build or full browser-app assessment."),
    entry("Full-stack server projects, WebSockets, and end-to-end DOM testing", "MISSING", "Not enough authored runtime projects yet.", "Requires additional server/test architecture.", "No verified server/socket diagnostics."),
  ],
  "C++": [
    entry("Fundamentals, references, memory, and RAII", "PARTIAL", "Five learning-loop lessons per chapter plus authored labs cover values/references, RAII, ownership boundaries, const-correctness, move semantics with the rule of five, and exception/noexcept behavior. Every chapter project now ships an authored solution instead of the older generated placeholder.", staticCpp, "No genuine compiler/linker/runtime diagnostics in the browser. In the authoring pass every complete shipped C++ program (543 compiled-and-matched programs, 25 project solutions) compiled with g++ -std=c++20 -Wall -Wextra with zero warnings and its declared expected output matched real stdout; the 44 intentionally broken debugging examples and repair starters are the only ones that do not compile, and the lessons say so."),
    entry("Classes, templates, STL, and data structures", "PARTIAL", "Vector, queue, algorithms, ranges and lazy views, templates, operator overloading, optional, virtual behavior, and unique ownership are introduced with authored examples; the extended variations of each chapter sample now declare their real executed output.", staticCpp, "Structure repair only in the browser; no sanitizer output anywhere and no compiler output in the browser, while authored C++ was compiled and executed offline during authoring."),
    entry("Errors, concurrency, systems, and performance", "PARTIAL", "Exception handling with noexcept, filesystem, steady-clock timing with duration_cast, mutex/lock_guard, build concepts, and performance ideas are introduced, including an honest note that printed timings are not evidence.", staticCpp, "No real threads, profiler, debugger, warning, or undefined-behavior instrumentation."),
    entry("Professional C++ and capstone", "PARTIAL", "Repository-shaped capstone with an authored make_unique/interface solution, RAII review, and architecture ideas are introduced.", staticCpp, "No compiled multi-file project validation."),
    entry("Compiled applications, sanitizers, profiling, and networking", "MISSING", "Requires a real C++ toolchain and stronger project runtime.", "Local toolchain or backend required.", "Compiler, linker, sanitizer, and debugger results unavailable."),
  ],
  "HTML/CSS": [
    entry("HTML structure, semantics, forms, metadata, and accessibility", "PARTIAL", "Five learning-loop lessons per chapter plus authored form, accessibility, and capstone labs, and every chapter project ships an authored solution that its own structure checker accepts. HTML trees and CSS blocks were parsed with real parsers during the audit (575 HTML parses and 256 CSS parses, zero failures), and required elements and declarations were confirmed in the parsed trees rather than by text matching.", browserPreview, "Markup repair and preview, plus authored lessons on data tables with header scope and on responsive media (srcset, sizes, picture, source, video/audio controls); no automated accessibility-tree or assistive-tech test runner."),
    entry("CSS fundamentals, layout, responsive design, and typography", "PARTIAL", "Box model, Flexbox, Grid with named template areas, tokens, typography, media queries, container queries, CSS nesting, feature queries, keyframe animation, sticky and absolute positioning, dark-mode token theming, and print examples are included.", browserPreview, "Visual preview only; no visual-regression suite."),
    entry("Progressive enhancement, performance, security, and professional delivery", "PARTIAL", "No-JS forms, responsive images, link safety, metadata, design-system and delivery concepts are included.", browserPreview, "No Lighthouse, cross-browser, or deployment verification."),
    entry("Multi-page accessible web projects and automated assessment", "MISSING", "Current projects are smaller component/page structures, not a full assessed site sequence.", "Preview works but no full project runner or browser matrix exists.", "Manual preview only."),
  ],
};