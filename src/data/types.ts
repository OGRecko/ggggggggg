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

export type TestCaseKind = "output" | "throws" | "state";

export type TestCase = {
  /** Keep this case out of lesson-facing examples and solution hints. */
  hidden?: boolean;
  /** Test-only code appended after the learner program; never rendered in feedback. */
  append?: string;
  /** Line-oriented input supplied to the executable sandbox. */
  input?: string;
  /** Expected console output, error name/message (`throws`), or JSON-encoded state (`state`). */
  expected: string;
  label: string;
  /** Defaults to output comparison. State checks compare JSON-compatible data returned through the Worker channel. */
  kind?: TestCaseKind;
  /** Per-case wall-clock limit; runners still clamp this to their hard maximum. */
  timeoutMs?: number;
};

export type HTMLStructureAssertions = {
  requiredElements?: Array<{ tag: string; minimumCount?: number; textIncludes?: string }>;
  requiredAttributes?: Array<{ name: string; value?: string; tag?: string }>;
  requiredCssDeclarations?: Array<{ property: string; valueIncludes?: string }>;
  requiredCssSelectors?: string[];
  requiredAtRules?: Array<{ name: string; paramsIncludes?: string }>;
  requireUniqueIds?: boolean;
  requireAccessibleNames?: boolean;
  requireImageAlt?: boolean;
  requireAssociatedLabels?: boolean;
  requireHeadingOrder?: boolean;
  requireResponsiveViewport?: boolean;
  requireResponsiveLayout?: boolean;
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
    /** Semantic DOM and parsed CSS checks. Legacy HTML patterns are translated to these checks. */
    htmlAssertions?: HTMLStructureAssertions;
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
