import { useEffect, useMemo, useState } from "react";
import { ASSESSMENT_CONFIG } from "../data/testConfig";
import { questions, shuffleQuestions, type Question } from "../data/questions";
import { clearActiveCAT, getActiveCAT, getCATStatus, hydrateQuestions, recordAssessmentAttempt, saveActiveCAT, type StudyProgress } from "../data/progress";

type Props = { onExit: () => void; onProgress: (progress: StudyProgress) => void };

function formatCountdown(target:Date|null){
  if(!target)return "00:00:00";
  const seconds=Math.max(0,Math.ceil((target.getTime()-Date.now())/1000));
  const days=Math.floor(seconds/86400);
  const hours=Math.floor((seconds%86400)/3600);
  const minutes=Math.floor((seconds%3600)/60);
  const secs=seconds%60;
  return days>0?String(days).padStart(2,"0")+":"+String(hours).padStart(2,"0")+":"+String(minutes).padStart(2,"0")+":"+String(secs).padStart(2,"0"):String(hours).padStart(2,"0")+":"+String(minutes).padStart(2,"0")+":"+String(secs).padStart(2,"0");
}

export default function CAT({ onExit, onProgress }: Props) {
  const config = ASSESSMENT_CONFIG.cat;
  const saved = getActiveCAT();
  const restored = saved ? hydrateQuestions(saved, questions) : [];
  const [now,setNow]=useState(Date.now());
  const [testQuestions, setTestQuestions] = useState<Question[]>(restored.length === config.questionCount ? restored : () => shuffleQuestions(questions, config.questionCount));
  const [current, setCurrent] = useState(saved && restored.length === config.questionCount ? saved.current : 0);
  const [answers, setAnswers] = useState<Record<string, number>>(saved && restored.length === config.questionCount ? saved.answers : {});
  const [secondsLeft, setSecondsLeft] = useState(saved && restored.length === config.questionCount ? saved.secondsLeft : config.durationSeconds);
  const [submitted, setSubmitted] = useState(false);
  const [finished, setFinished] = useState(false);
  const progress=getCATStatus();

  useEffect(()=>{const timer=window.setInterval(()=>setNow(Date.now()),1000);return()=>window.clearInterval(timer);},[]);
  void now;

  if(!progress.eligible){
    const waitingToday=progress.waitingForTodayRAT;
    const label=waitingToday?"TODAY'S RAT IS REQUIRED":progress.ratDays===0?"CAT LOCKED":progress.ratDays>=3?"CAT OPENS TOMORROW":`${progress.remainingRATs} RAT${progress.remainingRATs===1?"":"s"} REMAINING`;
    return <div className="content"><div className="empty-state"><span className="badge warning">{label}</span><h2>CAT is not available yet</h2><p>{waitingToday?"Complete today’s lesson, reach 100% reading progress, and finish today’s RAT. The CAT will be available tomorrow after the third daily RAT.":progress.ratDays===0?"The CAT opens only after three consecutive daily RATs. Start with TODAY’S LESSON, scroll to 100%, then take the RAT.":"You have completed "+progress.ratDays+" consecutive daily RAT"+(progress.ratDays===1?"":"s")+". "+(progress.ratDays>=3?"Your third RAT is complete. The CAT opens tomorrow.":"Complete the remaining daily RAT"+(progress.remainingRATs===1?"":"s")+" to unlock the CAT cycle.")}</p><div className="cat-countdown"><span>CAT countdown</span><strong>{formatCountdown(progress.nextOpenAt)}</strong><small>{progress.ratDays}/3 daily RATs completed in this CAT cycle</small></div><button className="secondary-button" onClick={onExit}>Back to dashboard</button></div></div>;
  }

  const finish = () => {
    if (finished) return;
    setFinished(true);
    const correct = testQuestions.filter(item => answers[item.id] === item.answer).length;
    const score = correct * config.pointsPerCorrect;
    const accuracy = Math.round((correct / testQuestions.length) * 100);
    const next = recordAssessmentAttempt("CAT", { score, correct, total: testQuestions.length, accuracy, passed: accuracy >= config.passmark }, testQuestions.filter(item => answers[item.id] !== item.answer).map(item => item.id));
    clearActiveCAT();
    onProgress(next);
    setSubmitted(true);
  };

  useEffect(() => {
    if (submitted) return;
    const timer = window.setInterval(() => setSecondsLeft(value => {
      if (value <= 1) { window.clearInterval(timer); setSecondsLeft(0); return 0; }
      return value - 1;
    }), 1000);
    return () => window.clearInterval(timer);
  }, [submitted]);

  useEffect(() => {
    if (!submitted && secondsLeft === 0) finish();
  }, [secondsLeft, submitted]);

  useEffect(() => {
    if (submitted) return;
    saveActiveCAT({ questionIds: testQuestions.map(q => q.id), current, answers, secondsLeft, startedAt: saved?.startedAt ?? new Date().toISOString() });
  }, [answers, current, secondsLeft, submitted, testQuestions, saved?.startedAt]);

  const question = testQuestions[current];
  const answered = Object.keys(answers).length;
  const score = useMemo(() => testQuestions.reduce((total, item) => total + (answers[item.id] === item.answer ? config.pointsPerCorrect : 0), 0), [answers, testQuestions, config.pointsPerCorrect]);
  const minutes = Math.floor(secondsLeft / 60).toString().padStart(2, "0");
  const seconds = (secondsLeft % 60).toString().padStart(2, "0");

  if (testQuestions.length < config.questionCount) {
    return <div className="content"><div className="empty-state"><span className="badge warning">QUESTION BANK</span><h2>CAT needs more questions</h2><p>The CAT is configured for {config.questionCount} unique questions, but the current bank only has {testQuestions.length}. Add more questions before starting a CAT.</p><button className="secondary-button" onClick={onExit}>Back to dashboard</button></div></div>;
  }

  if (submitted) {
    const correct = testQuestions.filter(item => answers[item.id] === item.answer).length;
    const accuracy = Math.round((correct / testQuestions.length) * 100);
    return <div className="content"><div className="result-card"><span className={accuracy >= config.passmark ? "badge success" : "badge warning"}>{accuracy >= config.passmark ? "CAT PASSED" : "CAT REVIEW"}</span><h2>{score} / {config.questionCount * config.pointsPerCorrect} points</h2><p>You answered {correct} of {testQuestions.length} questions correctly. Review the explanations below before moving to Revision.</p><div className="result-grid"><div><strong>{correct}</strong><span>Correct</span></div><div><strong>{testQuestions.length - correct}</strong><span>Incorrect</span></div><div><strong>{accuracy}%</strong><span>Accuracy</span></div></div><div className="review-list"><h3>Missed questions • Review</h3>{testQuestions.filter(item=>answers[item.id]!==item.answer).map(item=><article key={item.id} className="review-item"><strong>{item.prompt}</strong><p><b>Correct answer:</b> {item.options[item.answer]}</p><p>{item.explanation}</p><small>{item.reference}</small></article>)}{testQuestions.every(item=>answers[item.id]===item.answer)&&<p className="review-empty">Perfect score. No missed questions to review.</p>}</div><div className="result-actions"><button className="secondary-button" onClick={onExit}>Back to dashboard</button></div></div></div>;
  }

  return <div className="content"><div className="test-header"><div><span className="eyebrow">Continuous Assessment Test</span><h2>CAT</h2><p>{config.questionCount} questions • 30 minutes • {config.pointsPerCorrect} points per correct answer • Passmark {config.passmark}%</p></div><div className={secondsLeft <= 60 ? "timer danger" : "timer"}>{minutes}:{seconds}</div></div><div className="question-layout"><div className="question-card"><div className="question-meta"><span>Question {current + 1} of {testQuestions.length}</span><span>{question.topic} • {question.difficulty}</span></div><h3>{question.prompt}</h3><div className="options">{question.options.map((option, index) => <button key={option} className={answers[question.id] === index ? "option selected" : "option"} onClick={() => setAnswers(old => ({ ...old, [question.id]: index }))}><span>{String.fromCharCode(65 + index)}</span>{option}</button>)}</div><div className="question-actions"><button className="secondary-button" disabled={current === 0} onClick={() => setCurrent(value => value - 1)}>Previous</button>{current < testQuestions.length - 1 ? <button className="primary-button" onClick={() => setCurrent(value => value + 1)}>Next</button> : <button className="primary-button" onClick={finish}>Submit CAT</button>}</div></div><aside className="question-map"><strong>Progress</strong><span>{answered} / {testQuestions.length} answered</span><div className="map-grid">{testQuestions.map((item, index) => <button key={item.id} className={answers[item.id] !== undefined ? "map-dot answered" : "map-dot"} onClick={() => setCurrent(index)}>{index + 1}</button>)}</div><small>Your answers and timer are saved automatically. CAT is one assessment per three-RAT cycle.</small></aside></div></div>;
}
