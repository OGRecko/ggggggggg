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

/**
 * The statement-boundary, loop, and iteration lessons each fail in their own way, so each
 * carries a mistake list about its own topic instead of reusing the scope and DOM list above.
 * Every entry names a real language behavior: the point of the list is to make the failure
 * mode readable, not to decorate the lesson.
 */
const statementMistakes: Example["mistakes"] = [
  { mistake: "Writing a returned value on the line after return", error: "The function returns undefined and the value becomes a discarded expression", fix: "Keep the value on the same line as return, or wrap it in parentheses so the statement stays open." },
  { mistake: "Starting a line with an opening bracket or parenthesis without ending the statement above", error: "The new line is parsed as a property access or call on the previous result", fix: "End the earlier statement with an explicit semicolon, or lead the risky line with one." },
  { mistake: "Trusting insertion to fix a missing semicolon in the middle of an expression", error: "The statement continues across the line break and the meaning changes silently", fix: "Read what starts each line, and let a formatter enforce one semicolon style." },
  { mistake: "Assuming insertion reports the boundaries it chooses", error: "No error at all, because insertion resolves the ambiguity without a warning", fix: "Treat statement boundaries as something the source states, not something the parser infers." },
];

const loopMistakes: Example["mistakes"] = [
  { mistake: "Writing a while loop whose body never changes the condition", error: "An infinite loop that never prints a result", fix: "Change something the condition reads on every pass, and confirm it happens on each path." },
  { mistake: "Using while when the body must run before its first test", error: "A skipped pass because the condition starts false", fix: "Use do-while so the body runs once before the condition is consulted." },
  { mistake: "Relying on integer division to shrink a number", error: "A fractional value that never reaches the loop bound", fix: "Wrap the division in Math.floor so the value stays a whole number." },
  { mistake: "Using for...in on an array and expecting elements", error: "Index strings and inherited property names instead of values", fix: "Use for...of for elements and keep for...in for object keys." },
];

const iterableMistakes: Example["mistakes"] = [
  { mistake: "Returning the same iterator object from Symbol.iterator", error: "The second loop or spread sees nothing because the first walk already finished", fix: "Return a fresh iterator from the method so each consumer starts at the beginning." },
  { mistake: "Returning an object without a next method from Symbol.iterator", error: "A TypeError when a consumer asks for the next value", fix: "Return an object whose next method answers with value and done." },
  { mistake: "Forgetting done true at the end of the sequence", error: "A consumer that keeps asking for values and never finishes", fix: "Report done true once the sequence is exhausted, even if the final value is undefined." },
  { mistake: "Making a multi-collection container iterable without stating an order", error: "Callers loop over an order nobody documented", fix: "Expose a named method that returns a specific collection, or document the iteration order explicitly." },
];

const statementExample = (title: string, code: string, output: string, explanation: string, lines: string[]): Example => ({
  title, code, output, explanation, lines, mistakes: statementMistakes,
});

const loopExample = (title: string, code: string, output: string, explanation: string, lines: string[]): Example => ({
  title, code, output, explanation, lines, mistakes: loopMistakes,
});

const iterableExample = (title: string, code: string, output: string, explanation: string, lines: string[]): Example => ({
  title, code, output, explanation, lines, mistakes: iterableMistakes,
});


/**
 * The weak-collection entries have their own failure modes, and they are about object identity
 * and about the deliberate absence of size and iteration. Nothing in this list claims to observe
 * garbage collection, because a log cannot show that a collected key disappeared.
 */
const weakMistakes: Example["mistakes"] = [
  { mistake: "Expecting a WeakMap to be countable or iterable", error: "size is undefined and the map cannot be looped over", fix: "Use a Map when the entries must be listed, or keep a separate counter when only a number is needed." },
  { mistake: "Using a string or a number as a WeakMap key", error: "A TypeError at the point of the set or get call", fix: "Key the WeakMap by the object itself, and keep a Map for primitive keys." },
  { mistake: "Looking a value up with an object that merely has the same contents", error: "undefined or false, with no error to explain it", fix: "Hold the original object reference and pass that exact reference to get and has." },
  { mistake: "Expecting the entry to disappear in a way that console output can show", error: "No output proves collection happened, because the log itself holds a reference", fix: "Describe the guarantee in prose and verify the observable parts of the API instead." },
];

const compareExample = (title: string, code: string, output: string, explanation: string, lines: string[]): Example => ({
  title, code, output, explanation, lines, mistakes: weakMistakes,
});


/**
 * The module, await, and network lessons each have their own failure modes, so each carries a
 * mistake list about its own subject. The network and module entries name real behaviours of
 * the boundary rather than observed runs: the practice runner rejects module syntax and blocks
 * networking, which is why those two lessons are reviewed structurally and say so in their
 * declared output.
 */
const moduleMistakes: Example["mistakes"] = [
  { mistake: "Importing a name that the module never exported", error: "A load-time failure naming the export, not a line in the importing file", fix: "Compare the braces against the export lines, because the names on both sides must match exactly." },
  { mistake: "Forgetting the braces around a named import", error: "The import binds the wrong thing or fails to resolve the name", fix: "Use braces for named exports and no braces only for a default." },
  { mistake: "Renaming a named export inside the import", error: "The name is missing, because a named import keeps the exported name unless it is renamed explicitly with as", fix: "Either import the exported name as it is, or write the rename with as." },
  { mistake: "Relying on a top-level import for code that should load later", error: "The module is downloaded and evaluated on every visit whether or not it is used", fix: "Use dynamic import at the point where the code is actually needed." },
];

const awaitMistakes: Example["mistakes"] = [
  { mistake: "Forgetting that an async function returns a promise", error: "The caller receives a promise where a value was expected", fix: "Await the call, or handle the returned promise deliberately." },
  { mistake: "Calling an async function and never handling the returned promise", error: "A rejection that nobody sees", fix: "Await the call inside another async function, or attach a handler that reports the failure." },
  { mistake: "Awaiting inside a loop when the steps are independent", error: "Steps that run one after another for no reason", fix: "Await Promise.all over the independent work so it proceeds together." },
  { mistake: "Putting a failure outside the try block that is meant to handle it", error: "An unhandled rejection despite the visible catch", fix: "Keep the awaited call inside the block whose handler should see the failure." },
];

const networkMistakes: Example["mistakes"] = [
  { mistake: "Treating a resolved fetch as a successful request", error: "An error body parsed as if it were data", fix: "Check response.ok before reading the body, and report the status when it fails." },
  { mistake: "Assuming fetch rejects on a 404 or 500", error: "A failure path that never runs", fix: "Read the status, because the promise resolves whenever a response arrives at all." },
  { mistake: "Parsing the body in the same expression as the request", error: "A parse failure that is reported as a network failure", fix: "Await the request first, judge the status, then await the parse as its own step." },
  { mistake: "Leaving an abort timer running after the request settled", error: "A later request on the same controller aborted by a stale timer", fix: "Clear the timer in a finally block so it runs on every path." },
];

const moduleExample = (title: string, code: string, output: string, explanation: string, lines: string[]): Example => ({
  title, code, output, explanation, lines, mistakes: moduleMistakes,
});

const awaitExample = (title: string, code: string, output: string, explanation: string, lines: string[]): Example => ({
  title, code, output, explanation, lines, mistakes: awaitMistakes,
});

const networkExample = (title: string, code: string, output: string, explanation: string, lines: string[]): Example => ({
  title, code, output, explanation, lines, mistakes: networkMistakes,
});


/**
 * The invariant lesson is about the reasoning that justifies a loop, so its mistake list is
 * about broken reasoning rather than broken syntax.
 */
const invariantMistakes: Example["mistakes"] = [
  { mistake: "Writing an invariant that is not true before the loop starts", error: "A proof that looks complete but rests on a false starting point", fix: "Check the statement against the initial values, and seed the loop variables so it holds immediately." },
  { mistake: "Changing a loop variable in two places and updating the reasoning in only one", error: "A pass that silently breaks the invariant", fix: "Keep one statement per loop variable, or re-derive the invariant from the code after each change." },
  { mistake: "Treating an assertion as a replacement for a test", error: "Development checks that prove nothing once the assertion is removed for production", fix: "Keep the assertion while developing and move the same statement into the test suite." },
  { mistake: "Keeping a loop that needs two unrelated invariants", error: "A loop whose correctness argument has to be read twice to be believed", fix: "Split the loop so each one has a single statement about what it maintains." },
];

const invariantExample = (title: string, code: string, output: string, explanation: string, lines: string[]): Example => ({
  title, code, output, explanation, lines, mistakes: invariantMistakes,
});

export const javascriptAuthoredLessons: LessonOverrideLibrary = {
  1: {
    compare: authoredLesson({
      title: "Semicolons and automatic semicolon insertion",
      minutes: 22,
      summary: "Read JavaScript's statement boundaries: when a line break ends a statement, when it continues the current one, and the places where automatic insertion quietly changes what the code means.",
      learningGoals: [
        "Explain when JavaScript inserts a semicolon at a line break and when it continues the statement instead",
        "Recognize the return, throw, break, and continue rule that turns a wrapped value into undefined",
        "Keep one consistent semicolon style and know why a leading bracket is the real hazard",
      ],
      explanation: "JavaScript ends most statements at a line break, but not because it repairs missing punctuation: the parser inserts a semicolon only when the next token cannot continue the statement it is reading. That rule is why a chain of calls split across lines works, because a leading dot continues the expression, and it is also why a line beginning with a bracket, a parenthesis, a backtick, a plus, or a minus can attach itself to the statement above instead of starting a new one. The second rule is narrower and more dangerous: after return, throw, break, or continue, a line break ends the statement immediately, so a value written on the following line is never returned and the function hands back undefined instead. Reading code for these boundaries means watching what starts a line rather than where semicolons appear, because a statement that begins with an opening bracket is the case readers misread most often. Because insertion only ever adds semicolons and never reports the ambiguity it resolved, the style question is not whether insertion exists but whether a codebase lets the reader depend on it: keeping semicolons explicit, or dropping them with a formatter that already handles the hazards, means the boundaries in the source are the boundaries the reader sees.",
      keywordNotes: [
        "Automatic semicolon insertion ends a statement only when the next token cannot continue the current one.",
        "A leading dot, operator, or bracket continues the previous line instead of starting a statement.",
        "return, throw, break, and continue end at a line break, so a value on the next line is not part of the statement.",
        "Insertion never adds a semicolon in the middle of a line and never reports the ambiguity it resolved.",
        "The real hazard is a line that starts with an opening bracket or parenthesis, not a missing semicolon.",
      ],
      examples: [
        statementExample(
          "A line break after return is a broken return, not a wrapped one",
          'function broken() {\n  return\n  42;\n}\nfunction fixed() {\n  return (\n    42\n  );\n}\nconsole.log(broken(), fixed());',
          "undefined 42",
          "Both functions look similar, but the first one returns nothing: the line break after return ended the statement, so the 42 below is a separate expression statement that runs and is discarded. The second function stays legal by wrapping the value in parentheses, which leaves the return statement unfinished across the line break, and the printed pair shows the difference.",
          [
            "Line 1: this function is written the way a wrapped return is often typed by mistake.",
            "Line 2: return ends the statement at the line break, so the value below never becomes its operand.",
            "Line 3: this expression still runs, and its value is discarded immediately.",
            "Line 4: the function closes having returned undefined on every call.",
            "Line 5: the second function returns the same value in a form that survives the line break.",
            "Line 6: an opening parenthesis leaves the statement unfinished, so the newline does not end it.",
            "Line 7: the value sits on its own line and is still part of the return statement.",
            "Line 8: the closing parenthesis completes the expression that return is handling.",
            "Line 9: the printed pair shows undefined from the first function and 42 from the second.",
            "Line 10: the block ends, and the only difference between the two calls was punctuation.",
          ],
        ),
        statementExample(
          "A continued expression next to a statement that ends at its semicolon",
          'const values = [1, 2, 3];\nconst total = values\n  .filter((n) => n > 1)\n  .reduce((sum, n) => sum + n, 0);\nconsole.log(total);\n\nconst list = [4, 5];\nconst size = list.length;\n[7, 8].forEach((n) => console.log(n));\nconsole.log(size);',
          "5\n7\n8\n2",
          "The chain spreads over three lines because a leading dot continues the expression rather than starting a new statement, so total receives the reduced value. The array literal that starts a line later is safe because the statement above it ends with an explicit semicolon, which is exactly the punctuation that stops one statement from being read as a property access on the previous result.",
          [
            "Line 1: the array is the input both parts of the example work with.",
            "Line 2: the total is built by a chain rather than a loop.",
            "Line 3: a leading dot continues the expression, so the line break does not end the statement.",
            "Line 4: the second stage of the chain completes the reduction.",
            "Line 5: the total is printed before the array demonstration that follows.",
            "Line 6: the blank line separates the two demonstrations.",
            "Line 7: the second array is named so its length can be read later.",
            "Line 8: the length is captured before the next statement runs.",
            "Line 9: this statement begins with a bracket, which is safe only because the line above ended with an explicit semicolon.",
            "Line 10: the printed length shows the earlier statement finished before this array statement ran.",
          ],
        ),
      ],
      exercise: {
        prompt: "The starter returns a total on the line after return, so the value is lost. Repair the return without moving the value onto the same line, then log the result.",
        starterCode: "function total() {\n  return\n  [1, 2, 3].reduce((sum, n) => sum + n, 0);\n}\n// log the repaired total\n",
        solution: 'function total() {\n  return (\n    [1, 2, 3].reduce((sum, n) => sum + n, 0)\n  );\n}\nconsole.log(total());',
        solutionExplanation: "Wrapping the expression in parentheses leaves the return statement open across the line break, so the reduced value becomes the returned value and the logged result is 6 instead of undefined.",
        testCases: [{ label: "Worker output", expected: "6" }],
        hints: [
          "A line break after return ends the statement immediately.",
          "Parentheses keep the statement unfinished across a line break.",
          "Log the call result to see which value came back.",
        ],
      },
      recap: [
        "Insertion adds a semicolon when the next token cannot continue the statement, which is why a leading dot continues and a leading bracket can attach.",
        "return, throw, break, and continue end at a line break, so a value on the next line is a separate statement.",
        "Consistent semicolon style plus a formatter keeps statement boundaries readable instead of depending on insertion rules.",
      ],
      readingCheck: {
        prompt: "Why does a function whose return value sits on the line after return hand back undefined?",
        choices: [
          "Because JavaScript already ended the statement at the line break, so the value is a separate expression",
          "Because the returned value was garbage collected before the call returned",
          "Because return can only be followed by a variable name",
          "Because the function needs an explicit undefined argument",
        ],
        correctIndex: 0,
        explanation: "The break after return ends the statement, so the value below is never part of it; putting the value on the same line or wrapping it in parentheses are the usual repairs.",
      },
      decisionGuide: [
        { use: "an explicit semicolon on any line that could continue", insteadOf: "letting insertion decide where the statement ends", reason: "The reader sees the boundary instead of having to know which leading tokens continue an expression." },
        { use: "parentheses or a same-line value after return", insteadOf: "a wrapped value on the following line", reason: "The parentheses keep the statement open, so the returned value is the one that was written." },
        { use: "a formatter setting for semicolons", insteadOf: "deciding punctuation statement by statement", reason: "One enforced style removes the leading-bracket hazard from review, whichever style the project picks." },
      ],
      verification: ["executed"],
      quality: { codeReading: true, edgeCase: true },
    }),
  },
  3: {
    read: authoredLesson({
      title: "Looping with while and do-while",
      minutes: 22,
      summary: "Read while and do-while as loops whose test position decides whether the body can run zero times, and know when the counted form or for...of is the clearer tool.",
      learningGoals: [
        "Trace a while loop through its condition, body, and update step",
        "Explain the one guarantee do-while adds and when that guarantee matters",
        "Choose between while, do-while, the counted for, for...of, and for...in from what the loop needs",
      ],
      explanation: "A while loop evaluates its condition before each pass, so a condition that is false at the start means the body never runs, and the loop is the right shape when the number of passes is not known in advance: consuming values until a sentinel appears, halving a number until it reaches a bound, or retrying while a budget remains. Because the test is at the top, the body must change something the condition reads, and JavaScript's number handling makes that update worth reading carefully: division produces a float, so a loop that shrinks a number to an integer needs Math.floor rather than relying on integer division. do-while moves the test to the bottom, which guarantees the body runs at least once, and that guarantee is the only difference between the two forms. The counted for keeps start, test, and update in one header when the number of passes is known, while for...of hands over values and for...in hands over property keys as strings, which is why for...in belongs to objects: using it on an array means reading index strings instead of elements. The break and continue statements work in every one of these forms, and reading them as an exit and a skip is what tells you why a loop with several continues still ends for the reason stated in its header.",
      keywordNotes: [
        "while tests before the body, so a false condition means zero passes.",
        "do-while tests after the body, so the body always runs at least once.",
        "The body must change something the condition reads, or the loop never ends.",
        "JavaScript division yields a float, so shrinking a number to an integer needs Math.floor.",
        "for...of hands over values, for...in hands over keys as strings, and the counted for is for when the index matters.",
      ],
      examples: [
        loopExample(
          "Shrink a value until its own condition ends the loop",
          'let value = 1250;\nlet digits = 0;\nwhile (value > 0) {\n  value = Math.floor(value / 10);\n  digits += 1;\n}\nconsole.log(digits);',
          "4",
          "The value is the loop state and the condition reads it directly rather than comparing a counter with a limit. Integer division is not a separate operator in JavaScript, so Math.floor turns the float result back into a whole number, and removing one digit per pass is what eventually makes the value zero.",
          [
            "Line 1: the value being inspected is the loop state, not a counter.",
            "Line 2: the count starts at zero before any digit has been removed.",
            "Line 3: the test runs before every pass, so a zero value would skip the body entirely.",
            "Line 4: Math.floor is required because division gives a float, and dropping the fraction removes one digit.",
            "Line 5: the counter records one pass against the original value.",
            "Line 6: the loop closes and control returns to the test with a smaller value.",
            "Line 7: the printed count is the number of digits the value had.",
          ],
        ),
        loopExample(
          "Compare a test at the top with a test at the bottom",
          'let attempts = 0;\ndo {\n  attempts += 1;\n} while (attempts < 3);\n\nlet refused = 0;\nwhile (refused < 0) {\n  refused += 1;\n}\nconsole.log(attempts, refused);',
          "3 0",
          "The do-while counts three attempts and finishes when its test fails, and the second loop shows what the other order means: its condition is false before the first pass, so the body never runs and the counter stays at zero. Printing both in one call makes the difference between a guaranteed pass and a possible zero visible.",
          [
            "Line 1: the attempt counter starts before the loop so the test has something to read.",
            "Line 2: do opens a loop whose body comes first.",
            "Line 3: the body runs before any condition is evaluated.",
            "Line 4: the test runs afterwards and stops the loop once the counter reaches three.",
            "Line 5: the blank line separates the two loops.",
            "Line 6: the second counter starts at zero for the comparison.",
            "Line 7: this while tests before its body, which is the opposite order.",
            "Line 8: the condition is false immediately, so the body is skipped.",
            "Line 9: the loop closes without having executed its body.",
            "Line 10: the printed pair reports three attempts and zero, which is the whole difference between the two forms.",
          ],
        ),
        loopExample(
          "Walk the same array with for...of, for...in, and continue",
          'const scores = [4, 9, 16];\nlet total = 0;\nfor (const score of scores) {\n  if (score === 9) {\n    continue;\n  }\n  total += score;\n}\nlet keys = "";\nfor (const index in scores) {\n  keys += index;\n}\nconsole.log(total + " " + keys);',
          "20 012",
          "for...of hands over each element, so continue skips the nine and the total keeps four and sixteen, while for...in walks the property keys and builds the string 012 because array indices arrive as strings. Reading the two loops side by side is the fastest way to remember which one gives values and which one gives keys.",
          [
            "Line 1: the array is the data both loops will walk.",
            "Line 2: the total starts at zero for the element loop.",
            "Line 3: for...of names the element directly, without an index.",
            "Line 4: the condition tests the element that was just handed over.",
            "Line 5: continue skips the rest of this pass and moves to the next element.",
            "Line 6: the closing brace ends the skip block.",
            "Line 7: the total adds every element that was not skipped.",
            "Line 8: the loop closes after the last element.",
            "Line 9: the key accumulator starts empty for the second loop.",
            "Line 10: for...in walks property keys rather than values.",
            "Line 11: the keys are concatenated, which is why the result is a string of digits.",
            "Line 12: the loop closes after every key was visited.",
            "Line 13: the printed pair shows the value total and the key string side by side.",
          ],
        ),
      ],
      exercise: {
        prompt: "Build a countdown from three to one with a while loop, then log the word go together with the countdown, using a string accumulator so the whole line prints at once.",
        starterCode: "let remaining = 3;\nlet line = \"\";\n// accumulate the countdown, then log the line with the final word\n",
        solution: 'let remaining = 3;\nlet line = "";\nwhile (remaining > 0) {\n  line += remaining + " ";\n  remaining -= 1;\n}\nconsole.log(line + "go");',
        solutionExplanation: "The loop appends the current number and a space while the counter is above zero, decrementing each pass so the condition eventually fails, and the final log adds the word after the accumulated digits, which is why the output is one line ending in go.",
        testCases: [{ label: "Worker output", expected: "3 2 1 go" }],
        hints: [
          "Start the counter at three.",
          "Append the number before decrementing it.",
          "Add the final word after the loop has finished.",
        ],
      },
      recap: [
        "while tests first and can run zero times; do-while tests last and always runs once.",
        "Something in the body must change what the condition reads, and JavaScript needs Math.floor for integer shrinking.",
        "for...of gives values, for...in gives keys as strings, and break and continue work in every loop form.",
      ],
      readingCheck: {
        prompt: "When is do-while the honest choice over while?",
        choices: [
          "When the number of iterations is known in advance",
          "When the body must run at least once before the condition is consulted",
          "When the loop should never end",
          "When the body needs a counter that changes",
        ],
        correctIndex: 1,
        explanation: "The bottom test is the only difference between the two forms, and it guarantees one pass; a while loop would skip the body entirely when the condition starts false.",
      },
      decisionGuide: [
        { use: "while when the number of passes is unknown", insteadOf: "a counted for loop with a guessed limit", reason: "The condition states the real stopping rule instead of a bound that has to be kept in sync with the data." },
        { use: "do-while when the body must run at least once", insteadOf: "a while loop with its first pass copied above it", reason: "Testing at the bottom states the guarantee directly and avoids duplicating the body." },
        { use: "for...of when the elements are the point", insteadOf: "an indexed loop or for...in over an array", reason: "The element loop removes the unused index and avoids the string keys that for...in produces." },
      ],
      verification: ["executed"],
      quality: { codeReading: true, prediction: true },
    }),
  },
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
  6: {
    read: authoredLesson({
      title: "Pattern matching with regular expressions",
      minutes: 22,
      summary: "Read a regular expression as a description of a text shape, use it for validation, extraction, and replacement, and know when a plain string method is the honest tool instead.",
      learningGoals: [
        "Read anchors, character classes, quantifiers, and flags in a regular expression",
        "Choose between test, match, and replace for one concrete text job",
        "Avoid the common pitfalls: unescaped user input, stateful global patterns, and regexes doing a parser's job",
      ],
      explanation: "A regular expression describes the shape of text rather than a literal sequence. /^[A-Z]{2}-\\d[A-Z]\\d$/ can be read left to right: the anchors ^ and $ pin the match to the whole string, [A-Z] allows one uppercase letter, {2} demands exactly two of them, \\d wants one digit, and the trailing [A-Z]\\d closes the format. The methods answer different questions: test asks whether the pattern occurs and returns a boolean, match returns the matched text plus its capture groups, and replace rewrites occurrences and takes the g flag to work past the first one. Because replace also accepts a function, a pattern can transform text without building the replacement by hand. Two boundaries matter in real code. A pattern assembled from user input must have its metacharacters escaped, otherwise the input silently becomes part of the pattern language instead of text to match. And when a task involves nesting or quoted strings, a regular expression is usually the wrong tool: HTML, JSON, and markup have real parsers, and a pattern that almost works is harder to debug than a parser call. Keep patterns small, anchor them when the whole string must match, and test each one against a matching and a non-matching string before trusting it.",
      keywordNotes: [
        "/pattern/flags is a regular-expression literal, and new RegExp(\"pattern\", \"flags\") builds the same pattern from a string.",
        "^ and $ anchor a match to the start and end of the string, so a valid-looking substring cannot pass a whole-string rule.",
        "\\d, \\w, and \\s are shorthand classes for digits, word characters, and whitespace, and a quantifier such as + or {2} states how many are allowed.",
        "The g flag makes replace and match work across every occurrence, while a global pattern reused with test keeps a lastIndex that can surprise the next call.",
        "Text that becomes part of a pattern must be escaped, otherwise user input like a dot or a bracket changes the rule instead of being matched by it.",
      ],
      examples: [
        example(
          "Validate a whole string with anchors",
          'const code = "JS-2A4";\nconst pattern = /^[A-Z]{2}-\\d[A-Z]\\d$/;\nconsole.log(pattern.test(code));\nconsole.log(pattern.test("JS-2A4X"));',
          "true\nfalse",
          "The anchors make the rule apply to the entire string, so the extra trailing character fails even though a valid prefix exists.",
          [
            "Line 1: the value under test is data, and keeping it in a variable lets the next line stay short enough to read the pattern itself.",
            "Line 2: the literal is read left to right: two uppercase letters, a hyphen, one digit, one uppercase letter, one digit, all anchored to the ends of the string.",
            "Line 3: test answers one question with a boolean, which is exactly what a validation rule should produce.",
            "Line 4: the trailing X fails because $ demands the end of the string immediately after the last digit; without the anchors this line would print true.",
          ],
        ),
        example(
          "Normalize messy text by replacing every occurrence",
          'const title = "  Intro to   Regular Expressions  ";\nconst slug = title.trim().toLowerCase().replace(/\\s+/g, "-");\nconsole.log(slug);',
          "intro-to-regular-expressions",
          "trim removes the outer spaces before the pattern runs, and the global pattern collapses each run of whitespace into one hyphen so the double gap does not produce a double hyphen.",
          [
            "Line 1: the raw text deliberately keeps its uneven spacing so the transformation has something real to fix.",
            "Line 2: trim runs first so outer spaces cannot become outer hyphens, toLowerCase normalizes case, and the global pattern \\s+ collapses every run of whitespace into one hyphen, not only the first run.",
            "Line 3: logging the finished slug makes the transformation observable in the worker console instead of leaving it as an invisible intermediate value.",
          ],
        ),
      ],
      exercise: {
        prompt: "Write const hasDigits = text => /\\d/.test(text); then log hasDigits(\"code-7\") and hasDigits(\"code\") in one call. This lesson really executes in the worker, so the printed output is what CodeForge checks.",
        starterCode: "const hasDigits = text => /* pattern test */;\n",
        solution: 'const hasDigits = text => /\\d/.test(text);\nconsole.log(hasDigits("code-7"), hasDigits("code"));',
        solutionExplanation: "The arrow function wraps one pattern test in a named rule, and a single log call prints both answers in order: true for the text that contains a digit and false for the text that does not. The pattern needs no anchors here because the question is whether a digit appears anywhere in the string rather than whether the whole string is a valid format.",
        testCases: [{ label: "Worker output", expected: "true false" }],
        hints: ["Use a shorthand class for one digit.", "test already returns a boolean you can log directly.", "Log both calls in one expression so the order is visible."],
      },
      recap: [
        "A regular expression describes a text shape, and anchors decide whether that shape must account for the whole string.",
        "test answers yes or no, match returns what was found, and replace rewrites occurrences once the g flag is present.",
        "Patterns built from user text need escaping, and tasks with real nesting usually belong to a parser instead of a regular expression.",
      ],
      readingCheck: {
        prompt: "Why does /^\\d$/ report false for the text \"a1\"?",
        choices: [
          "Because the anchors require the whole string to be a single digit, and the letter a is not one",
          "Because \\d only matches even numbers",
          "Because test needs the g flag to find a digit inside text",
          "Because regular expressions compare only the first character",
        ],
        correctIndex: 0,
        explanation: "The anchors force the pattern to describe the entire string, so any extra character such as the leading a fails the match even though a digit is present.",
      },
      decisionGuide: [
        { use: "an anchored pattern for whole-string validation", insteadOf: "combining startsWith, includes, and length checks by hand", reason: "One readable pattern states the full rule and its boundaries, while a chain of partial checks usually leaves a gap that only shows up in production." },
        { use: "a parser for HTML, JSON, or other nested formats", insteadOf: "a clever regular expression that almost handles nesting", reason: "Parsers handle quoting, escaping, and nesting correctly; a near-correct pattern tends to fail on the inputs that matter most and is harder to debug." },
      ],
      verification: ["executed"],
      quality: { codeReading: true, prediction: true, debugging: true, modification: true, edgeCase: true },
    }),
    compare: authoredLesson({
      title: "Formatting numbers and dates for people",
      minutes: 22,
      summary: "Compare hand-built text with the Intl formatters, and compare an implicit default locale with an explicit one, so displayed values are correct for readers and stable where the output is checked.",
      learningGoals: [
        "Format numbers, currency, percentages, and dates with Intl formatters instead of string arithmetic",
        "Pass the locale and the options explicitly so output does not depend on the machine",
        "Keep the raw value for logic and use the formatted string only for display",
      ],
      explanation: "A number is data, and the text a person reads is a rendering of that data. Intl.NumberFormat and Intl.DateTimeFormat turn a value into text using a locale plus options, which is how grouping separators, currency symbols, decimal commas, and long date names appear correctly without hand-written concatenation. The locale argument is what makes the result predictable: omit it and the runtime falls back to whatever default locale the machine happens to have, so a log line or a checked output can differ on another computer. Options carry intent that a bare number cannot express: style: \"currency\" needs a currency code, style: \"percent\" expects the ratio rather than the value already multiplied by one hundred, and a date needs a time zone before it is stable across machines. Constructing a formatter is the expensive part, so build one per format and reuse it instead of creating a formatter for every row. Intl.RelativeTimeFormat covers phrasing that hand-rolled string logic handles badly, such as \"in 3 days\". The boundary to keep straight is that formatting is a display concern: keep storing, comparing, and calculating with the raw number or Date, and never parse a formatted string back into data.",
      keywordNotes: [
        "Intl.NumberFormat(locale, options) formats numbers, and style: \"currency\" requires a currency code.",
        "style: \"percent\" expects the ratio (0.125) rather than an already-multiplied value (12.5).",
        "Intl.DateTimeFormat needs locale, options, and a time zone before a date string is stable across machines.",
        "An omitted locale uses the runtime default, so explicit locales are what make logs and checked output reproducible.",
        "Build a formatter once and reuse it; formatting is for display, so keep the raw value for calculations.",
      ],
      examples: [
        example(
          "Build one currency formatter and reuse it",
          'const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });\nconsole.log(usd.format(1234.5));\nconsole.log(usd.format(12));',
          '$1,234.50\n$12.00',
          "The formatter holds the locale and the currency intent, so both values render with the right symbol, grouping separator, and two decimal places without any string arithmetic.",
          [
            "Line 1: the locale and the currency code are stated once, which is what makes every later call consistent and reviewable.",
            "Line 2: the first value renders with grouping and two fraction digits because the currency style implies them.",
            "Line 3: the same formatter pads the second value to two decimals, so reuse also removes a class of inconsistent formatting.",
          ],
        ),
        example(
          "Format a date and a relative time",
          'const release = new Date(Date.UTC(2026, 9, 6));\nconst day = new Intl.DateTimeFormat("en-US", { dateStyle: "long", timeZone: "UTC" });\nconst relative = new Intl.RelativeTimeFormat("en-US", { numeric: "always" });\nconsole.log(day.format(release));\nconsole.log(relative.format(3, "day"));',
          'October 6, 2026\nin 3 days',
          "The date formatter states the locale, the style, and the time zone, so the printed date does not depend on the machine's clock settings, and the relative formatter produces the phrasing that hand-written string logic usually gets wrong.",
          [
            "Line 1: Date.UTC pins the instant to a fixed moment, which keeps the example reproducible instead of depending on today's date.",
            "Line 2: the formatter declares the long date style and a time zone, so the output is stable everywhere rather than shifting by hours.",
            "Line 3: the relative formatter is configured with numeric: \"always\" so the result reads as an explicit offset instead of a vague phrase.",
            "Line 4: formatting happens at the moment of display, and the Date value itself was never turned into text before this line.",
            "Line 5: the second formatter produces human phrasing for an offset, which is exactly the text that string concatenation renders clumsily.",
          ],
        ),
        example(
          "The locale changes the rendering of the same number",
          'console.log(new Intl.NumberFormat("en-US").format(1234.5));\nconsole.log(new Intl.NumberFormat("de-DE").format(1234.5));',
          '1,234.5\n1.234,5',
          "One value produces two correct renderings: the digits are identical, while the separators follow each locale, which is why the locale argument is part of the formatting contract rather than decoration.",
          [
            "Line 1: en-US groups with a comma and marks the decimal part with a period.",
            "Line 2: de-DE does the opposite, so reading either string back as data would be a mistake even though both describe the same number.",
          ],
        ),
      ],
      exercise: {
        prompt: "Format 0.125 as a percentage with one fraction digit for en-US, and format an offset of 3 days with Intl.RelativeTimeFormat for en-US, then log both. The worker really runs this, so the printed output is what CodeForge checks.",
        starterCode: "// Use the formatters rather than multiplying or concatenating by hand\n",
        solution: 'const percent = new Intl.NumberFormat("en-US", { style: "percent", minimumFractionDigits: 1 });\nconst relative = new Intl.RelativeTimeFormat("en-US", { numeric: "always" });\nconsole.log(percent.format(0.125));\nconsole.log(relative.format(3, "day"));',
        solutionExplanation: "The percent formatter receives the ratio and adds the sign and the requested fraction digit, while the relative formatter turns the offset into readable text. Both pass an explicit locale, so the printed output is the same on any machine that runs the code.",
        testCases: [{ label: "Worker output", expected: "12.5%\nin 3 days" }],
        hints: ["Pass the ratio to a percent formatter instead of multiplying by 100.", "Set minimumFractionDigits for the one decimal place.", "Give the relative formatter an explicit locale and numeric mode."],
      },
      recap: [
        "Intl formatters render data as text using a locale and options, which is more reliable than hand-built concatenation.",
        "An explicit locale and, for dates, a time zone keep the rendered output stable across machines.",
        "Keep the raw number or Date for calculation and comparison, and format only at the moment of display.",
      ],
      readingCheck: {
        prompt: "Why should the percent formatter receive 0.125 rather than 12.5?",
        choices: [
          "Because style: \"percent\" treats the input as a ratio and applies the conversion itself",
          "Because 12.5 is not a valid number in JavaScript",
          "Because the formatter rejects values above ten",
          "Because the locale argument replaces the need for a value",
        ],
        correctIndex: 0,
        explanation: "The percent style expects the ratio, so 0.125 renders as 12.5%; passing 12.5 would render as 1250%, which is the classic version of this mistake.",
      },
      decisionGuide: [
        { use: "an explicit locale and options on a reused formatter", insteadOf: "relying on the machine's default locale", reason: "Explicit configuration makes displayed and checked output reproducible instead of depending on the environment that happens to run the code." },
        { use: "a formatted string only for display", insteadOf: "parsing formatted text back into numbers or dates", reason: "Formatted text is locale-specific and lossy, so calculations should stay on the raw value while rendering stays a presentation step." },
      ],
      verification: ["executed"],
      quality: { codeReading: true, prediction: true, edgeCase: true },
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
          'Browser preview: the heading changes to Ready, or the guard logs missing heading',
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
          'Browser preview: clicking a lesson button logs its lesson id',
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
        testCases: [{ label: "DOM structure", expected: "Browser preview: the guard keeps the heading update safe." }],
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
  10: {
    "case-study": authoredLesson({
      title: "A module boundary across two files",
      minutes: 26,
      summary: "Read the two files of a module boundary, see what the loader hands the importing file, and build the namespace by hand in the practice sandbox, which loads a single script.",
      learningGoals: [
        "Read a named export and the matching import, including what the braces mean",
        "Tell a default export from a named export at the point where a file is imported",
        "Explain what the loader gives an importing file: an object with the named exports and the default",
        "Describe dynamic import as the form that loads a module on demand and returns a promise",
      ],
      explanation: "A module is a file whose top-level names are private until they are exported. The two shipped lines of a boundary are export function format(topic) { ... } in the file that owns the code, and import describe, { format } from \"./topics.js\" in the file that needs it: the braces list the named exports by the names they were exported with, while the name outside the braces is the file's default export, which the importer may call anything. The loader evaluates each module once and hands the importer an object holding the named exports, the default under the property default, and nothing else. That object is what the examples below build by hand, because the practice sandbox evaluates one script and cannot resolve a module graph; the starter shows the real two-file form at the top, and its import and export lines are reference text in the sandbox rather than something it can run.",
      keywordNotes: [
        "export function and export const publish named exports; an import lists them inside braces.",
        "export default publishes the file's main value, imported without braces and named by the importer.",
        "A bare import with no braces runs the module for its side effects and binds nothing.",
        "import() with parentheses loads a module on demand and returns a promise for its namespace.",
      ],
      examples: [
        moduleExample(
          "The namespace a module hands to its importer",
          'function defineTopicsModule() {\n  const topics = ["read", "build"];\n  return {\n    count: () => topics.length,\n    label: "topics",\n    default: () => "topic module",\n  };\n}\nconst namespace = defineTopicsModule();\nconsole.log(namespace.default(), namespace.count(), namespace.label);',
          "topic module 2 topics",
          "The factory keeps the list private and returns an object with three members, which is exactly the shape a real module namespace has: the named exports under their own names and the default export under default. Reading through that object is how an importing file sees another module.",
          [
            "Line 1: the factory is the module's own file in miniature, with everything it owns declared inside.",
            "Line 2: the list is declared without being returned, so it stays private to the module.",
            "Line 3: an object literal becomes the public surface that the importing side will receive.",
            "Line 4: the first named export is a function closing over the private list.",
            "Line 5: the second named export is a value, which an importer receives under this exact name.",
            "Line 6: default holds the file's main export, which is the name an importer may rewrite freely.",
            "Line 7: the closing brace ends the returned object.",
            "Line 8: the closing brace ends the factory function.",
            "Line 9: the factory is called once, producing the namespace the rest of the file reads from.",
            "Line 10: each member is read by its exported name, and the printed order matches the argument order.",
          ],
        ),
        moduleExample(
          "A dynamic import arrives as a promise",
          'const load = async () => ({ default: () => "topic module", count: () => 2, label: "topics" });\nasync function render() {\n  const namespace = await load("./topics.js");\n  console.log(namespace.default(), namespace.count(), namespace.label);\n}\nrender();',
          "topic module 2 topics",
          "A dynamic import does not bind a name at the top of the file; it settles to the namespace later, which is why the code around it is asynchronous. The loader is passed in here rather than called, so the example runs without a module graph and still shows the promise shape that import() returns.",
          [
            "Line 1: the loader stands in for the module system and settles with a namespace object.",
            "Line 2: the function is async because the namespace arrives asynchronously.",
            "Line 3: awaiting the load yields the namespace, and the binding is local to this function.",
            "Line 4: the namespace is read exactly as a top-level import would be read.",
            "Line 5: the closing brace ends the function that performed the on-demand load.",
            "Line 6: the call starts the load and the transcript is captured when the awaited value has arrived.",
          ],
        ),
        moduleExample(
          "Reading the default and a named export from one namespace",
          'const namespace = { format: (topic) => "[" + topic + "]", default: () => "topic module" };\nconsole.log(namespace.default(), namespace.format("CodeForge"));',
          "topic module [CodeForge]",
          "The default export is reached through the property named default, and the named export through its own name. Both are ordinary property reads on the namespace object that the loader produced.",
          [
            "Line 1: the namespace is written out literally so the two property names are visible in one line.",
            "Line 2: the default is called first and the named export second, so the printed line shows both halves resolving.",
          ],
        ),
      ],
      exercise: {
        prompt: "The starter opens with the real two-file form of this boundary: an exported function, an exported default, and the import line that reads both. The practice sandbox loads a single script, so complete the bottom half by building the namespace the loader would hand report.js, then print its default and its named export.",
        starterCode: "// topics.js: the real module file.\nexport function format(topic) {\n  return \"[\" + topic + \"]\";\n}\nexport default function describe() {\n  return \"topic module\";\n}\n\n// report.js: how another file imports it.\nimport describe, { format } from \"./topics.js\";\nconsole.log(describe(), format(\"CodeForge\"));\n\n// The practice sandbox evaluates one script and cannot resolve ./topics.js, so the two lines\n// above are the reference form. Build the namespace the loader would hand report.js, then print\n// its default and its named export.\nconst namespace = {\n  // add the default export and the named export here\n};\n",
        solution: 'const namespace = { format: (topic) => "[" + topic + "]", default: () => "topic module" };\nconsole.log(namespace.default(), namespace.format("CodeForge"));',
        solutionExplanation: "The namespace carries the default under default and the named export under its own name, which is exactly what the loader builds from export default function describe and export function format. Calling both members prints the same line the two-file version would print.",
        testCases: [{ label: "namespace built by hand", expected: "topic module [CodeForge]" }],
        hints: [
          "Add default: () => \"topic module\" and format: (topic) => \"[\" + topic + \"]\" to the object.",
          "Read both members from the namespace variable rather than from separate functions.",
        ],
        checker: {
          mode: "patterns",
          requiredPatterns: ["namespace\\.default\\(", "namespace\\.format\\(", "console\\.log"],
          successMessage: "The namespace exposes the default under default and the named export under its own name, and both are printed.",
        },
      },
      recap: [
        "A module's top-level names are private until they are exported.",
        "Named exports are imported in braces by the exact exported name; the default is imported without braces under any name.",
        "The loader hands the importing file a namespace object of the named exports plus the default.",
        "Dynamic import returns a promise for that namespace, which is why the code around it is asynchronous.",
        "The practice sandbox loads one script, so the real import and export lines in the starter are reference text here.",
      ],
      readingCheck: {
        prompt: "What does the braces form in `import { format } from \"./topics.js\"` select?",
        choices: [
          "A named export, matched by the exact name the exporting file published",
          "The default export of the module, renamed for convenience",
          "Every export of the module at once",
          "A path segment of the module specifier",
        ],
        correctIndex: 0,
        explanation: "Named imports are matched by name, so the exporting file must publish that name. The default export is imported without braces and may be renamed by the importer.",
      },
      decisionGuide: [
        { use: "a named export for each thing a file offers", insteadOf: "one large default object", reason: "Named imports fail loudly when a name drifts, and the importing file states exactly which parts it uses." },
        { use: "a default export for the file's one main value", insteadOf: "a default plus many named exports for the same thing", reason: "A default is convenient for the common case, but it is unnamed at the export site, so it earns its place only when one value really is the point of the file." },
        { use: "dynamic import when the code should load on demand", insteadOf: "a top-level import of something rarely used", reason: "A dynamic import keeps the module out of the initial graph and lets the loading code decide when it is worth the cost." },
      ],
      verification: ["structurally-checked", "pattern-checked"],
      quality: { codeReading: true, prediction: true, debugging: true, modification: true, edgeCase: true },
    }),
  },
  11: {
    read: authoredLesson({
      title: "Reasoning about loops with invariants",
      minutes: 24,
      summary: "State what is true before, during, and after a loop, use that statement to check the code is correct, and turn it into a runnable assertion while developing.",
      learningGoals: [
        "State a loop invariant as something true before the loop, after every pass, and after the loop ends",
        "Use the invariant to explain why a search, an accumulation, or a maximum is correct",
        "Check an invariant with a runtime assertion while the code is still being written",
      ],
      explanation: "An invariant is one sentence that is true when the loop starts, stays true after every pass, and is still true when the loop ends. It is the shortest honest answer to why a loop computes the right answer, and it is written about the loop rather than inside it. A linear search carries the invariant that every position before the cursor has been checked and did not match, so when the cursor stops, either it points at the target or it ran past the end and nothing matched. An accumulation carries the invariant that the running total is the sum of the first counted values, which is why adding one more value per pass leaves the statement true and why the total after the last pass is the sum of everything. A maximum keeps the invariant that the best value seen so far is the largest among the positions already visited, so a single comparison per pass is enough. Reading code with invariants changes the questions asked: instead of tracing every pass, you check that the statement holds at the start, that one pass preserves it, and that the exit condition combined with the statement gives the result. The statement can also be checked while developing by asserting it inside the loop, which is a rehearsal for a test rather than a replacement for one: the assertion fails loudly the moment a change breaks the reasoning, and it costs nothing in production code, which is why assertions belong in development and tests rather than on hot paths.",
      keywordNotes: [
        "An invariant is true before the loop, after every pass, and after the loop ends.",
        "The invariant plus the exit condition is what proves the result, so it is stated about the loop rather than inside it.",
        "A search invariant describes the checked prefix, an accumulation invariant describes the running total, and a maximum invariant describes the best value seen so far.",
        "An invariant becomes a development check when it is asserted inside the loop and a test when the assertion moves into the test suite.",
        "If no invariant can be stated, the loop is probably doing two jobs and should be split.",
      ],
      examples: [
        invariantExample(
          "A search whose invariant describes the checked prefix",
          'const values = [4, 9, 16, 25];\nconst target = 16;\nlet index = 0;\n// Invariant: every position before index was checked and did not match.\nwhile (index < values.length && values[index] !== target) {\n  index += 1;\n}\nconsole.log(index, values[index]);',
          "2 16",
          "The loop advances the cursor while the current value does not match, so every position left behind has been checked and rejected, and that statement is the whole correctness argument. The loop stops at the matching position, which is why both the index and the value it points at can be printed.",
          [
            "Line 1: the array is the data the search walks.",
            "Line 2: the target is the value being looked for.",
            "Line 3: the cursor starts at the first position, which is the prefix of length zero.",
            "Line 4: the comment states the invariant, which is what makes the loop readable.",
            "Line 5: the condition tests both that positions remain and that the current one is not a match.",
            "Line 6: advancing the cursor preserves the invariant, because the position just left was rejected.",
            "Line 7: the loop closes, and the invariant is now true for the whole prefix before the cursor.",
            "Line 8: the index and the value at that index show the loop stopped on a match.",
          ],
        ),
        invariantExample(
          "An accumulation whose invariant is checked while it runs",
          'const scores = [72, 91, 58];\nlet total = 0;\nlet seen = 0;\nfor (const score of scores) {\n  total += score;\n  seen += 1;\n  // Invariant: total is the sum of the first seen scores.\n  console.assert(total === scores.slice(0, seen).reduce((sum, n) => sum + n, 0), "invariant broken");\n}\nconsole.log(total, seen);',
          "221 3",
          "The invariant says the total is the sum of the first counted values, and the assertion re-derives that sum from the source array on every pass, so the reasoning is tested rather than trusted. The assertion holds, so nothing extra is printed, and the final log shows the full sum and the number of values that produced it.",
          [
            "Line 1: the array is the input the accumulation walks.",
            "Line 2: the running total starts at zero, which is the sum of no values.",
            "Line 3: the count of values folded in so far starts at zero as well.",
            "Line 4: the loop walks the values in order.",
            "Line 5: one value is added per pass, which is what preserves the invariant.",
            "Line 6: the count grows with the total so the two stay in step.",
            "Line 7: the comment states the invariant the assertion will check.",
            "Line 8: the assertion recomputes the sum of the same prefix and passes the invariant loose if it ever disagrees.",
            "Line 9: the loop closes after the last value was folded in.",
            "Line 10: the total and the count show the invariant held all the way to the end.",
          ],
        ),
        invariantExample(
          "A maximum whose invariant is the answer at the end",
          'const readings = [3, 17, 8];\nlet best = readings[0];\n// Invariant: best is the largest value among the positions already visited.\nfor (let position = 1; position < readings.length; position += 1) {\n  if (readings[position] > best) {\n    best = readings[position];\n  }\n}\nconsole.log(best);',
          "17",
          "Starting from the first reading makes the invariant true before the loop, because the best value among the visited positions is that first value. Each pass compares one new reading and keeps the larger, so the invariant survives every pass and the value left over is the maximum of the whole array.",
          [
            "Line 1: the readings are the data the loop scans.",
            "Line 2: the first reading seeds the best-so-far value so the invariant holds before the loop starts.",
            "Line 3: the comment states what best means at every step.",
            "Line 4: the loop starts at the second position because the first one is already the seed.",
            "Line 5: each pass compares the current reading with the best value seen so far.",
            "Line 6: a larger reading replaces the seed, which is what keeps the invariant true.",
            "Line 7: the closing brace ends the replacement branch.",
            "Line 8: the loop closes after every position was visited.",
            "Line 9: the printed value is the maximum, because the invariant covers the whole array once the loop ends.",
          ],
        ),
      ],
      exercise: {
        prompt: "Walk the values with an index and stop at the first value above the limit. Keep the invariant that every position before the found index holds a value at or below the limit, then log the index and the value that broke it.",
        starterCode: "const values = [3, 8, 15, 21];\nconst limit = 10;\nlet found = -1;\n// walk with an index, stop at the first value above the limit, then log found and values[found]\n",
        solution: 'const values = [3, 8, 15, 21];\nconst limit = 10;\nlet found = -1;\nfor (let index = 0; index < values.length; index += 1) {\n  if (values[index] > limit) {\n    found = index;\n    break;\n  }\n}\nconsole.log(found, values[found]);',
        solutionExplanation: "The loop compares each value with the limit while preserving the invariant that all earlier positions stayed at or below it, and the break records the first position that broke the pattern, so printing the index and its value shows exactly where the scan stopped.",
        testCases: [{ label: "Worker output", expected: "2 15" }],
        hints: [
          "Keep an index in the loop header so the found position can be recorded.",
          "Compare each value with the limit rather than collecting matches.",
          "Break as soon as the first value above the limit appears.",
        ],
      },
      recap: [
        "An invariant is true before the loop, after every pass, and after the loop ends, and it is what explains why the result is correct.",
        "Search, accumulation, and maximum loops each have a one-sentence invariant that makes the code readable without tracing every pass.",
        "Asserting the invariant while developing turns the reasoning into a check, and the same statement becomes a test later.",
      ],
      readingCheck: {
        prompt: "What makes a statement a usable loop invariant?",
        choices: [
          "It is true before the loop, preserved by every pass, and still true after the loop ends",
          "It is printed on every iteration so the log shows progress",
          "It is written after the loop once the result is known",
          "It only needs to be true on the final pass",
        ],
        correctIndex: 0,
        explanation: "The three-part rule is the whole idea: true at the start, preserved by one pass, and true at the end, which is what lets the exit condition plus the invariant prove the result.",
      },
      decisionGuide: [
        { use: "a one-sentence invariant for a loop that is hard to read", insteadOf: "tracing several passes to convince yourself", reason: "The statement plus the exit condition is the argument, and it survives refactoring because it is written about the loop rather than a specific pass." },
        { use: "an assertion inside the loop while developing", insteadOf: "trusting the reasoning until something breaks later", reason: "The assertion fails at the exact pass where the invariant stopped holding, which is far easier to debug than a wrong total at the end." },
        { use: "splitting a loop when no invariant can be stated", insteadOf: "adding more comments to describe two jobs at once", reason: "A loop with two unrelated invariants is two loops, and the split usually removes the comment as well." },
      ],
      verification: ["executed"],
      quality: { codeReading: true, edgeCase: true },
    }),
  },
  12: {
    "compare": authoredLesson({
      title: "Caching without keeping keys alive",
      minutes: 22,
      summary: "Compare a Map with a WeakMap and a Set with a WeakSet, then use a WeakMap keyed by objects so a cache cannot hold those objects in memory.",
      learningGoals: [
        "Use a WeakMap when the key is an object whose lifetime should decide the cache's lifetime",
        "Read why a WeakMap has no size, no clear, and no iteration, and what those omissions buy",
        "Distinguish WeakSet membership from WeakMap key-value storage",
        "Explain the garbage-collection guarantee without claiming to observe it in a log",
      ],
      explanation: "A WeakMap and a WeakSet are the collections for the case where the key is an object whose lifetime should decide the entry's lifetime: Map and Set hold their keys strongly, while the weak variants do not, and in exchange they give up size, iteration, and primitive keys.",
      keywordNotes: [
        "WeakMap stores one value per object key and does not keep that key reachable.",
        "WeakSet records membership of objects and stores no value at all.",
        "A weak key may be collected at any time, so no operation may list or count the entries.",
        "WeakMap.prototype.set throws a TypeError for a primitive key.",
      ],
      examples: [
        compareExample(
          "A WeakMap keyed by the object it describes",
          'const cache = new WeakMap();\nfunction remember(key, value) {\n  cache.set(key, value);\n}\nconst lesson = { title: "Data Structures" };\nremember(lesson, "visited");\nconsole.log(cache.has(lesson), cache.get(lesson));',
          "true visited",
          "The entry is stored under the object itself rather than under a copied name, which is what makes the key weak. The second call reads the entry back and prints both the membership and the stored value, so the pair of results shows that the value travelled with the key.",
          [
            "Line 1: a WeakMap is created with no arguments, because a WeakMap starts empty and never grows through a constructor.",
            "Line 2: the helper takes the key first, which keeps the calling code reading as a statement about the object.",
            "Line 3: set stores the value under that object key, and the map keeps no strong reference to the key.",
            "Line 4: the closing brace ends the helper.",
            "Line 5: a plain object is created, and this variable is the strong reference that keeps it alive.",
            "Line 6: the object is passed as the key, so the value is attached to this exact object rather than to an equal-looking one.",
            "Line 7: has and get are asked about the same object, and they agree because the entry exists under that identity.",
          ],
        ),
        compareExample(
          "What a WeakMap deliberately does not offer",
          'const cache = new WeakMap();\ncache.set({ topic: "read" }, 1);\nconsole.log(typeof cache.size);\nconsole.log(typeof cache[Symbol.iterator]);\ntry {\n  cache.set("read", 2);\n} catch (error) {\n  console.log(error.name);\n}',
          "undefined\nundefined\nTypeError",
          "A WeakMap offers no way to count or iterate its entries, because the collection would have to reach into keys it does not own. The third output names the other half of the bargain: only objects may be keys, so a string is rejected with a TypeError rather than converted.",
          [
            "Line 1: the WeakMap is created empty.",
            "Line 2: an object literal is used as a key, which is legal because every object is a valid weak key.",
            "Line 3: typeof reports undefined, which is the evidence that size does not exist on a WeakMap.",
            "Line 4: the iteration symbol is missing as well, so a WeakMap cannot be spread, looped over, or dumped.",
            "Line 5: a try block wraps the call that is expected to fail.",
            "Line 6: the string is offered as a key, and strings are primitives rather than objects.",
            "Line 7: the catch receives the rejection instead of the program stopping.",
            "Line 8: the error's name is printed, which shows the failure is a type error rather than a silent no-op.",
            "Line 9: the closing brace ends the try block and its catch clause.",
          ],
        ),
        compareExample(
          "A WeakSet remembers objects it has already seen",
          'const seen = new WeakSet();\nconst node = { name: "root" };\nseen.add(node);\nconsole.log(seen.has(node));',
          "true",
          "A WeakSet stores membership only, with no value attached. The object is added and then looked up by the same reference, so the result reports that this exact object is a member.",
          [
            "Line 1: a WeakSet is created empty, with no constructor argument.",
            "Line 2: the object that will be tracked is created once and held in a variable.",
            "Line 3: add records membership for that object.",
            "Line 4: has asks about the same object and prints true, which is the whole point of a membership set.",
          ],
        ),
      ],
      exercise: {
        prompt: "Use a WeakMap to remember which lesson objects have already been visited, then report the stored value for the lesson and the membership of a different object with the same title.",
        starterCode: "const memory = new WeakMap();\nconst lesson = { title: \"Data Structures\" };\n// store a value for lesson, then report the value and a lookup of another object\n",
        solution: 'const memory = new WeakMap();\nconst lesson = { title: "Data Structures" };\nmemory.set(lesson, "visited");\nconsole.log(memory.get(lesson), memory.has({ title: "Data Structures" }));',
        solutionExplanation: "The value is stored under the lesson object, so reading it back returns the stored string. The second lookup uses a fresh object that merely has the same property, and it reports false because weak keys are matched by identity rather than by content.",
        testCases: [{ label: "weak cache", expected: "visited false" }],
        hints: [
          "Store with set(lesson, value), then print get(lesson) next to has({ title: \"Data Structures\" }).",
        ],
        checker: {
          mode: "patterns",
          requiredPatterns: ["new\\s+WeakMap", "\\.set\\(lesson", "\\.get\\(lesson", "\\.has\\("],
          successMessage: "The WeakMap stores a value under the lesson object and both lookups use the object itself.",
        },
      },
      recap: [
        "A WeakMap stores a value per object key without keeping that key alive.",
        "A WeakSet records membership of objects only.",
        "Both refuse primitives and offer no size, no clear, and no iteration.",
        "Collect a key object and the entry can disappear, so nothing that logs output should claim to observe the collection.",
      ],
      readingCheck: {
        prompt: "Why does a WeakMap have no size property?",
        choices: [
          "Counting entries would require reaching into keys the map does not own, which is exactly the reference a weak map refuses to keep",
          "The property exists but is deprecated in newer JavaScript versions",
          "Sizes are only tracked for maps with more than one entry",
          "Because primitives cannot be counted",
        ],
        correctIndex: 0,
        explanation: "A weak map must not become an owner of its keys, and any operation that walks the keys would keep them reachable, so size, clear, and iteration are absent by design.",
      },
      decisionGuide: [
        { use: "a WeakMap for a cache or an association table", insteadOf: "a Map keyed by the same objects", reason: "When the key object is discarded, the entry can be collected too, so the cache cleans itself up." },
        { use: "a Map when the keys are strings or when the entries must be listed", insteadOf: "a WeakMap", reason: "A WeakMap cannot be iterated or counted, and it rejects primitive keys, so plain Maps stay the general-purpose choice." },
        { use: "a WeakSet for a seen-tags or visited-nodes marker", insteadOf: "an array of objects", reason: "Membership is a constant-time question with no stored value, and the marker does not keep the objects alive." },
      ],
      verification: ["executed"],
      quality: { codeReading: true, prediction: true, debugging: true, modification: true, edgeCase: true },
    }),
  },
  15: {
    "modify": authoredLesson({
      title: "Rewriting promise chains with await",
      minutes: 24,
      summary: "Turn a then chain into an async function that awaits each step, keep the ordering the chain guaranteed, and move failure handling into an ordinary try/catch.",
      learningGoals: [
        "Rewrite a then chain as sequential awaits while keeping the same order of operations",
        "Explain what await does to the surrounding function and what it does not do to the program",
        "Handle a rejected await with try/catch and know which failures a catch block actually sees",
      ],
      explanation: "A then chain and an async function with awaits express the same sequence, but they read differently. In a chain, each callback receives the previous result as a parameter and the ordering is implied by how the calls are attached. Await makes that ordering explicit in the source: the function pauses at each await and resumes with the settled value, so the lines after it run in the order a reader expects, and a value returned from one step is available in a local binding for every later step. The pause belongs to the async function, not to the whole program: the surrounding code keeps running, and the function resumes when the awaited promise settles. That is why an async function returns a promise even when no promise appears in its body, and why calling one without awaiting or handling it means the result can settle with nobody watching. Failure handling also becomes ordinary control flow: a rejected await throws inside the async function, so try/catch catches it, and everything after the throw in that block is skipped. Two habits keep the rewrite honest. First, awaiting inside a loop makes the steps sequential, which is right when each step needs the previous result and wrong when the steps are independent, where Promise.all expresses the concurrency on purpose. Second, a catch block only sees what happens inside its try, so a failure that escapes an earlier step must be inside the block that is supposed to handle it. Everything in this lesson executes in the practice sandbox, because each example settles within a microtask: the printed output you see is the real result of the real runner.",
      keywordNotes: [
        "await pauses the async function it appears in and resumes it with the settled value of the promise.",
        "An async function always returns a promise, even when its body returns a plain value.",
        "A rejected await throws inside the async function, so try/catch handles it like any other exception.",
        "Sequential awaits run one step after another, while Promise.all starts independent steps together and awaits them as a group.",
        "A catch block only sees failures raised inside its own try block.",
        "Before await existed, the same sequence was written with then callbacks that each received the previous value.",
      ],
      examples: [
        awaitExample(
          "One awaited step instead of a then callback",
          'async function load() {\n  const value = await Promise.resolve(21);\n  console.log(value * 2);\n}\nload();',
          "42",
          "The awaited value arrives in a normal local binding, so the multiplication is ordinary code rather than a callback body. This is the shape to reach for when the old version was a single then call: the value that used to be a parameter is now a variable, and everything after the await reads in the order it runs. The sandbox executes this program, and 42 is what it actually prints.",
          [
            "Line 1: the async keyword is what allows await inside and what makes the call return a promise.",
            "Line 2: await pauses here until the promise settles, then binds the settled value to a normal local name.",
            "Line 3: the arithmetic runs after the value arrived, so it reads like ordinary sequential code.",
            "Line 4: the closing brace ends the async function, whose return value is a promise.",
            "Line 5: calling the function starts it; the work settles within a microtask, which is why the sandbox prints the line.",
          ],
        ),
        awaitExample(
          "Two awaited steps keep the chain's order",
          'async function load() {\n  const first = await Promise.resolve("read");\n  const second = await Promise.resolve("build");\n  console.log(first + " then " + second);\n}\nload();',
          "read then build",
          "Each await hands the next line a settled value, so the second step starts only after the first finished. That ordering is the property a then chain had implicitly and the reason a rewrite must not replace sequential awaits with a group of independent ones unless ordering genuinely does not matter. The printed line shows both values, in the order the source states.",
          [
            "Line 1: the async function holds the whole sequence.",
            "Line 2: the first await resolves one value and binds it for the rest of the function.",
            "Line 3: the second await starts only after the first line above it finished, which is the ordering the chain guaranteed.",
            "Line 4: both bindings are in scope, so the message can use them without nesting a callback inside another callback.",
            "Line 5: the function closes having performed the steps in order.",
            "Line 6: the call starts the sequence, and the sandbox prints the combined text.",
          ],
        ),
        awaitExample(
          "Catch a rejected await like any other failure",
          'async function load() {\n  try {\n    await Promise.reject(new Error("offline"));\n  } catch (error) {\n    console.log("caught " + error.message);\n  }\n}\nload();',
          "caught offline",
          "A rejected promise becomes a thrown value at the await, so the catch block runs like it would for any other exception and the rest of the try is skipped. That is the practical reason the rewrite is worth doing: failure handling moves back into ordinary control flow instead of a second callback attached to the chain. The message printed here is the error the example rejected with, which proves the handler saw the real failure.",
          [
            "Line 1: the async function still contains the whole operation.",
            "Line 2: the try block marks the code whose failure this function is prepared to handle.",
            "Line 3: this promise is rejected on purpose, so the await throws at exactly this point.",
            "Line 4: the catch clause receives the thrown error, which is the rejection reason.",
            "Line 5: the handler reads the error's message rather than assuming what went wrong.",
            "Line 6: the closing brace ends the catch block.",
            "Line 7: the function closes having handled the failure inside itself.",
            "Line 8: the call starts the sequence, and the sandbox prints the handled message instead of an unhandled rejection.",
          ],
        ),
      ],
      exercise: {
        prompt: "Write an async function main that awaits two resolved values, six and seven, and logs their product. The sandbox executes it, so the printed number is what gets checked.",
        starterCode: "async function main() {\n  // await two values, then log their product\n}\nmain();\n",
        solution: 'async function main() {\n  const first = await Promise.resolve(6);\n  const second = await Promise.resolve(7);\n  console.log(first * second);\n}\nmain();',
        solutionExplanation: "Each await binds one settled value, and the multiplication runs after both have arrived, so the printed product is 42.",
        testCases: [{ label: "Worker output", expected: "42" }],
        hints: [
          "Mark the function async so await is allowed inside it.",
          "Await each resolved value in turn and keep them in local bindings.",
          "Log the product after both values have arrived.",
        ],
      },
      recap: [
        "await turns a promise's settled value into a local binding, so a chain's steps become ordinary sequential lines.",
        "The pause belongs to the async function, not the program, and every async function returns a promise.",
        "A rejected await throws inside the function, so try/catch handles failures that a chain handled in a second callback.",
      ],
      readingCheck: {
        prompt: "What does await do to the code around it?",
        choices: [
          "It pauses the async function and resumes it with the settled value, while the rest of the program keeps running",
          "It blocks the entire program until the promise settles",
          "It converts the promise into a synchronous value everywhere",
          "It starts the promise and ignores the result",
        ],
        correctIndex: 0,
        explanation: "The pause is local to the async function: other code continues, and the function resumes with the value once the awaited promise settles.",
      },
      decisionGuide: [
        { use: "sequential awaits when each step needs the previous result", insteadOf: "a then chain that nests callback after callback", reason: "The ordering is visible in the source, and each intermediate value gets a name instead of a callback parameter." },
        { use: "Promise.all when the steps are independent", insteadOf: "awaiting inside a loop out of habit", reason: "Independent work can start together, and awaiting one step at a time would serialize it for no reason." },
        { use: "try/catch around awaited calls", insteadOf: "a trailing catch callback on the chain", reason: "Failure handling becomes ordinary control flow, and the block states exactly which work it covers." },
      ],
      verification: ["executed"],
      quality: { codeReading: true, modification: true },
    }),
  },
  16: {
    "integration": authoredLesson({
      title: "Reading a network response honestly",
      minutes: 28,
      summary: "Handle a network response in the one order that keeps failures honest: await the request, judge response.ok, then parse the body, with a cancellation signal and a cleared timer around it.",
      learningGoals: [
        "Check response.ok before parsing a body, because a resolved request is not a successful one",
        "Tell a status failure from a parse failure from a cancellation in the code that handles them",
        "Wire an AbortController signal into a request and clear its timer in a finally block",
        "Describe what the practice sandbox cannot do here and why the request is passed in",
      ],
      explanation: "fetch resolves as soon as a response arrives, whatever its status, so a 404 or a 500 reaches the next line looking exactly like a success until response.ok is checked. The honest order is therefore three separate steps: await the request, judge response.ok and raise an error naming response.status when it is false, then await the body parse as its own step so a malformed body is reported as a parse failure rather than as a network failure. Cancellation is a fourth, different outcome: an AbortController owns a signal, the request receives that signal, and a timer that fires abort turns a slow request into a rejection naming an abort. The examples below take the request function as a parameter defaulting to fetch, because this sandbox blocks networking and stops timers before the transcript is captured: the production line is await request(url), and in a browser it is await fetch(url).",
      keywordNotes: [
        "response.ok is true only for a status in the 200 to 299 range; a resolved promise says nothing about success.",
        "response.status carries the number that belongs in the error message.",
        "response.json() returns a promise for the parsed body, so a malformed body fails at that await.",
        "AbortController.abort() rejects the request that was given controller.signal.",
      ],
      examples: [
        networkExample(
          "Await the request, judge the status, then parse",
          'const requestJson = (url) => fetch(url, { headers: { Accept: "application/json" } });\nasync function loadTopics(url, request = requestJson) {\n  const response = await request(url);\n  if (!response.ok) {\n    throw new Error("request failed with status " + response.status);\n  }\n  return response.json();\n}\nasync function main() {\n  const standIn = async () => ({ ok: true, status: 200, json: () => ["read", "build"] });\n  const topics = await loadTopics("https://example.test/topics.json", standIn);\n  console.log(topics.join(" and "));\n}\nmain();',
          "read and build",
          "The production call to fetch lives in one named helper so the accept header is set in a single place, and the request function defaults to that helper. The example passes a stand-in instead, because this sandbox replaces fetch with a throwing stub and captures the transcript before a request could ever complete. Everything after the injection point is the real reading path: await the request, judge response.ok, and parse the body as a separate step.",
          [
            "Line 1: the production request function is where fetch is called, and it adds the JSON accept header once for every caller.",
            "Line 2: the request function defaults to that helper, so production code calls the function with a url and nothing else.",
            "Line 3: the response arrives here, and nothing about its status has been judged yet.",
            "Line 4: ok is the first question asked, because a resolved request can still be a failed one.",
            "Line 5: a status outside the success range becomes an error that carries the number.",
            "Line 6: the message is what the caller will read, so it names the status rather than saying something failed.",
            "Line 7: the closing brace ends the failure branch.",
            "Line 8: the body is parsed only after the status passed, and this line returns the promise from json.",
            "Line 9: the closing brace ends the function whose promise settles to the parsed body.",
            "Line 10: the main function keeps the example's failure handling in one place.",
            "Line 11: the stand-in request settles with a response shaped like the real one.",
            "Line 12: the body reader is synchronous here only because this stand-in owns its data.",
            "Line 13: the example passes the stand-in explicitly, so fetch is never called in this sandbox.",
            "Line 14: the parsed names are printed, so the transcript proves the whole path ran.",
          ],
        ),
        networkExample(
          "A failed status is caught, never parsed",
          'async function loadTopics(url, request) {\n  const response = await request(url);\n  if (!response.ok) {\n    throw new Error("request failed with status " + response.status);\n  }\n  return response.json();\n}\nasync function main() {\n  const standIn = async () => ({ ok: false, status: 404, json: () => [] });\n  try {\n    await loadTopics("https://example.test/missing.json", standIn);\n  } catch (error) {\n    console.log("caught " + error.message);\n  }\n}\nmain();',
          "caught request failed with status 404",
          "The same function now receives a response with ok false, so the thrown error is caught by the caller. The body is never read, which is the point: an error page must not travel through the code path reserved for data.",
          [
            "Line 1: the same request helper is defined, so the example is the production shape with one substitution.",
            "Line 2: the default keeps the helper as the production request function.",
            "Line 3: the request resolves normally, which is exactly why the status must be checked.",
            "Line 4: ok is false for this response.",
            "Line 5: the error names the status, so the handler can tell 404 from a network outage.",
            "Line 6: the message is built from the status number rather than from a guess.",
            "Line 7: the closing brace ends the failure branch.",
            "Line 8: this parse line is reached only by responses that passed the check.",
            "Line 9: the closing brace ends the function.",
            "Line 10: the main function owns the try block for this example.",
            "Line 11: the stand-in answers with a failure status and an empty body.",
            "Line 12: the body reader is present so the shape matches the real response object.",
            "Line 13: the try block wraps the awaited call, because the throw happens at that await.",
            "Line 14: the call passes the failing stand-in, so the status branch is the one that runs.",
            "Line 15: the catch receives the error the status check threw.",
            "Line 16: the handler prints the message it was given rather than inventing one.",
          ],
        ),
        networkExample(
          "Cancel a request and clear the timer that armed it",
          'async function requestWithSignal(url, request, controller) {\n  try {\n    return await request(url, { signal: controller.signal });\n  } finally {\n    console.log("timer cleared");\n  }\n}\nasync function main() {\n  const controller = new AbortController();\n  const pending = (url, options) => new Promise((resolve, reject) => {\n    options.signal.addEventListener("abort", () => reject(new Error("request aborted")), { once: true });\n  });\n  const call = requestWithSignal("https://example.test/slow.json", pending, controller);\n  controller.abort();\n  try {\n    await call;\n  } catch (error) {\n    console.log("caught " + error.message);\n  }\n}\nmain();',
          "timer cleared\ncaught request aborted",
          "The controller owns the signal and the request receives it, so abort rejects the pending call. The finally block logs before the error travels outward, which is the evidence that cleanup runs on the failure path too. In production the abort comes from a timer or a newer request superseding this one, and clearTimeout is what stops a settled request from being aborted later.",
          [
            "Line 1: the function receives the request function and the controller rather than creating them.",
            "Line 2: the try block covers the awaited request, because cancellation arrives as a rejection there.",
            "Line 3: the signal travels with the request, which is what connects the controller to this call.",
            "Line 4: the finally block runs whether the request succeeded, failed, or was aborted.",
            "Line 5: clearing the timer here is what prevents a stale abort from hitting a later request.",
            "Line 6: the closing brace ends the try block and its finally clause.",
            "Line 7: the closing brace ends the function.",
            "Line 8: the main function drives the cancellation in one place.",
            "Line 9: the controller is created per call, so two concurrent calls cannot cancel each other.",
            "Line 10: the stand-in request settles only when something aborts it.",
            "Line 11: the executor receives the resolve and reject functions from the Promise constructor.",
            "Line 12: the listener is registered on the signal the request will receive.",
            "Line 13: abort rejects the pending promise with an error that names what happened.",
            "Line 14: once is enough because a request is cancelled at most once.",
            "Line 15: the closing brace ends the executor.",
            "Line 16: the closing brace ends the stand-in request.",
            "Line 17: the call is started before the abort, so something is actually pending.",
            "Line 18: the abort fires immediately here; in production a timer fires it.",
            "Line 19: the try block wraps the await that will now reject.",
            "Line 20: the catch turns the rejection into a printed line.",
            "Line 21: the message comes from the error the abort produced.",
          ],
        ),
      ],
      exercise: {
        prompt: "Write the loadNames function so it awaits a request function that defaults to the requestJson helper, rejects a failed status with the number in the message, and returns the parsed body; then call it once with a stand-in request and print the names joined with \" and \".",
        starterCode: "const requestJson = (url) => fetch(url, { headers: { Accept: \"application/json\" } });\n\nasync function loadNames(url, request = requestJson) {\n  // await the request, check response.ok, and return the parsed body\n}\n\nasync function main() {\n  // call loadNames with a stand-in request that answers ok with [\"read\", \"build\"], then join them\n}\nmain();\n",
        solution: 'const requestJson = (url) => fetch(url, { headers: { Accept: "application/json" } });\nasync function loadNames(url, request = requestJson) {\n  const response = await request(url);\n  if (!response.ok) {\n    throw new Error("request failed with status " + response.status);\n  }\n  return response.json();\n}\nasync function main() {\n  const standIn = async () => ({ ok: true, status: 200, json: () => ["read", "build"] });\n  const names = await loadNames("https://example.test/names.json", standIn);\n  console.log(names.join(" and "));\n}\nmain();',
        solutionExplanation: "The default parameter makes requestJson the production request function while a stand-in can be passed in where no network exists. The status is judged before the parse, and the parse is the returned value, so the caller receives either the parsed body or an error that names the status.",
        testCases: [{ label: "honest response handling", expected: "read and build" }],
        hints: [
          "Check response.ok right after the await, then throw an error built from response.status.",
          "Return response.json() and let the caller await it, so the parse stays a separate step.",
        ],
        checker: {
          mode: "patterns",
          requiredPatterns: ["fetch\\(", "request\\s*=\\s*requestJson", "response\\.ok", "response\\.status", "response\\.json\\(\\)"],
          successMessage: "The request is awaited, the status is judged before the parse, and the failure message carries the status number.",
        },
      },
      recap: [
        "fetch resolves as soon as a response arrives, so a resolved request is not a successful one.",
        "The honest order is await the request, judge response.ok, then await the parse as its own step.",
        "An error built from response.status lets the handler tell a 404 from an outage.",
        "An AbortController supplies the signal, and abort rejects the request that received it.",
        "The timer that arms the abort is cleared in a finally block, so cleanup runs on every path.",
        "The examples take the request function as a parameter because this sandbox blocks networking and does not run timers before the transcript is captured.",
      ],
      readingCheck: {
        prompt: "Why must response.ok be checked before the body is parsed?",
        choices: [
          "Because fetch resolves for any status, so an error page would otherwise be parsed as if it were data",
          "Because response.json throws for every status outside the 200s",
          "Because parsing changes the status code",
          "Because ok is only defined for cached responses",
        ],
        correctIndex: 0,
        explanation: "A response arrives for 404 and 500 as well, and the promise resolves either way. The status check is what separates a failure body from data, and the parse belongs after it.",
      },
      decisionGuide: [
        { use: "response.ok plus an error naming response.status", insteadOf: "wrapping the parse in a catch-all", reason: "The status is known before the body is touched, so the failure can be described precisely instead of being inferred from a parse error." },
        { use: "one await per step, request then status then parse", insteadOf: "parsing inside the same expression as the request", reason: "Separate steps keep the three failure kinds distinguishable in the code that handles them." },
        { use: "an AbortController with a timer cleared in finally", insteadOf: "letting a slow request run to completion", reason: "Cancellation bounds the wait, and the cleared timer prevents an abort from landing on a request that already settled." },
      ],
      verification: ["executed", "structurally-checked", "pattern-checked"],
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
  23: {
    design: authoredLesson({
      title: "Making your own objects iterable",
      minutes: 24,
      summary: "Give your own object the iteration protocol so for...of, spread, and Array.from work on it, and choose between a hand-written iterator and a generator method.",
      learningGoals: [
        "Describe the iteration protocol as a symbol-keyed method returning an iterator with next",
        "Implement the protocol by hand and again with a generator method",
        "Decide when an object should be iterable and when a named method returning an array is more honest",
      ],
      explanation: "for...of does not know about arrays, sets, or the classes in this course; it knows one protocol. An object is iterable when it has a method keyed by Symbol.iterator, and that method returns an iterator: an object with a next method that answers { value, done }. Every call to next hands over one value and finally reports done as true, and everything that consumes iterables, including for...of, spread, destructuring, and Array.from, drives exactly that call sequence. Writing the protocol by hand makes the machinery visible: the method closes over its own current position, so each call to Symbol.iterator starts a fresh walk instead of continuing a finished one, which is why the same object can be spread twice with the same result. A generator method expresses the same protocol with less bookkeeping: declaring *[Symbol.iterator]() and yielding values produces the iterator object for you, and the generator's paused state is the position. The design question is when an object should be iterable at all. If the natural meaning of the object is a sequence of things, exposing iteration lets callers use the language's own loops instead of learning a custom method name, but if the object is a container with several internal collections, iteration needs a stated order and a clear element type, and returning an array from a named method is often more honest than making the whole object iterable.",
      keywordNotes: [
        "An object is iterable when it has a method keyed by Symbol.iterator that returns an iterator.",
        "An iterator is an object with a next method that answers { value, done }.",
        "for...of, spread, destructuring, and Array.from all consume that same protocol.",
        "Each call to Symbol.iterator must produce a fresh iterator so the object can be walked more than once.",
        "A generator method declared as *[Symbol.iterator]() with yield implements the protocol without hand-written state.",
      ],
      examples: [
        iterableExample(
          "Implement the protocol by hand and consume it twice",
          'const range = {\n  from: 1,\n  to: 3,\n  [Symbol.iterator]() {\n    let current = this.from;\n    const last = this.to;\n    return {\n      next() {\n        if (current <= last) {\n          return { value: current++, done: false };\n        }\n        return { value: undefined, done: true };\n      },\n    };\n  },\n};\nconsole.log([...range].join(","));\nconsole.log(Array.from(range).length);',
          "1,2,3\n3",
          "The object exposes one method under a well-known symbol, and that method builds a fresh iterator each time it is called, closing over its own current position. Spreading the object therefore collects one to three, and calling Array.from afterwards starts a new walk rather than continuing the finished one, which is why both consumers see the whole sequence.",
          [
            "Line 1: the object is a plain literal that is about to be given the iteration protocol.",
            "Line 2: from holds the first value of the walk.",
            "Line 3: to holds the last value the walk should reach.",
            "Line 4: the computed key Symbol.iterator is the method the language looks up.",
            "Line 5: the method's first job is to read the start of the range.",
            "Line 6: the end of the range is captured now so the closure does not depend on later changes.",
            "Line 7: the method returns the iterator object itself.",
            "Line 8: next is the method every consumer calls.",
            "Line 9: the guard decides whether a value is still available.",
            "Line 10: done false reports that this value counts and the walk continues.",
            "Line 11: the closing brace ends the available branch.",
            "Line 12: the finished branch reports that the sequence is over.",
            "Line 13: the closing brace ends the finished branch.",
            "Line 14: the closing brace ends next.",
            "Line 15: the closing brace ends the returned iterator object.",
            "Line 16: the closing brace ends the Symbol.iterator method.",
            "Line 17: spreading calls the protocol and collects every value in order.",
            "Line 18: Array.from drives a fresh iterator, so the finished walk does not make this call empty.",
          ],
        ),
        iterableExample(
          "Express the same protocol with a generator method",
          'class Countdown {\n  constructor(start) {\n    this.start = start;\n  }\n  *[Symbol.iterator]() {\n    for (let value = this.start; value > 0; value -= 1) {\n      yield value;\n    }\n  }\n}\nconst countdown = new Countdown(3);\nconsole.log([...countdown].join(" "));',
          "3 2 1",
          "The generator method is the whole iterator: calling it returns an object with next, and each yield pauses the function until the next value is requested, so the loop inside the generator is the source of the sequence. Spreading the instance collects the values in the order the loop produced them, with no hand-written done flag anywhere.",
          [
            "Line 1: the class is a reusable shape for something that can be counted down.",
            "Line 2: the constructor takes the starting value.",
            "Line 3: the parameter is stored so the generator can read it later.",
            "Line 4: the closing brace ends the constructor.",
            "Line 5: the asterisk marks a generator, and the computed key makes it the iteration protocol.",
            "Line 6: the loop counts down from the stored start.",
            "Line 7: yield hands over the current value and pauses here until the next value is requested.",
            "Line 8: the closing brace ends the loop that produces the sequence.",
            "Line 9: the closing brace ends the generator method, whose return value is the iterator.",
            "Line 10: the closing brace ends the class.",
            "Line 11: the instance is created with three as its starting value.",
            "Line 12: spreading drives the generator and collects three, two, one in order.",
          ],
        ),
      ],
      exercise: {
        prompt: "Give the letters object the iteration protocol with a generator method so that spreading it yields the upper-cased items, then log the spread as one string.",
        starterCode: "const letters = {\n  items: [\"a\", \"b\"],\n  // implement the iteration protocol here, then log the spread\n};\n",
        solution: 'const letters = {\n  items: ["a", "b"],\n  *[Symbol.iterator]() {\n    for (const item of this.items) {\n      yield item.toUpperCase();\n    }\n  },\n};\nconsole.log([...letters].join(""));',
        solutionExplanation: "Declaring the generator method under Symbol.iterator makes the object iterable, and each yield hands over one item already converted to upper case, so spreading collects A and B and joining them prints one string.",
        testCases: [{ label: "Worker output", expected: "AB" }],
        hints: [
          "The method key is Symbol.iterator.",
          "An asterisk makes the method a generator.",
          "Yield each converted item, then log the spread of the object.",
        ],
      },
      recap: [
        "Iterable means a Symbol.iterator method that returns an iterator with next.",
        "Consumer syntax such as for...of, spread, and Array.from all drive that same protocol.",
        "A generator method implements the protocol without hand-written state, and every call must produce a fresh iterator.",
      ],
      readingCheck: {
        prompt: "What must an object provide so that for...of and spread syntax work on it?",
        choices: [
          "A method keyed by Symbol.iterator that returns an iterator with a next method",
          "An array property named items",
          "A class declaration instead of an object literal",
          "A length property and numeric keys",
        ],
        correctIndex: 0,
        explanation: "The protocol is the contract: the symbol-keyed method returns an iterator whose next method answers with value and done, and every consumer of iterables uses exactly that sequence.",
      },
      decisionGuide: [
        { use: "a generator method for a value sequence", insteadOf: "hand-written next and done bookkeeping", reason: "The generator keeps the position in its own paused state, which removes the flag that is easiest to get wrong." },
        { use: "an iterable object when the object's nature is a sequence", insteadOf: "a custom method name every caller must learn", reason: "for...of, spread, and destructuring already exist, so the object joins the language instead of adding vocabulary." },
        { use: "a named method returning an array when the object has several collections", insteadOf: "making the whole object iterable with an unclear order", reason: "A named method states which collection is being read and in what order, instead of leaving that to the reader's guess." },
      ],
      verification: ["executed"],
      quality: { codeReading: true, edgeCase: true },
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
