import { useEffect, useMemo, useState } from "react";
import { questions, RAT_DURATION_SECONDS, RAT_POINTS_PER_CORRECT, RAT_QUESTION_COUNT, shuffleQuestions, type Question } from "../data/questions";
import { clearActiveRAT, getActiveRAT, hydrateQuestions, recordRATAttempt, saveActiveRAT, type StudyProgress } from "../data/progress";

type Props = { onExit: () => void; onProgress: (progress: StudyProgress) => void };

export default function RAT({ onExit, onProgress }: Props) {
  const saved = getActiveRAT();
  const restored = saved ? hydrateQuestions(saved, questions) : [];
  const [testQuestions, setTestQuestions] = useState<Question[]>(restored.length === RAT_QUESTION_COUNT ? restored : () => shuffleQuestions(questions, RAT_QUESTION_COUNT));
  const [current, setCurrent] = useState(saved && restored.length === RAT_QUESTION_COUNT ? saved.current : 0);
  const [answers, setAnswers] = useState<Record<string, number>>(saved && restored.length === RAT_QUESTION_COUNT ? saved.answers : {});
  const [secondsLeft, setSecondsLeft] = useState(saved && restored.length === RAT_QUESTION_COUNT ? saved.secondsLeft : RAT_DURATION_SECONDS);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (submitted) return;
    const timer = window.setInterval(() => setSecondsLeft(value => {
      if (value <= 1) { window.clearInterval(timer); setSubmitted(true); return 0; }
      return value - 1;
    }), 1000);
    return () => window.clearInterval(timer);
  }, [submitted]);

  useEffect(() => {
    if (submitted) return;
    saveActiveRAT({ questionIds: testQuestions.map(q => q.id), current, answers, secondsLeft, startedAt: saved?.startedAt ?? new Date().toISOString() });
  }, [answers, current, secondsLeft, submitted, testQuestions, saved?.startedAt]);

  const question = testQuestions[current];
  const answered = Object.keys(answers).length;
  const score = useMemo(() => testQuestions.reduce((total, item) => total + (answers[item.id] === item.answer ? RAT_POINTS_PER_CORRECT : 0), 0), [answers, testQuestions]);
  const minutes = Math.floor(secondsLeft / 60).toString().padStart(2, "0");
  const seconds = (secondsLeft % 60).toString().padStart(2, "0");

  const finish = () => {
    const correct = testQuestions.filter(item => answers[item.id] === item.answer).length;
    const accuracy = Math.round((correct / testQuestions.length) * 100);
    const progress = recordRATAttempt({ score, correct, total: testQuestions.length, accuracy, passed: accuracy >= 50 });
    clearActiveRAT();
    onProgress(progress);
    setSubmitted(true);
  };

  if (submitted) {
    const correct = testQuestions.filter(item => answers[item.id] === item.answer).length;
    const accuracy = Math.round((correct / testQuestions.length) * 100);
    return <div className="content"><div className="result-card">
      <span className={accuracy >= 50 ? "badge success" : "badge warning"}>{accuracy >= 50 ? "RAT PASSED" : "RAT REVIEW"}</span>
      <h2>{score} / {RAT_QUESTION_COUNT * RAT_POINTS_PER_CORRECT} points</h2>
      <p>You answered {correct} of {testQuestions.length} questions correctly.</p>
      <div className="result-grid"><div><strong>{correct}</strong><span>Correct</span></div><div><strong>{testQuestions.length - correct}</strong><span>Incorrect</span></div><div><strong>{accuracy}%</strong><span>Accuracy</span></div></div>
      <div className="result-actions"><button className="secondary-button" onClick={onExit}>Back to dashboard</button><button className="primary-button" onClick={() => { clearActiveRAT(); setTestQuestions(shuffleQuestions(questions, RAT_QUESTION_COUNT)); setCurrent(0); setAnswers({}); setSecondsLeft(RAT_DURATION_SECONDS); setSubmitted(false); }}>Retake RAT</button></div>
    </div></div>;
  }

  return <div className="content">
    <div className="test-header"><div><span className="eyebrow">Readiness Assessment Test</span><h2>Daily RAT</h2><p>10 questions • 15 minutes • {RAT_POINTS_PER_CORRECT} points per correct answer • Passmark 50%</p></div><div className={secondsLeft <= 60 ? "timer danger" : "timer"}>{minutes}:{seconds}</div></div>
    <div className="question-layout"><div className="question-card">
      <div className="question-meta"><span>Question {current + 1} of {testQuestions.length}</span><span>{question.topic} • {question.difficulty}</span></div>
      <h3>{question.prompt}</h3>
      <div className="options">{question.options.map((option, index) => <button key={option} className={answers[question.id] === index ? "option selected" : "option"} onClick={() => setAnswers(old => ({ ...old, [question.id]: index }))}><span>{String.fromCharCode(65 + index)}</span>{option}</button>)}</div>
      <div className="question-actions"><button className="secondary-button" disabled={current === 0} onClick={() => setCurrent(value => value - 1)}>Previous</button>{current < testQuestions.length - 1 ? <button className="primary-button" onClick={() => setCurrent(value => value + 1)}>Next</button> : <button className="primary-button" onClick={finish}>Submit RAT</button>}</div>
    </div><aside className="question-map"><strong>Progress</strong><span>{answered} / {testQuestions.length} answered</span><div className="map-grid">{testQuestions.map((item, index) => <button key={item.id} className={answers[item.id] !== undefined ? "map-dot answered" : "map-dot"} onClick={() => setCurrent(index)}>{index + 1}</button>)}</div><small>Your answers and timer are saved automatically, so closing the tab will not erase an unfinished RAT.</small></aside></div>
  </div>;
}