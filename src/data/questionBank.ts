import { questionSeeds, type QuestionSeed } from "./questionSeeds";
import { deepQuestionSeeds } from "./questionSeedsDeep";

export const questionBank: QuestionSeed[] = [...questionSeeds, ...deepQuestionSeeds];

const lessonIds = new Set(questionBank.map(question => question.lessonId));
const questionIds = new Set<string>();

for (const question of questionBank) {
  if (questionIds.has(question.id)) {
    throw new Error(`Duplicate question ID in question bank: ${question.id}`);
  }
  questionIds.add(question.id);

  if (!question.lessonId || !lessonIds.has(question.lessonId)) {
    throw new Error(`Question ${question.id} has an invalid lessonId`);
  }

  if (question.options.length !== 3 || question.answer < 0 || question.answer > 2) {
    throw new Error(`Question ${question.id} must have exactly 3 options and a valid answer index`);
  }
}

export const QUESTION_BANK_SIZE = questionBank.length;

export function getQuestionsForLesson(lessonId: string): QuestionSeed[] {
  return questionBank.filter(question => question.lessonId === lessonId);
}

export function getQuestionCountForLesson(lessonId: string): number {
  return getQuestionsForLesson(lessonId).length;
}

export const QUESTION_BANK_COUNTS = Object.fromEntries(
  [...new Set(questionBank.map(question => question.lessonId))].map(lessonId => [
    lessonId,
    getQuestionCountForLesson(lessonId),
  ]),
) as Record<string, number>;
