import type { Question } from "./questions";

type Difficulty = Question["difficulty"];

const DIFFICULTY_ORDER: Difficulty[] = ["Easy", "Medium", "Hard"];

function randomize<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
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

export function selectRATQuestions(
  lessonQuestions: Question[],
  count: number,
  recentIds: Iterable<string> = [],
): Question[] {
  return selectBalanced(lessonQuestions, count, { Easy: 4, Medium: 4, Hard: 2 }, recentIds);
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

  // Spread CAT coverage across lessons first, then balance difficulty.
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

  return selectBalanced(
    lessonSelection,
    target,
    { Easy: 6, Medium: 8, Hard: 6 },
    [],
  );
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

  return randomize(source).slice(0, target);
}
