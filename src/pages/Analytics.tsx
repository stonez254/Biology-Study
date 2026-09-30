import { useEffect, useMemo, useState } from "react";
import { getProgress, type StudyProgress } from "../data/progress";
import { questions } from "../data/questions";
import { lessons } from "../data/lessons";
import { fetchLeaderboard, type LeaderboardEntry } from "../data/api";

type AnalyticsProps = { progress: StudyProgress; onRefresh: (progress: StudyProgress) => void };
type Breakdown = { total: number; correct: number };

const SIMULATION_STARTED_KEY = "biology-study:leaderboard-simulation-started-at";

function getSimulationStartedAt() {
  if (typeof window === "undefined") return Date.now();
  const stored = window.localStorage.getItem(SIMULATION_STARTED_KEY);
  const parsed = stored ? Number(stored) : NaN;
  if (Number.isFinite(parsed) && parsed > 0) return parsed;
  const startedAt = Date.now();
  window.localStorage.setItem(SIMULATION_STARTED_KEY, String(startedAt));
  return startedAt;
}

function pct(value: number) { return Math.round(value); }

export default function Analytics({ progress, onRefresh }: AnalyticsProps) {
  const [activityTick, setActivityTick] = useState(0);
  const [range, setRange] = useState<"all" | "30">("all");
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [leaderboardTotal, setLeaderboardTotal] = useState(0);
  const [leaderboardLoading, setLeaderboardLoading] = useState(true);
  const [leaderboardError, setLeaderboardError] = useState("");
  const [leaderboardMinPoints, setLeaderboardMinPoints] = useState(0);

  const loadLeaderboard = async () => {
    setLeaderboardLoading(true);
    setLeaderboardError("");
    try {
      const result = await fetchLeaderboard();
      setLeaderboard(result.learners);
      setLeaderboardTotal(result.totalLearners);
    } catch (error) {
      setLeaderboardError(error instanceof Error ? error.message : "Unable to load the leaderboard.");
    } finally {
      setLeaderboardLoading(false);
    }
  };

  useEffect(() => { void loadLeaderboard(); }, []);
  useEffect(() => {
    const timer = window.setInterval(() => setActivityTick(v => v + 1), 15000);
    return () => window.clearInterval(timer);
  }, []);

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

    const practiceAttempts = (progress.practiceSessions ?? []).filter(s => range === "all" || new Date(s.completedAt).getTime() >= cutoff);
    const practiceTypeMap = new Map<string, Breakdown>();
    const practiceDifficultyMap = new Map<string, Breakdown>();
    const practiceLessonMap = new Map<string, Breakdown>();
    const practiceSubtopicMap = new Map<string, Breakdown>();

    for (const session of practiceAttempts) {
      const correctIds = new Set(session.correctQuestionIds ?? []);
      const incorrectIds = new Set(session.incorrectQuestionIds ?? []);
      for (const id of session.questionIds ?? []) {
        const q = questionMap.get(id);
        if (!q || (!session.correctQuestionIds && !session.incorrectQuestionIds)) continue;
        const answeredCorrectly = correctIds.has(id);
        const answeredIncorrectly = incorrectIds.has(id) || !answeredCorrectly;
        if (!answeredCorrectly && !answeredIncorrectly) continue;
        const maps: [Map<string, Breakdown>, string][] = [
          [practiceTypeMap, q.questionType ?? "concept"],
          [practiceDifficultyMap, q.difficulty],
          [practiceLessonMap, q.lessonId],
          [practiceSubtopicMap, q.subtopic ?? "General"],
        ];
        for (const [map, key] of maps) {
          const row = map.get(key) ?? { total: 0, correct: 0 };
          row.total += 1;
          if (answeredCorrectly) row.correct += 1;
          map.set(key, row);
        }
      }
    }

    const lessonNames = new Map(lessons.map(l => [l.id, l.title]));
    const weakLessons = rank(lessonMap).slice(0, 5).map(item => ({ ...item, name: lessonNames.get(item.key) ?? item.key }));
    const weakSubtopics = rank(subtopicMap).slice(0, 5);
    const typePerformance = rank(typeMap).sort((a, b) => a.key.localeCompare(b.key));
    const difficultyPerformance = rank(difficultyMap).sort((a, b) => ["Easy", "Medium", "Hard"].indexOf(a.key) - ["Easy", "Medium", "Hard"].indexOf(b.key));
    const practiceWeakLessons = rank(practiceLessonMap).slice(0, 5).map(item => ({ ...item, name: lessonNames.get(item.key) ?? item.key }));
    const practiceWeakSubtopics = rank(practiceSubtopicMap).slice(0, 5);
    const practiceTypePerformance = rank(practiceTypeMap).sort((a, b) => a.key.localeCompare(b.key));
    const practiceDifficultyPerformance = rank(practiceDifficultyMap).sort((a, b) => ["Easy", "Medium", "Hard"].indexOf(a.key) - ["Easy", "Medium", "Hard"].indexOf(b.key));

    return { attempts, revisions, rats, cats, totalQuestions, totalCorrect, trend, recent, daily, weakLessons, weakSubtopics, typePerformance, difficultyPerformance, practiceAttempts, practiceWeakLessons, practiceWeakSubtopics, practiceTypePerformance, practiceDifficultyPerformance };
  }, [progress, range]);

  const simulatedProfiles = useMemo(() => {
    const names = [
      "Brian Otieno","Sharon Wanjiku","Kevin Mwangi","Faith Achieng","Ian Kamau","Mercy Njeri","Dennis Ouma","Lydia Wambui","Collins Kiptoo","Brenda Atieno",
      "Victor Mutua","Naomi Chebet","Allan Odhiambo","Cynthia Wairimu","Martin Onyango","Diana Jepchirchir","Sammy Kiplagat","Ann Muthoni","Clinton Ochieng","Joyce Akinyi",
      "Elvis Maina","Purity Wekesa","Arnold Barasa","Maureen Adhiambo","Eric Kiptoo","Stella Nyambura","George Okello","Irene Moraa","Nelson Kariuki","Ruth Chepngeno",
      "Dennis Kamau","Angela Akinyi","Mark Ochieng","Mercy Wambui","Felix Otieno","Brenda Wairimu","Brian Kiptoo","Janet Achieng","Victor Onyango","Lucy Njeri",
      "Allan Mwangi","Faith Wekesa","Samuel Okello","Doris Atieno","Kevin Ouma","Mary Chebet","Daniel Mutua","Caroline Njeri","Peter Odhiambo","Susan Wanjiku"
    ];

    // Simulated activity awards exactly 10 points every 5 minutes.
    // The leading three start close together with different initial delays,
    // allowing their positions to rotate naturally as their award cycles catch up.
    const fiveMinutes = 5 * 60 * 1000;
    const elapsedMs = Math.max(0, Date.now() - getSimulationStartedAt());
    const elapsedPeriods = Math.floor(elapsedMs / fiveMinutes);

    const basePoints = [
      873, 865, 857, 751, 724, 698, 671, 645, 619, 592,
      568, 544, 521, 498, 476, 454, 433, 412, 392, 372,
      353, 335, 317, 300, 283, 267, 251, 235, 220, 205,
      190, 176, 162, 149, 136, 124, 112, 100, 90, 80,
      70, 60, 50, 45, 40, 35, 30, 25, 20, 15
    ];

    // Different initial delays for the top three:
    // #1 waits 10 minutes, #2 waits 5 minutes, #3 starts immediately.
    const initialDelayPeriods = [2, 1, 0];

    return names.map((name, i) => {
      const delay = i < 3 ? initialDelayPeriods[i] : 0;
      const earnedPeriods = Math.max(0, elapsedPeriods - delay);
      const points = basePoints[i] + earnedPeriods * 10;
      // Keep lesson totals proportional to points so simulated records remain believable.
      const lessonsCompleted = i === 0
        ? Math.max(32, Math.round(points / 27.3))
        : Math.max(1, Math.round(points / 27.3));
      const accuracy = 60 + ((i * 7 + Math.floor(points / 10)) % 11);
      const streak = 2 + ((i * 3 + Math.floor(points / 20)) % 19);
      const username = name.toLowerCase().replace(/[^a-z]+/g, "").slice(0, 18);

      return {
        rank: 0,
        username,
        points,
        streak,
        lessonsCompleted,
        accuracy,
        displayName: name
      };
    });
  }, [activityTick]);
  const displayedLeaderboard = useMemo(() => {
    const real = leaderboard.map(item => ({ ...item, accuracy: null, displayName: item.username }));
    return [...real, ...simulatedProfiles]
      .sort((a,b) => b.points-a.points || b.streak-a.streak || b.lessonsCompleted-a.lessonsCompleted || a.username.localeCompare(b.username))
      .map((item, index) => ({ ...item, rank: index + 1 }));
  }, [leaderboard, simulatedProfiles]);
  const coverage = lessons.length ? pct((progress.completedLessonIds.length / lessons.length) * 100) : 0;
  const hasBreakdown = data.attempts.some(a => (a.correctQuestionIds ?? []).length > 0);
  const practice = progress.practiceSessions ?? [];
  const bestPracticeAccuracy = practice.length ? Math.max(...practice.map(s => s.accuracy)) : 0;
  const bestPracticeCombo = practice.length ? Math.max(...practice.map(s => s.maxCombo)) : 0;
  const bestAssessmentAccuracy = data.attempts.length ? Math.max(...data.attempts.map(a => a.accuracy)) : 0;
  const recommendations = buildRecommendations(data, progress);
  const filteredLeaderboard = useMemo(
    () => leaderboard.filter(learner => learner.points >= leaderboardMinPoints),
    [leaderboard, leaderboardMinPoints],
  );

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

    <section className="analytics-grid">
      <BreakdownPanel title="Practice weak lessons" eyebrow="Practice intelligence" items={data.practiceWeakLessons.map(x => ({ name: x.name, accuracy: x.accuracy, detail: x.correct + " correct of " + x.total }))} empty="Complete a new Practice session to build lesson-level practice data." />
      <BreakdownPanel title="Practice weak subtopics" eyebrow="Practice intelligence" items={data.practiceWeakSubtopics.map(x => ({ name: x.key, accuracy: x.accuracy, detail: x.correct + " correct of " + x.total }))} empty="Complete a new Practice session to build subtopic-level practice data." />
    </section>

    <section className="analytics-grid">
      <BreakdownPanel title="Practice question types" eyebrow="Practice intelligence" items={data.practiceTypePerformance.map(x => ({ name: x.key, accuracy: x.accuracy, detail: x.correct + " correct of " + x.total }))} empty="Complete a new Practice session to see which thinking skills need more work." />
      <BreakdownPanel title="Practice difficulty" eyebrow="Practice intelligence" items={data.practiceDifficultyPerformance.map(x => ({ name: x.key, accuracy: x.accuracy, detail: x.correct + " correct of " + x.total }))} empty="Complete a new Practice session to see performance by difficulty." />
    </section>

    {!hasBreakdown && data.attempts.length > 0 && <div className="analytics-note">Detailed breakdowns start with your new RAT/CAT attempts. Older attempts are still included in overall accuracy, but they were saved before per-question analytics was introduced.</div>}

    <section className="panel analytics-panel leaderboard-panel">
      <div className="panel-heading">
        <div><span className="eyebrow">Community</span><h3>Learning Leaderboard</h3></div>
        <span className="fact-tag">{leaderboardTotal + simulatedProfiles.length} registered learner{leaderboardTotal + simulatedProfiles.length === 1 ? "" : "s"}</span>
      </div>
      <p className="leaderboard-note">See how learners are progressing across Biology-Study.</p>
      {leaderboardLoading ? <Empty text="Loading the learning leaderboard..." /> :
        leaderboardError ? <div className="analytics-empty">{leaderboardError}<button className="secondary-button leaderboard-retry" onClick={()=>void loadLeaderboard()}>Retry</button></div> :
        displayedLeaderboard.length ? <div className="leaderboard-list">{displayedLeaderboard.map((learner, index) =>
          <div className={"leaderboard-row" + (index < 3 ? " top-rank" : "")} key={learner.username+"-"+learner.rank}>
            <div className="leaderboard-rank">{learner.rank === 1 ? "🥇" : learner.rank === 2 ? "🥈" : learner.rank === 3 ? "🥉" : String(learner.rank).padStart(2,"0")}</div>
            <div className="leaderboard-student"><strong>{learner.displayName?.startsWith("@") ? learner.displayName : "@" + learner.username}</strong><span>{learner.lessonsCompleted} lesson{learner.lessonsCompleted === 1 ? "" : "s"} completed • 🔥 {learner.streak} day{learner.streak === 1 ? "" : "s"} streak{learner.accuracy!==null&&learner.accuracy!==undefined ? " • "+learner.accuracy+"% accuracy" : ""}</span></div>
            <div className="leaderboard-points"><strong>{learner.points}</strong><span>points</span></div>
          </div>
        )}</div> : <Empty text="No registered learners yet." />}
    </section>

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
        <div className="panel-heading"><div><span className="eyebrow">Personal records</span><h3>Your best results</h3></div></div>
        <div className="records-grid">
          <Record label="Best assessment accuracy" value={bestAssessmentAccuracy + "%"} />
          <Record label="Best Practice accuracy" value={bestPracticeAccuracy + "%"} />
          <Record label="Best Practice combo" value={"🔥 " + bestPracticeCombo} />
          <Record label="Practice sessions" value={String(practice.length)} />
        </div>
      </div>
      <div className="panel analytics-panel">
        <div className="panel-heading"><div><span className="eyebrow">Smart guidance</span><h3>Recommended next steps</h3></div></div>
        <div className="recommendation-list">{recommendations.map((item, i) => <div className="recommendation-row" key={item.title}><span>{String(i + 1).padStart(2, "0")}</span><div><strong>{item.title}</strong><p>{item.detail}</p></div></div>)}</div>
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

function Record({label,value}:{label:string;value:string}) { return <div className="record-card"><span>{label}</span><strong>{value}</strong></div>; }
function buildRecommendations(data: any, progress: StudyProgress) {
  const items:{title:string;detail:string}[]=[];
  if (data.weakLessons.length) items.push({title:"Review " + data.weakLessons[0].name, detail:"Your tracked accuracy here is " + pct(data.weakLessons[0].accuracy) + "%. Revisit the lesson and use Practice before your next assessment."});
  if (data.weakSubtopics.length) items.push({title:"Drill " + data.weakSubtopics[0].key, detail:"This subtopic currently has " + pct(data.weakSubtopics[0].accuracy) + "% tracked accuracy. Target it with focused practice."});
  const weakestType=data.typePerformance[0];
  if (weakestType) items.push({title:"Practise " + weakestType.key + " questions", detail:"This question type is currently at " + pct(weakestType.accuracy) + "% accuracy across tracked attempts."});
  const weakestDifficulty=data.difficultyPerformance.slice().sort((a:any,b:any)=>a.accuracy-b.accuracy)[0];
  if (weakestDifficulty) items.push({title:"Build confidence with " + weakestDifficulty.key + " questions", detail:"Your tracked " + weakestDifficulty.key.toLowerCase() + " accuracy is " + pct(weakestDifficulty.accuracy) + "%. Use Practice to strengthen it."});
  if (progress.missedQuestionIds.length) items.push({title:"Clear the Revision queue", detail:progress.missedQuestionIds.length + " missed question" + (progress.missedQuestionIds.length===1?"":"s") + " are waiting to be mastered."});
  if (!items.length) items.push({title:"Start building your data", detail:"Complete a RAT, CAT or Practice session and Analytics will turn your results into personalised study guidance."});
  return items.slice(0,4);
}
function Kpi({label,value,detail}:{label:string;value:string;detail:string}) { return <div className="analytics-kpi"><span>{label}</span><strong>{value}</strong><small>{detail}</small></div>; }
function MetricBar({label,value,detail}:{label:string;value:number;detail:string}) { return <div className="metric-bar"><div className="metric-bar-top"><strong>{label}</strong><span>{value} session{value===1?"":"s"}</span></div><div className="metric-track"><i style={{width: Math.min(100,value*10)+"%"}} /></div><small>{detail}</small></div>; }
function BreakdownPanel({title,eyebrow,items,empty}:{title:string;eyebrow:string;items:{name:string;accuracy:number;detail:string}[];empty:string}) {
  return <div className="panel analytics-panel"><div className="panel-heading"><div><span className="eyebrow">{eyebrow}</span><h3>{title}</h3></div></div>{items.length ? <div className="breakdown-list">{items.map(item => <div className="breakdown-row" key={item.name}><div><strong>{item.name}</strong><span>{item.detail}</span></div><div className="breakdown-meter"><i style={{width: Math.max(4, item.accuracy) + "%" }} /></div><b>{pct(item.accuracy)}%</b></div>)}</div> : <Empty text={empty} />}</div>;
}
function Empty({text}:{text:string}) { return <div className="analytics-empty">{text}</div>; }
