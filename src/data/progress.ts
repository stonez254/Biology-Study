import type { Question } from "./questions";

export type AssessmentType = "RAT" | "CAT";

export type AssessmentAttempt = {
  id: string;
  type: AssessmentType;
  completedAt: string;
  score: number;
  correct: number;
  total: number;
  accuracy: number;
  passed: boolean;
};

export type RATAttempt = AssessmentAttempt;

export type StudyProgress = {
  points: number;
  streak: number;
  lastStudyDate: string | null;
  attempts: AssessmentAttempt[];
};

export type SavedAssessment = {
  questionIds: string[];
  current: number;
  answers: Record<string, number>;
  secondsLeft: number;
  startedAt: string;
};
export type SavedRAT = SavedAssessment;
export type SavedCAT = SavedAssessment;

const PROGRESS_KEY = "biology-study:progress";
const RAT_KEY = "biology-study:active-rat";
const CAT_KEY = "biology-study:active-cat";
const defaultProgress: StudyProgress = { points: 0, streak: 0, lastStudyDate: null, attempts: [] };

function read<T>(key: string, fallback: T): T { try { const value = localStorage.getItem(key); return value ? (JSON.parse(value) as T) : fallback; } catch { return fallback; } }
export function getProgress(): StudyProgress {
  const raw = read<Partial<StudyProgress>>(PROGRESS_KEY, defaultProgress);
  return { points: raw.points ?? 0, streak: raw.streak ?? 0, lastStudyDate: raw.lastStudyDate ?? null, attempts: (raw.attempts ?? []).map((a: any) => ({ ...a, type: a.type ?? "RAT" })) };
}
export function saveProgress(progress: StudyProgress) { localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress)); }

function localDateKey(date = new Date()) { const y = date.getFullYear(); const m = String(date.getMonth() + 1).padStart(2, "0"); const d = String(date.getDate()).padStart(2, "0"); return `${y}-${m}-${d}`; }

export function recordAssessmentAttempt(type: AssessmentType, result: Omit<AssessmentAttempt, "id" | "completedAt" | "type">): StudyProgress {
  const progress = getProgress();
  const today = localDateKey();
  const yesterday = localDateKey(new Date(Date.now() - 86400000));
  const streak = progress.lastStudyDate === today ? progress.streak : progress.lastStudyDate === yesterday ? progress.streak + 1 : 1;
  const next: StudyProgress = { points: progress.points + result.score, streak, lastStudyDate: today, attempts: [{ ...result, type, id: crypto.randomUUID(), completedAt: new Date().toISOString() }, ...progress.attempts].slice(0, 100) };
  saveProgress(next);
  return next;
}
export function recordRATAttempt(result: Omit<RATAttempt, "id" | "completedAt" | "type">) { return recordAssessmentAttempt("RAT", result); }

export function saveActiveRAT(saved: SavedRAT) { localStorage.setItem(RAT_KEY, JSON.stringify(saved)); }
export function getActiveRAT(): SavedRAT | null { try { const raw = localStorage.getItem(RAT_KEY); return raw ? (JSON.parse(raw) as SavedRAT) : null; } catch { return null; } }
export function clearActiveRAT() { localStorage.removeItem(RAT_KEY); }
export function saveActiveCAT(saved: SavedCAT) { localStorage.setItem(CAT_KEY, JSON.stringify(saved)); }
export function getActiveCAT(): SavedCAT | null { try { const raw = localStorage.getItem(CAT_KEY); return raw ? (JSON.parse(raw) as SavedCAT) : null; } catch { return null; } }
export function clearActiveCAT() { localStorage.removeItem(CAT_KEY); }
export function hydrateQuestions(saved: SavedAssessment, bank: Question[]): Question[] { const byId = new Map(bank.map(question => [question.id, question])); return saved.questionIds.map(id => byId.get(id)).filter((question): question is Question => Boolean(question)); }
