import type { Example, Lesson } from "../data/types";

const mistakes: Example["mistakes"] = [
  { mistake: "Leaving out required punctuation", error: "SyntaxError: invalid syntax", fix: "Match parentheses, quotes, commas, and colons before running again." },
  { mistake: "Using a name before assigning it", error: "NameError: name is not defined", fix: "Create the variable first and use exactly the same spelling afterward." },
  { mistake: "Mixing text and numbers without conversion", error: "TypeError", fix: "Convert deliberately with int(), float(), or str() depending on the intended operation." },
];

function example(title: string, code: string, output: string, explanation: string): Example {
  return {
    title,
    code,
    output,
    explanation,
    lines: code.split("\n").map((line, index) => {
      const trimmed = line.trim();
      let detail = "Python evaluates this statement in top-to-bottom order and keeps its result available for the later statements in this example.";
      if (trimmed.startsWith("print(")) detail = "print evaluates the expression inside its parentheses and writes the resulting value to the output console.";
      else if (trimmed.startsWith("if ") || trimmed.startsWith("while ")) detail = "This condition decides whether Python enters the indented block below it. The colon marks the start of that block.";
      else if (trimmed.startsWith("for ")) detail = "This loop receives one value at a time from its sequence and runs the indented body for each value.";
      else if (/^[\w.\[\]]+\s*(=|\+=|-=)/.test(trimmed)) detail = "The assignment evaluates the expression on the right and stores or updates the named value on the left.";
      return `Line ${index + 1}: \`${line}\`. ${detail}`;
    }),
    mistakes,
  };
}

const expressions: Lesson = {
  id: "python-1-3", chapter: 1, order: 3, title: "Evaluate expressions precisely", minutes: 25,
  summary: "Combine values with operators and control exactly how print separates output.",
  learningGoals: ["Predict arithmetic order", "Use + with text and numbers", "Control print separators"],
  explanation: "An expression is code that produces a value. Python evaluates arithmetic using precedence: multiplication and division happen before addition and subtraction unless parentheses say otherwise. The plus operator adds numbers but joins strings. print can receive more than one value, and its sep option controls the text between them.",
  keywordNotes: ["Parentheses change expression order by making their contents evaluate first.", "+ adds numeric values or joins compatible strings.", "sep is a named print option that replaces the default space between values."],
  examples: [
    example("Follow arithmetic precedence", 'total = 2 + 3 * 4\nprint(total)\nprint((2 + 3) * 4)', "14\n20", "Multiplication runs before addition in the first expression. Parentheses make the addition run first in the second expression."),
    example("Choose an output separator", 'chapter = 1\nlesson = 3\nprint("Chapter", chapter, "Lesson", lesson, sep=" - ")', "Chapter - 1 - Lesson - 3", "print receives four values and uses the named separator string between each one."),
  ],
  exercise: { prompt: "Create result from (5 + 1) * 2 and print it. The required output is 12.", starterCode: "# Use parentheses to control the calculation\n", solution: 'result = (5 + 1) * 2\nprint(result)', solutionExplanation: "The parentheses make 5 + 1 evaluate to 6 before multiplication produces 12.", testCases: [{ label: "Parenthesized calculation", expected: "12" }], hints: ["Put 5 + 1 inside parentheses.", "Multiply that grouped result by 2.", "Print the result variable."] },
  recap: ["Expressions produce values.", "Parentheses make evaluation order explicit.", "print can show multiple values with a chosen separator."],
};

const booleans: Lesson = {
  id: "python-2-3", chapter: 2, order: 3, title: "Reason with booleans", minutes: 28,
  summary: "Create True and False values, compare safely, and convert between useful data types.",
  learningGoals: ["Use boolean comparisons", "Combine conditions with and or not", "Convert values deliberately"],
  explanation: "A boolean value is either True or False. Comparisons create booleans, and logical operators combine them. and requires both conditions to be true; or accepts either; not reverses a boolean. Conversion functions make type changes visible, so a program does not rely on accidental behavior.",
  keywordNotes: ["== compares two values for equality.", "and is true only when both connected conditions are true.", "bool(value) asks whether a value is truthy or falsy in a condition."],
  examples: [
    example("Combine two rules", 'age = 16\nhas_ticket = True\ncan_enter = age >= 16 and has_ticket\nprint(can_enter)', "True", "The age comparison is true and has_ticket is true, so and produces the boolean True."),
    example("Convert text before calculation", 'text = "7"\nnumber = int(text)\nprint(number + 3)\nprint(bool(text))', "10\nTrue", "int converts numeric text into a number for arithmetic. A nonempty string is truthy, so bool(text) produces True."),
  ],
  exercise: { prompt: "Set score to 8. Create passed from score >= 7 and print passed.", starterCode: "score = 8\n# Create and print the boolean result\n", solution: 'score = 8\npassed = score >= 7\nprint(passed)', solutionExplanation: "The comparison produces True because 8 is greater than or equal to 7.", testCases: [{ label: "Passing score", expected: "True" }], hints: ["Use the >= comparison operator.", "Store the comparison in passed.", "Print passed without quotes."] },
  recap: ["Comparisons produce True or False.", "and, or, and not combine or reverse conditions.", "Explicit conversion makes arithmetic and logic predictable."],
};

const whileLoops: Lesson = {
  id: "python-3-3", chapter: 3, order: 3, title: "Control repetition with while", minutes: 31,
  summary: "Repeat while a condition is true, update the loop state, and use break or continue intentionally.",
  learningGoals: ["Write a terminating while loop", "Use break safely", "Use continue to skip one iteration"],
  explanation: "A while loop repeats while its condition is True. Unlike a for loop over a known sequence, while is useful when the stopping point depends on changing program state. Every while loop needs a path that changes that state or exits with break. continue skips the rest of the current iteration and begins the next condition check.",
  keywordNotes: ["while evaluates its condition before every iteration.", "break exits the nearest enclosing loop immediately.", "continue skips remaining statements in the current loop iteration."],
  examples: [
    example("Update toward a stop", 'count = 3\nwhile count > 0:\n    print(count)\n    count -= 1\nprint("Go")', "3\n2\n1\nGo", "The update reduces count each turn, so the condition eventually becomes false and the loop ends."),
    example("Skip one value", 'for number in range(1, 5):\n    if number == 3:\n        continue\n    print(number)', "1\n2\n4", "When number is 3, continue skips print for that iteration. The loop then proceeds to 4."),
  ],
  exercise: { prompt: "Set count to 1. Use while to print 1, 2, and 3, then stop.", starterCode: "count = 1\n# Repeat until count is greater than 3\n", solution: 'count = 1\nwhile count <= 3:\n    print(count)\n    count += 1', solutionExplanation: "The condition allows the values through 3. The update moves count toward 4, where the condition becomes false.", testCases: [{ label: "While count", expected: "1\n2\n3" }], hints: ["The condition should allow count through 3.", "Print count inside the loop.", "Increase count by 1 each iteration."] },
  recap: ["while loops need a reliable exit path.", "break exits a loop early; continue skips one loop turn.", "Updates inside a loop prevent accidental infinite repetition."],
};

const debugging: Lesson = {
  id: "python-1-4", chapter: 1, order: 4, title: "Read errors and inspect values", minutes: 27,
  summary: "Use type(), repr(), and small prints to turn a confusing program state into evidence.",
  learningGoals: ["Read a NameError", "Inspect a value with repr", "Use a minimal debugging print"],
  explanation: "Debugging starts with evidence. Read the final error line first, then the line number, then inspect the smallest value involved. repr shows a developer representation that exposes quotes and escape characters that normal print may hide. Temporary debugging prints are useful during investigation, but remove or replace them with tests once the behavior is understood.",
  keywordNotes: ["repr(value) returns a representation intended to reveal a value's exact form.", "type(value) reports the runtime type currently stored in a value.", "A traceback lists the call path and the line where Python raised an exception."],
  examples: [
    example("Reveal hidden whitespace", 'name = "Ada\\n"\nprint(name)\nprint(repr(name))', "Ada\n\n'Ada\\n'", "The normal print moves to a new line because the string contains a newline character. repr exposes that character explicitly."),
    example("Check a value before calculating", 'value = "5"\nprint(type(value))\nprint(int(value) + 1)', "<class 'str'>\n6", "type proves the initial value is text. int then converts compatible numeric text before arithmetic."),
  ],
  exercise: { prompt: "Store text = " + '"Python"' + " and print repr(text).", starterCode: "# Inspect the exact string representation\n", solution: 'text = "Python"\nprint(repr(text))', solutionExplanation: "repr returns the quoted developer representation of the string, making its boundaries visible.", testCases: [{ label: "String representation", expected: "'Python'" }], hints: ["Store the string in text first.", "Call repr(text) inside print."] },
  recap: ["Errors and values are evidence, not a judgment.", "repr reveals characters that normal print may hide.", "Inspect types before mixing values in a calculation."],
  decisionGuide: [{ use: "repr while investigating text", insteadOf: "guessing whether a string contains spaces or newlines", reason: "repr exposes quotes and escape characters so the actual stored value is visible." }, { use: "a small targeted debug print", insteadOf: "adding many unrelated prints", reason: "One focused observation narrows the cause without hiding the order of the program." }],
};

const numericPrecision: Lesson = {
  id: "python-2-4", chapter: 2, order: 4, title: "Choose numeric types deliberately", minutes: 31,
  summary: "Understand float precision, integer division choices, and Decimal for exact base-10 money work.",
  learningGoals: ["Predict / and // results", "Recognize float precision limits", "Use Decimal for exact decimal values"],
  explanation: "Integers are exact whole numbers. Floats are fast binary approximations for many scientific and measurement tasks, but some decimal fractions cannot be represented exactly in binary. For money-like base-10 decimal rules, Decimal created from strings can preserve the decimal values you intend. Choose the type from the domain rule, not from how the value happens to look on screen.",
  keywordNotes: ["/ performs true division and produces a float.", "// performs floor division, discarding the fractional part toward negative infinity.", "Decimal(" + '"0.1"' + ") constructs an exact base-10 decimal from text."],
  examples: [
    example("Choose a division operator", 'print(7 / 2)\nprint(7 // 2)\nprint(7 % 2)', "3.5\n3\n1", "True division keeps the fractional result. Floor division gives the whole quotient, and modulo gives the remainder."),
    example("Use Decimal for a base-10 rule", 'from decimal import Decimal\nprice = Decimal("0.10")\nprint(price + price + price)', "0.30", "The strings create exact decimal values, so the addition follows ordinary base-10 money arithmetic."),
  ],
  exercise: { prompt: "Import Decimal, create price = Decimal(" + '"1.25"' + "), add Decimal(" + '"0.75"' + "), and print the total.", starterCode: "# Use exact base-10 decimal values\n", solution: 'from decimal import Decimal\nprice = Decimal("1.25")\ntotal = price + Decimal("0.75")\nprint(total)', solutionExplanation: "Both values are created from strings as exact decimals. Their sum is the exact Decimal value 2.00.", testCases: [{ label: "Exact decimal total", expected: "2.00" }], hints: ["Import Decimal from decimal.", "Create both Decimal values from quoted text.", "Print the sum stored in total."] },
  recap: ["/ and // answer different division questions.", "Floats are approximations for many decimal fractions.", "Use Decimal for exact base-10 rules such as money when the domain requires it."],
  decisionGuide: [{ use: "float for approximate measurement or scientific values", insteadOf: "Decimal for every number", reason: "Floats are efficient and appropriate when small binary approximation is acceptable in the domain." }, { use: "Decimal from strings for exact base-10 rules", insteadOf: "float plus rounding guesses", reason: "The type preserves the decimal inputs the business rule actually describes." }],
};

const inputValidation: Lesson = {
  id: "python-3-4", chapter: 3, order: 4, title: "Validate before you decide", minutes: 34,
  summary: "Combine loops, conversion errors, and conditions to keep invalid input away from program rules.",
  learningGoals: ["Loop until input is valid", "Catch conversion failure", "Separate validation from business logic"],
  explanation: "Input validation answers a different question from business logic. Validation asks whether a value can be used safely, for example whether text can become an integer. Business logic then asks what the valid value means. Keep those steps separate so a program can give a helpful retry message instead of mixing invalid input with a real decision.",
  keywordNotes: ["try and except handle a conversion failure without ending the entire program.", "continue restarts the current loop after an invalid attempt.", "break exits the validation loop once a valid value has been accepted."],
  examples: [
    example("Validate a candidate list", 'candidates = ["no", "4"]\nfor text in candidates:\n    try:\n        number = int(text)\n    except ValueError:\n        print("retry")\n        continue\n    print(number)\n    break', "retry\n4", "The first candidate cannot convert, so continue skips the successful path. The second converts, prints, and break ends the loop."),
    example("Separate a valid rule", 'def level_label(score):\n    if score >= 10:\n        return "high"\n    return "low"\nprint(level_label(10))', "high", "The function assumes it has already received a valid integer, so it can focus only on the score rule."),
  ],
  exercise: { prompt: "Loop through candidates = [" + '"x"' + ", " + '"2"' + "]. Convert each with int. Print the first converted number and break; print Skip for invalid text.", starterCode: 'candidates = ["x", "2"]\n# Validate each candidate\n', solution: 'candidates = ["x", "2"]\nfor text in candidates:\n    try:\n        number = int(text)\n    except ValueError:\n        print("Skip")\n        continue\n    print(number)\n    break', solutionExplanation: "The invalid x path prints Skip and continues. The next candidate converts to 2, prints, and breaks out of the loop.", testCases: [{ label: "Validated candidate", expected: "Skip\n2" }], hints: ["Put int(text) inside try.", "Use except ValueError for the invalid branch.", "After a valid print, use break."] },
  recap: ["Validate input before applying normal program rules.", "continue retries a loop after an invalid candidate.", "break ends a search once the required valid value is found."],
  decisionGuide: [{ use: "validation before business logic", insteadOf: "assuming every typed value is already usable", reason: "A clear validation boundary prevents conversion failures from leaking into ordinary decision code." }, { use: "continue for an invalid loop turn", insteadOf: "deeply nesting the whole successful path in else blocks", reason: "The invalid case exits early, leaving the valid path less indented and easier to read." }],
};

const firstProgramWorkflow: Lesson = {
  id: "python-1-5", chapter: 1, order: 5, title: "Build a readable first program", minutes: 30,
  summary: "Combine variables, expressions, comments, and output into a short program another person can follow.",
  learningGoals: ["Name intermediate values", "Use a comment for intent", "Format a final message"],
  explanation: "A useful beginner program has a small flow: input data or constants, one transformation, and one visible result. Give intermediate values names when they explain meaning. Use comments for why a decision exists, not for restating obvious syntax. Finish with output that tells a person what the calculation means.",
  keywordNotes: ["A descriptive variable name communicates what a value represents.", "An f-string formats named values directly into a readable sentence.", "A comment should explain intent that the code alone cannot reveal."],
  examples: [
    example("Create a study summary", 'learner = "Mina"\nminutes = 25\n# Show the completed focused practice block\nmessage = f"{learner} studied for {minutes} minutes"\nprint(message)', "Mina studied for 25 minutes", "The program stores meaningful values, builds one readable message, and prints only the final result."),
    example("Reuse a calculated value", 'pages = 12\nrounds = 3\ntotal_pages = pages * rounds\nprint(f"Pages read: {total_pages}")', "Pages read: 36", "total_pages names the result of the expression so the final output does not repeat the calculation."),
  ],
  exercise: { prompt: "Store learner = Ada and lessons = 3. Print exactly: Ada completed 3 lessons using an f-string.", starterCode: "# Build one readable summary\n", solution: 'learner = "Ada"\nlessons = 3\nprint(f"{learner} completed {lessons} lessons")', solutionExplanation: "The f-string reads both named values and produces one complete message. The program keeps data and presentation separate until the final print.", testCases: [{ label: "Readable summary", expected: "Ada completed 3 lessons" }], hints: ["Create learner and lessons first.", "Use an f before the output string.", "Place learner and lessons inside braces."] },
  recap: ["A small program should have a visible flow from named data to result.", "Intermediate names make expressions easier to read and change.", "Output should explain the meaning of a calculated value."],
  decisionGuide: [{ use: "a named total_pages value", insteadOf: "repeating pages * rounds inside every print", reason: "The name explains the result and prevents duplicated calculations from drifting apart later." }, { use: "an f-string for a final message", insteadOf: "hard-coding changing values into text", reason: "The message stays readable while its data remains separately named and reusable." }],
};

const inputWorkflow: Lesson = {
  id: "python-2-5", chapter: 2, order: 5, title: "Turn typed text into a useful result", minutes: 32,
  summary: "Combine input, conversion, arithmetic, and formatted output in one safe small workflow.",
  learningGoals: ["Collect typed text", "Convert before arithmetic", "Format a calculated result"],
  explanation: "Input is always text at the boundary. A program should convert the text immediately when a calculation needs a number, give the converted value a meaningful name, and then apply its normal arithmetic. This keeps the program's type changes visible instead of relying on guesswork or string concatenation.",
  keywordNotes: ["input returns typed characters as a string.", "int converts compatible digit text into a whole number.", "str converts a number to text when it must join a label."],
  examples: [
    example("Calculate a reading goal", 'pages_text = input("Pages today: ")\npages = int(pages_text)\ntomorrow = pages + 5\nprint(f"Tomorrow: {tomorrow}")', "Pages today: 10\nTomorrow: 15", "The typed text becomes an integer before the addition. The f-string then formats the numeric result for a person."),
    example("Keep number and label separate", 'price = 4\ncount = 3\ntotal = price * count\nprint("Total: " + str(total))', "Total: 12", "The multiplication stays numeric. str is used only at the presentation boundary where the number joins label text."),
  ],
  exercise: { prompt: "Ask for a whole number with prompt Number: . Convert it, multiply by 3, and print Triple: followed by the result. The tests use more than one number.", starterCode: 'text = input("Number: ")\n# Convert, calculate, and print\n', solution: 'text = input("Number: ")\nnumber = int(text)\nprint("Triple: " + str(number * 3))', solutionExplanation: "The text boundary is converted once into number. Multiplication stays numeric, and str is used only to join the final label.", testCases: [{ label: "Positive input", input: "4", expected: "Number: Triple: 12" }, { label: "Zero input", input: "0", expected: "Number: Triple: 0" }], hints: ["Use int(text) before multiplying.", "Multiply the integer by 3.", "Convert the final number with str before joining Triple: ."] },
  recap: ["Typed input begins as text.", "Convert at the input boundary before numeric rules run.", "Convert back to text only at a display boundary when a label needs it."],
  decisionGuide: [{ use: "int immediately after numeric input", insteadOf: "trying to calculate with the input string", reason: "The conversion creates one clearly typed numeric value for the rest of the workflow." }, { use: "str only when building display text", insteadOf: "turning values into text early", reason: "Arithmetic remains correct and easy to test until the final presentation boundary." }],
};

const controlWorkflow: Lesson = {
  id: "python-3-5", chapter: 3, order: 5, title: "Build a controlled scoring workflow", minutes: 34,
  summary: "Combine validation, a loop, a condition, and a running total in one predictable decision process.",
  learningGoals: ["Accumulate values", "Choose a final branch", "Keep loop and decision responsibilities clear"],
  explanation: "A reliable control-flow workflow usually has three stages: repeat collection or processing, keep a clear running state, then make a final decision from that state. Do not hide the final rule inside every loop turn unless each turn truly needs its own decision. A separate final if makes the program easier to trace and test.",
  keywordNotes: ["+= updates a running numeric total.", "for repeats the same processing rule for each source value.", "A final if can make one decision from the completed total."],
  examples: [
    example("Total then decide", 'scores = [3, 4, 5]\ntotal = 0\nfor score in scores:\n    total += score\nif total >= 10:\n    print("goal reached")\nelse:\n    print("keep going")', "goal reached", "The loop only accumulates values. After it finishes, the final if evaluates the complete total once."),
    example("Skip an invalid score", 'scores = [3, -1, 4]\ntotal = 0\nfor score in scores:\n    if score < 0:\n        continue\n    total += score\nprint(total)', "7", "continue removes the invalid negative turn from the accumulation path, leaving the normal update less nested."),
  ],
  exercise: { prompt: "Use scores = [2, 3, 4]. Add them in a for loop. Print Pass when total is at least 9; otherwise print Retry.", starterCode: "scores = [2, 3, 4]\ntotal = 0\n# Accumulate, then decide\n", solution: 'scores = [2, 3, 4]\ntotal = 0\nfor score in scores:\n    total += score\nif total >= 9:\n    print("Pass")\nelse:\n    print("Retry")', solutionExplanation: "The loop calculates the complete total of 9. The final conditional then selects Pass based on that finished state.", testCases: [{ label: "Passing total", expected: "Pass" }], hints: ["Use total += score inside the loop.", "Place the if after the loop, not inside it.", "Compare total with 9 using >=."] },
  recap: ["Loops process repeated values; final conditions decide from finished state.", "Running totals start from a known numeric value such as 0.", "continue keeps an invalid loop turn away from the normal processing path."],
  decisionGuide: [{ use: "one final if after accumulation", insteadOf: "repeating the final result decision during every loop turn", reason: "The completed total is the real input to the decision, so one final branch matches the business rule directly." }, { use: "continue for invalid entries", insteadOf: "wrapping the whole useful update in a deeply nested else", reason: "The invalid case exits early and leaves the normal update path easier to read." }],
};

const firstProgramCaseStudy: Lesson = {
  id: "python-1-6", chapter: 1, order: 6, title: "Case study: learning introduction", minutes: 32,
  summary: "Create a small introduction program with named data, one calculation, and readable output.",
  learningGoals: ["Combine variables and expressions", "Use f-strings for presentation", "Trace a short complete program"],
  explanation: "This first case study combines the chapter's related ideas: store meaningful values, calculate from them once, and present the result in readable text. The code is still small enough to inspect line by line, but it follows the same separation used in larger programs: data first, transformation second, output last.",
  keywordNotes: ["Variables hold the program's named data.", "An expression calculates a new value from existing values.", "An f-string combines data and readable output at the final presentation step."],
  examples: [
    example("Introduce a learner", 'learner = "Ada"\nchapters = 3\nlessons_per_chapter = 6\ntotal_lessons = chapters * lessons_per_chapter\nprint(f"{learner} can practice {total_lessons} lessons")', "Ada can practice 18 lessons", "The calculation is named before the final message, so the program can reuse or test total_lessons independently."),
    example("Keep the output boundary clear", 'course = "Python"\nlevel = "beginner"\nmessage = f"{course} level: {level}"\nprint(message)', "Python level: beginner", "The two data values remain separate until message creates the one visible sentence."),
  ],
  exercise: { prompt: "Store learner = Mina, chapters = 2, and lessons_per_chapter = 5. Calculate total and print exactly: Mina has 10 lessons.", starterCode: "# Build a complete first-program workflow\n", solution: 'learner = "Mina"\nchapters = 2\nlessons_per_chapter = 5\ntotal = chapters * lessons_per_chapter\nprint(f"{learner} has {total} lessons")', solutionExplanation: "The data values are named, total calculates once, and the f-string creates the final user-facing message.", testCases: [{ label: "Learning introduction", expected: "Mina has 10 lessons" }], hints: ["Multiply chapters by lessons_per_chapter.", "Store the result in total.", "Use an f-string for the final sentence."] },
  recap: ["Complete programs move from named data through a transformation to output.", "A named calculation is clearer than duplicating arithmetic inside output.", "Readable output is part of a program's interface to people."],
  decisionGuide: [{ use: "a named total variable", insteadOf: "putting every calculation directly inside one long output expression", reason: "The intermediate value exposes the program's reasoning and can be reused or checked separately." }, { use: "one final f-string", insteadOf: "several partial print calls", reason: "The reader sees one complete user-facing message and the program keeps presentation in one place." }],
};

const calculationCaseStudy: Lesson = {
  id: "python-2-6", chapter: 2, order: 6, title: "Case study: ticket cost calculator", minutes: 34,
  summary: "Turn two typed values into a validated numeric total and a clear final message.",
  learningGoals: ["Convert two inputs", "Calculate a total", "Keep numeric and display types separate"],
  explanation: "A calculator is a useful boundary example because it receives text, transforms it into numbers, applies an arithmetic rule, and displays a result. Each stage has one type expectation. Keeping the stages separate makes it easy to add validation later without changing the core multiplication rule.",
  keywordNotes: ["int converts typed digit text into integers.", "* multiplies numeric values.", "str converts the final numeric result only when it must join display text."],
  examples: [
    example("Calculate a ticket total", 'price_text = input("Price: ")\ncount_text = input("Count: ")\nprice = int(price_text)\ncount = int(count_text)\ntotal = price * count\nprint(f"Total: {total}")', "Price: 8\nCount: 3\nTotal: 24", "The two text inputs become numbers before multiplication. The f-string displays the completed numeric total without changing its type during the calculation."),
    example("Inspect a numeric boundary", 'text = "12"\nnumber = int(text)\nprint(type(number))\nprint(number * 2)', "<class 'int'>\n24", "type confirms that the boundary conversion succeeded before the program relies on numeric multiplication."),
  ],
  exercise: { prompt: "Ask for Price: and Count: . Convert both, add a fixed service_fee = 2, and print Total: followed by price * count + service_fee. Tests use 4 then 3.", starterCode: 'price_text = input("Price: ")\ncount_text = input("Count: ")\n# Convert, calculate, and print\n', solution: 'price_text = input("Price: ")\ncount_text = input("Count: ")\nprice = int(price_text)\ncount = int(count_text)\nservice_fee = 2\ntotal = price * count + service_fee\nprint(f"Total: {total}")', solutionExplanation: "Both inputs are converted before arithmetic. The fixed numeric fee stays numeric until the final f-string displays the total.", testCases: [{ label: "Ticket calculation", input: "4\n3", expected: "Price: Count: Total: 14" }], hints: ["Convert both text variables with int.", "Create service_fee = 2 as a number.", "Use an f-string for Total: ."] },
  recap: ["A numeric workflow converts at input, calculates with numbers, then formats at output.", "Separate named variables make a formula easier to change and test.", "A type inspection can confirm a boundary conversion during debugging."],
  decisionGuide: [{ use: "separate converted price and count variables", insteadOf: "nesting input, conversion, and arithmetic into one unreadable expression", reason: "Each stage has one visible type and purpose, which makes validation and debugging much simpler." }, { use: "an f-string for final output", insteadOf: "converting every number to text before calculating", reason: "The multiplication remains numeric and correct until the display boundary." }],
};

const scoringCaseStudy: Lesson = {
  id: "python-3-6", chapter: 3, order: 6, title: "Case study: score review", minutes: 36,
  summary: "Loop through results, ignore invalid entries, calculate a total, and choose one final status.",
  learningGoals: ["Use continue for invalid data", "Maintain a running total", "Choose a final branch after processing"],
  explanation: "This case study uses the whole control-flow chapter as one small process. The loop handles each candidate score. continue removes an invalid score from normal work. The running total records accepted values. A final conditional makes one decision after all valid information is known.",
  keywordNotes: ["for processes each value in a sequence.", "continue skips the current invalid loop turn.", "A final if evaluates the completed state after the loop."],
  examples: [
    example("Review a score list", 'scores = [4, -1, 5]\ntotal = 0\nfor score in scores:\n    if score < 0:\n        continue\n    total += score\nif total >= 9:\n    print("Pass")\nelse:\n    print("Retry")', "Pass", "The negative value is skipped. The two valid values total 9, so the final decision chooses Pass."),
    example("Stop when a target appears", 'values = [1, 3, 5, 8]\nfor value in values:\n    if value == 5:\n        print("found")\n        break', "found", "break ends the search after the first matching value, avoiding unnecessary later work."),
  ],
  exercise: { prompt: "Use scores = [3, -1, 4, 2]. Skip negative scores, add the rest, and print Pass when total is at least 9; otherwise Retry.", starterCode: "scores = [3, -1, 4, 2]\ntotal = 0\n# Review scores, then decide\n", solution: 'scores = [3, -1, 4, 2]\ntotal = 0\nfor score in scores:\n    if score < 0:\n        continue\n    total += score\nif total >= 9:\n    print("Pass")\nelse:\n    print("Retry")', solutionExplanation: "continue keeps -1 away from the total. The accepted scores total 9, so the completed-state decision prints Pass.", testCases: [{ label: "Score review", expected: "Pass" }], hints: ["Use if score < 0 followed by continue.", "Add valid scores with total += score.", "Put the final if after the loop."] },
  recap: ["A loop can process data while a final branch decides from the completed result.", "continue is useful for rejecting one invalid item early.", "break is useful only when the loop's job is already complete."],
  decisionGuide: [{ use: "a final decision after the loop", insteadOf: "printing Pass or Retry during every score iteration", reason: "The result depends on the completed total, not on a partial total halfway through processing." }, { use: "continue for invalid scores", insteadOf: "adding nested else blocks around every normal line", reason: "The invalid path exits immediately and the valid path remains straightforward." }],
};

const firstProgramChallenge: Lesson = {
  id: "python-1-7", chapter: 1, order: 7, title: "Challenge: personal study card", minutes: 34,
  summary: "Build a complete, readable study-card program from named values and one calculation.",
  learningGoals: ["Model a small requirement", "Calculate one derived value", "Write a clear final message"],
  explanation: "This challenge is your first small deliverable. A study card needs named learner data, a calculated total, and one clear output. Keep the code in order: define facts first, calculate next, and present last. This is the basic shape that larger programs keep as they gain functions and classes.",
  keywordNotes: ["A requirement becomes code through named values and an explicit formula.", "A derived value comes from an expression using stored facts.", "A final f-string is a presentation boundary for a person reading the output."],
  examples: [
    example("Create a study card", 'learner = "Mina"\nchapters = 4\nlessons_each = 6\ntotal = chapters * lessons_each\nprint(f"{learner}: {total} lessons planned")', "Mina: 24 lessons planned", "The program first stores data, then calculates total, then creates a complete user-facing sentence."),
    example("Handle a zero plan", 'chapters = 0\nlessons_each = 6\ntotal = chapters * lessons_each\nprint(f"Lessons planned: {total}")', "Lessons planned: 0", "The same formula still works at the boundary value zero, which is why an explicit arithmetic expression is easier to trust than hard-coded output."),
  ],
  exercise: { prompt: "Store learner = Ada, chapters = 3, lessons_each = 4. Calculate total and print exactly: Ada: 12 lessons planned.", starterCode: "# Deliver a small study-card program\n", solution: 'learner = "Ada"\nchapters = 3\nlessons_each = 4\ntotal = chapters * lessons_each\nprint(f"{learner}: {total} lessons planned")', solutionExplanation: "The output comes from named data and a named total, so changing chapters or lessons_each changes the result without editing the sentence template.", testCases: [{ label: "Study card", expected: "Ada: 12 lessons planned" }], hints: ["Define the three named values first.", "Multiply chapters by lessons_each.", "Use an f-string matching the required punctuation."] },
  recap: ["A small deliverable has data, transformation, and presentation.", "Named values make a requirement easier to trace.", "A boundary value such as zero should still follow the same formula."],
  decisionGuide: [{ use: "variables plus a calculated total", insteadOf: "a hard-coded final sentence", reason: "The program remains correct when the plan changes because the result is derived from facts." }, { use: "one final output line", insteadOf: "scattering part of the message across several prints", reason: "The study card's visible interface stays readable and easy to compare with expected output." }],
};

const calculationChallenge: Lesson = {
  id: "python-2-7", chapter: 2, order: 7, title: "Challenge: budget total with a fee", minutes: 36,
  summary: "Collect two typed values, apply a numeric rule, and present the result without mixing types early.",
  learningGoals: ["Translate a word problem into variables", "Keep arithmetic numeric", "Test more than one input"],
  explanation: "This challenge represents a realistic calculator rule: price multiplied by quantity plus a fixed fee. Read the problem for nouns and operations. The price, count, and fee each become named numbers. The final total stays numeric until one output line presents it. That separation is what lets a later program test multiple inputs reliably.",
  keywordNotes: ["A fixed fee is a named constant-like value in a small program.", "The multiplication and addition expression follows normal arithmetic precedence.", "Input conversion happens before the formula so every operand is numeric."],
  examples: [
    example("Calculate a budget", 'price = 7\ncount = 2\nfee = 3\ntotal = price * count + fee\nprint(f"Total: {total}")', "Total: 17", "All three inputs are integers, so multiplication and addition stay numeric before the final f-string displays total."),
    example("Check a zero quantity", 'price = 7\ncount = 0\nfee = 3\ntotal = price * count + fee\nprint(total)', "3", "A zero quantity removes the item cost but leaves the fixed fee, which confirms the formula models the stated rule."),
  ],
  exercise: { prompt: "Ask for Price: and Count: . Convert both, set fee = 1, and print Total: followed by price * count + fee. The test enters 5 then 2.", starterCode: 'price_text = input("Price: ")\ncount_text = input("Count: ")\n# Build the budget formula\n', solution: 'price_text = input("Price: ")\ncount_text = input("Count: ")\nprice = int(price_text)\ncount = int(count_text)\nfee = 1\ntotal = price * count + fee\nprint(f"Total: {total}")', solutionExplanation: "The formula has named operands, which makes it easy to verify: 5 times 2 plus 1 equals 11.", testCases: [{ label: "Budget total", input: "5\n2", expected: "Price: Count: Total: 11" }, { label: "Zero count", input: "5\n0", expected: "Price: Count: Total: 1" }], hints: ["Convert price_text and count_text separately.", "Create fee = 1 as an integer.", "Calculate total before the final print."] },
  recap: ["Word problems become named numeric variables and one visible formula.", "Boundary inputs such as zero test whether the formula really models the rule.", "Formatting belongs after the calculation, not inside it."],
  decisionGuide: [{ use: "a named fee value", insteadOf: "hiding + 1 inside a long output expression", reason: "The program documents what the extra amount means and makes policy changes safer later." }, { use: "multiple input test cases", insteadOf: "accepting one memorized result", reason: "Different inputs prove that the calculation rule works rather than only the example numbers." }],
};

const scoringChallenge: Lesson = {
  id: "python-3-7", chapter: 3, order: 7, title: "Challenge: milestone finder", minutes: 38,
  summary: "Search a sequence with a loop, skip unusable values, and stop as soon as the goal is found.",
  learningGoals: ["Write a search loop", "Use continue and break together", "Represent a not-found result"],
  explanation: "A search has a different loop goal from a total. It does not need to process every value after the answer is found. continue skips data that cannot qualify. break stops the loop once the answer is known. A found variable records the result so code after the loop can make one clear final output decision.",
  keywordNotes: ["continue skips a value that cannot qualify for the search.", "break exits a search loop once a matching result is found.", "None is a clear marker for no result found yet."],
  examples: [
    example("Find the first milestone", 'scores = [3, -1, 8, 10]\nfound = None\nfor score in scores:\n    if score < 0:\n        continue\n    if score >= 9:\n        found = score\n        break\nprint(found)', "10", "The invalid negative score is skipped. The loop keeps searching until 10 meets the milestone, then break prevents unnecessary later work."),
    example("Show a not-found result", 'scores = [2, 4, 6]\nfound = None\nfor score in scores:\n    if score >= 9:\n        found = score\n        break\nprint(found)', "None", "No score reaches the threshold, so found retains its deliberate no-result value after the loop."),
  ],
  exercise: { prompt: "Use values = [1, -1, 5, 9]. Skip negative values. Store the first value at least 8 in found, break, then print found.", starterCode: "values = [1, -1, 5, 9]\nfound = None\n# Search for the first qualifying value\n", solution: 'values = [1, -1, 5, 9]\nfound = None\nfor value in values:\n    if value < 0:\n        continue\n    if value >= 8:\n        found = value\n        break\nprint(found)', solutionExplanation: "continue rejects -1. The loop reaches 9, stores it, and break ends the search because the first qualifying value has been found.", testCases: [{ label: "Found milestone", expected: "9" }], hints: ["Keep found = None before the loop.", "Use continue for value < 0.", "Assign found then break when value >= 8."] },
  recap: ["Search loops stop when their answer is known.", "continue rejects an unusable candidate before normal checks.", "None makes an absent search result explicit after the loop."],
  decisionGuide: [{ use: "break after the first qualifying result", insteadOf: "continuing to scan when the requirement is first match", reason: "The loop's job is complete, so extra work could hide the intended first-result rule." }, { use: "found = None before the loop", insteadOf: "a magic number that might be mistaken for a valid score", reason: "The program can clearly tell the difference between a real result and no qualifying result." }],
};

export const foundationDeepDives = { expressions, booleans, whileLoops, debugging, numericPrecision, inputValidation, firstProgramWorkflow, inputWorkflow, controlWorkflow, firstProgramCaseStudy, calculationCaseStudy, scoringCaseStudy, firstProgramChallenge, calculationChallenge, scoringChallenge };