/**
 * "Claimed but never shown" probe.
 *
 * The gap sweep in this repository checks whether a plan's concepts have any textual trace at
 * all. This probe is stricter and narrower: for a curated table of language constructs it
 * reports whether the construct appears in an actual CODE string (a lesson example or an
 * exercise solution/starter) or only in prose. That distinction is what found the Java defect
 * where Collections I claimed iterators while no shipped Java string contained `Iterator`.
 *
 * Prose is over-permissive by design - an explanation can mention a construct it never
 * demonstrates - so a construct with prose-only presence is the interesting case.
 *
 * Usage: npx vite-node .arena-teach-probe.ts [-- <language>|all]
 */
import { courses, courseById } from "./src/courses/catalog";

type Row = { kind: string; code: string };
type Probe = { topic: string; pattern: RegExp };

const PYTHON: Probe[] = [
  { topic: "comprehensions", pattern: /\[[^\]\n]*\bfor\b[^\]\n]*\]/ },
  { topic: "generators and yield", pattern: /\byield\b/ },
  { topic: "generator send / yield from", pattern: /\.send\(|yield from/ },
  { topic: "decorators", pattern: /@\w+/ },
  { topic: "contextlib.contextmanager", pattern: /contextmanager|contextlib\./ },
  { topic: "with statements", pattern: /\bwith\b[^\n]*:/ },
  { topic: "dataclasses", pattern: /@dataclass/ },
  { topic: "dataclass field / frozen / order", pattern: /field\(|frozen=True|order=True/ },
  { topic: "enums", pattern: /Enum|@unique|auto\(\)/ },
  { topic: "typing.Protocol", pattern: /Protocol/ },
  { topic: "abstract base classes", pattern: /ABC|abstractmethod/ },
  { topic: "properties", pattern: /@property|@\w+\.setter/ },
  { topic: "__slots__", pattern: /__slots__/ },
  { topic: "match/case", pattern: /\bmatch\b[^\n]*:\s*\n\s*case\b/ },
  { topic: "match class patterns", pattern: /case \w+\(/ },
  { topic: "try/except/finally", pattern: /finally:/ },
  { topic: "raise ... from", pattern: /raise [^\n]* from / },
  { topic: "custom exception classes", pattern: /class \w*(Error|Exception)\(/ },
  { topic: "pathlib", pattern: /Path\(/ },
  { topic: "json module", pattern: /json\.(dumps|loads|load|dump)/ },
  { topic: "csv module", pattern: /csv\./ },
  { topic: "sqlite3", pattern: /sqlite3\./ },
  { topic: "threading", pattern: /threading\.|Thread\(/ },
  { topic: "multiprocessing / process pools", pattern: /multiprocessing\.|Pool\(|ProcessPool/ },
  { topic: "asyncio", pattern: /asyncio\.|async def/ },
  { topic: "async iteration", pattern: /async for|async with/ },
  { topic: "subprocess", pattern: /subprocess\./ },
  { topic: "argparse", pattern: /argparse\.|add_argument/ },
  { topic: "logging", pattern: /logging\.|getLogger/ },
  { topic: "unittest", pattern: /unittest\.|TestCase/ },
  { topic: "typing generics", pattern: /TypeVar|Generic\[|Sequence\[|Iterable\[|Optional\[|Union\[/ },
  { topic: "functools utilities", pattern: /lru_cache|partial\(|reduce\(|total_ordering|@wraps|wraps\(/ },
  { topic: "itertools", pattern: /itertools\./ },
  { topic: "collections helpers", pattern: /Counter\(|defaultdict\(|deque\(|namedtuple/ },
  { topic: "f-strings", pattern: /f"|f'/ },
  { topic: "walrus operator", pattern: /:=/ },
  { topic: "argument unpacking", pattern: /\*\*kwargs|\*args/ },
  { topic: "lambdas", pattern: /lambda / },
  { topic: "nonlocal closures", pattern: /nonlocal / },
  { topic: "descriptors", pattern: /__get__|__set__/ },
  { topic: "metaclasses", pattern: /metaclass=/ },
  { topic: "singledispatch", pattern: /singledispatch/ },
  { topic: "weakref", pattern: /weakref/ },
  { topic: "dunder protocols", pattern: /__iter__|__enter__|__len__|__repr__|__eq__/ },
  { topic: "sorted/sort with key", pattern: /sorted\([^\n]*key=|\.sort\([^\n]*key=/ },
  { topic: "slicing and strides", pattern: /\[[^\]]*:[^\]]*\]/ },
  { topic: "enumerate and zip", pattern: /enumerate\(|zip\(/ },
  { topic: "dunder main guard", pattern: /__main__/ },
  { topic: "set operations", pattern: /\.union\(|\.intersection\(|\|=|&=|-=/ },
  { topic: "f-format specifiers", pattern: /:\.[0-9]f\}|:,|:>|:<|:0[0-9]d\}/ },
];

const JAVASCRIPT: Probe[] = [
  { topic: "while loops", pattern: /while\s*\(/ },
  { topic: "do-while loops", pattern: /do\s*\{/ },
  { topic: "for...of", pattern: /for\s*\(\s*const\s+\w+\s+of\b/ },
  { topic: "for...in", pattern: /for\s*\(\s*(const|let|var)\s+\w+\s+in\b/ },
  { topic: "class syntax", pattern: /class \w+/ },
  { topic: "getters and setters", pattern: /\bget \w+\(|\bset \w+\(/ },
  { topic: "private class fields", pattern: /#\w+/ },
  { topic: "destructuring", pattern: /\{\s*\w+\s*[,}]|\bconst\s*\[/ },
  { topic: "spread and rest", pattern: /\.\.\./ },
  { topic: "optional chaining", pattern: /\?\./ },
  { topic: "nullish coalescing", pattern: /\?\?/ },
  { topic: "template literals", pattern: /`/ },
  { topic: "Map and Set", pattern: /new (Map|Set)\(/ },
  { topic: "Symbol.iterator", pattern: /Symbol\.iterator/ },
  { topic: "generators", pattern: /function\*|\*\s*\[?\w*\]?\s*\(\)\s*\{/ },
  { topic: "Proxy and Reflect", pattern: /new Proxy\(|Reflect\./ },
  { topic: "WeakMap and WeakSet", pattern: /new Weak(Map|Set)\(/ },
  { topic: "Promise and async", pattern: /new Promise\(|async |await / },
  { topic: "try/catch/finally", pattern: /finally\s*\{/ },
  { topic: "custom Error classes", pattern: /class \w+ extends Error/ },
  { topic: "JSON methods", pattern: /JSON\.(parse|stringify)/ },
  { topic: "localStorage", pattern: /localStorage|sessionStorage/ },
  { topic: "Intl formatting", pattern: /Intl\./ },
  { topic: "regular expressions", pattern: /\/[^/\n]+\/[gimsuy]*\.(test|exec|match)|\.match\(|\.replace\(/ },
  { topic: "Array methods", pattern: /\.(map|filter|reduce|flat|flatMap|some|every|find|sort)\(/ },
  { topic: "structuredClone/deep copy", pattern: /structuredClone|JSON\.parse\(JSON\.stringify/ },
  { topic: "closures and counters", pattern: /=>\s*\{[\s\S]*return/ },
  { topic: "modules import/export", pattern: /^\s*(import|export)\b/m },
  { topic: "AbortController", pattern: /AbortController/ },
  { topic: "event listeners", pattern: /addEventListener\(/ },
  { topic: "fetch", pattern: /fetch\(/ },
  { topic: "queueMicrotask / timers", pattern: /queueMicrotask|setTimeout\(|setInterval\(/ },
  { topic: "console.assert", pattern: /console\.assert\(/ },
  { topic: "typed arrays", pattern: /Uint8Array|Float64Array|ArrayBuffer/ },
  { topic: "iterators protocol", pattern: /\.next\(\)|\{\s*value[\s\S]*done/ },
  { topic: "labels and break", pattern: /\bbreak \w+|continue \w+/ },
];

const CPP: Probe[] = [
  { topic: "while loops", pattern: /while\s*\(/ },
  { topic: "do-while loops", pattern: /do\s*\{/ },
  { topic: "range-based for", pattern: /for\s*\([^;)]*:[^;)]*\)/ },
  { topic: "std::map / std::set", pattern: /std::(map|set|multimap|multiset)</ },
  { topic: "std::unordered_map / set", pattern: /std::unordered_(map|set)</ },
  { topic: "std::sort with comparator", pattern: /std::sort\([^;]*,\s*\[|std::sort\([^;]*,\s*\w+/ },
  { topic: "std::unique and erase", pattern: /std::unique\(|\.erase\(/ },
  { topic: "std::accumulate", pattern: /accumulate\(/ },
  { topic: "std::find / search", pattern: /std::find\(|std::find_if|lower_bound/ },
  { topic: "ranges and views", pattern: /\| std::views::|std::ranges::/ },
  { topic: "smart pointers", pattern: /std::(unique_ptr|shared_ptr|make_unique|make_shared|weak_ptr)/ },
  { topic: "move semantics", pattern: /std::move\(/ },
  { topic: "RAII destructors", pattern: /~\w+\(\)/ },
  { topic: "templates", pattern: /template\s*</ },
  { topic: "concepts / requires", pattern: /\brequires\b|concept / },
  { topic: "lambdas", pattern: /\[[^\]]*\]\s*\(/ },
  { topic: "operator overloading", pattern: /operator\s*[+\-*/=<>!\[\]]/ },
  { topic: "std::optional", pattern: /std::optional|std::nullopt/ },
  { topic: "virtual and override", pattern: /virtual |override\b/ },
  { topic: "exceptions", pattern: /throw |catch\s*\(|noexcept/ },
  { topic: "assert", pattern: /assert\(/ },
  { topic: "cassert / cstdint etc", pattern: /#include <(cassert|cstddef|cstdint|charconv|string_view|span)>/ },
  { topic: "string_view", pattern: /string_view/ },
  { topic: "std::string basics", pattern: /std::string/ },
  { topic: "vector / array / deque", pattern: /std::(vector|array|deque)</ },
  { topic: "pair and tuple", pattern: /std::(pair|tuple|make_pair|tie)</ },
  { topic: "queue and stack", pattern: /std::(queue|stack|priority_queue)</ },
  { topic: "iostream formatting", pattern: /std::setw|std::setprecision|std::fixed/ },
  { topic: "filesystem", pattern: /std::filesystem|#include <filesystem>/ },
  { topic: "fstream", pattern: /std::(ifstream|ofstream|fstream)|#include <fstream>/ },
  { topic: "threads and mutex", pattern: /std::thread|std::mutex|lock_guard/ },
  { topic: "atomics and futures", pattern: /std::atomic|std::future|std::async|condition_variable/ },
  { topic: "chrono", pattern: /std::chrono|steady_clock|duration_cast/ },
  { topic: "variadic templates", pattern: /\.\.\.|template\s*<\s*typename\s*\.\.\./ },
  { topic: "structured bindings", pattern: /auto\s*\[[^\]]*\]\s*=/ },
  { topic: "constexpr / consteval", pattern: /constexpr|consteval/ },
  { topic: "enum class", pattern: /enum\s+class/ },
  { topic: "initializer lists", pattern: /\{\s*[\d"'{\[]/ },
];

const JAVA: Probe[] = [
  { topic: "while loops", pattern: /while\s*\(/ },
  { topic: "do-while loops", pattern: /do\s*\{/ },
  { topic: "enhanced for", pattern: /for\s*\([^;]*:[^;]*\)/ },
  { topic: "Iterator", pattern: /Iterator|\.iterator\(\)/ },
  { topic: "streams", pattern: /\.stream\(\)|Stream</ },
  { topic: "collect and Collectors", pattern: /collect\(|Collectors\./ },
  { topic: "lambdas and method refs", pattern: /->|::/ },
  { topic: "Optional", pattern: /Optional</ },
  { topic: "records", pattern: /record \w+/ },
  { topic: "sealed types", pattern: /sealed |permits / },
  { topic: "interfaces and default methods", pattern: /interface \w+|default \w+ \w+\(/ },
  { topic: "enums", pattern: /enum \w+/ },
  { topic: "generics", pattern: /<[A-Z]\w*>/ },
  { topic: "HashMap / HashSet", pattern: /(HashMap|HashSet|TreeMap|LinkedHashMap)</ },
  { topic: "ArrayList", pattern: /ArrayList</ },
  { topic: "Comparator and sorting", pattern: /Comparator|Collections\.sort|\.sort\(/ },
  { topic: "exceptions", pattern: /throw new |catch\s*\(|finally\s*\{/ },
  { topic: "try-with-resources", pattern: /try\s*\(/ },
  { topic: "custom exceptions", pattern: /class \w+Exception/ },
  { topic: "java.time", pattern: /java\.time|Instant|LocalDate|DateTimeFormatter/ },
  { topic: "StringBuilder", pattern: /StringBuilder/ },
  { topic: "text blocks", pattern: /"""/ },
  { topic: "regex", pattern: /Pattern\.compile|\.matches\(|\.replaceAll\(/ },
  { topic: "var", pattern: /\bvar \w+ =/ },
  { topic: "switch expressions", pattern: /switch\s*\([^)]*\)\s*\{[^}]*->/ },
  { topic: "List.of / Map.of", pattern: /List\.of|Map\.of|Set\.of/ },
  { topic: "threads and concurrency", pattern: /Thread|Runnable|synchronized|Concurrent|AtomicInteger/ },
  { topic: "CompletableFuture", pattern: /CompletableFuture/ },
  { topic: "JDBC", pattern: /Connection|PreparedStatement|DriverManager/ },
  { topic: "logging", pattern: /Logger|log\.info|System\.getLogger|logger\./ },
  { topic: "files IO", pattern: /Files\.|Path\b|BufferedReader|Files\.readString/ },
];

const HTMLCSS: Probe[] = [
  { topic: "semantic elements", pattern: /<(header|nav|main|article|section|aside|footer)\b/ },
  { topic: "forms and labels", pattern: /<label|<input|<select|<textarea/ },
  { topic: "tables", pattern: /<table|<thead|<tbody|<th\b|<caption/ },
  { topic: "media elements", pattern: /<img|<picture|<source|<video|<audio/ },
  { topic: "metadata and head", pattern: /<meta|<title|<link\b/ },
  { topic: "aria attributes", pattern: /aria-|role=/ },
  { topic: "flexbox", pattern: /display:\s*flex/ },
  { topic: "grid", pattern: /display:\s*grid/ },
  { topic: "gap", pattern: /gap:\s*[\w.]/ },
  { topic: "grid-template-areas", pattern: /grid-template-areas/ },
  { topic: "custom properties", pattern: /--[\w-]+:/ },
  { topic: "media queries", pattern: /@media/ },
  { topic: "container queries", pattern: /@container|container-type/ },
  { topic: "CSS nesting", pattern: /&[\s:.#[]/ },
  { topic: "cascade layers", pattern: /@layer/ },
  { topic: "feature queries", pattern: /@supports/ },
  { topic: "keyframe animations", pattern: /@keyframes|animation:/ },
  { topic: "transitions", pattern: /transition:/ },
  { topic: "transforms", pattern: /transform:/ },
  { topic: "positioning", pattern: /position:\s*(absolute|relative|fixed|sticky)/ },
  { topic: "z-index/stacking", pattern: /z-index|isolation:/ },
  { topic: "aspect-ratio and object-fit", pattern: /aspect-ratio|object-fit/ },
  { topic: "clip-path / shapes", pattern: /clip-path|shape-outside/ },
  { topic: "prefers-reduced-motion", pattern: /prefers-reduced-motion/ },
  { topic: "dark mode", pattern: /prefers-color-scheme|color-scheme/ },
  { topic: "dialog and popover", pattern: /<dialog|popover/ },
  { topic: "scroll snap", pattern: /scroll-snap/ },
  { topic: "srcset and picture sources", pattern: /srcset|sizes=/ },
  { topic: "logical properties", pattern: /margin-inline|padding-block|inset-inline/ },
  { topic: "focus styles", pattern: /:focus-visible|:focus/ },
  { topic: "print styles", pattern: /@media print/ },
];

const TABLES: Record<string, Probe[]> = { python: PYTHON, java: JAVA, javascript: JAVASCRIPT, cpp: CPP, htmlcss: HTMLCSS };

const argv = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const wanted = argv.length === 0 ? Object.keys(TABLES) : argv;

for (const language of wanted) {
  const probes = TABLES[language];
  if (!probes) continue;
  const course = courseById(language);
  if (!course) continue;
  const chapterRows = course.chapters.map((chapter) => {
    const code: string[] = [];
    const prose: string[] = [];
    for (const lesson of chapter.lessons) {
      for (const sample of lesson.examples ?? []) code.push(sample.code, sample.output ?? "");
      if (lesson.exercise) {
        code.push(lesson.exercise.solution ?? "", lesson.exercise.starterCode ?? "");
      }
      prose.push(lesson.title, lesson.body ?? "", lesson.explanation ?? "", (lesson.recap ?? []).join(" "));
    }
    return { number: chapter.number, code: code.join("\n"), prose: prose.join("\n") };
  });
  const allCode = chapterRows.map((r) => r.code).join("\n");
  console.log(`\n=== ${course.name} ===`);
  for (const probe of probes) {
    const inAnyCode = probe.pattern.test(allCode);
    if (inAnyCode) continue;
    const proseChapters = chapterRows.filter((r) => probe.pattern.test(r.prose)).map((r) => r.number);
    const flag = proseChapters.length > 0 ? "PROSE ONLY" : "ABSENT";
    console.log(`  ${flag.padEnd(11)} ${probe.topic}${proseChapters.length ? ` (prose in ch ${proseChapters.join(", ")})` : ""}`);
  }
}
