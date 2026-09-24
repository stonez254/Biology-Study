import type { Question } from "./questions";

type Difficulty = Question["difficulty"];
export type QuestionType = NonNullable<Question["questionType"]>;

const DIFFICULTY_ORDER: Difficulty[] = ["Easy", "Medium", "Hard"];
const QUESTION_TYPE_ORDER: QuestionType[] = [
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
  if (/calculate|how many|percentage|ratio|rate|concentration|probability|frequency|volume|mass|molar|equation|value/.test(prompt)) {
    return "calculation";
  }
  if (/identify|which structure|which organ|which tissue|which cell|where does|where is|what organelle/.test(prompt)) {
    return "identification";
  }
  if (/a patient|a person|a cell|a tissue|a scientist|a researcher|during|after|before|if |when |case|observ/.test(prompt)) {
    return "scenario";
  }
  if (/why|how does|what happens|effect|advantage|function|role|define|meaning/.test(prompt)) {
    return "application";
  }
  return "concept";
}

function selectBalanced(
  pool: Question[],
  count: number,
  targetWeights: Record<Difficulty, number>,
  recentIds: Iterable<string> = [],
): Question[] {
  const target = Math.min(count, pool.length);
  if (!target) return [];

  const recent = new Set(recentIds);
  const fresh = pool.filter(q => !recent.has(q.id));
  const source = fresh.length >= target ? fresh : [...fresh, ...pool.filter(q => recent.has(q.id))];

  const buckets = Object.fromEntries(
    DIFFICULTY_ORDER.map(difficulty => [
      difficulty,
      randomize(source.filter(q => q.difficulty === difficulty)),
    ]),
  ) as Record<Difficulty, Question[]>;

  const chosen: Question[] = [];
  const used = new Set<string>();

  const totalWeight = Object.values(targetWeights).reduce((sum, weight) => sum + weight, 0);
  const quotas = Object.fromEntries(
    DIFFICULTY_ORDER.map(difficulty => [
      difficulty,
      Math.floor((target * targetWeights[difficulty]) / totalWeight),
    ]),
  ) as Record<Difficulty, number>;

  let assigned = Object.values(quotas).reduce((sum, value) => sum + value, 0);
  const remainderOrder = [...DIFFICULTY_ORDER].sort(
    (a, b) => (targetWeights[b] - targetWeights[a]) || Math.random() - 0.5,
  );

  for (const difficulty of remainderOrder) {
    if (assigned >= target) break;
    quotas[difficulty] += 1;
    assigned += 1;
  }

  const take = (difficulty: Difficulty, limit: number) => {
    for (const question of buckets[difficulty]) {
      if (chosen.length >= target || limit <= 0) break;
      if (used.has(question.id)) continue;
      chosen.push(question);
      used.add(question.id);
      limit -= 1;
    }
  };

  for (const difficulty of DIFFICULTY_ORDER) {
    take(difficulty, quotas[difficulty]);
  }

  if (chosen.length < target) {
    for (const question of randomize(source)) {
      if (chosen.length >= target) break;
      if (used.has(question.id)) continue;
      chosen.push(question);
      used.add(question.id);
    }
  }

  return randomize(chosen);
}

function selectTypeBalanced(pool: Question[], count: number): Question[] {
  const target = Math.min(count, pool.length);
  if (!target) return [];

  const buckets = Object.fromEntries(
    QUESTION_TYPE_ORDER.map(type => [
      type,
      randomize(pool.filter(question => inferQuestionType(question) === type)),
    ]),
  ) as Record<QuestionType, Question[]>;

  const chosen: Question[] = [];
  const used = new Set<string>();

  for (let index = 0; index < target; index += 1) {
    const preferredType = QUESTION_TYPE_ORDER[index % QUESTION_TYPE_ORDER.length];
    const fallbackTypes = randomize(QUESTION_TYPE_ORDER.filter(type => type !== preferredType));
    const types = [preferredType, ...fallbackTypes];

    for (const type of types) {
      const question = buckets[type].find(item => !used.has(item.id));
      if (!question) continue;
      chosen.push(question);
      used.add(question.id);
      break;
    }
  }

  return randomize(chosen);
}

export function selectRATQuestions(
  lessonQuestions: Question[],
  count: number,
  recentIds: Iterable<string> = [],
): Question[] {
  const balanced = selectBalanced(lessonQuestions, count, { Easy: 4, Medium: 4, Hard: 2 }, recentIds);
  return selectTypeBalanced(balanced, balanced.length);
}

export function selectCATQuestions(
  bank: Question[],
  count: number,
  completedLessonIds: string[],
  recentIds: Iterable<string> = [],
): Question[] {
  const completed = new Set(completedLessonIds);
  const relevant = completed.size
    ? bank.filter(question => completed.has(question.lessonId))
    : bank;

  const target = Math.min(count, relevant.length);
  if (!target) return [];

  const recent = new Set(recentIds);
  const fresh = relevant.filter(q => !recent.has(q.id));
  const source = fresh.length >= target ? fresh : [...fresh, ...relevant.filter(q => recent.has(q.id))];

  const byLesson = new Map<string, Question[]>();
  for (const question of randomize(source)) {
    const list = byLesson.get(question.lessonId) ?? [];
    list.push(question);
    byLesson.set(question.lessonId, list);
  }

  const lessons = randomize([...byLesson.keys()]);
  const lessonSelection: Question[] = [];
  let cursor = 0;

  while (lessonSelection.length < target && lessons.length) {
    const lessonId = lessons[cursor % lessons.length];
    const list = byLesson.get(lessonId) ?? [];
    const question = list.shift();
    if (question) lessonSelection.push(question);
    if (!list.length) {
      lessons.splice(cursor % lessons.length, 1);
      cursor = 0;
    } else {
      cursor += 1;
    }
  }

  const difficultyBalanced = selectBalanced(
    lessonSelection,
    target,
    { Easy: 6, Medium: 8, Hard: 6 },
    [],
  );
  return selectTypeBalanced(difficultyBalanced, difficultyBalanced.length);
}

export function selectPracticeQuestions(
  pool: Question[],
  count: number,
  recentIds: Iterable<string> = [],
): Question[] {
  const target = Math.min(count, pool.length);
  if (!target) return [];

  const recent = new Set(recentIds);
  const fresh = pool.filter(q => !recent.has(q.id));
  const source = fresh.length >= target ? fresh : [...fresh, ...pool.filter(q => recent.has(q.id))];

  return selectTypeBalanced(source, target);
}
