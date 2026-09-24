import { useEffect, useRef, useState } from "react";
import { getLessonBankSummary, lessons } from "../data/lessons";
import { getProgress, getTodaysLessonId, hasReadLessonToday, markLessonRead, type StudyProgress } from "../data/progress";

type Props={onRead:(progress:StudyProgress)=>void;onExit:()=>void};

export default function Lesson({onRead,onExit}:Props){
 const todayId=getTodaysLessonId();
 const progress=getProgress();
 const selected=lessons.find(l=>l.id===todayId)??lessons[0];
 const bankSummary=getLessonBankSummary(selected.id);
 const [confirmed,setConfirmed]=useState(hasReadLessonToday(progress,todayId));
 const [readPercent,setReadPercent]=useState(hasReadLessonToday(progress,todayId)?100:0);
 const lessonRef=useRef<HTMLElement|null>(null);

 useEffect(()=>{
   const current=getProgress();
   setConfirmed(hasReadLessonToday(current,todayId));
   setReadPercent(hasReadLessonToday(current,todayId)?100:0);
   const element=lessonRef.current;
   if(element)element.scrollTop=0;
 },[todayId]);

 const updateReadProgress=()=>{
   const element=lessonRef.current;
   if(!element)return;
   const max=element.scrollHeight-element.clientHeight;
   const percent=max<=1?100:Math.min(100,Math.round((element.scrollTop/max)*100));
   setReadPercent(value=>Math.max(value,percent));
 };

 useEffect(()=>{updateReadProgress();},[todayId]);

 const complete=()=>{
   if(readPercent<100||confirmed)return;
   const next=markLessonRead(selected.id);
   setConfirmed(true);
   setTimeout(()=>onRead(next),250);
 };

 return <div className="content">
   <div className="lesson-header">
     <div>
       <span className="badge">TODAY'S LESSON • LESSON {selected.sequence}</span>
       <h2>{selected.title}</h2>
       <p>{selected.topic} • {selected.reference}</p>
     </div>
     <button className="secondary-button" onClick={onExit}>Back to dashboard</button>
   </div>

   <section className="lesson-objectives">
     <div><strong>Today's learning objectives</strong><span>Daily required reading</span></div>
     <ul>{selected.objectives.map(item=><li key={item}>{item}</li>)}</ul>
   </section>

   <div className="lesson-progress-panel">
     <div><strong>Today's reading progress</strong><span>{readPercent}% complete</span></div>
     <div className="progress"><i style={{width:`${readPercent}%`}}/></div>
     <small>{readPercent<100?"Read and scroll through the full lesson to unlock TAKE RAT.":"100% complete. TAKE RAT is now unlocked."}</small>
   </div>

   <section className="lesson-bank-panel panel">
     <div>
       <span className="eyebrow">Question Bank Connection</span>
       <h3>This lesson is backed by {bankSummary.total} questions</h3>
       <p>These questions are the source used later by RAT, CAT, Revision and Practice.</p>
     </div>
     <div className="lesson-bank-stats">
       <span><strong>{bankSummary.easy}</strong> Easy</span>
       <span><strong>{bankSummary.medium}</strong> Medium</span>
       <span><strong>{bankSummary.hard}</strong> Hard</span>
     </div>
     <div className="lesson-bank-focus">
       {selected.bankFocus.map(item=><span key={item}>{item}</span>)}
     </div>
   </section>

   <article ref={lessonRef} onScroll={updateReadProgress} className="lesson-card lesson-scroll">
     {selected.sections.map(section=><section key={section.title}>
       <span className="eyebrow">{section.label}</span><h3>{section.title}</h3><p>{section.body}</p>
       <div className="high-yield"><strong>{section.highYield}</strong></div>
     </section>)}
   </article>

   <div className="lesson-complete">
     <div>
       <strong>{readPercent===100?"Lesson complete":"Keep reading"}</strong>
       <span>{readPercent===100?"The daily RAT is ready.":"You must reach 100% reading progress before the RAT unlocks."}</span>
     </div>
     <button className="primary-button" disabled={readPercent<100||confirmed} onClick={complete}>
       {confirmed?"RAT UNLOCKED":readPercent===100?"TAKE RAT":"SCROLL TO 100%"}
     </button>
   </div>
 </div>;
}
