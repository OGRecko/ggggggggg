import type { ProjectSolution } from "./chapterPlanHelpers";

/**
 * Authored C++ chapter project solutions, replacing the generated placeholder that older
 * chapters shipped (a chapter sample plus an injected std::cout << "modified").
 *
 * Verification: every solution below was compiled with `g++ -std=c++20 -Wall -Wextra -O1`
 * (zero warnings) and executed, and the recorded expected output is that program's real
 * stdout. CodeForge itself does not compile C++ in the browser, and the lesson text says so.
 */
export const cppProjectSolutions: Partial<Record<number, ProjectSolution>> = {
  // Chapter 1: Getting Started
  1: {
    solution: "#include <iostream>\n\n// The compiler translates this source file; the linker later combines the object file into an executable.\nint main() {\n    std::cout << \"Hello, C++!\" << '\\n';\n    return 0;\n}",
    solutionExplanation: "One translation unit with iostream output, and the comment names the compile and link stages. Compiled with g++ -std=c++20 -Wall -Wextra (zero warnings) and executed during authoring; CodeForge itself reviews C++ structurally in the browser.",
    expected: "Hello, C++!",
  },
  // Chapter 2: Types and Variables
  2: {
    solution: "#include <iostream>\n#include <string>\n\nint main() {\n    constexpr int goal = 3;\n    const std::string topic = \"loops\";\n    std::cout << goal << ' ' << topic << '\\n';\n    return 0;\n}",
    solutionExplanation: "constexpr fixes a value the compiler can use at compile time, while const std::string fixes a runtime value that is not meant to change. Compiled with g++ -std=c++20 -Wall -Wextra (zero warnings) and executed during authoring; CodeForge itself reviews C++ structurally in the browser.",
    expected: "3 loops",
  },
  // Chapter 3: Control Flow
  3: {
    solution: "#include <iostream>\n#include <vector>\n\nint main() {\n    std::vector<int> scores{3, -1, 4, 2};\n    int total = 0;\n    for (int score : scores) {\n        if (score < 0) {\n            continue;\n        }\n        total += score;\n    }\n    std::cout << (total >= 9 ? \"pass\" : \"review\") << '\\n';\n    return 0;\n}",
    solutionExplanation: "Non-negative scores are summed after continue skips -1, so the total 9 reaches the threshold and the ternary prints pass. Compiled with g++ -std=c++20 -Wall -Wextra (zero warnings) and executed during authoring; CodeForge itself reviews C++ structurally in the browser.",
    expected: "pass",
  },
  // Chapter 4: Functions and Scope
  4: {
    solution: "#include <iostream>\n#include <string>\n\nint double_value(int value) { return value * 2; }\nstd::string label(const std::string& text) { return text + \"!\"; }\n\nint main() {\n    std::cout << double_value(4) << ' ' << label(\"cpp\") << '\\n';\n    return 0;\n}",
    solutionExplanation: "double_value returns a value and label takes the text by const reference, so no copy is needed and the string cannot be mutated. Compiled with g++ -std=c++20 -Wall -Wextra (zero warnings) and executed during authoring; CodeForge itself reviews C++ structurally in the browser.",
    expected: "8 cpp!",
  },
  // Chapter 5: Strings and Containers
  5: {
    solution: "#include <array>\n#include <iostream>\n#include <string>\n#include <vector>\n\nint main() {\n    std::array<int, 3> goals{1, 2, 3};\n    std::vector<std::string> lessons{\"read\", \"build\"};\n    std::cout << goals.size() << ' ' << lessons.front() << '\\n';\n    return 0;\n}",
    solutionExplanation: "std::array carries its fixed size with the type, and std::vector owns a growable sequence; both print through their own interface. Compiled with g++ -std=c++20 -Wall -Wextra (zero warnings) and executed during authoring; CodeForge itself reviews C++ structurally in the browser.",
    expected: "3 read",
  },
  // Chapter 6: Pointers and References
  6: {
    solution: "#include <iostream>\n\nint main() {\n    int value = 3;\n    int* pointer = &value;\n    int& reference = value;\n    std::cout << *pointer << ' ' << reference << '\\n';\n    return 0;\n}",
    solutionExplanation: "The pointer reads the address of value and the reference is another name for the same int, so both reads print 3. Compiled with g++ -std=c++20 -Wall -Wextra (zero warnings) and executed during authoring; CodeForge itself reviews C++ structurally in the browser.",
    expected: "3 3",
  },
  // Chapter 7: Classes and RAII
  7: {
    solution: "#include <iostream>\n\nstruct Guard {\n    ~Guard() { std::cout << \"cleanup\" << '\\n'; }\n};\n\nint main() {\n    Guard guard;\n    std::cout << \"work\" << '\\n';\n    return 0;\n}",
    solutionExplanation: "The destructor runs when guard goes out of scope, so cleanup is printed after work even though no explicit close call appears. Compiled with g++ -std=c++20 -Wall -Wextra (zero warnings) and executed during authoring; CodeForge itself reviews C++ structurally in the browser.",
    expected: "work\ncleanup",
  },
  // Chapter 8: Object-Oriented C++
  8: {
    solution: "#include <iostream>\n#include <string>\n\nstruct Formatter {\n    virtual std::string format() const = 0;\n    virtual ~Formatter() = default;\n};\n\nstruct Loud : Formatter {\n    std::string format() const override { return \"LOUD\"; }\n};\n\nint main() {\n    Loud loud;\n    std::cout << loud.format() << '\\n';\n    return 0;\n}",
    solutionExplanation: "The pure virtual function makes Formatter abstract, and the override in Loud is what the dynamic call actually runs. Compiled with g++ -std=c++20 -Wall -Wextra (zero warnings) and executed during authoring; CodeForge itself reviews C++ structurally in the browser.",
    expected: "LOUD",
  },
  // Chapter 9: Templates and Generic Programming
  9: {
    solution: "#include <iostream>\n\ntemplate <typename T>\nT first(T left, T) { return left; }\n\nint main() {\n    std::cout << first(3, 4) << '\\n';\n    return 0;\n}",
    solutionExplanation: "The template deduces T from the arguments, and the second parameter is intentionally unnamed because only the first is returned. Compiled with g++ -std=c++20 -Wall -Wextra (zero warnings) and executed during authoring; CodeForge itself reviews C++ structurally in the browser.",
    expected: "3",
  },
  // Chapter 10: Standard Library Algorithms
  10: {
    solution: "#include <algorithm>\n#include <iostream>\n#include <vector>\n\nint main() {\n    std::vector<int> values{2, 7, 4};\n    std::cout << *std::max_element(values.begin(), values.end()) << '\\n';\n    return 0;\n}",
    solutionExplanation: "std::max_element returns an iterator to the largest element, so the dereferenced result is 7. Compiled with g++ -std=c++20 -Wall -Wextra (zero warnings) and executed during authoring; CodeForge itself reviews C++ structurally in the browser.",
    expected: "7",
  },
  // Chapter 11: Algorithms I
  11: {
    solution: "#include <algorithm>\n#include <iostream>\n#include <vector>\n\nint main() {\n    std::vector<int> values{2, 4, 6};\n    std::cout << (std::find(values.begin(), values.end(), 4) != values.end()) << '\\n';\n    return 0;\n}",
    solutionExplanation: "std::find locates 4 inside the range, and comparing the iterator with end() reports true, which streams as 1. Compiled with g++ -std=c++20 -Wall -Wextra (zero warnings) and executed during authoring; CodeForge itself reviews C++ structurally in the browser.",
    expected: "1",
  },
  // Chapter 12: Data Structures
  12: {
    solution: "#include <iostream>\n#include <queue>\n#include <string>\n#include <unordered_map>\n\nint main() {\n    std::queue<std::string> jobs;\n    std::unordered_map<std::string, int> priority;\n    jobs.push(\"first\");\n    priority[\"first\"] = 1;\n    std::cout << jobs.front() << ' ' << priority[\"first\"] << '\\n';\n    return 0;\n}",
    solutionExplanation: "The queue stores ordered work while the unordered_map answers the key lookup, and both are read through front() and operator[]. Compiled with g++ -std=c++20 -Wall -Wextra (zero warnings) and executed during authoring; CodeForge itself reviews C++ structurally in the browser.",
    expected: "first 1",
  },
  // Chapter 13: Memory Management
  13: {
    solution: "#include <iostream>\n#include <memory>\n\nint main() {\n    // shared_ptr needs weak_ptr when two owners would otherwise keep each other alive in a cycle.\n    auto value = std::make_unique<int>(3);\n    std::cout << *value << '\\n';\n    return 0;\n}",
    solutionExplanation: "make_unique creates one owning pointer whose value is released automatically, and the comment names the cycle weak_ptr exists to break. Compiled with g++ -std=c++20 -Wall -Wextra (zero warnings) and executed during authoring; CodeForge itself reviews C++ structurally in the browser.",
    expected: "3",
  },
  // Chapter 14: Error Handling and Testing
  14: {
    solution: "#include <cassert>\n#include <iostream>\n\nint add(int left, int right) { return left + right; }\n\nint main() {\n    // An assertion catches a broken invariant; undefined behavior needs a sanitizer instead.\n    assert(add(2, 3) == 5);\n    std::cout << \"checked\" << '\\n';\n    return 0;\n}",
    solutionExplanation: "The assertion documents the expected sum, and the comment separates failed invariants from undefined behavior that only a sanitizer can catch. Compiled with g++ -std=c++20 -Wall -Wextra (zero warnings) and executed during authoring; CodeForge itself reviews C++ structurally in the browser.",
    expected: "checked",
  },
  // Chapter 15: Modern C++ Style
  15: {
    solution: "#include <iostream>\n#include <optional>\n#include <string_view>\n\n// Modern style keeps the intent local: a view avoids copying the text, and optional states\n// that the parsed port may be absent.\nstd::optional<int> parse_port(std::string_view text) {\n    if (text.empty()) {\n        return std::nullopt;\n    }\n    int value = 0;\n    for (const char digit : text) {\n        value = value * 10 + (digit - '0');\n    }\n    return value;\n}\n\nint main() {\n    const auto port = parse_port(\"8080\");\n    std::cout << port.value() << '\\n';\n    return 0;\n}",
    solutionExplanation: "The string_view parameter borrows the text without copying it, the range-for walks the characters, and optional.value() reads the parsed port 8080. Compiled with g++ -std=c++20 -Wall -Wextra (zero warnings) and executed during authoring; CodeForge itself reviews C++ structurally in the browser.",
    expected: "8080",
  },
  // Chapter 16: Concurrency
  16: {
    solution: "#include <iostream>\n#include <mutex>\n\nstruct Counter {\n    mutable std::mutex gate;\n    int value = 0;\n    void increment() {\n        std::lock_guard<std::mutex> lock(gate);\n        ++value;\n    }\n};\n\nint main() {\n    Counter counter;\n    counter.increment();\n    std::cout << counter.value << '\\n';\n    return 0;\n}",
    solutionExplanation: "The mutex and lock_guard make the increment one critical section, so the printed value is the single increment that ran. Compiled with g++ -std=c++20 -Wall -Wextra (zero warnings) and executed during authoring; CodeForge itself reviews C++ structurally in the browser.",
    expected: "1",
  },
  // Chapter 17: Files and Systems
  17: {
    solution: "#include <filesystem>\n#include <iostream>\n\nint main() {\n    // A missing file surfaces as a filesystem error that real code must handle, not ignore.\n    std::filesystem::path path{\"notes.txt\"};\n    std::cout << path.extension().string() << '\\n';\n    return 0;\n}",
    solutionExplanation: "filesystem::path parses the name into parts, so extension() reports .txt without manual string slicing. Compiled with g++ -std=c++20 -Wall -Wextra (zero warnings) and executed during authoring; CodeForge itself reviews C++ structurally in the browser.",
    expected: ".txt",
  },
  // Chapter 18: Networking and Serialization
  18: {
    solution: "#include <iostream>\n#include <optional>\n#include <string>\n\n// A real client also handles a timeout and parses the JSON payload instead of slicing text.\nstd::optional<std::string> body_for(int status) {\n    if (status == 204) {\n        return std::nullopt;\n    }\n    return std::string{\"{\\\"topic\\\":\\\"cpp\\\"}\"};\n}\n\nint main() {\n    std::cout << body_for(200).value() << '\\n';\n    return 0;\n}",
    solutionExplanation: "A 204 response has no body, so the boundary models absence with nullopt, while the 200 path reads the payload value that a real client would parse as JSON. Compiled with g++ -std=c++20 -Wall -Wextra (zero warnings) and executed during authoring; CodeForge itself reviews C++ structurally in the browser.",
    expected: "{\"topic\":\"cpp\"}",
  },
  // Chapter 19: Performance Engineering
  19: {
    solution: "#include <iostream>\n#include <vector>\n\nint main() {\n    // Contiguous storage keeps neighbouring ints on the same cache lines.\n    std::vector<int> values{1, 2, 3};\n    std::cout << values[1] << '\\n';\n    return 0;\n}",
    solutionExplanation: "Indexing the vector prints the second element, and the comment explains why contiguous storage is cache-friendly. Compiled with g++ -std=c++20 -Wall -Wextra (zero warnings) and executed during authoring; CodeForge itself reviews C++ structurally in the browser.",
    expected: "2",
  },
  // Chapter 20: Security and Reliability
  20: {
    solution: "#include <iostream>\n#include <vector>\n\nint main() {\n    // at() is bounds-checked and throws, while [] with a bad index is undefined behavior.\n    std::vector<int> values{4};\n    std::cout << values.at(0) << '\\n';\n    return 0;\n}",
    solutionExplanation: "at(0) performs the bounds check before returning the element, which is why it is the safer choice for an uncertain index. Compiled with g++ -std=c++20 -Wall -Wextra (zero warnings) and executed during authoring; CodeForge itself reviews C++ structurally in the browser.",
    expected: "4",
  },
  // Chapter 21: Build Systems and Dependencies
  21: {
    solution: "#include <iostream>\n\n// A CMake target names the executable, links one dependency, and the linker combines the object files.\nint main() {\n    std::cout << \"codeforge_app\" << '\\n';\n    return 0;\n}",
    solutionExplanation: "The program prints the target name, and the comment names the build, dependency, and link responsibilities that live outside the source file. Compiled with g++ -std=c++20 -Wall -Wextra (zero warnings) and executed during authoring; CodeForge itself reviews C++ structurally in the browser.",
    expected: "codeforge_app",
  },
  // Chapter 22: Architecture and APIs
  22: {
    solution: "#include <iostream>\n#include <optional>\n\nstruct ApiResult {\n    int status = 200;\n    std::optional<int> count;\n};\n\n// The API boundary keeps the transport status and the optional payload in one value, so callers\n// cannot read a count without acknowledging that it may be absent.\nApiResult fetch(bool available) {\n    if (!available) {\n        return ApiResult{503, std::nullopt};\n    }\n    return ApiResult{200, 2};\n}\n\nint main() {\n    const ApiResult result = fetch(true);\n    std::cout << result.status << ' ' << result.count.value() << '\\n';\n    return 0;\n}",
    solutionExplanation: "The result value carries the status next to the optional payload, and the success path prints both 200 and the count 2. Compiled with g++ -std=c++20 -Wall -Wextra (zero warnings) and executed during authoring; CodeForge itself reviews C++ structurally in the browser.",
    expected: "200 2",
  },
  // Chapter 23: Advanced C++
  23: {
    solution: "#include <concepts>\n#include <iostream>\n\ntemplate <std::integral T>\nT twice(T value) { return value * 2; }\n\nint main() {\n    std::cout << twice(4) << '\\n';\n    return 0;\n}",
    solutionExplanation: "The std::integral concept constrains T before instantiation, so twice(4) is accepted and returns 8. Compiled with g++ -std=c++20 -Wall -Wextra (zero warnings) and executed during authoring; CodeForge itself reviews C++ structurally in the browser.",
    expected: "8",
  },
  // Chapter 24: Professional Engineering
  24: {
    solution: "#include <iostream>\n\n// Configuration comes from the environment, logging goes through a dedicated sink,\n// and a sanitizer or profiler runs in the developer's local toolchain.\nint main() {\n    std::cout << \"service-ready\" << '\\n';\n    return 0;\n}",
    solutionExplanation: "The printed line is the only runtime output, while configuration, logging, and sanitizer or profiler responsibilities stay at the boundaries named in the comments. Compiled with g++ -std=c++20 -Wall -Wextra (zero warnings) and executed during authoring; CodeForge itself reviews C++ structurally in the browser.",
    expected: "service-ready",
  },
  // Chapter 25: Capstone
  25: {
    solution: "#include <iostream>\n#include <memory>\n#include <string>\n\nstruct Repository {\n    virtual void save(const std::string& title) = 0;\n    virtual ~Repository() = default;\n};\n\nstruct MemoryRepository : Repository {\n    std::string last;\n    void save(const std::string& title) override { last = title; }\n};\n\nint main() {\n    auto repository = std::make_unique<MemoryRepository>();\n    repository->save(\"Ship\");\n    std::cout << repository->last << '\\n';\n    return 0;\n}",
    solutionExplanation: "make_unique creates the repository behind its interface, save stores Ship in last, and the printed value comes back through that interface. Compiled with g++ -std=c++20 -Wall -Wextra (zero warnings) and executed during authoring; CodeForge itself reviews C++ structurally in the browser.",
    expected: "Ship",
  },
};
