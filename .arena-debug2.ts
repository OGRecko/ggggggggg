import { courseById } from "./src/courses/catalog";
const course = courseById("htmlcss")!;
const ch2 = course.chapters.find((c) => c.number === 2)!;
const read = ch2.lessons.find((l) => l.kind === "read")!;
console.log("id:", read.id, "| title:", read.title, "| examples:", read.examples.length, "| exercise:", Boolean(read.exercise));
console.log("first example title:", read.examples[0]?.title);
const all = course.chapters.flatMap((c) => c.lessons);
console.log("total lessons:", all.length, "| lessons with examples:", all.filter((l) => l.examples.length).length);
