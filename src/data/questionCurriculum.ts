import type { CurriculumTrack } from "./curriculum";
import type { QuestionSeed } from "./questionSeeds";

/**
 * Safe first-pass curriculum mapping.
 *
 * Explicit question.curriculum always wins. Legacy questions without metadata
 * are classified by lesson/topic so the existing bank remains intact while the
 * High School track becomes the default learning direction.
 *
 * This is intentionally conservative. "all" never removes content, and the
 * mapping can be refined as the 8,500-question bank is audited.
 */
const HIGH_SCHOOL_LESSONS = new Set([
  "biology-foundations",
  "chemistry-of-life",
  "cellular-energy",
  "cell-membrane-transport",
  "cell-cycle-mitosis",
  "genetics-foundations",
  "photosynthesis-plants",
  "microbiology-viruses",
  "evolution-population-genetics",
  "ecology-ecosystems",
]);

const MEDICAL_LESSONS = new Set([
  "histology-basics",
  "blood-immune-cells",
  "nervous-system-basics",
  "human-regulation",
]);

export function getQuestionCurriculum(question: QuestionSeed): Exclude<CurriculumTrack, "all"> {
  if (question.curriculum && question.curriculum !== "all") return question.curriculum;
  if (HIGH_SCHOOL_LESSONS.has(question.lessonId)) return "high-school";
  if (MEDICAL_LESSONS.has(question.lessonId)) return "medical";
  return "university";
}

export function matchesCurriculum(question: QuestionSeed, curriculum: CurriculumTrack): boolean {
  return curriculum === "all" || getQuestionCurriculum(question) === curriculum;
}

export function getCurriculumLabel(curriculum: CurriculumTrack): string {
  return curriculum === "high-school"
    ? "High School Biology"
    : curriculum === "university"
      ? "University Biology"
      : curriculum === "medical"
        ? "Medical Biology"
        : "All Biology Content";
}
