import { useEffect, useRef, useState } from "react";
import { getTodaysLessonId, markLessonRead, type StudyProgress } from "../data/progress";

type Props={onRead:(progress:StudyProgress)=>void;onExit:()=>void};

export default function Lesson({onRead,onExit}:Props){
 const [confirmed,setConfirmed]=useState(false);
 const [readPercent,setReadPercent]=useState(0);
 const lessonRef=useRef<HTMLElement|null>(null);
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

 const updateReadProgress=()=>{
   const element=lessonRef.current;
   if(!element)return;
   const max=element.scrollHeight-element.clientHeight;
   const percent=max<=1?100:Math.min(100,Math.round((element.scrollTop/max)*100));
   setReadPercent(percent);
 };

 useEffect(()=>{
   const element=lessonRef.current;
   if(!element)return;
   updateReadProgress();
 },[]);

 const complete=()=>{
   if(readPercent<100||confirmed)return;
   const progress=markLessonRead(lessonId);
   setConfirmed(true);
   setTimeout(()=>onRead(progress),250);
 };

 return <div className="content">
  <div className="lesson-header"><div><span className="badge">TODAY&apos;S LESSON</span><h2>{lesson.title}</h2><p>Read and scroll through the complete notes before today&apos;s RAT can be unlocked.</p></div><button className="secondary-button" onClick={onExit}>Back to dashboard</button></div>
  <div className="lesson-progress-panel"><div><strong>Lesson reading progress</strong><span>{readPercent}% complete</span></div><div className="progress"><i style={{width:`${readPercent}%`}}/></div><small>{readPercent<100?"Scroll through all lesson notes to unlock TAKE RAT.":"100% complete. TAKE RAT is now unlocked."}</small></div>
  <article ref={lessonRef} onScroll={updateReadProgress} className="lesson-card lesson-scroll">
   {[0,1,2,3].map(index=><section key={index}><span className="eyebrow">{lesson.sections[index][0]}</span><h3>{lesson.sections[index][1]}</h3><p>{lesson.sections[index][2]}</p><div className="high-yield"><strong>{lesson.sections[index][3]}</strong></div></section>)}
  </article>
  <div className="lesson-complete"><div><strong>{readPercent===100?"Lesson complete":"Keep reading"}</strong><span>{readPercent===100?"The daily RAT is ready.":"You must reach 100% reading progress before the RAT unlocks."}</span></div><button className="primary-button" disabled={readPercent<100||confirmed} onClick={complete}>{confirmed?"RAT UNLOCKED":readPercent===100?"TAKE RAT":"SCROLL TO 100%"}</button></div>
 </div>;
}
