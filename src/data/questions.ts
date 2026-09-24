export type Question = {
  id: string;
  topic: string;
  difficulty: "Easy" | "Medium" | "Hard";
  prompt: string;
  options: [string, string, string];
  answer: number;
  explanation: string;
  reference: string;
};

export const questions: Question[] = [
  {
    id: "bio-001",
    topic: "Cell Biology",
    difficulty: "Easy",
    prompt: "Which organelle is primarily responsible for ATP production in most eukaryotic cells?",
    options: ["Ribosome", "Mitochondrion", "Golgi apparatus"],
    answer: 1,
    explanation: "Mitochondria generate most cellular ATP through oxidative phosphorylation.",
    reference: "Guyton and Hall Textbook of Medical Physiology",
  },
  {
    id: "bio-002",
    topic: "Cell Biology",
    difficulty: "Easy",
    prompt: "Which structure controls what enters and leaves the cell?",
    options: ["Plasma membrane", "Nucleolus", "Centrosome"],
    answer: 0,
    explanation: "The plasma membrane provides selective permeability and regulates movement of substances.",
    reference: "Guyton and Hall Textbook of Medical Physiology",
  },
  {
    id: "bio-003",
    topic: "Genetics",
    difficulty: "Easy",
    prompt: "What molecule carries the genetic instructions used to build proteins?",
    options: ["DNA", "ATP", "Cholesterol"],
    answer: 0,
    explanation: "DNA stores hereditary information encoded in its nucleotide sequence.",
    reference: "Molecular Biology of the Cell",
  },
  {
    id: "bio-004",
    topic: "Physiology",
    difficulty: "Medium",
    prompt: "Which organ primarily regulates blood glucose through insulin and glucagon?",
    options: ["Spleen", "Pancreas", "Thyroid gland"],
    answer: 1,
    explanation: "The pancreatic islets contain beta cells that secrete insulin and alpha cells that secrete glucagon.",
    reference: "Guyton and Hall Textbook of Medical Physiology",
  },
  {
    id: "bio-005",
    topic: "Histology",
    difficulty: "Medium",
    prompt: "Which epithelial tissue is specialized for efficient diffusion?",
    options: ["Simple squamous epithelium", "Stratified cuboidal epithelium", "Transitional epithelium"],
    answer: 0,
    explanation: "Simple squamous epithelium is thin and well suited for diffusion and filtration.",
    reference: "Junqueira's Basic Histology",
  },
  {
    id: "bio-006",
    topic: "Neuroanatomy",
    difficulty: "Medium",
    prompt: "Which part of a neuron usually receives incoming signals from other neurons?",
    options: ["Axon", "Dendrites", "Myelin sheath"],
    answer: 1,
    explanation: "Dendrites typically receive synaptic input and conduct signals toward the cell body.",
    reference: "Gray's Anatomy",
  },
  {
    id: "bio-007",
    topic: "Human Biology",
    difficulty: "Easy",
    prompt: "How many chambers does the normal human heart have?",
    options: ["Two", "Three", "Four"],
    answer: 2,
    explanation: "The normal heart has two atria and two ventricles, making four chambers.",
    reference: "Guyton and Hall Textbook of Medical Physiology",
  },
  {
    id: "bio-008",
    topic: "Physiology",
    difficulty: "Medium",
    prompt: "Which hormone directly lowers blood glucose concentration?",
    options: ["Insulin", "Glucagon", "Adrenaline"],
    answer: 0,
    explanation: "Insulin promotes glucose uptake and storage, lowering blood glucose.",
    reference: "Guyton and Hall Textbook of Medical Physiology",
  },
  {
    id: "bio-009",
    topic: "Genetics",
    difficulty: "Medium",
    prompt: "During which process are homologous chromosomes separated?",
    options: ["Meiosis I", "Meiosis II", "Mitosis"],
    answer: 0,
    explanation: "Homologous chromosome pairs separate during anaphase I of meiosis.",
    reference: "Molecular Biology of the Cell",
  },
  {
    id: "bio-010",
    topic: "Cell Biology",
    difficulty: "Easy",
    prompt: "Which cellular structure is the main site of protein synthesis?",
    options: ["Lysosome", "Ribosome", "Peroxisome"],
    answer: 1,
    explanation: "Ribosomes translate messenger RNA into polypeptide chains.",
    reference: "Molecular Biology of the Cell",
  },
];

export const RAT_QUESTION_COUNT = 10;
export const RAT_DURATION_SECONDS = 15 * 60;
export const RAT_POINTS_PER_CORRECT = 5;

export function shuffleQuestions(source: Question[], count: number): Question[] {
  return [...source]
    .sort(() => Math.random() - 0.5)
    .slice(0, Math.min(count, source.length));
}
