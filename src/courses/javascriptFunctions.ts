import type { Example } from "../data/types";
import { authoredLesson, q, type LessonOverrideLibrary } from "./chapterPlanHelpers";

const formMistakes: Example["mistakes"] = [
  { mistake: "Choosing an arrow only because it is shorter", error: "An arrow captures this lexically and has no own arguments object, so it can behave incorrectly as an object method or constructor.", fix: "Choose the function form by the call contract: use a method when the receiver matters and an arrow for a callback that should keep its surrounding this." },
  { mistake: "Calling a const function expression before its declaration executes", error: "The binding is still in its temporal dead zone and the read throws a ReferenceError.", fix: "Move the call after initialization or use a function declaration when the design benefits from declaration hoisting." },
];

const receiverMistakes: Example["mistakes"] = [
  { mistake: "Saving a method in a variable and expecting it to carry its object with it", error: "A later plain call has a different this value and may throw or read the wrong data.", fix: "Use bind(owner) when a fixed receiver is part of the callback contract, or call it through owner." },
  { mistake: "Using an arrow as an object method when the method needs dynamic this", error: "The arrow reads this from its surrounding scope rather than from the object before the dot.", fix: "Use method syntax for receiver-based behavior; use an arrow inside a method when it should preserve that method's receiver." },
];

const closureMistakes: Example["mistakes"] = [
  { mistake: "Putting private state outside the factory", error: "Two supposedly independent counters share one binding and affect each other.", fix: "Create the state with let inside the factory so every factory call receives a fresh lexical environment." },
  { mistake: "Returning the current value instead of returning a function", error: "The caller gets one snapshot and cannot ask for the next value later.", fix: "Return an inner function that reads and updates the captured binding on each call." },
];

const integrationMistakes: Example["mistakes"] = [
  { mistake: "Calling a callback while passing it to map", error: "The callback runs immediately and map receives its result instead of a function.", fix: "Pass the function value, for example values.map(formatter), and let map call it for each item." },
  { mistake: "Assuming a closure snapshots a primitive value", error: "Later calls observe the binding's current value, not a frozen copy from factory creation.", fix: "Trace reads and writes to the captured binding in call order; make a new factory call when independent state is required." },
];

function example(
  title: string,
  code: string,
  output: string,
  explanation: string,
  lineNotes: string[],
  mistakes: Example["mistakes"],
): Example {
  return {
    title,
    code,
    output,
    explanation,
    lines: lineNotes.map((note, index) => `Line ${index + 1}: ${note}`),
    mistakes,
  };
}

export const javascriptFunctionsLessons: LessonOverrideLibrary = {
  4: {
    compare: authoredLesson({
      title: "Choose declarations, expressions, and arrow functions by behavior",
      minutes: 23,
      summary: "Compare function forms by naming, initialization order, receiver behavior, and the kind of call they are meant to support.",
      learningGoals: [
        "Distinguish a function declaration from a function expression assigned to a binding",
        "Explain why an arrow function uses lexical this instead of receiving this from its call site",
        "Select a function form because of its contract rather than its character count",
      ],
      explanation: "A function declaration names reusable behavior and is initialized before ordinary statements in its scope run, so its call can appear earlier in the same scope. A function expression is a function value stored in a variable; with const, that binding cannot be read before its initialization line because it is in the temporal dead zone. An arrow is also a function value, but it deliberately has no own this or arguments: it reads those names from its surrounding lexical scope. That makes an arrow a good callback when it should keep the surrounding receiver, but usually a poor choice for a method whose receiver is selected by the object before the dot. Pick the form from the behavior you need, then use naming and formatting to keep that behavior easy to review.",
      keywordNotes: [
        "A function declaration uses `function name(...) { ... }` and is initialized before statements in its scope execute.",
        "A function expression creates a function value; a `const` binding that stores it is usable only after its initialization runs.",
        "An arrow function uses `=>` and has lexical `this` and no own `arguments` object.",
        "A method call such as `owner.read()` supplies `owner` as the receiver; copying the method value does not preserve that call form.",
      ],
      examples: [
        example(
          "Three forms can return the same kind of result",
          'function double(value) {\n  return value * 2;\n}\nconst addOne = function (value) {\n  return value + 1;\n};\nconst triple = (value) => value * 3;\nconsole.log(double(2), addOne(2), triple(2));',
          "4 3 6",
          "All three definitions create callable behavior, but the first is a declaration, the second stores a function expression in a constant, and the third is an arrow expression. The call sites make the input and result of each choice visible.",
          [
            "Declares a named function that can be called elsewhere in the same scope.",
            "Returns twice the supplied value; return gives the caller a result instead of printing from the helper.",
            "Closes the declaration body.",
            "Creates a function expression and stores it in addOne; the const binding is initialized only when this statement runs.",
            "The expression returns the input plus one.",
            "Ends the function expression and its variable declaration.",
            "Creates a concise arrow function whose single expression is returned automatically.",
            "Calls each helper with the same input and prints each distinct returned result in order.",
          ],
          formMistakes,
        ),
        example(
          "A method and an arrow callback see different this rules",
          '"use strict";\nconst meter = {\n  value: 4,\n  read() { return this.value; },\n  readLater() { return () => this.value; },\n};\nconst detached = meter.read;\nconst arrowReader = meter.readLater();\nconsole.log(meter.read());\nconsole.log(arrowReader());\ntry { console.log(detached()); } catch (error) {\n  console.log(error.name);\n}',
          "4\n4\nTypeError",
          "The method call meter.read() gets meter as this. readLater is also called as a method, and the arrow it returns keeps that surrounding this, so it can still read meter.value later. detached is only a function value; a strict-mode plain call supplies no receiver, so reading this.value throws and the catch prints TypeError.",
          [
            "Enables strict mode so a plain function call does not substitute the global object for a missing receiver.",
            "Starts an object whose methods can read one value through their receiver.",
            "Stores the data that both methods will read.",
            "Defines a method whose this is supplied by the call expression.",
            "Defines a method that returns an arrow; the arrow closes over this from the method call.",
            "Closes the object literal.",
            "Copies the method function value without copying the meter receiver.",
            "Calls readLater as a method now, creating an arrow that remembers meter as this.",
            "The dot call supplies meter, so the method returns 4.",
            "The arrow retained meter from readLater, so this also returns 4.",
            "Calls the detached function without a receiver and catches the resulting strict-mode TypeError.",
            "Prints the error category rather than letting this deliberately broken call end the example.",
            "Closes the catch block.",
          ],
          formMistakes,
        ),
      ],
      exercise: {
        prompt: "Create `owner` with `name: \"Mina\"`, a method `read()` returning `this.name`, and a method `makeReader()` returning an arrow that reads `this.name`. Store `owner.read` in `detached`, store `owner.makeReader()` in `lexical`, then print `owner.read()`, `lexical()`, and `detached.call({ name: \"Ada\" })` on separate lines.",
        starterCode: "// Compare a method receiver with an arrow that keeps its surrounding receiver\n",
        solution: 'const owner = {\n  name: "Mina",\n  read() { return this.name; },\n  makeReader() { return () => this.name; },\n};\nconst detached = owner.read;\nconst lexical = owner.makeReader();\nconsole.log(owner.read());\nconsole.log(lexical());\nconsole.log(detached.call({ name: "Ada" }));',
        solutionExplanation: "The direct method call uses owner as this, and makeReader returns an arrow that captures owner from its method call. The detached method does not remember owner, so call supplies a different receiver for that one invocation.",
        testCases: [{ label: "Call-site and lexical receiver", expected: "Mina\nMina\nAda" }],
        hints: [
          "Write read with method syntax so its `this` comes from the object before the dot.",
          "Have makeReader return an arrow function rather than calling it immediately.",
          "Call makeReader through owner so the arrow captures that owner as its lexical receiver.",
          "Use detached.call with a small object to supply a receiver for just that call, then print all three results in order.",
        ],
      },
      recap: [
        "Declarations are named and initialized before their scope's statements execute; const-held expressions are initialized at their declaration line.",
        "Arrows are function values with lexical this, not shorter methods with a dynamic receiver.",
        "A function's call shape is part of its behavior, so detaching a method changes what a regular function receives as this.",
      ],
      decisionGuide: [
        { use: "a declaration for named behavior that should be available throughout its scope", insteadOf: "a const expression called before its initialization", reason: "The declaration's initialization order supports the earlier call without crossing a const binding's temporal dead zone." },
        { use: "an arrow for a callback that should retain surrounding this", insteadOf: "a regular callback that loses its method receiver", reason: "The arrow's this is lexical and does not change when another function calls it." },
        { use: "method syntax when this should be the object before the dot", insteadOf: "an arrow stored as an object method", reason: "A regular method receives the call-site receiver that an arrow intentionally ignores." },
      ],
      readingCheck: {
        prompt: "Why does arrowReader() still read meter.value after readLater() has returned?",
        choices: ["The arrow closes over the lexical this supplied to readLater when it was called as a method", "Every arrow automatically uses the newest global object", "The arrow copied meter.value into a private field", "Calling a function always supplies the original object"],
        correctIndex: 0,
        explanation: "The arrow has lexical this, so it keeps the receiver from the readLater method call rather than receiving a new one when arrowReader is later called.",
      },
      verification: ["executed"],
      quality: { codeReading: true, prediction: true, debugging: true, modification: true, edgeCase: true },
    }),

    debug: authoredLesson({
      title: "Debug a method that loses its receiver in a callback",
      minutes: 21,
      summary: "Trace a detached method to the failing call site and repair the receiver without rewriting the method's behavior.",
      learningGoals: [
        "Recognize that a method reference is still an ordinary function value when copied",
        "Use bind to create a callback with a fixed receiver",
        "Distinguish a receiver bug from a syntax error",
      ],
      explanation: "A method's `this` is selected by the call expression. `panel.label()` supplies panel, but `const callback = panel.label; callback()` does not. In strict mode the detached call has `this === undefined`, so reading a property through it throws a TypeError. The method itself can be correct; the bug is the hand-off boundary where the receiver was lost. `bind(panel)` creates a new function that keeps panel as its receiver when a callback consumer later calls it. An arrow wrapper such as `() => panel.label()` is another option when you need to choose exactly how the method is called. Binding does not execute the method immediately; it prepares a callable value for the later call.",
      keywordNotes: [
        "A receiver is the object supplied as `this` by a method-style call such as `panel.label()`.",
        "A detached method is a function value called without the object before the dot.",
        "`bind(panel)` returns a new function whose `this` remains panel when that function is called later.",
        "A TypeError from reading a property of undefined is a runtime receiver failure, not a parse error.",
      ],
      examples: [
        example(
          "Reproduce the receiver failure",
          '"use strict";\nconst ticket = {\n  id: 23,\n  label() {\n    return `Ticket ${this.id}`;\n  },\n};\nconst callback = ticket.label;\ntry {\n  console.log(callback());\n} catch (error) {\n  console.log(error.name);\n}',
          "TypeError",
          "The method definition can read this.id when invoked on ticket, but assigning its function value to callback does not preserve ticket. The strict-mode plain call has no receiver, so the property read throws; the catch prints TypeError to keep the diagnostic observable.",
          [
            "Enables strict mode, where a plain call does not receive the global object as a fallback this.",
            "Starts the ticket object whose method will be passed as a callback.",
            "Stores the identifier the method expects to read through this.",
            "Begins the method body; this will depend on the eventual call expression.",
            "Builds a label from the receiver's id, which is safe only when the receiver exists.",
            "Closes the method body.",
            "Closes the object literal.",
            "Copies only the method function into callback; the ticket receiver is not stored with it.",
            "Starts the error-handling path for the deliberately detached call.",
            "Calls without ticket, so reading this.id throws in strict mode.",
            "Catches the TypeError so the lesson can show the failure category and continue.",
            "Prints TypeError as evidence that the failure happened while the program ran.",
            "Closes the catch block.",
          ],
          receiverMistakes,
        ),
        example(
          "Bind the receiver before handing the callback off",
          '"use strict";\nconst ticket = {\n  id: 23,\n  label() {\n    return `Ticket ${this.id}`;\n  },\n};\nconst callback = ticket.label.bind(ticket);\nconsole.log(callback());',
          "Ticket 23",
          "bind creates a new callback whose receiver is ticket. The later plain call is now safe because the bound function supplies the original object as this.",
          [
            "Enables strict mode so an unbound plain call would expose the receiver problem.",
            "Starts the object that owns the label behavior.",
            "Stores the id used to build the visible label.",
            "Defines the receiver-dependent method.",
            "Reads this.id and returns one formatted string.",
            "Closes the method body.",
            "Closes the object literal.",
            "Creates a new function fixed to ticket without running the method yet.",
            "Calls the bound callback later and prints the expected label.",
          ],
          receiverMistakes,
        ),
      ],
      exercise: {
        prompt: "In strict mode, define `user` with `name: \"Rae\"` and a `greet()` method returning `Hi ` plus `this.name`. Store a bound version of greet in `greet`, call it as a plain function, and print exactly `Hi Rae`.",
        starterCode: '"use strict";\nconst user = {\n  name: "Rae",\n  greet() { return `Hi ${this.name}`; },\n};\nconst greet = user.greet;\nconsole.log(greet());',
        solution: '"use strict";\nconst user = {\n  name: "Rae",\n  greet() { return `Hi ${this.name}`; },\n};\nconst greet = user.greet.bind(user);\nconsole.log(greet());',
        solutionExplanation: "The starter copies the method without its receiver, so its strict-mode plain call throws. bind creates a callback whose receiver is user; the later call returns and prints Hi Rae.",
        testCases: [{ label: "Bound greeting callback", expected: "Hi Rae" }],
        hints: [
          "The method reads its name through `this`, so note which object a direct method call would supply.",
          "The starter's assignment copies the method but does not keep `user` as its receiver.",
          "Replace that assignment with `user.greet.bind(user)`; bind returns a function for later use.",
          "Keep the final plain `greet()` call and verify that it prints the exact greeting.",
        ],
      },
      recap: [
        "A method's receiver comes from how it is called, not from the variable that once held it.",
        "The binding step belongs where a receiver-dependent method crosses a callback boundary.",
        "bind fixes the receiver for later calls; an arrow wrapper can also make the call explicit.",
      ],
      decisionGuide: [
        { use: "bind when a callback needs a stable method receiver", insteadOf: "passing a detached method reference", reason: "The callback can be invoked later without losing the object that owns its behavior." },
        { use: "an arrow wrapper when the callback needs extra call-time choices", insteadOf: "binding a method and hoping it supplies additional arguments", reason: "The wrapper shows exactly how the eventual method call is made." },
      ],
      readingCheck: {
        prompt: "What changed when `ticket.label` became `ticket.label.bind(ticket)`?",
        choices: ["A new function was created that supplies ticket as this when called", "The label method ran immediately and stored its text", "The ticket object became immutable", "The method was converted into an arrow"],
        correctIndex: 0,
        explanation: "bind returns a receiver-fixed function; it does not call the original method while binding it.",
      },
      verification: ["executed"],
      quality: { codeReading: true, prediction: true, debugging: true, modification: true, edgeCase: true },
    }),

    build: authoredLesson({
      title: "Build independent step counters from closures",
      minutes: 22,
      summary: "Create a factory that returns a function with private state, then prove separate factory calls do not share a counter.",
      learningGoals: [
        "Initialize private mutable state inside a factory function",
        "Return a closure that reads and updates the captured binding",
        "Check independent instances and a zero starting value",
      ],
      explanation: "A closure can keep a small piece of state private without placing it in a global variable or exposing it as an object property. Each call to `makeStepCounter` runs the factory body and creates a fresh `current` binding. The returned `next` function can still read and update that binding after the factory has returned. The factory parameters describe the counter's policy: `start` is the first value it returns and `step` is added after each call. A zero start is valid, and a second factory call should begin from its own start rather than continuing the first counter. This pattern is useful for one small owned behavior; if callers need to inspect or reset several fields, an object with explicit methods may be clearer.",
      keywordNotes: [
        "A factory function creates and returns another value, often a function configured for later use.",
        "A closure keeps access to the lexical binding `current` after the factory call has finished.",
        "`current += step` updates the captured binding; the closure reads the updated value next time.",
        "Each factory invocation creates a new lexical environment, so two counters can be independent.",
      ],
      examples: [
        example(
          "One returned function remembers its next value",
          'function makeStepCounter(start = 0, step = 1) {\n  let current = start;\n  return function next() {\n    const value = current;\n    current += step;\n    return value;\n  };\n}\nconst even = makeStepCounter(0, 2);\nconsole.log(even(), even(), even());',
          "0 2 4",
          "The first call returns the current value before advancing it. The next calls see the same captured binding after it has changed, so the output advances by two and keeps zero as the first valid value.",
          [
            "Defines a factory with defaults for a zero start and a step of one.",
            "Creates a mutable binding inside this factory call; it is private to the closure returned below.",
            "Returns a named inner function that can be called after makeStepCounter has returned.",
            "Takes a snapshot of the current number so this call can return the old value.",
            "Advances the captured binding for the next call.",
            "Returns the snapshot from this invocation.",
            "Closes the inner function body.",
            "Closes the factory body after returning the closure.",
            "Creates one independent counter that starts at zero and advances by two.",
            "Calls the same closure three times; each call observes the previous call's update.",
          ],
          closureMistakes,
        ),
        example(
          "Two factories create independent bindings",
          'function makeStepCounter(start = 0, step = 1) {\n  let current = start;\n  return () => {\n    const value = current;\n    current += step;\n    return value;\n  };\n}\nconst first = makeStepCounter(10, 1);\nconst second = makeStepCounter(0, 5);\nconsole.log(first(), second(), first(), second());',
          "10 0 11 5",
          "Each factory call initializes a different current binding. Advancing first does not change second, even though both returned functions were made by the same factory code.",
          [
            "Defines the same reusable factory contract for each invocation.",
            "Creates state local to whichever factory call is currently running.",
            "Returns an arrow closure that captures current and step from this invocation.",
            "Stores this call's current value to return.",
            "Moves this counter forward without changing another factory's binding.",
            "Returns the saved value.",
            "Closes the returned arrow function body.",
            "Closes the factory body after returning the closure.",
            "Creates the first counter with its own starting value and step.",
            "Creates a second counter with different state and a different step.",
            "Alternates calls to show that each closure advances only its own current binding.",
          ],
          closureMistakes,
        ),
      ],
      exercise: {
        prompt: "From a blank editor, write `makeTicker(start, step)` so it returns a function that yields the current number, then advances by step. Create `ticker = makeTicker(0, 3)` and log three calls on one line. The expected result is `0 3 6`.",
        starterCode: "// Build a private step counter and call it three times\n",
        solution: 'function makeTicker(start, step) {\n  let current = start;\n  return function () {\n    const value = current;\n    current += step;\n    return value;\n  };\n}\nconst ticker = makeTicker(0, 3);\nconsole.log(ticker(), ticker(), ticker());',
        solutionExplanation: "The returned function closes over current. It saves the current value, advances the binding, and returns the saved number. Starting at zero is deliberate, and each later call increases by three.",
        testCases: [{ label: "Zero-based ticker", expected: "0 3 6" }],
        hints: [
          "Declare `current` inside makeTicker so it is not shared globally.",
          "Return an inner function; returning `current` directly would give only one snapshot.",
          "Inside the closure, save the current value before adding step.",
          "Return the saved value, create the ticker at zero with step three, and call it three times.",
        ],
      },
      recap: [
        "Put state inside the factory when the returned function should own it privately.",
        "A closure reads the live binding, so updating it changes what the next call sees.",
        "A factory call creates fresh state; independent instances should not affect one another.",
      ],
      decisionGuide: [
        { use: "a closure factory for one small private changing value", insteadOf: "a mutable global counter", reason: "The caller receives the behavior but cannot accidentally change the captured state directly." },
        { use: "a class or explicit object when the state needs several public operations", insteadOf: "hiding a growing API in a chain of closures", reason: "Named methods make a larger stateful contract easier to inspect and extend." },
      ],
      readingCheck: {
        prompt: "Why does `second()` still return zero after `first()` has already been called?",
        choices: ["Each makeStepCounter call created a different current binding", "The closure copies its return value into a global", "The first call did not update its counter", "Arrow functions always reset state"],
        correctIndex: 0,
        explanation: "The factory body runs separately for each call, so each returned closure refers to a distinct lexical environment.",
      },
      verification: ["executed"],
      quality: { codeReading: true, prediction: true, debugging: true, modification: true, edgeCase: true },
    }),

    integration: authoredLesson({
      title: "Pass configured functions into an array workflow",
      minutes: 23,
      summary: "Combine a closure-backed formatter with a collection callback, keeping configuration private and treating zero as ordinary data.",
      learningGoals: [
        "Return a configured function from a factory",
        "Pass a function value to map rather than calling it during setup",
        "Trace a zero input through a closure and a callback workflow",
      ],
      explanation: "Functions are values: a caller can store one in a variable, return one from another function, or pass it to an API that expects a callback. `makeMoneyFormatter` closes over a currency label and returns a formatter ready for later use. Array `map` then calls that same function for each amount and creates a new array of labels. The zero amount is an important edge case: formatting should display `$0.00`, not skip the item because it is falsy. This example combines a closure and a callback without a browser, network, or payment service; it only formats provided numbers. The formatting policy is still small enough to read in one place, which is the reason to use a function factory here.",
      keywordNotes: [
        "A callback is a function value passed to another function so that it can be called for each item or event.",
        "A closure can retain factory configuration such as a currency prefix for later calls.",
        "`map(formatter)` passes the function; `map(formatter(amount))` would call it too early.",
        "Zero is a valid numeric amount, so do not use a truthiness check to remove it from the output.",
      ],
      examples: [
        example(
          "Configure one formatter and reuse it as a callback",
          'function makeMoneyFormatter(currency) {\n  return function format(amount) {\n    return `${currency}${amount.toFixed(2)}`;\n  };\n}\nconst dollars = makeMoneyFormatter("$");\nconst amounts = [0, 2.5];\nconst labels = amounts.map(dollars);\nconsole.log(labels.join("\\n"));',
          "$0.00\n$2.50",
          "The returned format function keeps the dollar prefix in its closure. map calls that configured function once per amount, including zero, and the joined result preserves the source order.",
          [
            "Defines a factory whose parameter configures each returned formatter.",
            "Returns a named inner function that map can call later.",
            "Formats the supplied amount with two decimal places and the captured currency prefix.",
            "Closes the formatter function body.",
            "Closes the factory after returning the configured function.",
            "Creates a formatter whose private captured prefix is the dollar sign.",
            "Stores zero and two-point-five as the two input amounts.",
            "Passes the function value to map; map invokes it for each array element.",
            "Joins the new labels with newline characters and prints both, including the zero amount.",
          ],
          integrationMistakes,
        ),
        example(
          "Two configured functions keep their own prefixes",
          'function makeLabeler(prefix) {\n  return (value) => `${prefix}${value}`;\n}\nconst warning = makeLabeler("Warning: ");\nconst note = makeLabeler("Note: ");\nconst messages = [warning("check"), note("saved")];\nconsole.log(messages.join("\\n"));',
          "Warning: check\nNote: saved",
          "Each call to makeLabeler creates a separate captured prefix. The functions are called to make two values, then the messages are joined; neither prefix is stored in a global variable.",
          [
            "Defines a factory that receives the prefix configuration.",
            "Returns an arrow that closes over prefix and formats each later value.",
            "Closes the factory body.",
            "Creates one configured function with the Warning prefix.",
            "Creates a second function with an independent Note prefix.",
            "Calls each function with its message and stores the resulting strings in an array.",
            "Joins and prints the two messages in order.",
          ],
          integrationMistakes,
        ),
      ],
      exercise: {
        prompt: "Write `makeMoneyFormatter(currency)` that returns a function formatting a number to two decimal places with the captured currency. Create a dollar formatter, map it over `[0, 4.5]`, and print the labels on separate lines. Preserve the zero entry.",
        starterCode: "// Make a formatter factory and pass its function to map\n",
        solution: 'function makeMoneyFormatter(currency) {\n  return (amount) => `${currency}${amount.toFixed(2)}`;\n}\nconst dollars = makeMoneyFormatter("$");\nconst labels = [0, 4.5].map(dollars);\nconsole.log(labels.join("\\n"));',
        solutionExplanation: "The inner arrow closes over the dollar sign. Passing it to map formats both values, including zero, and join creates the two-line output.",
        testCases: [{ label: "Zero-safe callback formatting", expected: "$0.00\n$4.50" }],
        hints: [
          "The factory should return a function rather than format an amount immediately.",
          "Use the outer `currency` value inside the returned function; that is the captured configuration.",
          "Pass the returned formatter itself to `[0, 4.5].map(...)` so each amount is handled in turn.",
          "Use `toFixed(2)` and join the resulting labels with a newline; do not filter out zero.",
        ],
      },
      recap: [
        "A function can be returned, stored, and passed as a callback because functions are values.",
        "A closure preserves configuration from the factory call without a global variable.",
        "map applies a callback to every value and returns a new array in the original order.",
        "Falsy numeric zero is still data and should survive a formatting pipeline.",
      ],
      decisionGuide: [
        { use: "a closure-backed function when several calls share one configuration", insteadOf: "repeating the configuration argument at every call", reason: "The factory makes the chosen prefix visible once and supplies a focused function to the later workflow." },
        { use: "map when each input value should become one output value", insteadOf: "mutating the source array while formatting", reason: "The original amounts remain available and the labels become a separate result." },
      ],
      readingCheck: {
        prompt: "Why does `amounts.map(dollars)` format both values without calling `dollars` at the map setup line?",
        choices: ["map receives the function value and invokes it once for each array element", "dollars is a string stored in the closure", "map calls only the first item", "The function is automatically converted to an array"],
        correctIndex: 0,
        explanation: "Passing dollars gives map a callback to call for each amount; adding parentheses after dollars would call the formatter before map receives it.",
      },
      verification: ["executed"],
      quality: { codeReading: true, prediction: true, debugging: true, modification: true, edgeCase: true },
    }),
  },
};

export const javascriptFunctionsChapterQuestions = [
  q("[Prediction] What does `console.log(greet()); function greet() { return \"ready\"; }` print?", ["ready", "undefined", "ReferenceError", "Nothing; declarations cannot be called"], 0, "A function declaration is initialized before the statements in its scope run."),
  q("[Trace] A factory returns a closure over `let count = 0`. Two separate factory calls create `first` and `second`. After `first()` runs once, what does the first call to `second()` return?", ["1", "0", "undefined", "The two closures share one count"], 1, "Each factory call creates its own lexical binding, so second still begins at zero."),
  q("[Debug] In strict mode, `const show = panel.show; show();` throws while `panel.show()` works. What is the minimal receiver-preserving repair when storing the callback?", ["Use `const show = panel.show.bind(panel);`", "Change the method name", "Wrap the method in another object", "Replace this with arguments"], 0, "bind returns a function that supplies panel as this for its later plain call."),
  q("[Code build] Which code builds a private counter that returns 0, 2, then 4?", ["function makeStep(start, step) { let current = start; return () => { const value = current; current += step; return value; }; } const next = makeStep(0, 2); console.log(next(), next(), next());", "let current = 0; console.log(current, current, current);", "const next = () => 2; console.log(next(), next(), next());", "function makeStep() { return 0; } console.log(makeStep(), makeStep(), makeStep());"], 0, "The closure returns the current binding, advances it by two, and retains the new value for the next call."),
  q("[Edge case] What should two calls to `makeStepCounter(0, 1)` guarantee about their state?", ["Each counter has its own current binding, so advancing one does not advance the other", "Both counters always share a module-level value", "The second counter starts at one because the first was created", "A zero start is treated as missing and replaced with one"], 0, "A factory call creates fresh closure state, and zero is a valid start value."),
];
