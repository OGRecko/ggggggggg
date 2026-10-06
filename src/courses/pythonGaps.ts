import type { LessonSeed } from "./pythonAdvanced";

/**
 * Genuine language and workflow gaps left after the authored Python track.
 * Every example in this file was executed with a local CPython 3.11 interpreter
 * and its documented output matched, so the lesson text never promises behavior
 * that was not actually observed. Where a workflow cannot run inside the browser
 * Pyodide worker (subprocess, pdb, coverage.py) the lesson says so explicitly
 * instead of pretending the sandbox executes it.
 */
export const pythonGapLessons: Record<number, LessonSeed[]> = {
  2: [
    {
      title: "Assignment forms, swaps, and the walrus operator",
      minutes: 28,
      summary: "Assign several names in one statement, swap values safely, and compute-and-test a value inside a single condition.",
      learningGoals: ["Unpack one right-hand side into several names", "Swap two values without a temporary variable", "Use := to compute and test together"],
      explanation: "Python evaluates the right-hand side of an assignment before it stores anything. That rule is what makes several useful forms work: a, b = 1, 2 unpacks a small sequence into two names, a, b = b, a swaps those names because the tuple on the right is built from the old values first, and first = second = 0 binds two names to the same object. The walrus operator := is an assignment expression: it stores a value and also returns it, so one condition can compute a value, store it, and test it in the same step. Reach for := when the condition genuinely needs the value it just computed, and keep a plain assignment on its own line everywhere else.",
      keywordNotes: [
        "a, b = b, a builds the right-hand tuple first, then assigns both names, so no temporary variable is needed.",
        "first = second = 0 is chained assignment: both names refer to the same object rather than to two copies.",
        "name := expression stores the result and returns it, letting while or if test a value at the moment it is produced.",
      ],
      examples: [
        {
          title: "Swap two values",
          code: 'left = "read"\nright = "write"\nleft, right = right, left\nprint(left)\nprint(right)',
          output: "write\nread",
          explanation: "The single assignment line performs the whole swap. Python collects the current values into the tuple (right, left) first, and only then stores them back into the two names, so neither old value is lost.",
          reasons: [
            "Line 1: The assignment stores the string read under the name left before any swapping happens.",
            "Line 2: The same happens for right, so the two names now hold read and write in that order.",
            "Line 3: Python evaluates the right-hand side into the tuple (write, read), then assigns write to left and read to right. Because the tuple was built first, no temporary variable is required.",
            "Line 4: print reads the new value of left, which is write.",
            "Line 5: print reads the new value of right, which is read, completing the evidence that the swap worked.",
          ],
        },
        {
          title: "Compute and test in one condition",
          code: 'values = ["3", "5", "stop"]\nindex = 0\nwhile (text := values[index]) != "stop":\n    print(int(text) * 2)\n    index += 1',
          output: "6\n10",
          explanation: "The walrus expression stores values[index] in text and returns that same string, so the comparison can test the stored value in the same step. The loop stops when the sentinel text stop is read instead of being converted.",
          reasons: [
            "Line 1: A list holds three text values. The last one is a sentinel: its job is to end the loop rather than to be calculated with.",
            "Line 2: index tracks which list position the next iteration will read, starting at the first position.",
            "Line 3: The walrus expression stores values[index] in text and returns it, so != can compare the stored value in the same condition. No separate assignment line is needed before the test.",
            "Line 4: int converts the numeric text before multiplying, because multiplying a string would repeat its characters instead of doing arithmetic.",
            "Line 5: incrementing index moves the loop to the next position; without this update the same text would be read forever.",
          ],
        },
      ],
      exercise: {
        prompt: "Use a while loop with a walrus expression to read the text values \"2\", \"4\", and \"stop\" from a list. Triple each number and print 6 then 12, stopping when the sentinel text is read.",
        starterCode: "# Read values until the sentinel arrives\n",
        solution: 'readings = ["2", "4", "stop"]\nindex = 0\nwhile (text := readings[index]) != "stop":\n    print(int(text) * 3)\n    index += 1',
        solutionExplanation: "The walrus stores and returns each text value so the condition can test it immediately. int then converts only the numeric entries, and the loop ends before the sentinel reaches the arithmetic.",
        testCases: [{ label: "Tripled readings", expected: "6\n12" }],
        hints: ["Store the list in readings and the position in index.", "Write the condition as (text := readings[index]) != \"stop\".", "Convert with int(text) and print int(text) * 3 inside the loop."],
      },
      recap: ["Python evaluates the right-hand side of an assignment before storing any names.", "a, b = b, a swaps two values in one statement because the tuple is built first.", "The walrus operator := stores a value and returns it, which removes repeated computation inside a condition."],
      decisionGuide: [
        { use: "a, b = b, a for a swap", insteadOf: "a temporary variable that exists only to hold one value", reason: "The right-hand side is evaluated before assignment, so Python already preserves the old values while writing the new ones." },
        { use: "a walrus expression inside a condition", insteadOf: "computing the same value again inside the block", reason: "The value is stored once, so the condition and the body cannot drift apart when the expression changes." },
        { use: "a plain assignment on its own line", insteadOf: "packing several assignments into one expression", reason: "Simple statements are faster to scan; reserve := for the case where the condition truly needs the value it computed." },
      ],
    },
  ],
  4: [
    {
      title: "Parameter kinds: positional-only and keyword-only",
      minutes: 26,
      summary: "Let a signature state how each argument must be supplied, so a future change cannot silently attach a value to the wrong parameter.",
      learningGoals: ["Mark positional-only parameters with /", "Mark keyword-only parameters with *", "Choose a signature that prevents call-site mistakes"],
      explanation: "A function signature is a published contract, and Python lets it state how each parameter must be supplied. Everything before a blank slash / in the parameter list is positional-only: callers cannot pass it by name, which keeps an internal parameter free to be renamed later. Everything after a bare star * is keyword-only: callers must name those arguments, so adding a new option cannot shift an existing positional call into the wrong slot. Default values decide whether an argument is optional; they do not change whether it is positional or keyword. Use these markers to make the call sites you expect obvious, not to lock callers out for no reason.",
      keywordNotes: [
        "Everything before / in the signature can only be passed by position, so a caller cannot write scale(value=5).",
        "Everything after a bare * must be passed by keyword, which makes boolean options self-documenting at the call site.",
        "A default value makes a parameter optional but does not change whether it is positional or keyword.",
      ],
      examples: [
        {
          title: "Mark a calculation input as positional-only",
          code: 'def scale(value, /, factor=2):\n    return value * factor\nprint(scale(5))\nprint(scale(5, factor=3))',
          output: "10\n15",
          explanation: "The slash after value says that the number being scaled must arrive by position. factor still works either way, so the second call can name it for readability while the first relies on its default.",
          reasons: [
            "Line 1: The slash marks value as positional-only and leaves factor available by position or by name with its default of 2.",
            "Line 2: The body multiplies the received value by the factor and returns the product to the caller.",
            "Line 3: The first call supplies only 5, so factor keeps its default and the result is 10.",
            "Line 4: The second call names factor explicitly and the result becomes 15, showing that naming an optional parameter is still allowed after the slash.",
          ],
        },
        {
          title: "Require a named flag",
          code: 'def enroll(name, *, paid=False):\n    return name + ": " + str(paid)\nprint(enroll("Ada", paid=True))',
          output: "Ada: True",
          explanation: "The star before paid means the caller must write paid=True. A later change that adds another option cannot accidentally receive the boolean in the wrong position, because every option must be named.",
          reasons: [
            "Line 1: The bare star ends the positional parameters and makes paid keyword-only with a default of False.",
            "Line 2: str converts the boolean so it can join the text label, and the joined string is returned.",
            "Line 3: The call names the option, which is the only accepted form. Writing enroll(\"Ada\", True) would raise TypeError instead of guessing.",
          ],
        },
      ],
      exercise: {
        prompt: "Define tag(label, /, *, upper=False) returning the label in uppercase when upper is True and unchanged otherwise. Print tag(\"python\", upper=True) and then tag(\"python\").",
        starterCode: "# One positional-only parameter, one keyword-only option\n",
        solution: 'def tag(label, /, *, upper=False):\n    return label.upper() if upper else label\nprint(tag("python", upper=True))\nprint(tag("python"))',
        solutionExplanation: "label must be passed positionally because it sits before the slash, and upper must be named because it sits after the star. The conditional expression returns the uppercase form only when the option is true.",
        testCases: [{ label: "Tag with and without the option", expected: "PYTHON\npython" }],
        hints: ["Write the parameter list as label, /, *, upper=False.", "Return label.upper() if upper else label.", "Call the function twice and print each result."],
      },
      recap: ["The slash makes earlier parameters positional-only so their names stay internal.", "The bare star makes later parameters keyword-only so call sites stay self-documenting.", "Parameter kinds protect callers when a signature grows."],
      decisionGuide: [
        { use: "a positional-only parameter for a value with no meaningful external name", insteadOf: "a name callers start depending on", reason: "The internal name can then change without breaking callers, which is what the slash guarantees." },
        { use: "keyword-only options for flags and tuning values", insteadOf: "positional booleans in an ordered list", reason: "Naming the option at the call site shows intent and prevents a new parameter from shifting silently into the wrong argument." },
      ],
    },
  ],
  5: [
    {
      title: "Immutable keys: tuples and frozenset",
      minutes: 27,
      summary: "Use immutable values where a dictionary key or a shared membership rule needs stability.",
      learningGoals: ["Use a tuple as a dictionary key", "Choose frozenset for a fixed membership rule", "Explain why a mutable collection cannot be a key"],
      explanation: "A dictionary key must be hashable, and a hashable value must not change while it is in use. A tuple of immutable values can be a key; a list or a set cannot, because it could be modified after being stored and the dictionary would no longer find it. frozenset is the immutable sibling of set: it supports membership, unions, and intersections but cannot be changed in place, so it is safe to share between functions and safe to use as a key. Choose a mutable set when you must add items, and a frozenset when the collection is a fixed rule or part of a key.",
      keywordNotes: [
        "A dictionary key must be hashable, which is why tuples of immutable values are allowed and lists are not.",
        "frozenset(values) builds an immutable set that supports membership and set algebra without in-place changes.",
        "Operations such as | and & return a new collection and leave both original frozensets untouched.",
      ],
      examples: [
        {
          title: "Key a dictionary by a tuple",
          code: 'grid = {("row", 2): "cell"}\nprint(grid[("row", 2)])',
          output: "cell",
          explanation: "The key is a tuple of two immutable values, so its hash stays stable and the lookup can find the stored entry again. A list key would raise TypeError before the dictionary could even be created.",
          reasons: [
            "Line 1: The dictionary is built with one entry whose key is the tuple (\"row\", 2). Tuples of immutable values are hashable, so they are accepted as keys.",
            "Line 2: The lookup builds an equal tuple, and Python finds the matching key by hash and equality rather than by position.",
          ],
        },
        {
          title: "Hold a fixed membership rule with frozenset",
          code: 'allowed = frozenset({"read", "write"})\nprint("read" in allowed)\nprint(len(allowed | {"admin"}))',
          output: "True\n3",
          explanation: "Membership testing works exactly as it does for a set, while the union with {\"admin\"} produces a new frozenset instead of modifying allowed. The original rule stays intact for every other caller.",
          reasons: [
            "Line 1: frozenset copies the given values into an immutable set, so no later call can add or remove entries.",
            "Line 2: The in operator checks membership by hash and equality, exactly like a normal set.",
            "Line 3: The union operator builds a new frozenset containing read, write, and admin. It leaves allowed unchanged, so the printed length is 3.",
          ],
        },
      ],
      exercise: {
        prompt: "Create two frozensets, tags_a with \"read\" and \"build\" and tags_b with \"build\" and \"test\". Intersect them, print the sorted result, and print whether the intersection is still a frozenset.",
        starterCode: "# Fixed membership rules that can be combined safely\n",
        solution: 'tags_a = frozenset({"read", "build"})\ntags_b = frozenset({"build", "test"})\nshared = tags_a & tags_b\nprint(sorted(shared))\nprint(isinstance(shared, frozenset))',
        solutionExplanation: "The & operator returns a new frozenset containing only values present in both inputs. sorted turns that set into an ordered list for printing, and isinstance confirms the result kept the immutable type.",
        testCases: [{ label: "Shared tags", expected: "['build']\nTrue" }],
        hints: ["Build both values with frozenset({...}).", "Use the & operator for intersection.", "Print sorted(shared) and isinstance(shared, frozenset)."],
      },
      recap: ["Only hashable, unchangeable values belong in a dictionary key, which is why tuples qualify and lists do not.", "frozenset offers set membership without letting a caller mutate shared state.", "Set operations return new collections, so a fixed rule stays fixed for every consumer."],
      decisionGuide: [
        { use: "a tuple of immutable values as a key", insteadOf: "joins such as \"row:2\" that must be split apart later", reason: "The key keeps its real structure, so lookups stay exact and readers do not have to parse text back into fields." },
        { use: "frozenset for a fixed membership rule", insteadOf: "a set that any caller could modify", reason: "No caller can add or remove an entry by accident, yet membership tests and set algebra still work." },
      ],
    },
  ],
  7: [
    {
      title: "Dates, durations, and ISO text",
      minutes: 28,
      summary: "Parse ISO date text, measure a duration with timedelta, and format a moment back into portable text.",
      learningGoals: ["Parse an ISO date string", "Measure the difference between two dates", "Format a timezone-aware moment"],
      explanation: "Dates arrive from files, APIs, and users as text, and text is a poor tool for arithmetic. datetime.date parses ISO text such as 2026-01-05 through fromisoformat, and subtracting two dates produces a timedelta whose days attribute is a whole number. datetime pairs a date with a time and records a timezone offset when you pass tzinfo; without tzinfo the value is naive, meaning it carries no timezone information and cannot be compared safely with aware moments. Keep parsing, arithmetic, and formatting as separate steps, and store ISO text at your program's boundary because it sorts correctly and is unambiguous. These examples use fixed dates rather than today's clock so the documented output stays reproducible.",
      keywordNotes: [
        "date.fromisoformat(\"2026-01-05\") parses ISO date text into a date object that supports real arithmetic.",
        "Subtracting two dates produces a timedelta, and .days extracts the whole number of days between them.",
        "datetime(..., tzinfo=timezone.utc) creates an aware moment whose isoformat() includes an explicit +00:00 offset.",
      ],
      examples: [
        {
          title: "Measure a duration between two dates",
          code: 'from datetime import date\nstart = date.fromisoformat("2026-01-05")\nend = date.fromisoformat("2026-01-09")\nprint((end - start).days)',
          output: "4",
          explanation: "Both strings are parsed into date objects first, so the subtraction is real calendar arithmetic. The result is a timedelta rather than a number, and .days asks it for whole days.",
          reasons: [
            "Line 1: The import makes just the date class available, which is enough because this example needs no clock or timezone.",
            "Line 2: fromisoformat parses the year-month-day text into a date, so the value can take part in arithmetic instead of being compared as a string.",
            "Line 3: The end date is parsed the same way, giving two comparable points on the calendar.",
            "Line 4: Subtracting two dates yields a timedelta, and .days reads the whole-day part of that duration, which is 4 here.",
          ],
        },
        {
          title: "Format a timezone-aware moment",
          code: 'from datetime import datetime, timezone\nmoment = datetime(2026, 1, 5, 9, 30, tzinfo=timezone.utc)\nprint(moment.isoformat())',
          output: "2026-01-05T09:30:00+00:00",
          explanation: "All six fields are supplied explicitly, and tzinfo=timezone.utc makes the moment aware. isoformat then renders the standard text form with its offset, so the value can travel to another system without losing its meaning.",
          reasons: [
            "Line 1: The import brings in both the moment type and the timezone helper used for the offset.",
            "Line 2: The constructor receives year, month, day, hour, and minute plus tzinfo, so the resulting moment knows which timezone it belongs to.",
            "Line 3: isoformat writes the value as ISO 8601 text including the +00:00 offset, which is why the printed line is longer than the naive form would be.",
          ],
        },
      ],
      exercise: {
        prompt: "Parse \"2026-03-01\" and \"2026-03-15\" with date.fromisoformat, subtract the earlier date from the later one, and print the number of whole days.",
        starterCode: "from datetime import date\n# Measure the duration between two parsed dates\n",
        solution: 'from datetime import date\nstart = date.fromisoformat("2026-03-01")\nend = date.fromisoformat("2026-03-15")\nprint((end - start).days)',
        solutionExplanation: "fromisoformat turns the text into date objects, subtraction produces a timedelta, and .days reports the whole-day duration as an integer.",
        testCases: [{ label: "Days between the dates", expected: "14" }],
        hints: ["Import date from datetime.", "Parse each string with date.fromisoformat.", "Subtract and read the .days attribute of the result."],
      },
      recap: ["Parse date text before doing arithmetic on it.", "A date subtraction produces a timedelta, and .days extracts whole days.", "A timezone-aware datetime formats with an explicit offset, so it stays unambiguous."],
      decisionGuide: [
        { use: "ISO 8601 text at interfaces and files", insteadOf: "locale-specific formats such as 05/01/2026", reason: "ISO text sorts correctly as a string and cannot be read as either month-first or day-first, so both humans and systems agree." },
        { use: "timezone-aware datetimes for moments that cross systems", insteadOf: "naive datetimes that only mean something locally", reason: "An explicit offset keeps comparisons and stored values correct when servers and users sit in different zones." },
      ],
    },
  ],
  10: [
    {
      title: "Enum classes for fixed choices",
      minutes: 26,
      summary: "Give a closed set of options one real type so comparisons, stored values, and spelling mistakes have a single home.",
      learningGoals: ["Declare an Enum with stored values", "Compare members by identity", "Decide when an enum beats plain text"],
      explanation: "A field that accepts only a few known values is stronger as an enum than as loose text. Each Enum member is a named singleton: Status.DRAFT is one specific object, so is comparisons are reliable and a misspelled Status.DRAF fails immediately with AttributeError instead of quietly comparing unequal strings. The member name stays readable in code while its .value holds the text or number that a database or API expects. Choose an enum when the set of options is closed and known in code; keep a plain string when the values are open-ended user data.",
      keywordNotes: [
        "class Status(Enum) declares a closed set of named members that cannot be redefined at runtime.",
        "A member such as Status.DRAFT is an object; .name holds its label and .value holds the stored value.",
        "Members are singletons, so `is` compares them exactly while `==` would only compare values.",
      ],
      examples: [
        {
          title: "Declare a closed set of statuses",
          code: 'from enum import Enum\nclass Status(Enum):\n    DRAFT = "draft"\n    PUBLISHED = "published"\nprint(Status.DRAFT.value)',
          output: "draft",
          explanation: "The class body names both accepted statuses and stores the text each one maps to. Code reads Status.DRAFT while the storage layer can use .value, so the two representations stay connected in one place.",
          reasons: [
            "Line 1: The import makes the Enum base class available so the new type can inherit its behavior.",
            "Line 2: Subclassing Enum turns the class body into a fixed set of members rather than ordinary class attributes.",
            "Line 3: DRAFT becomes a member whose stored value is the text draft, ready for a database column or JSON field.",
            "Line 4: PUBLISHED is a second member of the same closed set, so any other spelling is not part of this type at all.",
            "Line 5: Reading .value returns the stored text, showing that the readable code name and the wire value are different views of one member.",
          ],
        },
        {
          title: "Branch on a member identity",
          code: 'from enum import Enum\nclass Status(Enum):\n    DRAFT = "draft"\n    PUBLISHED = "published"\ndef label(status):\n    return "editable" if status is Status.DRAFT else "locked"\nprint(label(Status.PUBLISHED))',
          output: "locked",
          explanation: "The helper compares identity against one known member. A typo such as Status.DRAF would raise AttributeError at the call site rather than silently taking the else path, which is the failure you want when a status name is wrong.",
          reasons: [
            "Line 1: The import supplies the Enum base class.",
            "Line 2: The class declares the status type that the rest of the program will compare against.",
            "Line 3: DRAFT is the member that means work is still editable.",
            "Line 4: PUBLISHED is the second member of the same closed set.",
            "Line 5: The function documents that it accepts one status value from that type.",
            "Line 6: The conditional expression compares by identity, and only the draft member takes the editable branch.",
            "Line 7: The call passes a real member, so the function returns locked for a published lesson.",
          ],
        },
      ],
      exercise: {
        prompt: "Define Priority(Enum) with LOW = 1 and HIGH = 2. Print Priority.HIGH.name and then Priority.LOW.value.",
        starterCode: "from enum import Enum\n# Declare a closed set of priorities\n",
        solution: 'from enum import Enum\nclass Priority(Enum):\n    LOW = 1\n    HIGH = 2\nprint(Priority.HIGH.name)\nprint(Priority.LOW.value)',
        solutionExplanation: "The class declares both accepted priorities once. .name returns the readable label used in code, while .value returns the stored number a database or API would receive.",
        testCases: [{ label: "Priority name and value", expected: "HIGH\n1" }],
        hints: ["Subclass Enum and give each member a stored value.", "Use .name for the label and .value for the stored number.", "Print each attribute on its own line."],
      },
      recap: ["An enum turns a closed set of options into a real type instead of loose text.", "Members are singletons, so identity comparisons are exact and typos fail loudly.", ".name and .value separate what code reads from what storage receives."],
      decisionGuide: [
        { use: "an Enum for a closed set of options known in code", insteadOf: "bare strings compared in several places", reason: "Every accepted option lives in one declaration, so a misspelling becomes an AttributeError instead of a value that silently never matches." },
        { use: "plain strings for open-ended user data", insteadOf: "an enum that must be edited for every new value", reason: "An enum describes a contract the code owns; user-supplied labels are data, not part of the program's type." },
      ],
    },
  ],
  13: [
    {
      title: "itertools and yield from",
      minutes: 28,
      summary: "Compose lazy standard-library iterators and delegate to another iterable from inside a generator.",
      learningGoals: ["Chain several iterables lazily", "Take a slice of an iterator with islice", "Delegate iteration with yield from"],
      explanation: "The itertools module supplies small, lazy iterator adapters that compose without building intermediate lists. chain walks several iterables in sequence, and islice takes the first n values from any iterator without requiring an index or a length. yield from delegates to another iterable inside a generator, so one function can hand its work to a list, a range, or a second generator and let the caller keep pulling values. Everything stays lazy: nothing is produced until the consumer asks, which is why these examples wrap the final iterator in list() to make the results visible.",
      keywordNotes: [
        "itertools.chain(a, b) yields every value of a, then every value of b, without copying either one.",
        "itertools.islice(iterator, n) yields at most the first n values from any iterator, including ones with no length.",
        "yield from iterable delegates iteration to another iterable inside a generator function.",
      ],
      examples: [
        {
          title: "Chain two sources without copying",
          code: 'from itertools import chain\nvalues = chain(["read", "build"], ["test"])\nprint(list(values))',
          output: "['read', 'build', 'test']",
          explanation: "The two lists are never merged into a third list. chain yields the first list's items and then the second's, and list() is what finally collects the produced values so the console can show them.",
          reasons: [
            "Line 1: The import brings in the chain helper, which adapts several iterables into one sequence of values.",
            "Line 2: chain receives both lists and returns a lazy iterator. No work happens yet, and neither input list is modified.",
            "Line 3: list() pulls every value in order, which is the moment the concatenation actually occurs.",
          ],
        },
        {
          title: "Slice an iterator and delegate with yield from",
          code: 'from itertools import islice\ndef readings():\n    yield from [10, 20, 30, 40]\nprint(list(islice(readings(), 2)))',
          output: "[10, 20]",
          explanation: "readings is a generator that delegates its values to a list through yield from. islice then takes only the first two values, so the remaining items are never produced at all.",
          reasons: [
            "Line 1: The import makes islice available for taking a limited prefix of an iterator.",
            "Line 2: def declares a generator function, so calling it later will not run the body immediately.",
            "Line 3: yield from hands iteration to the list, producing 10, 20, 30, then 40 only as the consumer requests them.",
            "Line 4: islice stops after two values, and list() collects those two. The generator stays paused, which is why 30 and 40 never appear.",
          ],
        },
      ],
      exercise: {
        prompt: "Define a generator numbers() that uses yield from to delegate to chain([1, 2], [3, 4]). Print the first three values it produces as a list.",
        starterCode: "from itertools import chain, islice\n# Delegate iteration, then take a prefix\n",
        solution: 'from itertools import chain, islice\ndef numbers():\n    yield from chain([1, 2], [3, 4])\nprint(list(islice(numbers(), 3)))',
        solutionExplanation: "yield from passes each chained value straight through the generator, and islice takes only the first three before the generator would have produced the fourth.",
        testCases: [{ label: "First three chained values", expected: "[1, 2, 3]" }],
        hints: ["Import chain and islice from itertools.", "Use yield from chain([1, 2], [3, 4]) inside the generator.", "Wrap islice(numbers(), 3) in list() before printing."],
      },
      recap: ["itertools adapters stay lazy, so they compose without building intermediate collections.", "islice takes a prefix from any iterator, including one with no length.", "yield from delegates iteration to another iterable inside a generator."],
      decisionGuide: [
        { use: "chain for reading several sources in order", insteadOf: "adding lists together and copying their contents", reason: "chain produces values on demand, so the concatenation costs nothing until the consumer actually reads them." },
        { use: "islice for a limited prefix", insteadOf: "converting an iterator to a list and slicing it", reason: "Slicing a list forces every value to be produced, while islice stops early and leaves the rest uncomputed." },
      ],
    },
  ],
  14: [
    {
      title: "Tracebacks, breakpoints, and coverage",
      minutes: 27,
      summary: "Read a stack trace as evidence, capture it as text, and use assert for internal contracts while knowing which tools need a local terminal.",
      learningGoals: ["Read the last lines of a traceback", "Capture a traceback with traceback.format_exc()", "State an internal contract with assert"],
      explanation: "A traceback is evidence, not noise: it lists the call path and names the exception type, the message, and the line that raised it. Reading from the bottom upward tells you what failed and where, and traceback.format_exc() returns that same text as a string so a program can log it or include it in an error report. assert condition, message records a contract the code expects to be true, such as a function requiring a non-empty input; it raises AssertionError with your message when the expectation fails. Two common tools need a real environment: breakpoint() opens the interactive pdb debugger in a terminal, and coverage.py reports which lines your tests executed. CodeForge runs Python in a browser worker, so neither interactive pdb nor coverage measurement runs here, and the lessons that teach them describe the local workflow honestly instead of faking a session.",
      keywordNotes: [
        "A traceback names the exception type and message on the last line and shows the failing call path above it.",
        "traceback.format_exc() returns the traceback of the exception currently being handled as a string.",
        "assert condition, message raises AssertionError with your message when an internal expectation is false; breakpoint() and coverage.py require a local terminal or environment.",
      ],
      examples: [
        {
          title: "Capture the failing line as text",
          code: 'import traceback\ntry:\n    int("four")\nexcept ValueError:\n    print(traceback.format_exc().splitlines()[-1])',
          output: "ValueError: invalid literal for int() with base 10: 'four'",
          explanation: "The conversion fails inside the try block, and the except branch handles the expected ValueError. format_exc builds the full traceback string, and splitlines()[-1] takes its final line, which is the exception type and message.",
          reasons: [
            "Line 1: The import makes the traceback helpers available without running anything yet.",
            "Line 2: try begins the block that may raise an exception, so the failure can be handled deliberately below.",
            "Line 3: int cannot convert the word four, so Python raises ValueError and control jumps straight out of the try block.",
            "Line 4: except names the exception type this code is prepared to handle, which keeps unrelated failures visible instead of hiding them.",
            "Line 5: format_exc returns the current traceback text, splitlines breaks it into lines, [-1] selects the last one, and print shows the type and message a log or report would record.",
          ],
        },
        {
          title: "State an internal contract with assert",
          code: 'def average(values):\n    assert values, "values must not be empty"\n    return sum(values) / len(values)\nprint(average([2, 4]))',
          output: "3.0",
          explanation: "The assertion documents the contract that average needs at least one value, and it fails fast with a readable message when that is not true. With two values present the function divides 6 by 2 and returns a float.",
          reasons: [
            "Line 1: def declares the helper that computes an average from a collection of numbers.",
            "Line 2: The assertion is the contract: an empty input has no meaningful average, so the function refuses it with a message instead of dividing by zero.",
            "Line 3: sum totals the values and len counts them, so the division produces the average as a float.",
            "Line 4: The call passes a non-empty list, so the contract holds and 3.0 is printed.",
          ],
        },
      ],
      exercise: {
        prompt: "Reuse the average function with its assertion, call average([]) inside try, catch AssertionError as error, and print error so the contract message appears.",
        starterCode: "def average(values):\n    assert values, \"values must not be empty\"\n    return sum(values) / len(values)\n# Handle the failed contract\n",
        solution: 'def average(values):\n    assert values, "values must not be empty"\n    return sum(values) / len(values)\ntry:\n    average([])\nexcept AssertionError as error:\n    print(error)',
        solutionExplanation: "The empty list violates the assertion, so AssertionError is raised with the contract message. Catching that specific type and printing the exception object shows the message without hiding unrelated errors.",
        testCases: [{ label: "Contract message", expected: "values must not be empty" }],
        hints: ["Wrap the failing call in try.", "Catch AssertionError as error.", "Print error so its message reaches the console."],
      },
      recap: ["Read a traceback from the bottom up: the last line names the failure and the message.", "traceback.format_exc() turns the current traceback into text that can be logged.", "assert records internal contracts; breakpoint() and coverage.py belong to a local environment, which the browser worker does not provide."],
      decisionGuide: [
        { use: "assert for internal contracts and programmer mistakes", insteadOf: "validating untrusted user input", reason: "Assertions catch broken assumptions during development, while user input needs real validation and a friendly error path that still works when assertions are disabled." },
        { use: "captured traceback text in logs and error reports", insteadOf: "a bare string such as \"it failed\"", reason: "The traceback keeps the exception type, message, and call path together, which is what makes the failure diagnosable later." },
      ],
    },
  ],
  19: [
    {
      title: "Memory layout: __slots__, weak references, and the collector",
      minutes: 29,
      summary: "Trim per-instance storage with __slots__, observe objects without owning them through weakref, and know when the collector matters.",
      learningGoals: ["Replace the per-instance dictionary with __slots__", "Take a weak reference to an object", "Explain reference counting and cycles"],
      explanation: "By default each instance keeps a dictionary of attributes, which is flexible but costs memory and lets any attribute exist. Declaring __slots__ replaces that dictionary with fixed slots, so instances use less space, unknown attributes raise AttributeError, and a class can no longer be given arbitrary fields. The trade is flexibility: a slot class also cannot be weakly referenced unless you include \"__weakref__\" in the slot list, because that field is what holds weak references. weakref.ref builds a reference that does not keep its target alive, which is how a cache can observe an object without owning it; once the last strong reference disappears the weak reference returns None. CPython frees most objects immediately by reference counting, and gc.collect() exists for the cycles that counting cannot break. Reach for these tools after measurement shows a problem, not before.",
      keywordNotes: [
        "__slots__ = (\"x\", \"y\") stores named attributes in fixed slots instead of a per-instance dictionary.",
        "Add \"__weakref__\" to __slots__ when instances must support weakref.ref; without it the class raises TypeError.",
        "A weak reference does not keep its target alive, so it returns None once the last strong reference is gone.",
      ],
      examples: [
        {
          title: "Store attributes in fixed slots",
          code: 'class Point:\n    __slots__ = ("x", "y")\n    def __init__(self, x, y):\n        self.x = x\n        self.y = y\npoint = Point(1, 2)\nprint(point.x + point.y)',
          output: "3",
          explanation: "The slot list declares exactly two attributes, so instances carry no per-instance dictionary. Assigning self.x and self.y works as usual, while point.z = 3 would raise AttributeError because z is not a declared slot.",
          reasons: [
            "Line 1: class starts the definition of the small value type.",
            "Line 2: The slot declaration replaces the instance dictionary with two named slots, which is the memory-saving decision this example demonstrates.",
            "Line 3: The initializer receives the two values that define a point.",
            "Line 4: Assigning to self.x stores the value in the declared x slot rather than in a dictionary.",
            "Line 5: The same happens for y, so the instance holds exactly the attributes the class promised.",
            "Line 6: Construction creates one instance with the two supplied values.",
            "Line 7: Reading both slots and adding them prints 3, which proves the attributes are stored and retrieved normally.",
          ],
        },
        {
          title: "Observe an object without owning it",
          code: 'import weakref\nclass Cache:\n    pass\nitem = Cache()\nreference = weakref.ref(item)\nprint(reference() is item)\ndel item\nprint(reference() is None)',
          output: "True\nTrue",
          explanation: "The weak reference points at the same object without increasing its reference count. Calling reference() returns the live object while a strong name exists; after del removes the last strong reference, the same call returns None because the object has been collected.",
          reasons: [
            "Line 1: The import makes the weakref module available for references that do not own their target.",
            "Line 2: An ordinary class is enough here; weak references work on any class that supports them.",
            "Line 3: pass completes the empty body because this example needs no custom behavior.",
            "Line 4: item is a strong reference: it keeps the new instance alive.",
            "Line 5: weakref.ref stores a reference that does not keep the instance alive, which is what a cache would keep instead of the object itself.",
            "Line 6: Calling the weak reference returns the live object, and is item confirms it is the same object rather than a copy.",
            "Line 7: del removes the only strong reference, leaving the weak reference unable to keep the object alive.",
            "Line 8: The weak reference now returns None, which is the signal that the target has been collected.",
          ],
        },
      ],
      exercise: {
        prompt: "Define Node with __slots__ = (\"value\", \"__weakref__\") and an initializer storing value. Create a node with \"task\", take a weak reference, delete the strong name, and print whether the weak reference is now None.",
        starterCode: "import weakref\n# A slot class that also supports weak references\n",
        solution: 'import weakref\nclass Node:\n    __slots__ = ("value", "__weakref__")\n    def __init__(self, value):\n        self.value = value\nnode = Node("task")\nreference = weakref.ref(node)\ndel node\nprint(reference() is None)',
        solutionExplanation: "The slot list declares the data slot and the __weakref__ field that makes weak references legal for this class. After the strong name is deleted, nothing keeps the node alive and the weak reference reports None.",
        testCases: [{ label: "Collected node", expected: "True" }],
        hints: ["Include both \"value\" and \"__weakref__\" in __slots__.", "Create the node, then take weakref.ref(node).", "Delete the strong name before testing reference() is None."],
      },
      recap: ["__slots__ replaces the per-instance dictionary with fixed attributes, trading flexibility for memory.", "A slot class needs __weakref__ before weak references are allowed.", "Weak references observe objects without owning them, and the collector handles cycles that reference counting cannot."],
      decisionGuide: [
        { use: "__slots__ for many small, fixed-shape objects", insteadOf: "per-instance dictionaries on every value in a large collection", reason: "Measure first: slots pay off when a program creates very many instances whose attributes never change shape." },
        { use: "weakref for caches and back-references", insteadOf: "a strong reference that keeps objects alive forever", reason: "A cache should be able to drop entries, and an observer should not extend the lifetime of the thing it observes." },
      ],
    },
  ],
  21: [
    {
      title: "Running external programs with subprocess",
      minutes: 27,
      summary: "Build an argument list instead of a shell string, and keep the external-program boundary explicit about what this sandbox can run.",
      learningGoals: ["Build a command as a list of arguments", "Explain why the list form avoids shell quoting problems", "Describe the result inspection a real call performs"],
      explanation: "subprocess.run() starts another program from Python. Pass the executable and its arguments as a list of strings, and the operating system receives each argument exactly as written, which keeps filenames containing spaces intact and avoids the quoting rules and injection risk that come with a shell string. shlex.split and shlex.join convert between a readable command line and that list form. A real call also inspects the outcome: check=True raises CalledProcessError when the exit status is non-zero, and capture_output=True with text=True collects stdout and stderr as text instead of letting them print directly. CodeForge runs Python inside a browser worker, which cannot create operating-system processes, so the examples here build and inspect commands rather than executing them; running a command for real belongs on a local machine or a server.",
      keywordNotes: [
        "subprocess.run([\"python\", \"-m\", \"json.tool\", \"data.json\"], check=True) runs a program and raises CalledProcessError on a non-zero exit status.",
        "capture_output=True with text=True records stdout and stderr as strings instead of writing them straight to the console.",
        "Prefer the list form over shell=True, because a shell string re-parses spaces and special characters that the list keeps literal.",
      ],
      examples: [
        {
          title: "Turn a command line into an argument list",
          code: 'import shlex\ncommand = "python -m json.tool data.json"\nprint(shlex.split(command))',
          output: "['python', '-m', 'json.tool', 'data.json']",
          explanation: "shlex.split applies the same quoting rules a shell would, then hands back the individual arguments. That list is what subprocess.run expects, so a command written for a person can be converted into the safe form.",
          reasons: [
            "Line 1: The import makes the shell-lexing helpers available for converting between text and argument lists.",
            "Line 2: A single string holds the command as a person would type it, which is convenient for reading but not yet safe to execute.",
            "Line 3: shlex.split applies shell quoting rules and returns one element per argument, which is the shape subprocess.run accepts.",
          ],
        },
        {
          title: "See why the list form matters",
          code: 'unsafe = "python report.py My File.txt"\nsafe = ["python", "report.py", "My File.txt"]\nprint(len(unsafe.split()))\nprint(len(safe))',
          output: "4\n3",
          explanation: "Splitting the text on spaces produces four pieces and silently separates the filename My File.txt into two arguments. The list keeps that name as one argument, which is exactly the difference a shell would otherwise decide for you.",
          reasons: [
            "Line 1: The string looks like a command but hides the fact that one filename contains a space.",
            "Line 2: The list states the intended arguments explicitly, with the spaced filename kept whole.",
            "Line 3: Splitting on whitespace gives four pieces, which shows how text loses the boundary that the list preserves.",
            "Line 4: The list still has three entries, so the filename reaches the program as a single argument.",
          ],
        },
      ],
      exercise: {
        prompt: "Build parts = [\"python\", \"-m\", \"json.tool\", \"data.json\"], print shlex.join(parts), and then print the number of arguments in the list.",
        starterCode: "import shlex\n# Convert an argument list back into readable command text\n",
        solution: 'import shlex\nparts = ["python", "-m", "json.tool", "data.json"]\nprint(shlex.join(parts))\nprint(len(parts))',
        solutionExplanation: "shlex.join does the reverse of split: it quotes and joins the list into one readable command line while preserving argument boundaries, and len confirms how many arguments the list carries.",
        testCases: [{ label: "Joined command and count", expected: "python -m json.tool data.json\n4" }],
        hints: ["Keep each argument as its own list element.", "Use shlex.join(parts) to produce the readable form.", "Print len(parts) to count the arguments."],
      },
      recap: ["Pass arguments as a list so the operating system receives each one exactly as written.", "shlex.split and shlex.join convert between readable command text and the list form.", "A real call inspects returncode, stdout, and stderr; the browser worker cannot start operating-system processes, so this lesson builds commands instead of executing them."],
      decisionGuide: [
        { use: "a list of arguments with shell=False", insteadOf: "one shell string with shell=True", reason: "The list keeps spaces and special characters literal, so a value that came from a user cannot turn into an extra command." },
        { use: "check=True with captured output", insteadOf: "ignoring the exit status and letting output mix into the console", reason: "The call then reports failure as an exception and hands the program the text it needs to log or display." },
      ],
    },
  ],
};
