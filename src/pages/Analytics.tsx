import { useMemo, useState } from "react";
import { getProgress, type StudyProgress } from "../data/progress";
import { questions } from "../data/questions";
import { lessons } from "../data/lessons";

type AnalyticsProps = { progress: StudyProgress; onRefresh: (progress: StudyProgress) => void };
type Breakdown = { total: number; correct: number };

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

    const daily = new Map<string, { questions: number; correct: number }>();
    for (const a of attempts) {
      const day = new Date(a.completedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" });
      const row = daily.get(day) ?? { questions: 0, correct: 0 };
      row.questions += a.total;
      row.correct += a.correct;
      daily.set(day, row);
    }

    const trend = attempts.slice().sort((a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime()).slice(-8);
    const recent = [
      ...attempts.map(a => ({ date: a.completedAt, label: a.type, accuracy: a.accuracy, score: a.score })),
      ...revisions.map(a => ({ date: a.completedAt, label: "REVISION", accuracy: a.accuracy, score: a.score })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 8);

    const questionMap = new Map(questions.map(q => [q.id, q]));
    const typeMap = new Map<string, Breakdown>();
    const difficultyMap = new Map<string, Breakdown>();
    const lessonMap = new Map<string, Breakdown>();
    const subtopicMap = new Map<string, Breakdown>();

    for (const attempt of attempts) {
      const correctIds = new Set(attempt.correctQuestionIds ?? []);
      for (const id of attempt.questionIds ?? []) {
        const q = questionMap.get(id);
        if (!q || !attempt.correctQuestionIds) continue;
        const maps: [Map<string, Breakdown>, string][] = [
          [typeMap, q.questionType ?? "concept"],
          [difficultyMap, q.difficulty],
          [lessonMap, q.lessonId],
          [subtopicMap, q.subtopic ?? "General"],
        ];
        for (const [map, key] of maps) {
          const row = map.get(key) ?? { total: 0, correct: 0 };
          row.total += 1;
          if (correctIds.has(id)) row.correct += 1;
          map.set(key, row);
        }
      }
    }

    const rank = (map: Map<string, Breakdown>) => Array.from(map.entries())
      .map(([key, value]) => ({ key, ...value, accuracy: value.total ? (value.correct / value.total) * 100 : 0 }))
      .filter(item => item.total >= 2)
      .sort((a, b) => a.accuracy - b.accuracy || b.total - a.total);

    const lessonNames = new Map(lessons.map(l => [l.id, l.title]));
    const weakLessons = rank(lessonMap).slice(0, 5).map(item => ({ ...item, name: lessonNames.get(item.key) ?? item.key }));
    const weakSubtopics = rank(subtopicMap).slice(0, 5);
    const typePerformance = rank(typeMap).sort((a, b) => a.key.localeCompare(b.key));
    const difficultyPerformance = rank(difficultyMap).sort((a, b) => ["Easy", "Medium", "Hard"].indexOf(a.key) - ["Easy", "Medium", "Hard"].indexOf(b.key));

    return { attempts, revisions, rats, cats, totalQuestions, totalCorrect, trend, recent, daily, weakLessons, weakSubtopics, typePerformance, difficultyPerformance };
  }, [progress, range]);

  const coverage = lessons.length ? pct((progress.completedLessonIds.length / lessons.length) * 100) : 0;
  const hasBreakdown = data.attempts.some(a => (a.correctQuestionIds ?? []).length > 0);\n  const practice = progress.practiceSessions ?? [];\n  const bestPracticeAccuracy = practice.length ? Math.max(...practice.map(s => s.accuracy)) : 0;\n  const bestPracticeCombo = practice.length ? Math.max(...practice.map(s => s.maxCombo)) : 0;\n  const bestAssessmentAccuracy = data.attempts.length ? Math.max(...data.attempts.map(a => a.accuracy)) : 0;\n  const recommendations = buildRecommendations(data, progress);

  return <div className="content analytics-page">
    <section className="analytics-heading">
      <div><span className="badge">PERFORMANCE CENTER</span><h2>Study Analytics</h2><p>See your performance trend, weak areas, question-type accuracy and difficulty performance.</p></div>
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
        <div className="panel-heading"><div><span className="eyebrow">Performance trend</span><h3>Assessment accuracy</h3></div></div>
        {data.trend.length ? <div className="trend-chart">{data.trend.map((a, i) => <div className="trend-column" key={a.id}><strong>{pct(a.accuracy)}%</strong><div className="trend-track"><i style={{ height: Math.max(8, a.accuracy) + "%" }} /></div><span>{a.type} {i + 1}</span></div>)}</div> : <Empty text="Complete an assessment to start your accuracy trend." />}
      </div>
      <div className="panel analytics-panel">
        <div className="panel-heading"><div><span className="eyebrow">Activity</span><h3>Questions answered</h3></div></div>
        {data.daily.size ? <div className="activity-chart">{Array.from(data.daily.entries()).slice(-7).map(([day, v]) => { const peak = Math.max(1, ...Array.from(data.daily.values()).slice(-7).map(x => x.questions)); return <div className="activity-column" key={day}><div className="activity-value">{v.questions}</div><div className="activity-bar-track"><i style={{height: (v.questions / peak) * 100 + "%"}} /></div><span>{day}</span></div>; })}</div> : <Empty text="Complete an assessment to start building your activity history." />}
      </div>
    </section>

    <section className="analytics-grid">
      <BreakdownPanel title="Weak lessons" eyebrow="Focus areas" items={data.weakLessons.map(x => ({ name: x.name, accuracy: x.accuracy, detail: x.correct + " correct of " + x.total }))} empty="Not enough tracked data yet. New assessments will build this automatically." />
      <BreakdownPanel title="Weak subtopics" eyebrow="Focus areas" items={data.weakSubtopics.map(x => ({ name: x.key, accuracy: x.accuracy, detail: x.correct + " correct of " + x.total }))} empty="Not enough tracked subtopic data yet." />
    </section>

    <section className="analytics-grid">
      <BreakdownPanel title="Question-type performance" eyebrow="Thinking skills" items={data.typePerformance.map(x => ({ name: x.key, accuracy: x.accuracy, detail: x.correct + " correct of " + x.total }))} empty="Tracked question-type data will appear after new assessments." />
      <BreakdownPanel title="Difficulty performance" eyebrow="Challenge level" items={data.difficultyPerformance.map(x => ({ name: x.key, accuracy: x.accuracy, detail: x.correct + " correct of " + x.total }))} empty="Tracked difficulty data will appear after new assessments." />
    </section>

    {!hasBreakdown && data.attempts.length > 0 && <div className="analytics-note">Detailed breakdowns start with your new RAT/CAT attempts. Older attempts are still included in overall accuracy, but they were saved before per-question analytics was introduced.</div>}

    <section className="analytics-grid">
      <div className="panel analytics-panel">
        <div className="panel-heading"><div><span className="eyebrow">Assessment mix</span><h3>Sessions completed</h3></div></div>
        <MetricBar label="RAT" value={data.rats.length} detail={data.rats.length ? pct(data.rats.reduce((s,a) => s+a.accuracy,0)/data.rats.length) + "% average accuracy" : "No RAT sessions yet"} />
        <MetricBar label="CAT" value={data.cats.length} detail={data.cats.length ? pct(data.cats.reduce((s,a) => s+a.accuracy,0)/data.cats.length) + "% average accuracy" : "No CAT sessions yet"} />
        <MetricBar label="Revision" value={data.revisions.length} detail={data.revisions.length ? data.revisions.reduce((s,a)=>s+a.correct,0) + " correct of " + data.revisions.reduce((s,a)=>s+a.total,0) : "No revision sessions yet"} />
      </div>
      <div className="panel analytics-panel">
        <div className="panel-heading"><div><span className="eyebrow">History</span><h3>Recent activity</h3></div></div>
        {data.recent.length ? <div className="recent-analytics-list">{data.recent.map((item,i) => <div className="recent-analytics-row" key={item.date+item.label+i}><div><strong>{item.label}</strong><span>{new Date(item.date).toLocaleDateString(undefined,{month:"short",day:"numeric"})} • {new Date(item.date).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}</span></div><b>{pct(item.accuracy)}%</b><small>+{item.score} pts</small></div>)}</div> : <Empty text="Completed RATs, CATs and Revision sessions will appear here." />}
      </div>
    </section>

    <section className="analytics-grid">
      <div className="panel analytics-panel">
        <div className="panel-heading"><div><span className="eyebrow">Curriculum</span><h3>Lesson coverage</h3></div><span className="fact-tag">{progress.completedLessonIds.length}/{lessons.length}</span></div>
        <div className="lesson-analytics-list">{lessons.map((lesson, i) => { const done = progress.completedLessonIds.includes(lesson.id); return <div className="lesson-analytics-row" key={lesson.id}><div className="lesson-analytics-index">{String(i+1).padStart(2,"0")}</div><div className="lesson-analytics-main"><strong>{lesson.title}</strong><span>{lesson.questionCount} questions in bank</span><div className="mini-progress"><i style={{width: done ? "100%" : "0%"}} /></div></div><b className={done ? "analytics-status complete" : "analytics-status"}>{done ? "Complete" : "Open"}</b></div>; })}</div>
      </div>
    </section>
  </div>;
}

function Record({label,value}:{label:string;value:string}) { return <div className="record-card"><span>{label}</span><strong>{value}</strong></div>; }\nfunction buildRecommendations(data: any, progress: StudyProgress) {\n  const items:{title:string;detail:string}[]=[];\n  if (data.weakLessons.length) items.push({title:"Review " + data.weakLessons[0].name, detail:"Your tracked accuracy here is " + pct(data.weakLessons[0].accuracy) + "%. Revisit the lesson and use Practice before your next assessment."});\n  if (data.weakSubtopics.length) items.push({title:"Drill " + data.weakSubtopics[0].key, detail:"This subtopic currently has " + pct(data.weakSubtopics[0].accuracy) + "% tracked accuracy. Target it with focused practice."});\n  const weakestType=data.typePerformance[0];\n  if (weakestType) items.push({title:"Practise " + weakestType.key + " questions", detail:"This question type is currently at " + pct(weakestType.accuracy) + "% accuracy across tracked attempts."});\n  const weakestDifficulty=data.difficultyPerformance.slice().sort((a:any,b:any)=>a.accuracy-b.accuracy)[0];\n  if (weakestDifficulty) items.push({title:"Build confidence with " + weakestDifficulty.key + " questions", detail:"Your tracked " + weakestDifficulty.key.toLowerCase() + " accuracy is " + pct(weakestDifficulty.accuracy) + "%. Use Practice to strengthen it."});\n  if (progress.missedQuestionIds.length) items.push({title:"Clear the Revision queue", detail:progress.missedQuestionIds.length + " missed question" + (progress.missedQuestionIds.length===1?"":"s") + " are waiting to be mastered."});\n  if (!items.length) items.push({title:"Start building your data", detail:"Complete a RAT, CAT or Practice session and Analytics will turn your results into personalised study guidance."});\n  return items.slice(0,4);\n}\nfunction Kpi({label,value,detail}:{label:string;value:string;detail:string}) { return <div className="analytics-kpi"><span>{label}</span><strong>{value}</strong><small>{detail}</small></div>; }
function MetricBar({label,value,detail}:{label:string;value:number;detail:string}) { return <div className="metric-bar"><div className="metric-bar-top"><strong>{label}</strong><span>{value} session{value===1?"":"s"}</span></div><div className="metric-track"><i style={{width: Math.min(100,value*10)+"%"}} /></div><small>{detail}</small></div>; }
function BreakdownPanel({title,eyebrow,items,empty}:{title:string;eyebrow:string;items:{name:string;accuracy:number;detail:string}[];empty:string}) {
  return <div className="panel analytics-panel"><div className="panel-heading"><div><span className="eyebrow">{eyebrow}</span><h3>{title}</h3></div></div>{items.length ? <div className="breakdown-list">{items.map(item => <div className="breakdown-row" key={item.name}><div><strong>{item.name}</strong><span>{item.detail}</span></div><div className="breakdown-meter"><i style={{width: Math.max(4, item.accuracy) + "%" }} /></div><b>{pct(item.accuracy)}%</b></div>)}</div> : <Empty text={empty} />}</div>;
}
function Empty({text}:{text:string}) { return <div className="analytics-empty">{text}</div>; }
