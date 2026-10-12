import { courses } from "./src/courses/catalog";
import { summarizeCourseQuality } from "./src/data/curriculumQuality";

for (const course of courses) {
  const s = summarizeCourseQuality(course).structuralCompleteness;
  console.log(`== ${course.id}`);
  console.log(`   missingProjectExercise [${s.chaptersMissingProjectExercise.join(",")}]`);
  console.log(`   missingChapterTests    [${s.chaptersMissingChapterTests.join(",")}]`);
  console.log(`   missingAcceptance      [${s.chaptersMissingAcceptanceCriteria.join(",")}]`);
  console.log(`   invalidPrerequisites   [${s.chaptersWithInvalidPrerequisites.join(",")}]`);
}
