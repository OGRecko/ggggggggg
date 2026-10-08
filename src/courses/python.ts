import type { Chapter, Course, Lesson, LessonKind } from "../data/types";
import type { LessonSeed } from "./pythonAdvanced";
import { makeLesson, pythonAdvancedChapters } from "./pythonAdvanced";
import { foundationDeepDives } from "./pythonFoundations";
import { pythonDebugLabs } from "./pythonDebugLabs";
import { pythonGapLessons } from "./pythonGaps";

const helloWorld: Lesson = {
  id: "python-1-1",
  kind: "learn",
  chapter: 1,
  order: 1,
  title: "Make Python speak",
  minutes: 18,
  summary: "Run your first Python statements and read the output they create.",
  learningGoals: ["Run a Python program", "Use print() to show text", "Read strings and parentheses"],
  explanation: "A program is a precise set of instructions. Python reads your file from top to bottom. The print function is one instruction that asks Python to send a value to the output console. Text placed inside matching quotation marks is called a string.",
  keywordNotes: [
    "print is a built-in function: reusable code Python already provides.",
    "Parentheses () hold the information given to a function.",
    "Quotation marks create a string, which is text data rather than a command.",
  ],
  examples: [
    {
      title: "Your first output",
      code: 'print("Hello, CodeForge!")',
      output: "Hello, CodeForge!",
      explanation: "The function receives one string and writes those characters to a new line in the console.",
      lines: ["Line 1: print calls Python's built-in output function. The opening parenthesis starts the value supplied to it. The quoted characters are one string, and the closing parenthesis finishes the call. Python writes the string, then moves the cursor to the next output line."],
      mistakes: [
        { mistake: "Leaving off a quotation mark", error: "SyntaxError: unterminated string literal", fix: "Use a matching quote at both the beginning and end of the text." },
        { mistake: "Typing Print with a capital P", error: "NameError: name 'Print' is not defined", fix: "Python is case-sensitive. Use lowercase print." },
        { mistake: "Using a curly quote copied from a document", error: "SyntaxError: invalid character", fix: "Type straight quotes directly in the editor." },
      ],
    },
    {
      title: "Output happens in order",
      code: 'print("First")\nprint("Second")',
      output: "First\nSecond",
      explanation: "Python runs the first line, finishes it, then runs the second line. Each print call adds its own ending newline by default.",
      lines: [
        "Line 1: print receives the string First and sends it to the console. When it finishes, Python moves to the next program line.",
        "Line 2: print receives the string Second and sends it beneath the first result. The computer reaches the end of this short program afterward.",
      ],
      mistakes: [
        { mistake: "Expecting both words on one line", error: "No error; the output is just on two lines", fix: "Each print adds a newline. A later lesson shows how to change the end value." },
        { mistake: "Writing print(First) without quotes", error: "NameError: name 'First' is not defined", fix: "Put text in quotes so Python treats it as a string." },
        { mistake: "Putting both calls together with no separator", error: "SyntaxError: invalid syntax", fix: "Place each statement on its own line." },
      ],
    },
  ],
  exercise: {
    prompt: "Write one line that prints exactly: Welcome to Python!",
    starterCode: "# Write your program below\n",
    solution: 'print("Welcome to Python!")',
    solutionExplanation: "The string is the exact sentence required by the test. print sends it to the output console.",
    testCases: [{ label: "Required greeting", expected: "Welcome to Python!" }],
    hints: ["You need Python's built-in output function."],
  },
  recap: ["Python executes statements from top to bottom.", "print() sends a value to the output console.", "Text strings must be surrounded by matching straight quotation marks."],
};

const variablesAndComments: Lesson = {
  id: "python-1-2",
  kind: "learn",
  chapter: 1,
  order: 2,
  title: "Name information with variables",
  minutes: 24,
  summary: "Store a value for later, update it, and leave clear notes for readers.",
  learningGoals: ["Create and read variables", "Use = for assignment", "Write a comment"],
  explanation: "A variable is a name that refers to a value in memory. The equal sign = is the assignment operator: it tells Python to evaluate the value on the right and bind it to the name on the left. A comment starts with #. Python ignores comments, but people use them to explain intent.",
  keywordNotes: [
    "= means assign in Python. It does not ask whether two values are equal.",
    "A variable name begins with a letter or underscore and cannot contain spaces.",
    "# starts a comment. Everything after it on that line is ignored by Python.",
  ],
  examples: [
    {
      title: "Store and reuse a name",
      code: 'learner = "Maya"\nprint(learner)',
      output: "Maya",
      explanation: "The program stores a string under the name learner. The next line looks up that value and prints it.",
      lines: [
        "Line 1: learner is a variable name. The = assignment operator stores the string Maya under that name. Nothing is printed yet.",
        "Line 2: print receives the value currently bound to learner. Python looks it up, finds Maya, and writes Maya to the console.",
      ],
      mistakes: [
        { mistake: "Writing learner = Maya without quotes", error: "NameError: name 'Maya' is not defined", fix: "Maya is text, so wrap it in quotes." },
        { mistake: "Using a space in the name: learner name", error: "SyntaxError: invalid syntax", fix: "Use an underscore, such as learner_name." },
        { mistake: "Printing Learner instead of learner", error: "NameError: name 'Learner' is not defined", fix: "Use exactly the same lowercase spelling. Names are case-sensitive." },
      ],
    },
    {
      title: "Comments explain a decision",
      code: '# Save the course title\ncourse = "Python Foundations"\nprint(course)',
      output: "Python Foundations",
      explanation: "The first line is a comment and is skipped. The following two lines assign and print a title.",
      lines: [
        "Line 1: # begins a comment. Python does not execute the words after it; they are a note for a person reading the code.",
        "Line 2: course is assigned the string Python Foundations so it can be reused later.",
        "Line 3: print looks up course and writes its string value to the console.",
      ],
      mistakes: [
        { mistake: "Using // for a comment", error: "SyntaxError: invalid syntax", fix: "Python comments use #, not //." },
        { mistake: "Putting # before print by accident", error: "No output; Python ignores the whole line", fix: "Remove # when the line should run." },
        { mistake: "Changing the variable name only on one line", error: "NameError for the unmatched name", fix: "Update every reference to use the same name." },
      ],
    },
  ],
  exercise: {
    prompt: "Create a variable named language with the text Python, then print the variable. Your console should show Python.",
    starterCode: "# Store the language, then print it\n",
    solution: 'language = "Python"\nprint(language)',
    solutionExplanation: "language is assigned the required string. Passing the variable to print makes Python look up and display its value.",
    testCases: [{ label: "Language label", expected: "Python" }],
    hints: ["First assign a quoted string to a variable named language.", "On the next line, pass language without quotes to print()."],
  },
  recap: ["Variables give values reusable names.", "= assigns the right-side value to the left-side name.", "Comments begin with # and document code without running."],
};

const numberTypes: Lesson = {
  id: "python-2-1",
  kind: "learn",
  chapter: 2,
  order: 1,
  title: "Work with numbers and types",
  minutes: 26,
  summary: "Use integers, decimal numbers, arithmetic operators, and type().",
  learningGoals: ["Recognize int and float values", "Calculate with arithmetic operators", "Inspect a value's type"],
  explanation: "Data has a type. An int is a whole number such as 7. A float is a decimal number such as 7.5. Python evaluates arithmetic expressions before print receives the result. The operators +, -, *, and / mean add, subtract, multiply, and divide.",
  keywordNotes: [
    "int is Python's whole-number type.",
    "float is Python's decimal-number type.",
    "* multiplies two numeric values; / divides and produces a float.",
  ],
  examples: [
    {
      title: "Calculate a total",
      code: 'notebooks = 3\nprice_each = 4\ntotal = notebooks * price_each\nprint(total)',
      output: "12",
      explanation: "Two integer values are multiplied, and the result is stored before printing.",
      lines: [
        "Line 1: notebooks is assigned the integer 3. An integer has no decimal part.",
        "Line 2: price_each is assigned the integer 4.",
        "Line 3: Python looks up both variables. The * multiplication operator calculates 3 times 4, then = assigns the integer result 12 to total.",
        "Line 4: print receives total, looks up 12, and displays 12.",
      ],
      mistakes: [
        { mistake: "Writing x instead of *", error: "SyntaxError: invalid syntax", fix: "Use * as Python's multiplication operator." },
        { mistake: "Putting a number in quotes", error: "TypeError when trying to multiply incompatible values", fix: "Leave numeric values unquoted when you intend to calculate." },
        { mistake: "Using a hyphen in price-each", error: "NameError or unexpected subtraction", fix: "Variable names use underscores: price_each." },
      ],
    },
    {
      title: "Division produces a decimal",
      code: 'shared_pizza = 5 / 2\nprint(shared_pizza)\nprint(type(shared_pizza))',
      output: "2.5\n<class 'float'>",
      explanation: "The division operator / calculates 5 divided by 2. The result includes a decimal part, so its type is float.",
      lines: [
        "Line 1: Python evaluates 5 / 2 with the / division operator. It assigns the decimal result 2.5 to shared_pizza.",
        "Line 2: print looks up shared_pizza and displays 2.5.",
        "Line 3: type is a built-in function that reports the category of a value. It receives shared_pizza and print displays Python's float type label.",
      ],
      mistakes: [
        { mistake: "Expecting 2", error: "No error; Python correctly shows 2.5", fix: "Use // for floor division when a later program specifically needs the whole-number quotient." },
        { mistake: "Writing type without parentheses", error: "The console shows a function object rather than a type", fix: "Call the function with type(value)." },
        { mistake: "Using a comma for 2,5", error: "Python treats it as separate values", fix: "Use a period for decimal values: 2.5." },
      ],
    },
  ],
  exercise: {
    prompt: "Set tickets to 4 and price to 12. Print the total cost using multiplication. The required output is 48.",
    starterCode: "tickets = 4\nprice = 12\n# Calculate and print the total\n",
    solution: 'tickets = 4\nprice = 12\ntotal = tickets * price\nprint(total)',
    solutionExplanation: "The * operator calculates 4 times 12. The value is stored in total, then sent to print.",
    testCases: [{ label: "Ticket cost", expected: "48" }],
    hints: ["Use * between tickets and price.", "Store the multiplication result in a variable, then print that variable."],
  },
  recap: ["int values are whole numbers and float values contain a decimal part.", "Arithmetic expressions are evaluated before their result is assigned or printed.", "type() lets you inspect the type of a value."],
};

const inputAndConversion: Lesson = {
  id: "python-2-2",
  kind: "learn",
  chapter: 2,
  order: 2,
  title: "Ask for input and convert it",
  minutes: 28,
  summary: "Collect text from a person and convert numeric text before calculating.",
  learningGoals: ["Use input()", "Explain why input returns a string", "Convert text with int()"],
  explanation: "input() pauses a program and waits for a person to type. It always returns a string because typed characters begin as text. When you need arithmetic, int() converts a whole-number string into an integer. Conversion is deliberate so Python does not guess what text means. The Run button supplies no input line, so a program that calls input() is verified with Check answer, which passes the values listed in the exercise tests.",
  keywordNotes: [
    "input(prompt) displays prompt and returns the typed characters as a string.",
    "int(value) converts a compatible string such as \"8\" into the integer 8.",
    "+ joins strings together, but adds numbers together. Conversion decides which behavior you get.",
  ],
  examples: [
    {
      title: "Use a typed name",
      code: 'name = input("What is your name? ")\nprint("Hello, " + name)',
      output: "Sandbox: Run prints the prompt and stops with EOFError, because Run has no input line. With Ada supplied as the first input line the program prints: What is your name? Hello, Ada",
      explanation: "The first line prints its prompt and takes one supplied line as the value of name; the sandbox never echoes that line, so the greeting appears on the same line as the prompt. The second line joins a greeting string with the stored name.",
      lines: [
        "Line 1: input displays the quoted prompt and pauses. When the person types Ada and presses Enter, input returns the string Ada. = assigns it to name.",
        "Line 2: The + operator joins the string Hello, and the string stored in name. print then writes the completed greeting.",
      ],
      mistakes: [
        { mistake: "Writing input without ()", error: "The variable stores the function itself", fix: "Call the function as input(...)." },
        { mistake: "Using a variable before it is assigned", error: "NameError", fix: "Run the assignment line before referencing the variable." },
        { mistake: "Forgetting the space after the comma", error: "No error; output reads Hello,Ada", fix: "Include the desired space inside the greeting string." },
      ],
    },
    {
      title: "Convert a typed number",
      code: 'age_text = input("Age: ")\nage = int(age_text)\nnext_year = age + 1\nprint(next_year)',
      output: "Sandbox: Run prints the prompt and stops with EOFError, because Run has no input line. With 19 supplied as the first input line the program prints: Age: 20",
      explanation: "The supplied characters 19 arrive as text, and int changes them into a number so + can calculate the following age. Because nothing echoes the supplied line, the prompt and the converted result share one output line.",
      lines: [
        "Line 1: input displays Age: and returns whatever was typed as a string. The program stores that string in age_text.",
        "Line 2: int receives the numeric string 19 and converts it to the integer 19. = assigns the converted value to age.",
        "Line 3: Python looks up age, adds the integer 1 with +, and assigns the result 20 to next_year.",
        "Line 4: print displays the integer stored in next_year.",
      ],
      mistakes: [
        { mistake: "Trying age_text + 1", error: "TypeError: can only concatenate str (not 'int') to str", fix: "Convert age_text first with int(age_text)." },
        { mistake: "Typing nineteen instead of 19", error: "ValueError: invalid literal for int()", fix: "Provide digits or add validation in a later lesson." },
        { mistake: "Using Int with a capital I", error: "NameError: name 'Int' is not defined", fix: "Use Python's lowercase int function." },
      ],
    },
  ],
  exercise: {
    prompt: "Ask for a whole number with input(), convert it, add 2, and print the result. The tests will try more than one number.",
    starterCode: '# Ask for a number\nnumber_text = input("Number: ")\n# Convert, add 2, and print\n',
    solution: 'number_text = input("Number: ")\nnumber = int(number_text)\nprint(number + 2)',
    solutionExplanation: "input returns text, so int converts it before + adds 2. print then displays the result.",
    testCases: [
      { label: "Positive number", input: "5", expected: "Number: 7" },
      { label: "Zero", input: "0", expected: "Number: 2" },
      { label: "Negative number", input: "-4", expected: "Number: -2" },
    ],
    hints: ["input() always gives you text.", "Use int(...) around the variable holding the typed text.", "The final print can contain an arithmetic expression directly."],
  },
  recap: ["input() returns a string of typed characters.", "int() converts compatible whole-number text into an integer.", "A test with different inputs checks the program's behavior rather than a single memorized answer."],
};

const decisions: Lesson = {
  id: "python-3-1",
  kind: "learn",
  chapter: 3,
  order: 1,
  title: "Make decisions with if",
  minutes: 30,
  summary: "Compare values and choose one branch with if and else.",
  learningGoals: ["Write an if statement", "Use comparison operators", "Indent a branch correctly"],
  explanation: "Programs often need to choose. An if statement evaluates a condition that is either True or False. When it is True, Python runs the indented block below it. else provides the alternative block. The comparison operator >= means greater than or equal to.",
  keywordNotes: [
    "if starts a conditional branch. Its condition ends with a colon :.",
    ">= compares two values and produces True when the left is greater than or equal to the right.",
    "Indentation is structural in Python: spaces show which statements belong to a branch.",
  ],
  examples: [
    {
      title: "Choose an age message",
      code: 'age = 18\nif age >= 18:\n    print("You can register.")\nelse:\n    print("Ask a guardian.")',
      output: "You can register.",
      explanation: "age is 18, so the >= comparison is True. Python runs the indented if block and skips the else block.",
      lines: [
        "Line 1: age is assigned the integer 18.",
        "Line 2: if evaluates age >= 18. >= means greater than or equal to. Since 18 is equal to 18, the condition is True. The colon begins the branch block.",
        "Line 3: Four spaces indent this print inside the True branch. Python runs it and displays the registration message.",
        "Line 4: else names the alternative branch for a False condition. Its colon begins that block.",
        "Line 5: This indented line belongs to else. Python skips it because the if condition was True.",
      ],
      mistakes: [
        { mistake: "Omitting the colon after the condition", error: "SyntaxError: expected ':'", fix: "End if and else lines with a colon." },
        { mistake: "Not indenting the print line", error: "IndentationError: expected an indented block", fix: "Indent each line that belongs inside if or else by the same amount." },
        { mistake: "Using = instead of >=", error: "SyntaxError: invalid syntax", fix: "Use comparison operators such as ==, >=, or < in conditions." },
      ],
    },
    {
      title: "Compare for an exact match",
      code: 'answer = "yes"\nif answer == "yes":\n    print("Saved")\nelse:\n    print("Not saved")',
      output: "Saved",
      explanation: "== asks whether two values are equal. The two strings match exactly, so the first branch runs.",
      lines: [
        "Line 1: answer is assigned the string yes.",
        "Line 2: if compares answer with the string yes. == is the equality comparison operator, not assignment. The result is True, and the colon begins the branch.",
        "Line 3: The indented print belongs to the True branch and writes Saved.",
        "Line 4: else begins the branch Python would choose if the equality comparison were False.",
        "Line 5: This print belongs to else and is skipped because the values were equal.",
      ],
      mistakes: [
        { mistake: "Using one = in the condition", error: "SyntaxError: invalid syntax", fix: "Use == when comparing; use = only when assigning." },
        { mistake: "Writing Yes instead of yes", error: "No error; the else branch runs", fix: "Strings are case-sensitive. Match the expected text exactly." },
        { mistake: "Mixing tabs and spaces", error: "TabError: inconsistent use of tabs and spaces", fix: "Use spaces consistently; this editor inserts four spaces for indentation." },
      ],
    },
  ],
  exercise: {
    prompt: "Read a whole number. Print High when it is 10 or more; otherwise print Low. The tests include both branches.",
    starterCode: 'score = int(input("Score: "))\n# Write your if/else below\n',
    solution: 'score = int(input("Score: "))\nif score >= 10:\n    print("High")\nelse:\n    print("Low")',
    solutionExplanation: "The >= condition chooses the High branch for 10 and above. else catches every smaller integer.",
    testCases: [
      { label: "Boundary value", input: "10", expected: "Score: High" },
      { label: "Below boundary", input: "9", expected: "Score: Low" },
      { label: "Above boundary", input: "31", expected: "Score: High" },
    ],
    hints: ["Compare score to 10 with >=.", "An if condition ends in a colon, and the print below it needs indentation.", "Use else for the case that is not High."],
  },
  recap: ["if runs its indented block only when its condition is True.", "== compares for equality, while = assigns a value.", "else handles the alternative path when the if condition is False."],
};

const loops: Lesson = {
  id: "python-3-2",
  kind: "learn",
  chapter: 3,
  order: 2,
  title: "Repeat work with for loops",
  minutes: 30,
  summary: "Use range() and a for loop to run a block a controlled number of times.",
  learningGoals: ["Write a for loop", "Predict range() values", "Track a running total"],
  explanation: "A loop repeats a block. for takes one value at a time from a sequence. range(start, stop) creates integers beginning at start and ending before stop. The word in connects the loop variable to those values. Like if, the colon and indentation define the loop body.",
  keywordNotes: [
    "for starts a loop that visits each value in a sequence.",
    "range(start, stop) includes start but excludes stop.",
    "+= is an update operator: total += value means total = total + value.",
  ],
  examples: [
    {
      title: "Count with range",
      code: 'for number in range(1, 4):\n    print(number)\nprint("Done")',
      output: "1\n2\n3\nDone",
      explanation: "range(1, 4) produces 1, 2, and 3. The loop prints each value, then the unindented final line runs once after the loop.",
      lines: [
        "Line 1: for begins a loop. number is the loop variable. in takes values from range(1, 4), which starts at 1 and stops before 4. The colon begins the loop body.",
        "Line 2: The indentation places print inside the loop. Python runs it once with number set to 1, then 2, then 3.",
        "Line 3: This line is not indented, so it is outside the loop. Python runs it once after all range values are used.",
      ],
      mistakes: [
        { mistake: "Expecting 4 to print", error: "No error; output stops at 3", fix: "range stops before its second value. Use range(1, 5) to include 4." },
        { mistake: "Leaving off in", error: "SyntaxError: invalid syntax", fix: "A for loop needs the pattern for variable in sequence:." },
        { mistake: "Unindenting print(number)", error: "IndentationError: expected an indented block", fix: "Indent the body that must repeat." },
      ],
    },
    {
      title: "Build a running total",
      code: 'total = 0\nfor number in range(1, 4):\n    total += number\nprint(total)',
      output: "6",
      explanation: "The loop adds 1, then 2, then 3 to total. The final value is 6.",
      lines: [
        "Line 1: total starts at the integer 0 so there is a known value to update.",
        "Line 2: The loop supplies number values 1, 2, and 3 from range(1, 4).",
        "Line 3: This indented update runs on every loop turn. += adds the current number to total and saves the new value back into total.",
        "Line 4: After the loop is complete, print displays the accumulated total, 6.",
      ],
      mistakes: [
        { mistake: "Starting total as an empty string", error: "TypeError when adding an integer", fix: "Start a numeric total with 0." },
        { mistake: "Using total =+ number", error: "The result keeps being replaced instead of accumulated", fix: "Write += with the plus before the equal sign." },
        { mistake: "Printing inside the loop when only one final answer is needed", error: "No error; several intermediate totals appear", fix: "Unindent the final print so it runs after the loop." },
      ],
    },
  ],
  exercise: {
    prompt: "Use a for loop and range() to print the numbers 1 through 3, one per line. Do not write three separate print statements.",
    starterCode: "# Write one for loop\n",
    solution: 'for number in range(1, 4):\n    print(number)',
    solutionExplanation: "range(1, 4) supplies 1, 2, and 3. The indented print runs for each value.",
    testCases: [{ label: "Count from 1 to 3", expected: "1\n2\n3" }],
    hints: ["range needs a start and a stop value.", "The stop value must be one more than the last number you want.", "Indent print(number) beneath the loop header."],
  },
  recap: ["for repeats a block for each value in a sequence.", "range(start, stop) includes the start and excludes the stop.", "+= updates a value by adding and storing the result."],
};

const chapters: Chapter[] = [
  {
    number: 1,
    title: "Start with Python",
    major: true,
    description: "Output, strings, variables, and comments. Build a tiny course introduction program.",
    lessons: [helloWorld, variablesAndComments, foundationDeepDives.expressions, foundationDeepDives.debugging, foundationDeepDives.firstProgramWorkflow, foundationDeepDives.firstProgramCaseStudy, foundationDeepDives.firstProgramChallenge],
    available: true,
    project: { acceptanceCriteria: ["The learner name is stored in a variable named learner before it is used.", "The first output line joins the fixed label CodeForge learner: with the stored name.", "The second output line is exactly Ready to learn Python."],
      title: "Project: Course badge",
      brief: "Create a short three-line badge. Store your name in a variable named learner, then print exactly: CodeForge learner: followed by the name, and finally Ready to learn Python.",
      prompt: "Write your course badge program. The test uses the name Ada, but any correct approach is accepted if it produces the required three lines.",
      starterCode: 'learner = "Ada"\n# Print the badge\n',
      solution: 'learner = "Ada"\nprint("CodeForge learner: " + learner)\nprint("Ready to learn Python")',
      solutionExplanation: "The program reuses learner rather than hard-coding the name in the printed greeting. The + operator joins two strings.",
      testCases: [{ label: "Badge output", expected: "CodeForge learner: Ada\nReady to learn Python" }],
      hints: ["Use print twice after creating learner.", "Join the label and learner with +.", "The colon after learner belongs inside the first quoted string."],
    },
    test: [
      { question: "What does print() do?", choices: ["Stores a value", "Sends a value to the output console", "Creates a comment", "Repeats code"], correctIndex: 1, explanation: "print is Python's built-in output function." },
      { question: "Which line assigns text to a variable?", choices: ["name == \"Ada\"", "print(name)", "name = \"Ada\"", "# name = Ada"], correctIndex: 2, explanation: "= assigns the quoted string to the variable name." },
      { question: "How does a Python comment begin?", choices: ["//", "#", "<!--", "**"], correctIndex: 1, explanation: "# marks the rest of a line as a Python comment." },
    ],
  },
  {
    number: 2,
    title: "Values from people and programs",
    major: true,
    description: "Numbers, types, input, conversion, and reliable calculation.",
    lessons: [numberTypes, inputAndConversion, foundationDeepDives.booleans, foundationDeepDives.numericPrecision, foundationDeepDives.inputWorkflow, foundationDeepDives.calculationCaseStudy, foundationDeepDives.calculationChallenge],
    available: true,
    project: { acceptanceCriteria: ["Both entered values are converted with int before they are multiplied.", "The total is computed from the two converted values rather than written as a literal.", "The printed line starts with Total: and matches the product of the entered numbers."],
      title: "Project: Two-ticket total",
      brief: "Ask for the price of one ticket and the number of tickets. Convert both values and print the total price. The test enters 8 then 3 and expects Total: 24.",
      prompt: "Use input() twice, convert the entered strings, multiply, and print the label with the total.",
      starterCode: '# Ask for the price and count\n',
      solution: 'price = int(input("Price: "))\ncount = int(input("Count: "))\ntotal = price * count\nprint("Total: " + str(total))',
      solutionExplanation: "Both input values are converted before multiplication. str turns the numeric total back into text so it can be joined with the Total: label.",
      testCases: [{ label: "Ticket total", input: "8\n3", expected: "Price: Count: Total: 24" }],
      hints: ["Use int(input(...)) for each number.", "Multiply the two converted variables.", "str(total) converts the total so it can join the label."],
    },
    test: [
      { question: "What type does input() return?", choices: ["int", "float", "str", "bool"], correctIndex: 2, explanation: "Typed input arrives as a string of characters." },
      { question: "Which operator multiplies numbers?", choices: ["x", "*", "+", "/"], correctIndex: 1, explanation: "* is Python's multiplication operator." },
      { question: "Why use int(age_text)?", choices: ["To add quotation marks", "To convert numeric text to an integer", "To print a prompt", "To create a comment"], correctIndex: 1, explanation: "int converts a compatible string into a whole number." },
    ],
  },
  {
    number: 3,
    title: "Control the path",
    major: true,
    description: "Conditions, comparisons, indentation, and controlled repetition.",
    lessons: [decisions, loops, foundationDeepDives.whileLoops, foundationDeepDives.inputValidation, foundationDeepDives.controlWorkflow, foundationDeepDives.scoringCaseStudy, foundationDeepDives.scoringChallenge],
    available: true,
    project: { acceptanceCriteria: ["A for loop over range() produces the three round lines instead of three separate print calls.", "Each round line joins the fixed label with the current number.", "Complete is printed once after the loop, not inside it."],
      title: "Project: Even study rounds",
      brief: "Use a for loop to print Study round 1 through Study round 3, then print Complete. The exact output uses four lines.",
      prompt: "Build a loop with range() and join the text label with the loop number.",
      starterCode: "# Print the study rounds\n",
      solution: 'for round_number in range(1, 4):\n    print("Study round " + str(round_number))\nprint("Complete")',
      solutionExplanation: "The loop receives each number from 1 through 3. str converts the number before it joins the text label. The final print is outside the loop.",
      testCases: [{ label: "Three study rounds", expected: "Study round 1\nStudy round 2\nStudy round 3\nComplete" }],
      hints: ["range(1, 4) gives the three round numbers.", "str(...) lets you join the changing number to text.", "Keep Complete unindented so it prints once after the loop."],
    },
    test: [
      { question: "What does == do in a condition?", choices: ["Assigns a value", "Adds values", "Compares two values for equality", "Repeats code"], correctIndex: 2, explanation: "== produces True when the values are equal." },
      { question: "Which values does range(1, 4) provide?", choices: ["1, 2, 3", "1, 2, 3, 4", "0, 1, 2, 3", "2, 3, 4"], correctIndex: 0, explanation: "range includes the start and stops before the final value." },
      { question: "Why is indentation important in Python?", choices: ["It changes font size", "It marks which code belongs in a block", "It adds output spaces", "It creates a variable"], correctIndex: 1, explanation: "Indented lines are the body of an if, loop, function, and other blocks." },
    ],
  },
  ...pythonAdvancedChapters,
];

const withReadingCheck = (lesson: Lesson): Lesson => {
  if (lesson.readingCheck) return lesson;
  const firstExample = lesson.examples[0];
  return {
    ...lesson,
    readingCheck: {
      prompt: "Code reading: what is the expected output or result of the first example?",
      choices: [firstExample.output, "No visible result", "A syntax error", "An unrelated result"],
      correctIndex: 0,
      explanation: `Trace the first example from top to bottom. Its documented result is ${firstExample.output}. Use the line-by-line explanation to verify the prediction.`,
    },
  };
};

const chaptersWithExtraLessons: Chapter[] = chapters.map((chapter) => {
  // Chapters 4-25 are assembled by the advanced builder, which places its own debugging labs and
  // gap lessons. Only the foundational chapters 1-3 receive their extra lessons here, and each one
  // is labelled with the activity it actually is.
  const extras: { seed: LessonSeed; kind: LessonKind }[] =
    chapter.number <= 3
      ? [
          ...(pythonDebugLabs[chapter.number] ? [{ seed: pythonDebugLabs[chapter.number], kind: "debug" as LessonKind }] : []),
          ...(pythonGapLessons[chapter.number] ?? []).map((seed) => ({ seed, kind: "learn" as LessonKind })),
        ]
      : [];
  if (!extras.length) return chapter;
  const startOrder = chapter.lessons.length + 1;
  return {
    ...chapter,
    lessons: [...chapter.lessons, ...extras.map((entry, index) => makeLesson(chapter.number, entry.seed, startOrder + index, entry.kind))],
  };
});

export const pythonCourse: Course = {
  id: "python",
  name: "Python",
  version: "Python 3.13",
  accent: "#5b6fe8",
  icon: "Py",
  description: "Build from your first output to production-ready Python with deliberate practice.",
  chapters: chaptersWithExtraLessons.map((chapter) => ({ ...chapter, lessons: chapter.lessons.map(withReadingCheck) })),
};