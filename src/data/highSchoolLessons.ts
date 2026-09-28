import type { CurriculumTrack } from "./curriculum";

export type SchoolForm = 1 | 2 | 3 | 4;

export type SchoolLessonDefinition = {
  id: string;
  sequence: number;
  form: SchoolForm;
  curriculum: CurriculumTrack;
  title: string;
  topic: string;
  objectives: string[];
  sections: { label: string; title: string; body: string; highYield: string }[];
  reference: string;
  bankFocus: string[];
  bankTopics: string[];
  bankKeywords: string[];
};

const lesson = (
  id: string, sequence: number, form: SchoolForm, title: string, topic: string,
  objectives: string[], sections: SchoolLessonDefinition["sections"],
  bankTopics: string[], bankKeywords: string[], bankFocus: string[],
): SchoolLessonDefinition => ({
  id, sequence, form, curriculum: "high-school", title, topic, objectives, sections,
  reference: "Kenyan secondary-school Biology study scope", bankTopics, bankKeywords, bankFocus
});

export const HIGH_SCHOOL_LESSONS: SchoolLessonDefinition[] = [
  lesson("hs-f1-introduction",1,1,"Introduction to Biology","Form 1 • Biology Foundations",
    ["Define Biology and describe its major branches.","Explain characteristics of living organisms.","Apply basic scientific skills in Biology."],
    [
      {label:"01 • Form 1",title:"What is Biology?",body:"Biology is the study of living organisms and the processes that sustain life. It includes the study of organisms at different levels, from cells to ecosystems.",highYield:"Biology studies life and the processes that make life possible."},
      {label:"02 • Characteristics",title:"What makes something living?",body:"Living organisms show characteristics such as nutrition, respiration, growth, excretion, movement, sensitivity and reproduction.",highYield:"Learn the characteristics as a connected set, not isolated words."},
      {label:"03 • Scientific skills",title:"Observation and investigation",body:"Biological investigations use careful observation, measurement, recording, comparison and evidence-based conclusions.",highYield:"Good Biology answers are supported by observable evidence."},
      {label:"04 • Quick check",title:"Before the RAT",body:"Revise the meaning of Biology, characteristics of living organisms and the basic stages of a biological investigation.",highYield:"Know the difference between an observation, an inference and a conclusion."}
    ],["Biology Foundations","Scientific Method"],["biology","living organisms","characteristics","scientific method","observation"],["Living organisms","Scientific method","Biological investigation"]),

  lesson("hs-f1-cell",2,1,"The Cell","Form 1 • Cell Biology",
    ["Describe the basic structure of a cell.","Relate cell organelles to their functions.","Distinguish plant and animal cells."],
    [
      {label:"01 • Form 1",title:"The cell as a basic unit",body:"The cell is the basic structural and functional unit of living organisms. Cells may be specialized for particular functions.",highYield:"Cell structure is closely related to cell function."},
      {label:"02 • Organelles",title:"Cell structures",body:"The nucleus contains genetic material; mitochondria release energy during respiration; ribosomes are involved in protein synthesis; and the cell membrane regulates movement of substances.",highYield:"Do not memorize organelles without linking each one to its function."},
      {label:"03 • Plant cells",title:"Structures found in plant cells",body:"Plant cells have structures such as a cellulose cell wall, chloroplasts and a large permanent vacuole in addition to the common cell structures.",highYield:"Cell wall, chloroplast and large vacuole are key plant-cell clues."},
      {label:"04 • Quick check",title:"Plant versus animal cells",body:"Compare the structures of typical plant and animal cells and explain why their differences matter.",highYield:"Structure → function is the rule to use in the RAT."}
    ],["Cell Biology"],["cell","cell structure","organelle","plant cell","animal cell","microscope"],["Cell structure","Organelles","Plant and animal cells"]),

  lesson("hs-f1-classification",3,1,"Classification of Living Organisms","Form 1 • Classification",
    ["Explain why organisms are classified.","Use observable characteristics to group organisms.","Recognize major groups of organisms."],
    [
      {label:"01 • Form 1",title:"Why classify?",body:"Classification organizes organisms into groups based on shared characteristics, making identification and study easier.",highYield:"Classification is based on similarities and differences."},
      {label:"02 • Grouping",title:"Features used in classification",body:"Biologists use features such as cell type, nutrition, body organization and reproductive characteristics to distinguish groups.",highYield:"Use the stated characteristic before choosing a group."},
      {label:"03 • Identification",title:"Using keys",body:"Simple identification keys guide the user through paired choices based on observable features.",highYield:"Follow each key step using only the feature being tested."},
      {label:"04 • Quick check",title:"Classification practice",body:"Revise major biological groups and the characteristics used to distinguish them.",highYield:"Classification questions reward careful comparison."}
    ],["Classification","Taxonomy"],["classification","taxonomic","organism","kingdom","identification key"],["Major groups","Classification","Identification keys"]),

  lesson("hs-f1-nutrition",4,1,"Nutrition in Plants and Animals","Form 1 • Nutrition",
    ["Explain photosynthetic nutrition.","Describe the role of mineral nutrients.","Distinguish autotrophic and heterotrophic nutrition."],
    [
      {label:"01 • Form 1",title:"Nutrition",body:"Nutrition is the process by which organisms obtain and use nutrients for energy, growth, repair and maintenance.",highYield:"Nutrition supplies materials and energy needed for life."},
      {label:"02 • Plants",title:"Photosynthetic nutrition",body:"Green plants manufacture organic food using light energy, carbon dioxide and water in the presence of chlorophyll.",highYield:"Light, carbon dioxide, water and chlorophyll are central to photosynthesis."},
      {label:"03 • Animals",title:"Heterotrophic nutrition",body:"Animals obtain organic nutrients by feeding on other organisms or their products.",highYield:"Animals depend on externally obtained organic food."},
      {label:"04 • Quick check",title:"Nutrition concepts",body:"Revise photosynthesis, food tests and the distinction between autotrophic and heterotrophic nutrition.",highYield:"Always identify the source of carbon and energy."}
    ],["Plant Biology","Nutrition","Biochemistry"],["nutrition","photosynthesis","food test","carbohydrate","protein","lipid","mineral"],["Photosynthesis","Food tests","Mineral nutrition"]),

  lesson("hs-f2-gaseous-exchange",5,2,"Gaseous Exchange","Form 2 • Gaseous Exchange",
    ["Explain why organisms need gaseous exchange.","Describe gaseous exchange surfaces.","Relate surface structure to efficient diffusion."],
    [
      {label:"01 • Form 2",title:"Why exchange gases?",body:"Cells need oxygen for aerobic respiration and produce carbon dioxide as a waste product. Efficient exchange allows gases to move between organisms and their environment.",highYield:"Gas exchange supports respiration and removal of carbon dioxide."},
      {label:"02 • Exchange surfaces",title:"Features of efficient surfaces",body:"Efficient exchange surfaces are generally thin, have a large surface area and maintain suitable concentration gradients.",highYield:"Large surface area plus short diffusion distance improves exchange."},
      {label:"03 • Plants and animals",title:"Different exchange structures",body:"Plants exchange gases mainly through stomata, while mammals use specialized respiratory surfaces in the lungs.",highYield:"Structure differs, but diffusion remains fundamental."},
      {label:"04 • Quick check",title:"Diffusion and exchange",body:"Explain how concentration gradients and exchange-surface adaptations affect gas movement.",highYield:"Identify the gradient and the adaptations that maintain it."}
    ],["Respiratory Biology","Plant Biology","Cell Biology"],["gaseous exchange","gas exchange","stomata","lungs","diffusion","respiration"],["Diffusion","Exchange surfaces","Stomata"]),

  lesson("hs-f2-respiration",6,2,"Respiration","Form 2 • Respiration",
    ["Define respiration.","Distinguish aerobic and anaerobic respiration.","Explain the importance of ATP release."],
    [
      {label:"01 • Form 2",title:"Respiration releases energy",body:"Respiration is a series of chemical reactions in cells that releases usable energy from food substances.",highYield:"Respiration is a cellular process, not simply breathing."},
      {label:"02 • Aerobic",title:"Using oxygen",body:"Aerobic respiration uses oxygen and releases substantial energy from glucose.",highYield:"Aerobic respiration is associated with efficient energy release."},
      {label:"03 • Anaerobic",title:"When oxygen is limited",body:"Anaerobic pathways release less energy and produce different end products depending on the organism.",highYield:"Anaerobic respiration is less energy-efficient than aerobic respiration."},
      {label:"04 • Quick check",title:"Respiration versus breathing",body:"Be able to distinguish breathing, gaseous exchange and cellular respiration.",highYield:"The terms describe related but different processes."}
    ],["Cell Biology","Respiration"],["respiration","aerobic","anaerobic","energy release","ATP","glucose"],["Aerobic respiration","Anaerobic respiration","Energy release"]),

  lesson("hs-f2-transport-plants",7,2,"Transport in Plants","Form 2 • Transport",
    ["Explain movement of water and mineral salts in plants.","Describe the roles of xylem and phloem.","Explain transpiration and its importance."],
    [
      {label:"01 • Form 2",title:"Why plants need transport",body:"Water, mineral salts and manufactured food must move between different parts of a plant.",highYield:"Transport connects roots, leaves and growing tissues."},
      {label:"02 • Xylem",title:"Water and mineral transport",body:"Xylem conducts water and mineral salts mainly from roots toward aerial parts of the plant.",highYield:"Xylem is strongly associated with water and mineral transport."},
      {label:"03 • Phloem",title:"Translocation",body:"Phloem transports organic substances such as sugars from sources to regions where they are used or stored.",highYield:"Phloem transport is associated with translocation of manufactured food."},
      {label:"04 • Quick check",title:"Transpiration",body:"Explain how water loss from leaves contributes to movement of water through the plant.",highYield:"Connect evaporation at the leaf to the movement of water through xylem."}
    ],["Plant Biology","Transport"],["transport in plants","xylem","phloem","transpiration","translocation","water movement"],["Xylem","Phloem","Transpiration"]),

  lesson("hs-f2-transport-animals",8,2,"Transport in Animals","Form 2 • Transport",
    ["Describe the components of blood.","Explain the functions of the heart and blood vessels.","Relate blood composition to transport."],
    [
      {label:"01 • Form 2",title:"The transport system",body:"Large animals need transport systems to move oxygen, nutrients, hormones and waste products around the body.",highYield:"Transport systems solve the problem of long diffusion distances."},
      {label:"02 • Blood",title:"Blood components",body:"Blood contains plasma, red blood cells, white blood cells and platelets, each with specialized functions.",highYield:"Match each blood component to its function."},
      {label:"03 • Heart and vessels",title:"Moving blood",body:"The heart pumps blood through arteries, capillaries and veins. Their structures are adapted to their different roles.",highYield:"Arteries carry blood away from the heart; veins return it."},
      {label:"04 • Quick check",title:"Circulation",body:"Trace the path of blood through the heart and compare arteries, capillaries and veins.",highYield:"Follow the flow rather than memorizing isolated vessel names."}
    ],["Physiology","Blood & Immune Cells","Transport"],["blood","heart","artery","vein","capillary","circulation","haemoglobin"],["Blood","Heart","Blood vessels"]),

  lesson("hs-f3-reproduction",9,3,"Reproduction in Plants and Animals","Form 3 • Reproduction",
    ["Distinguish asexual and sexual reproduction.","Describe basic reproductive structures.","Explain fertilization and variation."],
    [
      {label:"01 • Form 3",title:"Why organisms reproduce",body:"Reproduction produces new individuals and ensures continuity of species.",highYield:"Reproduction is essential for continuation of a species."},
      {label:"02 • Asexual reproduction",title:"One parent",body:"Asexual reproduction involves one parent and generally produces offspring genetically similar to the parent.",highYield:"Asexual reproduction does not require fusion of gametes."},
      {label:"03 • Sexual reproduction",title:"Fusion of gametes",body:"Sexual reproduction involves formation and fusion of gametes and introduces genetic variation.",highYield:"Fusion of gametes is central to sexual reproduction."},
      {label:"04 • Quick check",title:"Reproductive processes",body:"Compare asexual and sexual reproduction and identify the role of gametes and fertilization.",highYield:"Know where variation enters the process."}
    ],["Reproduction","Genetics"],["reproduction","sexual reproduction","asexual reproduction","gamete","fertilization","pollination"],["Asexual reproduction","Sexual reproduction","Fertilization"]),

  lesson("hs-f3-growth",10,3,"Growth and Development","Form 3 • Growth",
    ["Define growth in biological terms.","Explain factors affecting growth.","Distinguish growth from development."],
    [
      {label:"01 • Form 3",title:"Biological growth",body:"Growth involves a permanent increase in size, dry mass or cell number and is accompanied by development and differentiation.",highYield:"Growth is measurable and permanent."},
      {label:"02 • Plant growth",title:"Regions of active growth",body:"Plant growth is concentrated in meristematic regions where cells divide and later elongate and differentiate.",highYield:"Meristems contain actively dividing cells."},
      {label:"03 • Factors",title:"What affects growth?",body:"Growth depends on genetic factors and environmental conditions such as water, nutrients, temperature and light.",highYield:"Separate internal factors from environmental factors."},
      {label:"04 • Quick check",title:"Growth experiments",body:"Revise how growth can be measured and how experimental variables affect growth.",highYield:"State the variable being changed and the measurement being recorded."}
    ],["Growth","Plant Biology"],["growth","development","meristem","growth rate","germination","temperature","light"],["Plant growth","Growth factors","Growth experiments"]),

  lesson("hs-f3-coordination",11,3,"Coordination and Response","Form 3 • Coordination",
    ["Explain coordination in organisms.","Describe basic nervous coordination.","Explain the role of receptors and effectors."],
    [
      {label:"01 • Form 3",title:"Responding to stimuli",body:"Organisms detect changes in their environment and coordinate responses that improve survival.",highYield:"A response begins with detection of a stimulus."},
      {label:"02 • Nervous coordination",title:"Rapid communication",body:"The nervous system uses electrical impulses and chemical signalling to coordinate rapid responses.",highYield:"Nervous coordination is rapid and often short-lived."},
      {label:"03 • Reflexes",title:"Protective responses",body:"Reflex actions provide rapid responses to potentially harmful stimuli through organized pathways involving receptors, neurones and effectors.",highYield:"Know the sequence from stimulus to response."},
      {label:"04 • Quick check",title:"Coordination pathway",body:"Trace a simple response from stimulus and receptor through the coordinating centre to the effector.",highYield:"Stimulus → receptor → coordinator → effector → response."}
    ],["Neuroanatomy","Physiology","Coordination"],["coordination","stimulus","receptor","reflex","neuron","effector","response"],["Stimulus and response","Reflex action","Nervous coordination"]),

  lesson("hs-f3-ecology",12,3,"Ecology and the Environment","Form 3 • Ecology",
    ["Define population, community and ecosystem.","Explain food chains and energy flow.","Describe population factors and conservation."],
    [
      {label:"01 • Form 3",title:"Ecological organization",body:"Ecology examines interactions among organisms and between organisms and their physical environment.",highYield:"Population, community and ecosystem describe different levels."},
      {label:"02 • Feeding relationships",title:"Food chains and webs",body:"Energy enters ecosystems mainly through producers and passes through consumers along feeding relationships.",highYield:"Energy flows through ecosystems while materials are recycled."},
      {label:"03 • Population",title:"What limits populations?",body:"Population size is affected by factors including food, water, space, predation, disease and competition.",highYield:"Limiting factors control population growth."},
      {label:"04 • Quick check",title:"Conservation",body:"Explain how human activities can affect habitats and biodiversity and identify practical conservation approaches.",highYield:"Trace environmental impacts through the ecosystem."}
    ],["Ecology","Evolution"],["ecology","ecosystem","population","community","food chain","food web","conservation","biodiversity"],["Food chains","Population","Conservation","Biodiversity"]),
];

export function getHighSchoolLesson(id: string) {
  return HIGH_SCHOOL_LESSONS.find(item => item.id === id);
}

export function getVirtualLessonQuestionsMatch(lessonId: string, question: { topic: string; subtopic?: string; prompt: string }) {
  const item = getHighSchoolLesson(lessonId);
  if (!item) return false;
  const haystack = [question.topic, question.subtopic ?? "", question.prompt].join(" ").toLowerCase();
  const topicMatch = item.bankTopics.some(topic => question.topic.toLowerCase().includes(topic.toLowerCase()) || topic.toLowerCase().includes(question.topic.toLowerCase()));
  const keywordHits = item.bankKeywords.filter(keyword => haystack.includes(keyword.toLowerCase())).length;
  return topicMatch || keywordHits >= 1;
}
