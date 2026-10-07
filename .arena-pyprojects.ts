import { writeFileSync } from "node:fs";
import { courseById } from "./src/courses/catalog";

const rows = courseById("python")!.chapters.map((chapter) => ({
  number: chapter.number,
  title: chapter.title,
  projectTitle: chapter.project?.title,
  brief: chapter.project?.brief,
  prompt: chapter.project?.prompt,
  starterCode: chapter.project?.starterCode,
  solution: chapter.project?.solution,
  solutionExplanation: chapter.project?.solutionExplanation,
  testCases: chapter.project?.testCases,
  hints: chapter.project?.hints,
  requirements: chapter.project?.requirements,
  edgeCases: chapter.project?.edgeCases,
  extensionTasks: chapter.project?.extensionTasks,
  rubric: chapter.project?.rubric,
  acceptanceCriteria: chapter.project?.acceptanceCriteria,
  constraints: chapter.project?.constraints,
}));
writeFileSync("/tmp/python_projects.json", JSON.stringify(rows, null, 1));
console.log(`projects: ${rows.length}`);
