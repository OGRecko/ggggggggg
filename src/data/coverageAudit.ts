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
const jsExecution = "JavaScript Worker executes safe synchronous examples; DOM and some async work use structural review.";

// Deliberately conservative. Existing routes and generated lesson loops never promote a topic
// beyond PARTIAL unless the learner has enough real authored explanation, practice, and feedback.
export const coverageAudit: Record<string, CoverageRow[]> = {
  Python: [
    entry("Fundamentals and syntax", "PARTIAL", "Seven connected lessons in each of Chapters 1-3 cover variables, values, expressions, input, control flow, and beginner challenges, plus authored gap lessons on assignment forms, swaps, the walrus operator, and positional-only versus keyword-only parameters.", pythonExecution, "Syntax/runtime/logic feedback where Pyodide verifies code; trace and validation lessons included."),
    entry("Control flow and functions", "PARTIAL", "Chapters 3-4 cover conditions, loops, functions, recursion, defaults, closures, decorators, and parameter kinds at varying depth.", pythonExecution, "Dedicated reading, validation, case-study, and challenge material."),
    entry("Collections and data structures", "PARTIAL", "Lists, tuples, dictionaries, sets, frozenset, queues, heaps, graphs, and functional patterns are taught through Chapters 5, 11-13.", pythonExecution, "Edge examples included; full linked-list/tree implementation sequence remains shallow."),
    entry("Errors, files, and modules", "PARTIAL", "Exceptions, Path, JSON, imports, package concepts, entry-point guards, pyproject.toml, and virtual-environment concepts appear in Chapters 7-8.", pythonExecution, "Traceback, conversion, and expected-error examples; package installation remains conceptual in the browser."),
    entry("OOP and advanced language features", "PARTIAL", "Classes, properties, dataclasses, enums, protocols, descriptors, decorators, context managers, pattern matching, and the iterator protocol appear in Chapters 9-10 and 23.", pythonExecution, "Invariant and boundary examples included."),
    entry("Algorithms and complexity", "PARTIAL", "Searching, sorting, dynamic-programming concepts, BFS, heaps, and complexity discussions appear in Chapters 11-12 and labs.", pythonExecution, "Implementation challenges include edge paths; coverage is not yet equivalent to a dedicated algorithms course."),
    entry("Testing and debugging", "PARTIAL", "Assertions, traceback capture, unittest concepts, test boundaries, logging, and challenge repair are taught in Chapters 14 and 24. Interactive pdb and coverage.py are described honestly as local-terminal tools.", pythonExecution, "No browser test-runner, interactive debugger, or coverage-report workflow."),
    entry("Typing, I/O, networking, concurrency, and databases", "PARTIAL", "Typing, JSON/API boundaries, SQLite, dates and durations, asyncio, thread/process/queue concepts, locks, memory layout with __slots__ and weakref, and profiling concepts appear in Chapters 15-19.", pythonExecution, "No production network stack, desktop multiprocessing runtime, or race visualizer."),
    entry("Security, performance, professional engineering, and capstone", "PARTIAL", "Validation, secrets concepts, configuration, CLI, web boundaries, observability, packaging/deployment concepts, and capstone architecture appear in Chapters 20-25.", pythonExecution, "No real deployment or multi-file production capstone runner."),
    entry("Packaging, environments, deployment, and multiprocessing", "PARTIAL", "Authored browser-safe lessons now teach project metadata, environment boundaries, deployment concepts, process separation, queues, and itertools-based lazy pipelines.", "Browser-only sandbox cannot reproduce full local environment, deployment, or desktop multiprocessing workflows faithfully.", "No real package install, process, or deployment diagnostics."),
    entry("Operating-system process boundaries", "PARTIAL", "Chapter 21 teaches subprocess argument lists, shlex quoting, and return-code inspection as a local workflow.", "The Pyodide worker cannot start operating-system processes, so CodeForge builds and inspects commands instead of executing them.", "No real external-program execution or exit-status diagnostics in the browser."),
  ],
  Java: [
    entry("Fundamentals, syntax, methods, and OOP", "PARTIAL", "Five learning-loop lessons per chapter plus authored labs at Chapters 5 and 10 cover Java-specific classes, records, interfaces, collections, and generics.", staticJava, "Transparent structural repair only; no fabricated compiler diagnostics."),
    entry("Collections, exceptions, modern Java, and testing", "PARTIAL", "ArrayList, Comparator, try-with-resources, streams, assertions, records, sealed types, and Optional concepts are introduced.", staticJava, "Code reading and structure review; no actual JUnit execution."),
    entry("Concurrency, networking, JDBC, JVM, and performance", "PARTIAL", "AtomicInteger, CompletableFuture, URI, prepared-statement concepts, and JVM topics are introduced in authored examples and labs.", staticJava, "No real thread, HTTP, JDBC, or profiler execution."),
    entry("Professional Java and capstone", "PARTIAL", "Repository/service design, build concepts, logging, configuration, and capstone architecture are introduced.", staticJava, "No Maven/Gradle/JAR or multi-file compiler workflow."),
    entry("Compiled multi-file Java applications and framework integration", "MISSING", "Requires a reliable compiler/runtime strategy beyond the current browser-only architecture.", "Backend, local toolchain, or carefully sandboxed compiler required.", "Real compiler, bytecode, and runtime diagnostics unavailable."),
  ],
  JavaScript: [
    entry("Fundamentals, functions, objects, and collections", "PARTIAL", "Five learning-loop lessons per chapter plus authored labs cover scopes, objects, arrays, Map/Set, classes, and immutable patterns.", jsExecution, "Runtime repair where worker-safe; structure repair for DOM-bound code."),
    entry("Async, event loop, browser APIs, DOM, and networking", "PARTIAL", "Promises, async/await, URL APIs, AbortController concepts, DOM and route examples are included.", jsExecution, "No complete event-loop or fetch integration test harness."),
    entry("Advanced JavaScript, performance, and security", "PARTIAL", "Proxies, typed arrays, binary data, Set/Map, escaping, and memory concepts are introduced.", jsExecution, "No dedicated browser-security project or profiler workflow."),
    entry("Professional JavaScript and capstone", "PARTIAL", "Module/configuration, TaskBoard state-model, and architecture practices are included.", jsExecution, "No integrated lint/test/build or full browser-app assessment."),
    entry("Full-stack server projects, WebSockets, and end-to-end DOM testing", "MISSING", "Not enough authored runtime projects yet.", "Requires additional server/test architecture.", "No verified server/socket diagnostics."),
  ],
  "C++": [
    entry("Fundamentals, references, memory, and RAII", "PARTIAL", "Five learning-loop lessons per chapter plus authored labs cover values/references, RAII, and ownership boundaries.", staticCpp, "No genuine compiler/linker/runtime diagnostics."),
    entry("Classes, templates, STL, and data structures", "PARTIAL", "Vector, queue, algorithms, templates, ranges, optional, virtual behavior, and unique ownership are introduced.", staticCpp, "Structure repair only; no compiler or sanitizer output."),
    entry("Errors, concurrency, systems, and performance", "PARTIAL", "Exceptions, filesystem, mutex/lock_guard, build concepts, and performance ideas are introduced.", staticCpp, "No real threads, profiler, debugger, warning, or undefined-behavior instrumentation."),
    entry("Professional C++ and capstone", "PARTIAL", "Repository-shaped capstone, RAII review, and architecture ideas are introduced.", staticCpp, "No compiled multi-file project validation."),
    entry("Compiled applications, sanitizers, profiling, and networking", "MISSING", "Requires a real C++ toolchain and stronger project runtime.", "Local toolchain or backend required.", "Compiler, linker, sanitizer, and debugger results unavailable."),
  ],
  "HTML/CSS": [
    entry("HTML structure, semantics, forms, metadata, and accessibility", "PARTIAL", "Five learning-loop lessons per chapter plus authored form, accessibility, and capstone labs.", browserPreview, "Markup repair and preview; no automated accessibility-tree or assistive-tech test runner."),
    entry("CSS fundamentals, layout, responsive design, and typography", "PARTIAL", "Box model, Flexbox, Grid, tokens, typography, media queries, container queries, and print examples are included.", browserPreview, "Visual preview only; no visual-regression suite."),
    entry("Progressive enhancement, performance, security, and professional delivery", "PARTIAL", "No-JS forms, responsive images, link safety, metadata, design-system and delivery concepts are included.", browserPreview, "No Lighthouse, cross-browser, or deployment verification."),
    entry("Multi-page accessible web projects and automated assessment", "MISSING", "Current projects are smaller component/page structures, not a full assessed site sequence.", "Preview works but no full project runner or browser matrix exists.", "Manual preview only."),
  ],
};