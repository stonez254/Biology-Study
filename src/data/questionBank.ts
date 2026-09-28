import { questionSeeds, type QuestionSeed } from "./questionSeeds";
import { deepQuestionSeeds } from "./questionSeedsDeep";
import { foundationQuestionSeeds } from "./questionSeedsFoundations";
import { expandedQuestionSeeds } from "./questionSeedsExtended";
import { expansion90QuestionSeeds } from "./questionSeedsExpansion90";
import { highSchoolQuestionSeeds } from "./questionSeedsHighSchool";
import { highSchoolForm1ExpansionSeeds, highSchoolForm1DepthSeeds } from "./questionSeedsHighSchoolForm1";
import { highSchoolForm2QuestionSeeds } from "./questionSeedsHighSchoolForm2";
import { highSchoolForm34QuestionSeeds } from "./questionSeedsHighSchoolForm34";
import type { CurriculumTrack } from "./curriculum";
import { matchesCurriculum } from "./questionCurriculum";
import { getVirtualLessonQuestionsMatch } from "./highSchoolLessons";

export type { QuestionSeed };

export const questionBank: QuestionSeed[] = [...questionSeeds, ...expandedQuestionSeeds, ...deepQuestionSeeds, ...foundationQuestionSeeds, ...expansion90QuestionSeeds, ...highSchoolQuestionSeeds, ...highSchoolForm1ExpansionSeeds, ...highSchoolForm1DepthSeeds, ...highSchoolForm2QuestionSeeds, ...highSchoolForm34QuestionSeeds];

const lessonIds = new Set([
  "hs-f1-introduction",
  "hs-f1-cell",
  "hs-f1-cell-physiology",
  "hs-f1-classification",
  "hs-f1-nutrition",
  "hs-f2-gaseous-exchange",
  "hs-f2-respiration",
  "hs-f2-transport-plants",
  "hs-f2-transport-animals",
  "hs-f3-reproduction",
  "hs-f3-growth",
  "hs-f3-coordination",
  "hs-f3-ecology",
  "cellular-energy",
  "human-tissues",
  "human-regulation",
  "cell-membrane-transport",
  "cell-cycle-mitosis",
  "histology-basics",
  "blood-immune-cells",
  "nervous-system-basics",
  "genetics-foundations",
  "homeostasis-feedback",
  "biology-foundations",
  "chemistry-of-life",
  "photosynthesis-plants",
  "microbiology-viruses",
  "evolution-population-genetics",
  "ecology-ecosystems",
]);
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

export function getQuestionsForLesson(lessonId: string, curriculum: CurriculumTrack = "all"): QuestionSeed[] {
  return questionBank.filter(question => {
    const directLessonMatch = question.lessonId === lessonId;

    // High School lessons use only explicitly tagged High School questions.
    // No university/medical question is allowed to enter through keyword matching.
    const virtualHighSchoolMatch =
      curriculum === "high-school" &&
      question.curriculum === "high-school" &&
      getVirtualLessonQuestionsMatch(lessonId, question);

    const belongsToLesson = directLessonMatch || virtualHighSchoolMatch;
    return belongsToLesson && matchesCurriculum(question, curriculum);
  });
}

export function getQuestionCountForLesson(lessonId: string, curriculum: CurriculumTrack = "all"): number {
  return getQuestionsForLesson(lessonId, curriculum).length;
}

export const QUESTION_BANK_COUNTS = Object.fromEntries(
  [...new Set(questionBank.map(question => question.lessonId))].map(lessonId => [
    lessonId,
    getQuestionCountForLesson(lessonId),
  ]),
) as Record<string, number>;
