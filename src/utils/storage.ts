import type { LessonProgressState, StoredProgress } from "../data/types";

const KEY = "codeforge-progress-v2";
const LEGACY_KEYS = ["codeforge-progress-v1"];

export const defaultProgress: StoredProgress = {
  schemaVersion: 2,
  code: {},
  lessonStates: {},
  completedLessons: [],
  completedExercises: [],
  projectComplete: [],
  testScores: {},
  settings: { theme: "light", font: "system", textScale: "normal", spacing: "normal" },
};

function cloneDefault(): StoredProgress {
  return {
    ...defaultProgress,
    code: {},
    lessonStates: {},
    completedLessons: [],
    completedExercises: [],
    projectComplete: [],
    testScores: {},
    settings: { ...defaultProgress.settings },
  };
}

function readStoredValue() {
  const current = localStorage.getItem(KEY);
  if (current) return current;
  for (const legacyKey of LEGACY_KEYS) {
    const value = localStorage.getItem(legacyKey);
    if (value) return value;
  }
  return null;
}

function mergeLessonStates(parsed: Partial<StoredProgress>) {
  const lessonStates: Record<string, LessonProgressState> = { ...(parsed.lessonStates ?? {}) };
  for (const lessonId of parsed.completedLessons ?? []) lessonStates[lessonId] = { ...(lessonStates[lessonId] ?? {}), viewed: true, practiced: true };
  for (const lessonId of parsed.completedExercises ?? []) lessonStates[lessonId] = { ...(lessonStates[lessonId] ?? {}), viewed: true, practiced: true, passed: true };
  for (const lessonId of parsed.projectComplete ?? []) lessonStates[lessonId] = { ...(lessonStates[lessonId] ?? {}), projectCompleted: true };
  return lessonStates;
}

export function loadProgress(): StoredProgress {
  try {
    const value = readStoredValue();
    if (!value) return cloneDefault();
    const parsed = JSON.parse(value) as Partial<StoredProgress>;
    return {
      ...cloneDefault(),
      ...parsed,
      schemaVersion: 2,
      code: parsed.code ?? {},
      lessonStates: mergeLessonStates(parsed),
      completedLessons: parsed.completedLessons ?? [],
      completedExercises: parsed.completedExercises ?? [],
      projectComplete: parsed.projectComplete ?? [],
      testScores: parsed.testScores ?? {},
      settings: { ...defaultProgress.settings, ...parsed.settings },
    };
  } catch {
    return cloneDefault();
  }
}

export function saveProgress(progress: StoredProgress): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...progress, schemaVersion: 2 }));
    return true;
  } catch {
    return false;
  }
}

export function clearProgress(): boolean {
  try {
    localStorage.removeItem(KEY);
    for (const legacyKey of LEGACY_KEYS) localStorage.removeItem(legacyKey);
    return true;
  } catch {
    return false;
  }
}
