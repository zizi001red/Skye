import { useEffect, useState } from "react";
import Head from "next/head";

const LS = { profile: "sf_profile", plan: "sf_plan", history: "sf_history", weights: "sf_weights", feeling: "sf_feeling" };
const read = (k, f) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : f; } catch { return f; } };
const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
const today = () => new Date().toLocaleDateString("en-CA");

const QUESTIONS = [
  { key: "sex", label: "Are you male or female?", hint: "Used only for your calorie target.", kind: "choice", options: [["Male", "male"], ["Female", "female"]] },
  { key: "age", label: "How old are you?", kind: "number", unit: "years" },
  { key: "heightCm", label: "How tall are you?", kind: "number", unit: "cm" },
  { key: "weightKg", label: "What is your weight?", kind: "number", unit: "kg" },
  { key: "goal", label: "What do you want most?", kind: "choice", options: [["Build muscle", "build_muscle"], ["Lose fat", "lose_fat"], ["General fitness", "general"]] },
  { key: "gymDays", label: "How many days a week do you go to the gym?", kind: "choice", options: [["3 days", 3], ["4 days", 4], ["5 days", 5], ["6 days", 6]] },
  { key: "experience", label: "How long have you been training?", kind: "choice", options: [["Under 6 months", "beginner"], ["6 months to 2 years", "intermediate"], ["Over 2 years", "advanced"]] },
  { key: "sessionMin", label: "How long is a usual gym session?", kind: "choice", options: [["30 minutes", 30], ["45 minutes", 45], ["60 minutes", 60], ["90 minutes", 90]] },
  { key: "diet", label: "What do you eat?", kind: "choice", options: [["Vegetarian", "veg"], ["Vegetarian + eggs", "eggs"], ["Non-veg", "nonveg"]] },
  { key: "avoid", label: "Any foods you don't eat or dislike?", hint: "You can skip this.", kind: "text", optional: true },
  { key: "injuries", label: "Any injury or pain area?", hint: "For example: knee, lower back. You can skip this.", kind: "text", optional: true },
];

const FEELINGS = [["Good", "Feeling good"], ["Tired", "Tired"], ["Sore", "Muscles are sore"], ["Pain", "Sharp pain somewhere"]];

function Onboarding({ onDone }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [text, setText] = useState("");
  const q = QUESTIONS[step];

  function answer(value) {
    const next = { ...answers, [q.key]: value };
    setAnswers(next);
    setText("");
    if (step + 1 < QUESTIONS.length) setStep(step + 1);
    else onDone({ avoid: "", injuries: "", ...next });
  }

  return (
    <div className="stack">
      <p className="muted">Question {step + 1} of {QUESTIONS.length}</p>
      <h1>{q.label}</h1>
      {q.hint && <p className="muted">{q.hint}</p>}
      {q.kind === "choice" && q.options.map(([label, value]) => (
        <button key={label} className="choice" onClick={() => answer(value)}>{label}</button>
      ))}
      {q.kind !== "choice" && (
        <div className="stack">
          <div className="row">
            <input autoFocus value={text} onChange={(e) => setText(e.target.value)}
              type={q.kind === "number" ? "number" : "text"} inputMode={q.kind === "number" ? "decimal" : "text"} />
            {q.unit && <span className="muted">{q.unit}</span>}
          </div>
          <button className="primary"
            disabled={q.kind === "number" ? !(Number(text) > 0) : !q.optional && !text}
            onClick={() => answer(q.kind === "number" ? Number(text) : text.trim())}>
            {q.optional && !text ? "Skip" : "Next"}
          </button>
        </div>
      )}
      {step > 0 && <button className="link" onClick={() => setStep(step - 1)}>Back</button>}
    </div>
  );
}

export default function App() {
  const [ready, setReady] = useState(false);
  const [profile, setProfile] = useState(null);
  const [plan, setPlan] = useState(null);
  const [history, setHistory] = useState([]);
  const [weights, setWeights] = useState([]);
  const [view, setView] = useState("home");
  const [error, setError] = useState(false);
  const [weightInput, setWeightInput] = useState("");

  useEffect(() => {
    const p = read(LS.profile, null);
    setHistory(read(LS.history, []));
    setWeights(read(LS.weights, []));
    setProfile(p);
    setReady(true);
    if (p) {
      const cached = read(LS.plan, null);
      if (cached && cached.date === today()) setPlan(cached);
      else loadPlan(p);
    }
  }, []);

  async function loadPlan(p) {
    setError(false);
    setPlan(null);
    try {
      const f = read(LS.feeling, null);
      const feeling = f && f.date === today() ? f.feeling : undefined;
      const res = await fetch("/api/plan", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ profile: p, history: read(LS.history, []).slice(-14), feeling, today: today() }),
      });
      if (!res.ok) throw new Error("failed");
      const next = await res.json();
      write(LS.plan, next);
      setPlan(next);
    } catch {
      setError(true);
    }
  }

  function finishOnboarding(p) {
    write(LS.profile, p);
    setProfile(p);
    setView("home");
    loadPlan(p);
  }

  const doneToday = history.some((s) => s.date === today());
  const weekCount = history.filter((s) => (new Date(today()) - new Date(s.date)) / 86400000 < 7).length;

  function markDone() {
    if (doneToday || !plan) return;
    const h = [...history, { date: today(), focus: plan.focus }];
    write(LS.history, h);
    setHistory(h);
  }

  function chooseFeeling(f) {
    write(LS.feeling, { date: today(), feeling: f });
    setView("home");
    loadPlan(profile);
  }

  function saveWeight() {
    const kg = parseFloat(weightInput);
    if (!(kg > 20 && kg < 300)) return;
    const w = [...weights, { date: today(), kg }];
    write(LS.weights, w);
    setWeights(w);
    const np = { ...profile, weightKg: kg };
    write(LS.profile, np);
    setProfile(np);
    setWeightInput("");
    loadPlan(np); // calorie target changes with weight
  }

  const Done = () => doneToday
    ? <p className="done">Workout done today. Nice work.</p>
    : <button className="primary" onClick={markDone}>I finished my workout</button>;
  const Week = () => <p className="box">{weekCount} of {profile.gymDays} workouts in the last 7 days.</p>;
  const Loading = () => error
    ? <div className="stack"><p>Couldn't load your plan. Check your internet and try again.</p><button className="primary" onClick={() => loadPlan(profile)}>Try again</button></div>
    : <p className="muted">Getting your plan ready…</p>;

  let body = null;
  if (!ready) body = null;
  else if (!profile) body = <Onboarding onDone={finishOnboarding} />;
  else if (view === "checkin") body = (
    <div className="stack">
      <h1>How do you feel today?</h1>
      <p className="muted">Your plan will adjust.</p>
      {FEELINGS.map(([v, label]) => <button key={v} className="choice" onClick={() => chooseFeeling(v)}>{label}</button>)}
    </div>
  );
  else if (view === "progress") {
    const first = weights[0] && weights[0].kg, last = weights.length ? weights[weights.length - 1].kg : undefined;
    body = (
      <div className="stack">
        <h1>Progress</h1>
        <Week />
        <div className="card stack">
          <h2>Weekly weigh-in</h2>
          {first !== undefined && <p className="muted">Started at {first} kg. Now {last} kg ({last - first >= 0 ? "+" : ""}{(last - first).toFixed(1)} kg).</p>}
          <div className="row">
            <input value={weightInput} onChange={(e) => setWeightInput(e.target.value)} inputMode="decimal" placeholder="Weight in kg" />
            <button className="primary small" onClick={saveWeight}>Save</button>
          </div>
        </div>
        <h2>Recent workouts</h2>
        {history.length === 0 && <p className="muted">Nothing yet. Finish today's workout to see it here.</p>}
        {history.slice(-7).reverse().map((s) => <p key={s.date}>{s.date}: {s.focus}</p>)}
      </div>
    );
  }
  else if (!plan) body = <Loading />;
  else if (view === "workout") body = (
    <div className="stack">
      <h1>{plan.workout.title}</h1>
      <p className="muted">{plan.workout.why} {plan.workout.summary}.</p>
      {plan.workout.exercises.length === 0 && <p>No exercises today. Rest, walk a little, and eat well.</p>}
      {plan.workout.exercises.map((e) => (
        <div className="card" key={e.name}><h2>{e.name}</h2><p>{e.sets} rounds of {e.reps}. Rest {e.restSec} seconds.</p></div>
      ))}
      {plan.workout.exercises.length > 0 && <Done />}
    </div>
  );
  else if (view === "food") body = (
    <div className="stack">
      <h1>{plan.food.calories} calories</h1>
      <p className="muted">Aim for {plan.food.proteinG}g protein today.</p>
      {plan.food.meals.map((m) => <div className="card" key={m.name}><h2>{m.name}</h2><p className="muted">{m.portions}</p></div>)}
    </div>
  );
  else body = (
    <div className="stack">
      <h1>Today</h1>
      {plan.note && <p className="box warn">{plan.note}</p>}
      <div className="card clickable" onClick={() => setView("workout")}>
        <p className="muted">Workout</p><h2 className="big">{plan.workout.title}</h2><p className="muted">{plan.workout.why || plan.workout.summary}</p>
      </div>
      <div className="card clickable" onClick={() => setView("food")}>
        <p className="muted">Food</p><h2 className="big">{plan.food.calories} calories</h2><p className="muted">Aim for {plan.food.proteinG}g protein</p>
      </div>
      {plan.workout.exercises.length > 0 && <Done />}
      <Week />
      <button className="link" onClick={() => setView("checkin")}>Not feeling your best? Adjust today's plan</button>
    </div>
  );

  return (
    <>
      <Head>
        <title>Sagar Fit</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <style>{CSS}</style>
      <main>{body}</main>
      {ready && profile && (
        <nav>
          {[["home", "Today"], ["workout", "Workout"], ["food", "Food"], ["progress", "Progress"]].map(([v, label]) => (
            <button key={v} className={view === v ? "on" : ""} onClick={() => setView(v)}>{label}</button>
          ))}
        </nav>
      )}
    </>
  );
}

const CSS = `
*{box-sizing:border-box}
body{margin:0;background:#F2F4F3;color:#12201C;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;font-size:17px;line-height:1.4}
main{max-width:440px;margin:0 auto;padding:24px 16px 96px}
h1{font-size:2.2rem;line-height:1.1;margin:0;font-weight:800;letter-spacing:-0.02em}
h2{font-size:1.25rem;margin:0 0 4px;font-weight:700}
h2.big{font-size:1.7rem}
p{margin:0}
.stack{display:flex;flex-direction:column;gap:14px}
.row{display:flex;gap:8px;align-items:center}
.muted{color:#5B6B66}
.card,.box{background:#fff;border:1px solid #D5DCD9;border-radius:12px;padding:14px 16px}
.box{background:transparent}
.warn{border-color:#C2410C}
.clickable{cursor:pointer}
input{flex:1;min-width:0;font:inherit;padding:12px;border:1px solid #D5DCD9;border-radius:10px;background:#fff}
button{font:inherit;cursor:pointer}
.primary{background:#1F6F5C;color:#fff;border:0;border-radius:10px;padding:14px 16px;width:100%}
.primary.small{width:auto}
.primary:disabled{opacity:.4;cursor:default}
.choice{background:#fff;border:1px solid #D5DCD9;border-radius:10px;padding:14px 16px;text-align:left}
.link{background:none;border:0;color:#5B6B66;text-decoration:underline;padding:4px}
.done{border:1px solid #1F6F5C;color:#1F6F5C;border-radius:10px;padding:14px 16px;text-align:center}
nav{position:fixed;left:0;right:0;bottom:0;display:flex;justify-content:space-around;background:#F2F4F3;border-top:1px solid #D5DCD9;padding:8px 0 calc(8px + env(safe-area-inset-bottom))}
nav button{background:none;border:0;padding:8px 10px;color:#5B6B66}
nav button.on{color:#1F6F5C;font-weight:700}
`;
