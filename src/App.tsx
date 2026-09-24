import { useEffect, useMemo, useState } from "react";
import RAT from "./pages/RAT";

type Section = "Dashboard" | "RAT" | "CAT" | "Practice" | "Revision" | "Analytics" | "Calendar" | "Settings";
const sections: Section[] = ["Dashboard", "RAT", "CAT", "Practice", "Revision", "Analytics", "Calendar", "Settings"];
const icons: Record<Section, string> = { Dashboard: "⌂", RAT: "✓", CAT: "◈", Practice: "◎", Revision: "↻", Analytics: "▥", Calendar: "▣", Settings: "⚙" };

function App() {
  const [active, setActive] = useState<Section>("Dashboard");
  const [dark, setDark] = useState(true);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setTime(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  useEffect(() => { document.documentElement.dataset.theme = dark ? "dark" : "light"; }, [dark]);

  const greeting = useMemo(() => {
    const hour = time.getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    if (hour < 21) return "Good Evening";
    return "Good Night";
  }, [time]);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><div className="brand-mark">B</div><div><strong>Biology-Study</strong><span>Learn. Test. Master.</span></div></div>
        <nav>{sections.map((section) => <button key={section} className={active === section ? "nav-item active" : "nav-item"} onClick={() => setActive(section)}><span className="nav-icon">{icons[section]}</span><span>{section}</span></button>)}</nav>
        <div className="sidebar-footer"><div className="level-card"><span>Study Level</span><strong>Level 1</strong><div className="progress"><i /></div><small>0 / 50 points to next badge</small></div></div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div><p className="eyebrow">{time.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}</p><h1>{greeting}, Student.</h1></div>
          <div className="header-actions"><span className="clock">{time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span><button className="icon-button" onClick={() => setDark((value) => !value)} aria-label="Toggle theme">{dark ? "☀" : "☾"}</button></div>
        </header>
        {active === "Dashboard" && <Dashboard onStart={() => setActive("RAT")} />}
        {active === "RAT" && <RAT onExit={() => setActive("Dashboard")} />}
        {!["Dashboard", "RAT"].includes(active) && <ComingSoon section={active} />}
      </main>
    </div>
  );
}

function Dashboard({ onStart }: { onStart: () => void }) {
  return <div className="content">
    <section className="hero-grid">
      <div className="hero-card"><div><span className="badge">BIOLOGY • STUDY HUB</span><h2>Build your knowledge one question at a time.</h2><p>Daily RATs, scheduled CATs, revision, analytics and a growing biology question bank.</p></div><button className="primary-button" onClick={onStart}>Start today's RAT</button></div>
      <div className="streak-card"><span className="muted">Current streak</span><strong>0 days</strong><span>Complete a study session today to begin.</span></div>
    </section>
    <section className="stats-grid"><Stat label="Study points" value="0" detail="Earn 5 points per RAT answer" /><Stat label="RATs completed" value="0" detail="10 questions • 15 minutes" /><Stat label="CATs completed" value="0" detail="20 questions • 30 minutes" /><Stat label="Mastery" value="0%" detail="Topic performance will appear here" /></section>
    <section className="dashboard-grid"><div className="panel"><div className="panel-heading"><div><span className="eyebrow">Daily engagement</span><h3>Fact of the Day</h3></div><span className="fact-tag">MEDICAL</span></div><p className="fact">The human heart has four chambers that work together to maintain continuous blood circulation.</p><small>Reference-backed facts will be connected to the study content layer.</small></div><div className="panel"><div className="panel-heading"><div><span className="eyebrow">Upcoming</span><h3>Study tasks</h3></div></div><Task title="Daily RAT" meta="10 questions • 15 min" status="Today" /><Task title="Next CAT" meta="20 questions • 30 min" status="Scheduled" /><Task title="Revision queue" meta="Missed questions" status="Ready" /></div></section>
  </div>;
}
function Stat({ label, value, detail }: { label: string; value: string; detail: string }) { return <div className="stat-card"><span>{label}</span><strong>{value}</strong><small>{detail}</small></div>; }
function Task({ title, meta, status }: { title: string; meta: string; status: string }) { return <div className="task"><div><strong>{title}</strong><span>{meta}</span></div><b>{status}</b></div>; }
function ComingSoon({ section }: { section: Section }) { return <div className="content"><div className="empty-state"><span className="badge">NEXT MODULE</span><h2>{section}</h2><p>This module is planned for the next build stage. The testing engine is now operational.</p></div></div>; }
export default App;