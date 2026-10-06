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
