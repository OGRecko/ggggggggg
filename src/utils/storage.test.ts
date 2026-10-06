import { beforeEach, describe, expect, it } from "vitest";
import { clearProgress, defaultProgress, loadProgress, saveProgress } from "./storage";

type MemoryStorage = Storage & { reset: () => void };

const memoryStorage = (): MemoryStorage => {
  const values = new Map<string, string>();
  return {
    get length() { return values.size; },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => [...values.keys()][index] ?? null,
    removeItem: (key) => { values.delete(key); },
    setItem: (key, value) => { values.set(key, String(value)); },
    reset: () => values.clear(),
  } as MemoryStorage;
};

Object.defineProperty(globalThis, "localStorage", { value: memoryStorage(), configurable: true });

describe("browser progress storage", () => {
  beforeEach(() => (globalThis.localStorage as MemoryStorage).reset());

  it("returns an empty default state when nothing is saved", () => {
    expect(loadProgress()).toEqual(defaultProgress);
  });

  it("round-trips saved code, completion, scores, and lesson states", () => {
    const next = {
      ...loadProgress(),
      code: { "python-1-1": 'print("saved")' },
      completedExercises: ["python-1-1"],
      completedLessons: ["python-1-1"],
      testScores: { "python-chapter-1-test": 3 },
      lessonStates: { "python-1-1": { viewed: true, practiced: true, passed: true } },
    };
    expect(saveProgress(next)).toBe(true);
    const loaded = loadProgress();
    expect(loaded.code["python-1-1"]).toBe('print("saved")');
    expect(loaded.completedExercises).toContain("python-1-1");
    expect(loaded.testScores["python-chapter-1-test"]).toBe(3);
    expect(loaded.lessonStates["python-1-1"].passed).toBe(true);
  });

  it("recovers from malformed saved data", () => {
    localStorage.setItem("codeforge-progress-v2", "not json");
    expect(loadProgress()).toEqual(defaultProgress);
  });

  it("migrates backward-compatible v1 data into lesson states", () => {
    localStorage.setItem("codeforge-progress-v1", JSON.stringify({ completedExercises: ["java-1-1"], code: { "java-1-1": "saved" } }));
    const loaded = loadProgress();
    expect(loaded.code["java-1-1"]).toBe("saved");
    expect(loaded.completedExercises).toContain("java-1-1");
    expect(loaded.lessonStates["java-1-1"].passed).toBe(true);
  });

  it("sanitizes parseable but malformed progress shapes", () => {
    localStorage.setItem("codeforge-progress-v2", JSON.stringify({
      schemaVersion: 99,
      code: "not-a-map",
      completedLessons: ["java-1-1", "java-1-1", 7],
      completedExercises: "wrong-type",
      projectComplete: [null, "java-5-5"],
      testScores: { good: 2, bad: Number.NaN, nope: "3" },
      lessonStates: { "java-1-1": { viewed: true, passed: "yes" }, broken: "state" },
      settings: { theme: "neon", font: "mono", textScale: "huge", spacing: "relaxed" },
    }));

    const loaded = loadProgress();
    expect(loaded.schemaVersion).toBe(2);
    expect(loaded.code).toEqual({});
    expect(loaded.completedLessons).toEqual(["java-1-1"]);
    expect(loaded.completedExercises).toEqual([]);
    expect(loaded.projectComplete).toEqual(["java-5-5"]);
    expect(loaded.testScores).toEqual({ good: 2 });
    expect(loaded.lessonStates["java-1-1"]).toEqual({ viewed: true, practiced: true, passed: undefined, mastered: undefined, projectCompleted: undefined });
    expect(loaded.lessonStates.broken).toEqual({});
    expect(loaded.lessonStates["java-5-5"].projectCompleted).toBe(true);
    expect(loaded.settings).toEqual({ theme: "light", font: "mono", textScale: "normal", spacing: "relaxed" });
  });

  it("keeps known fields from future-schema saves when they are still valid", () => {
    localStorage.setItem("codeforge-progress-v2", JSON.stringify({
      schemaVersion: 42,
      code: { "python-1-1": 'print("ok")' },
      completedExercises: ["python-1-1"],
      settings: { theme: "dark", font: "system", textScale: "larger", spacing: "normal" },
      extraField: { ignored: true },
    }));

    const loaded = loadProgress();
    expect(loaded.code["python-1-1"]).toBe('print("ok")');
    expect(loaded.completedExercises).toEqual(["python-1-1"]);
    expect(loaded.lessonStates["python-1-1"].passed).toBe(true);
    expect(loaded.settings.theme).toBe("dark");
    expect(loaded.settings.textScale).toBe("larger");
  });

  it("clears saved progress safely", () => {
    expect(saveProgress({ ...loadProgress(), completedExercises: ["java-1-1"] })).toBe(true);
    expect(clearProgress()).toBe(true);
    expect(loadProgress().completedExercises).toEqual([]);
  });
});
