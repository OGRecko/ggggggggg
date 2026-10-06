import type { ChapterTest } from "../data/types";
import type { ChapterPlan, CourseProjectPlan } from "./courseFactory";

export const q = (question: string, choices: string[], correctIndex: number, explanation: string): ChapterTest => ({ question, choices, correctIndex, explanation });

export function projectPlan(input: CourseProjectPlan): CourseProjectPlan {
  return input;
}

export function chapterPlan(input: ChapterPlan): ChapterPlan {
  return input;
}

export function beginnerMilestones(feature: string) {
  return [`Plan the smallest working ${feature}.`, `Implement the core requirement with readable code.`, `Check one boundary or edge case before polishing.`];
}

export function intermediateMilestones(feature: string) {
  return [`Model the state or data needed for ${feature}.`, `Build the main workflow in one clear path.`, `Handle one failure or boundary path and verify the result.`];
}

export function advancedMilestones(feature: string) {
  return [`Define the boundary and responsibilities for ${feature}.`, `Implement the main path with explicit validation or ownership rules.`, `Review the edge case, acceptance criteria, and extension path.`];
}

export function reviewRubric(topic: string) {
  return [
    `${topic} is visible in the solution rather than hidden behind unrelated code.`,
    "The solution handles the stated acceptance criteria honestly.",
    "The design choice matches the chapter's intended concept and runtime boundary.",
  ];
}
