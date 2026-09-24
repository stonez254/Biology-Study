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
  {
    id: "bio-011", topic: "Physiology", difficulty: "Easy",
    prompt: "Which blood cells are primarily responsible for oxygen transport?", options: ["Erythrocytes", "Platelets", "Neutrophils"], answer: 0,
    explanation: "Erythrocytes contain hemoglobin, which binds and transports oxygen.", reference: "Guyton and Hall Textbook of Medical Physiology",
  },
  {
    id: "bio-012", topic: "Histology", difficulty: "Easy",
    prompt: "Which organelle is abundant in cells specialized for protein secretion?", options: ["Rough endoplasmic reticulum", "Lysosome", "Centriole"], answer: 0,
    explanation: "Rough endoplasmic reticulum contains ribosomes and synthesizes proteins destined for secretion or membranes.", reference: "Junqueira's Basic Histology",
  },
  {
    id: "bio-013", topic: "Genetics", difficulty: "Easy",
    prompt: "What is the basic unit of heredity?", options: ["Gene", "Tissue", "Organelle"], answer: 0,
    explanation: "A gene is a functional unit of heredity encoded in DNA.", reference: "Molecular Biology of the Cell",
  },
  {
    id: "bio-014", topic: "Neuroanatomy", difficulty: "Medium",
    prompt: "Which division of the nervous system contains the brain and spinal cord?", options: ["Central nervous system", "Peripheral nervous system", "Enteric nervous system"], answer: 0,
    explanation: "The central nervous system consists of the brain and spinal cord.", reference: "Gray's Anatomy",
  },
  {
    id: "bio-015", topic: "Cell Biology", difficulty: "Medium",
    prompt: "Which organelle contains enzymes involved in intracellular digestion?", options: ["Lysosome", "Nucleus", "Ribosome"], answer: 0,
    explanation: "Lysosomes contain hydrolytic enzymes that digest cellular material.", reference: "Molecular Biology of the Cell",
  },
  {
    id: "bio-016", topic: "Physiology", difficulty: "Medium",
    prompt: "Which hormone increases blood glucose during fasting?", options: ["Glucagon", "Insulin", "Calcitonin"], answer: 0,
    explanation: "Glucagon promotes hepatic glycogenolysis and gluconeogenesis, helping raise blood glucose.", reference: "Guyton and Hall Textbook of Medical Physiology",
  },
  {
    id: "bio-017", topic: "Human Biology", difficulty: "Easy",
    prompt: "Which chamber pumps oxygenated blood into the systemic circulation?", options: ["Right atrium", "Left ventricle", "Right ventricle"], answer: 1,
    explanation: "The left ventricle ejects oxygenated blood into the aorta for systemic circulation.", reference: "Guyton and Hall Textbook of Medical Physiology",
  },
  {
    id: "bio-018", topic: "Histology", difficulty: "Medium",
    prompt: "Which tissue type generally covers body surfaces and lines cavities?", options: ["Epithelial tissue", "Nervous tissue", "Muscle tissue"], answer: 0,
    explanation: "Epithelial tissue forms coverings, linings, and many glandular structures.", reference: "Junqueira's Basic Histology",
  },
  {
    id: "bio-019", topic: "Genetics", difficulty: "Medium",
    prompt: "What is the complementary DNA base that pairs with adenine?", options: ["Thymine", "Cytosine", "Guanine"], answer: 0,
    explanation: "In DNA, adenine pairs with thymine through hydrogen bonds.", reference: "Molecular Biology of the Cell",
  },
  {
    id: "bio-020", topic: "Neuroanatomy", difficulty: "Medium",
    prompt: "Which structure connects the two cerebral hemispheres?", options: ["Corpus callosum", "Medulla oblongata", "Pituitary gland"], answer: 0,
    explanation: "The corpus callosum is a large bundle of commissural fibers connecting the cerebral hemispheres.", reference: "Gray's Anatomy",
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
