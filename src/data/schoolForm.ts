export type SchoolForm = 1 | 2 | 3 | 4;

const STORAGE_KEY = "biology-study:school-form";

export function getSchoolForm(): SchoolForm {
  if (typeof window === "undefined") return 1;
  const saved = Number(localStorage.getItem(STORAGE_KEY));
  return saved === 2 || saved === 3 || saved === 4 ? saved : 1;
}

export function setSchoolForm(form: SchoolForm) {
  localStorage.setItem(STORAGE_KEY, String(form));
}

export function includesForm(selectedForm: SchoolForm, lessonForm?: SchoolForm) {
  // Form 1, 2 and 3 selections are isolated to that exact form.
  // Form 4 is the cumulative senior selection and intentionally includes Forms 1–4.
  return lessonForm != null && (selectedForm === 4 || lessonForm === selectedForm);
}
