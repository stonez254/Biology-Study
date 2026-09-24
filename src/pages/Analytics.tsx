import { useMemo, useState } from "react";
import { getProgress, type StudyProgress } from "../data/progress";
import { lessons } from "../data/lessons";

type AnalyticsProps = { progress: StudyProgress; onRefresh: (progress: StudyProgress) => void };

function pct(value: number) { return Math.round(value); }

export default function Analytics({ progress, onRefresh }: AnalyticsProps) {
  const [range, setRange] = useState<"all" | "30">("all");

  const data = useMemo(() => {
    const cutoff = Date.now() - 30 * 86400000;
    const attempts = progress.attempts.filter(a => range === "all" || new Date(a.completedAt).getTime() >= cutoff);
    const revisions = progress.revisionAttempts.filter(a => range === "all" || new Date(a.completedAt).getTime() >= cutoff);
    const rats = attempts.filter(a => a.type === "RAT");
    const cats = attempts.filter(a => a.type === "CAT");
    const totalQuestions = attempts.reduce((s, a) => s + a.total, 0);
    const totalCorrect = attempts.reduce((s, a) => s + a.correct, 0);
    const revisionQuestions = revisions.reduce((s, a) => s + a.total, 0);
    const revisionCorrect = revisions.reduce((s, a) => s + a.correct, 0);
    const daily = new Map<string, { questions: number; correct: number }>();
    for (const a of attempts) {
      const day = new Date(a.completedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" });
      const row = daily.get(day) ?? { questions: 0, correct: 0 };
      row.questions += a.total; row.correct += a.correct; daily.set(day, row);
    }
    const activity = Array.from(daily.entries()).slice(-7);
    const peak = Math.max(1, ...activity.map(([, v]) => v.questions));
    const recent = [
      ...attempts.map(a => ({ date: a.completedAt, label: a.type, accuracy: a.accuracy, score: a.score })),
      ...revisions.map(a => ({ date: a.completedAt, label: "REVISION", accuracy: a.accuracy, score: a.score })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 8);
    return { attempts, revisions, rats, cats, totalQuestions, totalCorrect, revisionQuestions, revisionCorrect, activity, peak, recent };
  }, [progress, range]);

  const coverage = lessons.length ? pct((progress.completedLessonIds.length / lessons.length) * 100) : 0;

  return <div className="content analytics-page">
    <section className="analytics-heading">
      <div><span className="badge">PERFORMANCE CENTER</span><h2>Study Analytics</h2><p>Track assessment performance, study activity, points and course coverage in one place.</p></div>
      <div className="analytics-controls">
        <button className={range === "all" ? "secondary-button active-filter" : "secondary-button"} onClick={() => setRange("all")}>All time</button>
        <button className={range === "30" ? "secondary-button active-filter" : "secondary-button"} onClick={() => setRange("30")}>Last 30 days</button>
        <button className="secondary-button" onClick={() => onRefresh(getProgress())}>Refresh</button>
      </div>
    </section>

    <section className="analytics-kpis">
      <Kpi label="Total points" value={String(progress.points)} detail="RAT, CAT and Revision points" />
      <Kpi label="Assessment accuracy" value={data.totalQuestions ? pct((data.totalCorrect / data.totalQuestions) * 100) + "%" : "0%"} detail={data.totalQuestions + " questions answered"} />
      <Kpi label="Study streak" value={String(progress.streak)} detail={progress.streak === 1 ? "day active" : "days active"} />
      <Kpi label="Course coverage" value={coverage + "%"} detail={progress.completedLessonIds.length + " of " + lessons.length + " lessons completed"} />
    </section>

    <section className="analytics-grid">
      <div className="panel analytics-panel">
        <div className="panel-heading"><div><span className="eyebrow">Assessment mix</span><h3>Sessions completed</h3></div></div>
        <MetricBar label="RAT" value={data.rats.length} detail={data.rats.length ? pct(data.rats.reduce((s,a) => s+a.accuracy,0)/data.rats.length) + "% average accuracy" : "No RAT sessions yet"} />
        <MetricBar label="CAT" value={data.cats.length} detail={data.cats.length ? pct(data.cats.reduce((s,a) => s+a.accuracy,0)/data.cats.length) + "% average accuracy" : "No CAT sessions yet"} />
        <MetricBar label="Revision" value={data.revisions.length} detail={data.revisionQuestions ? data.revisionCorrect + " correct of " + data.revisionQuestions : "No revision sessions yet"} />
      </div>
      <div className="panel analytics-panel">
        <div className="panel-heading"><div><span className="eyebrow">Activity</span><h3>Questions answered</h3></div></div>
        {data.activity.length ? <div className="activity-chart">{data.activity.map(([day, v]) => <div className="activity-column" key={day}><div className="activity-value">{v.questions}</div><div className="activity-bar-track"><i style={{height: (v.questions/data.peak)*100 + "%"}} /></div><span>{day}</span></div>)}</div> : <Empty text="Complete an assessment to start building your activity history." />}
      </div>
    </section>

    <section className="analytics-grid">
      <div className="panel analytics-panel">
        <div className="panel-heading"><div><span className="eyebrow">Curriculum</span><h3>Lesson coverage</h3></div><span className="fact-tag">{progress.completedLessonIds.length}/{lessons.length}</span></div>
        <div className="lesson-analytics-list">{lessons.map((lesson, i) => { const done = progress.completedLessonIds.includes(lesson.id); return <div className="lesson-analytics-row" key={lesson.id}><div className="lesson-analytics-index">{String(i+1).padStart(2,"0")}</div><div className="lesson-analytics-main"><strong>{lesson.title}</strong><span>{lesson.questionCount} questions in bank</span><div className="mini-progress"><i style={{width: done ? "100%" : "0%"}} /></div></div><b className={done ? "analytics-status complete" : "analytics-status"}>{done ? "Complete" : "Open"}</b></div>; })}</div>
      </div>
      <div className="panel analytics-panel">
        <div className="panel-heading"><div><span className="eyebrow">History</span><h3>Recent activity</h3></div></div>
        {data.recent.length ? <div className="recent-analytics-list">{data.recent.map((item,i) => <div className="recent-analytics-row" key={item.date+item.label+i}><div><strong>{item.label}</strong><span>{new Date(item.date).toLocaleDateString(undefined,{month:"short",day:"numeric"})} • {new Date(item.date).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}</span></div><b>{pct(item.accuracy)}%</b><small>+{item.score} pts</small></div>)}</div> : <Empty text="Completed RATs, CATs and Revision sessions will appear here." />}
      </div>
    </section>
  </div>;
}

function Kpi({label,value,detail}:{label:string;value:string;detail:string}) { return <div className="analytics-kpi"><span>{label}</span><strong>{value}</strong><small>{detail}</small></div>; }
function MetricBar({label,value,detail}:{label:string;value:number;detail:string}) { return <div className="metric-bar"><div className="metric-bar-top"><strong>{label}</strong><span>{value} session{value===1?"":"s"}</span></div><div className="metric-track"><i style={{width: Math.min(100,value*10)+"%"}} /></div><small>{detail}</small></div>; }
function Empty({text}:{text:string}) { return <div className="analytics-empty">{text}</div>; }
