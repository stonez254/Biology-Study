import { useEffect, useMemo, useState } from "react";
import { ASSESSMENT_CONFIG } from "../data/testConfig";
import { setCloudUpdatedAt } from "../data/account";
import { backendEnabled, createQuestionBankAssessment, submitAssessment, type RemoteQuestion, type VerifiedAssessmentResult } from "../data/api";
import { clearActiveCAT, getCATStatus, getProgress, type StudyProgress } from "../data/progress";

type Props = { onExit: () => void; onProgress: (progress: StudyProgress) => void };

function formatCountdown(target: Date | null) {
  if (!target) return "00:00:00";
  const seconds = Math.max(0, Math.ceil((target.getTime() - Date.now()) / 1000));
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return days > 0
    ? String(days).padStart(2, "0") + ":" + String(hours).padStart(2, "0") + ":" + String(minutes).padStart(2, "0") + ":" + String(secs).padStart(2, "0")
    : String(hours).padStart(2, "0") + ":" + String(minutes).padStart(2, "0") + ":" + String(secs).padStart(2, "0");
}

export default function CAT({ onExit, onProgress }: Props) {
  const config = ASSESSMENT_CONFIG.cat;
  const studyProgress = getProgress();
  const progress = getCATStatus();
  const [now, setNow] = useState(Date.now());
  const [testQuestions, setTestQuestions] = useState<RemoteQuestion[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [current, setCurrent] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(config.durationSeconds);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [verifiedResult, setVerifiedResult] = useState<VerifiedAssessmentResult | null>(null);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  void now;

  useEffect(() => {
    if (!progress.eligible || testQuestions.length || loading || !backendEnabled()) return;
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    createQuestionBankAssessment("CAT", config.questionCount as 20, "medmcqa")
      .then(response => {
        if (cancelled) return;
        setSessionId(response.sessionId);
        setTestQuestions(response.questions);
        setSecondsLeft(config.durationSeconds);
      })
      .catch(error => {
        if (!cancelled) setLoadError(error instanceof Error ? error.message : "Unable to load CAT questions.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [progress.eligible, testQuestions.length, loading, config.questionCount, config.durationSeconds]);

  useEffect(() => {
    if (submitted || !testQuestions.length) return;
    const timer = window.setInterval(() => setSecondsLeft(value => {
      if (value <= 1) {
        window.clearInterval(timer);
        return 0;
      }
      return value - 1;
    }), 1000);
    return () => window.clearInterval(timer);
  }, [submitted, testQuestions.length]);

  const finish = async () => {
    if (finished || !sessionId) return;
    setFinished(true);
    try {
      const response = await submitAssessment("CAT", sessionId, testQuestions.map(item => item.id), answers);
      setCloudUpdatedAt(response.updatedAt);
      setVerifiedResult(response.result);
      const next = recordRemoteAttempt(response.result);
      clearActiveCAT();
      onProgress(next);
      setSubmitted(true);
    } catch (error) {
      setFinished(false);
      window.alert(error instanceof Error ? error.message : "CAT submission could not be verified. Please check your connection and try again.");
    }
  };

  useEffect(() => {
    if (!submitted && testQuestions.length && secondsLeft === 0) void finish();
  }, [secondsLeft, submitted, testQuestions.length]);

  function recordRemoteAttempt(result: VerifiedAssessmentResult): StudyProgress {
    const latest = getProgress();
    const attempt = {
      id: crypto.randomUUID(),
      type: "CAT" as const,
      assessmentSessionId: result.sessionId,
      completedAt: new Date().toISOString(),
      score: result.score,
      correct: result.correct,
      total: result.total,
      accuracy: result.accuracy,
      passed: result.passed,
      questionIds: result.questionIds,
      correctQuestionIds: result.correctQuestionIds,
    };
    const next: StudyProgress = {
      ...latest,
      points: latest.points + result.score,
      attempts: [attempt, ...latest.attempts].slice(0, 100),
      missedQuestionIds: Array.from(new Set([...latest.missedQuestionIds, ...result.missedQuestionIds])),
    };
    return next;
  }

  if (!progress.eligible) {
    const waitingToday = progress.waitingForTodayRAT;
    const label = waitingToday ? "TODAY'S RAT IS REQUIRED" : progress.ratDays === 0 ? "CAT LOCKED" : progress.ratDays >= 3 ? "CAT OPENS TOMORROW" : `${progress.remainingRATs} RAT${progress.remainingRATs === 1 ? "" : "s"} REMAINING`;
    return <div className="content"><div className="empty-state"><span className="badge warning">{label}</span><h2>CAT is not available yet</h2><p>{waitingToday ? "Complete today’s lesson, reach 100% reading progress, and finish today’s RAT. The CAT will be available tomorrow after the third daily RAT." : progress.ratDays === 0 ? "The CAT opens only after three consecutive daily RATs. Start with TODAY’S LESSON, scroll to 100%, then take the RAT." : `You have completed ${progress.ratDays} consecutive daily RAT${progress.ratDays === 1 ? "" : "s"}. ${progress.ratDays >= 3 ? "Your third RAT is complete. The CAT opens tomorrow." : "Complete the remaining daily RATs to unlock the CAT cycle."}`}</p><div className="cat-countdown"><span>CAT countdown</span><strong>{formatCountdown(progress.nextOpenAt)}</strong><small>{progress.ratDays}/3 daily RATs completed in this CAT cycle</small></div><button className="secondary-button" onClick={onExit}>Back to dashboard</button></div></div>;
  }

  if (!backendEnabled()) {
    return <div className="content"><div className="empty-state"><span className="badge warning">BACKEND REQUIRED</span><h2>CAT needs the question server</h2><p>Connect the Biology-Study API so CAT questions can be issued and scored securely.</p><button className="secondary-button" onClick={onExit}>Back to dashboard</button></div></div>;
  }

  if (loading || (!testQuestions.length && !loadError)) {
    return <div className="content"><div className="empty-state"><span className="badge">QUESTION BANK</span><h2>Preparing your CAT...</h2><p>Selecting 20 questions from the server-side MedMCQA bank and securing their answer key.</p></div></div>;
  }

  if (loadError) {
    return <div className="content"><div className="empty-state"><span className="badge warning">QUESTION BANK ERROR</span><h2>CAT could not be prepared</h2><p>{loadError}</p><button className="primary-button" onClick={() => window.location.reload()}>Try again</button><button className="secondary-button" onClick={onExit}>Back to dashboard</button></div></div>;
  }

  if (submitted && verifiedResult) {
    const result = verifiedResult;
    const correctIds = new Set(result.correctQuestionIds);
    return <div className="content"><div className="result-card"><span className={result.passed ? "badge success" : "badge warning"}>{result.passed ? "CAT PASSED" : "CAT REVIEW"}</span><h2>{result.score} / {config.questionCount * config.pointsPerCorrect} points</h2><p>The server verified {result.correct} of {result.total} questions correctly.</p><div className="result-grid"><div><strong>{result.correct}</strong><span>Correct</span></div><div><strong>{result.total - result.correct}</strong><span>Incorrect</span></div><div><strong>{result.accuracy}%</strong><span>Accuracy</span></div></div><div className="review-list"><h3>Missed questions • Review</h3>{testQuestions.filter(item => !correctIds.has(item.id)).map(item => <article className="review-item" key={item.id}><strong>{item.question}</strong><p><b>Correct answer:</b> {result.correctAnswers?.[item.id] !== undefined ? String.fromCharCode(65 + result.correctAnswers[item.id]) + ". " + item.options[result.correctAnswers[item.id]] : "See server-verified result"}</p><p>{item.explanation ?? "Review this question before your next assessment."}</p><small>{item.subject}{item.topic ? ` • ${item.topic}` : ""}</small></article>)}{result.missedQuestionIds.length === 0 && <p className="review-empty">Perfect score. No missed questions to review.</p>}</div><div className="result-actions"><button className="secondary-button" onClick={onExit}>Back to dashboard</button></div></div></div>;
  }

  const question = testQuestions[current];
  const answered = Object.keys(answers).length;
  const minutes = Math.floor(secondsLeft / 60).toString().padStart(2, "0");
  const seconds = (secondsLeft % 60).toString().padStart(2, "0");

  return <div className="content"><div className="test-header"><div><span className="eyebrow">Continuous Assessment Test</span><h2>CAT</h2><p>{config.questionCount} questions • 30 minutes • {config.pointsPerCorrect} points per correct answer • Passmark {config.passmark}%</p></div><div className={secondsLeft <= 60 ? "timer danger" : "timer"}>{minutes}:{seconds}</div></div><div className="question-layout"><div className="question-card"><div className="question-meta"><span>Question {current + 1} of {testQuestions.length}</span><span>{question.subject}{question.topic ? ` • ${question.topic}` : ""}</span></div><h3>{question.question}</h3><div className="options">{question.options.map((option,index)=><button key={option} className={answers[question.id] === index ? "option selected" : "option"} onClick={() => setAnswers(old => ({...old,[question.id]:index}))}><span>{String.fromCharCode(65 + index)}</span>{option}</button>)}</div><div className="question-actions"><button className="secondary-button" disabled={current === 0} onClick={() => setCurrent(value => value - 1)}>Previous</button>{current < testQuestions.length - 1 ? <button className="primary-button" onClick={() => setCurrent(value => value + 1)}>Next</button> : <button className="primary-button" onClick={finish}>Submit CAT</button>}</div></div><aside className="question-map"><strong>Progress</strong><span>{answered} / {testQuestions.length} answered</span><div className="map-grid">{testQuestions.map((item,index)=><button key={item.id} className={answers[item.id] !== undefined ? "map-dot answered" : "map-dot"} onClick={() => setCurrent(index)}>{index + 1}</button>)}</div><small>Your answers are submitted to the server and scored against the protected question bank.</small></aside></div></div>;
}
