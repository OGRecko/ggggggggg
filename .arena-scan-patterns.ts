/** Finds checker patterns that can never match because comment stripping removes the target. */
import { courses } from "./src/courses/catalog";
const COMMENT_TARGET = /(^|[^:\w])\s*\/\/|\/\\?\*|<!--/;
const hits: string[] = [];
for (const course of courses) {
  const seen: string[] = [];
  const check = (label: string, patterns: string[] | undefined) => {
    for (const pattern of patterns ?? []) {
      if (COMMENT_TARGET.test(pattern)) hits.push(`${course.id} ${label}: ${pattern}`);
    }
  };
  for (const chapter of course.chapters) {
    check(`ch${chapter.number} project`, chapter.project?.checker?.requiredPatterns);
    (chapter.project?.checker?.requiredOneOf ?? []).forEach((group, index) => check(`ch${chapter.number} project oneOf#${index}`, group));
    for (const lesson of chapter.lessons) {
      check(`${lesson.id}`, lesson.exercise?.checker?.requiredPatterns);
      (lesson.exercise?.checker?.requiredOneOf ?? []).forEach((group, index) => check(`${lesson.id} oneOf#${index}`, group));
    }
  }
  void seen;
}
console.log(hits.length ? hits.join("\n") : "no comment-targeting patterns remain in any checker");
