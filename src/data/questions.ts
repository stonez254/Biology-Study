import { questionSeeds, type QuestionSeed } from "./questionSeeds";

export type Question = QuestionSeed;

const VARIANT_PREFIXES = [
  "Recall:",
  "Exam check:",
  "Choose the best answer:",
  "Identify the correct concept:",
  "Which statement is correct?",
  "Knowledge check:",
  "Medical biology check:",
  "Select the most accurate answer:",
] as const;

function hash(value: string): number {
  let h = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function shuffleOptions(seed: QuestionSeed, variant: number): {
  options: [string, string, string];
  answer: number;
} {
  const indexed = seed.options.map((text, index) => ({ text, index }));
  let state = hash(seed.id + ":" + variant);

  for (let i = indexed.length - 1; i > 0; i -= 1) {
    state = Math.imul(state ^ (state >>> 16), 2246822507) >>> 0;
    const j = state % (i + 1);
    [indexed[i], indexed[j]] = [indexed[j], indexed[i]];
  }

  return {
    options: [indexed[0].text, indexed[1].text, indexed[2].text] as [string, string, string],
    answer: indexed.findIndex((item) => item.index === seed.answer),
  };
}

function makeVariant(seed: QuestionSeed, variant: number): Question {
  const shuffled = shuffleOptions(seed, variant);
  const prefix = VARIANT_PREFIXES[variant];

  return {
    id: `qb-${seed.id}-${String(variant + 1).padStart(2, "0")}`,
    lessonId: seed.lessonId,
    topic: seed.topic,
    difficulty: seed.difficulty,
    prompt: `${prefix} ${seed.prompt}`,
    options: shuffled.options,
    answer: shuffled.answer,
    explanation: seed.explanation,
    reference: seed.reference,
  };
}

// Eight exam-ready variants are generated from each independently authored seed.
// 126 seeds × 8 variants = 1,008 questions before future expansion.
export const generatedQuestions: Question[] = questionSeeds.flatMap((seed) =>
  Array.from({ length: 8 }, (_, variant) => makeVariant(seed, variant)),
);

export const questions: Question[] = generatedQuestions;

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
