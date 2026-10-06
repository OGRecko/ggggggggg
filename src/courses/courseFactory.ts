import type { Chapter, ChapterTest, Course, Example, Exercise, LanguageId, Lesson, LessonKind, LessonQuality, ProjectExercise, VerificationKind } from "../data/types";
import { verifiedModifiedOutputs } from "./modifiedOutputs";

export type DeepDive = {
  chapter: number;
  title: string;
  summary: string;
  explanation: string;
  keywords: string[];
  code: string;
  output: string;
  edgeCode: string;
  edgeOutput: string;
  prompt: string;
  starterCode: string;
  solution: string;
  expected: string;
  required: string[];
  hints: string[];
  choices: NonNullable<Lesson["decisionGuide"]>;
  reading: NonNullable<Lesson["readingCheck"]>;
};

export type CourseProjectPlan = {
  title: string;
  brief: string;
  scenario: string;
  constraints?: string[];
  starterState?: string[];
  requirements: string[];
  milestones: string[];
  acceptanceCriteria: string[];
  edgeCases: string[];
  checks?: string[];
  extensionTasks: string[];
  rubric: string[];
  prompt: string;
  starterCode?: string;
  solution?: string;
  solutionExplanation?: string;
  testCases?: Exercise["testCases"];
  hints?: string[];
  requiredPatterns?: string[];
  checkerMode?: NonNullable<Exercise["checker"]>["mode"];
};

export type AuthoredLessonDraft = {
  title?: string;
  minutes?: number;
  summary?: string;
  learningGoals?: string[];
  explanation?: string;
  keywordNotes?: string[];
  examples?: Example[];
  exercise?: Exercise;
  recap?: string[];
  decisionGuide?: Lesson["decisionGuide"];
  readingCheck?: Lesson["readingCheck"];
  verification?: VerificationKind[];
  quality?: Partial<Omit<LessonQuality, "authoredDepth" | "coveredConcepts" | "prerequisiteChapters" | "notes">>;
  authoredDepth?: Exclude<LessonQuality["authoredDepth"], "scaffolded">;
};

export type ChapterPlan = {
  title: string;
  focus: string;
  concepts: string[];
  terminology?: string[];
  lessonKinds?: LessonKind[];
  prerequisiteChapters?: number[];
  major?: boolean;
  qualitySummary?: string[];
  authoredLessons?: Partial<Record<LessonKind, AuthoredLessonDraft>>;
  project: CourseProjectPlan;
  test: ChapterTest[];
};

type CourseDefinition = {
  id: Exclude<LanguageId, "python">;
  name: string;
  version: string;
  accent: string;
  icon: string;
  description: string;
  titles: string[];
  chapterPlans: ChapterPlan[];
  deepDives?: DeepDive[];
  cumulativeTests?: Partial<Record<number, readonly ChapterTest[]>>;
};

type Sample = {
  title: string;
  code: string;
  output: string;
  focus: string;
  required: string[];
  hints: string[];
  runtime: boolean;
};

/**
 * The expected output of this sample's extended variation (modifiedCode below). The values live in
 * modifiedOutputs.ts because they were produced by executing the variation where this project can
 * (g++ for C++, the local worker/Node for JavaScript) or derived by hand where it cannot (Java),
 * rather than annotated with a guessed suffix.
 */
function modifiedOutputFor(language: Exclude<LanguageId, "python">, sample: Sample) {
  const verified = verifiedModifiedOutputs[language]?.[sample.title];
  if (verified) return verified;
  if (language === "htmlcss") return `${sample.output}, plus the added practice paragraph`;
  return `${sample.output}\nmodified`;
}

const mistakes: Example["mistakes"] = [
  { mistake: "Changing a required keyword or punctuation mark", error: "A structure review fails; a real compiler or runtime may reject the program", fix: "Compare braces, parentheses, semicolons, and keyword spelling with the working example." },
  { mistake: "Using a name before declaring it", error: "Cannot find symbol, undeclared identifier, or ReferenceError", fix: "Declare the variable or method before the line that uses it." },
  { mistake: "Mixing a language's output style", error: "A syntax or runtime error", fix: "Use the language's native output API shown in the example instead of copying syntax from another language." },
];

function lineNotes(code: string) {
  return code.split("\n").map((line, index) => {
    const trimmed = line.trim();
    let note = "The language evaluates this statement in order as part of the focused example.";
    if (/console\.log|System\.out\.println|std::cout|<h1|<button|<main/.test(trimmed)) note = "This visible output or semantic element lets a person observe the example's result in the console or browser.";
    else if (/if\s*\(|if \(|if \(|if\s/.test(trimmed)) note = "This conditional evaluates a boolean rule and selects the following branch only when the rule is true.";
    else if (/for\s*\(|for \(|for\s/.test(trimmed)) note = "This loop repeats work over a controlled sequence or range of values.";
    else if (/class |function |static |void |def /.test(trimmed)) note = "This definition creates reusable behavior or a model that later code can call or construct.";
    else if (/=/.test(trimmed)) note = "This declaration or assignment stores the evaluated right-side value so a later line can reuse it.";
    return `Line ${index + 1}: \`${line}\`. ${note}`;
  });
}

function example(sample: Sample, titleSuffix: string, code: string, output: string, focus: string): Example {
  return { title: `${sample.title}: ${titleSuffix}`, code, output, explanation: focus, lines: lineNotes(code), mistakes };
}

function wrapJava(body: string) { return `public class Main {\n    public static void main(String[] args) {\n        ${body}\n    }\n}`; }
function wrapCpp(body: string) { return `#include <iostream>\nusing namespace std;\n\nint main() {\n    ${body}\n    return 0;\n}`; }

function samplesFor(language: Exclude<LanguageId, "python">): Sample[] {
  const js: Sample[] = [
    { title: "Output and values", code: 'console.log("Hello, JavaScript!");', output: "Hello, JavaScript!", focus: "console.log makes a value visible in the browser-worker console.", required: ["console\\.log"], hints: ["Use console.log with a quoted string."], runtime: true },
    { title: "Variables and types", code: 'const lesson = "variables";\nconsole.log(lesson);', output: "variables", focus: "const gives a value a name that cannot be reassigned accidentally.", required: ["const\\s+lesson", "console\\.log"], hints: ["Declare lesson with const, then log it."], runtime: true },
    { title: "Control flow", code: 'const score = 8;\nif (score >= 7) {\n  console.log("pass");\n}', output: "pass", focus: "The if condition protects the output so it runs only for a passing score.", required: ["if\\s*\\(", "console\\.log"], hints: ["Use if (score >= 7) with braces."], runtime: true },
    { title: "Functions", code: 'function double(value) {\n  return value * 2;\n}\nconsole.log(double(4));', output: "8", focus: "A named function returns a reusable calculation instead of printing from its core logic.", required: ["function\\s+double", "return"], hints: ["Define double, return value * 2, then log double(4)."], runtime: true },
    { title: "Arrays and methods", code: 'const topics = ["read", "type"];\ntopics.push("test");\nconsole.log(topics.length);', output: "3", focus: "An array keeps ordered values, and push adds one value at the end.", required: ["\\[", "push\\("], hints: ["Create an array, push an item, then log its length."], runtime: true },
    { title: "Text and templates", code: 'const name = "Mina";\nconsole.log(`Hello, ${name}`);', output: "Hello, Mina", focus: "A template literal inserts a value into readable text without fragile string concatenation.", required: ["`", "\\$\\{"], hints: ["Use a template literal with backticks."], runtime: true },
    { title: "DOM boundary", code: 'const title = document.querySelector("h1");\ntitle.textContent = "Ready";', output: "Browser preview: the h1 text becomes Ready.", focus: "The DOM API selects one existing element, then updates only its text content.", required: ["querySelector", "textContent"], hints: ["Select h1, then set textContent."], runtime: false },
    { title: "Errors and storage", code: 'try {\n  JSON.parse("not json");\n} catch (error) {\n  console.log("invalid");\n}', output: "invalid", focus: "try/catch turns an expected parsing failure into a deliberate user-facing path.", required: ["try", "catch"], hints: ["Wrap JSON.parse in try and handle catch."], runtime: true },
    { title: "Classes", code: 'class Learner {\n  constructor(name) { this.name = name; }\n}\nconsole.log(new Learner("Ada").name);', output: "Ada", focus: "The constructor stores instance-specific data when a Learner object is created.", required: ["class\\s+Learner", "constructor"], hints: ["Define class Learner with a constructor."], runtime: true },
    { title: "Modules", code: 'const values = [3, 1, 2];\nconsole.log([...values].sort());', output: "[1,2,3]", focus: "The spread creates a copy so sorting does not mutate the original collection.", required: ["\\.sort\\("], hints: ["Create a copied array then sort it."], runtime: true },
    { title: "Algorithms", code: 'const found = [2, 4, 6].includes(4);\nconsole.log(found);', output: "true", focus: "includes communicates a membership search directly for a small collection.", required: ["includes\\("], hints: ["Use includes(4) on an array."], runtime: true },
    { title: "Data structures", code: 'const counts = new Map();\ncounts.set("python", 1);\nconsole.log(counts.get("python"));', output: "1", focus: "Map stores key-value data with explicit methods and predictable key handling.", required: ["new\\s+Map", "\\.set\\("], hints: ["Create a Map, set a key, then get it."], runtime: true },
    { title: "Functional JavaScript", code: 'const doubles = [1, 2, 3].map(value => value * 2);\nconsole.log(doubles);', output: "[2,4,6]", focus: "map returns a transformed array without changing the source array.", required: ["\\.map\\("], hints: ["Call map with an arrow function."], runtime: true },
    { title: "Testing", code: 'function add(left, right) { return left + right; }\nconsole.assert(add(2, 3) === 5);\nconsole.log("checked");', output: "checked", focus: "A strict equality assertion records the expected calculation before a visible confirmation.", required: ["console\\.assert", "==="], hints: ["Use console.assert with strict equality."], runtime: true },
    { title: "Asynchronous JavaScript", code: 'async function status() {\n  return "ready";\n}\nstatus().then(console.log);', output: "ready", focus: "An async function returns a Promise; then receives the eventual resolved value.", required: ["async\\s+function", "\\.then\\("], hints: ["Define async status then call .then(console.log)."], runtime: true },
    { title: "Browser networking", code: 'const url = new URL("https://example.test");\nurl.searchParams.set("topic", "python");\nconsole.log(url.search);', output: "?topic=python", focus: "URL and URLSearchParams encode query data rather than concatenating URL syntax by hand.", required: ["URL\\(", "searchParams"], hints: ["Create URL then set searchParams."], runtime: true },
    { title: "Rendering systems", code: 'const state = { count: 1 };\nconst view = `Count: ${state.count}`;\nconsole.log(view);', output: "Count: 1", focus: "A view is derived from state, making the rendering rule easy to repeat after state changes.", required: ["state", "`"], hints: ["Create state then derive a template literal view."], runtime: true },
    { title: "Server-side JavaScript", code: 'const path = "/health";\nconst status = path === "/health" ? 200 : 404;\nconsole.log(status);', output: "200", focus: "A route decision maps an input path to one explicit response status.", required: ["\\?", "===.*health"], hints: ["Use a conditional expression for the route status."], runtime: true },
    { title: "Databases", code: 'const query = "SELECT title FROM lesson WHERE id = ?";\nconsole.log(query.includes("?"));', output: "true", focus: "The placeholder represents a parameter boundary; values should not be concatenated into SQL text.", required: ["SELECT", "\\?"], hints: ["Store SQL with a ? placeholder and log a property."], runtime: true },
    { title: "Performance and memory", code: 'const allowed = new Set(["read", "build"]);\nconsole.log(allowed.has("build"));', output: "true", focus: "Set expresses membership and avoids repeated linear scans through a list.", required: ["new\\s+Set", "\\.has\\("], hints: ["Create Set then call has."], runtime: true },
    { title: "Security", code: 'const safe = text => text.replaceAll("<", "&lt;");\nconsole.log(safe("<tag>"));', output: "&lt;tag>", focus: "Context-specific escaping converts an untrusted character before it becomes display markup.", required: ["replaceAll", "&lt;"], hints: ["Use replaceAll for the opening angle bracket."], runtime: true },
    { title: "Accessibility and standards", code: 'const button = document.querySelector("button");\nbutton.setAttribute("aria-label", "Save lesson");', output: "Browser preview: a save button has an accessible name.", focus: "A native button supplies keyboard behavior, while the accessible name tells assistive technology its purpose.", required: ["querySelector\\(\\\"button", "setAttribute\\(\\\"aria-label"], hints: ["Select a real button, then set its aria-label."], runtime: false },
    { title: "Advanced language features", code: 'const target = { count: 1 };\nconst proxy = new Proxy(target, {});\nconsole.log(proxy.count);', output: "1", focus: "Proxy can intercept object operations, but this lesson uses the minimal transparent form before adding traps.", required: ["new\\s+Proxy"], hints: ["Create a target object and a Proxy around it."], runtime: true },
    { title: "Professional engineering", code: 'const formatTitle = text => text.trim().toUpperCase();\nconsole.log(formatTitle(" python "));', output: "PYTHON", focus: "A small deterministic function is easy to review, test, and reuse.", required: ["trim\\(", "toUpperCase\\("], hints: ["Use trim then toUpperCase."], runtime: true },
    { title: "Capstone", code: 'const tasks = ["build"];\nconst summary = tasks.join(", ");\nconsole.log(summary);', output: "build", focus: "The capstone starts with a small state model and a pure presentation operation.", required: ["\\.join\\("], hints: ["Store a task list and join it for output."], runtime: true },
  ];
  if (language === "javascript") return js;
  if (language === "java") return javaSamples();
  if (language === "cpp") return cppSamples();
  return htmlSamples();
}

const staticSample = (title: string, code: string, output: string, focus: string, required: string[], hints: string[]): Sample => ({ title, code, output, focus, required, hints, runtime: false });
const java = (title: string, body: string, output: string, focus: string, required: string[], hints: string[]): Sample => staticSample(title, wrapJava(body), output, focus, ["class\\s+Main", "static\\s+void\\s+main", ...required], hints);
const cpp = (title: string, body: string, output: string, focus: string, required: string[], hints: string[]): Sample => staticSample(title, wrapCpp(body), output, focus, ["#include", "int\\s+main", ...required], hints);

function javaSamples(): Sample[] {
  return [
    java("JVM entry point", 'System.out.println("Hello, Java!");', "Hello, Java!", "Java source is compiled for the JVM; the classic public static main entry point gives the launcher a place to begin.", ["System\\.out\\.println"], ["Write output with System.out.println."]),
    java("Primitive and reference values", 'int score = 7;\nString topic = "types";\nSystem.out.println(score + " " + topic);', "7 types", "int stores a primitive numeric value while String refers to an immutable text object.", ["int\\s+score", "String\\s+topic"], ["Declare int score and String topic."]),
    java("A guarded branch", 'int score = 8;\nif (score >= 7) {\n    System.out.println("pass");\n}', "pass", "Java uses parentheses around the condition and braces around the selected block.", ["if\\s*\\(", "score\\s*>=\\s*7"], ["Use if (score >= 7) with braces."]),
    staticSample("A reusable method", 'public class Main {\n    static int twiceValue(int value) { return value * 2; }\n    public static void main(String[] args) {\n        System.out.println(twiceValue(4));\n    }\n}', "8", "A static helper method is called from static main without creating an object.", ["static\\s+int\\s+twiceValue", "return\\s+value\\s*\\*\\s*2"], ["Define static int twiceValue(int value) before main, then call it from main."]),
    staticSample("Java class and constructor", 'class Learner {\n    private final String name;\n    Learner(String name) { this.name = name; }\n    String name() { return name; }\n}\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println(new Learner("Ada").name());\n    }\n}', "Ada", "A constructor initializes private state, while a method exposes a deliberate read operation.", ["class\\s+Learner", "private\\s+final", "Learner\\(String"], ["Create Learner with a private name field and constructor."]),
    staticSample("ArrayList collection", 'import java.util.ArrayList;\npublic class Main {\n    public static void main(String[] args) {\n        var topics = new ArrayList<String>();\n        topics.add("read");\n        topics.add("build");\n        System.out.println(topics.size());\n    }\n}', "2", "ArrayList is a growable ordered collection; generics state that its items are Strings.", ["ArrayList< ?String", "\\.add\\("], ["Import ArrayList and add two String values."]),
    staticSample("String transformation", 'public class Main {\n    public static void main(String[] args) {\n        String title = "  java tools  ";\n        System.out.println(title.trim().toUpperCase());\n    }\n}', "JAVA TOOLS", "String methods return transformed text; the original String remains unchanged.", ["trim\\(\\)", "toUpperCase\\(\\)"], ["Chain trim and toUpperCase on a String."]),
    staticSample("Try-with-resources", 'import java.io.StringReader;\npublic class Main {\n    public static void main(String[] args) throws Exception {\n        try (var reader = new StringReader("ready")) {\n            System.out.println((char) reader.read());\n        }\n    }\n}', "r", "Try-with-resources closes AutoCloseable resources even when the block exits through an exception.", ["try\\s*\\(", "StringReader"], ["Use try (...) around an AutoCloseable reader."]),
    staticSample("Interface-based design", 'interface Formatter { String format(String text); }\nclass Upper implements Formatter {\n    public String format(String text) { return text.toUpperCase(); }\n}\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println(new Upper().format("java"));\n    }\n}', "JAVA", "An interface names a behavior contract; a class provides one implementation.", ["interface\\s+Formatter", "implements\\s+Formatter"], ["Define Formatter then implement it in Upper."]),
    staticSample("Generic method", 'import java.util.List;\npublic class Main {\n    static <T> T first(List<T> values) { return values.get(0); }\n    public static void main(String[] args) {\n        System.out.println(first(List.of("a", "b")));\n    }\n}', "a", "A generic type parameter lets one method preserve the item type of different List values.", ["<T>", "List< ?T"], ["Write a generic type parameter before the return type."]),
    staticSample("Algorithmic search", 'public class Main {\n    static int find(int[] values, int target) {\n        for (int index = 0; index < values.length; index++) {\n            if (values[index] == target) return index;\n        }\n        return -1;\n    }\n    public static void main(String[] args) { System.out.println(find(new int[]{2, 4, 6}, 4)); }\n}', "1", "A linear search returns immediately on a match and uses -1 as a documented not-found marker.", ["for\\s*\\(", "return\\s+-1"], ["Loop across values.length and return index on a match."]),
    staticSample("Queue data structure", 'import java.util.ArrayDeque;\nimport java.util.Queue;\npublic class Main {\n    public static void main(String[] args) {\n        Queue<String> queue = new ArrayDeque<>();\n        queue.add("first");\n        queue.add("second");\n        System.out.println(queue.remove());\n    }\n}', "first", "Queue expresses first-in-first-out work; ArrayDeque is the modern general-purpose queue implementation.", ["Queue< ?String", "ArrayDeque", "\\.remove\\("], ["Use Queue<String> with ArrayDeque<>."]),
    staticSample("Stream transformation", 'import java.util.List;\npublic class Main {\n    public static void main(String[] args) {\n        var doubled = List.of(1, 2, 3).stream().map(value -> value * 2).toList();\n        System.out.println(doubled);\n    }\n}', "[2, 4, 6]", "A stream pipeline describes a transformation and toList materializes the resulting values.", ["\\.stream\\(\\)", "\\.map\\(", "toList\\(\\)"], ["Start with List.of then call stream and map."]),
    staticSample("JUnit-style assertion", 'public class Main {\n    static int add(int left, int right) { return left + right; }\n    public static void main(String[] args) {\n        assert add(2, 3) == 5;\n        System.out.println("checked");\n    }\n}', "checked", "An assertion records one expected behavior; production Java projects typically use a framework such as JUnit for test suites.", ["assert", "==\\s*5"], ["Use assert with a boolean expression."]),
    staticSample("Documented method", 'public class Main {\n    /** Return a normalized title. */\n    static String title(String text) { return text.trim(); }\n    public static void main(String[] args) { System.out.println(title(" Java ")); }\n}', "Java", "A documentation comment records a method contract next to the code reviewers and documentation tools read.", ["trim\\(\\)"], ["Add a Javadoc comment and a focused method."]),
    staticSample("Atomic counter", 'import java.util.concurrent.atomic.AtomicInteger;\npublic class Main {\n    public static void main(String[] args) {\n        AtomicInteger count = new AtomicInteger(0);\n        count.incrementAndGet();\n        System.out.println(count.get());\n    }\n}', "1", "AtomicInteger performs one increment safely without relying on an unsafe shared count++ update.", ["AtomicInteger", "incrementAndGet\\(\\)", "count\\.get\\(\\)"], ["Create an AtomicInteger, increment it, then print the value."]),
    staticSample("HTTP request shape", 'import java.net.URI;\npublic class Main {\n    public static void main(String[] args) {\n        URI uri = URI.create("https://example.test/health");\n        System.out.println(uri.getPath());\n    }\n}', "/health", "URI parses a structured address instead of asking the program to slice URL strings manually.", ["URI\\.create", "getPath\\(\\)"], ["Create a URI then read its path."]),
    staticSample("Prepared statement principle", 'public class Main {\n    public static void main(String[] args) {\n        String sql = "SELECT title FROM lesson WHERE id = ?";\n        System.out.println(sql.contains("?"));\n    }\n}', "true", "The placeholder represents a value boundary; real JDBC code binds values separately from SQL text.", ["SELECT", "\\?"], ["Store SQL with a ? parameter placeholder."]),
    staticSample("Retained collection", 'import java.util.ArrayList;\npublic class Main {\n    public static void main(String[] args) {\n        var cache = new ArrayList<String>();\n        cache.add("lesson-1");\n        cache.add("lesson-2");\n        System.out.println(cache.size());\n    }\n}', "2", "Retained collections consume memory for every element they keep alive, so size and lifetime both matter when the program grows.", ["ArrayList< ?String", "cache\\.add", "cache\\.size"], ["Create an ArrayList cache, add two entries, then print cache.size()."]),
    staticSample("Input validation", 'public class Main {\n    static boolean valid(String text) { return text != null && !text.isBlank(); }\n    public static void main(String[] args) { System.out.println(valid("Java")); }\n}', "true", "The validation rule handles null before calling a String instance method, avoiding a null dereference.", ["!=\\s+null", "isBlank\\(\\)"], ["Check null before calling isBlank."]),
    staticSample("Build boundary", 'public class Main {\n    public static void main(String[] args) {\n        String artifact = "codeforge.jar";\n        System.out.println(artifact);\n    }\n}', "codeforge.jar", "A build produces an artifact from source; dependency and build configuration belong in a tool such as Maven or Gradle, not inside Java code.", ["String\\s+artifact"], ["Store the artifact name in a String."]),
    staticSample("Web route model", 'public class Main {\n    static int statusFor(String path) { return path.equals("/health") ? 200 : 404; }\n    public static void main(String[] args) { System.out.println(statusFor("/health")); }\n}', "200", "A pure route decision is testable before a web framework adapts it to HTTP.", ["equals\\(", "\\?\\s*200"], ["Compare strings with equals, then return one status."]),
    staticSample("Sealed hierarchy", 'sealed interface Result permits Success, Failure {}\nrecord Success(String value) implements Result {}\nrecord Failure(String message) implements Result {}\npublic class Main {\n    public static void main(String[] args) { System.out.println(new Success("ok").value()); }\n}', "ok", "A sealed interface restricts which types may implement a closed result hierarchy.", ["sealed\\s+interface", "permits", "record\\s+Success"], ["Define a sealed interface and permitted records."]),
    staticSample("Logger name", 'import java.util.logging.Logger;\npublic class Main {\n    public static void main(String[] args) {\n        Logger logger = Logger.getLogger("codeforge.app");\n        System.out.println(logger.getName());\n    }\n}', "codeforge.app", "Professional Java work uses explicit logging boundaries so behavior can be observed without scattering ad-hoc print statements everywhere.", ["Logger\\.getLogger", "getName\\(\\)"], ["Create a Logger with Logger.getLogger and print its name."]),
    staticSample("Capstone model", 'record Task(String title, boolean done) {}\npublic class Main {\n    public static void main(String[] args) {\n        Task task = new Task("Build", false);\n        System.out.println(task.title());\n    }\n}', "Build", "The capstone begins with a small immutable data model before adding storage, services, and user interfaces.", ["record\\s+Task", "new\\s+Task"], ["Define a Task record and construct one value."]),
  ];
}

function cppSamples(): Sample[] {
  return [
    cpp("Compiled entry point", 'std::cout << "Hello, C++!" << \'\\n\';', "Hello, C++!", "C++ programs start at main; iostream output writes a value followed by a newline.", ["std::cout"], ["Include iostream and write through std::cout."]),
    cpp("Types and constants", 'const int lessons = 7;\nstd::cout << lessons << \'\\n\';', "7", "const prevents reassignment of a value that should remain fixed after initialization.", ["const\\s+int"], ["Declare a const int then print it."]),
    cpp("Branching", 'int score = 8;\nif (score >= 7) {\n    std::cout << "pass" << \'\\n\';\n}', "pass", "The condition is enclosed in parentheses and braces delimit the selected block.", ["if\\s*\\(", "score\\s*>=\\s*7"], ["Use if with parentheses and braces."]),
    staticSample("Function and reference", '#include <iostream>\n\nint double_value(int value) { return value * 2; }\n\nint main() {\n    std::cout << double_value(4) << \'\\n\';\n    return 0;\n}', "8", "A function definition can return a calculated value; callers reuse that result in output.", ["int\\s+double_value", "return\\s+value\\s*\\*\\s*2"], ["Define int double_value(int value) before main, then call it in main."]),
    staticSample("Vector collection", '#include <iostream>\n#include <string>\n#include <vector>\nint main() {\n    std::vector<std::string> topics{"read", "build"};\n    topics.push_back("test");\n    std::cout << topics.size() << \'\\n\';\n}', "3", "std::vector is a dynamic array; push_back adds at the end and size reports the current count.", ["std::vector", "push_back"], ["Include vector, create a vector, then push_back."]),
    staticSample("Pointer and reference", '#include <iostream>\nint main() {\n    int value = 3;\n    int* pointer = &value;\n    int& reference = value;\n    std::cout << *pointer << " " << reference << \'\\n\';\n}', "3 3", "A pointer stores an address, while a reference gives another name to the same object without reseating the binding.", ["int\\*", "&value", "int&\\s+reference", "\\*pointer"], ["Create one int, then read it through both a pointer and a reference."]),
    staticSample("RAII guard", '#include <iostream>\nstruct Guard {\n    ~Guard() { std::cout << "cleanup" << \'\\n\'; }\n};\nint main() {\n    Guard guard;\n    std::cout << "work" << \'\\n\';\n}', "work\ncleanup", "RAII ties cleanup to object lifetime, so the destructor runs automatically as the scope exits.", ["~Guard", "struct\\s+Guard"], ["Define a guard type with a destructor that prints cleanup."]),
    staticSample("Virtual behavior", '#include <iostream>\n#include <string>\nstruct Formatter { virtual std::string format() const = 0; virtual ~Formatter() = default; };\nstruct Loud : Formatter { std::string format() const override { return "LOUD"; } };\nint main() { Loud loud; std::cout << loud.format() << \'\\n\'; }', "LOUD", "A pure virtual function creates an abstract behavior contract; override documents the derived implementation.", ["virtual", "override", "=\\s*0"], ["Define a pure virtual format then override it."]),
    staticSample("Function template", '#include <iostream>\ntemplate <typename T>\nT first(T left, T) { return left; }\nint main() { std::cout << first(3, 4) << \'\\n\'; }', "3", "A function template lets the compiler deduce a type parameter from the call arguments.", ["template\\s*<", "typename\\s+T"], ["Write a template with a type parameter T."]),
    staticSample("Standard algorithm", '#include <algorithm>\n#include <iostream>\n#include <vector>\nint main() {\n    std::vector<int> values{4, 9, 2};\n    std::cout << *std::max_element(values.begin(), values.end()) << \'\\n\';\n}', "9", "Standard algorithms let you ask for the operation you need while iterators describe the range they should inspect.", ["std::max_element", "values\\.begin", "values\\.end"], ["Use std::max_element over a vector range."]),
    staticSample("Algorithm search", '#include <algorithm>\n#include <iostream>\n#include <vector>\nint main() {\n    std::vector<int> values{2, 4, 6};\n    std::cout << (std::find(values.begin(), values.end(), 4) != values.end()) << \'\\n\';\n}', "1", "std::find returns an iterator; comparing it with end tells whether the target was found.", ["std::find", "values\\.end"], ["Use std::find and compare with end."]),
    staticSample("Queue and lookup", '#include <iostream>\n#include <queue>\n#include <string>\n#include <unordered_map>\nint main() {\n    std::queue<std::string> jobs;\n    jobs.push("first");\n    std::unordered_map<std::string, int> priority{{"first", 1}};\n    std::cout << jobs.front() << " " << priority["first"] << \'\\n\';\n}', "first 1", "A queue models ordered work, while an unordered_map provides direct key-based lookup for related metadata.", ["std::queue", "unordered_map", "jobs\\.front", "priority\\["], ["Store one job in a queue and one priority in a lookup table."]),
    staticSample("Unique ownership", '#include <iostream>\n#include <memory>\nint main() {\n    auto value = std::make_unique<int>(3);\n    std::cout << *value << \'\\n\';\n}', "3", "unique_ptr expresses one clear owner for a heap value and cleans it up automatically.", ["std::make_unique", "unique_ptr|make_unique"], ["Include memory and use make_unique."]),
    staticSample("Assertion", '#include <cassert>\n#include <iostream>\nint add(int left, int right) { return left + right; }\nint main() { assert(add(2, 3) == 5); std::cout << "checked" << \'\\n\'; }', "checked", "assert documents an invariant during development; real C++ test suites typically use a dedicated framework.", ["assert\\(", "==\\s*5"], ["Include cassert and assert a result."]),
    staticSample("String view", '#include <iostream>\n#include <string_view>\nint main() {\n    std::string_view topic = "C++";\n    std::cout << topic << \'\\n\';\n}', "C++", "string_view reads an existing character sequence without owning a copied string, so its lifetime must remain valid.", ["string_view"], ["Include string_view and print a view."]),
    staticSample("Thread ownership", '#include <iostream>\n#include <thread>\nint main() {\n    std::thread worker([] { std::cout << "work" << \'\\n\'; });\n    worker.join();\n}', "work", "join makes the main thread wait for the worker, giving the thread a clear lifetime owner.", ["std::thread", "\\.join\\(\\)"], ["Create a thread and call join."]),
    staticSample("Filesystem path", '#include <filesystem>\n#include <iostream>\nint main() {\n    std::filesystem::path path{"notes.txt"};\n    std::cout << path.extension().string() << \'\\n\';\n}', ".txt", "filesystem::path represents path structure instead of asking code to slice filename strings.", ["filesystem::path", "extension\\("], ["Create filesystem::path then read extension."]),
    staticSample("Serialization boundary", '#include <iostream>\n#include <string>\nint main() {\n    std::string json = "{\\"topic\\":\\"cpp\\"}";\n    std::cout << json << \'\\n\';\n}', '{"topic":"cpp"}', "Serialization is a boundary: real code should use a parser library rather than hand-slicing JSON text.", ["std::string", "json"], ["Store structured text in a string for this boundary example."]),
    staticSample("Cache-aware container choice", '#include <iostream>\n#include <vector>\nint main() {\n    std::vector<int> values{1, 2, 3};\n    std::cout << values[1] << \'\\n\';\n}', "2", "vector stores elements contiguously, which makes indexed access and cache-friendly iteration common strengths.", ["std::vector", "\\[1\\]"], ["Use vector indexing for this sequence."]),
    staticSample("Bounds-aware access", '#include <iostream>\n#include <vector>\nint main() {\n    std::vector<int> values{4};\n    std::cout << values.at(0) << \'\\n\';\n}', "4", "at performs a bounds check and throws on an invalid index, unlike unchecked operator[] access.", ["\\.at\\("], ["Use at(0) for checked element access."]),
    staticSample("CMake target concept", '#include <iostream>\nint main() {\n    std::cout << "codeforge_app" << \'\\n\';\n}', "codeforge_app", "A build target names an output artifact; in a real project CMake describes the target outside the C++ source file.", ["std::cout"], ["Print the conceptual target name."]),
    staticSample("API result model", '#include <iostream>\n#include <optional>\nstd::optional<int> find(bool found) { return found ? std::optional<int>{2} : std::nullopt; }\nint main() { std::cout << find(true).value() << \'\\n\'; }', "2", "optional represents a value that may be absent without using a magic sentinel integer.", ["std::optional", "std::nullopt"], ["Return optional<int> and use nullopt for absence."]),
    staticSample("Concept constraint", '#include <concepts>\n#include <iostream>\ntemplate <std::integral T>\nT twice(T value) { return value * 2; }\nint main() { std::cout << twice(4) << \'\\n\'; }', "8", "A concept documents that this template expects an integral type before instantiation.", ["std::integral", "template"], ["Constrain T with std::integral."]),
    staticSample("Logging boundary", '#include <iostream>\nint main() {\n    std::cerr << "config-loaded" << \'\\n\';\n    std::cout << "service-ready" << \'\\n\';\n}', "config-loaded\nservice-ready", "Professional engineering separates operational signals from ordinary program output so humans and tooling can observe system state honestly.", ["std::cerr", "service-ready"], ["Log a configuration event to std::cerr and print the service status."]),
    staticSample("Capstone task model", '#include <iostream>\n#include <string>\nstruct Task { std::string title; bool done{false}; };\nint main() { Task task{"Build"}; std::cout << task.title << \'\\n\'; }', "Build", "The capstone begins with explicit state in a small value type before storage and UI are added.", ["struct\\s+Task", "bool\\s+done"], ["Define Task with title and done fields."]),
  ];
}

function htmlSamples(): Sample[] {
  return [
    staticSample("Document shell", '<!doctype html>\n<html lang="en">\n<head><meta charset="utf-8"><title>CodeForge</title></head>\n<body><main><h1>CodeForge</h1></main></body>\n</html>', "A valid document with language and title", "The document shell gives browsers and assistive technology the language, character encoding, and primary page title.", ["<!doctype html>", "<html\\s+lang=", "<title>"], ["Start with doctype, html lang, and title."]),
    staticSample("Heading structure", '<main>\n  <h1>Python Notes</h1>\n  <section><h2>Variables</h2><p>Names hold values.</p></section>\n</main>', "A meaningful heading hierarchy", "Headings describe the content outline; a section groups a related topic.", ["<main", "<h1", "<h2"], ["Use one h1 and a lower-level section heading."]),
    staticSample("Semantic article", '<article>\n  <header><h1>Learning loops</h1></header>\n  <p>Practice builds skill.</p>\n  <footer>CodeForge</footer>\n</article>', "An article with header and footer", "Semantic elements communicate page regions without changing the content's visible meaning by themselves.", ["<article", "<header", "<footer"], ["Wrap independent content in article."]),
    staticSample("Labeled form", '<form>\n  <label for="email">Email</label>\n  <input id="email" name="email" type="email" required>\n  <button type="submit">Save</button>\n</form>', "A labeled required email field", "label, input type, required, and a native submit button give the form semantic and validation behavior.", ["<label", "for=", "type=\"email\"", "required"], ["Connect label for to input id."]),
    staticSample("Cascade and custom property", '<style>\n  :root { --accent: #345; }\n  .title { color: var(--accent); }\n</style>\n<h1 class="title">CodeForge</h1>', "A themed heading", "A custom property centralizes a reusable design value, while the class selector applies it to one element.", ["--accent", "var\\("], ["Declare a custom property then use var()."]),
    staticSample("Box model", '<style>\n  .panel { box-sizing: border-box; width: 200px; padding: 16px; border: 2px solid #345; }\n</style>\n<div class="panel">Notes</div>', "A sized padded panel", "box-sizing makes declared width include padding and border, which reduces layout surprises.", ["box-sizing", "padding", "border"], ["Use box-sizing, padding, and border."]),
    staticSample("Flex navigation", '<style>\n  nav { display: flex; gap: 1rem; justify-content: space-between; }\n</style>\n<nav><a href="#learn">Learn</a><a href="#build">Build</a></nav>', "A spaced navigation row", "Flexbox aligns one-dimensional navigation items while semantic nav retains its landmark meaning.", ["display:\\s*flex", "justify-content"], ["Use nav with display:flex."]),
    staticSample("Grid cards", '<style>\n  .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1rem; }\n</style>\n<section class="grid"><article>One</article><article>Two</article></section>', "A two-column card grid", "Grid expresses a two-dimensional track layout and minmax prevents content from forcing overflow.", ["display:\\s*grid", "grid-template-columns"], ["Use grid columns and a gap."]),
    staticSample("Responsive query", '<style>\n  .grid { display: grid; grid-template-columns: 1fr; }\n  @media (min-width: 40rem) { .grid { grid-template-columns: repeat(2, 1fr); } }\n</style>\n<div class="grid"><p>One</p><p>Two</p></div>', "A layout that gains a second column", "The base layout works on small screens first; the media query enhances it when width allows.", ["@media", "min-width"], ["Write the small-screen base before the media query."]),
    staticSample("Readable typography", '<style>\n  body { font-family: system-ui, sans-serif; line-height: 1.6; max-width: 65ch; }\n</style>\n<p>Readable text has a deliberate measure and line height.</p>', "A readable text block", "Line height and character-based measure support reading without depending on one specific installed font.", ["line-height", "max-width"], ["Use line-height and a ch-based maximum width."]),
    staticSample("Keyboard-visible button", '<button type="button">Save lesson</button>\n<style>\nbutton:focus-visible { outline: 3px solid #345; outline-offset: 3px; }\n</style>', "A focus-visible native button", "A native button supplies semantics and keyboard activation; focus-visible gives keyboard users a visible location.", ["<button", "focus-visible"], ["Use a real button and focus-visible outline."]),
    staticSample("Dialog semantics", '<button type="button" aria-controls="help">Help</button>\n<dialog id="help"><p>Use Tab to move focus.</p><button type="button">Close</button></dialog>', "A dialog element with controls", "dialog expresses a modal-capable region, though real interaction code must also manage opening, closing, and focus behavior.", ["<dialog", "aria-controls"], ["Use a dialog element with an id."]),
    staticSample("Cascade layer", '<style>\n  @layer base, components;\n  @layer base { p { color: #222; } }\n  @layer components { .notice { color: #345; } }\n</style>\n<p class="notice">Layered styles</p>', "A layered notice style", "Cascade layers let a stylesheet define a predictable priority order beyond selector specificity.", ["@layer"], ["Declare named layers before using them."]),
    staticSample("Reduced-motion animation", '<style>\n  .card { transition: transform .2s; }\n  @media (prefers-reduced-motion: reduce) { .card { transition: none; } }\n</style>\n<article class="card">Lesson</article>', "A motion-aware card", "The media feature respects a user preference to reduce nonessential motion.", ["prefers-reduced-motion", "transition"], ["Add a reduced-motion media query."]),
    staticSample("Component custom properties", '<style>\n  .button { --button-bg: #345; background: var(--button-bg); color: white; }\n</style>\n<button class="button" type="button">Save</button>', "A configurable button component", "Component-scoped custom properties expose an intentional styling hook without duplicating declarations.", ["--button-bg", "var\\("], ["Define a custom property on the component."]),
    staticSample("Responsive image", '<img src="lesson.png" alt="Python lesson notes" width="640" height="360" loading="lazy">', "A deferred image with text alternative", "alt provides equivalent meaning and dimensions help reserve layout space before the image loads.", ["<img", "alt=", "loading=", "width="], ["Provide alt text, dimensions, and lazy loading."]),
    staticSample("Safe external link", '<a href="https://example.test" rel="noopener noreferrer" target="_blank">Reference</a>', "A safer external link", "noopener prevents a newly opened page from receiving a window opener reference in supporting contexts.", ["rel=", "noopener"], ["Add rel=noopener noreferrer when using target=_blank."]),
    staticSample("Metadata", '<head>\n  <meta charset="utf-8">\n  <meta name="description" content="Learn practical code">\n  <meta name="viewport" content="width=device-width, initial-scale=1">\n  <title>CodeForge</title>\n</head>', "Document metadata", "Metadata describes the page to browsers, search systems, and responsive viewport handling.", ["name=\"description\"", "name=\"viewport\""], ["Add description and viewport meta tags."]),
    staticSample("Design token", '<style>\n  :root { --space-2: .5rem; }\n  .stack > * + * { margin-top: var(--space-2); }\n</style>\n<div class="stack"><p>One</p><p>Two</p></div>', "A reusable spacing token", "A design token gives repeated spacing one named source of truth.", ["--space-2", "var\\("], ["Define a root spacing token."]),
    staticSample("Progressive enhancement", '<form action="/search" method="get">\n  <label for="q">Search</label>\n  <input id="q" name="q">\n  <button type="submit">Search</button>\n</form>', "A functional no-JavaScript search form", "Native form submission provides a usable baseline before optional JavaScript enhances the interaction.", ["<form", "action=", "method=\"get\""], ["Use a real form with action and method."]),
    staticSample("Visual debugging", '<style>\n  * { outline: 1px solid color-mix(in srgb, red 30%, transparent); }\n</style>\n<div><p>Inspect box boundaries</p></div>', "Visible box boundaries", "A temporary universal outline reveals layout boxes; remove it after diagnosing the layout.", ["outline"], ["Use a temporary outline rule."]),
    staticSample("Container query", '<style>\n  .card { container-type: inline-size; }\n  @container (min-width: 30rem) { .card p { columns: 2; } }\n</style>\n<article class="card"><p>Responsive component text.</p></article>', "A container-responsive card", "Container queries respond to the component's available inline size rather than only the viewport.", ["container-type", "@container"], ["Set container-type before writing @container."]),
    staticSample("Article page", '<article>\n  <header><h1>Build a form</h1><p>By CodeForge</p></header>\n  <main><p>Meaningful article content.</p></main>\n  <footer><a href="#top">Back to top</a></footer>\n</article>', "A structured article", "The page uses semantic regions and a real link for a navigable multi-section document.", ["<article", "<header", "<footer"], ["Use article, header, main, and footer."]),
    staticSample("Print stylesheet", '<style>\n  @media print { nav, button { display: none; } body { color: black; background: white; } }\n</style>\n<nav>Navigation</nav><button type="button">Save</button>', "A print-focused page", "Print styles remove interactive chrome and optimize contrast for a static document.", ["@media\\s+print", "display:\\s*none"], ["Use an @media print block."]),
    staticSample("Capstone landing structure", '<header><nav aria-label="Primary"><a href="#learn">Learn</a></nav></header>\n<main id="learn"><h1>CodeForge</h1><p>Build by practicing.</p></main>\n<footer>Free programming education</footer>', "A semantic landing-page skeleton", "A capstone page begins with landmarks and heading structure before visual detail is added.", ["<header", "<nav", "<main", "<footer"], ["Use the four major page landmarks."]),
  ];
}

function checkerFor(language: Exclude<LanguageId, "python">, sample: Sample, forceStatic = false): Exercise["checker"] {
  return language === "javascript" && sample.runtime && !forceStatic ? undefined : { mode: language === "htmlcss" ? "html" : "patterns", requiredPatterns: sample.required, successMessage: "Required language constructs are present." };
}

function blankStarter(language: Exclude<LanguageId, "python">) {
  if (language === "java") return "public class Main {\n    public static void main(String[] args) {\n        // Build the requested Java program\n    }\n}";
  if (language === "cpp") return "#include <iostream>\n\nint main() {\n    // Build the requested C++ program\n    return 0;\n}";
  if (language === "htmlcss") return "<main>\n  <!-- Build the requested accessible structure here -->\n</main>";
  return "// Build the requested JavaScript here\n";
}

function brokenCode(language: Exclude<LanguageId, "python">, code: string) {
  if (language === "javascript") {
    // Removing async breaks the asynchronous contract visibly: the caller expects a Promise and
    // then() is not a function on the returned value. The console.lg break only fails when the
    // missing method is actually invoked, which is not true for a handler passed to then().
    if (code.includes("async function")) return code.replace("async function", "function");
    return code.includes("console.log") ? code.replace("console.log", "console.lg") : code.replace("const", "conzt");
  }
  if (language === "java") return code.includes("System.out.println") ? code.replace("System.out.println", "System.out.prinln") : code.replace("class", "clas");
  if (language === "cpp") return code.includes("std::cout") ? code.replace("std::cout", "std::cot") : code.replace("int main", "int mian");
  return code.includes("<main") ? code.replace(/<main/, "<mian") : code.replace("<", "<broken-");
}

function insertIntoBlock(code: string, anchor: string, statement: string) {
  const start = code.indexOf(anchor);
  if (start < 0) return code;
  const open = code.indexOf("{", start);
  if (open < 0) return code;
  let depth = 0;
  for (let index = open; index < code.length; index += 1) {
    if (code[index] === "{") depth += 1;
    if (code[index] === "}") {
      depth -= 1;
      if (depth === 0) return `${code.slice(0, index)}\n        ${statement}\n${code.slice(index)}`;
    }
  }
  return code;
}

function modifiedCode(language: Exclude<LanguageId, "python">, code: string) {
  if (language === "htmlcss") return code.includes("</main>") ? code.replace("</main>", "  <p>Modified practice output</p>\n</main>") : `${code}\n<p>Modified practice output</p>`;
  if (language === "java") return insertIntoBlock(code, "public static void main", 'System.out.println("modified");');
  if (language === "cpp") return insertIntoBlock(code, "int main", 'std::cout << "modified" << \'\\n\';');
  return `${code}\nconsole.log("modified");`;
}

function commonGuide(language: Exclude<LanguageId, "python">, plan: ChapterPlan): NonNullable<Lesson["decisionGuide"]> {
  return [
    { use: language === "java" ? "a transparent structure check for Java" : language === "cpp" ? "a transparent structure check for C++" : language === "htmlcss" ? "a sandboxed browser preview and structure check" : "a Web Worker execution check", insteadOf: language === "java" || language === "cpp" ? "claiming that this browser compiled code it did not compile" : "an opaque remote service", reason: language === "java" || language === "cpp" ? "CodeForge does not have a local Java or C++ compiler. It never fabricates compiler output; it checks the requested structure on-device and labels that limitation clearly." : "The browser can run or render this language locally without sending student code to a backend." },
    { use: plan.concepts[0] ?? `the native ${language === "htmlcss" ? "HTML/CSS" : language} feature in this chapter`, insteadOf: "syntax copied from a different language", reason: "The language's own conventions make the code understandable to its runtime, tools, teammates, and future maintainers." },
  ];
}

function verificationFor(language: Exclude<LanguageId, "python">, sample: Sample, checker?: Exercise["checker"]): VerificationKind[] {
  if (language === "htmlcss") return ["previewed", "structurally-checked"];
  if (checker?.mode === "html") return ["previewed", "structurally-checked"];
  if (checker && language !== "javascript") return ["structurally-checked", "pattern-checked"];
  if (checker?.mode === "patterns") return ["pattern-checked"];
  return sample.runtime ? ["executed"] : ["pattern-checked"];
}

function qualityFor(
  kind: LessonKind,
  plan: ChapterPlan,
  depth: LessonQuality["authoredDepth"] = "scaffolded",
  overrides: Partial<Omit<LessonQuality, "authoredDepth" | "coveredConcepts" | "prerequisiteChapters" | "notes">> = {},
): LessonQuality {
  return {
    explanation: true,
    syntax: true,
    terminology: true,
    multipleExamples: true,
    codeReading: ["read", "predict", "compare", "integration", "deep-dive"].includes(kind),
    prediction: ["predict", "read", "compare", "integration"].includes(kind),
    debugging: kind === "debug" || kind === "deep-dive",
    modification: kind === "modify" || kind === "design",
    blankPage: ["blank-page", "build", "challenge", "integration"].includes(kind),
    edgeCase: kind === "deep-dive" || kind === "integration" || Boolean(plan.project.edgeCases.length),
    assessment: kind === "assessment" || plan.test.length > 0,
    project: true,
    ...overrides,
    authoredDepth: depth,
    coveredConcepts: plan.concepts,
    prerequisiteChapters: plan.prerequisiteChapters,
    notes: plan.focus,
  };
}

function labelForKind(kind: LessonKind) {
  switch (kind) {
    case "learn": return "Learn";
    case "read": return "Read";
    case "predict": return "Predict";
    case "debug": return "Debug";
    case "modify": return "Modify";
    case "compare": return "Compare";
    case "design": return "Design";
    case "edge-case": return "Edge case";
    case "blank-page": return "Blank page";
    case "build": return "Build";
    case "integration": return "Integrate";
    case "challenge": return "Challenge";
    case "case-study": return "Case study";
    case "assessment": return "Assess";
    case "deep-dive": return "Deep dive";
    default: return "Practice";
  }
}

function buildExercise(language: Exclude<LanguageId, "python">, topic: string, sample: Sample, plan: ChapterPlan): Exercise {
  return {
    prompt: plan.project.prompt,
    starterCode: plan.project.starterCode ?? blankStarter(language),
    solution: plan.project.solution ?? sample.code,
    solutionExplanation: plan.project.solutionExplanation ?? `This small build applies ${topic.toLowerCase()} in a realistic scenario while keeping the boundary explicit and reviewable.`,
    testCases: plan.project.testCases ?? [{ label: `${topic} build`, expected: plan.project.solution ? sample.output : modifiedOutputFor(language, sample) }],
    hints: plan.project.hints ?? sample.hints,
    checker: checkerFor(language, { ...sample, required: plan.project.requiredPatterns ?? sample.required }, true),
  };
}

function exerciseForKind(language: Exclude<LanguageId, "python">, kind: LessonKind, topic: string, sample: Sample, plan: ChapterPlan): Exercise {
  const typedExercise: Exercise = {
    prompt: `Type the working ${language === "htmlcss" ? "HTML/CSS" : language} pattern for ${topic}. Focus on ${plan.concepts[0]?.toLowerCase() ?? "the native construct"}, then check it honestly.`,
    starterCode: blankStarter(language),
    solution: sample.code,
    solutionExplanation: `This implementation uses ${sample.required.map((value) => `\`${value}\``).join(" and ")} to express ${topic.toLowerCase()}. The code is checked with the strongest browser-safe method available for this language.`,
    testCases: [{ label: `${topic} behavior`, expected: sample.output }],
    hints: sample.hints,
    checker: checkerFor(language, sample),
  };
  const debugExercise: Exercise = {
    prompt: `Repair this deliberately broken ${topic.toLowerCase()} example. Restore the requested construct and explain which concept went missing: ${plan.concepts.slice(0, 2).join(" and ")}.`,
    starterCode: brokenCode(language, sample.code),
    solution: sample.code,
    solutionExplanation: `The repair restores the native construct checked by CodeForge. ${language === "java" || language === "cpp" ? "This browser does not compile this language, so CodeForge reports a transparent structure repair rather than fabricating a compiler diagnostic." : "For this language, the local runner or preview can also show the repaired behavior when supported."}`,
    testCases: [{ label: `Repaired ${topic}`, expected: sample.output }],
    hints: ["Compare the broken token with the working example.", "Restore the exact native construct, including punctuation.", "Re-run or re-check only after one focused change."],
    checker: checkerFor(language, sample, true),
  };
  const modifyExercise: Exercise = {
    prompt: `Extend the working ${topic.toLowerCase()} example for a new requirement without removing the original behavior. Keep ${plan.concepts[0]?.toLowerCase() ?? "the core construct"} visible.`,
    starterCode: sample.code,
    solution: modifiedCode(language, sample.code),
    solutionExplanation: "The modification extends an existing working program instead of replacing it. This mirrors real programming work: understand the current boundary, make one focused change, then re-check the important construct.",
    testCases: [{ label: `Modified ${topic}`, expected: modifiedOutputFor(language, sample) }],
    hints: ["Keep the original code first.", "Add one small visible output or semantic element.", "Do not remove the chapter feature while extending the example."],
    checker: checkerFor(language, sample, true),
  };

  if (kind === "debug") return debugExercise;
  if (kind === "modify" || kind === "design" || kind === "compare") return modifyExercise;
  if (kind === "blank-page" || kind === "build" || kind === "integration" || kind === "challenge") return buildExercise(language, topic, sample, plan);
  return typedExercise;
}

function readingCheckForKind(kind: LessonKind, topic: string, sample: Sample, plan: ChapterPlan): NonNullable<Lesson["readingCheck"]> {
  const terms = plan.terminology ?? plan.concepts.slice(0, 3);
  switch (kind) {
    case "predict":
      return {
        prompt: `Prediction: which documented result should this ${topic.toLowerCase()} example produce before you edit it?`,
        choices: [sample.output, "No visible result", "A different unrelated result", "A random result each run"],
        correctIndex: 0,
        explanation: `Trace the example in order. The intended result is ${sample.output}. Predicting first prevents blind editing.`,
      };
    case "debug":
      return {
        prompt: `Which debugging step comes first in this ${topic.toLowerCase()} repair?`,
        choices: ["Compare the failing token with the working construct", "Rewrite the whole program", "Add unrelated output everywhere", "Ignore the edge case"],
        correctIndex: 0,
        explanation: "Good debugging starts by reproducing the failure and isolating the smallest changed construct before making a fix.",
      };
    case "compare":
      return {
        prompt: `Which design choice better matches this chapter's focus on ${terms[0] ?? topic}?`,
        choices: [terms[0] ?? topic, "Copying another language's syntax", "Hiding the feature inside unrelated code", "Skipping verification entirely"],
        correctIndex: 0,
        explanation: `This chapter teaches ${terms[0] ?? topic}. The better design keeps that concept explicit and reviewable.`,
      };
    case "blank-page":
      return {
        prompt: "What should you do first on a blank-page implementation?",
        choices: ["Break the requirement into input, rule, and visible result", "Add every optional feature at once", "Avoid reading the requirement", "Replace the task with another language"],
        correctIndex: 0,
        explanation: "Blank-page work becomes manageable when you split the problem into small steps and implement the boundary first.",
      };
    case "build":
    case "integration":
      return {
        prompt: `Which chapter idea must remain visible in the build?`,
        choices: [terms[0] ?? topic, terms[1] ?? "an unrelated tool", "a removed boundary", "an omitted result"],
        correctIndex: 0,
        explanation: `The build still teaches ${terms[0] ?? topic}; the project should make that concept observable, not hide it.`,
      };
    default:
      return {
        prompt: `Code reading: which concept is central to this ${topic.toLowerCase()} lesson?`,
        choices: [terms[0] ?? topic, "Ignoring the chapter boundary", "A hidden random side effect", "An unrelated framework feature"],
        correctIndex: 0,
        explanation: `The chapter focus is ${terms[0] ?? topic}. The example is built to make that concept visible.`,
      };
  }
}

function summaryForKind(kind: LessonKind, topic: string, plan: ChapterPlan, language: Exclude<LanguageId, "python">) {
  switch (kind) {
    case "learn": return `Understand how ${plan.concepts.slice(0, 2).join(" and ")} work in real ${language === "htmlcss" ? "HTML/CSS" : language} code.`;
    case "read": return `Trace ${topic.toLowerCase()} code line by line before you touch it.`;
    case "predict": return `Predict the result of ${topic.toLowerCase()} code before running or checking it.`;
    case "debug": return `Repair one realistic mistake involving ${plan.concepts.slice(0, 2).join(" and ")}.`;
    case "modify": return `Change the requirements while preserving the existing ${topic.toLowerCase()} behavior.`;
    case "compare": return `Compare two approaches and choose the safer ${topic.toLowerCase()} design.`;
    case "design": return `Decide which implementation makes ${topic.toLowerCase()} clearer and easier to maintain.`;
    case "blank-page": return `Implement the chapter pattern from a blank editor with no completed example in place.`;
    case "build": return `Apply ${topic.toLowerCase()} in a small practical feature rather than a copied snippet.`;
    case "integration": return `Combine earlier ideas with ${topic.toLowerCase()} in one integrated exercise.`;
    case "challenge": return `Reproduce the pattern independently and keep the edge cases honest.`;
    default: return `Practice ${topic.toLowerCase()} with deliberate reading, prediction, and implementation steps.`;
  }
}

function learningGoalsForKind(kind: LessonKind, plan: ChapterPlan) {
  const concepts = [...plan.concepts, ...(plan.terminology ?? [])];
  if (kind === "debug") return ["Reproduce the failure", "Name the broken construct honestly", `Repair ${concepts[0] ?? "the key concept"} without changing unrelated code`];
  if (kind === "blank-page" || kind === "build" || kind === "integration") return [`Implement ${concepts[0] ?? "the key concept"} from a blank start`, "Preserve the intended boundary", "Verify the result with the strongest honest check available"];
  if (kind === "compare" || kind === "design") return ["Compare two approaches", `Choose when to use ${concepts[0] ?? "the key concept"}`, "Explain why the safer design is easier to maintain"];
  return [`Explain ${concepts[0] ?? "the chapter concept"}`, `Use ${concepts[1] ?? concepts[0] ?? "the native syntax"} correctly`, "Read or predict behavior before editing"];
}

function explanationForKind(kind: LessonKind, topic: string, sample: Sample, plan: ChapterPlan, language: Exclude<LanguageId, "python">) {
  const terms = plan.terminology ?? plan.concepts.slice(0, 3);
  const shared = `${plan.focus} The strongest browser-safe verification for this lesson is ${verificationFor(language, sample, exerciseForKind(language, kind, topic, sample, plan).checker).join(", ")}.`;
  switch (kind) {
    case "predict": return `${shared} Before changing code, predict which branch, value, or browser effect occurs from ${terms.slice(0, 2).join(" and ")}.`;
    case "debug": return `${shared} Debugging means reproduce, observe, isolate, hypothesize, change one thing, test, verify, and prevent the regression. This lesson focuses on ${terms.slice(0, 2).join(" and ")}.`;
    case "compare": return `${shared} Comparing two approaches reveals trade-offs in clarity, safety, and maintainability. Here the comparison centers on ${terms.slice(0, 2).join(" and ")}.`;
    case "design": return `${shared} Design work means choosing the smallest construct that communicates the rule clearly. The choice matters for ${terms.slice(0, 2).join(" and ")}.`;
    case "blank-page": return `${shared} Blank-page implementation proves you can rebuild the concept instead of only recognizing it. Start with the boundary, then add the smallest working rule.`;
    case "build": return `${shared} This small build uses the chapter idea in a scenario closer to real work, where requirements, constraints, and acceptance criteria matter.`;
    case "integration": return `${shared} Integrated practice combines earlier ideas with ${terms.slice(0, 2).join(" and ")} so the chapter does not become an isolated trick.`;
    default: return `${sample.focus} ${plan.focus}`;
  }
}

function examplesForKind(language: Exclude<LanguageId, "python">, kind: LessonKind, sample: Sample, plan: ChapterPlan) {
  const companion = language === "htmlcss" ? `${sample.code}\n<!-- Review how the semantic structure supports the visible result. -->` : `${sample.code}\n\n// Re-read the output boundary before you type it yourself.`;
  if (kind === "debug") return [
    example(sample, "broken version", brokenCode(language, sample.code), "A deliberate error or invalid structure", `This is intentionally broken for debugging practice. ${language === "java" || language === "cpp" ? "CodeForge does not claim to compile it; inspect the changed native construct and repair it structurally." : "Run or preview it to observe the failure path where supported."}`),
    example(sample, "repaired version", sample.code, sample.output, "The repair restores the original native construct and returns the program to its intended behavior."),
  ];
  if (kind === "compare" || kind === "design") return [
    example(sample, "minimal version", sample.code, sample.output, `This version keeps ${plan.concepts[0]?.toLowerCase() ?? "the chapter concept"} explicit.`),
    example(sample, "extended version", modifiedCode(language, sample.code), modifiedOutputFor(language, sample), `This variation is useful only when the new requirement is deliberate and still keeps ${plan.concepts[0]?.toLowerCase() ?? "the key feature"} visible. Its expected output is the one the extended program actually produces.`),
  ];
  if (kind === "build" || kind === "blank-page" || kind === "integration" || kind === "challenge") return [
    example(sample, "target behavior", sample.code, sample.output, "This is the behavior you will reproduce from a blank editor or adapt to the project requirement."),
    example(sample, "edge-aware reminder", companion, sample.output, `Keep ${plan.project.edgeCases[0] ?? "the edge case"} in mind while you build.`),
  ];
  return [
    example(sample, "working program", sample.code, sample.output, sample.focus),
    example(sample, "trace the boundary", companion, sample.output, `Read the program from declarations through its visible output or semantic result before changing ${plan.concepts[0]?.toLowerCase() ?? "the chapter concept"}.`),
  ];
}

function lessonKindsFor(plan: ChapterPlan, hasDeepDive: boolean): LessonKind[] {
  if (plan.lessonKinds?.length) return [...plan.lessonKinds];
  return hasDeepDive
    ? (["learn", "predict", "debug", "compare", "blank-page"] as LessonKind[])
    : (["learn", "read", "debug", "blank-page", "build"] as LessonKind[]);
}

function makeLessonSet(language: Exclude<LanguageId, "python">, chapter: number, plan: ChapterPlan, sample: Sample, hasDeepDive: boolean): Lesson[] {
  const baseRecap = [
    `${plan.concepts[0] ?? plan.title} is a concrete ${language === "htmlcss" ? "browser" : language} concept, not a chapter title only.`,
    `Reading, prediction, debugging, and blank-page practice all support ${plan.title.toLowerCase()}.`,
    `The strongest honest verification available here is ${verificationFor(language, sample, checkerFor(language, sample)).join(", ")}.`,
  ];
  return lessonKindsFor(plan, hasDeepDive).map((kind, index) => {
    const override = plan.authoredLessons?.[kind];
    const exercise = override?.exercise ?? exerciseForKind(language, kind, plan.title, sample, plan);
    const authoredDepth = override?.authoredDepth ?? "scaffolded";
    return {
      id: `${language}-${chapter}-${index + 1}`,
      chapter,
      order: index + 1,
      kind,
      minutes: override?.minutes ?? (["blank-page", "build", "integration"].includes(kind) ? 32 : kind === "debug" ? 30 : 27),
      title: override?.title ?? `${labelForKind(kind)}: ${plan.title}`,
      summary: override?.summary ?? summaryForKind(kind, plan.title, plan, language),
      learningGoals: override?.learningGoals ?? learningGoalsForKind(kind, plan),
      explanation: override?.explanation ?? explanationForKind(kind, plan.title, sample, plan, language),
      keywordNotes: override?.keywordNotes ?? (plan.terminology ?? plan.concepts).slice(0, 4),
      examples: override?.examples ?? examplesForKind(language, kind, sample, plan),
      exercise,
      recap: override?.recap ?? baseRecap,
      decisionGuide: override?.decisionGuide ?? commonGuide(language, plan),
      readingCheck: override?.readingCheck ?? readingCheckForKind(kind, plan.title, sample, plan),
      verification: override?.verification ?? verificationFor(language, sample, exercise.checker),
      quality: qualityFor(kind, plan, authoredDepth, override?.quality),
    };
  });
}

function makeDeepDive(language: Exclude<LanguageId, "python">, dive: DeepDive, order: number): Lesson {
  const sample = staticSample(dive.title, dive.code, dive.output, dive.explanation, dive.required, dive.hints);
  const exercise: Exercise = {
    prompt: dive.prompt,
    starterCode: dive.starterCode,
    solution: dive.solution,
    solutionExplanation: `This solution uses the language-specific constructs required for the lab. ${dive.choices.map((choice) => choice.reason).join(" ")}`,
    testCases: [{ label: `${dive.title} result`, expected: dive.expected }],
    hints: dive.hints,
    checker: checkerFor(language, sample, true),
  };
  return {
    id: `${language}-${dive.chapter}-${order}`,
    chapter: dive.chapter,
    order,
    kind: "deep-dive",
    minutes: 42,
    title: `Lab: ${dive.title}`,
    summary: dive.summary,
    learningGoals: ["Combine the connected chapter ideas", "Trace a normal path and an edge path", "Build a focused language-specific solution from a blank editor"],
    explanation: dive.explanation,
    keywordNotes: dive.keywords,
    examples: [
      example(sample, "normal case", dive.code, dive.output, "The normal case connects the chapter's major concepts into one small program."),
      example(sample, "edge case", dive.edgeCode, dive.edgeOutput, "The edge case makes the failure or boundary behavior explicit instead of assuming every input is ideal."),
    ],
    exercise,
    recap: ["This lab combines a group of concepts rather than introducing another isolated keyword.", "The edge path is part of the program design, not an afterthought.", "A clear small application is the foundation for a larger professional project."],
    decisionGuide: dive.choices,
    readingCheck: dive.reading,
    verification: verificationFor(language, sample, exercise.checker),
    quality: qualityFor("deep-dive", { title: dive.title, focus: dive.explanation, concepts: dive.keywords, project: { title: dive.title, brief: dive.summary, scenario: dive.summary, requirements: [], milestones: [], acceptanceCriteria: [], edgeCases: [], extensionTasks: [], rubric: [], prompt: dive.prompt }, test: [] }, "deep-dive"),
  };
}

function projectFor(definition: CourseDefinition, plan: ChapterPlan, sample: Sample): ProjectExercise {
  const requiredPatterns = plan.project.requiredPatterns ?? [...sample.required, definition.id === "htmlcss" ? "Modified practice output" : "modified"];
  return {
    prompt: plan.project.prompt,
    starterCode: plan.project.starterCode ?? blankStarter(definition.id),
    solution: plan.project.solution ?? modifiedCode(definition.id, sample.code),
    solutionExplanation: plan.project.solutionExplanation ?? `This project combines ${plan.concepts.slice(0, 2).join(" and ")} in a deliberate small build. The verification stays honest about what the browser can and cannot check.`,
    testCases: plan.project.testCases ?? [{ label: `${plan.title} project`, expected: sample.output }],
    hints: plan.project.hints ?? sample.hints,
    checker: definition.id === "javascript" && sample.runtime && !plan.project.requiredPatterns ? undefined : { mode: plan.project.checkerMode ?? (definition.id === "htmlcss" ? "html" : "patterns"), requiredPatterns, successMessage: "Required chapter structure and acceptance criteria evidence are present." },
    title: plan.project.title,
    brief: plan.project.brief,
    scenario: plan.project.scenario,
    constraints: plan.project.constraints,
    starterState: plan.project.starterState,
    requirements: plan.project.requirements,
    milestones: plan.project.milestones,
    acceptanceCriteria: plan.project.acceptanceCriteria,
    edgeCases: plan.project.edgeCases,
    checks: plan.project.checks,
    extensionTasks: plan.project.extensionTasks,
    rubric: plan.project.rubric,
  };
}

export function buildCourse(definition: CourseDefinition): Course {
  const samples = samplesFor(definition.id);
  const chapters: Chapter[] = definition.chapterPlans.map((plan, index) => {
    const deepDive = definition.deepDives?.find((dive) => dive.chapter === index + 1);
    const lessons = makeLessonSet(definition.id, index + 1, plan, samples[index], Boolean(deepDive));
    if (deepDive) lessons.push(makeDeepDive(definition.id, deepDive, lessons.length + 1));
    return {
      number: index + 1,
      title: plan.title,
      description: plan.focus,
      lessons,
      project: projectFor(definition, plan, samples[index]),
      test: plan.test,
      cumulativeTest: definition.cumulativeTests?.[index + 1] ? [...definition.cumulativeTests[index + 1]!] : undefined,
      available: true,
      major: plan.major,
      prerequisiteChapters: plan.prerequisiteChapters,
      qualitySummary: plan.qualitySummary ?? [
        `Core concepts: ${plan.concepts.join(", ")}.`,
        `Project focus: ${plan.project.title}.`,
        `Verification: ${verificationFor(definition.id, samples[index], checkerFor(definition.id, samples[index])).join(", ")}.`,
      ],
    };
  });
  return { ...definition, chapters };
}
