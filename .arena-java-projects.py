"""Author real Java chapter-project solutions, replacing generated placeholders.

Every shipped Java chapter project used modifiedCode(...) output: a chapter sample plus an
injected System.out.println("modified"), which ignored the project prompt and contradicted the
project's stated expected output. This script inserts authored solutions, honest explanations,
and matching test cases into src/courses/java.ts.
"""
import json
from pathlib import Path

JAVA = Path('/home/user/ggggggggg/src/courses/java.ts')
SOURCE = JAVA.read_text()
PROJECTS = {row['chapter']: row for row in json.load(open('/tmp/java_projects.json'))}

NO_JDK = "No JDK runs in this browser: CodeForge reviews this source structurally and the expected output is derived by hand from the code, not executed."

SOLUTIONS = {
    1: (
        '''public class Main {
    public static void main(String[] args) {
        System.out.println("JDK launches the Java compiler");
    }
}''',
        "One Main class with the standard entry point prints the single line the prompt asks for.",
        "JDK launches the Java compiler",
    ),
    2: (
        '''public class Main {
    public static void main(String[] args) {
        int score = 8;
        double average = 8.5;
        String[] labels = {"core", "stretch"};
        System.out.println(labels[0] + " score=" + score + " average=" + (int) average);
    }
}''',
        "The int and the double store primitive values, the String[] stores reference values, and the cast truncates 8.5 to 8 on purpose.",
        "core score=8 average=8",
    ),
    3: (
        '''public class Main {
    public static void main(String[] args) {
        int[] scores = {3, -1, 4, 2};
        int total = 0;
        for (int score : scores) {
            if (score < 0) {
                continue;
            }
            total += score;
        }
        if (total >= 9) {
            System.out.println("PASS");
        }
    }
}''',
        "The negative value is skipped with continue, so the accepted total is 3 + 4 + 2 = 9 and the final branch prints PASS.",
        "PASS",
    ),
    4: (
        '''public class Main {
    static String label(String name) {
        return "learner: " + name;
    }
    static String label(String name, int level) {
        return label(name) + " (level " + level + ")";
    }
    static void countdown(int value) {
        if (value <= 0) {
            return;
        }
        System.out.println(value);
        countdown(value - 1);
    }
    public static void main(String[] args) {
        System.out.println(label("Ada", 2));
        countdown(2);
    }
}''',
        "The overload changes the parameter list, the single-argument overload is reused, and countdown stops at its base case instead of recursing forever.",
        "learner: Ada (level 2) 2 1",
    ),
    5: (
        '''class LearnerProfile {
    private final String name;
    private final int score;
    LearnerProfile(String name, int score) {
        this.name = name;
        this.score = score;
    }
    String summary() {
        return name + " scored " + score;
    }
}
public class Main {
    public static void main(String[] args) {
        LearnerProfile profile = new LearnerProfile("Ada", 8);
        System.out.println(profile.summary());
    }
}''',
        "The fields stay private and final, the constructor establishes valid state once, and main reads the data through summary() instead of touching fields directly.",
        "Ada scored 8",
    ),
    6: (
        '''import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
public class Main {
    public static void main(String[] args) {
        List<String> names = new ArrayList<String>();
        Map<String, String> emails = new HashMap<String, String>();
        ArrayDeque<String> tasks = new ArrayDeque<String>();
        names.add("Ada");
        emails.put("Ada", "ada@example.test");
        tasks.add("review scores");
        System.out.println(names.get(0) + " -> " + emails.get("Ada"));
        System.out.println("next task: " + tasks.remove());
    }
}''',
        "Each collection expresses a different need: order (List), key lookup (Map), and first-in-first-out work (ArrayDeque).",
        "Ada -> ada@example.test\\nnext task: review scores",
    ),
    7: (
        '''public class Main {
    public static void main(String[] args) {
        String raw = "  Ada Lovelace  ";
        String normalized = raw.trim().toLowerCase().replace(" ", "_");
        System.out.println(normalized);
    }
}''',
        "trim removes the edge spaces, toLowerCase normalizes case, and replace turns the remaining space into an underscore. Each call returns a new String.",
        "ada_lovelace",
    ),
    8: (
        '''import java.nio.file.Files;
import java.nio.file.Path;
public class Main {
    static String readNotes() {
        Path path = Path.of("notes.txt");
        try {
            return Files.readString(path);
        } catch (Exception error) {
            return "missing";
        }
    }
    public static void main(String[] args) {
        System.out.println(readNotes());
    }
}''',
        "Files.readString throws the checked IOException when notes.txt is absent, and the catch branch turns that failure into the domain value missing.",
        "missing",
    ),
    9: (
        '''interface Reviewable {
    String summary();
}
class EssaySubmission implements Reviewable {
    private final String title;
    EssaySubmission(String title) {
        this.title = title;
    }
    public String summary() {
        return "essay: " + title;
    }
}
public class Main {
    public static void main(String[] args) {
        Reviewable work = new EssaySubmission("Loops");
        System.out.println(work.summary());
    }
}''',
        "The interface names the behavior, EssaySubmission supplies one implementation, and main depends on the Reviewable reference rather than the concrete type.",
        "essay: Loops",
    ),
    10: (
        '''class Box<T> {
    private final T item;
    Box(T item) {
        this.item = item;
    }
    T value() {
        return item;
    }
}
public class Main {
    public static void main(String[] args) {
        Box<String> box = new Box<String>("typed value");
        System.out.println(box.value());
    }
}''',
        "The type parameter T keeps the caller's type, so Box<String>.value() returns a String without a cast.",
        "typed value",
    ),
    11: (
        '''public class Main {
    static int find(int[] values, int target) {
        for (int index = 0; index < values.length; index++) {
            if (values[index] == target) {
                return index;
            }
        }
        return -1;
    }
    public static void main(String[] args) {
        System.out.println(find(new int[]{2, 4, 6}, 4));
    }
}''',
        "The loop returns the matching index immediately; 4 sits at index 1, and -1 remains the documented not-found marker.",
        "1",
    ),
    12: (
        '''import java.util.ArrayDeque;
import java.util.HashSet;
import java.util.Queue;
import java.util.Set;
public class Main {
    public static void main(String[] args) {
        Queue<String> queue = new ArrayDeque<String>();
        Set<String> members = new HashSet<String>();
        queue.add("ticket-1");
        members.add("ada@example.test");
        System.out.println(queue.remove());
        System.out.println(members.contains("ada@example.test"));
    }
}''',
        "The queue preserves ticket order while the set answers a membership question in one lookup instead of a scan.",
        "ticket-1\\ntrue",
    ),
    13: (
        '''import java.util.List;
public class Main {
    public static void main(String[] args) {
        List<Integer> doubled = List.of(1, 2, 3).stream().map(value -> value * 2).toList();
        System.out.println(doubled);
    }
}''',
        "The stream pipeline maps each value through the lambda and toList materializes the transformed values, which prints as [2, 4, 6].",
        "[2, 4, 6]",
    ),
    14: (
        '''public class Main {
    static int parseLevel(String text) {
        return Integer.parseInt(text);
    }
    public static void main(String[] args) {
        // Boundary: empty or non-numeric text throws NumberFormatException.
        assert parseLevel("2") == 2;
        System.out.println(parseLevel("2"));
    }
}''',
        "Integer.parseInt converts valid text, the assertion records the expected value for a run with assertions enabled (-ea), and the boundary comment names the invalid input path.",
        "2",
    ),
    15: (
        '''record Result(String label) {
}
public class Main {
    static Result forStatus(int status) {
        String label = switch (status) {
            case 200 -> "ok";
            case 404 -> "missing";
            default -> "unknown";
        };
        return new Result(label);
    }
    public static void main(String[] args) {
        System.out.println(forStatus(200).label());
    }
}''',
        "The record carries the result data and the switch expression chooses one label per status; 200 selects ok.",
        "ok",
    ),
    16: (
        '''import java.util.concurrent.Callable;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.atomic.AtomicInteger;
public class Main {
    public static void main(String[] args) throws Exception {
        AtomicInteger count = new AtomicInteger(0);
        // A plain count++ read-modify-write could lose one increment when two threads interleave.
        Callable<Integer> increment = () -> count.incrementAndGet();
        ExecutorService executor = Executors.newSingleThreadExecutor();
        Future<Integer> pending = executor.submit(increment);
        System.out.println(pending.get());
        executor.shutdown();
    }
}''',
        "incrementAndGet performs the update as one atomic operation, the executor and future mark the boundary where the work is handed to another thread, and get() observes the result 1.",
        "1",
    ),
    17: (
        '''import java.net.URI;
public class Main {
    public static void main(String[] args) {
        // A real client would also handle a timeout branch and read a JSON body.
        URI uri = URI.create("https://example.test/health");
        System.out.println(uri.getPath());
    }
}''',
        "URI keeps the address structured, so getPath() reads the path portion directly instead of slicing the string by hand.",
        "/health",
    ),
    18: (
        '''public class Main {
    public static void main(String[] args) {
        // Prepared statements bind the value for the ? placeholder instead of pasting user text into the SQL.
        String sql = "SELECT title FROM lesson WHERE id = ?";
        System.out.println(sql.contains("?"));
    }
}''',
        "The single placeholder marks the value boundary that a PreparedStatement binds; the concatenated query would not have that boundary at all.",
        "true",
    ),
    19: (
        '''record Lesson(String title) {
}
public class Main {
    public static void main(String[] args) {
        // Every new Lesson allocates on the heap; many short-lived instances add garbage-collector pressure.
        Lesson lesson = new Lesson("JVM memory");
        System.out.println(lesson.title());
    }
}''',
        "One record instance is allocated and referenced locally; the comment names how repeated allocation feeds garbage-collection work.",
        "JVM memory",
    ),
    20: (
        '''public class Main {
    static boolean valid(String text) {
        return text != null && !text.isBlank();
    }
    public static void main(String[] args) {
        // Secrets belong in environment-specific configuration, never in committed source or log lines.
        System.out.println(valid("Java"));
    }
}''',
        "The null check plus isBlank() reject missing and whitespace-only input in one readable rule before any value is trusted.",
        "true",
    ),
    21: (
        '''public class Main {
    public static void main(String[] args) {
        // Maven or Gradle resolves the dependencies and packages the classes into the JAR artifact.
        String artifact = "codeforge.jar";
        System.out.println(artifact);
    }
}''',
        "The source names only the artifact it produces; dependency resolution and packaging belong to the build tool outside the Java code.",
        "codeforge.jar",
    ),
    22: (
        '''public class Main {
    static int statusFor(String path) {
        return path.equals("/health") ? 200 : 404;
    }
    public static void main(String[] args) {
        System.out.println(statusFor("/health"));
    }
}''',
        "String comparison uses equals, and the conditional expression maps the known path to 200 and everything else to 404.",
        "200",
    ),
    23: (
        '''sealed interface Result permits Success, Failure {
}
record Success(String value) implements Result {
}
record Failure(String message) implements Result {
}
public class Main {
    public static void main(String[] args) {
        Result result = new Success("ok");
        System.out.println(((Success) result).value());
    }
}''',
        "The sealed interface closes the hierarchy to the two permitted records, and the demonstrates the Success value the prompt asks to print.",
        "ok",
    ),
    24: (
        '''public class Main {
    public static void main(String[] args) {
        // A multi-file app reads configuration at its boundary, logs through an injected logger,
        // and takes secrets from the environment instead of the source tree.
        String artifact = "service-app";
        System.out.println(artifact);
    }
}''',
        "The artifact label is the visible output, while the comments name the configuration, logging, and secrets boundaries a multi-file service separates.",
        "service-app",
    ),
    25: (
        '''import java.util.ArrayList;
import java.util.List;
record Task(String title) {
}
interface TaskRepository {
    void save(Task task);
}
class MemoryTasks implements TaskRepository {
    private final List<Task> saved = new ArrayList<Task>();
    public void save(Task task) {
        saved.add(task);
    }
    List<Task> all() {
        return saved;
    }
}
class TaskService {
    private final TaskRepository repository;
    TaskService(TaskRepository repository) {
        this.repository = repository;
    }
    void add(String title) {
        if (title == null || title.isBlank()) {
            throw new IllegalArgumentException("title is required");
        }
        repository.save(new Task(title.trim()));
    }
}
public class Main {
    public static void main(String[] args) {
        MemoryTasks repository = new MemoryTasks();
        TaskService service = new TaskService(repository);
        service.add("Build capstone");
        System.out.println(repository.all().get(0).title());
    }
}''',
        "The record carries the data, TaskRepository is the interface-sized boundary, and TaskService validates the title before saving one task.",
        "Build capstone",
    ),
}

inserted = 0
for chapter, (code, explanation, expected) in sorted(SOLUTIONS.items()):
    row = PROJECTS[chapter]
    prompt = row['prompt']
    marker = f'prompt: {json.dumps(prompt, ensure_ascii=False)},'
    assert SOURCE.count(marker) == 1, f"prompt marker for chapter {chapter} appears {SOURCE.count(marker)} times"
    line_start = SOURCE.index(marker)
    indent_start = SOURCE.rfind('\n', 0, line_start) + 1
    indent = SOURCE[indent_start:line_start]
    label = f"{row['chapter']} project"
    addition = (
        f"solution: {json.dumps(code)},\n"
        f"{indent}solutionExplanation: {json.dumps(explanation + ' ' + NO_JDK)},\n"
        f"{indent}testCases: [{{ label: {json.dumps(label)}, expected: {json.dumps(expected)} }}],\n"
    )
    insert_at = line_start + len(marker) + 1
    SOURCE = SOURCE[:insert_at] + indent + addition + SOURCE[insert_at:]
    inserted += 1

JAVA.write_text(SOURCE)
print(f"authored {inserted} Java chapter project solutions into java.ts")
