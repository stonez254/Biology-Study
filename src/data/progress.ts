import type { Question } from "./questions";

export type AssessmentType = "RAT" | "CAT" | "REVISION";
export type AssessmentAttempt = { id: string; type: AssessmentType; completedAt: string; score: number; correct: number; total: number; accuracy: number; passed: boolean; };
export type RATAttempt = AssessmentAttempt;
export type RevisionAttempt = { id: string; completedAt: string; score: number; correct: number; total: number; accuracy: number; questionIds: string[]; };
export type StudyProgress = { points: number; streak: number; lastStudyDate: string | null; attempts: AssessmentAttempt[]; missedQuestionIds: string[]; revisionAttempts: RevisionAttempt[]; };
export type SavedAssessment = { questionIds: string[]; current: number; answers: Record<string, number>; secondsLeft: number; startedAt: string; };
export type SavedRAT = SavedAssessment;
export type SavedCAT = SavedAssessment;
export type SavedRevision = Omit<SavedAssessment, "secondsLeft">;

const PROGRESS_KEY="biology-study:progress", RAT_KEY="biology-study:active-rat", CAT_KEY="biology-study:active-cat", REVISION_KEY="biology-study:active-revision";
const defaultProgress: StudyProgress={points:0,streak:0,lastStudyDate:null,attempts:[],missedQuestionIds:[],revisionAttempts:[]};
function read<T>(key:string,fallback:T):T{try{const v=localStorage.getItem(key);return v?JSON.parse(v) as T:fallback;}catch{return fallback;}}
export function getProgress():StudyProgress{const raw=read<Partial<StudyProgress>>(PROGRESS_KEY,defaultProgress);return{points:raw.points??0,streak:raw.streak??0,lastStudyDate:raw.lastStudyDate??null,attempts:(raw.attempts??[]).map((a:any)=>({...a,type:a.type??"RAT"})),missedQuestionIds:raw.missedQuestionIds??[],revisionAttempts:raw.revisionAttempts??[]};}
export function saveProgress(progress:StudyProgress){localStorage.setItem(PROGRESS_KEY,JSON.stringify(progress));}
function localDateKey(date=new Date()){return date.getFullYear()+"-"+String(date.getMonth()+1).padStart(2,"0")+"-"+String(date.getDate()).padStart(2,"0");}
function updateStreak(progress:StudyProgress){const today=localDateKey(),yesterday=localDateKey(new Date(Date.now()-86400000));return progress.lastStudyDate===today?progress.streak:progress.lastStudyDate===yesterday?progress.streak+1:1;}
export function recordAssessmentAttempt(type:"RAT"|"CAT",result:Omit<AssessmentAttempt,"id"|"completedAt"|"type">,missedIds:string[]=[]):StudyProgress{const progress=getProgress();const next={...progress,points:progress.points+result.score,streak:updateStreak(progress),lastStudyDate:localDateKey(),attempts:[{...result,type,id:crypto.randomUUID(),completedAt:new Date().toISOString()},...progress.attempts].slice(0,100),missedQuestionIds:Array.from(new Set([...progress.missedQuestionIds,...missedIds]))};saveProgress(next);return next;}
export function recordRATAttempt(result:Omit<RATAttempt,"id"|"completedAt"|"type">,missedIds:string[]=[]){return recordAssessmentAttempt("RAT",result,missedIds);}
export function recordRevisionAttempt(result:Omit<RevisionAttempt,"id"|"completedAt">,masteredIds:string[]):StudyProgress{const progress=getProgress();const mastered=new Set(masteredIds);const next={...progress,points:progress.points+result.score,streak:updateStreak(progress),lastStudyDate:localDateKey(),missedQuestionIds:progress.missedQuestionIds.filter(id=>!mastered.has(id)),revisionAttempts:[{...result,id:crypto.randomUUID(),completedAt:new Date().toISOString()},...progress.revisionAttempts].slice(0,100)};saveProgress(next);return next;}
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
