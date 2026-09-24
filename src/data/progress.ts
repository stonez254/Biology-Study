import type { Question } from "./questions";

export type AssessmentType = "RAT" | "CAT" | "REVISION";
export type AssessmentAttempt = { id: string; type: AssessmentType; completedAt: string; score: number; correct: number; total: number; accuracy: number; passed: boolean; };
export type RATAttempt = AssessmentAttempt;
export type RevisionAttempt = { id: string; completedAt: string; score: number; correct: number; total: number; accuracy: number; questionIds: string[]; };
export type StudyProgress = {
  points: number; streak: number; lastStudyDate: string | null; attempts: AssessmentAttempt[];
  missedQuestionIds: string[]; revisionAttempts: RevisionAttempt[];
  lessonReadDate: string | null; lessonReadId: string | null; ratRetakeDate: string | null;
};
export type SavedAssessment = { questionIds: string[]; current: number; answers: Record<string, number>; secondsLeft: number; startedAt: string; };
export type SavedRAT = SavedAssessment;
export type SavedCAT = SavedAssessment;
export type SavedRevision = Omit<SavedAssessment, "secondsLeft">;

const PROGRESS_KEY="biology-study:progress", RAT_KEY="biology-study:active-rat", CAT_KEY="biology-study:active-cat", REVISION_KEY="biology-study:active-revision";
const defaultProgress: StudyProgress={points:0,streak:0,lastStudyDate:null,attempts:[],missedQuestionIds:[],revisionAttempts:[],lessonReadDate:null,lessonReadId:null,ratRetakeDate:null};
function read<T>(key:string,fallback:T):T{try{const v=localStorage.getItem(key);return v?JSON.parse(v) as T:fallback;}catch{return fallback;}}
export function getProgress():StudyProgress{const raw=read<Partial<StudyProgress>>(PROGRESS_KEY,defaultProgress);return{
  points:raw.points??0,streak:raw.streak??0,lastStudyDate:raw.lastStudyDate??null,
  attempts:(raw.attempts??[]).map((a:any)=>({...a,type:a.type??"RAT"})),
  missedQuestionIds:raw.missedQuestionIds??[],revisionAttempts:raw.revisionAttempts??[],
  lessonReadDate:raw.lessonReadDate??null,lessonReadId:raw.lessonReadId??null,ratRetakeDate:raw.ratRetakeDate??null
};}
export function saveProgress(progress:StudyProgress){localStorage.setItem(PROGRESS_KEY,JSON.stringify(progress));}
function localDateKey(date=new Date()){return date.getFullYear()+"-"+String(date.getMonth()+1).padStart(2,"0")+"-"+String(date.getDate()).padStart(2,"0");}
function dateAtMidnight(dateKey:string){const [year,month,day]=dateKey.split("-").map(Number);return new Date(year,month-1,day);}
function addDays(date:Date,days:number){const next=new Date(date);next.setDate(next.getDate()+days);return next;}
function dateDifferenceInDays(later:string,earlier:string){return Math.round((dateAtMidnight(later).getTime()-dateAtMidnight(earlier).getTime())/86400000);}
export function todayKey(){return localDateKey();}
function updateStreak(progress:StudyProgress){const today=localDateKey(),yesterday=localDateKey(new Date(Date.now()-86400000));return progress.lastStudyDate===today?progress.streak:progress.lastStudyDate===yesterday?progress.streak+1:1;}
export function markLessonRead(lessonId:string):StudyProgress{const progress=getProgress();const next={...progress,lessonReadDate:localDateKey(),lessonReadId:lessonId};saveProgress(next);return next;}
export function hasReadLessonToday(progress=getProgress(),lessonId?:string){return progress.lessonReadDate===localDateKey() && (!lessonId || progress.lessonReadId===lessonId);}
export function getTodaysLessonId(){const lessons=["cellular-energy","human-tissues","human-regulation"];return lessons[Math.floor(Date.now()/86400000)%lessons.length];}
export function hasCompletedRATToday(progress=getProgress()){const today=localDateKey();return progress.attempts.some(a=>a.type==="RAT"&&localDateKey(new Date(a.completedAt))===today);}
export function canUseRATRetakeToday(progress=getProgress()){return hasCompletedRATToday(progress)&&progress.ratRetakeDate!==localDateKey();}
export function consumeRATRetake():StudyProgress{const progress=getProgress();const next={...progress,ratRetakeDate:localDateKey()};saveProgress(next);return next;}

export type CATStatus = {
  eligible:boolean;
  ratDays:number;
  remainingRATs:number;
  nextOpenAt:Date|null;
  waitingForTodayRAT:boolean;
};

export function getCATStatus(progress=getProgress()):CATStatus{
  const lastCAT=progress.attempts.filter(a=>a.type==="CAT").sort((a,b)=>new Date(b.completedAt).getTime()-new Date(a.completedAt).getTime())[0];
  const cutoff=lastCAT?localDateKey(new Date(lastCAT.completedAt)):null;
  const ratDates=Array.from(new Set(progress.attempts
    .filter(a=>a.type==="RAT"&&(!cutoff||localDateKey(new Date(a.completedAt))>cutoff))
    .map(a=>localDateKey(new Date(a.completedAt)))))
    .sort();

  if(!ratDates.length){
    return {eligible:false,ratDays:0,remainingRATs:3,nextOpenAt:addDays(new Date(new Date().setHours(0,0,0,0)),2),waitingForTodayRAT:false};
  }

  let streak=1;
  for(let i=ratDates.length-1;i>0;i--){
    if(dateDifferenceInDays(ratDates[i],ratDates[i-1])===1) streak++;
    else break;
  }

  const latest=ratDates[ratDates.length-1];
  const today=localDateKey();
  const hasToday=latest===today;
  const eligible=streak>=3;
  const remainingRATs=Math.max(0,3-streak);

  if(eligible){
    return {eligible:true,ratDays:streak,remainingRATs:0,nextOpenAt:null,waitingForTodayRAT:false};
  }

  const target=addDays(dateAtMidnight(latest),Math.max(1,3-streak));
  const waitingForTodayRAT=!hasToday && target.getTime()<=Date.now();
  return {eligible:false,ratDays:streak,remainingRATs,nextOpenAt:target,waitingForTodayRAT};
}

export function recordAssessmentAttempt(type:"RAT"|"CAT",result:Omit<AssessmentAttempt,"id"|"completedAt"|"type">,missedIds:string[]=[]):StudyProgress{
 const progress=getProgress();const next={...progress,points:progress.points+result.score,streak:updateStreak(progress),lastStudyDate:localDateKey(),
 attempts:[{...result,type,id:crypto.randomUUID(),completedAt:new Date().toISOString()},...progress.attempts].slice(0,100),
 missedQuestionIds:Array.from(new Set([...progress.missedQuestionIds,...missedIds]))};saveProgress(next);return next;
}
export function recordRATAttempt(result:Omit<RATAttempt,"id"|"completedAt"|"type">,missedIds:string[]=[]){return recordAssessmentAttempt("RAT",result,missedIds);}
export function recordRevisionAttempt(result:Omit<RevisionAttempt,"id"|"completedAt">,masteredIds:string[]):StudyProgress{
 const progress=getProgress();const mastered=new Set(masteredIds);const next={...progress,points:progress.points+result.score,streak:updateStreak(progress),lastStudyDate:localDateKey(),
 missedQuestionIds:progress.missedQuestionIds.filter(id=>!mastered.has(id)),
 revisionAttempts:[{...result,id:crypto.randomUUID(),completedAt:new Date().toISOString()},...progress.revisionAttempts].slice(0,100)};saveProgress(next);return next;
}
export function saveActiveRAT(saved:SavedRAT){localStorage.setItem(RAT_KEY,JSON.stringify(saved));}
export function getActiveRAT():SavedRAT|null{try{const r=localStorage.getItem(RAT_KEY);return r?JSON.parse(r):null;}catch{return null;}}
export function clearActiveRAT(){localStorage.removeItem(RAT_KEY);}
export function saveActiveCAT(saved:SavedCAT){localStorage.setItem(CAT_KEY,JSON.stringify(saved));}
export function getActiveCAT():SavedCAT|null{try{const r=localStorage.getItem(CAT_KEY);return r?JSON.parse(r):null;}catch{return null;}}
export function clearActiveCAT(){localStorage.removeItem(CAT_KEY);}
export function saveActiveRevision(saved:SavedRevision){localStorage.setItem(REVISION_KEY,JSON.stringify(saved));}
export function getActiveRevision():SavedRevision|null{try{const r=localStorage.getItem(REVISION_KEY);return r?JSON.parse(r):null;}catch{return null;}}
export function clearActiveRevision(){localStorage.removeItem(REVISION_KEY);}
export function hydrateQuestions(saved:SavedAssessment,bank:Question[]){const byId=new Map(bank.map(q=>[q.id,q]));return saved.questionIds.map(id=>byId.get(id)).filter((q):q is Question=>Boolean(q));}
