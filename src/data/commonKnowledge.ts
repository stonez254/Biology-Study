export type BiologyFact = { fact: string; reference: string; source: string };

// Local common-knowledge bank for the dashboard's rotating Daily Fact.
// Each entry keeps the learner-facing fact paired with its reference.
export const commonKnowledgeBank: BiologyFact[] = [
  { fact: "The human heart has four chambers: two atria and two ventricles.", reference: "OpenStax Biology 2e, Ch. 40: The Circulatory System", source: "OpenStax Biology 2e" },
  { fact: "Mitochondria are organelles where most eukaryotic cells make ATP through aerobic cellular respiration.", reference: "OpenStax Biology 2e, Ch. 7: Cellular Respiration", source: "OpenStax Biology 2e" },
  { fact: "DNA stores hereditary information in a sequence of nucleotides containing A, T, C and G.", reference: "OpenStax Biology 2e, Ch. 14: DNA Structure and Function", source: "OpenStax Biology 2e" },
  { fact: "Ribosomes build proteins by translating the information carried by messenger RNA.", reference: "OpenStax Biology 2e, Ch. 15: Genes and Protein Synthesis", source: "OpenStax Biology 2e" },
  { fact: "Photosynthesis converts light energy into chemical energy and releases oxygen when water is split during the light-dependent reactions.", reference: "OpenStax Biology 2e, Ch. 8: Photosynthesis", source: "OpenStax Biology 2e" },
  { fact: "The cell membrane is selectively permeable, allowing some substances to cross more readily than others.", reference: "OpenStax Biology 2e, Ch. 5: Structure and Function of Plasma Membranes", source: "OpenStax Biology 2e" },
  { fact: "Enzymes speed up biological reactions by lowering their activation energy without being consumed by the reaction.", reference: "OpenStax Biology 2e, Ch. 6: Metabolism", source: "OpenStax Biology 2e" },
  { fact: "Red blood cells transport oxygen mainly by using the protein hemoglobin.", reference: "OpenStax Biology 2e, Ch. 40: The Circulatory System", source: "OpenStax Biology 2e" },
  { fact: "Neurons communicate across synapses using electrical signals within the cell and chemical neurotransmitters between cells.", reference: "OpenStax Biology 2e, Ch. 35: The Nervous System", source: "OpenStax Biology 2e" },
  { fact: "Homeostasis is the maintenance of relatively stable internal conditions despite changes in the external environment.", reference: "OpenStax Biology 2e, Ch. 33: The Animal Body: Basic Form and Function", source: "OpenStax Biology 2e" },
  { fact: "Mitosis produces two daughter cells that normally retain the same chromosome number as the parent cell.", reference: "OpenStax Biology 2e, Ch. 10: Cell Reproduction", source: "OpenStax Biology 2e" },
  { fact: "Meiosis reduces chromosome number by half and produces cells used in sexual reproduction.", reference: "OpenStax Biology 2e, Ch. 11: Meiosis and Sexual Reproduction", source: "OpenStax Biology 2e" },
  { fact: "Natural selection changes the frequency of heritable traits in populations when those traits affect reproductive success.", reference: "OpenStax Biology 2e, Ch. 18: Evolution and the Origin of Species", source: "OpenStax Biology 2e" },
  { fact: "Bacteria are prokaryotes, meaning their cells do not have a membrane-bound nucleus.", reference: "OpenStax Biology 2e, Ch. 22: Prokaryotes: Bacteria and Archaea", source: "OpenStax Biology 2e" },
  { fact: "Viruses require host cells to reproduce because they do not have the cellular machinery needed for independent replication.", reference: "OpenStax Biology 2e, Ch. 21: Viruses", source: "OpenStax Biology 2e" },
  { fact: "Ecological food webs show how energy and matter move through interconnected feeding relationships.", reference: "OpenStax Biology 2e, Ch. 46: Ecosystems", source: "OpenStax Biology 2e" },
  { fact: "ATP acts as a major short-term energy carrier in cells and powers many cellular processes.", reference: "OpenStax Biology 2e, Ch. 6: Metabolism", source: "OpenStax Biology 2e" },
  { fact: "The genetic code is read in groups of three nucleotides called codons during protein synthesis.", reference: "OpenStax Biology 2e, Ch. 15: Genes and Protein Synthesis", source: "OpenStax Biology 2e" },
  { fact: "Plants transport water and dissolved minerals mainly through xylem tissue.", reference: "OpenStax Biology 2e, Ch. 30: Plant Form and Physiology", source: "OpenStax Biology 2e" },
  { fact: "The kidneys help maintain internal balance by filtering blood and regulating water, ions and other substances in the body.", reference: "OpenStax Biology 2e, Ch. 42: The Urinary System", source: "OpenStax Biology 2e" },
];

export function getDailyFact(date = new Date()): BiologyFact {
  const day = Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000);
  return commonKnowledgeBank[((day % commonKnowledgeBank.length) + commonKnowledgeBank.length) % commonKnowledgeBank.length];
}
