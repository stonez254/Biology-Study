import type { Question } from "./questions";

export type RATAttempt = {
  id: string;
  completedAt: string;
  score: number;
  correct: number;
  total: number;
  accuracy: number;
  passed: boolean;
};

export type StudyProgress = {
  points: number;
  streak: number;
  lastStudyDate: string | null;
  attempts: RATAttempt[];
};

export type SavedRAT = {
  questionIds: string[];
  current: number;
  answers: Record<string, number>;
  secondsLeft: number;
  startedAt: string;
};

const PROGRESS_KEY = "biology-study:progress";
const RAT_KEY = "biology-study:active-rat";

const defaultProgress: StudyProgress = { points: 0, streak: 0, lastStudyDate: null, attempts: [] };

function read<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function getProgress(): StudyProgress {
  return read(PROGRESS_KEY, defaultProgress);
}

export function saveProgress(progress: StudyProgress) {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
}

export function recordRATAttempt(result: Omit<RATAttempt, "id" | "completedAt">): StudyProgress {
  const progress = getProgress();
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const streak = progress.lastStudyDate === today ? progress.streak : progress.lastStudyDate === yesterday ? progress.streak + 1 : 1;

  const next: StudyProgress = {
    points: progress.points + result.score,
    streak,
    lastStudyDate: today,
    attempts: [{ ...result, id: crypto.randomUUID(), completedAt: new Date().toISOString() }, ...progress.attempts].slice(0, 100),
  };
  saveProgress(next);
  return next;
}

export function saveActiveRAT(saved: SavedRAT) {
  localStorage.setItem(RAT_KEY, JSON.stringify(saved));
}

export function getActiveRAT(): SavedRAT | null {
  try {
    const raw = localStorage.getItem(RAT_KEY);
    return raw ? (JSON.parse(raw) as SavedRAT) : null;
  } catch {
    return null;
  }
}

export function clearActiveRAT() {
  localStorage.removeItem(RAT_KEY);
}

export function hydrateQuestions(saved: SavedRAT, bank: Question[]): Question[] {
  const byId = new Map(bank.map((question) => [question.id, question]));
  return saved.questionIds.map((id) => byId.get(id)).filter((question): question is Question => Boolean(question));
}