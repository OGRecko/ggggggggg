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
