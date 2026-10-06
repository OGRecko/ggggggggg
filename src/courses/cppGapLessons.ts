import type { Example } from "../data/types";
import { authoredLesson, type LessonOverrideLibrary } from "./chapterPlanHelpers";

/**
 * C++ gap lessons for topics the scaffolded chapter plans named but never demonstrated.
 * Every program in this file was compiled and run locally with
 * g++ 12.2.0 -std=c++20 -Wall -Wextra with no warnings, and the documented output is what
 * that build actually printed. CodeForge still performs structural review only for C++ in
 * the browser, so these lessons teach the native workflow without claiming the browser
 * compiled anything.
 */

const cppGapMistakes: Example["mistakes"] = [
  { mistake: "Changing an object through a read-only access path", error: "A compile error about const, or surprising mutation through an alias", fix: "Mark read-only member functions const and borrow large parameters as const T&." },
  { mistake: "Overloading an operator whose meaning is not obvious", error: "Code that compiles but misleads every reader", fix: "Match the built-in meaning of the symbol, or write a clearly named method instead." },
  { mistake: "Reading a moved-from object as if it still held its old value", error: "An unspecified value rather than the original data", fix: "After a move, assign a fresh value before reading the object again." },
];

const example = (title: string, code: string, output: string, explanation: string, lines: string[]): Example => ({
  title, code, output, explanation, lines, mistakes: cppGapMistakes,
});

export const cppGapLessons: LessonOverrideLibrary = {
  7: {
    compare: authoredLesson({
      title: "Const-correctness in class interfaces",
      minutes: 29,
      summary: "Use const to promise that a function will not change the object it reads, and pass large arguments by const reference instead of copying them.",
      learningGoals: ["Mark read-only member functions const", "Pass large inputs by const reference", "Explain what the compiler rejects when a const promise is broken"],
      explanation: "const is a promise written into a signature. A member function declared const states that calling it will not modify the object, which lets the call be made through a const reference or on a const object. Marking a parameter as const T& borrows the caller’s object for reading instead of copying it, which matters when that object owns a large buffer. The compiler enforces the promise: assigning to a data member inside a const member function is a compile error, and calling a non-const member through a const reference is rejected too. That is why const-correctness is a design tool rather than decoration: the signature tells the next reader exactly what the function is allowed to do.",
      keywordNotes: ["int pages() const places const after the parameter list and promises the call will not modify the object.", "const std::vector<int>& is a read-only borrow: no copy is made, and the callee cannot mutate the caller’s data.", "A non-const member function cannot be called through a const reference, so the compiler catches the mistake early.", "Two overloads may differ only by const, which is how a container offers both read-only and mutable access paths."],
      examples: [
        example(
          "A const member function promises not to mutate",
          "#include <iostream>\nclass Reading {\n    int pages_;\npublic:\n    explicit Reading(int pages) : pages_(pages) {}\n    int pages() const { return pages_; }\n    void add(int more) { pages_ += more; }\n};\nint main() {\n    Reading reading{12};\n    reading.add(3);\n    std::cout << reading.pages() << '\\n';\n    return 0;\n}",
          "15",
          "pages() is declared const, so it promises only to read the stored count, while add() is non-const because it changes state. Because reading is a non-const object, both calls are legal here; the promise would block add() the moment reading became const.",
          ["Line 1: iostream is included so the class behavior becomes visible as console output.", "Line 2: class Reading begins the small value type that owns one piece of state.", "Line 3: pages_ is the private data member. The trailing underscore is a common convention for member state.", "Line 4: public: begins the part of the class other code is allowed to use.", "Line 5: explicit Reading(int pages) initializes pages_ in the member initializer list, so the object is never briefly unset.", "Line 6: int pages() const reads the count. The const keyword is the promise that this call cannot change the object.", "Line 7: void add(int more) deliberately omits const because it must modify pages_.", "Line 8: The class definition ends with its closing brace and semicolon.", "Line 9: main is the entry point of the program.", "Line 10: reading is constructed with 12, so the object starts in a known valid state.", "Line 11: add(3) is legal because reading is a non-const object, and it updates the stored count to 15.", "Line 12: pages() is called on the same object and prints the updated count, 15.", "Line 13: main returns 0 to signal that the program finished normally.", "Line 14: The closing brace ends main, so every local object in this example is destroyed here."],
        ),
        example(
          "Borrow a large argument for reading only",
          "#include <iostream>\n#include <vector>\ndouble total(const std::vector<int>& values) {\n    double sum = 0;\n    for (int value : values) sum += value;\n    return sum;\n}\nint main() {\n    std::vector<int> scores{2, 4, 6};\n    std::cout << total(scores) << '\\n';\n    return 0;\n}",
          "12",
          "The parameter is a const reference, so the vector is borrowed rather than copied and the function cannot mutate the caller’s data. A copy would produce the same answer while doing unnecessary work for large inputs.",
          ["Line 1: iostream supplies the output used at the end of the example.", "Line 2: vector is included because the helper reads a standard container.", "Line 3: total takes const std::vector<int>&, a read-only borrow: nothing is copied and the function cannot change the vector.", "Line 4: sum starts at 0.0 so the accumulation keeps a decimal result.", "Line 5: The range-based for loop visits each value without an index, converting each int into the double accumulator on the way.", "Line 6: The accumulated total is returned to the caller.", "Line 7: The helper definition ends.", "Line 8: main begins the program.", "Line 9: scores owns three int values and remains the caller’s object throughout.", "Line 10: total borrows scores, so no second container is created just to pass the data.", "Line 11: main returns 0.", "Line 12: The closing brace ends the program."],
        )
      ],
      exercise: {
        prompt: "Write a Counter class with a private int value_, a constructor taking a start value, a non-const increment() that adds 1, and a const value() getter. Construct Counter counter{4}, call increment(), and print value() so the output is 5.",
        starterCode: "#include <iostream>\n\n// Add one const getter and one mutating method\n",
        solution: "#include <iostream>\nclass Counter {\n    int value_;\npublic:\n    explicit Counter(int start) : value_(start) {}\n    void increment() { value_ += 1; }\n    int value() const { return value_; }\n};\nint main() {\n    Counter counter{4};\n    counter.increment();\n    std::cout << counter.value() << '\\n';\n    return 0;\n}",
        solutionExplanation: "increment() is non-const because it changes state, while value() is const because it only reads. counter is a non-const object, so both calls are permitted and the printed value is 5.",
        testCases: [{ label: "Shared int result", expected: "5" }],
        hints: ["Declare value() as int value() const.", "Declare increment() without const.", "Initialize value_ in the constructor initializer list."],
        checker: {
          mode: "patterns",
          requiredPatterns: ["class\\s+Counter", "value\\(\\)\\s+const", "void\\s+increment", "std::cout"],
          successMessage: "The class separates a const getter from a mutating method.",
        },
      },
      recap: ["const on a member function is a promise the compiler enforces, not documentation-only.", "A const reference parameter borrows the caller’s object instead of copying it.", "Signatures that state read-only intent make large-object APIs cheaper and easier to review."],
      readingCheck: {
        prompt: "Why can pages() be called on an object held through a const reference while add() cannot?",
        choices: ["Because add() is not marked const, so the compiler rejects that call through a const access path", "Because int members cannot be changed", "Because const references make copies of the object", "Because member functions ignore const"],
        correctIndex: 0,
        explanation: "The const qualifier travels with the promise: a const reference only permits member functions that are themselves declared const.",
      },
      decisionGuide: [
        { use: "a const member function for every read-only operation", insteadOf: "leaving read-only methods non-const for convenience", reason: "The promise lets callers hold the object through a const reference and still read it, which is what keeps large objects cheap to pass around." },
        { use: "const T& for parameters the function only reads", insteadOf: "passing by value and copying the whole container", reason: "Borrowing avoids an unnecessary copy while still preventing accidental mutation of the caller’s data." },
      ],
      quality: { codeReading: true, prediction: true, debugging: true, modification: true, edgeCase: true },
    }),
  },
  8: {
    design: authoredLesson({
      title: "Operator overloading with clear meaning",
      minutes: 30,
      summary: "Give a value type operators that match its mathematical or textual meaning, and keep the operator contract unsurprising.",
      learningGoals: ["Define a binary operator as a free function", "Support equality and streaming for a value type", "Decide when an operator would be misleading"],
      explanation: "An overloaded operator is a function with a familiar call syntax, so it should behave the way the symbol already behaves for built-in types. A value type that adds two coordinates can define operator+ as a free function taking two const references and returning a new value. Equality should compare the state a reader would consider meaningful, and operator<< lets the type print itself so debugging output and test messages stay consistent. The dangerous case is a symbol whose meaning becomes guesswork, such as using + to push into a queue or == to compare only one field of a record: readers then carry two mental models for one symbol. Overload an operator when the meaning is obvious, and write a named function when it is not.",
      keywordNotes: ["operator+ can be a free function taking two const references and returning a new value, which keeps both operands symmetric.", "operator== should compare every field that defines the object’s value, because callers expect equality to mean equal.", "operator<< returns std::ostream& so several values can be chained in one output statement.", "Defining an operator for a type is a promise about meaning; a surprising symbol is worse than a clearly named method."],
      examples: [
        example(
          "Add, compare, and print a value type",
          "#include <iostream>\nstruct Point {\n    int x;\n    int y;\n};\nPoint operator+(const Point& left, const Point& right) {\n    return Point{left.x + right.x, left.y + right.y};\n}\nbool operator==(const Point& left, const Point& right) {\n    return left.x == right.x && left.y == right.y;\n}\nstd::ostream& operator<<(std::ostream& out, const Point& point) {\n    return out << '(' << point.x << \", \" << point.y << ')';\n}\nint main() {\n    Point a{1, 2};\n    Point b{3, 4};\n    Point sum = a + b;\n    std::cout << sum << '\\n';\n    std::cout << (sum == Point{4, 6}) << '\\n';\n    return 0;\n}",
          "(4, 6)\n1",
          "operator+ returns a new Point instead of mutating either operand, operator== compares both coordinates, and operator<< teaches the stream how to print the type. Each definition keeps the built-in meaning of its symbol.",
          ["Line 1: iostream is included so the streaming operator can be used at the end of the example.", "Line 2: struct Point begins an aggregate value type with public data.", "Line 3: x is one coordinate of the value.", "Line 4: y is the other coordinate; together they define the value.", "Line 5: The struct ends; Point is a plain value with no invariant to protect yet.", "Line 6: operator+ takes both operands by const reference and returns a new Point by value, so neither input is modified.", "Line 7: The returned Point is built from the sum of the matching coordinates, mirroring how the symbol adds built-in values.", "Line 8: The addition operator definition ends.", "Line 9: operator== compares both fields, because equality for this type must mean both coordinates agree.", "Line 10: The comparison combines two equality tests and returns a bool.", "Line 11: The equality operator ends.", "Line 12: operator<< takes the stream and the value, which is the shape the standard library expects.", "Line 13: It writes the value and returns the stream itself so further output can be chained.", "Line 14: The streaming operator ends.", "Line 15: main begins the program.", "Line 16: a holds the coordinates (1, 2).", "Line 17: b holds (3, 4).", "Line 18: sum is a brand-new Point produced by operator+, and both a and b keep their original values.", "Line 19: Printing sum uses the streaming operator and produces (4, 6).", "Line 20: Comparing against a freshly built Point{4, 6} prints 1, which is how a true bool appears in output.", "Line 21: main returns 0.", "Line 22: The closing brace ends the program."],
        ),
        example(
          "Make a type printable for debugging",
          "#include <iostream>\n#include <string>\nstruct Lesson {\n    std::string title;\n    int minutes;\n};\nstd::ostream& operator<<(std::ostream& out, const Lesson& lesson) {\n    return out << lesson.title << \" (\" << lesson.minutes << \" min)\";\n}\nint main() {\n    Lesson first{\"Loops\", 30};\n    Lesson second{\"Files\", 20};\n    std::cout << first << '\\n' << second << '\\n';\n    return 0;\n}",
          "Loops (30 min)\nFiles (20 min)",
          "The streaming operator lives outside the class, so it works with any ostream, including the streams a test harness might pass. Because it returns the stream, two values can be printed in one chained statement.",
          ["Line 1: iostream is included for the stream types the operator uses.", "Line 2: string is included because the type stores a title.", "Line 3: struct Lesson begins the value type.", "Line 4: title is the readable name of the item.", "Line 5: minutes stores the estimated duration as an int.", "Line 6: The struct ends.", "Line 7: operator<< is declared with the stream first and the value second, matching how streaming is written at the call site.", "Line 8: The body writes the title, a space, the minutes in parentheses, and a unit label.", "Line 9: Returning out is what allows chaining, because the expression keeps producing the stream itself.", "Line 10: main begins the program.", "Line 11: The first Lesson is created with its title and duration.", "Line 12: The second Lesson is created the same way.", "Line 13: One chained statement prints both values, each on its own line.", "Line 14: main returns 0.", "Line 15: The closing brace ends the program."],
        )
      ],
      exercise: {
        prompt: "Define struct Score { int points; }; then write a free operator+(const Score&, int) returning a new Score, plus an operator<< that prints only the points. Print base + 3 with Score base{7} so the output is 10.",
        starterCode: "#include <iostream>\n\n// One value type, one addition operator, one streaming operator\n",
        solution: "#include <iostream>\nstruct Score {\n    int points;\n};\nScore operator+(const Score& left, int bonus) {\n    return Score{left.points + bonus};\n}\nstd::ostream& operator<<(std::ostream& out, const Score& score) {\n    return out << score.points;\n}\nint main() {\n    Score base{7};\n    std::cout << (base + 3) << '\\n';\n    return 0;\n}",
        solutionExplanation: "operator+ returns a new Score rather than mutating the original, and operator<< defines how that value appears in output. Passing the bonus as an int keeps the call site reading like ordinary addition.",
        testCases: [{ label: "Score plus bonus", expected: "10" }],
        hints: ["Write operator+ as a free function outside the struct.", "Return Score{left.points + bonus} from the operator.", "Return the stream from operator<< so it can appear in a print statement."],
        checker: {
          mode: "patterns",
          requiredPatterns: ["struct\\s+Score", "operator\\+", "operator<<", "std::cout"],
          successMessage: "Both operators are declared and used with their built-in meaning intact.",
        },
      },
      recap: ["An overloaded operator is a function, so its meaning should match what the symbol already means.", "Returning a new value from arithmetic operators keeps both operands unchanged and predictable.", "operator<< makes a type printable everywhere, including debugging output and test failure messages."],
      readingCheck: {
        prompt: "Why does operator<< return std::ostream& instead of void?",
        choices: ["So several values can be chained in one output statement", "Because void is illegal in C++", "Because the stream must be copied", "Because it must modify the Point"],
        correctIndex: 0,
        explanation: "Returning the stream keeps the expression flowing, which is why std::cout << a << b << '\\n' works for built-in types and for well-behaved user types.",
      },
      decisionGuide: [
        { use: "operators that mirror the built-in meaning", insteadOf: "symbols used for unrelated side effects", reason: "Readers already know what + and == mean, so matching that meaning makes the type predictable instead of surprising." },
        { use: "a named method when no operator has an obvious meaning", insteadOf: "forcing a symbol onto a workflow", reason: "A descriptive name such as enqueue documents intent better than an ambiguous symbol." },
      ],
      quality: { codeReading: true, prediction: true, debugging: true, modification: true, edgeCase: true },
    }),
  },
  10: {
    read: authoredLesson({
      title: "Ranges and views for lazy pipelines",
      minutes: 30,
      summary: "Compose filters and transformations with C++20 views, and understand why a filtered view has no cheap size.",
      learningGoals: ["Compose views::filter and views::transform", "Read a pipeline as one left-to-right flow", "Explain why filtered views cannot report size()"],
      explanation: "A range is anything with a beginning and an end, and a view is a cheap, non-owning wrapper over a range. Because views are lazy, writing values | views::filter(pred) | views::transform(fn) builds a description of work rather than a new container: each element is pulled through the pipeline only when the loop asks for it. Laziness explains an important limitation, because a filtered view cannot answer size() without examining the elements, so std::ranges::distance is used to count them. Algorithms such as std::ranges::sort accept the range directly, which removes the begin/end pair from the call site and the chance of pairing iterators from two different containers.",
      keywordNotes: ["values | std::views::filter(predicate) produces a lazy view that yields only the elements the predicate accepts.", "views::transform(fn) applies fn as each element passes through, without allocating a second container.", "A filtered view has no constant-time size(), so std::ranges::distance counts the elements instead.", "std::ranges::sort(values) takes the range directly, which is shorter and less error-prone than passing two iterators."],
      examples: [
        example(
          "Compose a lazy filter and transform",
          "#include <iostream>\n#include <ranges>\n#include <vector>\nint main() {\n    std::vector<int> values{1, 2, 3, 4, 5, 6};\n    auto squares_of_evens = values\n        | std::views::filter([](int value) { return value % 2 == 0; })\n        | std::views::transform([](int value) { return value * value; });\n    for (int value : squares_of_evens) std::cout << value << '\\n';\n    std::cout << std::ranges::distance(squares_of_evens) << '\\n';\n    return 0;\n}",
          "4\n16\n36\n3",
          "The pipeline squares even numbers only. Nothing is computed until the loop requests values, and the final count needs std::ranges::distance because a filtered view cannot know its own size without walking the elements.",
          ["Line 1: iostream is included for the output inside the loop.", "Line 2: ranges provides the views and the range algorithms used below.", "Line 3: vector supplies the owning container the view reads from.", "Line 4: main begins the program.", "Line 5: values owns the six integers the pipeline will read.", "Line 6: values | std::views::filter(...) starts the pipeline, so only accepted elements continue past this stage.", "Line 7: The predicate keeps even values, so 2, 4, and 6 survive this stage.", "Line 8: The survivors flow into views::transform, which squares each value as it passes through.", "Line 9: The loop pulls one value at a time through both stages, printing 4, 16, and 36.", "Line 10: distance walks the view to count the elements and prints 3, because a filtered view cannot provide size() without that walk.", "Line 11: main returns 0.", "Line 12: The closing brace ends the program, and no intermediate container was ever allocated."],
        ),
        example(
          "Sort a range and take a prefix",
          "#include <algorithm>\n#include <iostream>\n#include <ranges>\n#include <vector>\nint main() {\n    std::vector<int> values{5, 1, 4, 2, 3};\n    std::ranges::sort(values);\n    for (int value : values | std::views::take(3)) std::cout << value << '\\n';\n    std::cout << values.front() << '\\n';\n    return 0;\n}",
          "1\n2\n3\n1",
          "The range algorithm sorts the owning vector in place, then views::take yields only the first three elements of that sorted order without copying them. Sorting happens once, and the prefix view is a window onto the result.",
          ["Line 1: algorithm provides the sorting algorithm used in this example.", "Line 2: iostream supplies the output.", "Line 3: ranges provides views::take.", "Line 4: vector supplies the container.", "Line 5: main begins the program.", "Line 6: values holds five integers in an unordered sequence.", "Line 7: std::ranges::sort takes the whole range and sorts it in place, so values becomes 1, 2, 3, 4, 5.", "Line 8: views::take(3) yields only the first three sorted elements, lazily and without copying them.", "Line 9: front() reads the first element of the sorted container, which is 1 and confirms the sort happened.", "Line 10: main returns 0.", "Line 11: The closing brace ends the program."],
        )
      ],
      exercise: {
        prompt: "Create std::vector<int> values{1, 2, 3, 4, 5, 6}, build a lazy filtered view containing only the even values, sum them in a loop, and print the total so the output is 12.",
        starterCode: "#include <iostream>\n#include <ranges>\n#include <vector>\n\n// Filter lazily, then consume the view\n",
        solution: "#include <iostream>\n#include <ranges>\n#include <vector>\nint main() {\n    std::vector<int> values{1, 2, 3, 4, 5, 6};\n    auto evens = values | std::views::filter([](int value) { return value % 2 == 0; });\n    int total = 0;\n    for (int value : evens) total += value;\n    std::cout << total << '\\n';\n    return 0;\n}",
        solutionExplanation: "The view describes the filter without creating a new container, and the loop is what actually pulls each even value through. The running total is printed once after the loop finishes.",
        testCases: [{ label: "Sum of even values", expected: "12" }],
        hints: ["Build the view with values | std::views::filter(...).", "Keep a running int total inside the loop.", "Print the total after the loop finishes."],
        checker: {
          mode: "patterns",
          requiredPatterns: ["std::views::filter", "std::vector<int>", "std::cout"],
          successMessage: "The pipeline is lazy and the total is computed while consuming the view.",
        },
      },
      recap: ["Views describe work lazily instead of allocating intermediate containers.", "A pipeline reads left to right: filter first, transform next, consume last.", "A filtered view has no cheap size, so ranges::distance counts the elements."],
      readingCheck: {
        prompt: "Why is std::ranges::distance used instead of calling size() on the filtered view?",
        choices: ["Because a filtered view cannot know its size without walking the elements", "Because size() was removed from the standard", "Because views own their elements", "Because distance sorts the view"],
        correctIndex: 0,
        explanation: "Laziness is the reason: counting a filtered range means evaluating the predicate for every element, which is exactly what distance does.",
      },
      decisionGuide: [
        { use: "a view pipeline for filter-then-transform work", insteadOf: "building temporary containers for every stage", reason: "The pipeline expresses the intent in reading order and avoids allocating storage the program may never need." },
        { use: "std::ranges::sort(values) for whole-range operations", insteadOf: "passing begin() and end() separately", reason: "A single range argument removes the chance of pairing iterators from two different containers." },
      ],
      quality: { codeReading: true, prediction: true, debugging: true, modification: true, edgeCase: true },
    }),
  },
  13: {
    design: authoredLesson({
      title: "Move semantics and the rule of five",
      minutes: 31,
      summary: "Own resources through members, add a move constructor when ownership transfer matters, and know what a moved-from object may still be used for.",
      learningGoals: ["Read a copy constructor beside a move constructor", "Explain why a move is cheaper than a deep copy", "State what is guaranteed about a moved-from object"],
      explanation: "A copy duplicates the resource a type owns, while a move transfers it. When a class holds a std::vector, a std::string, or another owner, defining a move constructor that steals the members and leaves the source empty is usually far cheaper than copying every element. The compiler selects the move when the argument is an rvalue, and std::move is the cast that allows that selection. A moved-from object is still a valid object: its invariants hold, it can be assigned to or destroyed, but its value is unspecified, so code should not read it and expect the old contents. Once a class writes its own destructor, copy operation, or move operation, the rest of the rule of five deserve an explicit decision: declare it, delete it, or default it deliberately.",
      keywordNotes: ["A move constructor takes T&& and steals the source’s resources instead of copying them.", "std::move does not move anything by itself: it casts an lvalue into an rvalue so overload resolution can choose the move constructor.", "A moved-from object stays valid but holds an unspecified value; assign to it, destroy it, or set it again.", "Writing one special member function usually means reviewing all five: destructor, copy constructor, copy assignment, move constructor, and move assignment."],
      examples: [
        example(
          "Watch a copy and a move happen",
          "#include <iostream>\n#include <string>\n#include <utility>\n#include <vector>\nclass Buffer {\n    std::vector<int> values_;\npublic:\n    explicit Buffer(std::vector<int> values) : values_(std::move(values)) {}\n    Buffer(const Buffer& other) : values_(other.values_) {\n        std::cout << \"copied\\n\";\n    }\n    Buffer(Buffer&& other) noexcept : values_(std::move(other.values_)) {\n        std::cout << \"moved\\n\";\n    }\n    std::size_t size() const { return values_.size(); }\n};\nint main() {\n    Buffer first{{1, 2, 3}};\n    Buffer copy = first;\n    Buffer taken = std::move(first);\n    std::cout << copy.size() << '\\n';\n    std::cout << taken.size() << '\\n';\n    std::cout << first.size() << '\\n';\n    return 0;\n}",
          "copied\nmoved\n3\n3\n0",
          "The copy constructor duplicates the vector and prints copied. std::move selects the move constructor, which transfers the buffer and prints moved. The moved-from source is still a valid object, which is why calling size() on it prints 0 instead of crashing.",
          ["Line 1: iostream is included for the markers the constructors print.", "Line 2: string is included as a familiar owning type, while the demonstration itself uses a vector member.", "Line 3: utility provides std::move.", "Line 4: vector supplies the owning member whose transfer is being demonstrated.", "Line 5: class Buffer begins the owning type.", "Line 6: values_ owns heap storage, which is exactly what makes a deep copy expensive.", "Line 7: public: begins the interface.", "Line 8: The constructor takes values by value and moves them into the member, so the member takes ownership of an existing buffer.", "Line 9: The copy constructor duplicates the source vector, which is the expensive path this example marks.", "Line 10: The copied marker prints whenever a deep copy happens.", "Line 11: The copy constructor body ends.", "Line 12: The move constructor is marked noexcept and steals the source buffer instead of copying it.", "Line 13: The moved marker prints when the transfer happens.", "Line 14: The move constructor body ends.", "Line 15: size() reports how many elements this object currently owns.", "Line 16: The class ends.", "Line 17: main begins the program.", "Line 18: first owns three elements.", "Line 19: Buffer copy = first; copies from an lvalue, so the copy constructor runs and prints copied.", "Line 20: std::move(first) casts first to an rvalue, so the move constructor runs and prints moved.", "Line 21: The copy still owns three elements because it made its own copy.", "Line 22: The moved-to object owns three elements, which it took from first.", "Line 23: The moved-from object is still valid but empty, so this prints 0 instead of reading stale data.", "Line 24: main returns 0.", "Line 25: The closing brace ends the program."],
        ),
        example(
          "A moved-from value is usable, not predictable",
          "#include <iostream>\n#include <string>\n#include <utility>\nint main() {\n    std::string text = \"codeforge\";\n    std::string taken = std::move(text);\n    std::cout << taken << '\\n';\n    std::cout << text.size() << '\\n';\n    text = \"reused\";\n    std::cout << text << '\\n';\n    return 0;\n}",
          "codeforge\n0\nreused",
          "After the move the string still has a valid size() and can be reassigned, which is the guarantee that matters. Its old characters are gone, so the code assigns a new value before reading it again instead of assuming what remains.",
          ["Line 1: iostream is included for the three output lines.", "Line 2: string is the moved type in this example.", "Line 3: utility provides std::move.", "Line 4: main begins the program.", "Line 5: text owns ten characters.", "Line 6: std::move converts text to an rvalue so the string move constructor transfers the buffer into taken.", "Line 7: Printing taken shows the characters now owned by the new string.", "Line 8: The moved-from string is still valid, and its size is 0 because the buffer was transferred.", "Line 9: Assigning a new value is always allowed on a moved-from object, which is what makes reuse safe.", "Line 10: Printing text shows the new value rather than anything left over from the move.", "Line 11: main returns 0.", "Line 12: The closing brace ends the program."],
        )
      ],
      exercise: {
        prompt: "Write a Tag class storing a std::string name_, with a constructor that moves its argument in, a noexcept move constructor, a deleted copy constructor, and a size() method. Construct Tag tag{\"codeforge\"}, move it into taken, and print taken.size() so the output is 9.",
        starterCode: "#include <iostream>\n#include <string>\n#include <utility>\n\n// One owner, one explicit move\n",
        solution: "#include <iostream>\n#include <string>\n#include <utility>\nclass Tag {\n    std::string name_;\npublic:\n    explicit Tag(std::string name) : name_(std::move(name)) {}\n    Tag(Tag&& other) noexcept : name_(std::move(other.name_)) {}\n    Tag(const Tag&) = delete;\n    std::size_t size() const { return name_.size(); }\n};\nint main() {\n    Tag tag{\"codeforge\"};\n    Tag taken = std::move(tag);\n    std::cout << taken.size() << '\\n';\n    return 0;\n}",
        solutionExplanation: "The move constructor transfers the internal string, and the deleted copy constructor documents that this type is intentionally move-only. Printing size() on the moved-to object proves the characters arrived.",
        testCases: [{ label: "Moved string size", expected: "9" }],
        hints: ["Take the name by value and move it into the member.", "Declare Tag(Tag&& other) noexcept with std::move on the member.", "Delete the copy constructor with Tag(const Tag&) = delete;."],
        checker: {
          mode: "patterns",
          requiredPatterns: ["class\\s+Tag", "std::move", "noexcept", "=\\s*delete"],
          successMessage: "The class states its move and copy policy explicitly.",
        },
      },
      recap: ["A move transfers ownership of a resource instead of duplicating it, which is why it can be far cheaper than a copy.", "Moved-from objects remain valid and assignable, but their contents are unspecified.", "Writing one special member function is the signal to review all five deliberately."],
      readingCheck: {
        prompt: "What does std::move(first) actually do?",
        choices: ["It casts the object to an rvalue so overload resolution can select the move constructor", "It deletes the object immediately", "It copies the object and then clears it", "It allocates a new buffer for first"],
        correctIndex: 0,
        explanation: "std::move is a cast. The actual transfer happens inside whichever constructor or assignment operator the compiler selects.",
      },
      decisionGuide: [
        { use: "move-only types when duplication makes no sense", insteadOf: "allowing copies that quietly duplicate a resource", reason: "A deleted copy constructor turns an expensive or meaningless operation into a compile error instead of a performance surprise." },
        { use: "an explicit move constructor when a type owns a resource", insteadOf: "relying on copies that duplicate every element", reason: "Transferring the buffer is constant-time work, while copying it grows with the amount of data." },
      ],
      quality: { codeReading: true, prediction: true, debugging: true, modification: true, edgeCase: true },
    }),
  },
  14: {
    compare: authoredLesson({
      title: "Exceptions across frames, and noexcept",
      minutes: 30,
      summary: "Throw a meaningful error, catch it by const reference where you can act on it, and use noexcept to state that a function will not throw.",
      learningGoals: ["Throw a standard exception type with a message", "Catch by const reference to avoid slicing", "Explain what noexcept promises callers"],
      explanation: "An exception carries the reason for a failure from the point of detection to the point that can act on it. Throwing std::invalid_argument with a message records both the kind of problem and the specific detail, and catching const std::exception& matches any standard exception without copying it, which also avoids slicing a derived type into a base object. Because only the frames that choose to handle the error run a handler, the recovery decision stays near the code that understands the failure. Marking a function noexcept is a promise that it will not let an exception escape, which the compiler can use when optimizing; the standard library favors move constructors that make this promise, which is why noexcept is common on moves.",
      keywordNotes: ["throw std::invalid_argument(\"...\") reports both the error category and the specific reason using standard types.", "catch (const std::exception& problem) catches any standard exception by reference and reads problem.what() for the message.", "noexcept is a promise that no exception will escape the function; breaking that promise terminates the program.", "Catch by const reference rather than by value so the exception object is not copied or sliced."],
      examples: [
        example(
          "Throw with a reason and catch it by reference",
          "#include <iostream>\n#include <stdexcept>\n#include <string>\nint parse_pages(const std::string& text) {\n    int pages = std::stoi(text);\n    if (pages <= 0) throw std::invalid_argument(\"pages must be positive\");\n    return pages;\n}\nint main() {\n    try {\n        std::cout << parse_pages(\"12\") << '\\n';\n        std::cout << parse_pages(\"0\") << '\\n';\n    } catch (const std::exception& problem) {\n        std::cout << \"caught: \" << problem.what() << '\\n';\n    }\n    return 0;\n}",
          "12\ncaught: pages must be positive",
          "The first call succeeds and prints 12. The second receives 0, which violates the function’s contract, so it throws with a message that names the rule. The catch handles any standard exception and prints the recorded reason instead of terminating the program.",
          ["Line 1: iostream is included for the two printed lines.", "Line 2: stdexcept provides the standard exception types used here.", "Line 3: string is the input type for the parser.", "Line 4: parse_pages returns an int or throws; the signature promises no error code.", "Line 5: std::stoi converts the text and itself throws std::invalid_argument for text such as seven.", "Line 6: The guard checks the business rule that a page count must be positive.", "Line 7: The throw records why the value was rejected, using a standard type instead of a custom one.", "Line 8: The function returns the accepted value.", "Line 9: The helper definition ends.", "Line 10: main begins the program.", "Line 11: try begins the region where an exception is expected and handled.", "Line 12: The first call passes 12, so the guard holds and 12 prints.", "Line 13: The second call passes 0, which breaks the rule, so the throw unwinds out of the function immediately.", "Line 14: catch binds the exception by const reference, so nothing is copied and the message is preserved.", "Line 15: The message recorded at the throw site prints, showing that the reason survived the unwind.", "Line 16: main returns 0.", "Line 17: The closing brace ends the program."],
        ),
        example(
          "noexcept and a caught standard error",
          "#include <iostream>\n#include <stdexcept>\n#include <vector>\nvoid log_size(const std::vector<int>& values) noexcept {\n    std::cout << values.size() << '\\n';\n}\nint main() {\n    std::vector<int> values{1, 2};\n    log_size(values);\n    try {\n        std::cout << values.at(5) << '\\n';\n    } catch (const std::out_of_range&) {\n        std::cout << \"range error handled\\n\";\n    }\n    std::cout << \"still running\\n\";\n    return 0;\n}",
          "2\nrange error handled\nstill running",
          "log_size is noexcept because nothing inside it can fail, which tells callers and the optimizer that no exception will escape. The vector access uses at(), which throws instead of reading out of bounds, and the handler prints a deliberate message before execution continues.",
          ["Line 1: iostream is included for output.", "Line 2: stdexcept supplies std::out_of_range.", "Line 3: vector supplies the container being indexed.", "Line 4: log_size is marked noexcept, promising that no exception leaves this function.", "Line 5: The body prints the size, an operation that cannot throw here.", "Line 6: The function ends.", "Line 7: main begins the program.", "Line 8: values owns two elements.", "Line 9: log_size prints 2 and the noexcept promise holds.", "Line 10: try begins the block that may fail.", "Line 11: at(5) checks the index and throws instead of touching memory outside the container, which is the difference from operator[].", "Line 12: catch handles exactly the standard range-error type.", "Line 13: The handler prints its own deliberate message rather than exposing an implementation-specific string.", "Line 14: The catch block ends after the handled failure.", "Line 15: Execution continues normally, which proves the exception was handled rather than fatal.", "Line 16: main returns 0.", "Line 17: The closing brace ends the program."],
        )
      ],
      exercise: {
        prompt: "Write parse_count(const std::string& text) that returns std::stoi(text) inside a try block and returns -1 from a catch of std::invalid_argument. Print parse_count(\"7\") then parse_count(\"seven\") so the output is 7 and -1.",
        starterCode: "#include <iostream>\n#include <stdexcept>\n#include <string>\n\n// Convert, or report a deliberate fallback value\n",
        solution: "#include <iostream>\n#include <stdexcept>\n#include <string>\nint parse_count(const std::string& text) {\n    try {\n        return std::stoi(text);\n    } catch (const std::invalid_argument&) {\n        return -1;\n    }\n}\nint main() {\n    std::cout << parse_count(\"7\") << '\\n';\n    std::cout << parse_count(\"seven\") << '\\n';\n    return 0;\n}",
        solutionExplanation: "The valid text converts through std::stoi. The non-numeric text makes stoi throw std::invalid_argument, and the handler converts that failure into an explicit -1 instead of letting the program terminate.",
        testCases: [{ label: "Converted values", expected: "7\n-1" }],
        hints: ["Put std::stoi(text) inside a try block.", "Catch const std::invalid_argument&.", "Return -1 from the handler and print both results."],
        checker: {
          mode: "patterns",
          requiredPatterns: ["try\\s*\\{", "catch\\s*\\(\\s*const\\s+std::invalid_argument&", "std::stoi", "return\\s+-1"],
          successMessage: "The failure path is handled deliberately rather than terminating the program.",
        },
      },
      recap: ["An exception carries the reason for a failure to the frame that can act on it.", "Catch by const reference so the exception object is neither copied nor sliced.", "noexcept is a promise to callers as well as an optimization hint, which is why moves commonly use it."],
      readingCheck: {
        prompt: "Why does the second example use values.at(5) instead of values[5]?",
        choices: ["Because at() reports the invalid index by throwing, while operator[] is undefined behavior", "Because at() is faster than operator[]", "Because vector has no operator[]", "Because at() sorts the vector"],
        correctIndex: 0,
        explanation: "The chapter is about failure paths, so the checked accessor is what makes the failure catchable instead of undefined.",
      },
      decisionGuide: [
        { use: "exceptions for failures a caller can act on", insteadOf: "error codes that are easy to ignore", reason: "An exception cannot be silently skipped, and its message travels with the failure to the frame that decides what to do." },
        { use: "noexcept on operations that genuinely cannot fail", insteadOf: "marking everything noexcept by default", reason: "The promise is checked at runtime: if an exception does escape a noexcept function, the program terminates." },
      ],
      quality: { codeReading: true, prediction: true, debugging: true, modification: true, edgeCase: true },
    }),
  },
  15: {
    read: authoredLesson({
      title: "Lambdas, captures, and std::function",
      minutes: 30,
      summary: "Write a lambda where a callable is needed, choose what it captures deliberately, and know when std::function or a generic lambda earns its cost.",
      learningGoals: ["Read a capture list and say what the lambda owns", "Pass a lambda to a standard algorithm", "Choose between a plain lambda, a generic lambda, and std::function"],
      explanation: "A lambda is an object with a call operator, written where it is used. The capture list decides what the closure keeps: [minimum] copies the value when the lambda is created, so later changes to the original variable do not affect it, while [&minimum] stores a reference and therefore depends on that variable outliving the lambda. Standard algorithms such as std::count_if take a callable, which is where a lambda removes the need for a separate named function object. A generic lambda declares its parameters with auto, so one body works for several argument types. std::function erases the concrete type of any compatible callable, which is useful for storing callbacks but adds indirection, so a lambda passed straight to an algorithm is usually the better default.",
      keywordNotes: ["[minimum] captures by copy at the moment the lambda is created, so the closure owns its own value.", "[&value] captures by reference, which means the lambda must not outlive the variable it refers to.", "auto describe = [](const auto& value) { ... } is a generic lambda: its parameter types are deduced at each call.", "std::function<int(int)> stores any compatible callable behind one type, at the cost of type erasure and indirection."],
      examples: [
        example(
          "Capture by value for an algorithm",
          "#include <algorithm>\n#include <iostream>\n#include <string>\n#include <vector>\nint main() {\n    std::vector<std::string> names{\"ada\", \"bob\", \"cyd\"};\n    int minimum = 3;\n    auto long_enough = [minimum](const std::string& name) {\n        return static_cast<int>(name.size()) >= minimum;\n    };\n    std::cout << std::count_if(names.begin(), names.end(), long_enough) << '\\n';\n    return 0;\n}",
          "3",
          "The lambda captures minimum by copy, so the closure keeps its own 3. std::count_if calls the lambda once per element and the returned count is printed. Because the capture is by value, the lambda stays safe even if the enclosing variable changes or the lambda outlives this call.",
          ["Line 1: algorithm provides std::count_if.", "Line 2: iostream is included for the printed count.", "Line 3: string is the element type being examined.", "Line 4: vector supplies the container.", "Line 5: main begins the program.", "Line 6: The three names are the data the algorithm will inspect.", "Line 7: minimum is a local variable the lambda needs, which is what forces a capture decision.", "Line 8: The lambda begins with [minimum], capturing that value by copy when the lambda object is created.", "Line 9: The body compares each name’s length against the captured value, converting size() to int for the comparison.", "Line 10: The closing brace finishes the lambda body, and the whole object is stored in long_enough.", "Line 11: count_if calls the lambda once per element and prints how many returned true, which is 3.", "Line 12: main returns 0.", "Line 13: The closing brace ends the program."],
        ),
        example(
          "std::function and a generic lambda",
          "#include <functional>\n#include <iostream>\n#include <string>\n#include <vector>\nint main() {\n    std::function<int(int)> doubler = [](int value) { return value * 2; };\n    std::cout << doubler(21) << '\\n';\n    std::vector<std::string> names{\"ada\", \"bob\"};\n    auto describe = [](const auto& value) { return value.size(); };\n    std::cout << describe(names[0]) << '\\n';\n    return 0;\n}",
          "42\n3",
          "The first lambda is stored in std::function, which accepts any callable with the matching signature. The second is a generic lambda whose parameter type is deduced at each call, so the same object works for a string here and for another sized type later.",
          ["Line 1: functional provides std::function.", "Line 2: iostream is included for the two printed results.", "Line 3: string supplies the element type used by the generic lambda.", "Line 4: vector supplies the container.", "Line 5: main begins the program.", "Line 6: std::function<int(int)> stores any callable taking and returning an int, and the lambda body doubles its argument.", "Line 7: Calling doubler through the stored callable prints 42, showing that type erasure keeps the behavior.", "Line 8: names holds two strings for the generic lambda to inspect.", "Line 9: The generic lambda declares const auto& and calls size() in its body, so it requires a sized argument rather than any type at all.", "Line 10: Invoking the generic lambda on a string prints its length, 3 for ada.", "Line 11: main returns 0.", "Line 12: The closing brace ends the program."],
        )
      ],
      exercise: {
        prompt: "Create std::vector<int> values{1, 2, 3, 4, 5, 6} and a local int limit = 3. Write a lambda that captures limit by value and returns whether a value is greater than limit, then print std::count_if over the vector so the output is 3.",
        starterCode: "#include <algorithm>\n#include <iostream>\n#include <vector>\n\n// Capture the limit, then count with the lambda\n",
        solution: "#include <algorithm>\n#include <iostream>\n#include <vector>\nint main() {\n    std::vector<int> values{1, 2, 3, 4, 5, 6};\n    int limit = 3;\n    auto above_limit = [limit](int value) { return value > limit; };\n    std::cout << std::count_if(values.begin(), values.end(), above_limit) << '\\n';\n    return 0;\n}",
        solutionExplanation: "The capture list copies limit into the closure, so the comparison inside the lambda uses a stable value. count_if applies the lambda to every element, and the count of values above 3 is printed.",
        testCases: [{ label: "Values above the limit", expected: "3" }],
        hints: ["Write the lambda as [limit](int value) { return value > limit; }.", "Pass it as the third argument to std::count_if.", "Print the value returned by count_if."],
        checker: {
          mode: "patterns",
          requiredPatterns: ["count_if", "\\[limit\\]", "std::vector<int>"],
          successMessage: "The lambda captures by value and is used directly by a standard algorithm.",
        },
      },
      recap: ["A lambda is an object with a call operator, and its capture list decides what it owns.", "Capture by copy for safety, and by reference only when the referred variable is guaranteed to outlive the lambda.", "std::function erases a callable’s type for storage; generic lambdas deduce their parameter types per call."],
      readingCheck: {
        prompt: "Why is [limit] safer than [&limit] if the lambda is stored and used later?",
        choices: ["Because the copy keeps its own value and cannot dangle when the original variable goes out of scope", "Because references cannot be captured in C++", "Because the captured copy is faster to compare", "Because [&limit] copies the variable twice"],
        correctIndex: 0,
        explanation: "A reference capture stores the address of a variable; if the lambda outlives that variable, the capture dangles. A copy capture owns the value.",
      },
      decisionGuide: [
        { use: "a lambda passed directly to an algorithm", insteadOf: "a named function object defined far from its use", reason: "The behavior is readable exactly where it is applied, and the compiler can inline it without type erasure." },
        { use: "std::function only when the callable must be stored or swapped at runtime", insteadOf: "storing every callable in std::function by default", reason: "Type erasure adds indirection and can prevent inlining, so it is worth paying for storage, not for a local algorithm call." },
      ],
      quality: { codeReading: true, prediction: true, debugging: true, modification: true, edgeCase: true },
    }),
  },
  17: {
    design: authoredLesson({
      title: "Steady clocks and duration types with chrono",
      minutes: 27,
      summary: "Measure elapsed time with a steady clock, convert between duration units explicitly, and keep timing claims honest.",
      learningGoals: ["Measure elapsed work with steady_clock", "Convert durations with duration_cast", "Explain why wall-clock time is the wrong tool for measuring"],
      explanation: "Timing code has two traps: measuring with the wrong clock and misreading the unit. steady_clock only moves forward at a steady rate, so it is the right tool for elapsed durations, while system_clock can jump when the machine’s time is adjusted. A duration carries its unit in the type, and duration_cast converts between units explicitly, so a value that means minutes can be read as seconds or milliseconds without guessing. Because this browser lab cannot run a native binary, the examples print booleans and converted counts rather than timings: a program that prints \"3 ms\" is not evidence of anything, and real performance work needs a local build, optimization flags, repeated runs, and a profiler.",
      keywordNotes: ["std::chrono::steady_clock::now() returns a monotonic timestamp suitable for measuring elapsed time.", "auto elapsed = end - start produces a duration whose unit follows from the clock, so the type tracks the unit.", "duration_cast<seconds>(...) converts between duration units explicitly instead of silently truncating elsewhere.", "system_clock reports wall-clock time and can be corrected, which makes it unsuitable for measuring how long work took."],
      examples: [
        example(
          "Measure elapsed work without printing a timing",
          "#include <chrono>\n#include <iostream>\nint main() {\n    auto start = std::chrono::steady_clock::now();\n    int total = 0;\n    for (int value = 0; value < 5; ++value) total += value;\n    auto elapsed = std::chrono::steady_clock::now() - start;\n    std::cout << (elapsed >= std::chrono::steady_clock::duration::zero()) << '\\n';\n    std::cout << std::chrono::duration_cast<std::chrono::seconds>(std::chrono::milliseconds(2500)).count() << '\\n';\n    std::cout << total << '\\n';\n    return 0;\n}",
          "1\n2\n10",
          "The first line prints a bool comparison, so the output stays stable even though the measured value is not. The second converts a known duration from milliseconds to seconds, which shows the unit conversion clearly, and the third prints the ordinary work the measured region performed.",
          ["Line 1: chrono provides the clocks and duration types.", "Line 2: iostream is included for the three printed lines.", "Line 3: main begins the program.", "Line 4: start records a monotonic timestamp before the work begins.", "Line 5: total is the ordinary work product the program actually computes.", "Line 6: The loop adds the first five integers into total.", "Line 7: Subtracting two steady_clock timestamps produces a duration, and assigning it keeps both the value and its unit.", "Line 8: Comparing against zero prints 1 for true, so the output stays deterministic instead of exposing a machine-dependent number.", "Line 9: duration_cast converts 2500 milliseconds into seconds and prints 2, showing explicit unit conversion.", "Line 10: Printing the computed total shows the work the timed region actually performed.", "Line 11: main returns 0.", "Line 12: The closing brace ends the program."],
        ),
        example(
          "Convert between duration units",
          "#include <chrono>\n#include <iostream>\nint main() {\n    using namespace std::chrono;\n    auto window = minutes(2);\n    std::cout << duration_cast<seconds>(window).count() << '\\n';\n    std::cout << duration_cast<milliseconds>(window).count() << '\\n';\n    return 0;\n}",
          "120\n120000",
          "The same duration is read in two units. Because the unit lives in the type, the conversion is explicit and cannot be confused with reading a raw number.",
          ["Line 1: chrono supplies the duration aliases used here.", "Line 2: iostream is included for the two printed counts.", "Line 3: main begins the program.", "Line 4: using namespace std::chrono makes minutes, seconds, and milliseconds readable inside this function.", "Line 5: window stores exactly two minutes, with the unit carried by the type.", "Line 6: duration_cast converts those two minutes into seconds, which prints 120.", "Line 7: The same duration converts into milliseconds, which prints 120000.", "Line 8: main returns 0.", "Line 9: The closing brace ends the program."],
        )
      ],
      exercise: {
        prompt: "Measure a small loop with steady_clock: sum the integers 0 through 3, then print \"measured\" if the elapsed duration is at least zero, and print the total afterward so the output is measured then 6.",
        starterCode: "#include <chrono>\n#include <iostream>\n\n// Time a tiny region and keep the printed result deterministic\n",
        solution: "#include <chrono>\n#include <iostream>\nint main() {\n    auto start = std::chrono::steady_clock::now();\n    int total = 0;\n    for (int value = 0; value < 4; ++value) total += value;\n    auto elapsed = std::chrono::steady_clock::now() - start;\n    std::cout << (elapsed >= std::chrono::steady_clock::duration::zero() ? \"measured\" : \"impossible\") << '\\n';\n    std::cout << total << '\\n';\n    return 0;\n}",
        solutionExplanation: "The elapsed value is compared rather than printed, so the output stays reproducible. The total is separate evidence about the work the timed region performed.",
        testCases: [{ label: "Measured program", expected: "measured\n6" }],
        hints: ["Start with auto start = std::chrono::steady_clock::now();.", "Subtract the start from a second now() call to obtain a duration.", "Print the comparison result as text and print the total on the next line."],
        checker: {
          mode: "patterns",
          requiredPatterns: ["steady_clock", "now\\(\\)", "duration"],
          successMessage: "The measurement is real and the printed output stays deterministic.",
        },
      },
      recap: ["steady_clock measures elapsed time without jumping, while system_clock reports wall-clock time.", "Duration types carry their unit, and duration_cast converts explicitly.", "A printed timing is not evidence of performance; honest measurement needs a local build and repetition."],
      readingCheck: {
        prompt: "Why does the first example print a comparison instead of the elapsed milliseconds?",
        choices: ["Because a machine-dependent timing would not be a reproducible expected output", "Because milliseconds cannot be printed", "Because steady_clock has no duration type", "Because the loop is too fast to measure"],
        correctIndex: 0,
        explanation: "The lab shows the measurement workflow honestly: the code really measures, and the printed evidence stays stable so a learner can verify the program’s behavior.",
      },
      decisionGuide: [
        { use: "steady_clock for elapsed-time measurement", insteadOf: "system_clock, which can be adjusted while the program runs", reason: "Only a monotonic clock can answer how long work took, because it never moves backward or jumps forward." },
        { use: "duration_cast at the point where a unit is needed", insteadOf: "assuming a duration is already in a particular unit", reason: "The cast states the intended unit in code, so a reader never has to guess whether a number is seconds or milliseconds." },
      ],
      quality: { codeReading: true, prediction: true, debugging: true, modification: true, edgeCase: true },
    }),
  },
};
