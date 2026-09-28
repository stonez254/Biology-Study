export type CurriculumTrack = "high-school" | "university" | "medical" | "all";

export const CURRICULUM_TRACKS: Record<CurriculumTrack, { label: string; description: string }> = {
  "high-school": {
    label: "High School Biology",
    description: "Form 1–4 Biology, KCSE preparation, revision and school-level mastery.",
  },
  university: {
    label: "University Biology",
    description: "Undergraduate and advanced Biology content.",
  },
  medical: {
    label: "Medical Biology",
    description: "Medicine-oriented Biology and human-science content.",
  },
  all: {
    label: "All Biology Content",
    description: "Show content across all available Biology tracks.",
  },
};

const STORAGE_KEY = "biology-study:curriculum-track";

export function getCurriculumTrack(): CurriculumTrack {
  if (typeof window === "undefined") return "high-school";
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved === "university" || saved === "medical" || saved === "all" || saved === "high-school"
    ? saved
    : "high-school";
}

export function setCurriculumTrack(track: CurriculumTrack) {
  localStorage.setItem(STORAGE_KEY, track);
}
