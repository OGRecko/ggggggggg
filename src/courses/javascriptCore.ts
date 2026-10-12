import type { Example, Exercise } from "../data/types";
import { authoredLesson, type LessonOverrideLibrary } from "./chapterPlanHelpers";
import type { AuthoredLessonDraft } from "./courseFactory";

type ExampleSeed = Pick<Example, "title" | "code" | "output" | "explanation"> & { lineNotes: string[] };
type LessonSeed = Omit<AuthoredLessonDraft, "authoredDepth" | "examples" | "verification" | "quality"> & {
  examples: ExampleSeed[];
  commonMistakes: Example["mistakes"];
};

function lesson(seed: LessonSeed) {
  const { examples, commonMistakes, ...content } = seed;
  return authoredLesson({
    ...content,
    examples: examples.map(({ lineNotes, ...example }) => ({
      ...example,
      lines: lineNotes.map((note, index) => `Line ${index + 1}: ${note}`),
      mistakes: commonMistakes,
    })),
    verification: ["executed"],
  });
}

const consoleMistakes: Example["mistakes"] = [
  { mistake: "Writing console.log without parentheses", error: "The call is invalid JavaScript and the Worker reports a syntax error.", fix: "Write the value inside console.log(value), then close the call with a parenthesis." },
  { mistake: "Putting output text in a comment instead of a string argument", error: "Comments are ignored, so no visible line appears.", fix: "Use matching quote marks around text that should be logged." },
];

const core: LessonOverrideLibrary = {
  1: {
    learn: lesson({
      title: "Statements run in order, and console.log makes a result visible",
      minutes: 18,
      summary: "Read a tiny JavaScript file from its first declaration to its last visible output.",
      learningGoals: ["Name the parts of a console.log call", "Trace statements in source order", "Distinguish a string literal from a variable name"],
      explanation: "JavaScript evaluates a script from top to bottom unless later constructs introduce a different control-flow rule. A statement is one complete instruction. `const` declares a name that cannot be rebound; `=` assigns its initial value. Quotation marks make a string literal, while an unquoted identifier refers to a variable. `console.log(...)` calls the logging method on `console`, and parentheses hold the argument being logged. The semicolon marks the statement boundary; JavaScript can insert some semicolons automatically, but writing one consistently makes the end of this first example visible. In CodeForge, worker-safe JavaScript is actually executed in a Worker, and the printed lines are the captured console output.",
      keywordNotes: ["`const name = value;` declares and initializes a binding that cannot be reassigned.", "Parentheses after a function or method name contain the values passed to that call.", "`console.log(value)` sends a readable line to this lesson's Worker-backed output panel."],
      examples: [
        { title: "Declare, then log", code: 'const topic = "JavaScript";\nconsole.log(topic);', output: "JavaScript", explanation: "The first statement stores text under topic. The second statement reads that binding and passes its value to console.log.", lineNotes: ["`const` begins a binding declaration, `topic` is its name, `=` assigns the string on the right, the quote marks delimit text, and `;` ends the statement.", "The dot selects `log` from `console`; parentheses make a call, and `topic` supplies the value to display."] },
        { title: "Each call produces one ordered line", code: 'console.log("Start");\nconsole.log("Ready");', output: "Start\nReady", explanation: "The two calls are separate statements. Their output order follows their source order.", lineNotes: ["This call logs the string literal Start before the next statement runs.", "This later call logs Ready, so it appears on the second output line."] },
      ],
      exercise: {
        prompt: "Build a two-line startup message: store the string 'Loaded' in a const named state, then log state followed by the string 'Ready'. Keep the two output lines in that order.",
        starterCode: "// Declare state, then log state and Ready on separate lines\n",
        solution: 'const state = "Loaded";\nconsole.log(state);\nconsole.log("Ready");',
        solutionExplanation: "The declaration happens before either read. The two console.log calls make two lines, and their order matches the required sequence.",
        testCases: [{ label: "Startup order", expected: "Loaded\nReady" }],
        hints: ["Declare a const named state.", "Put the string Loaded in double quotes.", "Use one console.log call for state and a second for Ready.", "Keep the declaration first, then log state, then log the second string."],
      } satisfies Exercise,
      recap: ["A script normally reaches statements from top to bottom.", "Quote marks create string values; a variable name reads a binding.", "console.log is the visible output call in the safe JavaScript Worker."],
      decisionGuide: [
        { use: "console.log for a deliberate value you want to inspect", insteadOf: "expecting a bare expression to appear automatically", reason: "The Worker captures explicit console output; it is not a browser developer console that echoes every expression." },
        { use: "one statement per clear line", insteadOf: "compressing a first program into punctuation the learner has not met", reason: "The source order and each statement boundary stay visible while learning the execution model." },
      ],
      readingCheck: { prompt: "Which line runs first in a script with two consecutive console.log calls?", choices: ["The first call in source order", "The last call only", "A random call", "The call with the longest string"], correctIndex: 0, explanation: "The Worker evaluates these synchronous statements in the order they appear." },
      commonMistakes: consoleMistakes,
    }),
    read: lesson({
      title: "Trace a file before changing it",
      minutes: 16,
      summary: "Use the value assigned on one line to predict a later call without executing the code in your head by guesswork.",
      learningGoals: ["Follow a name from declaration to use", "Count visible output calls", "Explain why reassignment changes only later reads"],
      explanation: "Tracing means keeping a small, explicit record of the values a program has reached. A variable declaration creates a binding; each later read uses its current value. JavaScript's `let` permits reassignment, while `const` prevents rebinding. Neither keyword changes the order in which ordinary statements execute. A call such as `console.log(label)` reads label at that point in the trace. The best first trace is small: read one assignment, write down the value, then inspect each use. Do not infer output from a comment or a title; follow the executable statements and the actual arguments to the logging call.",
      keywordNotes: ["`let` creates a binding that may be reassigned later.", "A variable read uses the value currently stored under that binding.", "A synchronous `console.log` call prints at the point execution reaches it."],
      examples: [
        { title: "Track one reassignment", code: 'let count = 1;\ncount = count + 1;\nconsole.log(count);', output: "2", explanation: "The first assignment stores one. The second reads one, adds one, and stores two before the log reads count.", lineNotes: ["`let` permits a later rebinding, and the initializer stores number 1 in count.", "The right side reads the old count, adds 1, and assigns the resulting number back to count.", "The log reads the updated value, so it prints 2."] },
        { title: "Trace calls, not comments", code: 'const first = "A";\nconsole.log(first);\nconsole.log(first + "B");', output: "A\nAB", explanation: "The second call concatenates the current string with another string; the first call does not mutate first.", lineNotes: ["The quoted A is a string value stored in first.", "This call reads first and logs A.", "The plus sign concatenates two strings here; the new result AB is logged without changing first."] },
      ],
      exercise: { prompt: "Trace and then write the three statements: start with points = 0 using let, add 5, then log points and the text 'done' on separate lines.", starterCode: "let points = 0;\n// Update points and print both required lines\n", solution: 'let points = 0;\npoints = points + 5;\nconsole.log(points);\nconsole.log("done");', solutionExplanation: "The trace is 0, then 5, then the two calls print the updated number and the final text.", testCases: [{ label: "Trace and write", expected: "5\ndone" }], hints: ["Keep the initial zero as a number, not a quoted string.", "Read points on the right side of the addition.", "Store the sum back into points.", "Log points first and the string done second." ] },
      recap: ["A trace records values in execution order.", "Reassignment changes later reads, not output that already happened.", "The plus sign adds numbers or concatenates strings according to their values."],
      decisionGuide: [{ use: "a small value table when tracing several assignments", insteadOf: "re-reading the whole file without recording state", reason: "A value table exposes exactly where a mistaken prediction diverges." }, { use: "let when the binding itself must change", insteadOf: "reassigning a const", reason: "The keyword tells readers whether a new binding value is part of the design." }],
      readingCheck: { prompt: "After `let n = 2; n = n + 3;`, what does a later log of n print?", choices: ["5", "2", "23", "undefined"], correctIndex: 0, explanation: "The second statement reads two, adds three, then reassigns the result five." },
      commonMistakes: [{ mistake: "Treating every plus sign as numeric addition", error: "Strings can make + concatenate instead.", fix: "Trace the value types as well as the values." }, { mistake: "Reading an old value after a reassignment", error: "The trace no longer matches the current binding.", fix: "Update the value table immediately after each assignment." }],
    }),
    predict: lesson({
      title: "Predict output from calls and expressions",
      minutes: 17,
      summary: "Work out the exact values passed to console.log before running the program.",
      learningGoals: ["Evaluate a numeric expression in precedence order", "Recognize string concatenation", "Write a prediction that includes line order"],
      explanation: "Prediction is a small proof about the code you can see. For `2 + 3 * 4`, multiplication is evaluated before addition, so the result is 14. If one operand is a string, `+` may concatenate rather than add. `console.log` receives the evaluated value, not the original source spelling. Separate calls make separate output lines. This is not a substitute for execution: it is a way to make a testable expectation before you press Run, then compare the real Worker output with your reasoning.",
      keywordNotes: ["`*` has higher precedence than `+` in this arithmetic expression.", "When either side of `+` is a string, JavaScript converts the other side and concatenates.", "A prediction is an expectation to compare with the program's actual output."],
      examples: [
        { title: "Precedence predicts 14", code: 'console.log(2 + 3 * 4);\nconsole.log((2 + 3) * 4);', output: "14\n20", explanation: "The first expression multiplies before adding. Parentheses in the second expression make addition happen first.", lineNotes: ["Multiplication is evaluated before addition, so this prints 2 + 12, or 14.", "The parentheses group 2 + 3 first, so the result is 5 times 4, or 20."] },
        { title: "A string changes plus", code: 'console.log(4 + 1);\nconsole.log("4" + 1);', output: "5\n41", explanation: "The first plus adds two numbers. The second joins a string and a number into the text 41.", lineNotes: ["Both operands are numbers, so plus adds them and logs 5.", "The left operand is text; plus concatenates the text 4 and converted text 1."] },
      ],
      exercise: { prompt: "Predict and reproduce the two lines for 0 + 7 and for the text '0' + 7. Write the two console.log calls in that order.", starterCode: "// Log the numeric expression, then the text expression\n", solution: 'console.log(0 + 7);\nconsole.log("0" + 7);', solutionExplanation: "Zero plus seven is numeric addition and prints 7. A string zero plus seven is concatenation and prints 07.", testCases: [{ label: "Number versus text", expected: "7\n07" }], hints: ["Do not quote zero in the first expression.", "Use a string literal for zero in the second expression.", "Keep the same plus sign but trace the operand types.", "The expected strings are 7 and 07, on separate lines." ] },
      recap: ["Trace operator precedence before deciding an output.", "The types on each side of plus affect whether it adds or joins text.", "Compare your prediction with an actual Worker run."],
      decisionGuide: [{ use: "parentheses when they clarify the intended calculation", insteadOf: "relying on a reader to remember a dense expression's precedence", reason: "Explicit grouping keeps a prediction reviewable." }, { use: "a pre-run prediction for deterministic examples", insteadOf: "editing until the output happens to look right", reason: "A prediction gives you a concrete claim to check against execution." }],
      readingCheck: { prompt: "What does `2 + 3 * 4` evaluate to?", choices: ["14", "20", "234", "24"], correctIndex: 0, explanation: "Multiplication happens before addition: 3 × 4 is 12, then 2 + 12 is 14." },
      commonMistakes: [{ mistake: "Ignoring precedence", error: "The predicted total differs from JavaScript's evaluation.", fix: "Evaluate multiplication before addition, or add parentheses to show your intention." }, { mistake: "Assuming a quoted number is still numeric", error: "The expression concatenates instead of adding.", fix: "Use Number(text) when a deliberate conversion is intended." }],
    }),
    debug: lesson({
      title: "Repair a malformed console call",
      minutes: 18,
      summary: "Find the smallest syntax defect instead of rewriting a whole program.",
      learningGoals: ["Recognize a call's parentheses", "Use the Worker syntax error as evidence", "Repair only the damaged expression"],
      explanation: "A function or method call needs parentheses around its arguments. The broken example leaves them out, so JavaScript cannot parse the statement as a valid call expression. A syntax error happens before the program's ordinary statements execute; this is different from a runtime error raised after execution begins. The useful repair is local: preserve the message and add the missing call punctuation. In a real debugging loop, reproduce the failure, read the first useful parser message, change one thing, and run again. The exercise starter is intentionally broken; the repaired example is the verified behavior.",
      keywordNotes: ["A call expression is written as a name followed by parentheses.", "A syntax error prevents the parser from creating an executable program.", "The Worker reports real JavaScript errors; it does not invent a compiler transcript."],
      examples: [
        { title: "Broken call: missing parentheses", code: 'console.log "ready";', output: "Does not run: syntax error; no console output.", explanation: "The string is not inside a call argument list, so this line cannot parse as the intended method call.", lineNotes: ["This deliberately broken statement names log but omits the parentheses needed for its argument."] },
        { title: "Repair only the call", code: 'console.log("ready");', output: "ready", explanation: "Adding parentheses makes the string the argument passed to log.", lineNotes: ["The opening and closing parentheses surround the quoted argument, and the semicolon ends the repaired statement."] },
      ],
      exercise: { prompt: "Fix the missing call punctuation so the program prints exactly `fixed`. Do not rename console or change the message.", starterCode: 'console.log "fixed";', solution: 'console.log("fixed");', solutionExplanation: "The issue is the malformed call, not the method name or message. Parentheses make fixed the argument to log.", testCases: [{ label: "Repaired call", expected: "fixed" }], hints: ["Keep console.log as the method.", "A call needs an opening parenthesis after log.", "Put the quoted message inside the parentheses.", "Close the call before the semicolon." ] },
      recap: ["Calls need parentheses around arguments.", "Syntax errors stop parsing before ordinary execution.", "Change the smallest broken part, then re-run the same program."],
      decisionGuide: [{ use: "a minimal repair followed by a rerun", insteadOf: "rewriting unrelated working statements", reason: "One changed token makes it easier to tell whether the repair solved the real cause." }, { use: "the Worker's actual parser message", insteadOf: "guessing what JavaScript might have said", reason: "A diagnostic is evidence about this run, not a placeholder transcript." }],
      readingCheck: { prompt: "What is the smallest repair to `console.log " + '"ready"' + ";`?", choices: ["Add parentheses around the string argument", "Rename console to Console", "Delete the string", "Add a Python print call"], correctIndex: 0, explanation: "The intended operation is already visible; only the call syntax is missing." },
      commonMistakes: [{ mistake: "Changing the message while fixing punctuation", error: "The output no longer matches the exercise contract.", fix: "Preserve the original argument and repair only the call shape." }, { mistake: "Adding one parenthesis but not its matching partner", error: "The line remains syntactically invalid.", fix: "Check that each opening parenthesis has a closing parenthesis." }],
    }),
    modify: lesson({
      title: "Extend an existing message without breaking it",
      minutes: 17,
      summary: "Add one required output to a working program and preserve its original line.",
      learningGoals: ["Read existing behavior before editing", "Make a minimal additive change", "Verify old and new output order"],
      explanation: "Most code changes extend an existing program rather than start from a blank file. First identify what the current code already promises. Then add one statement at the correct point without changing the earlier behavior. This lesson begins with a single working log line and adds a second line. Because console output is ordered, the final test checks both lines together. The same approach works for a label, a status indicator, or a small diagnostic: preserve behavior that still matters and make the new behavior explicit.",
      keywordNotes: ["A modification changes a working program to satisfy a new requirement.", "A regression is an old behavior that stops working after a change.", "The output order is part of this exercise's observable contract."],
      examples: [
        { title: "Before: one line", code: 'console.log("saved");', output: "saved", explanation: "This is the behavior the change must preserve.", lineNotes: ["The original program logs one status line; the modification should not remove it."] },
        { title: "After: add a second line", code: 'console.log("saved");\nconsole.log("synced");', output: "saved\nsynced", explanation: "The old line remains first, and the new confirmation is added afterward.", lineNotes: ["This first call preserves the existing saved message.", "This second call implements the new sync confirmation without changing the first line."] },
      ],
      exercise: { prompt: "The existing line prints `queued`. Add a second log call that prints `sent`; the first line must remain unchanged.", starterCode: 'console.log("queued");\n// Add the new confirmation below\n', solution: 'console.log("queued");\nconsole.log("sent");', solutionExplanation: "The first statement is preserved exactly and the second one adds the newly required confirmation.", testCases: [{ label: "Preserve and extend", expected: "queued\nsent" }], hints: ["Do not edit the queued statement.", "Add a new statement on the next line.", "Use console.log with the quoted text sent.", "Check that queued still appears before sent." ] },
      recap: ["Read the working behavior before changing it.", "Add the smallest code needed for the new requirement.", "Check old and new output together for regressions."],
      decisionGuide: [{ use: "an additive edit when old behavior remains required", insteadOf: "replacing the whole working block", reason: "A focused change preserves the behavior other callers or learners may rely on." }, { use: "a regression check that includes the old output", insteadOf: "checking only the new line", reason: "A change can add the new feature while accidentally removing the original one." }],
      readingCheck: { prompt: "When the task says to add a confirmation but preserve an existing message, what should your test include?", choices: ["Both lines in their required order", "Only the new line", "No output", "A random number"], correctIndex: 0, explanation: "The contract includes both the old behavior and the new behavior." },
      commonMistakes: [{ mistake: "Replacing the original output with the new confirmation", error: "The new line appears, but required behavior regresses.", fix: "Keep the original statement and add a second one." }, { mistake: "Appending the new line before the original", error: "The output order differs from the stated sequence.", fix: "Put the new statement after the behavior it extends." }],
    }),
    "blank-page": lesson({
      title: "Build a compact status card from a blank editor",
      minutes: 20,
      summary: "Combine constants, a number, a string, and two console lines into a small original program.",
      learningGoals: ["Translate a short requirement into named values", "Use a template literal for readable output", "Keep zero as a numeric value"],
      explanation: "A blank-editor task asks you to construct the program, not recognize a completed sample. Start by listing the values the requirement gives you. Declare them with `const` when they will not be rebound. A template literal uses backticks and `${...}` to insert a value into text; the expression inside the braces is evaluated before the resulting string is logged. The score in this exercise is zero, which is a valid number and should not be confused with missing data. The second line is a stable label so you can compare the exact output after the run.",
      keywordNotes: ["Backticks delimit a template literal.", "`${score}` evaluates score and inserts its string form into the surrounding text.", "Numeric zero is a real value; it is not the same as an absent binding."],
      examples: [
        { title: "Build a two-value label", code: 'const name = "Ada";\nconst lessons = 0;\nconsole.log(`${name}: ${lessons}`);', output: "Ada: 0", explanation: "The template literal reads both bindings. Zero remains numeric until it is formatted as part of the output string.", lineNotes: ["The string Ada is stored in a constant called name.", "The numeric literal 0 is stored in lessons; it is not written in quotes.", "Backticks mark a template literal; each ${...} evaluates a variable and the call logs the completed string."] },
        { title: "Use a boundary value in a report", code: 'const attempts = 1;\nconsole.log(`attempts=${attempts}`);\nconsole.log("complete");', output: "attempts=1\ncomplete", explanation: "One attempt is a boundary worth representing explicitly, and the final line remains separate.", lineNotes: ["The numeric value one is named before it is formatted.", "The interpolation inserts the current number after the equals sign.", "A separate call logs the completion label on its own line."] },
      ],
      exercise: { prompt: "From a blank editor, create const learner = 'Mina' and const score = 0. Log `Mina scored 0` using a template literal, then log `review` on a second line.", starterCode: "// Build the two-line score card\n", solution: 'const learner = "Mina";\nconst score = 0;\nconsole.log(`${learner} scored ${score}`);\nconsole.log("review");', solutionExplanation: "The named values separate data from presentation, and the template literal formats the zero score without losing the second required line.", testCases: [{ label: "Zero-score card", expected: "Mina scored 0\nreview" }], hints: ["Declare learner as text and score as a number.", "Use backticks rather than quote marks around the interpolated message.", "Place learner and score inside separate ${...} markers.", "Log review with a second console.log call." ] },
      recap: ["Blank-page work begins by identifying required values and outputs.", "Template literals combine text with evaluated expressions.", "Zero is a meaningful numeric boundary and should be handled deliberately."],
      decisionGuide: [{ use: "a template literal for a short message with embedded values", insteadOf: "a chain of small string concatenations", reason: "The final sentence remains readable while the data names stay visible." }, { use: "const for values that are not rebound", insteadOf: "let by default", reason: "The declaration communicates that this program does not replace the binding." }],
      readingCheck: { prompt: "In a template literal, what does `${score}` do?", choices: ["Evaluates score and inserts its value", "Declares a new function", "Starts a comment", "Converts score to an array"], correctIndex: 0, explanation: "The expression inside the braces is evaluated as part of the template literal." },
      commonMistakes: [{ mistake: "Writing the template with ordinary quotes", error: "The ${...} text remains literal instead of interpolating.", fix: "Use backticks around a template literal." }, { mistake: "Quoting zero", error: "The code models a string instead of a numeric score.", fix: "Write 0 without quote marks when the value is numeric." }],
    }),
    build: lesson({
      title: "Build an input-free greeting with a clear boundary",
      minutes: 18,
      summary: "Create a worker-safe greeting without claiming access to browser prompts or hidden input.",
      learningGoals: ["Model provided data with a binding", "Create one visible greeting", "State the runtime boundary accurately"],
      explanation: "This app's Run button supplies an empty input string and the JavaScript Worker has no prompt dialog. A first project should therefore use explicit data in the source instead of pretending a typed name arrived from the browser. Store the value once, format the greeting, and log it. If a real page later collects a name from a form, that form is a separate browser boundary with its own validation and accessibility requirements. The small worker program is real and executed here; the form behavior is not part of this console example.",
      keywordNotes: ["A hard-coded demonstration value is not the same as user input.", "A template literal inserts the provided name into a greeting.", "`||` tests its left operand by truthiness and returns the right operand when the left is empty.", "A Worker-safe console example does not have access to document or prompt."],
      examples: [
        { title: "Use an explicit demo value", code: 'const name = "Rae";\nconsole.log(`Hello, ${name}!`);', output: "Hello, Rae!", explanation: "The example states its data source directly and logs the resulting greeting.", lineNotes: ["The demo's name value is explicit source data, not a prompt response.", "The template literal inserts name into the message and the call makes it visible."] },
        { title: "Handle an empty label deliberately", code: 'const name = "";\nconst label = name || "guest";\nconsole.log(`Hello, ${label}!`);', output: "Hello, guest!", explanation: "The empty string is falsy, so the fallback label is selected before formatting.", lineNotes: ["This is an intentionally empty string boundary.", "The logical OR selects guest because name is empty.", "The chosen label is inserted into the final greeting."] },
      ],
      exercise: { prompt: "Use a source constant named recipient with the empty string. Choose 'guest' when it is empty, then print exactly `Welcome, guest`. Do not call prompt().", starterCode: "// Choose a safe fallback for the empty recipient\n", solution: 'const recipient = "";\nconst label = recipient || "guest";\nconsole.log(`Welcome, ${label}`);', solutionExplanation: "The empty source value selects the fallback. The solution stays within the Worker runtime and does not claim to collect browser input.", testCases: [{ label: "Empty greeting", expected: "Welcome, guest" }], hints: ["Keep recipient as an explicit constant.", "Use a fallback expression for an empty string.", "Build the message with a template literal.", "Do not use prompt; the Worker has no browser dialog." ] },
      recap: ["The Worker executes JavaScript but does not collect prompt input.", "Explicit sample data keeps a console program reproducible.", "Empty text is an edge case that can select a useful fallback."],
      decisionGuide: [{ use: "an explicit value for a Worker exercise", insteadOf: "calling prompt() in a runtime without a dialog", reason: "The example remains executable and the browser boundary stays truthful." }, { use: "a validation or fallback step before formatting", insteadOf: "printing an empty label without comment", reason: "Empty values are ordinary input edges in real applications." }],
      readingCheck: { prompt: "Why does the example use a source constant instead of prompt()?", choices: ["The CodeForge JavaScript Worker has no browser prompt dialog", "prompt is invalid JavaScript", "Strings cannot come from forms", "The Worker runs Java"], correctIndex: 0, explanation: "The code uses only APIs the actual worker provides." },
      commonMistakes: [{ mistake: "Calling prompt in the Worker example", error: "The browser-only global is not defined in the sandbox.", fix: "Use an explicit test value here and teach form input at the DOM boundary." }, { mistake: "Treating an empty string as a valid name without a decision", error: "The program prints an incomplete greeting.", fix: "Choose a fallback or reject empty input deliberately." }],
    }),
  },
};

export const javascriptCoreLessons = core;
