import type { Example } from "../data/types";
import { authoredLesson, type LessonOverrideLibrary } from "./chapterPlanHelpers";

/**
 * Java gap lessons for topics the scaffolded plans named but never demonstrated.
 * CodeForge performs structural review of Java in the browser and has no JDK in this
 * sandbox, so these programs are authored for review and are deliberately not claimed as
 * executed: every expected output below is derived by hand from the code, and all Java code
 * strings in this course are validated against a real Java grammar parser (not a compiler).
 * The module descriptor lesson states that its artifact is compiled on the module path rather
 * than run, instead of inventing console output.
 */

const javaGapMistakes: Example["mistakes"] = [
  { mistake: "Escaping every quote in a multi-line string", error: "Code that is correct but hard to read and easy to mistype", fix: "Use a text block so quotes and line structure appear as written." },
  { mistake: "Expecting an instance initializer to run once for the class", error: "Repeated output, one per object", fix: "Use a static initializer for class-level setup and an instance initializer for per-object setup." },
  { mistake: "Adding an abstract method to a published interface", error: "Every existing implementation stops compiling", fix: "Add a default method so existing implementers inherit working behavior." },
  { mistake: "Capturing a local variable that is later reassigned", error: "A compile error about an effectively final variable", fix: "Copy the value into a final local before the anonymous class uses it." },
];

const example = (title: string, code: string, output: string, explanation: string, lines: string[]): Example => ({
  title, code, output, explanation, lines, mistakes: javaGapMistakes,
});

export const javaGapLessons: LessonOverrideLibrary = {
  6: {
    design: authoredLesson({
      title: "Immutable collection factories",
      minutes: 22,
      summary: "Design small fixed collections with List.of, Set.of, and Map.of, and know what those factories reject and what a caller may do with the result.",
      learningGoals: [
        "Create a fixed collection without building it up method call by method call",
        "Know which inputs the factories reject and why that is a feature",
        "Choose an immutable collection when the data is a contract rather than working state",
      ],
      explanation: "Not every collection is working state. A lookup table, a set of allowed values, or the subjects of a report are contracts: the code that reads them should not be able to add or remove entries by accident. The factory methods List.of, Set.of, and Map.of build exactly that kind of collection in one expression, which also removes the intermediate object that an ArrayList and three add calls would create. The immutability is enforced rather than promised: attempting to add, set, or remove through one of these collections throws UnsupportedOperationException, which turns a silent mutation bug into a failure the moment it happens. The factories also reject what they cannot represent honestly: null elements and null keys or values, because a null inside a fixed collection hides a missing value rather than expressing one. Map.of additionally rejects duplicate keys, which catches a copy and paste mistake at construction time. When the data really does change, the honest shape is an ArrayList or HashMap created deliberately, or a new collection derived from the fixed one, because a method that promises not to mutate its input can now pass that promise on.",
      keywordNotes: [
        "List.of, Set.of, and Map.of build a fixed collection in one expression instead of a sequence of add or put calls.",
        "The result is immutable, so add, set, remove, and put throw UnsupportedOperationException rather than failing silently.",
        "The factories reject null elements and null keys or values, and Map.of rejects duplicate keys.",
        "Set.of and Map.of have no defined iteration order, so code that depends on order should use a different structure or sort explicitly.",
        "Deriving a mutable collection from a fixed one is explicit work, which is the point: the reader sees where mutation is allowed.",
      ],
      examples: [
        example(
          "Build two fixed collections in one expression each",
          'import java.util.List;\nimport java.util.Map;\n\npublic class Main {\n    public static void main(String[] args) {\n        List<String> topics = List.of("read", "build");\n        Map<String, Integer> levels = Map.of("read", 1, "build", 2);\n        System.out.println(topics.size() + " " + levels.get("build"));\n    }\n}',
          "2 2",
          "Each factory call returns a complete, fixed collection, so the code states its data instead of describing how to assemble it, and the size and lookup both reflect the two entries that were declared.",
          [
            "Line 1: the List import is required for the declared type of the first collection.",
            "Line 2: the Map import names the second structure, which stores one value per key.",
            "Line 3: the blank line separates imports from the type declaration, which is the conventional layout.",
            "Line 4: the class holds the entry point that the runtime launches.",
            "Line 5: the main method signature matches the launcher contract so the class can be run directly.",
            "Line 6: List.of returns a fixed list of two strings in the order they are written.",
            "Line 7: Map.of returns a fixed map whose keys are distinct, and the get call has an entry to find.",
            "Line 8: the printed line combines the list size with the looked up value, so both factories are observed at once.",
            "Line 9: the main method closes after the two collections were built and read.",
            "Line 10: the class closes, and nothing in the program needed a mutable intermediate structure.",
          ],
        ),
        example(
          "A fixed collection refuses mutation",
          'import java.util.List;\n\npublic class Main {\n    public static void main(String[] args) {\n        List<String> fixed = List.of("a", "b");\n        try {\n            fixed.add("c");\n        } catch (UnsupportedOperationException error) {\n            System.out.println("immutable");\n        }\n    }\n}',
          "immutable",
          "The failed add throws instead of quietly succeeding, which is what makes the immutability a real boundary: the caller finds out immediately that this collection was never meant to change.",
          [
            "Line 1: the List import is the only type the example needs.",
            "Line 2: the blank line keeps imports separate from the class, which is the usual reviewable layout.",
            "Line 3: the class declares the runnable entry point.",
            "Line 4: the main method is the method the launcher calls.",
            "Line 5: the fixed list is created from two string literals and nothing else.",
            "Line 6: the try block marks the call that may fail, which makes the boundary visible in the source.",
            "Line 7: add is attempted even though the collection is immutable, and it throws instead of returning a failure flag.",
            "Line 8: the catch names the specific exception, so the handler documents exactly which violation is expected.",
            "Line 9: the message records that the collection is immutable, which is the behaviour worth teaching.",
            "Line 10: the catch block closes after handling the expected failure.",
            "Line 11: the main method closes with the program still running normally.",
            "Line 12: the class closes, and the mutation never reached the collection.",
          ],
        ),
      ],
      exercise: {
        prompt: "Create a fixed list with List.of and a fixed map with Map.of, then print the list size and one value looked up by key.",
        starterCode: "// Build fixed collections in one expression each\n",
        solution: 'import java.util.List;\nimport java.util.Map;\n\npublic class Main {\n    public static void main(String[] args) {\n        List<String> topics = List.of("read", "build");\n        Map<String, Integer> levels = Map.of("read", 1, "build", 2);\n        System.out.println(topics.size() + " " + levels.get("build"));\n    }\n}',
        solutionExplanation: "Both collections are built and read in the same expression that declares them, the map key is distinct as the factory requires, and the printed line shows that the fixed structures hold the declared data.",
        testCases: [{ label: "Fixed collections", expected: "2 2" }],
        hints: ["Declare the type and assign the factory result in one statement.", "Give the map distinct keys because duplicates are rejected.", "Read one value back with get to show the map works."],
        checker: {
          mode: "patterns",
          requiredPatterns: ["List\\.of", "Map\\.of", "System\\.out\\.println"],
          successMessage: "The exercise creates both fixed collections with factory methods and reads them back.",
        },
      },
      recap: [
        "List.of, Set.of, and Map.of state a fixed collection in one expression instead of assembling it step by step.",
        "The result rejects mutation loudly with UnsupportedOperationException, and the factories reject null and duplicate keys.",
        "Choose a fixed collection when the data is a contract, and build a mutable one deliberately when the data genuinely changes.",
      ],
      readingCheck: {
        prompt: "Why do the factories reject null elements instead of storing them?",
        choices: [
          "Because a null inside a fixed collection hides a missing value rather than expressing one",
          "Because null values cannot be printed",
          "Because immutability requires every element to be a constant",
          "Because Set.of only accepts numbers",
        ],
        correctIndex: 0,
        explanation: "Rejecting null keeps the contract honest: a fixed collection should describe data that exists, and a missing value should be handled explicitly rather than smuggled in as null.",
      },
      decisionGuide: [
        { use: "List.of, Set.of, or Map.of for data that does not change", insteadOf: "a mutable collection that is only ever read", reason: "The fixed factory states the intent, prevents accidental mutation, and removes the intermediate construction steps." },
        { use: "a deliberately created ArrayList or HashMap when mutation is required", insteadOf: "wrapping a fixed collection and hoping no one notices", reason: "Mutation should be visible in the type and the declaration, so readers know where state can actually change." },
      ],
      verification: ["structurally-checked"],
      quality: { codeReading: true, edgeCase: true },
    }),
  },
  7: {
    read: authoredLesson({
      title: "Text blocks for multi-line text",
      minutes: 27,
      summary: "Write multi-line strings and embedded quotes without escape characters, and know how the closing delimiter shapes the result.",
      learningGoals: ["Write a text block with triple quotes", "Embed quotes without backslashes", "Explain how incidental indentation and the final newline are decided"],
      explanation: "A text block begins with three double quotes followed by a line break, which makes the content readable exactly as it will appear. Quotes inside the block need no escaping, which is why JSON, SQL, and formatted reports become far easier to read than a single line full of \\\" sequences. Two rules decide the final value: incidental indentation is stripped based on the least-indented content line and the closing delimiter, and a closing delimiter on its own line leaves a trailing newline. An escape such as \\n still works when a line break must be explicit, and methods such as lines() or formatted() work on the resulting String like any other text.",
      keywordNotes: ["\"\"\" starts a text block, and the content begins on the next line.", "Quotation marks inside a text block do not need escaping, unlike a single-line string literal.", "Incidental indentation is removed from every content line, and a closing delimiter on its own line adds a trailing newline.", "String.lines() splits the block into a stream of lines, and formatted(...) fills %s and %d placeholders."],
      examples: [
        example(
          "Format a report with a text block",
          "public class Report {\n    public static void main(String[] args) {\n        String report = \"\"\"\n                Lesson: %s\n                Minutes: %d\n                \"\"\".formatted(\"Loops\", 30);\n        System.out.print(report);\n    }\n}",
          "Lesson: Loops\nMinutes: 30",
          "The block keeps the two lines readable in the source, formatted fills the two placeholders, and print writes the result. A text block with the closing delimiter on its own line ends with a newline, which is why the output sits on its own lines.",
          ["Line 1: The class declaration names Report, which would live in a file named Report.java in a real project.", "Line 2: main is the entry point the runtime calls.", "Line 3: The assignment begins a text block, so everything until the closing delimiter becomes one String value.", "Line 4: The first content line holds a %s placeholder, and its leading indentation will be removed as incidental whitespace.", "Line 5: The second line holds a %d placeholder, which is filled with a whole number later.", "Line 6: The closing delimiter ends the block with a trailing newline, and formatted immediately fills %s with Loops and %d with 30.", "Line 7: print writes the finished text, and because the block already ends with a newline the console shows two lines.", "Line 8: The closing brace ends main.", "Line 9: The final brace ends the class."],
        ),
        example(
          "Keep quotes readable and count lines",
          "public class Quotes {\n    public static void main(String[] args) {\n        String message = \"\"\"\n                He said \"text blocks keep quotes readable\".\n                Line two stays on line two.\n                \"\"\";\n        System.out.print(message.lines().count());\n    }\n}",
          "2",
          "The embedded quotation marks appear exactly as written because a text block needs no escaping for them. lines() turns the block into a stream of its content lines, and count() reports the number of lines as a long value.",
          ["Line 1: The class named Quotes holds the demonstration.", "Line 2: main is the entry point.", "Line 3: A text block starts, so the following lines are content rather than separate statements.", "Line 4: This content line contains plain quotes, which is the readability benefit being demonstrated.", "Line 5: The second content line shows that the block preserves line breaks between content lines.", "Line 6: The closing delimiter on its own line ends the block and contributes a trailing newline.", "Line 7: lines() splits the text into a stream, and count() reports how many content lines it found, which is 2.", "Line 8: The closing brace ends main.", "Line 9: The final brace ends the class."],
        )
      ],
      exercise: {
        prompt: "Build a text block containing the three lines read, build, and test, then print its line count so the output is 3.",
        starterCode: "public class Plan {\n    public static void main(String[] args) {\n        // Build a text block, then count its lines\n    }\n}",
        solution: "public class Plan {\n    public static void main(String[] args) {\n        String plan = \"\"\"\n                read\n                build\n                test\n                \"\"\";\n        System.out.print(plan.lines().count());\n    }\n}",
        solutionExplanation: "The block holds three content lines, and lines().count() reports 3. The closing delimiter on its own line adds a trailing newline to the value but does not create a fourth line for count().",
        testCases: [{ label: "Line count of the plan", expected: "3" }],
        hints: ["Start the block with three double quotes and put the content on the next lines.", "Put the closing delimiter on its own line.", "Call lines().count() on the block and print the result."],
        checker: {
          mode: "patterns",
          requiredPatterns: ["\"\"\"", "String\\s+plan", "lines\\(\\)\\.count\\(\\)"],
          successMessage: "The text block contains three lines and the count is reported.",
        },
      },
      recap: ["A text block makes multi-line text readable and removes the need to escape quotes.", "Incidental indentation is stripped, and the closing delimiter decides the trailing newline.", "The resulting value is an ordinary String, so every String method still applies."],
      readingCheck: {
        prompt: "Why does a text block make JSON or SQL easier to read than a single-line literal?",
        choices: ["Because embedded quotes need no escaping and the line structure is visible in the source", "Because text blocks skip validation", "Because text blocks remove newlines", "Because a text block is not a String"],
        correctIndex: 0,
        explanation: "The block keeps the document shaped as the document, instead of forcing escaped quotes and \\n sequences into one long line.",
      },
      decisionGuide: [
        { use: "a text block for multi-line text such as JSON, SQL, or a report", insteadOf: "one long literal full of \\n and escaped quotes", reason: "The value in the source looks like the value at runtime, which makes the code reviewable and far easier to edit." },
        { use: "a normal String literal for one short piece of text", insteadOf: "a text block for a single line", reason: "A text block adds indentation rules and a trailing-newline decision that a short literal avoids entirely." },
      ],
      quality: { codeReading: true, prediction: true, debugging: true, modification: true, edgeCase: true },
    }),
    compare: authoredLesson({
      title: "Pattern matching text with regex",
      minutes: 24,
      summary: "Compare manual string checks with a compiled Pattern, and decide from the shape of the problem whether a regular expression or ordinary string code is the honest tool.",
      learningGoals: [
        "Compile a pattern once and reuse it across inputs",
        "Choose matches, find, or split from the question being asked",
        "Recognise the text problems where a regular expression is the wrong tool",
      ],
      explanation: "A regular expression describes a shape of text, and the java.util.regex package gives that description a type: Pattern is the compiled shape and Matcher is one attempt to apply it to one input. Compiling the pattern once and reusing it is the difference between describing a rule and rebuilding it on every call, which matters when the check runs in a loop or on every request. The three questions have different methods: matches asks whether the entire input fits the shape, find asks whether the shape occurs somewhere inside the input, and split uses the shape as a separator. Choosing between them is where most bugs come from, because a pattern that validates correctly can still be used with the wrong method. Regex is also easy to over-apply: nesting characters such as quoted strings, brackets, and markup have real parsers, and a pattern that nearly handles them is harder to debug than a parser call. Keep patterns small, anchor what must cover the whole input, and test each pattern against both a matching and a non-matching example. The outputs below are derived by reading the code and were cross-checked with an independent implementation of the same string semantics; no JVM compiled or ran these programs in this environment.",
      keywordNotes: [
        "Pattern.compile builds the shape once so a Matcher can apply it to each input without recompiling the rule.",
        "matcher.matches() requires the whole input to fit the pattern, while find() looks for the shape anywhere inside it.",
        "find() advances through the input, so a while loop over it reports every occurrence instead of only the first.",
        "split(Pattern) uses the shape as the separator, which is how a repeated or variable delimiter is handled without a loop.",
        "Nested formats such as HTML, JSON, and quoted strings belong to a parser rather than to a pattern, because a near-correct pattern fails on exactly the inputs that matter.",
      ],
      examples: [
        example(
          "Compile one pattern and validate two inputs",
          'import java.util.regex.Pattern;\n\npublic class Main {\n    public static void main(String[] args) {\n        Pattern code = Pattern.compile("[A-Z]{2}-[0-9][A-Z][0-9]");\n        System.out.println(code.matcher("JS-2A4").matches());\n        System.out.println(code.matcher("JS-2A4X").matches());\n    }\n}',
          "true\nfalse",
          "The pattern is compiled once and then applied to each input, and matches requires the whole string to fit the shape, so the extra trailing character fails even though a valid prefix exists.",
          [
            "Line 1: the Pattern import is required because the type is named directly in the code.",
            "Line 2: the blank line separates imports from the class declaration.",
            "Line 3: the class holds the entry point that a launcher would call.",
            "Line 4: the main method is the single method the runtime invokes.",
            "Line 5: the pattern is compiled once into a reusable object, which is the difference between stating a rule and rebuilding it per call.",
            "Line 6: matches requires the entire input to fit the shape, so the well-formed code prints true.",
            "Line 7: the extra X leaves a character outside the shape, so the whole input fails even though its prefix is valid.",
            "Line 8: the main method closes after both inputs were checked against the same compiled pattern.",
            "Line 9: the class closes, and the pattern object was never rebuilt between the two checks.",
          ],
        ),
        example(
          "Find the first occurrence inside a longer text",
          'import java.util.regex.Matcher;\nimport java.util.regex.Pattern;\n\npublic class Main {\n    public static void main(String[] args) {\n        Matcher numbers = Pattern.compile("[0-9]+").matcher("level 42 ready");\n        if (numbers.find()) {\n            System.out.println(numbers.group());\n        }\n    }\n}',
          "42",
          "find asks whether the shape appears anywhere inside the input rather than requiring the whole string to be numeric, and group returns the text that actually matched, so the surrounding words are ignored while the number is extracted.",
          [
            "Line 1: the Matcher import is needed because the variable is declared with that type.",
            "Line 2: the Pattern import supplies the compiled shape that produces the matcher.",
            "Line 3: the blank line keeps the imports readable before the type declaration.",
            "Line 4: the class holds the runnable entry point.",
            "Line 5: the main method is the method the launcher invokes.",
            "Line 6: the pattern for one or more digits is applied to a sentence, which prepares a matcher rather than testing a match.",
            "Line 7: find reports whether the shape occurs anywhere inside the input, which is a different question from matches.",
            "Line 8: group returns the text that matched, so the number is extracted without substring arithmetic.",
            "Line 9: the if block closes after the matched text was printed.",
            "Line 10: the main method closes with the matcher having done its one job.",
            "Line 11: the class closes, and the pattern remains reusable for other inputs.",
          ],
        ),
      ],
      exercise: {
        prompt: "Compile a pattern that matches a two-letter, dash, digit, letter, digit code, then print the result of matches for a valid code and for a code with a trailing character.",
        starterCode: "// Compile the rule once, then apply it to two inputs\n",
        solution: 'import java.util.regex.Pattern;\n\npublic class Main {\n    public static void main(String[] args) {\n        Pattern code = Pattern.compile("[A-Z]{2}-[0-9][A-Z][0-9]");\n        System.out.println(code.matcher("JS-2A4").matches());\n        System.out.println(code.matcher("JS-2A4X").matches());\n    }\n}',
        solutionExplanation: "The pattern is compiled once, both inputs are checked against the same rule, and matches requires the whole string to fit, so the invalid input reports false rather than being accepted for its valid prefix.",
        testCases: [{ label: "Pattern validation", expected: "true\nfalse" }],
        hints: ["Compile the pattern once before the two checks.", "Use matches when the whole input must fit the shape.", "Include an invalid input so the boundary is demonstrated."],
        checker: {
          mode: "patterns",
          requiredPatterns: ["Pattern\\.compile", "\\.matcher\\(", "\\.matches\\(\\)"],
          successMessage: "The exercise compiles one pattern and validates both a matching and a non-matching input.",
        },
      },
      recap: [
        "Pattern holds the compiled shape and Matcher applies it to one input, so the rule can be reused instead of rebuilt.",
        "matches requires the whole input, find locates an occurrence inside it, and split uses the shape as a separator.",
        "Nested formats belong to parsers; keep patterns small, anchored where needed, and tested against a matching and a non-matching input.",
      ],
      readingCheck: {
        prompt: "Why does the second check in the first example print false?",
        choices: [
          "Because matches requires the entire input to fit the pattern and the trailing X falls outside it",
          "Because the pattern was compiled for a different number of characters",
          "Because matcher can only be called once per pattern",
          "Because uppercase letters are not allowed in patterns",
        ],
        correctIndex: 0,
        explanation: "matches anchors the comparison to the whole input, so a valid prefix is not enough: the extra character means the input as a whole does not fit the shape.",
      },
      decisionGuide: [
        { use: "a compiled Pattern reused across inputs", insteadOf: "calling String.matches in a loop", reason: "The rule is compiled once and stays reusable, which keeps both the source and the runtime work smaller." },
        { use: "a parser for nested formats", insteadOf: "a regular expression that almost handles quoting or nesting", reason: "Parsers implement the whole grammar, while a pattern that nearly works fails on the inputs that matter and is hard to debug." },
      ],
      verification: ["structurally-checked"],
      quality: { codeReading: true, prediction: true, debugging: true },
    }),
  },
  5: {
    compare: authoredLesson({
      title: "Static and instance initializer blocks",
      minutes: 28,
      summary: "See when class-level and object-level setup runs, and choose an initializer only when a constructor cannot express the rule.",
      learningGoals: ["Explain when a static initializer runs", "Explain when an instance initializer runs", "Choose a constructor or field initializer instead"],
      explanation: "A static initializer runs once, when the class is first prepared for use, which is why it suits values the whole class shares. An instance initializer copies into every constructor, so it runs for each object just before the constructor body. The predictable order is: static initializers once, then field initializers and instance initializers, then the constructor body. The reason to know the order is diagnosis, not preference: explicit step-by-step setup in a constructor is usually clearer, while an initializer earns its place when several constructors must share the same preparation step.",
      keywordNotes: ["static { ... } runs once when the class is initialized, before any static method call such as main runs its body.", "{ ... } without static runs for every object, immediately before the constructor body executes.", "Field initializers run in the same pass as instance initializers, so textual order among them is the order that matters.", "Java initializes superclass state before subclass state, which keeps a partly built object from being observed."],
      examples: [
        example(
          "Watch class and object initialization order",
          "public class Init {\n    static int created;\n    static {\n        created = 1;\n        System.out.println(\"static init\");\n    }\n    {\n        System.out.println(\"instance init\");\n    }\n    Init() {\n        System.out.println(\"constructor\");\n    }\n    public static void main(String[] args) {\n        System.out.println(\"main start, created=\" + created);\n        new Init();\n        new Init();\n    }\n}",
          "static init\nmain start, created=1\ninstance init\nconstructor\ninstance init\nconstructor",
          "The static block runs once before main's body, which is why its line appears before the main message. Each new object runs the instance initializer and then the constructor, so the pair repeats once per construction.",
          ["Line 1: The class declaration names the type under discussion.", "Line 2: created is a static field, so the whole class shares one copy of it.", "Line 3: The static initializer begins; it will run once when the class is initialized.", "Line 4: The shared field is assigned before any object exists.", "Line 5: The static block prints a marker so the timing of class initialization becomes visible.", "Line 6: The block ends, and class initialization continues toward main.", "Line 7: An instance initializer begins; unlike the static block, it belongs to each object.", "Line 8: The instance marker prints for every object, showing that this block is not shared.", "Line 9: The instance initializer ends.", "Line 10: The constructor declares the type used with new.", "Line 11: The constructor body prints after the instance initializer has already run.", "Line 12: The constructor body ends.", "Line 13: main is the entry point, so the runtime initializes the class before running the body.", "Line 14: The first output line appears after the static block, and created already holds 1.", "Line 15: The first object is constructed, running the instance initializer and then the constructor.", "Line 16: The second object repeats the same pair, which proves the instance block runs per object.", "Line 17: The closing brace ends main.", "Line 18: The final brace ends the class."],
        ),
        example(
          "Apply a per-object rule in an initializer",
          "public class Flags {\n    boolean ready;\n    {\n        ready = true;\n        System.out.println(\"instance block sets ready=\" + ready);\n    }\n    public static void main(String[] args) {\n        Flags first = new Flags();\n        Flags second = new Flags();\n        System.out.println(\"first=\" + first.ready + \" second=\" + second.ready);\n    }\n}",
          "instance block sets ready=true\ninstance block sets ready=true\nfirst=true second=true",
          "The field starts false for each new object, then the instance initializer sets it before anyone can observe the object. Both objects therefore report true, and the initializer ran twice.",
          ["Line 1: The class declaration names the type.", "Line 2: ready is an instance field, so each object owns its own copy with the default value false.", "Line 3: The instance initializer begins.", "Line 4: The rule that every object should start ready is applied here.", "Line 5: The marker prints the resulting value for the object being built.", "Line 6: The instance initializer ends.", "Line 7: main is the entry point.", "Line 8: The first object is created, so the initializer runs once.", "Line 9: The second object is created, so the initializer runs again for that separate object.", "Line 10: Reading both fields prints true for each, which shows the rule was applied per object.", "Line 11: The closing brace ends main.", "Line 12: The final brace ends the class."],
        )
      ],
      exercise: {
        prompt: "Write a class with a static int counter and an instance initializer that adds 1 to it. Create two objects in main and print counter so the output is 2.",
        starterCode: "public class Tally {\n    // Add a static counter and an instance initializer\n\n    public static void main(String[] args) {\n        new Tally();\n        new Tally();\n        System.out.print(Tally.counter);\n    }\n}",
        solution: "public class Tally {\n    static int counter;\n    {\n        counter = counter + 1;\n    }\n    public static void main(String[] args) {\n        new Tally();\n        new Tally();\n        System.out.print(Tally.counter);\n    }\n}",
        solutionExplanation: "The static field is shared by the class, and the instance initializer increments it once per construction. Two objects therefore raise the shared counter to 2.",
        testCases: [{ label: "Objects counted", expected: "2" }],
        hints: ["Declare the shared field as static int counter;.", "Add an instance initializer block without the static keyword.", "Increment the shared counter inside the block."],
        checker: {
          mode: "patterns",
          requiredPatterns: ["static\\s+int\\s+counter", "\\{\\s*$|\\{", "counter\\s*(=\\s*counter\\s*\\+\\s*1|\\+\\+)"],
          successMessage: "The static field and the instance initializer cooperate to count constructions.",
        },
      },
      recap: ["A static initializer runs once when the class is initialized; an instance initializer runs for every object.", "Instance initializers run before the constructor body, in textual order with field initializers.", "Explicit constructor steps are usually clearer; initializers are for setup shared by several constructors."],
      readingCheck: {
        prompt: "Which runs first for a new object: the instance initializer or the constructor body?",
        choices: ["The instance initializer, because it is copied into the start of every constructor", "The constructor body, because it is written later in the file", "They run in a random order", "Neither runs unless it is static"],
        correctIndex: 0,
        explanation: "Instance initializers are compiled into the beginning of each constructor, which is why their output appears before the constructor body prints.",
      },
      decisionGuide: [
        { use: "a constructor for required setup", insteadOf: "an instance initializer that hides where setup happens", reason: "A reader of the constructor sees the whole initialization story in one place, which is what makes object state easy to reason about." },
        { use: "a static initializer for genuinely shared one-time setup", insteadOf: "lazy checks scattered through instance methods", reason: "The class-level rule is stated once, at class initialization, instead of being re-tested on every call." },
      ],
      quality: { codeReading: true, prediction: true, debugging: true, modification: true, edgeCase: true },
    }),
  },
  9: {
    predict: authoredLesson({
      title: "Default interface methods and evolution",
      minutes: 28,
      summary: "Add behavior to an interface without breaking existing implementations, and predict which method a call resolves to.",
      learningGoals: ["Declare a default method on an interface", "Override a default method in one implementation", "Explain why a default method keeps existing implementers compiling"],
      explanation: "An interface describes behavior that callers can rely on. Adding a new abstract method would break every existing implementation, because each class would suddenly be missing a method, so Java lets an interface provide a default implementation instead. Implementations inherit that default, and any class that needs different behavior simply overrides it. Resolution follows the class first, then the interface default, which is why an override always wins. Default methods are for compatible evolution of a published interface, not for hiding shared state: interfaces still cannot hold instance fields.",
      keywordNotes: ["default String label() { ... } gives every implementer a usable method body from the day it is added.", "A class that overrides the default replaces it; resolution prefers the class implementation over the interface default.", "Interfaces cannot declare instance fields, so a default method can only work with method calls and constants.", "Adding a default method keeps existing implementations compiling, which is why library authors choose it during interface evolution."],
      examples: [
        example(
          "Inherit a default implementation",
          "interface Task {\n    String title();\n    default String label() {\n        return \"Task: \" + title();\n    }\n}\nclass Study implements Task {\n    public String title() {\n        return \"Loops\";\n    }\n}\npublic class Demo {\n    public static void main(String[] args) {\n        Task task = new Study();\n        System.out.println(task.label());\n    }\n}",
          "Task: Loops",
          "Study implements only the abstract title() method and inherits label() from the interface. The call on the Task reference therefore prints the default text built from the implementation's title.",
          ["Line 1: The interface begins, describing behavior without naming a concrete class.", "Line 2: title() stays abstract because each implementer must supply its own title.", "Line 3: label() is a default method, so it already has a body the interface can share.", "Line 4: The default body builds a label from the abstract method, which every implementer provides.", "Line 5: The default method body ends.", "Line 6: The interface definition ends.", "Line 7: Study declares that it implements the Task contract.", "Line 8: The class supplies the required abstract method.", "Line 9: The implementation returns a fixed title for this example.", "Line 10: The method body ends.", "Line 11: The class ends, and note that label() never had to be written here.", "Line 12: The public class holds main, so at most one public top-level type appears in the file.", "Line 13: main is the entry point.", "Line 14: The variable is typed as Task, so the code depends on the contract rather than the concrete class.", "Line 15: Calling the inherited default is legal because Study is a Task, and the printed result comes from the shared body.", "Line 16: The closing brace ends main.", "Line 17: The final brace ends the class."],
        ),
        example(
          "Override a default in one implementation",
          "interface Greeter {\n    default String hello() {\n        return \"hello\";\n    }\n}\nclass Loud implements Greeter {\n    @Override\n    public String hello() {\n        return \"HELLO\";\n    }\n}\npublic class Demo2 {\n    public static void main(String[] args) {\n        Greeter plain = new Greeter() { };\n        Greeter loud = new Loud();\n        System.out.println(plain.hello() + \" \" + loud.hello());\n    }\n}",
          "hello HELLO",
          "The anonymous implementation keeps the inherited default, while Loud overrides it. The same call on the same interface type produces different text, which is the resolution rule in action.",
          ["Line 1: The interface declares one behavior with a default body.", "Line 2: The default method begins.", "Line 3: The default returns a quiet greeting.", "Line 4: The default body ends.", "Line 5: The interface ends.", "Line 6: Loud declares that it implements Greeter and intends to change the greeting.", "Line 7: The override annotation documents that a supertype method is being replaced.", "Line 8: The overriding method must be public because interface methods are public.", "Line 9: The class supplies its own louder behavior instead of the default.", "Line 10: The method body ends.", "Line 11: The class ends.", "Line 12: The public class holds the entry point.", "Line 13: main begins.", "Line 14: An anonymous implementation is created, and it inherits hello() unchanged because it defines nothing.", "Line 15: Loud is assigned to the same interface type, so both variables are used through the contract.", "Line 16: The first call resolves to the default and the second to the override, printing hello HELLO.", "Line 17: The closing brace ends main.", "Line 18: The final brace ends the class."],
        )
      ],
      exercise: {
        prompt: "Define interface Named with an abstract name() method and a default greeting() returning \"Hi \" + name(). Implement Named in class Person returning \"Ada\". Print person.greeting() so the output is Hi Ada.",
        starterCode: "interface Named {\n    String name();\n    // Add a default greeting method\n}\n\nclass Person implements Named {\n    // Supply name()\n}\n\npublic class People {\n    public static void main(String[] args) {\n        System.out.print(new Person().greeting());\n    }\n}",
        solution: "interface Named {\n    String name();\n    default String greeting() {\n        return \"Hi \" + name();\n    }\n}\nclass Person implements Named {\n    public String name() {\n        return \"Ada\";\n    }\n}\npublic class People {\n    public static void main(String[] args) {\n        System.out.print(new Person().greeting());\n    }\n}",
        solutionExplanation: "Person supplies only the abstract name() method, and the interface default builds the greeting from it. The printed result shows the inherited behavior working through the implementation.",
        testCases: [{ label: "Inherited greeting", expected: "Hi Ada" }],
        hints: ["Declare the default method with the default keyword.", "Return \"Hi \" + name() from the default method.", "Implement only name() in Person."],
        checker: {
          mode: "patterns",
          requiredPatterns: ["default\\s+String\\s+greeting", "implements\\s+Named", "name\\(\\)\\s*\\{"],
          successMessage: "The interface provides behavior while the class supplies the one required method.",
        },
      },
      recap: ["A default method lets an interface gain behavior without breaking existing implementations.", "Resolution prefers the class implementation, so an override always wins over the interface default.", "Interfaces still cannot hold instance state, so defaults stay stateless and express shared behavior."],
      readingCheck: {
        prompt: "Why would a library author add a default method instead of a new abstract method?",
        choices: ["Because every existing implementation keeps compiling while the interface gains new behavior", "Because abstract methods are deprecated", "Because default methods can store state", "Because interfaces cannot be implemented twice"],
        correctIndex: 0,
        explanation: "A new abstract method breaks all implementers at once, while a default method gives them a working behavior immediately and can still be overridden.",
      },
      decisionGuide: [
        { use: "a default method when evolving a published interface", insteadOf: "adding a new abstract method that breaks every implementer", reason: "Existing classes keep compiling and inherit sensible behavior, which is what makes interface evolution possible in a library." },
        { use: "an abstract method for behavior every implementation must decide", insteadOf: "a default that guesses at the right answer", reason: "If no reasonable shared behavior exists, an abstract method forces the decision instead of hiding it behind a default." },
      ],
      quality: { codeReading: true, prediction: true, debugging: true, modification: true, edgeCase: true },
    }),
  },
  13: {
    read: authoredLesson({
      title: "Anonymous classes for one-off implementations",
      minutes: 26,
      summary: "Create a single-use implementation of an interface inline, read what the compiler generates, and know when a lambda is the better tool.",
      learningGoals: ["Write an anonymous implementation of an interface", "Capture an effectively final local value", "Choose a lambda or a named class instead"],
      explanation: "An anonymous class is a class body written at the point of use, combined with the constructor call that creates it. It is the traditional way to supply a one-off implementation of an interface or to extend a class without naming a subtype, and it can add fields and extra methods, which a lambda cannot. Because the class has no name, its enclosing class is the surrounding type, and the compiler records that link, which is visible through getEnclosingClass(). Anonymous classes capture local variables only when those variables are effectively final, because the closure copies the value. A lambda is shorter when the implementation is a single method call, so choose the anonymous class when several methods or its own fields are involved.",
      keywordNotes: ["new Comparator<String>() { ... } creates an unnamed implementation of a named type at the point of use.", "Local variables used inside the body must be effectively final, because the closure keeps a copy of the value.", "An anonymous class may declare its own fields and additional methods, which a lambda cannot do.", "getEnclosingClass() reports the surrounding type, which proves the anonymous class belongs to that class."],
      examples: [
        example(
          "Sort with an anonymous comparator",
          "import java.util.ArrayList;\nimport java.util.Comparator;\nimport java.util.List;\npublic class Sorter {\n    public static void main(String[] args) {\n        List<String> sorted = new ArrayList<>(List.of(\"ada\", \"cyd\", \"bob\"));\n        sorted.sort(new Comparator<String>() {\n            @Override\n            public int compare(String left, String right) {\n                return left.compareTo(right);\n            }\n        });\n        System.out.println(sorted);\n    }\n}",
          "[ada, bob, cyd]",
          "The sorting rule is supplied as an anonymous Comparator created where sort is called. The list is printed after sorting, so the output shows the rule actually applied to the elements.",
          ["Line 1: ArrayList is imported because List.of produces an immutable list that cannot be sorted in place.", "Line 2: Comparator is imported because the anonymous class implements it.", "Line 3: List is imported for the reference type.", "Line 4: The public class holds main.", "Line 5: main begins.", "Line 6: A mutable copy is built from the three names, which becomes the list that will be sorted.", "Line 7: sort receives an anonymous Comparator created inline rather than a separately named class.", "Line 8: The override annotation documents that the interface method is being implemented here.", "Line 9: compare returns a negative, zero, or positive value to express ordering between two elements.", "Line 10: compareTo supplies that ordering using the natural order of String.", "Line 11: The compare method body ends.", "Line 12: The anonymous class body ends, so exactly one object of that unnamed type exists.", "Line 13: The list prints in its new order, which shows the anonymous rule took effect.", "Line 14: The closing brace ends main.", "Line 15: The final brace ends the class."],
        ),
        example(
          "Capture a local and find the enclosing class",
          "public class Runner {\n    public static void main(String[] args) {\n        String label = \"ready\";\n        Runnable task = new Runnable() {\n            @Override\n            public void run() {\n                System.out.println(\"task: \" + label);\n            }\n        };\n        task.run();\n        System.out.println(task.getClass().getEnclosingClass() != null);\n    }\n}",
          "task: ready\ntrue",
          "The anonymous implementation reads the effectively final local variable label. The second line asks whether the unnamed class knows its surrounding class, and the answer is true because the compiler links it to Runner.",
          ["Line 1: The class named Runner holds the example.", "Line 2: main begins.", "Line 3: label is a local variable that will be captured by the anonymous class.", "Line 4: An anonymous Runnable is created as the value of task.", "Line 5: The override annotation marks the interface method being implemented.", "Line 6: run is the single abstract method of Runnable.", "Line 7: The body reads the captured local, which is legal because label is never reassigned and is therefore effectively final.", "Line 8: The run method body ends.", "Line 9: The anonymous class body ends.", "Line 10: run is invoked directly, which prints the captured greeting.", "Line 11: getEnclosingClass() returns the type that contains the anonymous class, and the comparison prints true because Runner is that type.", "Line 12: The closing brace ends main.", "Line 13: The final brace ends the class."],
        )
      ],
      exercise: {
        prompt: "Create an anonymous Runnable whose run() prints \"run once\", call it, and print nothing else, so the output is run once.",
        starterCode: "public class Once {\n    public static void main(String[] args) {\n        // Create the anonymous Runnable and call it\n    }\n}",
        solution: "public class Once {\n    public static void main(String[] args) {\n        Runnable task = new Runnable() {\n            @Override\n            public void run() {\n                System.out.println(\"run once\");\n            }\n        };\n        task.run();\n    }\n}",
        solutionExplanation: "The interface is implemented inline, so no separate class name is needed for behavior used exactly once. Calling run() executes the body and prints the single line.",
        testCases: [{ label: "Anonymous run", expected: "run once" }],
        hints: ["Start with new Runnable() { .", "Implement public void run() inside the body.", "Close the body with }; and call task.run()."],
        checker: {
          mode: "patterns",
          requiredPatterns: ["new\\s+Runnable\\s*\\(\\)\\s*\\{", "@Override", "void\\s+run\\(\\)"],
          successMessage: "The interface is implemented once, inline, and invoked.",
        },
      },
      recap: ["An anonymous class supplies a one-off implementation written at the point of use.", "The surrounding class is recorded, and locals must be effectively final to be captured.", "Prefer a lambda for a single-method implementation, and a named class when the type has a real identity."],
      readingCheck: {
        prompt: "Why must a captured local variable be effectively final?",
        choices: ["Because the anonymous class copies the value, so a later change would not be visible inside the body", "Because Java forbids local variables in classes", "Because getEnclosingClass requires it", "Because interfaces cannot reference variables"],
        correctIndex: 0,
        explanation: "The closure captures a copy, so allowing later reassignment would create a misleading difference between the variable and the captured value.",
      },
      decisionGuide: [
        { use: "an anonymous class when the implementation needs several methods or its own fields", insteadOf: "a lambda that cannot express either", reason: "A lambda can only implement a single abstract method, while an anonymous class may declare fields and additional methods." },
        { use: "a named class when the implementation has a real identity", insteadOf: "an anonymous class reused in several places", reason: "A name lets the type be tested, reused, and referenced in error messages, which an unnamed class cannot offer." },
      ],
      quality: { codeReading: true, prediction: true, debugging: true, modification: true, edgeCase: true },
    }),
  },
  15: {
    read: authoredLesson({
      title: "Building text incrementally with StringBuilder",
      minutes: 20,
      summary: "Read a builder as one mutable text object that grows through append calls, and know when repeated string concatenation is the wrong shape.",
      learningGoals: [
        "Read a chain of append calls and predict the final text",
        "Explain why a builder is preferable to concatenation inside a loop",
        "Materialize the finished text once with toString at the boundary",
      ],
      explanation: "A String is immutable, so every concatenation creates another object and copies the text so far. Outside a loop that cost is invisible and concatenation is the clearer choice, but inside a loop it turns a linear job into repeated copying. StringBuilder is the mutable counterpart: it holds a growable buffer, each append writes to the same object, and toString produces the finished text once when the value leaves the method. Reading a builder means tracking one object rather than following a chain of new strings, which is why the append order in the source is the order of the characters in the result. The builder is also the right home for a loop that assembles a report, a query, or a delimited list, because the intermediate states never need to exist as separate strings. The boundary to keep honest is that a builder is not thread safe, so it stays inside one method or thread; when several threads share the assembly, the choice is a different type or a different design rather than a shared builder.",
      keywordNotes: [
        "StringBuilder holds a mutable buffer, so append changes the same object instead of creating a new String each time.",
        "append returns the builder, which is why calls can be chained and why the returned value is the same object.",
        "toString materializes the finished text once, at the point where the value leaves the method.",
        "Concatenation with + is clear for a fixed number of parts, but it copies the accumulated text on every step inside a loop.",
        "A builder is not thread safe, so keep it inside one method or thread instead of sharing it as mutable state.",
      ],
      examples: [
        example(
          "Chain append calls and materialize once",
          'public class Main {\n    public static void main(String[] args) {\n        StringBuilder report = new StringBuilder();\n        report.append("lesson=").append("loops").append(", ok=").append(true);\n        System.out.println(report.length());\n        System.out.println(report);\n    }\n}',
          "21\nlesson=loops, ok=true",
          "All four appends write to the same buffer in source order, so the length already reflects the assembled text and printing the builder shows the completed value without any extra conversion step.",
          [
            "Line 1: the class holds the entry point that a launcher would call.",
            "Line 2: the main method is the single method the runtime invokes.",
            "Line 3: the builder is created empty, which is the starting state the appends will grow.",
            "Line 4: the chained calls append four parts in order, and each one returns the same builder so the chain reads left to right.",
            "Line 5: length reports the number of characters already in the buffer, which proves nothing was discarded between appends.",
            "Line 6: printing the builder uses its text directly, so the finished value is observed exactly once.",
            "Line 7: the main method closes with one builder object having produced the whole line.",
            "Line 8: the class closes, and no intermediate String was needed to assemble the report.",
          ],
        ),
        example(
          "Append inside a loop",
          'public class Main {\n    public static void main(String[] args) {\n        StringBuilder text = new StringBuilder();\n        for (int value : new int[] {1, 2, 3}) {\n            text.append(value).append(\'-\');\n        }\n        System.out.println(text.toString());\n    }\n}',
          "1-2-3-",
          "Each iteration writes the number and the separator into the same buffer, so the loop does linear work instead of creating a new string for every step, and the final toString produces the delimited text once.",
          [
            "Line 1: the class declares the runnable entry point.",
            "Line 2: the main method is the method the launcher calls.",
            "Line 3: the builder starts empty so the loop can fill it in order.",
            "Line 4: the loop walks the array literal directly, which keeps the example to a single iteration variable.",
            "Line 5: the two appends write the current number and then the separator into the same buffer on every pass.",
            "Line 6: the loop closes after the last value has been appended with its separator.",
            "Line 7: toString materializes the buffer once, at the boundary where the text is handed to the printing method.",
            "Line 8: the main method closes after the assembled text was printed.",
            "Line 9: the class closes, with the loop having reused one object instead of building a new string per iteration.",
          ],
        ),
      ],
      exercise: {
        prompt: "Create a StringBuilder, append a label and a count in one chained statement, and print the assembled text.",
        starterCode: "// Grow one buffer, then materialize it once\n",
        solution: 'public class Main {\n    public static void main(String[] args) {\n        StringBuilder report = new StringBuilder();\n        report.append("lesson=").append("loops").append(", ok=").append(true);\n        System.out.println(report.toString());\n    }\n}',
        solutionExplanation: "The chained appends write the parts into one buffer in source order, and toString materializes the finished text once so the printed value is the assembled line rather than an intermediate state.",
        testCases: [{ label: "Assembled text", expected: "lesson=loops, ok=true" }],
        hints: ["Create the builder before the first append.", "Chain the appends so the order in the source is the order in the text.", "Convert to a String once, at the point of use."],
        checker: {
          mode: "patterns",
          requiredPatterns: ["new\\s+StringBuilder", "\\.append\\(", "toString\\(\\)"],
          successMessage: "The exercise assembles text in one builder and materializes it once.",
        },
      },
      recap: [
        "StringBuilder holds one mutable buffer, so appends write in order instead of creating a new string per step.",
        "Concatenation is clear for a fixed number of parts; a builder is the right shape for a loop that assembles text.",
        "toString materializes the finished value once, and the builder stays inside one method because it is not thread safe.",
      ],
      readingCheck: {
        prompt: "Why is a builder preferred over concatenation inside a loop?",
        choices: [
          "Because concatenation creates a new immutable String and copies the accumulated text on every iteration",
          "Because StringBuilder can store any type without conversion",
          "Because concatenation is not allowed inside loops",
          "Because a builder sorts the appended parts automatically",
        ],
        correctIndex: 0,
        explanation: "Each concatenation produces another immutable String, so repeated copying grows with the loop; a builder appends into one buffer and converts once at the end.",
      },
      decisionGuide: [
        { use: "a StringBuilder for text assembled by repetition", insteadOf: "concatenating inside a loop", reason: "The builder does the work once per part instead of copying the accumulated text on every step." },
        { use: "plain concatenation for a fixed handful of parts", insteadOf: "a builder everywhere out of habit", reason: "For a small fixed expression, concatenation is shorter and easier to read, and the copying cost never becomes visible." },
      ],
      verification: ["structurally-checked"],
      quality: { codeReading: true, prediction: true },
    }),
  },
  17: {
    compare: authoredLesson({
      title: "java.time instead of legacy dates",
      minutes: 24,
      summary: "Compare java.time with the legacy Date and Calendar classes, and read the difference between an instant in time, a local date, and a formatted string.",
      learningGoals: [
        "Model a moment with Instant and a calendar date with LocalDate",
        "Format with an explicit pattern and know why uuuu differs from yyyy",
        "Explain why the newer API separates values, calendars, and text",
      ],
      explanation: "A timestamp in an API payload, a date on an invoice, and the text a person reads are three different things, and java.time gives each its own type. Instant is a point on the timeline with no calendar attached, which is what a server or a log should store. LocalDate is a date in a calendar without a time or a zone, which is what a due date or a birthday actually means. Formatting is a separate step with its own object: DateTimeFormatter describes the text layout, and the pattern letters carry meaning, so uuuu is the proleptic year while yyyy is the year of an era, and misunderstanding that distinction produces the wrong year in edge cases. The legacy Date and Calendar classes mixed those responsibilities together: a Date was a millisecond count with no time zone awareness of its own, Calendar carried mutable state and month numbering that started at zero, and both were easy to use incorrectly. java.time also made the values immutable, so passing a date to a method cannot let that method change it behind the caller's back. The rule to keep is simple: store and exchange instants, model calendar facts as local types, and convert to text only when something is displayed. The outputs below are derived by reading the code and were cross-checked with an independent implementation of the same calendar and string semantics; no JVM compiled or ran these programs in this environment.",
      keywordNotes: [
        "Instant is a point on the timeline, which is the honest type for storing or transmitting a moment.",
        "LocalDate is a calendar date without a time or zone, which is what a due date or birthday actually represents.",
        "DateTimeFormatter holds the text layout, and the pattern letters decide how each field is rendered.",
        "uuuu means the proleptic year while yyyy means year of era, which is one of the classic java.time formatting mistakes.",
        "java.time values are immutable, unlike the mutable Calendar and the ambiguous millisecond-only Date of the legacy API.",
      ],
      examples: [
        example(
          "An instant is a point on the timeline",
          'import java.time.Instant;\n\npublic class Main {\n    public static void main(String[] args) {\n        Instant started = Instant.parse("2026-10-06T09:30:00Z");\n        System.out.println(started.getEpochSecond());\n    }\n}',
          "1791279000",
          "The ISO text is parsed into an Instant, which is a fixed point on the timeline with no calendar or zone attached, and the epoch second is a stable numeric form of that same moment.",
          [
            "Line 1: the Instant import names the type used for a moment in time.",
            "Line 2: the blank line separates imports from the class declaration.",
            "Line 3: the class holds the entry point the launcher calls.",
            "Line 4: the main method is the single method the runtime invokes.",
            "Line 5: the ISO-8601 text is parsed into an Instant, and the trailing Z states that the moment is in UTC.",
            "Line 6: the epoch second expresses that instant as a number that does not depend on any calendar or display format.",
            "Line 7: the main method closes with the moment captured as a value rather than as text.",
            "Line 8: the class closes, and nothing in the program needed a mutable calendar object.",
          ],
        ),
        example(
          "Format a local date with an explicit pattern",
          'import java.time.LocalDate;\nimport java.time.format.DateTimeFormatter;\n\npublic class Main {\n    public static void main(String[] args) {\n        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd MMM uuuu");\n        System.out.println(LocalDate.of(2026, 10, 6).format(formatter));\n    }\n}',
          "06 Oct 2026",
          "The LocalDate models the calendar fact and the formatter holds the text layout, so the displayed string comes from one pattern that can be reviewed, changed, or localized without touching the date value itself.",
          [
            "Line 1: the LocalDate import names the calendar type that carries no time or zone.",
            "Line 2: the formatter import supplies the object that describes the text layout.",
            "Line 3: the blank line separates imports from the type declaration.",
            "Line 4: the class declares the runnable entry point.",
            "Line 5: the main method is the method the launcher calls.",
            "Line 6: the pattern is built once with day, abbreviated month, and proleptic year fields, which is the layout the output follows.",
            "Line 7: the date value is formatted at the moment of display, so text and value stay separate concerns.",
            "Line 8: the main method closes after one date value produced one string.",
            "Line 9: the class closes, and the immutable date was never modified by the formatting step.",
          ],
        ),
      ],
      exercise: {
        prompt: "Parse the ISO instant 2026-10-06T09:30:00Z into an Instant and print its epoch second, then format LocalDate.of(2026, 10, 6) with the pattern dd MMM uuuu.",
        starterCode: "// Keep the value and its text layout separate\n",
        solution: 'import java.time.Instant;\nimport java.time.LocalDate;\nimport java.time.format.DateTimeFormatter;\n\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println(Instant.parse("2026-10-06T09:30:00Z").getEpochSecond());\n        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd MMM uuuu");\n        System.out.println(LocalDate.of(2026, 10, 6).format(formatter));\n    }\n}',
        solutionExplanation: "The instant is stored as a point on the timeline and read back as a stable number, while the local date is formatted through a pattern object, so no legacy calendar type and no string arithmetic is involved.",
        testCases: [{ label: "Time values", expected: "1791279000\n06 Oct 2026" }],
        hints: ["Parse the ISO text with Instant.parse.", "Read the numeric form with getEpochSecond.", "Keep the display pattern in a formatter object rather than in the date value."],
        checker: {
          mode: "patterns",
          requiredPatterns: ["Instant\\.parse", "getEpochSecond", "DateTimeFormatter", "uuuu"],
          successMessage: "The exercise separates the instant, the calendar date, and the formatted text.",
        },
      },
      recap: [
        "Instant models a moment, LocalDate models a calendar fact, and DateTimeFormatter models the text layout.",
        "uuuu is the proleptic year and yyyy is the year of an era, which is why the pattern letters deserve a deliberate choice.",
        "Immutable values replaced the ambiguous millisecond Date and the mutable Calendar, so a value cannot be changed behind the caller's back.",
      ],
      readingCheck: {
        prompt: "Why does the formatter use uuuu rather than yyyy in these examples?",
        choices: [
          "Because uuuu is the proleptic year, while yyyy is the year of an era and behaves differently around era boundaries",
          "Because yyyy only works with the legacy Date class",
          "Because uuuu is required for ISO-8601 parsing",
          "Because uuuu formats the month name instead of the year",
        ],
        correctIndex: 0,
        explanation: "The two letters describe different concepts: uuuu is the year on the proleptic timeline, and yyyy is the year within an era, which is why the distinction matters at era boundaries.",
      },
      decisionGuide: [
        { use: "Instant for a moment that is stored or transmitted", insteadOf: "a formatted date string in a payload", reason: "A moment has one meaning on the timeline, while a formatted string depends on a zone, a locale, and a pattern that the reader may not share." },
        { use: "LocalDate for a calendar fact such as a due date", insteadOf: "an Instant that is converted for display", reason: "A due date is not a moment; modelling it as a local date avoids time-zone shifts changing which day the user sees." },
      ],
      verification: ["structurally-checked"],
      quality: { codeReading: true, edgeCase: true },
    }),
  },
  21: {
    integration: authoredLesson({
      title: "Packages and modules as build boundaries",
      minutes: 26,
      summary: "Describe what a module requires and exports, and see why a module descriptor is compiled rather than executed.",
      learningGoals: ["Read a module descriptor", "State what requires and exports control", "Explain why this artifact produces no console output"],
      explanation: "A package groups related types under a name, and a module groups packages behind an explicit boundary. The module descriptor, written in module-info.java, names what the module needs with requires and what it offers to others with exports. Those declarations are checked when the code is compiled and when the module is placed on the module path, which is why a descriptor produces no console output of its own: it is build input, not a program. The payoff is enforced encapsulation, since a package that is not exported stays unreachable to other modules even if it is public, and the compiler can report the dependency mistake instead of failing at runtime.",
      keywordNotes: ["module codeforge.store { ... } declares the module name, which should match the directory convention used by the build.", "requires java.sql; records a dependency on another module, and a missing module becomes a build error rather than a runtime surprise.", "exports codeforge.store.api; makes exactly that package visible to other modules while everything else stays internal.", "A descriptor is compiled and checked on the module path, so running it is not meaningful and no console output is expected."],
      examples: [
        example(
          "Declare one dependency and one export",
          "module codeforge.store {\n    requires java.sql;\n    exports codeforge.store.api;\n}",
          "No console output: a module descriptor is compiled on the module path, not executed.",
          "The descriptor states one dependency and one exported package. A build tool or javac checks those declarations when the module is compiled and placed on the module path, so the file has no main method and prints nothing.",
          ["Line 1: The module declaration names the module and opens its descriptor body.", "Line 2: requires records the dependency on the standard java.sql module, which the build must resolve.", "Line 3: exports makes one package visible outside the module while the remaining packages stay internal.", "Line 4: The descriptor ends, and the compiler uses it as build input rather than as a runnable program."],
        ),
        example(
          "Pass a dependency through with requires transitive",
          "module codeforge.report {\n    requires transitive codeforge.store;\n    exports codeforge.report.api;\n    opens codeforge.report.model to codeforge.framework;\n}",
          "No console output: a module descriptor is compiled on the module path, not executed.",
          "requires transitive passes a dependency on to modules that depend on this one, exports publishes one package, and opens grants reflective access to a named module only. All three are compile-time and link-time decisions rather than runtime behavior.",
          ["Line 1: The module descriptor names the reporting module.", "Line 2: requires transitive means any module depending on this one also reads the store module, which keeps the dependency visible instead of hidden.", "Line 3: One package is exported as the public API of the module.", "Line 4: opens grants reflective access to one package for a specific module only, such as a framework that inspects the model types.", "Line 5: The descriptor ends, so the build has a complete statement of dependencies and visible packages."],
        )
      ],
      exercise: {
        prompt: "Write a module descriptor for module codeforge.tasks that requires java.logging and exports the package codeforge.tasks.api.",
        starterCode: "// Describe the module boundary\nmodule codeforge.tasks {\n\n}",
        solution: "module codeforge.tasks {\n    requires java.logging;\n    exports codeforge.tasks.api;\n}",
        solutionExplanation: "requires names the dependency the build must resolve, and exports publishes exactly one package. The descriptor is build input, so the expected result is the compiler check rather than printed output.",
        testCases: [{ label: "Module boundary declared", expected: "No console output: a module descriptor is compiled on the module path, not executed." }],
        hints: ["Start the file with module <name> { .", "Add a requires line naming java.logging.", "Add an exports line naming the api package."],
        checker: {
          mode: "patterns",
          requiredPatterns: ["module\\s+codeforge\\.tasks", "requires\\s+java\\.logging", "exports\\s+codeforge\\.tasks\\.api"],
          successMessage: "The descriptor declares exactly one dependency and one exported package.",
        },
      },
      recap: ["Packages group types; modules group packages behind an explicit boundary of requires and exports.", "The descriptor is compiled and linked on the module path, so it is build input rather than a program.", "Unexported packages stay unreachable even when their types are public, which is the encapsulation payoff."],
      readingCheck: {
        prompt: "What does exports actually control?",
        choices: ["Which packages other modules are allowed to read, even if those packages are public", "Which classes get a main method", "Whether the module can use threads", "The order in which packages compile"],
        correctIndex: 0,
        explanation: "Without an exported package, a public type is still unreachable from another module, which is how the boundary is enforced.",
      },
      decisionGuide: [
        { use: "an explicit module descriptor for a shared library or large application", insteadOf: "relying on the classpath and naming conventions alone", reason: "Dependencies and visible packages become checkable facts, so missing or leaked dependencies are caught as build errors." },
        { use: "the classpath for a small single-purpose utility", insteadOf: "a module descriptor on every artifact", reason: "A descriptor adds a build boundary that must be maintained, which is not worth it when nothing else depends on the code." },
      ],
      quality: { codeReading: true, prediction: true, debugging: true, modification: true, edgeCase: true },
    }),
  },
};
