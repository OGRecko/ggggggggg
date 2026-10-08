import { javaLanguage } from "@codemirror/lang-java";
const cases: Record<string, string> = {
  "plain class": "public class Main { public static void main(String[] args) { System.out.println(\"hi\"); } }",
  "default method": "interface Named { String name(); default String greeting() { return \"hi \" + name(); } }",
  "synchronized block": "public class Main { static int v = 0; static void add() { synchronized (Main.class) { v = v + 1; } } }",
  "try with resources": "import java.io.*; public class Main { void go() throws IOException { try (var in = new BufferedReader(new FileReader(\"f\"))) { in.readLine(); } } }",
  "var local": "public class Main { void go() { var n = 3; } }",
  "lambda": "public class Main { Runnable r = () -> System.out.println(\"x\"); }",
  "stream": "import java.util.*; public class Main { void go(List<String> xs) { xs.stream().filter(s -> !s.isEmpty()).count(); } }",
  "record": "record Lesson(String title, int minutes) {}",
  "record with body": "record Lesson(String title) { }",
  "sealed interface": "sealed interface Result permits Success, Failure {}",
  "switch expression": "public class Main { static int f(int n) { return switch (n) { case 0 -> 1; default -> 2; }; } }",
  "instanceof pattern": "public class Main { static boolean f(Object o) { return o instanceof String s && s.length() > 1; } }",
  "text block": "public class Main { String t = \"\"\"\n  hi\n  \"\"\"; }",
  "generic method": "public class Main { static <T extends Comparable<T>> T max(List<T> xs) { return xs.get(0); } }",
  "wildcard": "import java.util.*; public class Main { static void copy(List<? extends Number> src, List<? super Number> dst) { } }",
  "enum with fields": "enum Level { LOW(1), HIGH(2); private final int v; Level(int v) { this.v = v; } }",
  "varargs": "public class Main { static int sum(int... xs) { return xs.length; } }",
  "annotations": "public class Main { @Override public String toString() { return \"x\"; } }",
};
for (const [name, code] of Object.entries(cases)) {
  const tree = javaLanguage.parser.parse(code);
  const errs: string[] = [];
  tree.iterate({ enter: (n) => { if (n.type.isError || n.name.includes("⚠")) errs.push(`${n.name}@${n.from}-${n.to}`); } });
  console.log(`${errs.length ? "ERR " : "ok  "} ${name.padEnd(20)} ${errs.slice(0, 3).join(" ") || ""}`);
}
