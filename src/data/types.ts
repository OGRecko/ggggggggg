export type LanguageId = "python" | "java" | "javascript" | "cpp" | "htmlcss";

export type VerificationKind = "executed" | "previewed" | "semantically-checked" | "structurally-checked" | "pattern-checked" | "conceptual";

export type LessonKind =
  | "learn"
  | "read"
  | "predict"
  | "debug"
  | "modify"
  | "compare"
  | "design"
  | "edge-case"
  | "blank-page"
  | "build"
  | "integration"
  | "case-study"
  | "challenge"
  | "deep-dive"
  | "assessment";

export type AuthoredDepth = "scaffolded" | "authored" | "deep-dive";

export type TestCase = {
  input?: string;
  expected: string;
  label: string;
};

export type Example = {
  title: string;
  code: string;
  output: string;
  explanation: string;
  lines: string[];
  mistakes: { mistake: string; error: string; fix: string }[];
};

export type Exercise = {
  prompt: string;
  starterCode: string;
  solution: string;
  solutionExplanation: string;
  testCases: TestCase[];
  hints: string[];
  checker?: {
    mode: "patterns" | "html";
    requiredPatterns: string[];
    requiredOneOf?: string[][];
    forbiddenPatterns?: string[];
    successMessage?: string;
  };
};

export type LessonQuality = {
  explanation: boolean;
  syntax: boolean;
  terminology: boolean;
  multipleExamples: boolean;
  codeReading: boolean;
  prediction: boolean;
  debugging: boolean;
  modification: boolean;
  blankPage: boolean;
  edgeCase: boolean;
  assessment: boolean;
  project: boolean;
  authoredDepth: AuthoredDepth;
  coveredConcepts: string[];
  prerequisiteChapters?: number[];
  notes?: string;
};

export type Lesson = {
  id: string;
  chapter: number;
  order: number;
  title: string;
  minutes: number;
  summary: string;
  learningGoals: string[];
  explanation: string;
  keywordNotes: string[];
  examples: Example[];
  exercise: Exercise;
  recap: string[];
  kind?: LessonKind;
  verification?: VerificationKind[];
  quality?: LessonQuality;
  decisionGuide?: {
    use: string;
    insteadOf: string;
    reason: string;
  }[];
  readingCheck?: {
    prompt: string;
    choices: string[];
    correctIndex: number;
    explanation: string;
  };
};

export type ChapterTest = {
  question: string;
  choices: string[];
  correctIndex: number;
  explanation: string;
};

export type ProjectExercise = Exercise & {
  title: string;
  brief: string;
  scenario?: string;
  constraints?: string[];
  starterState?: string[];
  requirements?: string[];
  milestones?: string[];
  acceptanceCriteria?: string[];
  edgeCases?: string[];
  checks?: string[];
  extensionTasks?: string[];
  rubric?: string[];
};

export type Chapter = {
  number: number;
  title: string;
  description: string;
  lessons: Lesson[];
  project?: ProjectExercise;
  test?: ChapterTest[];
  cumulativeTest?: ChapterTest[];
  available: boolean;
  major?: boolean;
  prerequisiteChapters?: number[];
  qualitySummary?: string[];
};

export type Course = {
  id: LanguageId;
  name: string;
  version: string;
  accent: string;
  icon: string;
  description: string;
  chapters: Chapter[];
};

export type LessonProgressState = {
  viewed?: boolean;
  practiced?: boolean;
  passed?: boolean;
  mastered?: boolean;
  projectCompleted?: boolean;
};

export type StoredProgress = {
  schemaVersion: number;
  code: Record<string, string>;
  lessonStates: Record<string, LessonProgressState>;
  completedLessons: string[];
  completedExercises: string[];
  projectComplete: string[];
  testScores: Record<string, number>;
  settings: {
    theme: "light" | "dark";
    font: "system" | "dyslexia" | "mono";
    textScale: "normal" | "large" | "larger";
    spacing: "normal" | "relaxed";
  };
};
