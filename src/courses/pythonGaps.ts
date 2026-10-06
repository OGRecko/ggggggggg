import type { LessonSeed } from "./pythonAdvanced";

/**
 * Genuine language and workflow gaps left after the authored Python track.
 * Every example in this file was executed with a local CPython 3.11 interpreter
 * and its documented output matched, so the lesson text never promises behavior
 * that was not actually observed. Where a workflow cannot run inside the browser
 * Pyodide worker (subprocess, pdb, coverage.py) the lesson says so explicitly
 * instead of pretending the sandbox executes it.
 */
const gapLessonRoundOne: Record<number, LessonSeed[]> = {
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

/**
 * Second pass: standard-library workflows that were still missing from the
 * authored track. Every example below was executed inside the same Pyodide
 * 0.29.3 runtime the app loads (CPython 3.13.2) with the app's stdout capture
 * behavior, and each documented output matched byte for byte.
 */
const gapLessonRoundTwo: Record<number, LessonSeed[]> = {
  6: [
    {
      title: "Wrapping, templates, and readable text",
      minutes: 25,
      summary: "Wrap long text to a chosen width, and fill a reusable template instead of concatenating strings by hand.",
      learningGoals: ["Wrap a paragraph with textwrap", "Fill a template with named values", "Choose a template over manual concatenation"],
      explanation: "Text that a person reads has a width limit, and text that a program reuses has placeholders. textwrap reflows a long string into lines that fit a requested width, which keeps console output and reports readable without hand-placed breaks. string.Template stores placeholders such as $name and fills them from named values, so one reusable message stays separate from the data it receives. substitute raises KeyError when a value is missing, while safe_substitute leaves the unknown placeholder in place, which suits data that is still incomplete. Both tools belong to the display boundary: build the data first, then format it once.",
      keywordNotes: [
        "textwrap.fill(text, width=n) reflows one string so each line fits the width and breaks at word boundaries.",
        "string.Template(\"...$name...\").substitute(name=...) replaces every named placeholder and raises KeyError when one is missing.",
        "safe_substitute leaves an unknown placeholder untouched, which is useful when only part of the data exists yet.",
      ],
      examples: [
        {
          title: "Wrap a long note",
          code: 'import textwrap\nnote = "Remember to read the failing line before editing any code."\nprint(textwrap.fill(note, width=30))',
          output: "Remember to read the failing\nline before editing any code.",
          explanation: "The stored sentence stays complete and unbroken. fill reflows it for display, cutting at word boundaries so no word is split and each resulting line fits the requested width.",
          reasons: [
            "Line 1: The import makes the wrapping helpers available; nothing is wrapped yet.",
            "Line 2: The full sentence is stored unchanged, which keeps the readable source text separate from its presentation.",
            "Line 3: textwrap.fill reflows that sentence into lines of at most 30 characters, breaking between words, and returns one string whose newlines print displays as separate lines.",
          ],
        },
        {
          title: "Fill a reusable template",
          code: 'from string import Template\ntemplate = Template("Hello, $name. You have $count new lessons.")\nprint(template.substitute(name="Ada", count=2))',
          output: "Hello, Ada. You have 2 new lessons.",
          explanation: "The template keeps the sentence with its placeholders intact, and substitute replaces each one with the matching named value. Every placeholder must be supplied: omitting count would raise KeyError instead of printing a half-filled message.",
          reasons: [
            "Line 1: The import brings in Template, which understands $name style placeholders.",
            "Line 2: The template stores the message once with two placeholders, so the wording lives in a single place instead of being rebuilt at every call site.",
            "Line 3: substitute walks the placeholders, inserts Ada and 2, and returns the completed text. Because substitute is strict, a missing name is reported as an error rather than silently skipped.",
          ],
        },
      ],
      exercise: {
        prompt: "Use string.Template with the text \"Hi $name, welcome to $course\" and fill name=\"Ada\" and course=\"CodeForge\". Print the completed message.",
        starterCode: "from string import Template\n# Fill in both placeholders\n",
        solution: 'from string import Template\ntemplate = Template("Hi $name, welcome to $course")\nprint(template.substitute(name="Ada", course="CodeForge"))',
        solutionExplanation: "Each placeholder is matched by name, so the order of the keyword arguments does not matter. substitute returns one completed string that print displays.",
        testCases: [{ label: "Filled template", expected: "Hi Ada, welcome to CodeForge" }],
        hints: ["Create the Template with both placeholders in one string.", "Pass name and course as keyword arguments.", "Print the value returned by substitute."],
      },
      recap: ["Wrap text at the display boundary instead of inserting manual line breaks.", "A template keeps one reusable wording with named placeholders.", "substitute is strict about missing values, while safe_substitute tolerates them."],
      decisionGuide: [
        { use: "textwrap.fill for readable output", insteadOf: "hand-placed newlines inside the source string", reason: "The sentence stays one readable value, and the width can change for a different console or report without editing the text." },
        { use: "string.Template for messages assembled from data", insteadOf: "joining fragments with + in every caller", reason: "The wording lives in one place and named placeholders make it obvious which values a message needs." },
      ],
    },
  ],
  7: [
    {
      title: "Temporary paths, file discovery, and copying",
      minutes: 29,
      summary: "Create a workspace that cleans itself up, find files by pattern, and copy file contents with the standard library.",
      learningGoals: ["Create and clean up a temporary directory", "Discover files by pattern with glob", "Copy a file with shutil"],
      explanation: "Programs that touch the filesystem need a place to work that cleans up after itself and reliable ways to find and copy files. tempfile.TemporaryDirectory creates a workspace whose contents are removed when the with block exits, so a failed run does not leave litter behind. glob matches path patterns such as *.txt and returns the matching paths, which is how a program discovers input files without being told each name. shutil copies, moves, and removes files and whole trees; copyfile copies contents to a destination path. This browser sandbox uses an in-memory filesystem, so these same calls work here while nothing survives a page reload.",
      keywordNotes: [
        "tempfile.TemporaryDirectory() creates a workspace and removes its contents when the with block finishes.",
        "glob.glob(pattern) returns every path matching a shell-style pattern such as *.txt or notes/?.md.",
        "shutil.copyfile(source, target) copies file contents; shutil.copytree and shutil.rmtree work on whole directory trees.",
      ],
      examples: [
        {
          title: "Write and find a file in a temporary workspace",
          code: 'import glob, os, tempfile\nwith tempfile.TemporaryDirectory() as folder:\n    note = os.path.join(folder, "note.txt")\n    with open(note, "w", encoding="utf-8") as handle:\n        handle.write("remember\\n")\n    print(os.path.basename(note))\n    print(len(glob.glob(os.path.join(folder, "*.txt"))))',
          output: "note.txt\n1",
          explanation: "Three modules do three separate jobs: tempfile owns the workspace, os builds portable paths, and glob finds files by pattern. The directory disappears when the with block ends, so the example leaves nothing behind.",
          reasons: [
            "Line 1: glob finds files by pattern, os joins paths portably, and tempfile creates a self-cleaning workspace.",
            "Line 2: The with statement asks tempfile for a directory and binds its path to folder; when the block exits, that directory and its contents are removed.",
            "Line 3: os.path.join builds the file path inside the workspace, which keeps the code working on different operating systems instead of hard-coding a separator.",
            "Line 4: Opening with the w mode creates the file for writing, encoding=\"utf-8\" states how the text is encoded, and the with block guarantees the handle closes.",
            "Line 5: The write call stores one line of text, including its newline character.",
            "Line 6: os.path.basename strips the directory part, so the printed result is just note.txt rather than a long temporary path.",
            "Line 7: The pattern *.txt matches every text file in the workspace, and len reports that exactly one file was found.",
          ],
        },
        {
          title: "Copy a file and list the result",
          code: 'import glob, os, shutil, tempfile\nwith tempfile.TemporaryDirectory() as folder:\n    source = os.path.join(folder, "draft.txt")\n    with open(source, "w", encoding="utf-8") as handle:\n        handle.write("draft\\n")\n    target = os.path.join(folder, "final.txt")\n    shutil.copyfile(source, target)\n    print(sorted(os.path.basename(path) for path in glob.glob(os.path.join(folder, "*.txt"))))',
          output: "['draft.txt', 'final.txt']",
          explanation: "copyfile needs both a source and a destination path, and it copies contents rather than moving them. Directory listings have no guaranteed order, so sorted makes the printed evidence stable.",
          reasons: [
            "Line 1: Four modules cover the work: path building, pattern matching, copying, and the temporary workspace.",
            "Line 2: The temporary directory is created and will be removed automatically at the end of the block.",
            "Line 3: The source path draft.txt is built inside that workspace.",
            "Line 4: The file is opened for text writing with an explicit encoding and a guaranteed close.",
            "Line 5: One line of content is written, so the copy has something to duplicate.",
            "Line 6: The destination path final.txt is built, showing that copying always names both ends.",
            "Line 7: copyfile duplicates the contents, glob finds both text files, and sorted with basename produces a stable, readable order.",
          ],
        },
      ],
      exercise: {
        prompt: "Create a temporary directory, write the text \"notes\" into a file named lesson.md inside it, and print how many .md files the pattern finds.",
        starterCode: "import glob, os, tempfile\n# Write one file, then count the matches\n",
        solution: 'import glob, os, tempfile\nwith tempfile.TemporaryDirectory() as folder:\n    path = os.path.join(folder, "lesson.md")\n    with open(path, "w", encoding="utf-8") as handle:\n        handle.write("notes\\n")\n    print(len(glob.glob(os.path.join(folder, "*.md"))))',
        solutionExplanation: "The with block owns the workspace and the file handle, so both are released no matter how the block ends. The pattern matches files by extension rather than by exact name.",
        testCases: [{ label: "Markdown files found", expected: "1" }],
        hints: ["Create the workspace with tempfile.TemporaryDirectory().", "Build the file path with os.path.join.", "Count the matches returned by glob.glob with a *.md pattern."],
      },
      recap: ["Temporary directories clean themselves up when their with block ends.", "glob discovers files by pattern, so new inputs need no code change.", "shutil copies and removes files and trees; copyfile copies contents to a named destination."],
      decisionGuide: [
        { use: "tempfile.TemporaryDirectory for scratch work", insteadOf: "inventing a folder name in the project directory", reason: "The standard library picks a unique location and removes it afterwards, so runs cannot collide or leave debris." },
        { use: "a glob pattern to find input files", insteadOf: "a hard-coded list of file names", reason: "A new file that matches the pattern is picked up without editing the program." },
      ],
    },
  ],
  10: [
    {
      title: "Registering behavior by type with singledispatch",
      minutes: 27,
      summary: "Extend one function with type-specific behavior without editing the original definition or growing an if/elif chain.",
      learningGoals: ["Register a specialized handler", "Keep a general fallback for other types", "Choose dispatch over repeated isinstance checks"],
      explanation: "Sometimes one operation has a general meaning but needs different behavior for a few specific types. functools.singledispatch lets you define that general function once, then register specialized implementations for chosen argument types. The implementation is picked from the type of the first argument, and the general function remains the fallback for every type you have not registered. Registrations live where the specialized behavior is needed, so extending the function does not mean editing its original body or adding another branch to a long if/elif chain.",
      keywordNotes: [
        "@singledispatch turns the decorated function into the general fallback and gives it a .register attribute.",
        "@describe.register attaches the function below as the handler for the type named in its annotation.",
        "Handlers keep the same documented contract even though the returned behavior differs by type.",
      ],
      examples: [
        {
          title: "Specialize one type and keep the fallback",
          code: 'from functools import singledispatch\n@singledispatch\ndef describe(value):\n    return "unknown"\n@describe.register\ndef _(value: int):\n    return "whole number"\nprint(describe(3))\nprint(describe("three"))',
          output: "whole number\nunknown",
          explanation: "The generic describe handles every type by default. The registered handler answers only for int, so the integer call takes the specialized branch while the string call falls back to the general one.",
          reasons: [
            "Line 1: The import brings in the singledispatch decorator from functools.",
            "Line 2: @singledispatch marks the function below as the general fallback and adds the register attribute used later.",
            "Line 3: The general function is defined once, with one signature that every caller uses.",
            "Line 4: Its body is the answer for any type that has no specialized handler.",
            "Line 5: @describe.register inspects the annotation on the next function and records it as the handler for int.",
            "Line 6: The handler is named _ because the registration, not the name, is what makes it reachable.",
            "Line 7: describe(3) dispatches on the type of 3, finds the int registration, and prints whole number.",
            "Line 8: describe(\"three\") has no str registration, so the general body prints unknown.",
          ],
        },
        {
          title: "Register a handler for your own type",
          code: 'from functools import singledispatch\nclass Money:\n    def __init__(self, cents):\n        self.cents = cents\n@singledispatch\ndef format_value(value):\n    return str(value)\n@format_value.register\ndef _(value: Money):\n    return "$" + str(value.cents / 100)\nprint(format_value(5))\nprint(format_value(Money(250)))',
          output: "5\n$2.5",
          explanation: "The generic function formats anything with str. The Money handler adds the domain-specific presentation, and both calls keep the same name and contract, so callers do not need to know which type they hold.",
          reasons: [
            "Line 1: The import supplies the decorator used to build the dispatch table.",
            "Line 2: The small class is the type that needs its own presentation.",
            "Line 3: The initializer stores the amount in cents as an integer.",
            "Line 4: The stored value is assigned, so the class needs no further behavior.",
            "Line 5: @singledispatch makes format_value the general entry point.",
            "Line 6: The general answer converts any value with str.",
            "Line 7: @format_value.register records the next function as the Money handler.",
            "Line 8: The handler receives a Money instance and divides cents by 100 to build the display form.",
            "Line 9: format_value(5) finds no int handler and uses the general body, printing 5.",
            "Line 10: format_value(Money(250)) finds the registered handler and prints $2.5.",
          ],
        },
      ],
      exercise: {
        prompt: "Define a generic kind(value) that returns \"other\", register an int handler returning \"int\", then print kind(1) and kind(\"one\").",
        starterCode: "from functools import singledispatch\n# Register one specialized handler\n",
        solution: 'from functools import singledispatch\n@singledispatch\ndef kind(value):\n    return "other"\n@kind.register\ndef _(value: int):\n    return "int"\nprint(kind(1))\nprint(kind("one"))',
        solutionExplanation: "The generic function answers for every type, and the registered handler adds the one specialization. Printing both calls shows the dispatch decision rather than assuming it.",
        testCases: [{ label: "Dispatched results", expected: "int\nother" }],
        hints: ["Decorate the generic function with @singledispatch.", "Register the int handler with @kind.register above a function annotated value: int.", "Print kind(1) and kind(\"one\") to compare the two paths."],
      },
      recap: ["singledispatch keeps one public function name with type-specific implementations behind it.", "The generic body is the fallback for every unregistered type.", "Registration separates new behavior from the original definition, which keeps long if/elif chains out of the code."],
      decisionGuide: [
        { use: "singledispatch for behavior that varies by argument type", insteadOf: "an if/elif chain of isinstance checks inside one function", reason: "Each type's behavior is registered next to its own type, and the dispatch table is built once instead of re-tested on every call." },
        { use: "a plain function for one behavior", insteadOf: "dispatch machinery with a single implementation", reason: "If every type takes the same path, the extra indirection adds a concept without adding capability." },
      ],
    },
  ],
  13: [
    {
      title: "operator helpers for sort keys and lookups",
      minutes: 24,
      summary: "Use itemgetter and attrgetter to express a field access as a reusable callable instead of a throwaway lambda.",
      learningGoals: ["Sort records by a field with itemgetter", "Sort objects by attribute with attrgetter", "Decide when a lambda is clearer"],
      explanation: "The operator module provides small callables for common access patterns, which is exactly the shape sorted expects for its key argument. itemgetter(1) builds a function that returns the element at index 1, so sorted(records, key=itemgetter(1)) reads as a sort on one field. attrgetter(\"minutes\") does the same for object attributes. Both are faster than an equivalent lambda for plain field access and both accept several fields, so itemgetter(0, 2) builds a two-part key in one call. Keep a lambda for a calculation that is more than a field read, because then the expression itself is the documentation.",
      keywordNotes: [
        "itemgetter(1) returns a callable that reads the element at index 1 of its argument, which is the usual sort-key shape.",
        "attrgetter(\"minutes\") returns a callable that reads that attribute from each item.",
        "Both accept several fields, so itemgetter(0, 2) or attrgetter(\"title\", \"minutes\") build multi-part keys.",
      ],
      examples: [
        {
          title: "Sort records by one field",
          code: 'from operator import itemgetter\nrecords = [("read", 3), ("build", 1)]\nprint(sorted(records, key=itemgetter(1)))',
          output: "[('build', 1), ('read', 3)]",
          explanation: "itemgetter(1) is a callable that pulls the second element from each tuple. sorted calls it once per record and orders the records by that number while keeping each pair intact.",
          reasons: [
            "Line 1: The import brings in itemgetter, the helper that turns an index into a callable.",
            "Line 2: Two tuples are stored as records, each pairing a label with a count.",
            "Line 3: sorted builds a new list ordered by whatever key returns. Here the key reads index 1, so the pair with the smaller count comes first and the tuples themselves are unchanged.",
          ],
        },
        {
          title: "Sort objects by attribute",
          code: 'from operator import attrgetter\nclass Lesson:\n    def __init__(self, title, minutes):\n        self.title = title\n        self.minutes = minutes\nlessons = [Lesson("Loops", 30), Lesson("Files", 20)]\nprint([lesson.title for lesson in sorted(lessons, key=attrgetter("minutes"))])',
          output: "['Files', 'Loops']",
          explanation: "attrgetter(\"minutes\") reads the minutes attribute from each object, so the sort compares durations. The comprehension then reports only the titles in their new order.",
          reasons: [
            "Line 1: The import supplies attrgetter for attribute-based keys.",
            "Line 2: The class describes one lesson with its title and estimated minutes.",
            "Line 3: The initializer receives the two values that define a lesson.",
            "Line 4: The title is stored on the instance for later reading.",
            "Line 5: The minutes value is stored as well, and this is the attribute the sort will use.",
            "Line 6: Two lesson objects are created for comparison.",
            "Line 7: attrgetter(\"minutes\") extracts the number to sort by, sorted returns the objects in that order, and the comprehension keeps only the titles so the printed evidence is simple.",
          ],
        },
      ],
      exercise: {
        prompt: "Create pairs = [(\"b\", 2), (\"a\", 1)] and print the list sorted by the first element using itemgetter(0).",
        starterCode: "from operator import itemgetter\n# Sort on the first field\n",
        solution: 'from operator import itemgetter\npairs = [("b", 2), ("a", 1)]\nprint(sorted(pairs, key=itemgetter(0)))',
        solutionExplanation: "itemgetter(0) reads the label from each pair, so the ordering follows the labels and the pairs stay whole. Because sorted returns a new list, the original order is untouched.",
        testCases: [{ label: "Sorted pairs", expected: "[('a', 1), ('b', 2)]" }],
        hints: ["Import itemgetter from operator.", "Pass key=itemgetter(0) to sorted.", "Print the returned list rather than a single element."],
      },
      recap: ["itemgetter and attrgetter turn a field access into a reusable callable.", "sorted with a key keeps the original items intact and only decides their order.", "Multi-field keys come from the same helpers, for example itemgetter(0, 2)."],
      decisionGuide: [
        { use: "itemgetter or attrgetter for a plain field", insteadOf: "a lambda that only reads one field", reason: "The helper states the access directly, avoids a function definition at every call site, and is implemented in C." },
        { use: "a lambda for a computed key", insteadOf: "forcing a field accessor to do arithmetic", reason: "When the key is a calculation, the expression itself explains the intent better than a helper call can." },
      ],
    },
  ],
  14: [
    {
      title: "f-string debug output and focused diagnostics",
      minutes: 23,
      summary: "Print a value together with the expression's own source text, and keep temporary output easy to remove.",
      learningGoals: ["Use the f-string = specifier", "Combine = with a format specifier", "Keep temporary diagnostics targeted"],
      explanation: "The f-string = specifier prints the expression exactly as written, then its value, so temporary output documents itself: f\"{value=}\" produces value=41 without repeating the name in text. It combines with a format specifier, as in f\"{rate=:.3f}\", and with a real expression such as f\"{count * 2=}\", which prints the source expression and the computed result together. Each line carries its own label, so a short burst of these prints answers what a value is and where it came from. Use them deliberately for one focused question, then remove them or replace the question with a test.",
      keywordNotes: [
        "f\"{value=}\" expands to the expression text, an equals sign, and the value's repr.",
        "f\"{rate=:.3f}\" places the format specifier after the = marker, so the label and the formatted value appear together.",
        "The = specifier uses repr, which shows a string with its quotes and makes trailing spaces visible.",
      ],
      examples: [
        {
          title: "Label a value with its own expression",
          code: 'value = 41\nprint(f"{value=}")\nprint(f"{value + 1=}")',
          output: "value=41\nvalue + 1=42",
          explanation: "The first line shows a name and its value. The second shows a whole expression and its result, which is what makes this form useful during an investigation: the output records the question as well as the answer.",
          reasons: [
            "Line 1: The variable is created with a known value so the printed lines can be checked.",
            "Line 2: The debug specifier prints the expression text value, then its value 41, so no separate label string is needed.",
            "Line 3: The same specifier with a computed expression prints value + 1=42, showing the source expression and the result together.",
          ],
        },
        {
          title: "Combine the debug marker with a format specifier",
          code: 'rate = 7 / 3\nprint(f"{rate=:.3f}")\nprint(f"{rate * 100=:.1f}%")',
          output: "rate=2.333\nrate * 100=233.3%",
          explanation: "The colon introduces a format specifier after the debug marker, so one line carries the label and a readable precision. The percent line appends a literal % outside the braces, keeping the unit visible without extra text.",
          reasons: [
            "Line 1: The division produces a repeating decimal, which is exactly the kind of value that needs rounding for display.",
            "Line 2: The debug marker prints rate= and the format specifier .3f rounds the value to three decimal places.",
            "Line 3: The expression is scaled by 100, formatted to one decimal place, and followed by a literal percent sign written outside the placeholder.",
          ],
        },
      ],
      exercise: {
        prompt: "Set count to 4 and print f\"{count=}\" and f\"{count * 2=}\".",
        starterCode: "count = 4\n# Print each value with its own expression text\n",
        solution: 'count = 4\nprint(f"{count=}")\nprint(f"{count * 2=}")',
        solutionExplanation: "The debug specifier prints the source text of each expression next to its value, so the console records both the label and the result on one line.",
        testCases: [{ label: "Debug output", expected: "count=4\ncount * 2=8" }],
        hints: ["Write the expression inside braces followed by =.", "Keep the whole f-string inside print(...).", "Use count * 2 for the second line."],
      },
      recap: ["The = specifier prints an expression and its value together, so temporary output labels itself.", "A format specifier can follow the marker to control precision.", "Targeted debug output answers one question; tests are the durable replacement for it."],
      decisionGuide: [
        { use: "f\"{value=}\" for a quick check", insteadOf: "a label string plus the variable name typed twice", reason: "The output cannot drift from the code, because the expression text is generated at runtime." },
        { use: "a test once the question is answered", insteadOf: "leaving debug prints in the final code", reason: "A test keeps protecting the behavior, while stray prints become noise in real output." },
      ],
    },
  ],
  15: [
    {
      title: "Abstract collection types for annotations",
      minutes: 26,
      summary: "Annotate a function with the behavior it needs rather than the concrete container it happens to receive.",
      learningGoals: ["Annotate with collections.abc types", "Check a category at runtime with isinstance", "Prefer behavior contracts over concrete classes"],
      explanation: "An annotation should describe what a function needs. collections.abc supplies the abstract types that name those needs: Iterable for anything a loop can pull values from, Sequence for ordered indexed access, Mapping for key lookups, and Set for uniqueness. Annotating a parameter as Iterable[int] tells the caller that any iterable of integers will do, so a list, a set, and a range all qualify. The same types work with isinstance at runtime, which lets a function branch on a category instead of listing concrete classes. Reach for a concrete type in an annotation only when the function truly depends on that concrete behavior.",
      keywordNotes: [
        "collections.abc.Iterable describes anything that can be iterated, including lists, sets, generators, and ranges.",
        "collections.abc.Sequence adds ordering and indexing, Mapping adds key lookup, and Set adds uniqueness semantics.",
        "The abstract types work with isinstance at runtime, so one contract can describe both the annotation and the check.",
      ],
      examples: [
        {
          title: "Ask for an iterable, not a list",
          code: 'from collections.abc import Iterable\ndef total(values: Iterable[int]) -> int:\n    return sum(values)\nprint(total([1, 2, 3]))\nprint(total({4, 5}))',
          output: "6\n9",
          explanation: "The annotation promises only that values can be iterated, and sum needs nothing more. A list and a set both satisfy that promise, so neither caller has to convert data just to satisfy the signature.",
          reasons: [
            "Line 1: The import brings in the abstract type that names iteration behavior.",
            "Line 2: The parameter is annotated Iterable[int], which accepts any iterable of integers, and the return annotation states that the result is an integer.",
            "Line 3: sum consumes the iterable without needing indexes or a length, which is why the abstract type is enough.",
            "Line 4: A list satisfies the contract and the total is 6.",
            "Line 5: A set also satisfies the contract, and its total is 9, which proves the function did not secretly depend on list behavior.",
          ],
        },
        {
          title: "Branch on a behavior category",
          code: 'from collections.abc import Mapping, Sequence\ndef shape_of(value):\n    if isinstance(value, Mapping):\n        return "mapping"\n    if isinstance(value, Sequence):\n        return "sequence"\n    return "other"\nprint(shape_of({"a": 1}))\nprint(shape_of("text"))\nprint(shape_of(3))',
          output: "mapping\nsequence\nother",
          explanation: "isinstance with an abstract type asks what a value can do, not which class it is. A dictionary reports as a mapping, a string reports as a sequence because text supports indexed access and slicing, and an integer falls through to other.",
          reasons: [
            "Line 1: The two abstract types describe key lookup and ordered indexed access.",
            "Line 2: The function accepts any value and classifies it by behavior.",
            "Line 3: The first check asks whether the value supports mapping-style key lookup.",
            "Line 4: A dictionary satisfies that check, so the function stops there.",
            "Line 5: The second check asks for sequence behavior, which includes ordering and indexing.",
            "Line 6: Text satisfies the sequence contract, which is a useful fact to remember when a string arrives where a list of items was expected.",
            "Line 7: Anything supporting neither behavior is reported as other.",
            "Line 8: The dictionary prints mapping, the text prints sequence, and the integer prints other.",
          ],
        },
      ],
      exercise: {
        prompt: "Annotate count_all(values: Iterable[int]) -> int, return how many values it receives, and print count_all([1, 2, 3]) followed by count_all(range(5)).",
        starterCode: "from collections.abc import Iterable\n# Count the values a caller supplied\n",
        solution: 'from collections.abc import Iterable\ndef count_all(values: Iterable[int]) -> int:\n    return sum(1 for _ in values)\nprint(count_all([1, 2, 3]))\nprint(count_all(range(5)))',
        solutionExplanation: "The generator adds 1 for each produced value without building a list, and range shows that a lazily produced sequence satisfies the same annotation as a concrete list.",
        testCases: [{ label: "Counted values", expected: "3\n5" }],
        hints: ["Import Iterable from collections.abc.", "Use sum(1 for _ in values) so the input is only iterated once.", "Print both calls to show that a list and a range both qualify."],
      },
      recap: ["Abstract collection types let an annotation state the behavior a function actually uses.", "The same types work with isinstance, so a contract can be checked at runtime.", "Annotate the concrete type only when the function depends on that exact behavior."],
      decisionGuide: [
        { use: "Iterable or Sequence in a parameter annotation", insteadOf: "list everywhere by default", reason: "The annotation stops promising something the function never needed, so callers can pass sets, ranges, or generators without converting first." },
        { use: "Mapping or Sequence checks for flexible input", insteadOf: "checking for dict or list specifically", reason: "The abstract check accepts every compatible type and keeps the branch tied to the behavior the code depends on." },
      ],
    },
  ],
  23: [
    {
      title: "Class patterns and matching objects",
      minutes: 26,
      summary: "Match on an object's type and attributes, and declare which attributes positional patterns may capture.",
      learningGoals: ["Match attributes with a keyword class pattern", "Declare __match_args__ for positional patterns", "Keep one branch per accepted shape"],
      explanation: "Pattern matching also works on objects. A class pattern such as case Point(x=0, y=0) checks that the subject is a Point and that its attributes hold those values. Positional patterns such as case Message(\"lesson\", title) rely on __match_args__, a class attribute listing which attribute names fill those positions, which is why the compact form is legal only when the class declares it. Keyword patterns keep working either way. Class patterns follow the same discipline as dictionary patterns: each branch states one accepted shape, and anything unmatched falls through to case _.",
      keywordNotes: [
        "case Point(x=0, y=0) matches an instance of Point whose x and y attributes are both 0.",
        "__match_args__ = (\"x\", \"y\") declares which attributes positional class patterns capture, in order.",
        "A class pattern checks the type before reading attributes, so an unrelated object simply does not match.",
      ],
      examples: [
        {
          title: "Match a value object by attribute",
          code: 'class Point:\n    __match_args__ = ("x", "y")\n    def __init__(self, x, y):\n        self.x = x\n        self.y = y\nmatch Point(0, 0):\n    case Point(x=0, y=0):\n        print("origin")\n    case Point():\n        print("point")',
          output: "origin",
          explanation: "The first pattern demands both attributes to be 0, so a point at the origin takes that branch. The second pattern matches any Point at all, which is a useful fallback that still refuses unrelated types.",
          reasons: [
            "Line 1: The class declares the object type that the patterns will recognize.",
            "Line 2: __match_args__ names the attributes in order, which allows positional class patterns to capture x and y.",
            "Line 3: The initializer receives the two coordinates.",
            "Line 4: The coordinate is stored on the instance so patterns can read it.",
            "Line 5: The second coordinate is stored the same way.",
            "Line 6: The subject Point(0, 0) is the value being matched.",
            "Line 7: The pattern checks the type and both attribute values at once; all three must hold.",
            "Line 8: When the pattern matches, this branch runs and prints origin.",
            "Line 9: A class pattern with no attribute checks accepts any instance of Point.",
            "Line 10: That branch prints point for every other coordinate pair, which is the shape-one-branch-each style at work.",
          ],
        },
        {
          title: "Capture attributes from a positional pattern",
          code: 'class Message:\n    __match_args__ = ("kind", "title")\n    def __init__(self, kind, title):\n        self.kind = kind\n        self.title = title\ndef label(message):\n    match message:\n        case Message("lesson", title):\n            return title\n        case Message(kind):\n            return "unsupported: " + kind\n    return "missing"\nprint(label(Message("lesson", "Functions")))\nprint(label(Message("ping", "")))',
          output: "Functions\nunsupported: ping",
          explanation: "The positional pattern compares the first attribute to the literal \"lesson\" and binds the second attribute to the name title. A message of another kind still matches the second branch, which captures its kind so the caller gets a specific message instead of a generic failure.",
          reasons: [
            "Line 1: The class describes a tagged message with two attributes.",
            "Line 2: __match_args__ makes the positional pattern legal by declaring kind first and title second.",
            "Line 3: The initializer receives the tag and the payload.",
            "Line 4: The kind attribute is stored for the pattern to compare.",
            "Line 5: The title attribute is stored so a pattern can capture it.",
            "Line 6: The helper accepts one message and decides what to return.",
            "Line 7: match begins structural matching on that single value.",
            "Line 8: This pattern requires a Message whose kind equals lesson and captures its title.",
            "Line 9: The captured title is returned as the answer.",
            "Line 10: This pattern accepts any other Message and captures its kind, which is the fallback for known-but-unsupported tags.",
            "Line 11: The captured kind is included in a specific message.",
            "Line 12: Reaching this line means the subject was not a Message at all.",
            "Line 13: A lesson message prints its title, Functions.",
            "Line 14: The ping message takes the fallback branch and prints unsupported: ping.",
          ],
        },
      ],
      exercise: {
        prompt: "Define Shape with __match_args__ = (\"kind\",) and one attribute kind. Match Shape(\"circle\") and print round for the keyword pattern case Shape(kind=\"circle\"), otherwise print other.",
        starterCode: "class Shape:\n    # Declare the attribute that patterns may capture\n",
        solution: 'class Shape:\n    __match_args__ = ("kind",)\n    def __init__(self, kind):\n        self.kind = kind\nmatch Shape("circle"):\n    case Shape(kind="circle"):\n        print("round")\n    case Shape():\n        print("other")',
        solutionExplanation: "The keyword pattern checks the type and one attribute value. The bare class pattern is the fallback for any other shape, so only accepted shapes run the first branch.",
        testCases: [{ label: "Matched shape", expected: "round" }],
        hints: ["Declare __match_args__ = (\"kind\",) in the class body.", "Write the first case as Shape(kind=\"circle\").", "Add case Shape() as the fallback branch."],
      },
      recap: ["Class patterns match a type and its attributes in one branch.", "__match_args__ declares which attributes positional patterns capture, in order.", "A bare class pattern is the natural fallback when the type is right but no earlier shape matched."],
      decisionGuide: [
        { use: "a class pattern for objects with known attributes", insteadOf: "reading attributes inside nested if checks", reason: "The type check and the attribute comparison appear together, so each accepted shape is visible at a glance." },
        { use: "keyword patterns by default", insteadOf: "positional patterns everywhere", reason: "Named attributes stay correct when the class gains a field, while positional patterns depend on the declared order." },
      ],
    },
    {
      title: "Suppressing expected errors and stacking cleanup",
      minutes: 24,
      summary: "Ignore one known-and-harmless failure with contextlib.suppress, and manage several resources with ExitStack.",
      learningGoals: ["Suppress one specific exception", "Manage several context managers with ExitStack", "Decide when suppressing is honest"],
      explanation: "Some failures are expected and carry no useful information: a probe file that is simply absent, a cache key that was never stored. contextlib.suppress(SomeError) turns that one exception into a no-op for the indented block, while every other exception still propagates, which is what keeps the silence honest. ExitStack manages a variable number of context managers: each enter_context call registers another resource, and all of them are closed in reverse order when the block ends. Use suppress for a specific, understood failure with a defined next step, never as a way to hide an error whose cause is still unknown.",
      keywordNotes: [
        "contextlib.suppress(ExpectedError) ignores that one exception type inside its block and lets every other type propagate.",
        "ExitStack.enter_context(manager) registers context managers dynamically and unwinds them all in reverse order.",
        "Suppressing is honest when the failure is understood and the code has a defined behavior for it.",
      ],
      examples: [
        {
          title: "Ignore one expected failure",
          code: 'import contextlib\nwith contextlib.suppress(FileNotFoundError):\n    open("/missing/report.txt", encoding="utf-8")\nprint("continued")',
          output: "continued",
          explanation: "The missing file raises FileNotFoundError, which is exactly the type the block suppresses, so execution continues at the next statement. A different error, such as a permission problem, would still stop the program and stay visible.",
          reasons: [
            "Line 1: The import brings in the context manager that filters one exception type.",
            "Line 2: The block declares that FileNotFoundError is expected and harmless here, so it will be swallowed rather than raised.",
            "Line 3: Opening the absent path raises the expected exception, which exits the block silently instead of crashing the program.",
            "Line 4: Execution continues after the with block, which proves the failure was handled rather than ignored by accident.",
          ],
        },
        {
          title: "Manage several resources with ExitStack",
          code: 'from contextlib import ExitStack\nimport io\nwith ExitStack() as stack:\n    first = stack.enter_context(io.StringIO("a"))\n    second = stack.enter_context(io.StringIO("b"))\n    print(first.getvalue() + second.getvalue())',
          output: "ab",
          explanation: "ExitStack owns both streams: each enter_context call registers a resource and arranges its cleanup, which matters when the number of resources is not known until the loop or branch runs. At the end of the block every registered resource is closed in reverse order.",
          reasons: [
            "Line 1: The import supplies ExitStack, which manages a dynamic set of context managers.",
            "Line 2: io provides the in-memory streams used as the example resources.",
            "Line 3: The with statement creates the stack; leaving the block unwinds every resource it registered.",
            "Line 4: The first stream is registered and bound to first, so it will be closed by the stack rather than by a separate with statement.",
            "Line 5: A second stream is registered the same way, showing that the count can grow at runtime.",
            "Line 6: Both streams are read and their contents are joined, which prints ab before the cleanup runs.",
          ],
        },
      ],
      exercise: {
        prompt: "Create an empty dictionary data, suppress KeyError while reading data[" + '"missing"' + "], then print safe.",
        starterCode: "import contextlib\ndata = {}\n# Ignore the one expected lookup failure\n",
        solution: 'import contextlib\ndata = {}\nwith contextlib.suppress(KeyError):\n    print(data["missing"])\nprint("safe")',
        solutionExplanation: "The missing key raises KeyError, which the block suppresses, so the print inside never runs and the program continues to print safe.",
        testCases: [{ label: "Continues after the suppressed error", expected: "safe" }],
        hints: ["Wrap the lookup in with contextlib.suppress(KeyError).", "Read a key that does not exist inside the block.", "Print safe after the block."],
      },
      recap: ["suppress ignores one named exception type and lets every other type propagate.", "ExitStack registers context managers dynamically and closes them in reverse order.", "Suppressing is only honest when the failure is expected and the code has a defined next step."],
      decisionGuide: [
        { use: "suppress for one understood failure", insteadOf: "a bare except that hides every error", reason: "Naming the type keeps unrelated failures visible, which is what makes the silence safe to read later." },
        { use: "ExitStack when the number of resources varies", insteadOf: "nesting with statements until the indentation hides the logic", reason: "One block registers every resource and guarantees a reverse-order cleanup regardless of how many were opened." },
      ],
    },
  ],
  24: [
    {
      title: "Configuration files and dictionary logging",
      minutes: 28,
      summary: "Read settings from an INI file and configure logging from one data structure instead of scattered calls.",
      learningGoals: ["Read sections and typed values with configparser", "Configure logging with dictConfig", "Keep configuration out of business logic"],
      explanation: "Configuration belongs outside the code that uses it. configparser reads INI text with labelled sections and key-value pairs, and its typed accessors such as getint convert the stored text into the type the caller needs. Logging has a matching data-driven setup: logging.config.dictConfig accepts one dictionary describing handlers, formatters, and levels, so the entire logging shape is configured in one place. Both tools follow the same boundary rule as environment variables: read and convert at the edge, validate there, then pass plain values into the application. In this browser sandbox a handler must write to stdout, because the console shown here is stdout.",
      keywordNotes: [
        "configparser.ConfigParser().read_string(text) parses INI text, and parser[\"section\"][\"key\"] reads a raw string value.",
        "Typed accessors such as getint and getboolean convert the stored text at the configuration boundary.",
        "logging.config.dictConfig({...}) configures handlers, formatters, and levels from one dictionary; a StreamHandler writing to ext://sys.stdout reaches this lesson console.",
      ],
      examples: [
        {
          title: "Read typed settings from INI text",
          code: 'import configparser\nsettings_text = """[server]\nhost = localhost\nport = 8000\n"""\nparser = configparser.ConfigParser()\nparser.read_string(settings_text)\nprint(parser["server"]["host"])\nprint(parser.getint("server", "port"))',
          output: "localhost\n8000",
          explanation: "read_string parses the INI text into sections and keys. The host arrives as plain text, while getint converts the stored port text into an integer, which is the step that keeps string configuration from leaking into arithmetic.",
          reasons: [
            "Line 1: The import makes the INI parser available.",
            "Line 2: A triple-quoted string holds the configuration text exactly as a file would contain it, including the [server] section header.",
            "Line 3: The host value is stored as text, which is how every configuration value arrives.",
            "Line 4: The port is also stored as text, even though the program needs a number later.",
            "Line 5: The closing delimiter ends the configuration text.",
            "Line 6: A parser instance is created to hold the parsed sections.",
            "Line 7: read_string parses the text directly, which keeps the example runnable without a real configuration file on disk.",
            "Line 8: Indexing by section and key reads the raw string value localhost.",
            "Line 9: getint converts the stored text into the integer 8000, so the boundary is the only place that deals with string conversion.",
          ],
        },
        {
          title: "Configure logging from one dictionary",
          code: 'import logging\nimport logging.config\nlogging.config.dictConfig({\n    "version": 1,\n    "handlers": {"console": {"class": "logging.StreamHandler", "stream": "ext://sys.stdout"}},\n    "root": {"handlers": ["console"], "level": "INFO"},\n})\nlogging.getLogger("codeforge.app").info("service ready")',
          output: "service ready",
          explanation: "The dictionary states the whole logging shape: one handler that writes to stdout, attached to the root logger at INFO level. After that single call, any named logger in the program follows the same configuration, so logging setup never spreads across modules.",
          reasons: [
            "Line 1: The logging package supplies the logger objects the program uses.",
            "Line 2: The configuration submodule provides dictConfig.",
            "Line 3: dictConfig opens the single dictionary that describes the whole logging setup.",
            "Line 4: The version key is required by the configuration schema.",
            "Line 5: One handler named console is declared as a StreamHandler whose stream is stdout, which is why this lesson can show the logged line.",
            "Line 6: The root logger receives that handler and an INFO threshold, so lower-priority debug records stay quiet.",
            "Line 7: The dictionary ends here, and applying it happens during the call.",
            "Line 8: A named logger created after configuration inherits the root setup, and its info record reaches the console.",
          ],
        },
      ],
      exercise: {
        prompt: "Parse the INI text [app] with mode = fast using ConfigParser, print the mode value, then print whether the app section exists.",
        starterCode: "import configparser\n# Read one section and one setting\n",
        solution: 'import configparser\nparser = configparser.ConfigParser()\nparser.read_string("[app]\\nmode = fast\\n")\nprint(parser["app"]["mode"])\nprint(parser.has_section("app"))',
        solutionExplanation: "read_string parses the section header and the key-value pair, indexing returns the raw text, and has_section confirms the parser recognized the section that was read.",
        testCases: [{ label: "Parsed setting", expected: "fast\nTrue" }],
        hints: ["Include the [app] header and the mode = fast line in the INI text.", "Read the value with parser[\"app\"][\"mode\"].", "Check the section with parser.has_section(\"app\")."],
      },
      recap: ["configparser reads INI sections and gives typed accessors for conversion at the boundary.", "dictConfig configures the whole logging shape in one dictionary.", "Configuration is read and validated at the edge, then passed inward as plain values."],
      decisionGuide: [
        { use: "one dictConfig call at startup", insteadOf: "handlers and levels added in several modules", reason: "The configuration is visible in one place, and modules only ask for a named logger instead of reshaping the logging system." },
        { use: "typed accessors such as getint", insteadOf: "indexing the raw string and converting it deep inside the code", reason: "Conversion and validation happen once at the configuration boundary, so business logic always receives the type it expects." },
      ],
    },
    {
      title: "Warnings and staged deprecation",
      minutes: 25,
      summary: "Signal that an interface is going away, and control how those warnings behave for callers and tests.",
      learningGoals: ["Issue a DeprecationWarning with context", "Capture and inspect warnings", "Promote a warning to an error to enforce migration"],
      explanation: "A warning describes the future of an interface rather than a failure of the current call. warnings.warn(..., DeprecationWarning) tells callers that a function or argument is on its way out, and stacklevel=2 points the report at the caller's line instead of the library's own code. Warnings are filterable: the default policy hides DeprecationWarning outside __main__, warnings.simplefilter(\"always\") shows every occurrence, and simplefilter(\"error\") promotes the warning into an exception so a test fails while the old usage is still cheap to fix. Issuing the warning a release before removal is what gives callers time to migrate.",
      keywordNotes: [
        "warnings.warn(message, DeprecationWarning, stacklevel=2) reports the deprecation and points the location at the caller.",
        "warnings.catch_warnings(record=True) captures warnings as objects so a program or test can inspect category and message.",
        "warnings.simplefilter(\"error\", DeprecationWarning) turns the warning into an exception, which is how a test enforces migration.",
      ],
      examples: [
        {
          title: "Capture a deprecation warning as evidence",
          code: 'import warnings\nwith warnings.catch_warnings(record=True) as caught:\n    warnings.simplefilter("always")\n    warnings.warn("load_config() moves to settings.load_config()", DeprecationWarning)\n    print(caught[0].category.__name__)\n    print(caught[0].message)',
          output: "DeprecationWarning\nload_config() moves to settings.load_config()",
          explanation: "catch_warnings(record=True) turns warnings into objects instead of console noise, and simplefilter(\"always\") makes sure the record is not filtered out. Reading category and message proves what the caller would see.",
          reasons: [
            "Line 1: The import makes the warnings machinery available.",
            "Line 2: The context manager captures warnings raised inside the block and stores them in the caught list.",
            "Line 3: The always filter overrides the default policy, which would hide a DeprecationWarning raised outside __main__.",
            "Line 4: The warning is raised with the standard deprecation category, and its message names the replacement call.",
            "Line 5: The recorded object exposes its category, and __name__ prints the readable class name.",
            "Line 6: The message attribute holds the text the developer wrote, which is what a migration guide would quote.",
          ],
        },
        {
          title: "Promote a warning to an error",
          code: 'import warnings\ndef old_api():\n    warnings.warn("old_api is deprecated", DeprecationWarning, stacklevel=2)\nwarnings.simplefilter("error", DeprecationWarning)\ntry:\n    old_api()\nexcept DeprecationWarning as problem:\n    print("raised:", problem)',
          output: "raised: old_api is deprecated",
          explanation: "The error filter turns the deprecation into an exception, so any remaining use fails immediately instead of scrolling past. stacklevel=2 makes the reported location the caller's line, which is where the fix belongs.",
          reasons: [
            "Line 1: The import supplies the warning tools.",
            "Line 2: The function represents an interface that is being retired.",
            "Line 3: It warns with the deprecation category, and stacklevel=2 shifts the reported location from this line to the caller's.",
            "Line 4: The filter is set to treat this category as an error rather than a message.",
            "Line 5: The call is wrapped so the example can demonstrate the raised exception.",
            "Line 6: The deprecated function is called, producing the promoted exception.",
            "Line 7: The handler catches the DeprecationWarning class itself, which is possible precisely because it was promoted.",
            "Line 8: Printing the exception shows the message that names the deprecated interface.",
          ],
        },
      ],
      exercise: {
        prompt: "Capture warnings, emit \"use new_api instead\" as a DeprecationWarning, and print the recorded message.",
        starterCode: "import warnings\n# Record one deprecation warning\n",
        solution: 'import warnings\nwith warnings.catch_warnings(record=True) as caught:\n    warnings.simplefilter("always")\n    warnings.warn("use new_api instead", DeprecationWarning)\nprint(caught[0].message)',
        solutionExplanation: "The recorded list keeps the warning object after the block, and its message attribute holds the text that was passed to warn.",
        testCases: [{ label: "Recorded warning", expected: "use new_api instead" }],
        hints: ["Use warnings.catch_warnings(record=True) as caught.", "Add simplefilter(\"always\") so the warning is not filtered out.", "Print caught[0].message."],
      },
      recap: ["A deprecation warning announces a planned removal without breaking current callers.", "stacklevel points the report at the caller, which is where the migration happens.", "Filters decide whether a warning is shown, hidden, or raised as an error in tests."],
      decisionGuide: [
        { use: "a DeprecationWarning with a replacement named in the message", insteadOf: "silently changing behavior in a release", reason: "Callers learn what to change and why while the old path still works, which is what makes a staged migration possible." },
        { use: "simplefilter(\"error\") in the project's own tests", insteadOf: "ignoring deprecations until removal", reason: "The test suite fails at the first use of the old API, when the fix is a one-line change instead of an emergency." },
      ],
    },
  ],
};

const pythonGapLessons: Record<number, LessonSeed[]> = {};
for (const [key, lessons] of Object.entries(gapLessonRoundOne)) {
  pythonGapLessons[Number(key)] = [...lessons];
}
for (const [key, lessons] of Object.entries(gapLessonRoundTwo)) {
  const chapter = Number(key);
  pythonGapLessons[chapter] = [...(pythonGapLessons[chapter] ?? []), ...lessons];
}

export { pythonGapLessons };
