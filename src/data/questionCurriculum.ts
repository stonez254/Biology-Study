import type { CurriculumTrack } from "./curriculum";
import type { QuestionSeed } from "./questionSeeds";

/**
 * Strict curriculum separation.
 *
 * Questions without an explicit curriculum tag are treated as University
 * content. This is deliberate: an ambiguous question must never leak into
 * the High School track just because a keyword happens to match.
 *
 * High School questions must be explicitly tagged with:
 *   curriculum: "high-school"
 *
 * University and Medical questions should likewise carry their explicit tag
 * as the bank is audited.
 */
export function getQuestionCurriculum(question: QuestionSeed): Exclude<CurriculumTrack, "all"> {
  if (question.curriculum && question.curriculum !== "all") return question.curriculum;
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
