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

  it("clears saved progress safely", () => {
    expect(saveProgress({ ...loadProgress(), completedExercises: ["java-1-1"] })).toBe(true);
    expect(clearProgress()).toBe(true);
    expect(loadProgress().completedExercises).toEqual([]);
  });
});
