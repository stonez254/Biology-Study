import { useEffect, useRef, useState } from "react";
import { ACTIVE_LESSONS, lessons } from "../data/lessons";
import { getProgress, getTodaysLessonId, hasReadLessonToday, markLessonRead, type StudyProgress } from "../data/progress";

type Props={onRead:(progress:StudyProgress)=>void;onExit:()=>void};

export default function Lesson({onRead,onExit}:Props){
 const todayId=getTodaysLessonId();
 const progress=getProgress();
 const [selectedId,setSelectedId]=useState(todayId);
 const selected=lessons.find(l=>l.id===selectedId)??lessons[0];
 const isToday=selected.id===todayId;
 const isCompleted=progress.completedLessonIds.includes(selected.id);
 const [confirmed,setConfirmed]=useState(isToday&&hasReadLessonToday(progress,todayId));
 const [readPercent,setReadPercent]=useState(isToday&&hasReadLessonToday(progress,todayId)?100:0);
 const lessonRef=useRef<HTMLElement|null>(null);

 useEffect(()=>{
   setConfirmed(isToday&&hasReadLessonToday(getProgress(),todayId));
   setReadPercent(isToday&&hasReadLessonToday(getProgress(),todayId)?100:0);
   const element=lessonRef.current;
   if(element)element.scrollTop=0;
 },[selectedId,isToday,todayId]);

 const updateReadProgress=()=>{
   const element=lessonRef.current;
   if(!element)return;
   const max=element.scrollHeight-element.clientHeight;
   const percent=max<=1?100:Math.min(100,Math.round((element.scrollTop/max)*100));
   setReadPercent(value=>Math.max(value,percent));
 };

 useEffect(()=>{updateReadProgress();},[selectedId]);

 const complete=()=>{
   if(!isToday||readPercent<100||confirmed)return;
   const next=markLessonRead(selected.id);
   setConfirmed(true);
   setTimeout(()=>onRead(next),250);
 };

 const completed=lessons.filter(l=>progress.completedLessonIds.includes(l.id));
 const upcoming=lessons.filter(l=>!progress.completedLessonIds.includes(l.id)&&l.id!==todayId);
 const currentIndex=lessons.findIndex(l=>l.id===selected.id);

 return <div className="content">
   <div className="lesson-header">
     <div>
       <span className="badge">{isToday?"TODAY'S LESSON":"LESSON LIBRARY • REVIEW"}</span>
       <h2>{selected.sequence}. {selected.title}</h2>
       <p>{selected.topic} • {selected.reference}</p>
     </div>
     <button className="secondary-button" onClick={onExit}>Back to dashboard</button>
   </div>

   <section className="lesson-library">
     <div className="lesson-library-title">
       <div><strong>Lesson Library</strong><span>{completed.length} completed • {ACTIVE_LESSONS.length} lessons currently linked to RATs</span></div>
       <span className="badge">{isToday?"CURRENT":"REVIEW MODE"}</span>
     </div>
     <div className="lesson-library-grid">
       <button className={isToday?"lesson-library-item current":"lesson-library-item"} onClick={()=>setSelectedId(todayId)}>
         <span className="lesson-number">TODAY</span><strong>{lessons.find(l=>l.id===todayId)?.sequence}. {lessons.find(l=>l.id===todayId)?.title}</strong>
         <small>{hasReadLessonToday(progress,todayId)?"Completed today":"Required before today's RAT"}</small>
       </button>
       {completed.filter(l=>l.id!==todayId).map(l=><button key={l.id} className="lesson-library-item completed" onClick={()=>setSelectedId(l.id)}>
         <span className="lesson-number">LESSON {l.sequence}</span><strong>{l.title}</strong><small>Completed • Review anytime</small>
       </button>)}
       {upcoming.map(l=><button key={l.id} className="lesson-library-item locked" onClick={()=>setSelectedId(l.id)}>
         <span className="lesson-number">LESSON {l.sequence}</span><strong>{l.title}</strong><small>{l.questionCount>=10?"Ready for question-bank expansion":"Question bank not ready yet"}</small>
       </button>)}
     </div>
   </section>

   <section className="lesson-objectives">
     <div><strong>Learning objectives</strong><span>Lesson {currentIndex+1} of {lessons.length}</span></div>
     <ul>{selected.objectives.map(item=><li key={item}>{item}</li>)}</ul>
   </section>

   {isToday&&<div className="lesson-progress-panel">
     <div><strong>Today's reading progress</strong><span>{readPercent}% complete</span></div>
     <div className="progress"><i style={{width:`${readPercent}%`}}/></div>
     <small>{readPercent<100?"Scroll through all lesson notes to unlock TAKE RAT.":"100% complete. TAKE RAT is now unlocked."}</small>
   </div>}

   {!isToday&&<div className="lesson-review-note"><strong>Review mode</strong><span>This is a previous lesson. Reviewing it does not unlock or reset today's RAT.</span></div>}

   <article ref={lessonRef} onScroll={updateReadProgress} className="lesson-card lesson-scroll">
     {selected.sections.map(section=><section key={section.title}>
       <span className="eyebrow">{section.label}</span><h3>{section.title}</h3><p>{section.body}</p>
       <div className="high-yield"><strong>{section.highYield}</strong></div>
     </section>)}
   </article>

   <div className="lesson-complete">
     <div>
       <strong>{isToday?(readPercent===100?"Lesson complete":"Keep reading"):(isCompleted?"Completed lesson":"Upcoming lesson")}</strong>
       <span>{isToday?(readPercent===100?"The daily RAT is ready.":"You must reach 100% reading progress before the RAT unlocks."):"Reviewing library lessons never unlocks today's RAT."}</span>
     </div>
     {isToday?<button className="primary-button" disabled={readPercent<100||confirmed} onClick={complete}>{confirmed?"RAT UNLOCKED":readPercent===100?"TAKE RAT":"SCROLL TO 100%"}</button>:<button className="secondary-button" onClick={()=>setSelectedId(todayId)}>BACK TO TODAY'S LESSON</button>}
   </div>
 </div>;
}
