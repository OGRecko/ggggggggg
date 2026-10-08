import { writeFileSync } from 'node:fs';
import { courseById } from './src/courses/catalog.ts';
import { checkRequiredPatterns } from './src/utils/exerciseCheck.ts';

const course = courseById('javascript')!;
const rows: any[] = [];
for (const chapter of course.chapters) {
  const project = (chapter as any).project;
  const lessonFails: string[] = [];
  for (const lesson of chapter.lessons) {
    const checker = lesson.exercise?.checker;
    if (!checker) continue;
    const result = checkRequiredPatterns(lesson.exercise.solution, checker);
    if (!result.passed) lessonFails.push(`${lesson.id}[${lesson.kind}] missing=${JSON.stringify(result.missing)}`);
  }
  const projectFails = project?.checker ? !checkRequiredPatterns(project.solution, project.checker).passed : false;
  rows.push({
    chapter: chapter.number,
    title: chapter.title,
    kindList: chapter.lessons.map((lesson) => `${lesson.id}:${lesson.kind}`),
    prompt: project.prompt,
    required: project.checker?.requiredPatterns ?? null,
    requirements: project.requirements,
    hints: project.hints,
    solution: project.solution,
    tests: project.testCases,
    lessonFails,
    projectFails,
  });
}
writeFileSync('/tmp/js_projects.json', JSON.stringify(rows, null, 1));
console.log(`javascript chapters: ${rows.length} | lesson failures: ${rows.reduce((n, r) => n + r.lessonFails.length, 0)} | project failures: ${rows.filter((r) => r.projectFails).length}`);
