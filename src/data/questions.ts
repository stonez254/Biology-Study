import { questionBank, QUESTION_BANK_SIZE, getQuestionsForLesson, type QuestionSeed } from "./questionBank";

export type Question = QuestionSeed;

export { questionBank, QUESTION_BANK_SIZE, getQuestionsForLesson };

export const questions: Question[] = questionBank;

export const RAT_QUESTION_COUNT = 10;
export const RAT_DURATION_SECONDS = 15 * 60;
export const RAT_POINTS_PER_CORRECT = 5;

export function shuffleQuestions(source: Question[], count: number): Question[] {
  const result = [...source];

  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result.slice(0, Math.min(count, result.length));
}
