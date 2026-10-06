import type { LanguageId } from "../data/types";

/**
 * Expected output of each chapter sample's extended variation (see modifiedCode in
 * courseFactory.ts), recorded instead of annotated so the lessons never claim an output the
 * program does not produce.
 *
 * Verification per language:
 * - C++: every entry is the real stdout of the variation compiled with
 *   `g++ -std=c++20 -Wall -Wextra -O1` (zero warnings) and executed.
 * - JavaScript: every runnable entry is the real stdout of the variation executed with Node 22.
 *   Entries mentioning the browser preview are DOM/localStorage samples that cannot run outside
 *   a browser and are described instead of executed.
 * - Java: no JDK exists in this sandbox, so each value is hand-derived. Every Java sample is a
 *   main-only program that finishes printing before main returns, so the injected
 *   System.out.println("modified") is the final line of stdout.
 * - HTML/CSS: the variation adds a paragraph to the preview, so the entry describes the
 *   additional rendered element rather than claiming console output.
 */
export const verifiedModifiedOutputs: Partial<Record<LanguageId, Record<string, string>>> = {
  cpp: {
    "Compiled entry point": "Hello, C++!",
    "Types and constants": "7",
    "Branching": "pass",
    "Function and reference": "8",
    "Vector collection": "3\nmodified",
    "Pointer and reference": "3 3\nmodified",
    "RAII guard": "work\nmodified\ncleanup",
    "Virtual behavior": "LOUD\nmodified",
    "Function template": "3\nmodified",
    "Standard algorithm": "9\nmodified",
    "Algorithm search": "1\nmodified",
    "Queue and lookup": "first 1\nmodified",
    "Unique ownership": "3\nmodified",
    "Assertion": "checked\nmodified",
    "String view": "C++\nmodified",
    "Thread ownership": "work\nmodified",
    "Filesystem path": ".txt\nmodified",
    "Serialization boundary": "{\"topic\":\"cpp\"}\nmodified",
    "Cache-aware container choice": "2\nmodified",
    "Bounds-aware access": "4\nmodified",
    "CMake target concept": "codeforge_app\nmodified",
    "API result model": "2\nmodified",
    "Concept constraint": "8\nmodified",
    "Logging boundary": "config-loaded\nservice-ready\nmodified",
    "Capstone task model": "Build\nmodified",
  },
  java: {
    "JVM entry point": "Hello, Java!\nmodified",
    "Primitive and reference values": "7 types\nmodified",
    "A guarded branch": "pass\nmodified",
    "A reusable method": "8\nmodified",
    "Java class and constructor": "Ada\nmodified",
    "ArrayList collection": "2\nmodified",
    "String transformation": "JAVA TOOLS\nmodified",
    "Try-with-resources": "r\nmodified",
    "Interface-based design": "JAVA\nmodified",
    "Generic method": "a\nmodified",
    "Algorithmic search": "1\nmodified",
    "Queue data structure": "first\nmodified",
    "Stream transformation": "[2, 4, 6]\nmodified",
    "JUnit-style assertion": "checked\nmodified",
    "Documented method": "Java\nmodified",
    "Atomic counter": "1\nmodified",
    "HTTP request shape": "/health\nmodified",
    "Prepared statement principle": "true\nmodified",
    "Retained collection": "2\nmodified",
    "Input validation": "true\nmodified",
    "Build boundary": "codeforge.jar\nmodified",
    "Web route model": "200\nmodified",
    "Sealed hierarchy": "ok\nmodified",
    "Logger name": "codeforge.app\nmodified",
    "Capstone model": "Build\nmodified",
  },
  javascript: {
    "Output and values": "Hello, JavaScript!\nmodified",
    "Variables and types": "variables\nmodified",
    "Control flow": "pass\nmodified",
    "Functions": "8\nmodified",
    "Arrays and methods": "3\nmodified",
    "Text and templates": "Hello, Mina\nmodified",
    "DOM boundary": "Heading changes to Ready in the browser preview, and the console also logs modified",
    "Errors and storage": "invalid\nmodified",
    "Classes": "Ada\nmodified",
    "Modules": "[ 1, 2, 3 ]\nmodified",
    "Algorithms": "true\nmodified",
    "Data structures": "1\nmodified",
    "Functional JavaScript": "[ 2, 4, 6 ]\nmodified",
    "Testing": "checked\nmodified",
    "Asynchronous JavaScript": "modified\nready",
    "Browser networking": "?topic=python\nmodified",
    "Rendering systems": "Count: 1\nmodified",
    "Server-side JavaScript": "200\nmodified",
    "Databases": "true\nmodified",
    "Performance and memory": "true\nmodified",
    "Security": "&lt;tag>\nmodified",
    "Accessibility and standards": "A Save button has an accessible name in the browser preview, and the console also logs modified",
    "Advanced language features": "1\nmodified",
    "Professional engineering": "PYTHON\nmodified",
    "Capstone": "build\nmodified",
  },
  htmlcss: {
    "Document shell": "A valid document with language and title, plus the added practice paragraph",
    "Heading structure": "A meaningful heading hierarchy, plus the added practice paragraph",
    "Semantic article": "An article with header and footer, plus the added practice paragraph",
    "Labeled form": "A labeled required email field, plus the added practice paragraph",
    "Cascade and custom property": "A themed heading, plus the added practice paragraph",
    "Box model": "A sized padded panel, plus the added practice paragraph",
    "Flex navigation": "A spaced navigation row, plus the added practice paragraph",
    "Grid cards": "A two-column card grid, plus the added practice paragraph",
    "Responsive query": "A layout that gains a second column, plus the added practice paragraph",
    "Readable typography": "A readable text block, plus the added practice paragraph",
    "Keyboard-visible button": "A focus-visible native button, plus the added practice paragraph",
    "Dialog semantics": "A dialog element with controls, plus the added practice paragraph",
    "Cascade layer": "A layered notice style, plus the added practice paragraph",
    "Reduced-motion animation": "A motion-aware card, plus the added practice paragraph",
    "Component custom properties": "A configurable button component, plus the added practice paragraph",
    "Responsive image": "A deferred image with text alternative, plus the added practice paragraph",
    "Safe external link": "A safer external link, plus the added practice paragraph",
    "Metadata": "Document metadata, plus the added practice paragraph",
    "Design token": "A reusable spacing token, plus the added practice paragraph",
    "Progressive enhancement": "A functional no-JavaScript search form, plus the added practice paragraph",
    "Visual debugging": "Visible box boundaries, plus the added practice paragraph",
    "Container query": "A container-responsive card, plus the added practice paragraph",
    "Article page": "A structured article, plus the added practice paragraph",
    "Print stylesheet": "A print-focused page, plus the added practice paragraph",
    "Capstone landing structure": "A semantic landing-page skeleton, plus the added practice paragraph",
  },
};
