import { courses } from "./src/courses/catalog";
import { summarizeCourseQuality } from "./src/data/curriculumQuality";

for (const course of courses) {
  const summary = summarizeCourseQuality(course);
  const lessons = course.chapters.flatMap((chapter) => chapter.lessons);
  const mockLessons = lessons.filter((lesson) => lesson.kind === undefined || lesson.kind === "learn").length;
  const kinds: Record<string, number> = {};
  for (const lesson of lessons) kinds[lesson.kind ?? "learn"] = (kinds[lesson.kind ?? "learn"] ?? 0) + 1;
  const edu = summary.educationalCompleteness;
  console.log(`== ${course.id}: ${course.chapters.length} chapters, ${lessons.length} lessons (generated/unlabelled ${mockLessons})`);
  console.log(`   kinds ${JSON.stringify(kinds)}`);
  console.log(`   major ${course.chapters.filter((chapter) => chapter.major).length}, authoredMajor ${summary.authoredMajorChapters.length}, depth ${JSON.stringify(summary.chapterDepthCounts)}`);
  console.log(`   missingDebugging [${edu.chaptersMissingDebugging.join(",")}] missingPrediction [${edu.chaptersMissingPrediction.join(",")}] missingBlankPage [${edu.chaptersMissingBlankPage.join(",")}] missingEdgeCase [${edu.chaptersMissingEdgeCase.join(",")}]`);
  const byKind: Record<string, number> = {};
  for (const finding of summary.repetitiveFindings) byKind[finding.kind] = (byKind[finding.kind] ?? 0) + 1;
  console.log(`   repetitive findings ${summary.repetitiveFindings.length} ${JSON.stringify(byKind)}`);
  console.log(`   structural missing ${JSON.stringify(summary.structuralCompleteness.chaptersMissingStructuralCompleteness)}`);
}
