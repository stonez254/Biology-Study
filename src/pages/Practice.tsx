import { useEffect, useMemo, useRef, useState } from "react";
import { questions, type Question } from "../data/questions";
import { selectPracticeQuestions } from "../data/questionSelector";
import { getProgress, recordPracticeSession, type StudyProgress } from "../data/progress";

type Props = { onExit: () => void; onProgress?: (progress: StudyProgress) => void };

const SESSION_SIZES = [5, 10, 20] as const;
const PRACTICE_MODES = ["Adaptive", "Weak Areas", "Mixed", "Difficulty Focus", "Topic Focus"] as const;
type PracticeMode = (typeof PRACTICE_MODES)[number];
const RECENT_KEY = "biology-practice-recent-question-ids";
const RECENT_LIMIT = 100;

function getRecentIds(): string[] {
  try {
    const value = JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]");
    return Array.isArray(value) ? value.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}

function rememberQuestionIds(ids: string[]) {
  const next = [...ids, ...getRecentIds()].filter((id, index, all) => all.indexOf(id) === index).slice(0, RECENT_LIMIT);
  localStorage.setItem(RECENT_KEY, JSON.stringify(next));
}

export default function Practice({ onExit, onProgress }: Props) {
  const topics = useMemo(() => Array.from(new Set(questions.map(q => q.topic))).sort(), []);
  const difficulties = ["All", "Easy", "Medium", "Hard"] as const;
  const [mode, setMode] = useState<PracticeMode>("Adaptive");
  const [topic, setTopic] = useState("All");
  const [difficulty, setDifficulty] = useState<(typeof difficulties)[number]>("All");
  const [size, setSize] = useState<number>(10);
  const [session, setSession] = useState<Question[]>([]);
  const [current, setCurrent] = useState(0);
  const [answer, setAnswer] = useState<number | null>(null);
  const [correct, setCorrect] = useState(0);
  const [correctQuestionIds, setCorrectQuestionIds] = useState<string[]>([]);
  const [incorrectQuestionIds, setIncorrectQuestionIds] = useState<string[]>([]);
  const [timedOutQuestionIds, setTimedOutQuestionIds] = useState<string[]>([]);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [finished, setFinished] = useState(false);
  const [timeLeft, setTimeLeft] = useState(10);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const recordedSession = useRef(false);

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {}
  };

  useEffect(() => {
    const syncFullscreen = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", syncFullscreen);
    return () => document.removeEventListener("fullscreenchange", syncFullscreen);
  }, []);

  const pool = useMemo(() => questions.filter(q =>
    (topic === "All" || q.topic === topic) &&
    (difficulty === "All" || q.difficulty === difficulty)
  ), [topic, difficulty]);

  const start = () => {
    const recent = new Set(getRecentIds());
    const progress = getProgress();
    const priorityScores = new Map<string, number>();
    const lessonFailures = new Map<string, number>();
    const subtopicFailures = new Map<string, number>();
    const typeFailures = new Map<string, number>();
    const difficultyFailures = new Map<string, number>();

    for (const practice of progress.practiceSessions ?? []) {
      for (const id of practice.incorrectQuestionIds ?? []) {
        priorityScores.set(id, (priorityScores.get(id) ?? 0) + 6);
        const question = questions.find(q => q.id === id);
        if (!question) continue;
        lessonFailures.set(question.lessonId, (lessonFailures.get(question.lessonId) ?? 0) + 1);
        const subtopic = question.subtopic ?? question.topic;
        subtopicFailures.set(subtopic, (subtopicFailures.get(subtopic) ?? 0) + 1);
        const type = question.questionType ?? "concept";
        typeFailures.set(type, (typeFailures.get(type) ?? 0) + 1);
        difficultyFailures.set(question.difficulty, (difficultyFailures.get(question.difficulty) ?? 0) + 1);
      }
      for (const id of practice.timedOutQuestionIds ?? []) {
        priorityScores.set(id, (priorityScores.get(id) ?? 0) + 3);
      }
      for (const id of practice.correctQuestionIds ?? []) {
        priorityScores.set(id, Math.max(0, (priorityScores.get(id) ?? 0) - 2));
      }
    }

    for (const question of pool) {
      let score = 0;
      const lesson = lessonFailures.get(question.lessonId) ?? 0;
      const subtopic = subtopicFailures.get(question.subtopic ?? question.topic) ?? 0;
      const type = typeFailures.get(question.questionType ?? "concept") ?? 0;
      const difficulty = difficultyFailures.get(question.difficulty) ?? 0;

      if (mode === "Adaptive") {
        score += lesson * 2 + subtopic * 3 + type + difficulty;
        score += priorityScores.get(question.id) ?? 0;
      } else if (mode === "Weak Areas") {
        score += lesson * 4 + subtopic * 5 + type * 2 + difficulty * 2;
        score += priorityScores.get(question.id) ?? 0;
      } else if (mode === "Difficulty Focus") {
        score += difficulty * 3;
        if (difficulty === 0 && question.difficulty === "Hard") score += 2;
      } else if (mode === "Topic Focus") {
        score += question.topic === topic ? 8 : 0;
      }

      if (mode !== "Mixed") priorityScores.set(question.id, score);
    }

    const freshPool = pool.filter(question => !recent.has(question.id));
    const source = freshPool.length >= Math.min(size, pool.length) ? freshPool : [...freshPool, ...pool.filter(question => recent.has(question.id))];
    const chosen = selectPracticeQuestions(source, Math.min(size, pool.length), recent, priorityScores);
    rememberQuestionIds(chosen.map(question => question.id));
    setSession(chosen);
    setCurrent(0);
    setAnswer(null);
    setCorrect(0);
    setCorrectQuestionIds([]);
    setIncorrectQuestionIds([]);
    setTimedOutQuestionIds([]);
    setCombo(0);
    setFinished(false);
    recordedSession.current = false;
    setTimeLeft(10);
  };

  const choose = (index: number) => {
    if (answer !== null || !session.length) return;
    const isCorrect = index === session[current].answer;
    setAnswer(index);
    if (isCorrect) {
      setCorrect(v => v + 1);
      setCorrectQuestionIds(v => v.includes(session[current].id) ? v : [...v, session[current].id]);
      setCombo(v => { const next = v + 1; setMaxCombo(m => Math.max(m, next)); return next; });
    } else {
      setIncorrectQuestionIds(v => v.includes(session[current].id) ? v : [...v, session[current].id]);
      setCombo(0);
    }
  };

  useEffect(() => {
    if (!session.length || finished || answer !== null) return;
    setTimeLeft(10);
    const timer = window.setInterval(() => {
      setTimeLeft(value => {
        if (value <= 1) {
          window.clearInterval(timer);
          setAnswer(-1);
          setTimedOutQuestionIds(v => v.includes(session[current].id) ? v : [...v, session[current].id]);
          setIncorrectQuestionIds(v => v.includes(session[current].id) ? v : [...v, session[current].id]);
          setCombo(0);
          return 0;
        }
        return value - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [current, session.length, finished, answer]);

  const next = () => {
    if (current >= session.length - 1) {
      setFinished(true);
      return;
    }
    setCurrent(v => v + 1);
    setAnswer(null);
  };

  useEffect(() => {
    if (!finished || recordedSession.current || !session.length) return;
    recordedSession.current = true;
    const result = recordPracticeSession({
      total: session.length,
      correct,
      accuracy: Math.round(correct / session.length * 100),
      maxCombo,
      questionIds: session.map(question => question.id),
      correctQuestionIds,
      incorrectQuestionIds,
      timedOutQuestionIds,
      topic: topic === "All" ? "Mixed" : topic,
      difficulty: difficulty === "All" ? "Mixed" : difficulty,
    });
    onProgress?.(result);
  }, [finished, session, correct, maxCombo, correctQuestionIds, incorrectQuestionIds, timedOutQuestionIds, topic, difficulty, onProgress]);

  useEffect(() => {
    if (answer !== -1) return;
    const advance = window.setTimeout(() => next(), 450);
    return () => window.clearTimeout(advance);
  }, [answer]);

  if (!session.length) {
    return <div className="content">
      <div className="practice-hero panel">
        <span className="badge">PRACTICE LAB</span>
        <h2>Train without pressure.</h2>
        <p>Practice questions are for learning only. They do not award RAT, CAT, or revision points.</p>
        <div className="practice-controls">
          <label>Mode
            <select value={mode} onChange={e => setMode(e.target.value as PracticeMode)}>
              {PRACTICE_MODES.map(item => <option key={item}>{item}</option>)}
            </select>
          </label>
          <label>Topic
            <select value={topic} onChange={e => setTopic(e.target.value)}>
              <option>All</option>
              {topics.map(t => <option key={t}>{t}</option>)}
            </select>
          </label>
          <label>Difficulty
            <select value={difficulty} onChange={e => setDifficulty(e.target.value as typeof difficulty)}>
              {difficulties.map(d => <option key={d}>{d}</option>)}
            </select>
          </label>
          <label>Questions
            <select value={size} onChange={e => setSize(Number(e.target.value))}>
              {SESSION_SIZES.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </label>
        </div>
        <div className="practice-start">
          <div><strong>{pool.length}</strong><span>matching questions available</span></div>
          <button className="primary-button" disabled={!pool.length} onClick={start}>Start Practice</button>
          <button className="secondary-button" onClick={onExit}>Back to dashboard</button>
        </div>
      </div>
      <div className="panel practice-mode-help">
        <strong>{mode}</strong>
        <span>{mode === "Adaptive" ? "Uses your recent mistakes while keeping sessions balanced." : mode === "Weak Areas" ? "Strongly targets lessons, subtopics and question types where you struggle." : mode === "Mixed" ? "Uses the normal balanced selection without performance targeting." : mode === "Difficulty Focus" ? "Uses your selected difficulty as the main practice focus." : "Prioritizes the topic selected above."}</span>
      </div>
      <div className="practice-rules">
        <div className="panel"><strong>Instant feedback</strong><span>See whether you are right immediately.</span></div>
        <div className="panel"><strong>Combo streak</strong><span>Build a correct-answer streak during the session.</span></div>
        <div className="panel"><strong>Learn from mistakes</strong><span>Every answer reveals its explanation and reference.</span></div>
      </div>
    </div>;
  }

  if (finished) {
    const accuracy = Math.round(correct / session.length * 100);
    const incorrect = incorrectQuestionIds.length;
    const timedOut = timedOutQuestionIds.length;
    const category = (key: "topic" | "difficulty" | "questionType") => {
      const rows = new Map<string, { total: number; correct: number }>();
      for (const question of session) {
        const value = key === "topic" ? question.topic : key === "difficulty" ? question.difficulty : question.questionType ?? "concept";
        const row = rows.get(value) ?? { total: 0, correct: 0 };
        row.total += 1;
        if (correctQuestionIds.includes(question.id)) row.correct += 1;
        rows.set(value, row);
      }
      return Array.from(rows.entries()).map(([name, row]) => ({
        name,
        accuracy: Math.round(row.correct / row.total * 100),
        total: row.total,
      })).sort((a, b) => a.accuracy - b.accuracy);
    };
    const topicBreakdown = category("topic");
    const typeBreakdown = category("questionType");
    const difficultyBreakdown = category("difficulty");
    const weakest = [...topicBreakdown].filter(row => row.total >= 1).slice(0, 3);

    return <div className="content">
      <div className="result-card practice-result">
        <span className={accuracy >= 70 ? "badge success" : "badge warning"}>{accuracy >= 70 ? "GOOD SESSION" : "KEEP PRACTISING"}</span>
        <h2>{correct} / {session.length} correct</h2>
        <p>You reached {accuracy}% accuracy. Practice is deliberately separate from assessment scoring.</p>
        <div className="result-grid">
          <div><strong>{accuracy}%</strong><span>Accuracy</span></div>
          <div><strong>{incorrect}</strong><span>Incorrect</span></div>
          <div><strong>{timedOut}</strong><span>Timed out</span></div>
          <div><strong>{maxCombo}</strong><span>Best combo</span></div>
        </div>
        <div className="practice-result-breakdown">
          <h3>Performance breakdown</h3>
          <div className="result-grid">
            <div><strong>{topicBreakdown.find(row => row.accuracy === Math.max(...topicBreakdown.map(r => r.accuracy)))?.accuracy ?? 0}%</strong><span>Strongest topic</span></div>
            <div><strong>{weakest[0]?.accuracy ?? 0}%</strong><span>Weakest topic</span></div>
            <div><strong>{typeBreakdown[0]?.accuracy ?? 0}%</strong><span>Weakest question type</span></div>
            <div><strong>{difficultyBreakdown[0]?.accuracy ?? 0}%</strong><span>Weakest difficulty</span></div>
          </div>
        </div>
        <div className="practice-breakdown-list">
          <h3>Topics to revisit</h3>
          {weakest.length ? weakest.map(row => <div key={row.name}><span>{row.name}</span><strong>{row.accuracy}% <small>({row.total})</small></strong></div>) : <p>No weak topic identified yet.</p>}
        </div>
        <div className="result-actions">
          <button className="secondary-button" onClick={onExit}>Back to dashboard</button>
          <button className="secondary-button" onClick={() => { setMode("Weak Areas"); start(); }}>Practice weak areas</button>
          <button className="primary-button" onClick={start}>Practice again</button>
        </div>
      </div>
    </div>;
  }

  const q = session[current];
  const timedOut = answer === -1;
  const answeredCorrectly = answer !== null && answer >= 0 && answer === q.answer;
  const timerTone = timeLeft >= 8 ? "green" : timeLeft >= 6 ? "amber" : timeLeft >= 3 ? "yellow" : "red";

  return <div className="content">
    <div className="test-header">
      <div>
        <span className="eyebrow">Practice Lab</span>
        <h2>Question {current + 1} of {session.length}</h2>
        <p>{q.topic} • {q.difficulty} • No assessment points</p>
      </div>
      <div className="test-header-actions">
        <button className="secondary-button fullscreen-button" onClick={toggleFullscreen} aria-label={isFullscreen ? "Exit full screen" : "Open full screen"}>
          {isFullscreen ? "⛶ Exit Full Screen" : "⛶ Full Screen"}
        </button>
              <div className={`practice-combo ${combo > 0 ? "combo-active" : ""}`} aria-label={`Combo ${combo}`}><span>COMBO</span><strong className="combo-flame"><span aria-hidden="true">🔥</span><b>{combo}</b></strong></div>
      </div>
    </div>
    <div className="question-layout">
      <div className="question-card practice-question">
        <div className="question-meta"><span>{correct} correct so far</span><span>{answer === null ? "Choose an answer" : timedOut ? "Time expired" : answeredCorrectly ? "Correct!" : "Not quite"}</span></div>
        {answer === null && <div className={`practice-timer ${timerTone}`} aria-live="polite"><div className="practice-timer-track" aria-hidden="true"><div className="practice-timer-string" style={{ width: `${timeLeft * 10}%` }}><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /></div></div><span>{timeLeft}s</span></div>}
        <h3>{q.prompt}</h3>
        <div className="options">
          {q.options.map((option, index) => {
            const selected = answer === index;
            const right = answer !== null && index === q.answer;
            const wrong = selected && !right;
            return <button key={option} className={selected ? "option selected" : "option"} data-right={right} data-wrong={wrong} onClick={() => choose(index)}>
              <span>{String.fromCharCode(65 + index)}</span>{option}
            </button>;
          })}
        </div>
        {answer !== null && <div className={answeredCorrectly ? "practice-feedback correct" : "practice-feedback wrong"}>
          <strong>{timedOut ? "Time expired." : answeredCorrectly ? "Correct answer." : "Review this one."}</strong>
          <p>{timedOut ? "This question was passed automatically. Your combo has been reset." : <><b>Answer:</b> {q.options[q.answer]}</>}</p>
          <p>{q.explanation}</p>
          <small>{q.reference}</small>
        </div>}
        <div className="question-actions">
          <button className="secondary-button" onClick={onExit}>Exit practice</button>
          {answer !== null && <button className="primary-button" onClick={next}>{current === session.length - 1 ? "Finish Practice" : "Next Question"}</button>}
        </div>
      </div>
    </div>
  </div>;
}
