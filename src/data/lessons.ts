import { getQuestionCountForLesson, getQuestionsForLesson } from "./questionBank";

export type LessonSection = {
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
  bankFocus: string[];
};

const lessonDefinitions: Omit<Lesson, "questionCount">[] = [
  {
    id: "cellular-energy",
    sequence: 1,
    title: "Cellular Energy & ATP",
    topic: "Cell Biology",
    bankFocus: ["ATP and cellular work","Glycolysis","Citric acid cycle","Electron transport chain","Oxidative phosphorylation","Oxygen as final electron acceptor"],
    objectives: ["Explain ATP as the cell's immediate energy currency.", "Locate the major stages of aerobic respiration.", "Explain the role of oxygen in oxidative phosphorylation."],
    sections: [
      {label:"01 • Core concept",title:"Why cells need ATP",body:"Cells constantly perform work such as transport, synthesis, signalling and muscle contraction. ATP provides immediately usable chemical energy for many of these processes.",highYield:"ATP links metabolism to cellular work."},
      {label:"02 • Production",title:"Where ATP comes from",body:"Glycolysis occurs in the cytosol. The citric acid cycle and oxidative phosphorylation occur in mitochondria, with oxidative phosphorylation producing most ATP during aerobic respiration.",highYield:"The inner mitochondrial membrane houses the electron transport chain and ATP synthase."},
      {label:"03 • High-yield",title:"Oxygen and ATP",body:"Oxygen serves as the final electron acceptor in the mitochondrial electron transport chain, allowing oxidative phosphorylation to continue.",highYield:"Without adequate oxygen, aerobic ATP production falls."},
      {label:"04 • Quick check",title:"Before the RAT",body:"Be able to explain ATP's role, the location of glycolysis, the role of mitochondria and why oxygen supports aerobic ATP production.",highYield:"Know the locations and sequence of the major stages."},
      {label:"05 • Mechanism",title:"From glucose to usable energy",body:"During glycolysis, glucose is converted into pyruvate and a small amount of ATP is produced. When oxygen is available, pyruvate-derived carbon enters mitochondrial pathways that generate reduced electron carriers. These carriers deliver high-energy electrons to the electron transport chain, where their energy helps establish a proton gradient. ATP synthase uses that gradient to form ATP from ADP and phosphate.",highYield:"Remember the flow: glucose → glycolysis → mitochondrial oxidation → electron transport → proton gradient → ATP synthesis."},
      {label:"06 • Integration",title:"ATP is continuously recycled",body:"ATP is not stored in large quantities as a long-term fuel reserve. Cells continually regenerate ATP as it is consumed. This is why disruptions in oxygen delivery, mitochondrial function or substrate availability can quickly affect tissues with high energy demands. Muscle, nervous tissue and actively transporting cells are particularly dependent on a reliable ATP supply.",highYield:"ATP production and ATP use are continuous processes."},
    ],
    reference:"Guyton and Hall Textbook of Medical Physiology", 
  },
  {
    id:"human-tissues",
    sequence:2,
    title:"Tissues & Cellular Organization",
    topic:"Histology",
    objectives:["Identify the major tissue types.", "Connect epithelial structure to function.", "Recognize organelles associated with protein secretion."],
    bankFocus:["Epithelial structure","Cell junctions","Rough ER and Golgi","Connective-tissue matrix","Muscle specialization"],
    sections:[
      {label:"01 • Core concept",title:"Epithelial tissue",body:"Epithelial tissue covers surfaces, lines cavities and forms many glands. Its cells are closely packed and organized into sheets.",highYield:"Think covering, lining and secretion."},
      {label:"02 • Histology",title:"Simple squamous epithelium",body:"Simple squamous epithelium is thin and suited to diffusion and filtration, making it useful where rapid exchange is important.",highYield:"Thin structure supports efficient diffusion."},
      {label:"03 • High-yield",title:"Protein-secreting cells",body:"Cells specialized for protein secretion commonly contain abundant rough endoplasmic reticulum because ribosomes synthesize proteins destined for secretion or membranes.",highYield:"Rough ER is a major clue for protein synthesis and secretion."},
      {label:"05 • Bank-linked mastery",title:"Use the question bank to study",body:"Use the bank to connect microscopic structure with function, especially epithelial packing, junctions, matrix and secretion. Answer the questions only after you can explain the mechanism in your own words.",highYield:"The lesson explains the concept; the bank tests whether you can use it."},
      {label:"04 • Quick check",title:"Before the RAT",body:"Review epithelial functions, simple squamous epithelium and the role of rough ER.",highYield:"Be able to connect structure with function."}
    ],
    reference:"Junqueira's Basic Histology", 
  },
  {
    id:"human-regulation",
    sequence:3,
    title:"Human Regulation & Communication",
    topic:"Physiology & Neuroanatomy",
    objectives:["Explain basic blood-glucose regulation.", "Trace the main role of the left ventricle.", "Identify core central nervous system structures."],
    bankFocus:["Insulin and glucagon","Cardiac output","Oxygen transport","Autonomic control","Renal filtration","Vascular resistance"],
    sections:[
      {label:"01 • Core concept",title:"Blood glucose control",body:"The pancreas contains endocrine cells that help regulate blood glucose. Insulin generally lowers blood glucose while glucagon generally raises it.",highYield:"Insulin and glucagon act in opposite directions on blood glucose."},
      {label:"02 • Physiology",title:"Circulation",body:"The left ventricle pumps oxygenated blood into systemic circulation. Erythrocytes transport oxygen using hemoglobin.",highYield:"Trace blood flow and connect it to oxygen delivery."},
      {label:"03 • Neuroanatomy",title:"Nervous system organization",body:"The central nervous system consists of the brain and spinal cord. Dendrites typically receive incoming signals, while the corpus callosum connects the cerebral hemispheres.",highYield:"Know the major structures and their functions."},
      {label:"05 • Bank-linked mastery",title:"Use the question bank to study",body:"The bank links endocrine, cardiovascular, renal and neural mechanisms so students practise cause-and-effect across systems. Answer the questions only after you can explain the mechanism in your own words.",highYield:"The lesson explains the concept; the bank tests whether you can use it."},
      {label:"04 • Quick check",title:"Before the RAT",body:"Review insulin, glucagon, oxygen transport, CNS organization and basic neuronal structure.",highYield:"Use structure-function relationships to answer the RAT."}
    ],
    reference:"Guyton and Hall Textbook of Medical Physiology; Gray's Anatomy", 
  },
  {
    id:"cell-membrane-transport",sequence:4,title:"Cell Membrane & Transport",topic:"Cell Biology",
    objectives:["Distinguish passive and active transport.","Explain diffusion and osmosis.","Relate membrane structure to selective permeability."],
    bankFocus:["Selective permeability","Facilitated diffusion","Osmosis and tonicity","Na+/K+-ATPase","Secondary active transport"],
    sections:[
      {label:"01 • Foundation",title:"The plasma membrane",body:"The plasma membrane is a selectively permeable barrier composed mainly of lipids and proteins. Its structure allows cells to maintain an internal environment distinct from the surroundings.",highYield:"Selective permeability is central to cellular homeostasis."},
      {label:"02 • Transport",title:"Passive movement",body:"Diffusion moves particles down their concentration gradient without direct cellular energy expenditure. Osmosis is the movement of water across a selectively permeable membrane.",highYield:"Down a gradient does not require ATP directly."},
      {label:"03 • High-yield",title:"Active transport",body:"Active transport moves substances against an electrochemical gradient and requires energy. Transport proteins can use ATP directly or use stored ion gradients.",highYield:"Against the gradient means an energy source is required."},
      {label:"05 • Bank-linked mastery",title:"Use the question bank to study",body:"The bank emphasizes direction of movement, membrane proteins, tonicity and the source of transport energy. Answer the questions only after you can explain the mechanism in your own words.",highYield:"The lesson explains the concept; the bank tests whether you can use it."},
      {label:"04 • Quick check",title:"Review targets",body:"Compare diffusion, osmosis, facilitated diffusion and active transport using direction of movement, membrane proteins and energy requirements.",highYield:"Always identify the gradient and energy source first."}
    ],
    reference:"Molecular Biology of the Cell"
  },
  {
    id:"cell-cycle-mitosis",sequence:5,title:"Cell Cycle & Mitosis",topic:"Cell Biology & Genetics",
    objectives:["Describe the major cell-cycle phases.","Explain chromosome behavior during mitosis.","Distinguish mitosis from meiosis."],
    bankFocus:["G1/S/G2/M","DNA replication","Mitosis","Spindle checkpoint","Meiosis I and II","Crossing over"],
    sections:[
      {label:"01 • Foundation",title:"The cell cycle",body:"The cell cycle includes growth and preparation phases followed by nuclear division. DNA is replicated before mitosis so daughter cells can receive genetic material.",highYield:"DNA replication precedes chromosome separation."},
      {label:"02 • Mitosis",title:"Chromosome separation",body:"Mitosis organizes duplicated chromosomes so that sister chromatids can be separated into daughter nuclei.",highYield:"Mitosis preserves chromosome number in typical somatic cell division."},
      {label:"03 • Comparison",title:"Mitosis versus meiosis",body:"Mitosis generally produces genetically similar daughter cells, whereas meiosis involves two divisions and produces haploid cells with genetic variation.",highYield:"Meiosis reduces chromosome number; mitosis generally maintains it."},
      {label:"05 • Bank-linked mastery",title:"Use the question bank to study",body:"The bank tests phase recognition, chromosome behavior, spindle checkpoints and the distinction between homologues and sister chromatids. Answer the questions only after you can explain the mechanism in your own words.",highYield:"The lesson explains the concept; the bank tests whether you can use it."},
      {label:"04 • Quick check",title:"Review targets",body:"Know G1, S, G2 and M phases and identify what happens to chromosomes during the major stages of mitosis.",highYield:"Sequence matters."}
    ],
    reference:"Molecular Biology of the Cell"
  },
  {
    id:"histology-basics",sequence:6,title:"Histology Basics",topic:"Histology",
    objectives:["Recognize the four major tissue classes.","Connect microscopic structure to function.","Use histological clues to identify tissue."],
    bankFocus:["Four tissue classes","Epithelial layers","Cell shape","Extracellular matrix","Adipose tissue","Skeletal muscle"],
    sections:[
      {label:"01 • Foundation",title:"Four major tissues",body:"The four broad tissue classes are epithelial, connective, muscle and nervous tissue. Each has characteristic structural and functional features.",highYield:"Structure is the key to tissue identification."},
      {label:"02 • Epithelium",title:"Layers and shapes",body:"Epithelia can be described by the number of cell layers and the shape of cells at the surface. These features help predict function.",highYield:"Simple means one layer; stratified means multiple layers."},
      {label:"03 • Connective tissue",title:"Cells and matrix",body:"Connective tissues generally contain cells distributed within an extracellular matrix. The matrix contributes substantially to mechanical and biological properties.",highYield:"Connective tissue is defined strongly by its extracellular matrix."},
      {label:"05 • Bank-linked mastery",title:"Use the question bank to study",body:"The bank uses structural clues to make tissue identification an inference task rather than a vocabulary test. Answer the questions only after you can explain the mechanism in your own words.",highYield:"The lesson explains the concept; the bank tests whether you can use it."},
      {label:"04 • Quick check",title:"Review targets",body:"Practice identifying tissue by cell arrangement, extracellular material, vascularity and specialized function.",highYield:"Look for the dominant structural clue first."}
    ],
    reference:"Junqueira's Basic Histology"
  },
  {
    id:"blood-immune-cells",sequence:7,title:"Blood & Immune Cells",topic:"Physiology & Histology",
    objectives:["Identify major blood-cell classes.","Explain the role of hemoglobin.","Distinguish major immune-cell functions."],
    bankFocus:["Erythrocytes","Hemoglobin","Hematocrit","Platelets","Neutrophils","Monocytes and macrophages"],
    sections:[
      {label:"01 • Foundation",title:"Blood components",body:"Blood contains plasma and formed elements including erythrocytes, leukocytes and platelets. Each contributes to transport, defense or hemostasis.",highYield:"Know the function of each formed element."},
      {label:"02 • Erythrocytes",title:"Oxygen transport",body:"Erythrocytes are specialized for gas transport and contain hemoglobin, which binds oxygen reversibly.",highYield:"Hemoglobin is the major oxygen-carrying protein in blood."},
      {label:"03 • Leukocytes",title:"Cellular defense",body:"Leukocytes participate in innate and adaptive immune responses. Different leukocyte types have distinct roles in inflammation, phagocytosis and immune recognition.",highYield:"White-cell function depends on cell type."},
      {label:"05 • Bank-linked mastery",title:"Use the question bank to study",body:"The bank connects blood-cell morphology with oxygen transport, hemostasis and innate immune function. Answer the questions only after you can explain the mechanism in your own words.",highYield:"The lesson explains the concept; the bank tests whether you can use it."},
      {label:"04 • Quick check",title:"Review targets",body:"Compare erythrocytes, platelets and major leukocyte categories by structure and function.",highYield:"Function follows specialization."}
    ],
    reference:"Guyton and Hall Textbook of Medical Physiology; Junqueira's Basic Histology"
  },
  {
    id:"nervous-system-basics",sequence:8,title:"Nervous System Basics",topic:"Neuroanatomy",
    objectives:["Differentiate CNS and PNS.","Identify major neuron structures.","Explain basic synaptic communication."],
    bankFocus:["CNS and PNS","Dendrites and axons","Chemical synapses","Schwann cells","Myelin","Corpus callosum"],
    sections:[
      {label:"01 • Organization",title:"CNS and PNS",body:"The central nervous system includes the brain and spinal cord. The peripheral nervous system includes neural structures outside the CNS.",highYield:"Brain plus spinal cord equals CNS."},
      {label:"02 • Neuron structure",title:"Receiving and sending signals",body:"Dendrites commonly receive synaptic input, while axons conduct signals away from the neuronal cell body.",highYield:"Dendrites receive; axons conduct away."},
      {label:"03 • Communication",title:"Synapses",body:"Neurons communicate at synapses using chemical or electrical mechanisms. Chemical synapses commonly use neurotransmitters released from presynaptic terminals.",highYield:"Direction of information flow is important."},
      {label:"05 • Bank-linked mastery",title:"Use the question bank to study",body:"The bank tests location, sequence and function through synapses, myelin, Schwann cells and brain connections. Answer the questions only after you can explain the mechanism in your own words.",highYield:"The lesson explains the concept; the bank tests whether you can use it."},
      {label:"04 • Quick check",title:"Review targets",body:"Be able to identify the CNS, PNS, dendrites, axons and basic synaptic organization.",highYield:"Use anatomy together with function."}
    ],
    reference:"Gray's Anatomy"
  },
  {
    id:"genetics-foundations",sequence:9,title:"Genetics Foundations",topic:"Genetics",
    objectives:["Define genes, alleles and chromosomes.","Explain basic inheritance terminology.","Relate DNA to hereditary information."],
    bankFocus:["Genes and alleles","Mendelian inheritance","DNA replication","Transcription","Translation","Mutations","Epigenetic regulation"],
    sections:[
      {label:"01 • Foundation",title:"Genes and chromosomes",body:"Genes are functional units of hereditary information encoded in DNA. Chromosomes package DNA with associated proteins.",highYield:"DNA carries hereditary information; chromosomes organize it."},
      {label:"02 • Alleles",title:"Variation",body:"Alleles are alternative forms of a gene. Differences between alleles can contribute to variation in biological traits.",highYield:"An allele is a version of a gene."},
      {label:"03 • Inheritance",title:"Basic terminology",body:"Genotype describes genetic constitution while phenotype describes observable characteristics arising from genetic and environmental influences.",highYield:"Genotype is genetic; phenotype is observable."},
      {label:"05 • Bank-linked mastery",title:"Use the question bank to study",body:"The bank progresses from terminology to inheritance, information flow, mutation consequences and gene regulation. Answer the questions only after you can explain the mechanism in your own words.",highYield:"The lesson explains the concept; the bank tests whether you can use it."},
      {label:"04 • Quick check",title:"Review targets",body:"Review gene, allele, chromosome, genotype and phenotype and how they relate to one another.",highYield:"Keep the hierarchy clear."}
    ],
    reference:"Molecular Biology of the Cell"
  },
  {
    id:"homeostasis-feedback",sequence:10,title:"Homeostasis & Feedback",topic:"Physiology",
    objectives:["Define homeostasis.","Distinguish negative and positive feedback.","Apply feedback concepts to physiological examples."],
    bankFocus:["Regulated variables","Negative feedback","Positive feedback","Control loops","Feedforward control","Thermoregulation"],
    sections:[
      {label:"01 • Foundation",title:"Maintaining internal stability",body:"Homeostasis refers to regulation of the internal environment within ranges compatible with normal cellular and organ function.",highYield:"Homeostasis means controlled stability, not a perfectly fixed value."},
      {label:"02 • Negative feedback",title:"The common control pattern",body:"Negative feedback counteracts a change and tends to return a regulated variable toward its target range.",highYield:"Most physiological control systems use negative feedback."},
      {label:"03 • Positive feedback",title:"Amplifying a process",body:"Positive feedback reinforces a change and can drive a process toward completion. It is useful in selected physiological events.",highYield:"Positive feedback amplifies rather than corrects the initial change."},
      {label:"05 • Bank-linked mastery",title:"Use the question bank to study",body:"The bank uses physiological scenarios to distinguish opposition, amplification and anticipation. Answer the questions only after you can explain the mechanism in your own words.",highYield:"The lesson explains the concept; the bank tests whether you can use it."},
      {label:"04 • Quick check",title:"Review targets",body:"For any feedback example, identify the regulated variable, sensor, control pathway and response.",highYield:"Identify what changed and whether the response opposes or reinforces it."}
    ],
    reference:"Guyton and Hall Textbook of Medical Physiology"
  }  {"id":"biology-foundations","sequence":11,"title":"Biology Foundations & Scientific Thinking","topic":"Biology Foundations","objectives":["Describe levels of biological organization.","Distinguish observation, hypothesis, experiment and conclusion.","Interpret variables, controls and evidence."],"bankFocus":["Levels of organization","Experimental design","Controls and variables","Correlation versus causation","Scientific models"],"sections":[{"label":"01 • Foundations","title":"What biology studies","body":"Biology examines life across molecular, cellular, organismal, population and ecosystem levels.","highYield":"Choose the biological scale that matches the question."},{"label":"02 • Scientific method","title":"From observation to test","body":"Scientific investigation uses observations and questions to develop testable hypotheses and predictions.","highYield":"A useful hypothesis makes testable predictions."},{"label":"03 • Variables","title":"What changes and what is measured","body":"An independent variable is the explanatory factor and a dependent variable is the measured outcome. Controls provide meaningful comparisons.","highYield":"Identify what is changed and what is measured."},{"label":"04 • Evidence","title":"Correlation is not automatically causation","body":"Two variables can be associated without one directly causing the other. Strong causal claims require appropriate evidence.","highYield":"Association alone is not proof of mechanism."},{"label":"05 • Bank-linked mastery","title":"Scientific reasoning","body":"The new question bank tests controls, variables, models, replication and evidence rather than vocabulary alone.","highYield":"Explain why evidence supports or challenges a claim."}],"reference":"OpenStax Biology 2e"},
  {"id":"chemistry-of-life","sequence":12,"title":"Chemistry of Life & Biomolecules","topic":"Biochemistry","objectives":["Explain water polarity and biological chemistry.","Describe major biological macromolecules.","Explain enzyme action.","Relate molecular structure to function."],"bankFocus":["Water and polarity","Carbon chemistry","Proteins","Phospholipids","Enzymes","Activation energy"],"sections":[{"label":"01 • Water","title":"The solvent of life","body":"Water's polarity and hydrogen bonding give it important solvent, thermal and cohesion properties.","highYield":"Water's polarity explains many of its biological roles."},{"label":"02 • Carbon","title":"A versatile framework","body":"Carbon forms stable covalent bonds and can build chains, branches and rings that support diverse biological molecules.","highYield":"Carbon bonding enables molecular diversity."},{"label":"03 • Biomolecules","title":"Four major classes","body":"Carbohydrates, lipids, proteins and nucleic acids have different structures and functions.","highYield":"Structure determines many molecular properties."},{"label":"04 • Enzymes","title":"Biological catalysts","body":"Enzymes lower activation energy and speed reactions without being consumed as reactants.","highYield":"Enzymes affect reaction rate, not the overall thermodynamic laws."},{"label":"05 • Bank-linked mastery","title":"Molecular reasoning","body":"The bank tests polarity, enzymes, inhibition, protein structure, phospholipid behavior and activation energy.","highYield":"Connect molecular structure to biological function."}],"reference":"OpenStax Biology 2e"},
  {"id":"photosynthesis-plants","sequence":13,"title":"Photosynthesis & Plant Structure","topic":"Plant Biology","objectives":["Trace the major stages of photosynthesis.","Explain light capture and carbon fixation.","Describe stomata and vascular transport."],"bankFocus":["Light reactions","Chlorophyll","Calvin cycle","Carbon fixation","Stomata","Xylem","Roots"],"sections":[{"label":"01 • Energy capture","title":"Light-dependent reactions","body":"Photosynthetic pigments absorb light and drive electron transport in thylakoid membranes, producing ATP and reducing power.","highYield":"Light reactions occur in thylakoid membranes."},{"label":"02 • Carbon fixation","title":"Building organic molecules","body":"The Calvin cycle uses ATP and reducing power to incorporate carbon dioxide into organic molecules.","highYield":"CO2 enters through carbon fixation."},{"label":"03 • Gas exchange","title":"Stomata balance CO2 and water","body":"Stomata regulate gas exchange while influencing water loss through transpiration.","highYield":"Stomata balance carbon gain with water conservation."},{"label":"04 • Transport","title":"Roots and xylem","body":"Roots absorb water and minerals, while xylem transports water and dissolved minerals toward aerial tissues.","highYield":"Xylem is central to upward water transport."},{"label":"05 • Bank-linked mastery","title":"Plant reasoning","body":"The bank tests chloroplast proton gradients, CO2 limitation, stomatal closure and xylem transport.","highYield":"Explain how one plant process affects another."}],"reference":"OpenStax Biology 2e"},
  {"id":"microbiology-viruses","sequence":14,"title":"Microbiology, Bacteria & Viruses","topic":"Microbiology","objectives":["Distinguish cells from viruses.","Describe bacterial organization and reproduction.","Explain viral dependence on hosts.","Understand selection for antimicrobial resistance."],"bankFocus":["Bacterial cells","Viral replication","Bacteriophages","Binary fission","Horizontal gene transfer","Antibiotic resistance"],"sections":[{"label":"01 • Microbial life","title":"Bacteria are cells","body":"Bacteria are cellular organisms with membranes, cytoplasm, ribosomes and genetic material, although they lack a membrane-bound nucleus.","highYield":"Bacteria are prokaryotic cells."},{"label":"02 • Viruses","title":"Acellular infectious agents","body":"Viruses contain genetic material and depend on host cells for replication.","highYield":"Viruses use host-cell machinery."},{"label":"03 • Bacterial growth","title":"Binary fission","body":"Many bacteria reproduce by binary fission, producing daughter cells after genome replication and division.","highYield":"Binary fission is asexual reproduction."},{"label":"04 • Resistance","title":"Evolution under antibiotic pressure","body":"Antibiotics can remove susceptible bacteria while resistant variants survive and reproduce. Resistance can also spread through horizontal gene transfer.","highYield":"Resistance is a population-level evolutionary problem."},{"label":"05 • Bank-linked mastery","title":"Microbiology reasoning","body":"The bank tests viral entry, bacterial structure, bacteriophages, binary fission, gene transfer and antibiotic selection.","highYield":"Distinguish what belongs to the microbe, virus and host."}],"reference":"OpenStax Biology 2e"},
  {"id":"evolution-population-genetics","sequence":15,"title":"Evolution & Population Genetics","topic":"Evolution","objectives":["Explain evolution as population-level genetic change.","Distinguish selection, drift and gene flow.","Explain mutation as a source of variation.","Apply population-genetic reasoning."],"bankFocus":["Natural selection","Mutation","Genetic drift","Gene flow","Adaptation","Reproductive isolation","Hardy-Weinberg equilibrium"],"sections":[{"label":"01 • Population change","title":"What evolves?","body":"Evolutionary change is measured as changes in allele frequencies in populations across generations.","highYield":"Evolution is population-level genetic change."},{"label":"02 • Natural selection","title":"Differential reproductive success","body":"Heritable variation can cause some individuals to leave more surviving offspring under particular environmental conditions.","highYield":"Selection acts on phenotypes; heritable differences drive change."},{"label":"03 • Other forces","title":"Drift and gene flow","body":"Genetic drift changes allele frequencies through chance, especially in small populations. Gene flow moves alleles between populations.","highYield":"Not every evolutionary change is adaptive."},{"label":"04 • Speciation","title":"Divergence and isolation","body":"Accumulated genetic differences combined with reproductive isolation can contribute to formation of distinct species.","highYield":"Isolation limits gene flow and allows divergence."},{"label":"05 • Bank-linked mastery","title":"Population reasoning","body":"The bank tests mutation, selection, drift, gene flow, adaptation, reproductive isolation and Hardy-Weinberg.","highYield":"Identify the evolutionary force that best explains the frequency change."}],"reference":"OpenStax Biology 2e"},
  {"id":"ecology-ecosystems","sequence":16,"title":"Ecology, Ecosystems & Conservation","topic":"Ecology","objectives":["Differentiate populations, communities and ecosystems.","Trace energy and matter through ecosystems.","Explain species interactions and population limits.","Apply ecological reasoning to conservation."],"bankFocus":["Populations and ecosystems","Food webs","Energy transfer","Species interactions","Carrying capacity","Eutrophication","Habitat fragmentation","Biodiversity"],"sections":[{"label":"01 • Organization","title":"From populations to ecosystems","body":"Populations contain members of one species, communities contain interacting populations, and ecosystems include communities plus abiotic factors.","highYield":"Ecological scale determines what interactions are included."},{"label":"02 • Energy","title":"Food webs","body":"Energy enters many ecosystems through producers and moves through consumers. Much energy is dissipated as heat during metabolism.","highYield":"Energy flows; matter is recycled."},{"label":"03 • Interactions","title":"Species affect one another","body":"Competition, predation, mutualism and other interactions shape population dynamics and community structure.","highYield":"Identify who benefits, who is harmed and how."},{"label":"04 • Human impacts","title":"Fragmentation and nutrient pollution","body":"Habitat fragmentation can isolate populations, while excess nutrients can cause eutrophication and oxygen depletion.","highYield":"Ecological disturbances can create cascading effects."},{"label":"05 • Bank-linked mastery","title":"Ecological reasoning","body":"The bank tests trophic energy transfer, predator effects, carrying capacity, biodiversity, eutrophication and fragmentation.","highYield":"Trace the chain of ecological effects."}],"reference":"OpenStax Biology 2e"},

];

export const lessons: Lesson[] = lessonDefinitions.map(lesson => ({
  ...lesson,
  questionCount: getQuestionCountForLesson(lesson.id),
}));

export const LESSON_IDS = lessons.map(lesson => lesson.id);
export const ACTIVE_LESSONS = lessons.filter(lesson => lesson.questionCount >= 10);


export function getLessonBankSummary(lessonId: string) {
  const bank = getQuestionsForLesson(lessonId);
  return {
    total: bank.length,
    easy: bank.filter(question => question.difficulty === "Easy").length,
    medium: bank.filter(question => question.difficulty === "Medium").length,
    hard: bank.filter(question => question.difficulty === "Hard").length,
  };
}
