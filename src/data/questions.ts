export type Question = {
  id: string;
  lessonId: string;
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
    lessonId: "cellular-energy",
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
    lessonId: "cellular-energy",
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
    lessonId: "cellular-energy",
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
    lessonId: "cellular-energy",
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
    lessonId: "cellular-energy",
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
    lessonId: "cellular-energy",
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
    lessonId: "cellular-energy",
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
    lessonId: "cellular-energy",
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
    lessonId: "cellular-energy",
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
    lessonId: "cellular-energy",
    topic: "Cell Biology",
    difficulty: "Easy",
    prompt: "Which cellular structure is the main site of protein synthesis?",
    options: ["Lysosome", "Ribosome", "Peroxisome"],
    answer: 1,
    explanation: "Ribosomes translate messenger RNA into polypeptide chains.",
    reference: "Molecular Biology of the Cell",
  },
  {
    id: "bio-011", lessonId: "human-tissues", topic: "Physiology", difficulty: "Easy",
    prompt: "Which blood cells are primarily responsible for oxygen transport?", options: ["Erythrocytes", "Platelets", "Neutrophils"], answer: 0,
    explanation: "Erythrocytes contain hemoglobin, which binds and transports oxygen.", reference: "Guyton and Hall Textbook of Medical Physiology",
  },
  {
    id: "bio-012", lessonId: "human-tissues", topic: "Histology", difficulty: "Easy",
    prompt: "Which organelle is abundant in cells specialized for protein secretion?", options: ["Rough endoplasmic reticulum", "Lysosome", "Centriole"], answer: 0,
    explanation: "Rough endoplasmic reticulum contains ribosomes and synthesizes proteins destined for secretion or membranes.", reference: "Junqueira's Basic Histology",
  },
  {
    id: "bio-013", lessonId: "human-tissues", topic: "Genetics", difficulty: "Easy",
    prompt: "What is the basic unit of heredity?", options: ["Gene", "Tissue", "Organelle"], answer: 0,
    explanation: "A gene is a functional unit of heredity encoded in DNA.", reference: "Molecular Biology of the Cell",
  },
  {
    id: "bio-014", lessonId: "human-tissues", topic: "Neuroanatomy", difficulty: "Medium",
    prompt: "Which division of the nervous system contains the brain and spinal cord?", options: ["Central nervous system", "Peripheral nervous system", "Enteric nervous system"], answer: 0,
    explanation: "The central nervous system consists of the brain and spinal cord.", reference: "Gray's Anatomy",
  },
  {
    id: "bio-015", lessonId: "human-tissues", topic: "Cell Biology", difficulty: "Medium",
    prompt: "Which organelle contains enzymes involved in intracellular digestion?", options: ["Lysosome", "Nucleus", "Ribosome"], answer: 0,
    explanation: "Lysosomes contain hydrolytic enzymes that digest cellular material.", reference: "Molecular Biology of the Cell",
  },
  {
    id: "bio-016", lessonId: "human-regulation", topic: "Physiology", difficulty: "Medium",
    prompt: "Which hormone increases blood glucose during fasting?", options: ["Glucagon", "Insulin", "Calcitonin"], answer: 0,
    explanation: "Glucagon promotes hepatic glycogenolysis and gluconeogenesis, helping raise blood glucose.", reference: "Guyton and Hall Textbook of Medical Physiology",
  },
  {
    id: "bio-017", lessonId: "human-regulation", topic: "Human Biology", difficulty: "Easy",
    prompt: "Which chamber pumps oxygenated blood into the systemic circulation?", options: ["Right atrium", "Left ventricle", "Right ventricle"], answer: 1,
    explanation: "The left ventricle ejects oxygenated blood into the aorta for systemic circulation.", reference: "Guyton and Hall Textbook of Medical Physiology",
  },
  {
    id: "bio-018", lessonId: "human-regulation", topic: "Histology", difficulty: "Medium",
    prompt: "Which tissue type generally covers body surfaces and lines cavities?", options: ["Epithelial tissue", "Nervous tissue", "Muscle tissue"], answer: 0,
    explanation: "Epithelial tissue forms coverings, linings, and many glandular structures.", reference: "Junqueira's Basic Histology",
  },
  {
    id: "bio-019", lessonId: "human-regulation", topic: "Genetics", difficulty: "Medium",
    prompt: "What is the complementary DNA base that pairs with adenine?", options: ["Thymine", "Cytosine", "Guanine"], answer: 0,
    explanation: "In DNA, adenine pairs with thymine through hydrogen bonds.", reference: "Molecular Biology of the Cell",
  },
  {
    id: "bio-020", lessonId: "human-regulation", topic: "Neuroanatomy", difficulty: "Medium",
    prompt: "Which structure connects the two cerebral hemispheres?", options: ["Corpus callosum", "Medulla oblongata", "Pituitary gland"], answer: 0,
    explanation: "The corpus callosum is a large bundle of commissural fibers connecting the cerebral hemispheres.", reference: "Gray's Anatomy",
  },
  {
    id:"bio-031",lessonId:"human-tissues",topic:"Histology",difficulty:"Easy",
    prompt:"Which tissue forms a protective covering over many external body surfaces?",options:["Epithelial tissue","Nervous tissue","Adipose tissue"],answer:0,
    explanation:"Epithelial tissue forms coverings and linings and provides protective barriers.",reference:"Junqueira's Basic Histology",
  },
  {
    id:"bio-032",lessonId:"human-tissues",topic:"Histology",difficulty:"Medium",
    prompt:"Which feature best describes simple squamous epithelium?",options:["A single thin layer of flattened cells","Many layers of columnar cells","A single layer of muscle fibers"],answer:0,
    explanation:"Simple squamous epithelium consists of one thin layer of flattened cells and is suited to diffusion and filtration.",reference:"Junqueira's Basic Histology",
  },
  {
    id:"bio-033",lessonId:"human-tissues",topic:"Cell Biology",difficulty:"Medium",
    prompt:"Ribosomes attached to rough ER primarily synthesize proteins destined for which locations?",options:["Secretion or membranes","Only the nucleus","Only mitochondria"],answer:0,
    explanation:"Ribosomes on rough ER synthesize many proteins destined for secretion, membranes or the endomembrane system.",reference:"Molecular Biology of the Cell",
  },
  {
    id:"bio-034",lessonId:"human-tissues",topic:"Histology",difficulty:"Easy",
    prompt:"Which tissue type is characterized by closely packed cells with relatively little extracellular space?",options:["Epithelial tissue","Bone only","Blood plasma"],answer:0,
    explanation:"Epithelial tissue generally has tightly packed cells arranged in continuous sheets.",reference:"Junqueira's Basic Histology",
  },
  {
    id:"bio-035",lessonId:"human-tissues",topic:"Histology",difficulty:"Medium",
    prompt:"Why is a thin epithelial layer advantageous for diffusion?",options:["It shortens the diffusion distance","It prevents all movement","It increases DNA replication"],answer:0,
    explanation:"A thin barrier reduces diffusion distance and can facilitate rapid exchange of substances.",reference:"Junqueira's Basic Histology",
  },
  {
    id:"bio-036",lessonId:"human-regulation",topic:"Physiology",difficulty:"Easy",
    prompt:"Which pancreatic hormone generally decreases blood glucose?",options:["Insulin","Glucagon","Cortisol"],answer:0,
    explanation:"Insulin promotes glucose uptake and storage and generally lowers blood glucose concentration.",reference:"Guyton and Hall Textbook of Medical Physiology",
  },
  {
    id:"bio-037",lessonId:"human-regulation",topic:"Physiology",difficulty:"Easy",
    prompt:"Which pancreatic hormone generally increases blood glucose during fasting?",options:["Glucagon","Insulin","Melatonin"],answer:0,
    explanation:"Glucagon promotes processes such as glycogenolysis and gluconeogenesis that help raise blood glucose.",reference:"Guyton and Hall Textbook of Medical Physiology",
  },
  {
    id:"bio-038",lessonId:"human-regulation",topic:"Physiology",difficulty:"Medium",
    prompt:"Which protein in erythrocytes binds most of the oxygen carried in blood?",options:["Hemoglobin","Insulin","Actin"],answer:0,
    explanation:"Hemoglobin in erythrocytes binds oxygen and enables efficient oxygen transport.",reference:"Guyton and Hall Textbook of Medical Physiology",
  },
  {
    id:"bio-039",lessonId:"human-regulation",topic:"Neuroanatomy",difficulty:"Easy",
    prompt:"Which two structures make up the central nervous system?",options:["Brain and spinal cord","Heart and lungs","Nerves and muscles"],answer:0,
    explanation:"The central nervous system consists of the brain and spinal cord.",reference:"Gray's Anatomy",
  },
  {
    id:"bio-040",lessonId:"human-regulation",topic:"Neuroanatomy",difficulty:"Medium",
    prompt:"Which structure allows communication between the two cerebral hemispheres?",options:["Corpus callosum","Pituitary gland","Medulla"],answer:0,
    explanation:"The corpus callosum is a large commissural fiber tract connecting the cerebral hemispheres.",reference:"Gray's Anatomy",
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
