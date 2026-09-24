export const ASSESSMENT_CONFIG = {
  rat: { questionCount: 10, durationSeconds: 15 * 60, pointsPerCorrect: 5, passmark: 50 },
  cat: { questionCount: 20, durationSeconds: 30 * 60, pointsPerCorrect: 10, passmark: 50, intervalDays: 3 },
} as const;
