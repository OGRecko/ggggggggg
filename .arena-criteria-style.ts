import { courses } from "./src/courses/catalog";
for (const course of courses) {
  const chapter = course.chapters.find((candidate) => candidate.project?.acceptanceCriteria?.length);
  if (chapter?.id === undefined) {
    console.log(`${course.id}: ch${chapter?.number} ${chapter?.project?.title}`);
    for (const criterion of chapter?.project?.acceptanceCriteria ?? []) console.log(`   - ${criterion}`);
  }
}
