import type { LessonProgressState, StoredProgress } from "../data/types";

const KEY = "codeforge-progress-v2";
const LEGACY_KEYS = ["codeforge-progress-v1"];
const THEMES = new Set<StoredProgress["settings"]["theme"]>(["light", "dark"]);
const FONTS = new Set<StoredProgress["settings"]["font"]>(["system", "dyslexia", "mono"]);
const TEXT_SCALES = new Set<StoredProgress["settings"]["textScale"]>(["normal", "large", "larger"]);
const SPACING = new Set<StoredProgress["settings"]["spacing"]>(["normal", "relaxed"]);

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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function sanitizeStringArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((item): item is string => typeof item === "string" && item.trim().length > 0))];
}

function sanitizeCodeMap(value: unknown) {
  if (!isRecord(value)) return {};
  return Object.fromEntries(Object.entries(value).filter((entry): entry is [string, string] => typeof entry[0] === "string" && typeof entry[1] === "string"));
}

function sanitizeLessonState(value: unknown): LessonProgressState {
  if (!isRecord(value)) return {};
  return {
    viewed: value.viewed === true ? true : undefined,
    practiced: value.practiced === true ? true : undefined,
    passed: value.passed === true ? true : undefined,
    mastered: value.mastered === true ? true : undefined,
    projectCompleted: value.projectCompleted === true ? true : undefined,
  };
}

function sanitizeLessonStates(value: unknown) {
  if (!isRecord(value)) return {};
  return Object.fromEntries(Object.entries(value).map(([lessonId, state]) => [lessonId, sanitizeLessonState(state)]));
}

function sanitizeTestScores(value: unknown) {
  if (!isRecord(value)) return {};
  return Object.fromEntries(Object.entries(value).filter((entry): entry is [string, number] => typeof entry[0] === "string" && typeof entry[1] === "number" && Number.isFinite(entry[1]) && entry[1] >= 0));
}

function sanitizeSettings(value: unknown): StoredProgress["settings"] {
  const settings = isRecord(value) ? value : {};
  return {
    theme: THEMES.has(settings.theme as StoredProgress["settings"]["theme"]) ? settings.theme as StoredProgress["settings"]["theme"] : defaultProgress.settings.theme,
    font: FONTS.has(settings.font as StoredProgress["settings"]["font"]) ? settings.font as StoredProgress["settings"]["font"] : defaultProgress.settings.font,
    textScale: TEXT_SCALES.has(settings.textScale as StoredProgress["settings"]["textScale"]) ? settings.textScale as StoredProgress["settings"]["textScale"] : defaultProgress.settings.textScale,
    spacing: SPACING.has(settings.spacing as StoredProgress["settings"]["spacing"]) ? settings.spacing as StoredProgress["settings"]["spacing"] : defaultProgress.settings.spacing,
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
  const lessonStates: Record<string, LessonProgressState> = { ...sanitizeLessonStates(parsed.lessonStates) };
  for (const lessonId of sanitizeStringArray(parsed.completedLessons)) lessonStates[lessonId] = { ...(lessonStates[lessonId] ?? {}), viewed: true, practiced: true };
  for (const lessonId of sanitizeStringArray(parsed.completedExercises)) lessonStates[lessonId] = { ...(lessonStates[lessonId] ?? {}), viewed: true, practiced: true, passed: true };
  for (const lessonId of sanitizeStringArray(parsed.projectComplete)) lessonStates[lessonId] = { ...(lessonStates[lessonId] ?? {}), projectCompleted: true };
  return lessonStates;
}

export function loadProgress(): StoredProgress {
  try {
    const value = readStoredValue();
    if (!value) return cloneDefault();
    const parsed = JSON.parse(value) as Partial<StoredProgress>;
    return {
      ...cloneDefault(),
      schemaVersion: 2,
      code: sanitizeCodeMap(parsed.code),
      lessonStates: mergeLessonStates(parsed),
      completedLessons: sanitizeStringArray(parsed.completedLessons),
      completedExercises: sanitizeStringArray(parsed.completedExercises),
      projectComplete: sanitizeStringArray(parsed.projectComplete),
      testScores: sanitizeTestScores(parsed.testScores),
      settings: sanitizeSettings(parsed.settings),
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
