import { getQuestionCountForLesson } from "./questionBank";\n\nexport type LessonSection = {
  label: string;
  title: string;
  body: string;
  highYield: string;
};

export type Lesson = {
  id: string;
  sequence: number;
  title: string;
  topic: string;
  objectives: string[];
  sections: LessonSection[];
  reference: string;
  questionCount: number;
};

const lessonDefinitions: Omit<Lesson, "questionCount">[] = [
  {
    id: "cellular-energy",
    sequence: 1,
    title: "Cellular Energy & ATP",
    topic: "Cell Biology",
    objectives: ["Explain ATP as the cell's immediate energy currency.", "Locate the major stages of aerobic respiration.", "Explain the role of oxygen in oxidative phosphorylation."],
    sections: [
      {label:"01 • Core concept",title:"Why cells need ATP",body:"Cells constantly perform work such as transport, synthesis, signalling and muscle contraction. ATP provides immediately usable chemical energy for many of these processes.",highYield:"ATP links metabolism to cellular work."},
      {label:"02 • Production",title:"Where ATP comes from",body:"Glycolysis occurs in the cytosol. The citric acid cycle and oxidative phosphorylation occur in mitochondria, with oxidative phosphorylation producing most ATP during aerobic respiration.",highYield:"The inner mitochondrial membrane houses the electron transport chain and ATP synthase."},
      {label:"03 • High-yield",title:"Oxygen and ATP",body:"Oxygen serves as the final electron acceptor in the mitochondrial electron transport chain, allowing oxidative phosphorylation to continue.",highYield:"Without adequate oxygen, aerobic ATP production falls."},
      {label:"04 • Quick check",title:"Before the RAT",body:"Be able to explain ATP's role, the location of glycolysis, the role of mitochondria and why oxygen supports aerobic ATP production.",highYield:"Know the locations and sequence of the major stages."},
      {label:"05 • Mechanism",title:"From glucose to usable energy",body:"During glycolysis, glucose is converted into pyruvate and a small amount of ATP is produced. When oxygen is available, pyruvate-derived carbon enters mitochondrial pathways that generate reduced electron carriers. These carriers deliver high-energy electrons to the electron transport chain, where their energy helps establish a proton gradient. ATP synthase uses that gradient to form ATP from ADP and phosphate.",highYield:"Remember the flow: glucose → glycolysis → mitochondrial oxidation → electron transport → proton gradient → ATP synthesis."},
      {label:"06 • Integration",title:"ATP is continuously recycled",body:"ATP is not stored in large quantities as a long-term fuel reserve. Cells continually regenerate ATP as it is consumed. This is why disruptions in oxygen delivery, mitochondrial function or substrate availability can quickly affect tissues with high energy demands. Muscle, nervous tissue and actively transporting cells are particularly dependent on a reliable ATP supply.",highYield:"ATP production and ATP use are continuous processes."},
    ],
    reference:"Guyton and Hall Textbook of Medical Physiology", questionCount:10
  },
  {
    id:"human-tissues",
    sequence:2,
    title:"Tissues & Cellular Organization",
    topic:"Histology",
    objectives:["Identify the major tissue types.", "Connect epithelial structure to function.", "Recognize organelles associated with protein secretion."],
    sections:[
      {label:"01 • Core concept",title:"Epithelial tissue",body:"Epithelial tissue covers surfaces, lines cavities and forms many glands. Its cells are closely packed and organized into sheets.",highYield:"Think covering, lining and secretion."},
      {label:"02 • Histology",title:"Simple squamous epithelium",body:"Simple squamous epithelium is thin and suited to diffusion and filtration, making it useful where rapid exchange is important.",highYield:"Thin structure supports efficient diffusion."},
      {label:"03 • High-yield",title:"Protein-secreting cells",body:"Cells specialized for protein secretion commonly contain abundant rough endoplasmic reticulum because ribosomes synthesize proteins destined for secretion or membranes.",highYield:"Rough ER is a major clue for protein synthesis and secretion."},
      {label:"04 • Quick check",title:"Before the RAT",body:"Review epithelial functions, simple squamous epithelium and the role of rough ER.",highYield:"Be able to connect structure with function."}
    ],
    reference:"Junqueira's Basic Histology", questionCount:10
  },
  {
    id:"human-regulation",
    sequence:3,
    title:"Human Regulation & Communication",
    topic:"Physiology & Neuroanatomy",
    objectives:["Explain basic blood-glucose regulation.", "Trace the main role of the left ventricle.", "Identify core central nervous system structures."],
    sections:[
      {label:"01 • Core concept",title:"Blood glucose control",body:"The pancreas contains endocrine cells that help regulate blood glucose. Insulin generally lowers blood glucose while glucagon generally raises it.",highYield:"Insulin and glucagon act in opposite directions on blood glucose."},
      {label:"02 • Physiology",title:"Circulation",body:"The left ventricle pumps oxygenated blood into systemic circulation. Erythrocytes transport oxygen using hemoglobin.",highYield:"Trace blood flow and connect it to oxygen delivery."},
      {label:"03 • Neuroanatomy",title:"Nervous system organization",body:"The central nervous system consists of the brain and spinal cord. Dendrites typically receive incoming signals, while the corpus callosum connects the cerebral hemispheres.",highYield:"Know the major structures and their functions."},
      {label:"04 • Quick check",title:"Before the RAT",body:"Review insulin, glucagon, oxygen transport, CNS organization and basic neuronal structure.",highYield:"Use structure-function relationships to answer the RAT."}
    ],
    reference:"Guyton and Hall Textbook of Medical Physiology; Gray's Anatomy", questionCount:10
  },
  {
    id:"cell-membrane-transport",sequence:4,title:"Cell Membrane & Transport",topic:"Cell Biology",
    objectives:["Distinguish passive and active transport.","Explain diffusion and osmosis.","Relate membrane structure to selective permeability."],
    sections:[
      {label:"01 • Foundation",title:"The plasma membrane",body:"The plasma membrane is a selectively permeable barrier composed mainly of lipids and proteins. Its structure allows cells to maintain an internal environment distinct from the surroundings.",highYield:"Selective permeability is central to cellular homeostasis."},
      {label:"02 • Transport",title:"Passive movement",body:"Diffusion moves particles down their concentration gradient without direct cellular energy expenditure. Osmosis is the movement of water across a selectively permeable membrane.",highYield:"Down a gradient does not require ATP directly."},
      {label:"03 • High-yield",title:"Active transport",body:"Active transport moves substances against an electrochemical gradient and requires energy. Transport proteins can use ATP directly or use stored ion gradients.",highYield:"Against the gradient means an energy source is required."},
      {label:"04 • Quick check",title:"Review targets",body:"Compare diffusion, osmosis, facilitated diffusion and active transport using direction of movement, membrane proteins and energy requirements.",highYield:"Always identify the gradient and energy source first."}
    ],
    reference:"Molecular Biology of the Cell",questionCount:10
  },
  {
    id:"cell-cycle-mitosis",sequence:5,title:"Cell Cycle & Mitosis",topic:"Cell Biology & Genetics",
    objectives:["Describe the major cell-cycle phases.","Explain chromosome behavior during mitosis.","Distinguish mitosis from meiosis."],
    sections:[
      {label:"01 • Foundation",title:"The cell cycle",body:"The cell cycle includes growth and preparation phases followed by nuclear division. DNA is replicated before mitosis so daughter cells can receive genetic material.",highYield:"DNA replication precedes chromosome separation."},
      {label:"02 • Mitosis",title:"Chromosome separation",body:"Mitosis organizes duplicated chromosomes so that sister chromatids can be separated into daughter nuclei.",highYield:"Mitosis preserves chromosome number in typical somatic cell division."},
      {label:"03 • Comparison",title:"Mitosis versus meiosis",body:"Mitosis generally produces genetically similar daughter cells, whereas meiosis involves two divisions and produces haploid cells with genetic variation.",highYield:"Meiosis reduces chromosome number; mitosis generally maintains it."},
      {label:"04 • Quick check",title:"Review targets",body:"Know G1, S, G2 and M phases and identify what happens to chromosomes during the major stages of mitosis.",highYield:"Sequence matters."}
    ],
    reference:"Molecular Biology of the Cell",questionCount:10
  },
  {
    id:"histology-basics",sequence:6,title:"Histology Basics",topic:"Histology",
    objectives:["Recognize the four major tissue classes.","Connect microscopic structure to function.","Use histological clues to identify tissue."],
    sections:[
      {label:"01 • Foundation",title:"Four major tissues",body:"The four broad tissue classes are epithelial, connective, muscle and nervous tissue. Each has characteristic structural and functional features.",highYield:"Structure is the key to tissue identification."},
      {label:"02 • Epithelium",title:"Layers and shapes",body:"Epithelia can be described by the number of cell layers and the shape of cells at the surface. These features help predict function.",highYield:"Simple means one layer; stratified means multiple layers."},
      {label:"03 • Connective tissue",title:"Cells and matrix",body:"Connective tissues generally contain cells distributed within an extracellular matrix. The matrix contributes substantially to mechanical and biological properties.",highYield:"Connective tissue is defined strongly by its extracellular matrix."},
      {label:"04 • Quick check",title:"Review targets",body:"Practice identifying tissue by cell arrangement, extracellular material, vascularity and specialized function.",highYield:"Look for the dominant structural clue first."}
    ],
    reference:"Junqueira's Basic Histology",questionCount:10
  },
  {
    id:"blood-immune-cells",sequence:7,title:"Blood & Immune Cells",topic:"Physiology & Histology",
    objectives:["Identify major blood-cell classes.","Explain the role of hemoglobin.","Distinguish major immune-cell functions."],
    sections:[
      {label:"01 • Foundation",title:"Blood components",body:"Blood contains plasma and formed elements including erythrocytes, leukocytes and platelets. Each contributes to transport, defense or hemostasis.",highYield:"Know the function of each formed element."},
      {label:"02 • Erythrocytes",title:"Oxygen transport",body:"Erythrocytes are specialized for gas transport and contain hemoglobin, which binds oxygen reversibly.",highYield:"Hemoglobin is the major oxygen-carrying protein in blood."},
      {label:"03 • Leukocytes",title:"Cellular defense",body:"Leukocytes participate in innate and adaptive immune responses. Different leukocyte types have distinct roles in inflammation, phagocytosis and immune recognition.",highYield:"White-cell function depends on cell type."},
      {label:"04 • Quick check",title:"Review targets",body:"Compare erythrocytes, platelets and major leukocyte categories by structure and function.",highYield:"Function follows specialization."}
    ],
    reference:"Guyton and Hall Textbook of Medical Physiology; Junqueira's Basic Histology",questionCount:10
  },
  {
    id:"nervous-system-basics",sequence:8,title:"Nervous System Basics",topic:"Neuroanatomy",
    objectives:["Differentiate CNS and PNS.","Identify major neuron structures.","Explain basic synaptic communication."],
    sections:[
      {label:"01 • Organization",title:"CNS and PNS",body:"The central nervous system includes the brain and spinal cord. The peripheral nervous system includes neural structures outside the CNS.",highYield:"Brain plus spinal cord equals CNS."},
      {label:"02 • Neuron structure",title:"Receiving and sending signals",body:"Dendrites commonly receive synaptic input, while axons conduct signals away from the neuronal cell body.",highYield:"Dendrites receive; axons conduct away."},
      {label:"03 • Communication",title:"Synapses",body:"Neurons communicate at synapses using chemical or electrical mechanisms. Chemical synapses commonly use neurotransmitters released from presynaptic terminals.",highYield:"Direction of information flow is important."},
      {label:"04 • Quick check",title:"Review targets",body:"Be able to identify the CNS, PNS, dendrites, axons and basic synaptic organization.",highYield:"Use anatomy together with function."}
    ],
    reference:"Gray's Anatomy",questionCount:10
  },
  {
    id:"genetics-foundations",sequence:9,title:"Genetics Foundations",topic:"Genetics",
    objectives:["Define genes, alleles and chromosomes.","Explain basic inheritance terminology.","Relate DNA to hereditary information."],
    sections:[
      {label:"01 • Foundation",title:"Genes and chromosomes",body:"Genes are functional units of hereditary information encoded in DNA. Chromosomes package DNA with associated proteins.",highYield:"DNA carries hereditary information; chromosomes organize it."},
      {label:"02 • Alleles",title:"Variation",body:"Alleles are alternative forms of a gene. Differences between alleles can contribute to variation in biological traits.",highYield:"An allele is a version of a gene."},
      {label:"03 • Inheritance",title:"Basic terminology",body:"Genotype describes genetic constitution while phenotype describes observable characteristics arising from genetic and environmental influences.",highYield:"Genotype is genetic; phenotype is observable."},
      {label:"04 • Quick check",title:"Review targets",body:"Review gene, allele, chromosome, genotype and phenotype and how they relate to one another.",highYield:"Keep the hierarchy clear."}
    ],
    reference:"Molecular Biology of the Cell",questionCount:10
  },
  {
    id:"homeostasis-feedback",sequence:10,title:"Homeostasis & Feedback",topic:"Physiology",
    objectives:["Define homeostasis.","Distinguish negative and positive feedback.","Apply feedback concepts to physiological examples."],
    sections:[
      {label:"01 • Foundation",title:"Maintaining internal stability",body:"Homeostasis refers to regulation of the internal environment within ranges compatible with normal cellular and organ function.",highYield:"Homeostasis means controlled stability, not a perfectly fixed value."},
      {label:"02 • Negative feedback",title:"The common control pattern",body:"Negative feedback counteracts a change and tends to return a regulated variable toward its target range.",highYield:"Most physiological control systems use negative feedback."},
      {label:"03 • Positive feedback",title:"Amplifying a process",body:"Positive feedback reinforces a change and can drive a process toward completion. It is useful in selected physiological events.",highYield:"Positive feedback amplifies rather than corrects the initial change."},
      {label:"04 • Quick check",title:"Review targets",body:"For any feedback example, identify the regulated variable, sensor, control pathway and response.",highYield:"Identify what changed and whether the response opposes or reinforces it."}
    ],
    reference:"Guyton and Hall Textbook of Medical Physiology",questionCount:10
  }
];

export const lessons: Lesson[] = lessonDefinitions.map(lesson => ({\n  ...lesson,\n  questionCount: getQuestionCountForLesson(lesson.id),\n}));\n\nexport const LESSON_IDS = lessons.map(lesson => lesson.id);
export const ACTIVE_LESSONS = lessons.filter(lesson => lesson.questionCount >= 10);
