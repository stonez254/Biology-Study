import type { Question } from "./questions";

type Difficulty = Question["difficulty"];
export type QuestionType = NonNullable<Question["questionType"]>;

const DIFFICULTIES: Difficulty[] = ["Easy", "Medium", "Hard"];
const QUESTION_TYPES: QuestionType[] = [
  "concept",
  "application",
  "scenario",
  "identification",
  "calculation",
];

function randomize<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function inferQuestionType(question: Question): QuestionType {
  if (question.questionType) return question.questionType;
  const prompt = question.prompt.toLowerCase();
  if (/calculate|how many|percentage|ratio|rate|concentration|probability|frequency|volume|mass|molar|equation|value/.test(prompt)) return "calculation";
  if (/identify|which structure|which organ|which tissue|which cell|where does|where is|what organelle/.test(prompt)) return "identification";
  if (/a patient|a person|a cell|a tissue|a scientist|a researcher|during|after|before|if |when |case|observ/.test(prompt)) return "scenario";
  if (/why|how does|what happens|effect|advantage|function|role|define|meaning/.test(prompt)) return "application";
  return "concept";
}

function quotaFor<T extends string>(items: T[], count: number, weights: Record<T, number>): Record<T, number> {
  const totalWeight = (Object.values(weights) as number[]).reduce((sum: number, weight: number) => sum + weight, 0);
  const quotas = Object.fromEntries(items.map(item => [item, Math.floor((count * weights[item]) / totalWeight)])) as Record<T, number>;
  let assigned = (Object.values(quotas) as number[]).reduce((sum: number, value: number) => sum + value, 0);
  const remainder = [...items].sort((a, b) => (weights[b] - weights[a]) || Math.random() - 0.5);
  for (const item of remainder) {
    if (assigned >= count) break;
    quotas[item] += 1;
    assigned += 1;
  }
  return quotas;
}

function selectSmart(
  pool: Question[],
  count: number,
  options: {
    difficultyWeights?: Record<Difficulty, number>;
    typeWeights?: Record<QuestionType, number>;
    lessonCoverage?: boolean;
    recentIds?: Iterable<string>;
  } = {},
): Question[] {
  const target = Math.min(count, pool.length);
  if (!target) return [];

  const recent = new Set(options.recentIds ?? []);
  const fresh = pool.filter(question => !recent.has(question.id));
  const source = fresh.length >= target ? fresh : [...fresh, ...pool.filter(question => recent.has(question.id))];

  const difficultyWeights = options.difficultyWeights ?? { Easy: 1, Medium: 1, Hard: 1 };
  const typeWeights = options.typeWeights ?? {
    concept: 1,
    application: 1,
    scenario: 1,
    identification: 1,
    calculation: 1,
  };
  const difficultyQuota = quotaFor(DIFFICULTIES, target, difficultyWeights);
  const typeQuota = quotaFor(QUESTION_TYPES, target, typeWeights);

  const chosen: Question[] = [];
  const used = new Set<string>();
  const lessonCounts = new Map<string, number>();
  const subtopicCounts = new Map<string, number>();

  // Pick one question at a time using the largest current coverage gaps.
  // This jointly considers difficulty, question type, lesson/subtopic diversity and recency.
  while (chosen.length < target) {
    let bestScore = -Infinity;
    let candidates: Question[] = [];

    for (const question of source) {
      if (used.has(question.id)) continue;

      const type = inferQuestionType(question);
      const difficultyNeed = Math.max(0, difficultyQuota[question.difficulty] - chosen.filter(q => q.difficulty === question.difficulty).length);
      const typeNeed = Math.max(0, typeQuota[type] - chosen.filter(q => inferQuestionType(q) === type).length);
      const lessonCount = lessonCounts.get(question.lessonId) ?? 0;
      const subtopicKey = question.subtopic ?? question.topic;
      const subtopicCount = subtopicCounts.get(subtopicKey) ?? 0;

      let score = difficultyNeed * 5 + typeNeed * 4;
      if (options.lessonCoverage) score += lessonCount === 0 ? 5 : Math.max(0, 2 - lessonCount);
      score += subtopicCount === 0 ? 3 : 0;

      // Fresh questions are preferred by source construction; this extra penalty
      // matters only when the bank is too small to avoid all recent questions.
      if (recent.has(question.id)) score -= 8;

      // Small random jitter prevents identical sessions while preserving balance.
      score += Math.random() * 1.5;

      if (score > bestScore) {
        bestScore = score;
        candidates = [question];
      } else if (score === bestScore) {
        candidates.push(question);
      }
    }

    if (!candidates.length) break;
    const selected = candidates[Math.floor(Math.random() * candidates.length)];
    chosen.push(selected);
    used.add(selected.id);
    lessonCounts.set(selected.lessonId, (lessonCounts.get(selected.lessonId) ?? 0) + 1);
    const key = selected.subtopic ?? selected.topic;
    subtopicCounts.set(key, (subtopicCounts.get(key) ?? 0) + 1);
  }

  return randomize(chosen);
}

export function selectRATQuestions(
  lessonQuestions: Question[],
  count: number,
  recentIds: Iterable<string> = [],
): Question[] {
  return selectSmart(lessonQuestions, count, {
    difficultyWeights: { Easy: 4, Medium: 4, Hard: 2 },
    typeWeights: { concept: 2, application: 3, scenario: 2, identification: 2, calculation: 1 },
    recentIds,
  });
}

export function selectCATQuestions(
  bank: Question[],
  count: number,
  completedLessonIds: string[],
  recentIds: Iterable<string> = [],
): Question[] {
  const completed = new Set(completedLessonIds);
  const relevant = completed.size ? bank.filter(question => completed.has(question.lessonId)) : bank;

  return selectSmart(relevant, count, {
    difficultyWeights: { Easy: 6, Medium: 8, Hard: 6 },
    typeWeights: { concept: 2, application: 3, scenario: 3, identification: 1, calculation: 1 },
    lessonCoverage: true,
    recentIds,
  });
}

export function selectPracticeQuestions(
  pool: Question[],
  count: number,
  recentIds: Iterable<string> = [],
): Question[] {
  return selectSmart(pool, count, {
    typeWeights: { concept: 1, application: 3, scenario: 3, identification: 2, calculation: 1 },
    lessonCoverage: true,
    recentIds,
  });
}
