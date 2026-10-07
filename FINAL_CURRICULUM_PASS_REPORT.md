# CodeForge Final Curriculum Quality / Authorship Pass

## Branch / commit
- Branch: `arena/1b23fec7-ggggggggg`
- Final commit: `722f818` — `Finish truthful curriculum quality and authorship pass`
- PR: https://github.com/OGRecko/ggggggggg/pull/1

## What changed

### Truthful authorship semantics
Updated the factory-backed curriculum pipeline so lesson authorship is no longer overstated.

Files:
- `src/courses/courseFactory.ts`
- `src/courses/chapterPlanHelpers.ts`

Key changes:
- factory-generated lessons now default to `scaffolded`
- explicit authored overrides now count as `authored`
- substantial lab lessons remain `deep-dive`
- per-lesson authored overrides can replace generated lesson content truthfully

### New authored lesson libraries
Added targeted authored lesson override libraries for important weak/major topics.

Files:
- `src/courses/javascriptAuthoredLessons.ts`
- `src/courses/cppAuthoredLessons.ts`
- `src/courses/javaAuthoredLessons.ts`
- `src/courses/htmlcssAuthoredLessons.ts`

### Override wiring
Wired authored override libraries into the course assembly for all factory-backed non-Python courses.

Files:
- `src/courses/javascript.ts`
- `src/courses/cpp.ts`
- `src/courses/java.ts`
- `src/courses/htmlcss.ts`

### Quality checker upgrade
Expanded curriculum-quality analysis so it is stricter and more truthful.

File:
- `src/data/curriculumQuality.ts`

Key upgrades:
- truthful scaffolded / authored / deep-dive counts
- truthful `authoredMajorChapters()` behavior
- structural completeness separated from educational completeness
- chapter-level educational coverage checks for:
  - explanation
  - syntax
  - terminology
  - multiple examples
  - code reading
  - prediction
  - debugging
  - modification
  - blank-page implementation
  - edge cases
  - assessment
  - project application
- stronger repetition detection for:
  - lesson prompts
  - project prompts
  - explanations
  - test questions
  - project requirements
  - starter code
  - solutions
- generic starter scaffolds filtered out so repetition reporting stays usable

### Tests
Added and updated tests to prove the new semantics.

Files:
- `src/data/curriculumQuality.test.ts`
- `src/data/courseIntegrity.test.ts`

The test suite now proves:
1. factory-generated lessons are scaffolded
2. explicit authored lessons are authored
3. deep-dive labs are deep-dive
4. scaffolded-only chapters do not count as authored
5. quality summaries are truthful
6. deliberately bad curriculum examples are caught

### Targeted gap-closing pass
Added explicit debugging coverage to the remaining flagged non-Python chapters.

Updated chapters:
- Java: 22, 23
- JavaScript: 12, 17, 19, 22
- C++: 12, 18, 19, 22, 23
- HTML/CSS: 12, 13, 14, 16, 17, 18, 19, 22, 23, 24

## Python review
Reviewed `src/courses/pythonAdvanced.ts`.

Result:
- `cumulativeBank` is still active
- it is still used to assemble Python cumulative assessment content
- it was kept intentionally

Python was preserved as requested and was not rewritten into the non-Python factory/scaffold model.

## Verification actually run
- `npm run typecheck` ✅
- `npm test` ✅
- `npm run build` ✅

Final automated result:
- 7 test files passed
- 40 tests passed

## Final truthful counts

### Python
- lessons: `182 authored`
- chapters: `25 authored chapters`
- note: preserved curriculum path; not normalized into the same non-Python audit semantics

### Java
- lessons: `131 scaffolded / 5 authored / 5 deep-dive`
- chapters: `15 scaffolded-only / 5 authored / 5 deep-dive`
- authored major chapters: `8`
- repetition findings: `4`
- structural gaps: `0`
- educational gaps: `0`

### JavaScript
- lessons: `127 scaffolded / 5 authored / 5 deep-dive`
- chapters: `15 scaffolded-only / 5 authored / 5 deep-dive`
- authored major chapters: `10`
- repetition findings: `0`
- structural gaps: `0`
- educational gaps: `0`

### C++
- lessons: `129 scaffolded / 5 authored / 5 deep-dive`
- chapters: `15 scaffolded-only / 5 authored / 5 deep-dive`
- authored major chapters: `9`
- repetition findings: `5`
- structural gaps: `0`
- educational gaps: `0`

### HTML/CSS
- lessons: `130 scaffolded / 5 authored / 5 deep-dive`
- chapters: `15 scaffolded-only / 5 authored / 5 deep-dive`
- authored major chapters: `6`
- repetition findings: `0`
- structural gaps: `0`
- educational gaps: `0`

## Runtime limitations kept honest
- Python: real browser-side Pyodide execution where supported; not native OS Python, not arbitrary package install, not real local multiprocessing deployment
- JavaScript: real browser Worker execution where supported; not a full Node.js/backend runtime
- HTML/CSS: real browser preview plus structural checking
- Java: structural/pattern checking only; not a real Java compiler/runtime in this app
- C++: structural/pattern checking only; not a real native compiler/toolchain in this app

## Important changed files
- `src/courses/courseFactory.ts`
- `src/courses/chapterPlanHelpers.ts`
- `src/courses/javascript.ts`
- `src/courses/cpp.ts`
- `src/courses/java.ts`
- `src/courses/htmlcss.ts`
- `src/courses/javascriptAuthoredLessons.ts`
- `src/courses/cppAuthoredLessons.ts`
- `src/courses/javaAuthoredLessons.ts`
- `src/courses/htmlcssAuthoredLessons.ts`
- `src/data/curriculumQuality.ts`
- `src/data/curriculumQuality.test.ts`
- `src/data/courseIntegrity.test.ts`

## PR-ready summary
Use this as a concise PR body if needed:

### Summary
- fix truthful authored/scaffolded/deep-dive lesson classification in the factory-backed curriculum
- add chapter-specific authored lesson overrides for Java, JavaScript, C++, and HTML/CSS
- fix authored-major-chapter counting so scaffolded-only chapters no longer count as authored
- strengthen curriculum quality auditing with structural vs educational completeness and broader repetition detection
- add tests proving truthful authorship semantics and bad-curriculum detection
- preserve Python curriculum structure and keep active cumulative assessment machinery intact

### Verification
- `npm run typecheck`
- `npm test`
- `npm run build`

---

# Appendix: topic-gap closing on the verified corpus

The sections above describe the pass that ended at `722f818`. Everything below was added
afterwards on the same branch and reports the same way: what is real, what is partly real, and
what is still missing.

## Why a second gap pass was needed

`coveredConcepts` cannot detect a gap. `qualityFor` in `src/courses/courseFactory.ts` copies the
chapter plan's `concepts` array onto **every** lesson in that chapter, so a chapter claims a
topic from all six of its lessons even when no lesson mentions it. The Java course claimed
"for and while loops" in Control Flow while the word `while` did not appear anywhere in the
chapter, claimed iterators and loops in Collections I with zero `Iterator` in the entire
course, and claimed stream pipelines in Functional Java with zero `Stream`. JavaScript claimed
"for and while" with zero `while (` in its whole course, and Java and JavaScript both listed
"invariants" in Algorithms I without ever defining one.

`.arena-gap-sweep.ts` was written for this: it reads each chapter's shipped lesson corpus
(titles, bodies, code samples, exercise code, and per-line notes) and reports any concept whose
words have no textual trace. It is deliberately over-permissive and noisy — a hit still has to
be read by hand — but it reduced 125 chapters to a short list of real candidates.

## Lessons added (11, across four batches)

Java, hand-traced and grammar-parsed:

| Chapter | Kind | Lesson |
| --- | --- | --- |
| 3 Control Flow | `read` | Looping with while and do-while |
| 6 Collections I | `modify` | Removing elements safely while iterating |
| 13 Functional Java | `design` | Choosing loops or stream pipelines |

JavaScript, executed in the app's real worker:

| Chapter | Kind | Lesson |
| --- | --- | --- |
| 1 Getting Started | `compare` | Semicolons and automatic semicolon insertion |
| 3 Control Flow | `read` | Looping with while and do-while |
| 11 Algorithms I | `read` | Reasoning about loops with invariants |
| 23 Advanced Language Features | `design` | Making your own objects iterable |

C++, verified by a real compiler:

| Chapter | Kind | Lesson |
| --- | --- | --- |
| 5 Strings and Containers | `compare` | Ordered and unordered associative containers |
| 11 Algorithms I | `read` | Sorting and deduplicating with the standard library |
| 11 Algorithms I | `design` | Reasoning about loops with invariants |

Every lesson registers a kind its chapter did not already use, so the scaffolded lessons stay
untouched and no chapter lost material. Each lesson keeps the existing quality shape: summary,
learning goals, a full explanation, keyword notes, two or three worked examples with one note
per code line, an exercise with a solution and hints, a recap, a reading check, and a decision
guide that states when to use the construct and what to use instead.

## Verification, honestly scoped

- **C++ — compiler, not a reading.** g++ 12.2.0 with `-std=c++20 -Wall -Wextra` compiled 442
  shipped programs clean with zero warnings, and 417 produce their declared output byte for
  byte. Failures: 0. The 22 deliberate breakages and 154 fragments or starters are counted
  separately. Thirteen earlier apparent mismatches were the logging lesson writing
  `config-loaded` to `std::cerr` and `service-ready` to `std::cout`; merging the streams
  reconciles them exactly.
- **JavaScript — real execution.** Every code string was run through the app's own exported
  worker source (`javascriptWorkerSource`). Corpus: 600 strings, 402 match their declared
  output, 0 mismatches, 0 unexpected errors, 117 starter scaffolds declare nothing, and 45 are
  deliberate breakages. The invariant example's `console.assert` holds in the real runner and
  therefore prints nothing.
- **Java — no JDK exists in this sandbox, so no execution is claimed.** Every expected value is
  derived by reading the code, and each new program was independently restated to re-derive
  all ten values consistently. `java-parser` parsed 641 of the 642 shipped Java strings
  cleanly; the single exception is the deliberate Gradle build-file sketch, which is not Java.
- **HTML/CSS — nothing added, and the reason is recorded.** Its three sweep hits ("layout
  intent", "gaps", "maintainability") are phrasing artifacts: `gap` is genuinely demonstrated
  in the Grid lesson's `grid-template-areas` code and in the gallery lesson, and the other two
  are adjectives rather than topics. Re-parsed as evidence: 556 HTML trees and 254 CSS blocks,
  0 parse failures, 0 structure mismatches.

## Still missing, unchanged by this pass

- Java and C++ remain structurally validated: there is no JVM here, and the browser performs no
  C++ compilation, so neither course claims executed output.
- HTML/CSS still has no visual-regression or cross-browser verification, only real preview plus
  structural parsing.
- The full-stack JavaScript, compiled multi-file Java, and sanitizer/profiler C++ rows remain
  MISSING in `src/data/coverageAudit.ts` and were not promoted.
- Remaining sweep hits after this pass are "reviewable modules" (JavaScript 24) and the three
  HTML/CSS adjectives above; none of them is a construct the course fails to teach.

## Verification commands run for this appendix

- `npx vite-node .arena-gap-sweep.ts -- all`
- `npx vite-node .arena-dump-verify.ts -- <language>` for all five courses
- `npx vite-node .arena-check-lines.ts`
- `npx vite-node .arena-dump-js-code.ts` then `npx vite-node .arena-js-audit.ts`
- `node /tmp/cppnew/verify/full.cjs` (g++ compile and run of every shipped program)
- `node .arena-verify-htmlcss.mjs`
- `npm run typecheck`, `npm test`, `npm run build`

## Appendix B: Python corpus audit in the app's own interpreter

The Python course is the stated first priority, so its corpus was executed rather than read.
Every shipped example and exercise solution with a declared output — 615 strings — was run in
Pyodide 0.29.3 (CPython 3.13.2), the exact interpreter the app loads, one fresh namespace per
row, with stdout compared byte for byte.

### Result

| Bucket | Rows | Meaning |
| --- | --- | --- |
| match | 564 | ran in Pyodide and printed exactly the declared output |
| verified elsewhere | 2 | `subprocess` call-shape examples, executed with a real interpreter and real child processes |
| environment-limited | 38 | 21 need the unvendored `sqlite3` wheel, 17 need WASM stack switching; all 38 confirmed byte-exact once the wheel or the capability was present |
| needs input | 9 | graded by the app with stdin supplied per test case |
| intentionally empty | 2 | the program prints an empty string, and the declared output says so |
| mismatch | 0 | |
| unexplained error | 0 | |

### Defects found and fixed

1. **Chapter 11, "Use a running best"** — the recurrence was `best = max(best, best + value)`,
   which drops the option of restarting at the current value, so the program printed `5` while
   the explanation and the declared output both described `4`. Now `max(value, best + value)`,
   with the explanation naming why that comparison matters.
2. **Chapter 4 "Handle a boundary deliberately" and Chapter 9 "Check the edge case"** — both
   boundary snippets called `divide` and `Wallet` from the example above them and raised
   `NameError` when run alone, while every other boundary snippet in the course repeats the
   definition it needs. Both now stand alone.
3. **Chapter 21, "Running external programs with subprocess"** — the lesson named
   `subprocess.run` in its explanation and keyword notes but no shipped Python string ever
   imported `subprocess`. It now ships two executed examples, one reading `returncode` and
   captured `stdout` and one turning a non-zero exit status into `CalledProcessError` through
   `check=True`, with per-line notes for every line and the provenance stated in the lesson.

### Two host boundaries, measured rather than assumed

- **`sqlite3` is unvendored** from the Pyodide standard library. The app's runner already calls
  `loadPackagesFromImports`, which requests the `sqlite3` wheel from the package CDN, so the
  Chapter 17 lessons work in a browser with network access; in this offline sandbox the wheel
  cannot be fetched, so all 21 SQL rows were instead executed against real SQLite with a local
  CPython and matched byte for byte.
- **`asyncio.run` needs WASM stack switching** in the JavaScript host. All 17 coroutine rows
  failed with "WebAssembly stack switching not supported in this JavaScript runtime" in plain
  Node and matched byte for byte when the flag was enabled, so the lesson code is correct and
  the capability belongs to the host runtime, not the curriculum.

### The three-in-one pattern behind this batch

`coveredConcepts` cannot detect a gap because the factory copies a chapter plan's concepts onto
every lesson in the chapter, so a chapter claims its topics six times over. The textual sweep
finds concepts with no trace at all; the teach-probe finds constructs that appear only in
prose; and now the interpreter audit finds code that runs differently from what it claims. Each
one found defects the previous could not see, and the Python corpus is clean under all three.

---

## Appendix C — Closing the claim gaps across the four non-Python courses (commits `46a6e1a`, `a0e037e`)

Appendix B closed the Python corpus. This appendix records the same three-in-one
treatment — plan-versus-code sweep, teach-probe, and a real execution audit where a
real runtime exists — applied to the other four courses, and exactly which flags
were real gaps and which were artifacts.

### C++: four authored lessons, every program compiled and run here

The teach-probe flagged ideas the chapter plans named but no shipped string showed.
Where the plan claimed a construct, the lesson was authored and then compiled:

| Chapter | Lesson | Kind | What the code shows | Compiled output |
| --- | --- | --- | --- | --- |
| 9 | Concepts and constraints that name a requirement | compare | a `concept` with a requires-expression and a trailing type requirement, a requires-clause constraining an overload, `static_assert` over library concepts | `Constraining templates`; `42`; `constraints checked before the program runs` |
| 15 | Structured bindings and pair/tuple returns | compare | a map loop that names key and value, a tuple return unpacked by the caller, a copy binding beside a reference binding that writes through | `build 40` / `read 20`; `loops 3 true`; `3 4` / `1 4` / `4` |
| 15 | `std::variant` as a closed set of alternatives | integration | holding a variant, `holds_alternative`, `get_if`, a visitor with one overload per alternative, the `bad_variant_access` path | `1` / `ready`; `number 7` / `text ready`; `wrong alternative` |
| 23 | Composing constraints and visiting a variant | integration | a composed concept, three overloads resolved by subsumption, a visitor forwarding both alternatives to one constrained function | `constraints 11`; `generic` / `integral` / `signed integral`; `Chapter 7` |

All sixteen programs were built with `g++ 12.2.0 -std=c++20 -Wall -Wextra -Werror`
at zero warnings and their stdout compared byte for byte.

### C++: the whole corpus, compiled and run offline

Every C++ string the course ships was dumped (622 rows) and compiled with the same
flags, stderr merged into stdout so nothing could hide:

| Bucket | Rows | Meaning |
| --- | --- | --- |
| compiles and matches | 422 | builds clean and prints exactly the declared output |
| starter declaring the exercise target | 102 | 85 target not yet met, 17 partly met — scaffolds are supposed to fail their own target |
| intentional compile error | 44 | 22 repair starters plus 22 deliberately broken `broken version` examples that fail on `std::cot` |
| fragment | 29 | instruction-level snippets with no `int main` |
| chapter project | 25 | reviewed by required constructs, no declared output |
| mismatch | 0 | |

One genuine defect surfaced along the way: the Chapter 15 variant exercise declared
two expectations while its solution prints `43\n5`, so the row was corrected to a
single case. The Chapter 24 rows first looked like 25 mismatches and were not: that
lesson writes `config-loaded` to `std::cerr` by design, and a stdout-only capture
simply could not see it. The audit now captures both streams, and the lesson was
left alone.

### Java: three authored lessons for concepts the plans named without showing

| Chapter | Lesson | Kind | Closes |
| --- | --- | --- | --- |
| 13 | Optional and transformations without side effects | compare | `Optional for absence` (0 hits for `Optional<`) and the chapter's untraced "pure transformations" |
| 16 | `CompletableFuture` without guessing at timing | integration | `CompletableFuture`, named in the chapter focus but present only in prose |
| 18 | The JDBC connection flow, reviewed rather than run | design | all four concepts the Databases plan promises: `JDBC connection flow`, `prepared statements`, `transactions`, `resource management` |

There is no JDK, no JDBC driver, and no database server in this sandbox. Each lesson
states that boundary in its own text; every expected value was derived by reading the
code line by line; and the only declared outputs are lines that follow from the code
text itself — the SQL string and how many parameters it expects — never from a query,
a row, or a commit. The three lessons also fixed a measurement bug of their own: the
exercise `testCases` had split one program's output across two cases, which the audit
reads as the row's declared output.

### What the remaining probe flags actually are

The teach-probe still prints flags for every course. Each one was checked against the
plans and the shipped code, and none is a real gap:

- **Python** — `threading` and `itertools` are regex false positives: the shipped code
  imports them with `from threading import Lock` and `from itertools import chain,
  islice`. `async for`, `async with`, `__aiter__`, `__anext__`, and `metaclass` appear
  nowhere in the assembled course, and no chapter plan names them, so nothing is owed.
  Chapter 23 does teach descriptors for real: `__get__`, `__set__`, `__set_name__` are
  shown in code, with the honest note that a property is usually clearer for one field.
- **Java** — `enums` and `custom exceptions` are detected by the probe but named by no
  plan and no lesson claim, so they are not owed.
- **JavaScript** — custom `Error` classes, `structuredClone`, `queueMicrotask`/timers,
  and the labels-and-break note are neither planned nor claimed; the labels note appears
  in prose only because it is a caution, not a lesson.
- **C++** — do-while, iostream formatting, variadic templates, and `enum class` are
  unclaimed by any plan or lesson.
- **HTML/CSS** — `clip-path` is unclaimed, and the Chapter 8 "gaps" flag is the plural
  English word in a plan sentence with no construct behind it.

### Verified state at this commit

- `npx tsc --noEmit` — silent.
- `npm test` — 8 files, 67 tests, all passing.
- `npm run build` — succeeds, 3,348.52 kB (gzip 1,024.27 kB).
- Gap sweep across all 125 chapters — 1 remaining flag, the HTML/CSS plural-word
  artifact above.
- Every course, 25 chapters each: 0 failing lesson exercises, 0 failing chapter
  projects under the structural checkers.
- C++: 622 code strings compiled offline, 0 mismatches (the four new lessons are
  inside that count).
- Java: the current 645 code strings were re-parsed with `java-parser`: 644 parse
  cleanly and the single exception is the Gradle build-file sketch, which is
  deliberately not Java source. The three new lessons are reviewed structurally and
  their outputs hand-derived, because no JDK exists here.

## Appendix D — Claim-level pass (Python, Java, JavaScript, C++, HTML/CSS)

Appendices A–C closed content gaps and re-measured the corpora. This appendix records a
finer pass over one remaining question per lesson: **does the lesson's own prose promise a
construct and then not show it?**

### Method

An untracked helper (`.arena-trace-code.ts`) extracts API-shaped tokens from every lesson's
own words — learning goals, keyword notes, recap lines, decision-guide rows, the reading
check with its choices and explanation, and the exercise prompt with its hints — and checks
each token against the code that lesson displays (examples, declared outputs, starter code,
solution) and then against the rest of its chapter. Flags are triaged by hand with one rule:
a token named in a **learning goal** must be shown by the lesson; a token used as a contrast
("instead of `invert()`"), a pitfall warning, a distractor option in a quiz, or a statement
about code the reader writes is prose, not a code claim.

### Python (CPython 3.11.2, every new example executed)

- **9-4** now shows a handwritten `__eq__` (`Write your own equality rule`) because the goal
  names the method; output `True` / `False`.
- **10-1** now shows `super().__init__(name)` in a subclass initializer
  (`Call the parent initializer`); output `Ada Python`.
- **23-1**'s decorator example applies `functools.wraps` and prints `greeting.__name__`, so
  the keyword note about preserved metadata is demonstrated; output `HELLO` / `greeting`.
- **1-4** (`NameError`), **4-3** (`RecursionError`), **6-8** (`KeyError`), **10-9**
  (`AttributeError`), **19-8** (`TypeError`) each gained a small *executed* example whose
  declared output matches the interpreter byte for byte. The error examples print the
  exception type name rather than a version-specific message, so the evidence stays true in
  the browser runtime as well as on CPython.
- **13-2** already demonstrated `functools.wraps`; no change was needed there.
- Deliberately untouched, with reasons: **9-1** (`CapWords` is a naming convention the code
  follows), **11-7** (`IndexError` is the rationale for an explicit empty-list contract),
  **14-8** (`breakpoint()` and `coverage.py` are named as tools; the lesson keeps its honest
  browser boundary), **14-1** and **21-6** (the token is shown elsewhere in the same chapter).

### Java (on-device structural review; no JDK exists here)

- **13-8** now contrasts a pipeline with no terminal operation against a real terminal
  (`forEach`) — the "silent no-op" the lesson warns about is visible.
- **13-3** gained an `orElseThrow` example; **16-6**'s capitalization text now matches the
  code; **20-6**'s lab declares its executor as `ExecutorService`.
- **8-1 / 8-2** promised `AutoCloseable` with nothing in the chapter showing it; the authored
  chapter-8 design lesson (`java-8-7`, Appendix on the AutoCloseable lesson) now demonstrates
  the interface, `close()`, and the exception path.
- Re-measured with `java-parser`: **651 rows → 650 parsed, 0 genuine parse failures**, the one
  exception being the Gradle build-file sketch, which is deliberately not Java source.
- Remaining flags are prose, not code claims: **10-7** (`IndexOutOfBoundsException` in a
  decision-guide contrast) and **15-7** (`NullPointerException` as a distractor option).

### JavaScript (Node replica of the Worker semantics)

- **6-6** (`lastIndex`), **7-1** (`innerHTML` read-back), **15-8**
  (`AbortController`/`AbortError`), **21-1** (escape-versus-markup) landed in the previous
  round; **21-5**'s second hint was reworded because it pointed at a DOM construct its own
  solution never uses.
- Corpus audit re-run: **620 rows, 532 exact matches, 0 mismatches, 43 deliberate-error rows,
  45 browser-boundary rows** (6 of those name a transcript that is a decision, not an output).
- Remaining flags are contrast mentions (6-6 `startsWith`, 7-5 `innerHTML`) or DOM-bound
  lessons that cannot run in a Worker.

### C++ (offline compile evidence, g++ 12.2.0, `-std=c++20 -Wall -Wextra -Werror`)

- **10-6** prints the owning vector's `size()` beside `ranges::distance` and uses
  `*values.begin()`; **12-5 / 12-6**'s hint no longer promises `at()`; **25-6**'s lab names
  `std::unique_ptr<MemoryRepository>` — the base-typed variant genuinely fails to compile, so
  the derived type is the honest one to show.

### HTML/CSS (parse5 + postcss)

- **12-7** gained a `showModal()` example, so the modal path is shown and not only described.
- `invert()` remains a decision-guide contrast row ("instead of `filter: invert()`") and sits
  in no code line; **7-5 / 7-6**'s `div.toolbar` is shown elsewhere in the chapter.

### Flags that a sibling lesson shows (chapter-wide evidence)

The trace has two lenses: the lesson's own code, and its chapter's code. Tokens that no single
lesson repeats but that a neighbouring lesson demonstrates are kept as chapter evidence rather
than as gaps, and they are listed here so the count is auditable:

- **Java** — `ArrayList` and `HashMap` (6-7, shown by the collections lessons), `AutoCloseable`
  (8-1 / 8-2, shown by the 8-7 design lesson), `PreparedStatement` (18-1 / 18-2 / 18-4 / 18-5,
  shown by the JDBC lesson's typed statements).
- **JavaScript** — `localStorage` (8-x), `WeakMap` / `WeakSet` (12-x), `AbortController`
  (15-x), `ArrayBuffer` (20-x), `innerHTML` / `textContent` (7-5, 21-2/21-3/21-4).
- **C++** — `std::array` (5-1 / 5-2 / 5-4, shown by the 5-5 lab), `end()` and `std::get`
  (10-6, 15-2, shown elsewhere in their chapters).
- **HTML/CSS** — `div.toolbar` (7-5 / 7-6).
- **Python** — `AssertionError` (14-1) and `sys.argv` (21-6).

### Verified state at this commit

- `npx tsc --noEmit` — silent.
- `npm test` — 8 files, 67 tests, all passing.
- `npm run build` — succeeds, 3,379.65 kB (gzip 1,032.33 kB).
- Every course, 25 chapters each, 0 failing lesson exercises and 0 failing chapter projects.
- HTML/CSS: 600 code strings → 553 HTML trees and 260 CSS blocks parsed with real parsers,
  0 parse failures, 0 structure mismatches, 0 graded rows escaping verification.
- JavaScript: 620 rows → 0 mismatches, 43 deliberate-error rows, 45 browser-only rows.
- Java: 651 rows → 650 parsed cleanly by `java-parser`; 0 genuine parse failures.
- C++: 622 code strings; the five snippets changed in this pass were compiled offline and
  match their declared output.
- Claim trace: 48 lessons still carry a flagged token, and every one of them is on the
  documented list above — goals that were filled, or prose that deliberately contrasts,
  warns about, or quizzes a construct the lesson does not need to run.
