import { describe, expect, it } from "vitest";
import { javascriptCourse } from "./javascript";
import { javascriptWorkerSource } from "../utils/javascriptRunner";
import { gradeExercise } from "../utils/behavioralGrader";

type WorkerResponse = { id: number; output?: string; error?: string };
type FakeSelf = {
  postMessage: (message: WorkerResponse) => void;
  onmessage?: (event: { data: { id: number; code: string; input?: string } }) => Promise<void>;
};

/** Execute the same worker program shipped by CodeForge, with only its outer Worker transport adapted for this test. */
async function runShippedWorker(code: string, input?: string): Promise<WorkerResponse> {
  const messages: WorkerResponse[] = [];
  const fakeSelf: FakeSelf = { postMessage: (message) => messages.push(message) };
  const evaluate = new Function(
    "self",
    "setTimeout",
    "clearTimeout",
    "setInterval",
    "clearInterval",
    "Promise",
    javascriptWorkerSource,
  );
  evaluate(fakeSelf, setTimeout, clearTimeout, setInterval, clearInterval, Promise);
  await fakeSelf.onmessage!({ data: { id: 1, code, input } });
  return messages[messages.length - 1];
}

const authoredLessons = [
  ...javascriptCourse.chapters[0].lessons,
  ...javascriptCourse.chapters[1].lessons,
  ...javascriptCourse.chapters[2].lessons,
  ...javascriptCourse.chapters[3].lessons,
].filter((lesson) => lesson.quality?.authoredDepth === "authored");

describe("authored JavaScript chapters 1–4", () => {
  it("contain chapter-specific lessons with the required practice modes and four-step hints", () => {
    const expectedAuthoredLessons = [7, 7, 7, 6];
    for (const chapterNumber of [1, 2, 3, 4]) {
      const chapter = javascriptCourse.chapters[chapterNumber - 1];
      const lessons = chapter.lessons.filter((lesson) => lesson.quality?.authoredDepth === "authored");
      expect(lessons).toHaveLength(expectedAuthoredLessons[chapterNumber - 1]);
      expect(new Set(lessons.map((lesson) => lesson.title)).size).toBe(expectedAuthoredLessons[chapterNumber - 1]);
      for (const lesson of lessons) {
        expect(lesson.examples).toHaveLength(2);
        for (const example of lesson.examples) {
          expect(example.lines, `${chapter.title} / ${lesson.title} / ${example.title}`).toHaveLength(example.code.split("\n").length);
        }
        expect(lesson.exercise.hints).toHaveLength(4);
        expect(lesson.exercise.testCases.length).toBeGreaterThan(0);
      }
      expect(chapter.test?.length).toBeGreaterThanOrEqual(8);
      expect(chapter.project?.title).toBeTruthy();
    }
    expect(authoredLessons).toHaveLength(27);

    const firstChapterKinds = new Set(javascriptCourse.chapters[0].lessons.map((lesson) => lesson.kind));
    expect(firstChapterKinds).toEqual(new Set(["learn", "read", "predict", "debug", "modify", "blank-page", "build"]));
  });

  it("executes the code-construction answers in both mixed tests", async () => {
    const expectedByChapter = new Map([[1, "left\nright"], [2, "3"], [3, "2"], [4, "0 2 4"]]);
    for (const chapterNumber of [1, 2, 3, 4]) {
      const question = javascriptCourse.chapters[chapterNumber - 1].test!.find((item) => item.question.startsWith("[Code build]"))!;
      const result = await runShippedWorker(question.choices[question.correctIndex]);
      expect(result.error, `chapter ${chapterNumber} code-building answer`).toBeUndefined();
      expect(result.output).toBe(expectedByChapter.get(chapterNumber));
    }
  });

  it("runs every authored example and solution through the shipped Worker source", async () => {
    for (const lesson of authoredLessons) {
      for (const example of lesson.examples) {
        const result = await runShippedWorker(example.code);
        if (example.output.startsWith("Does not run: syntax error")) {
          expect(result.error, `${lesson.title}: ${example.title}`).toBeTruthy();
          expect(result.output).toBe("");
        } else if (example.output.startsWith("Does not run: runtime TypeError")) {
          expect(result.error, `${lesson.title}: ${example.title}`).toMatch(/constant variable/i);
          expect(result.output).toBe("");
        } else {
          expect(result.error, `${lesson.title}: ${example.title}`).toBeUndefined();
          expect(result.output, `${lesson.title}: ${example.title}`).toBe(example.output);
        }
      }

      const solution = await runShippedWorker(lesson.exercise.solution);
      expect(solution.error, `${lesson.title}: solution`).toBeUndefined();
      expect(solution.output, `${lesson.title}: solution`).toBe(lesson.exercise.testCases[0].expected);
    }
  });

  it("confirms each starter fails its declared expected result before Show Answer", async () => {
    for (const lesson of authoredLessons) {
      const starter = await runShippedWorker(lesson.exercise.starterCode);
      const expected = lesson.exercise.testCases[0].expected;
      expect(
        Boolean(starter.error) || starter.output !== expected,
        `${lesson.title}: the starter must fail before the learner sees the solution`,
      ).toBe(true);
    }
  });

  it("uses distinct, executable projects for the first four chapters", async () => {
    const chapters = javascriptCourse.chapters.slice(0, 4);
    expect(new Set(chapters.map((chapter) => chapter.project?.title)).size).toBe(4);
    expect(chapters[3].project?.hints).toHaveLength(4);

    for (const chapter of chapters) {
      const project = chapter.project!;
      for (const testCase of project.testCases) {
        const result = await runShippedWorker(project.solution, testCase.input);
        expect(result.error, `${project.title} / ${testCase.label}`).toBeUndefined();
        expect(result.output, `${project.title} / ${testCase.label}`).toBe(testCase.expected);
      }
    }

    const firstProject = chapters[0].project!;
    expect(firstProject.checker).toBeUndefined();
    expect(firstProject.testCases.filter((testCase) => testCase.hidden)).toHaveLength(4);
    expect(new Set(firstProject.testCases.map((testCase) => testCase.expected)).size).toBeGreaterThanOrEqual(4);

    const runCase = async (source: string, input?: string) => {
      const result = await runShippedWorker(source, input);
      return { output: result.output ?? "", error: result.error };
    };
    const starterGrade = await gradeExercise(firstProject, firstProject.starterCode, runCase);
    expect(starterGrade.passed).toBe(false);
    expect(starterGrade.failure?.testCase.hidden).toBe(true);

    const alternative = 'const fields = [readLine(), readLine(), readLine()];\nconsole.log(`Learner: ${fields[0]}`);\nconsole.log(`Completed: ${Number(fields[1])}`);\nconsole.log(`Next: ${fields[2]}`);';
    const alternativeGrade = await gradeExercise(firstProject, alternative, runCase);
    expect(alternativeGrade.passed).toBe(true);

    const hardcodedSample = 'console.log("Learner: Mina");\nconsole.log("Completed: 0");\nconsole.log("Next: begin");';
    const hardcodedGrade = await gradeExercise(firstProject, hardcodedSample, runCase);
    expect(hardcodedGrade.passed).toBe(false);
    expect(hardcodedGrade.failure?.testCase.hidden).toBe(true);
  });
});
