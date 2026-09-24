import { useEffect, useMemo, useState } from "react";
import { questions, type Question } from "../data/questions";
import { selectPracticeQuestions } from "../data/questionSelector";
import { getProgress, recordPracticeSession, type StudyProgress } from "../data/progress";

type Props = { onExit: () => void; onProgress?: (progress: StudyProgress) => void };

const SESSION_SIZES = [5, 10, 20] as const;
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
  const [topic, setTopic] = useState("All");
  const [difficulty, setDifficulty] = useState<(typeof difficulties)[number]>("All");
  const [size, setSize] = useState<number>(10);
  const [session, setSession] = useState<Question[]>([]);
  const [current, setCurrent] = useState(0);
  const [answer, setAnswer] = useState<number | null>(null);
  const [correct, setCorrect] = useState(0);
  const [combo, setCombo] = useState(0);\n  const [maxCombo, setMaxCombo] = useState(0);
  const [finished, setFinished] = useState(false);
  const [timeLeft, setTimeLeft] = useState(10);

  const pool = useMemo(() => questions.filter(q =>
    (topic === "All" || q.topic === topic) &&
    (difficulty === "All" || q.difficulty === difficulty)
  ), [topic, difficulty]);

  const start = () => {
    const recent = new Set(getRecentIds());
    const freshPool = pool.filter(question => !recent.has(question.id));
    const source = freshPool.length >= Math.min(size, pool.length) ? freshPool : [...freshPool, ...pool.filter(question => recent.has(question.id))];
    const chosen = selectPracticeQuestions(source, Math.min(size, pool.length));
    rememberQuestionIds(chosen.map(question => question.id));
    setSession(chosen);
    setCurrent(0);
    setAnswer(null);
    setCorrect(0);
    setCombo(0);
    setFinished(false);
    setTimeLeft(10);
  };

  const choose = (index: number) => {
    if (answer !== null || !session.length) return;
    const isCorrect = index === session[current].answer;
    setAnswer(index);
    if (isCorrect) {
      setCorrect(v => v + 1);
      setCombo(v => { const next = v + 1; setMaxCombo(m => Math.max(m, next)); return next; });
    } else {
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
      <div className="practice-rules">
        <div className="panel"><strong>Instant feedback</strong><span>See whether you are right immediately.</span></div>
        <div className="panel"><strong>Combo streak</strong><span>Build a correct-answer streak during the session.</span></div>
        <div className="panel"><strong>Learn from mistakes</strong><span>Every answer reveals its explanation and reference.</span></div>
      </div>
    </div>;
  }

  if (finished) {
    const accuracy = Math.round(correct / session.length * 100);
    return <div className="content">
      <div className="result-card practice-result">
        <span className={accuracy >= 70 ? "badge success" : "badge warning"}>{accuracy >= 70 ? "GOOD SESSION" : "KEEP PRACTISING"}</span>
        <h2>{correct} / {session.length} correct</h2>
        <p>You reached {accuracy}% accuracy. Practice is deliberately separate from assessment scoring.</p>
        <div className="result-grid">
          <div><strong>{accuracy}%</strong><span>Accuracy</span></div>
          <div><strong>{session.length}</strong><span>Questions</span></div>
          <div><strong>{maxCombo}</strong><span>Best combo</span></div>
        </div>
        <div className="result-actions">
          <button className="secondary-button" onClick={onExit}>Back to dashboard</button>
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
      <div className={`practice-combo ${combo > 0 ? "combo-active" : ""}`} aria-label={`Combo ${combo}`}><span>COMBO</span><strong className="combo-flame"><span aria-hidden="true">🔥</span><b>{combo}</b></strong></div>
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
