/** Corpus stats: chapters, lessons, authored lessons/examples per course. Usage: npx vite-node .arena-stats.ts */
import { courses } from "./src/courses/catalog";

let totalChapters = 0, totalLessons = 0, totalAuthored = 0, totalExamples = 0, totalAuthoredExamples = 0;
for (const course of courses) {
  let chapters = 0, lessons = 0, authored = 0, examples = 0, authoredExamples = 0;
  let authoredChapters = 0;
  for (const chapter of course.chapters) {
    chapters += 1;
    let chapterAuthored = 0;
    for (const lesson of chapter.lessons) {
      lessons += 1;
      examples += lesson.examples.length;
      if (lesson.quality?.authoredDepth === "authored") {
        authored += 1;
        chapterAuthored += 1;
        authoredExamples += lesson.examples.length;
      }
    }
    if (chapterAuthored > 0) authoredChapters += 1;
  }
  totalChapters += chapters; totalLessons += lessons; totalAuthored += authored;
  totalExamples += examples; totalAuthoredExamples += authoredExamples;
  console.log(`${course.id.padEnd(11)} chapters ${chapters} | lessons ${lessons} | authored lessons ${authored} (in ${authoredChapters} chapters) | examples ${examples} (authored ${authoredExamples})`);
}
console.log(`TOTAL       chapters ${totalChapters} | lessons ${totalLessons} | authored lessons ${totalAuthored} | examples ${totalExamples} (authored ${totalAuthoredExamples})`);
