import { useState } from "react";
import { getTodaysLessonId, markLessonRead, type StudyProgress } from "../data/progress";

type Props={onRead:(progress:StudyProgress)=>void;onExit:()=>void};

export default function Lesson({onRead,onExit}:Props){
 const [confirmed,setConfirmed]=useState(false);
 const lessonId=getTodaysLessonId();
 const lessons:Record<string,{title:string;sections:[string,string,string,string][]}> = {
  "cellular-energy":{title:"Cellular Energy & ATP",sections:[
   ["01 • Core concept","Why cells need ATP","Cells constantly perform work such as transport, synthesis, signalling and muscle contraction. ATP provides immediately usable chemical energy for many of these processes.","ATP links metabolism to cellular work."],
   ["02 • Production","Where ATP comes from","Glycolysis occurs in the cytosol. The citric acid cycle and oxidative phosphorylation occur in mitochondria, with oxidative phosphorylation producing most ATP during aerobic respiration.","The inner mitochondrial membrane houses the electron transport chain and ATP synthase."],
   ["03 • High-yield","Oxygen and ATP","Oxygen serves as the final electron acceptor in the mitochondrial electron transport chain, allowing oxidative phosphorylation to continue.","Without adequate oxygen, aerobic ATP production falls."],
   ["04 • Quick check","Before the RAT","Be able to explain ATP's role, the location of glycolysis, the role of mitochondria and why oxygen supports aerobic ATP production.","Know the locations and sequence of the major stages."]
  ]},
  "human-tissues":{title:"Tissues & Cellular Organization",sections:[
   ["01 • Core concept","Epithelial tissue","Epithelial tissue covers surfaces, lines cavities and forms many glands. Its cells are closely packed and organized into sheets.","Think covering, lining and secretion."],
   ["02 • Histology","Simple squamous epithelium","Simple squamous epithelium is thin and suited to diffusion and filtration, making it useful where rapid exchange is important.","Thin structure supports efficient diffusion."],
   ["03 • High-yield","Protein-secreting cells","Cells specialized for protein secretion commonly contain abundant rough endoplasmic reticulum because ribosomes synthesize proteins destined for secretion or membranes.","Rough ER is a major clue for protein synthesis and secretion."],
   ["04 • Quick check","Before the RAT","Review epithelial functions, simple squamous epithelium and the role of rough ER.","Be able to connect structure with function."]
  ]},
  "human-regulation":{title:"Human Regulation & Communication",sections:[
   ["01 • Core concept","Blood glucose control","The pancreas contains endocrine cells that help regulate blood glucose. Insulin generally lowers blood glucose while glucagon generally raises it.","Insulin and glucagon act in opposite directions on blood glucose."],
   ["02 • Physiology","Circulation","The left ventricle pumps oxygenated blood into systemic circulation. Erythrocytes transport oxygen using hemoglobin.","Trace blood flow and connect it to oxygen delivery."],
   ["03 • Neuroanatomy","Nervous system organization","The central nervous system consists of the brain and spinal cord. Dendrites typically receive incoming signals, while the corpus callosum connects the cerebral hemispheres.","Know the major structures and their functions."],
   ["04 • Quick check","Before the RAT","Review insulin, glucagon, oxygen transport, CNS organization and basic neuronal structure.","Use structure-function relationships to answer the RAT."]
  ]}
 };
 const lesson=lessons[lessonId];
 const complete=()=>{const progress=markLessonRead(lessonId);setConfirmed(true);setTimeout(()=>onRead(progress),250);};
 return <div className="content"><div className="lesson-header"><div><span className="badge">DAILY BIOLOGY LESSON</span><h2>{lesson.title}</h2><p>Read this lesson before attempting today&apos;s RAT.</p></div><button className="secondary-button" onClick={onExit}>Back to dashboard</button></div><article className="lesson-card"><section><span className="eyebrow">{lesson.sections[0][0]}</span><h3>{lesson.sections[0][1]}</h3><p>{lesson.sections[0][2]}</p><div className="high-yield"><strong>{lesson.sections[0][3]}</strong></div></section><section><span className="eyebrow">{lesson.sections[1][0]}</span><h3>{lesson.sections[1][1]}</h3><p>{lesson.sections[1][2]}</p><div className="high-yield"><strong>{lesson.sections[1][3]}</strong></div></section><section><span className="eyebrow">{lesson.sections[2][0]}</span><h3>{lesson.sections[2][1]}</h3><p>{lesson.sections[2][2]}</p><div className="high-yield"><strong>{lesson.sections[2][3]}</strong></div></section><section><span className="eyebrow">{lesson.sections[3][0]}</span><h3>{lesson.sections[3][1]}</h3><p>{lesson.sections[3][2]}</p><div className="high-yield"><strong>{lesson.sections[3][3]}</strong></div></section></article><div className="lesson-complete"><div><strong>Lesson complete?</strong><span>Once you finish reading, unlock today's 10-question RAT.</span></div><button className="primary-button" disabled={confirmed} onClick={complete}>{confirmed?"RAT UNLOCKED":"Finish lesson • Take today's RAT"}</button></div></div>;
}