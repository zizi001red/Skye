// Server side: asks Grok for today's plan. Falls back to a built-in rotation if Grok is unavailable.
export const config = { maxDuration: 30 };

const LIB = [
  ["Bench press", "chest"], ["Incline dumbbell press", "chest"], ["Cable fly", "chest"],
  ["Lat pulldown", "back"], ["Seated row", "back"], ["One-arm dumbbell row", "back"],
  ["Shoulder press", "shoulders"], ["Lateral raise", "shoulders"], ["Face pull", "shoulders"],
  ["Triceps pushdown", "triceps"], ["Overhead triceps extension", "triceps"],
  ["Barbell curl", "biceps"], ["Hammer curl", "biceps"],
  ["Squat", "legs"], ["Leg press", "legs"], ["Romanian deadlift", "legs"], ["Leg curl", "legs"],
].map(([name, group]) => ({ name, group }));

const SPLITS = { 3: ["Push", "Pull", "Legs"], 4: ["Upper", "Lower", "Upper", "Lower"], 5: ["Push", "Pull", "Legs", "Upper", "Lower"] };
const GROUPS = { Push: ["chest", "shoulders", "triceps"], Pull: ["back", "biceps"], Legs: ["legs"], Upper: ["chest", "back", "shoulders"], Lower: ["legs"] };

const PAIN_NOTE = "Sharp pain is a signal to stop. Rest today, and speak to a doctor or trainer before training that area.";

const SYSTEM = `You are a friendly gym coach for one person. You decide what he does TODAY.
Rules:
- Use plain language. No jargon. Say "rounds of 10", not "sets x reps at RPE 8".
- Choose exercises ONLY from the provided exercise list, using the exact names.
- Look at recentSessions. Do not train the same muscles two days in a row. Continue the rotation sensibly.
- Match the number of exercises to sessionMin (30 min: 4, 45 min: 5, 60+ min: 6).
- Match difficulty to experience. Beginners: 3 rounds, simpler moves.
- If feeling is Tired or Sore, go lighter (fewer rounds). Respect injuries: avoid loading that area.
- Meals: plain portions he can picture (rotis, bowls, eggs). Respect diet and avoid.
- "why" is ONE short sentence explaining today's plan.
Reply with JSON only, in this shape:
{"focus":"Back + Biceps","title":"Back and biceps","why":"...","exercises":[{"name":"","sets":3,"reps":10,"restSec":90}],"meals":[{"name":"Breakfast","portions":""}],"note":""}`;

function targets(p) {
  const bmr = 10 * p.weightKg + 6.25 * p.heightCm - 5 * p.age + (p.sex === "male" ? 5 : -161);
  const activity = 1.3 + Math.min(p.gymDays, 6) * 0.05;
  const adjust = p.goal === "build_muscle" ? 300 : p.goal === "lose_fat" ? -400 : 0;
  const calories = Math.max(Math.round(bmr * activity + adjust), p.sex === "male" ? 1500 : 1200);
  return { calories, proteinG: Math.round(p.weightKg * 1.8) };
}

function meals(diet) {
  const protein = diet === "nonveg" ? "150g chicken or 3 eggs" : diet === "eggs" ? "3 eggs" : "100g paneer or 1 big bowl dal";
  return [
    { name: "Breakfast", portions: diet === "veg" ? "Oats with milk, 1 banana, 1 bowl curd" : "2 eggs, 2 rotis, 1 bowl curd" },
    { name: "Lunch", portions: `3 rotis, 1 bowl dal, ${protein}, salad` },
    { name: "Snack", portions: "1 fruit and a handful of nuts" },
    { name: "Dinner", portions: `2 rotis, ${protein}, vegetables` },
  ];
}

const food = (p) => ({ ...targets(p), meals: meals(p.diet) });
const daysAgo = (d, today) => Math.round((new Date(today) - new Date(d)) / 86400000);

function restPlan(p, today, note) {
  return { date: today, focus: "Rest", note, workout: { title: "Rest day", summary: "Recover", why: "Muscles grow while you rest.", exercises: [] }, food: food(p) };
}

function fallbackPlan(p, history, feeling, today) {
  const split = SPLITS[Math.min(Math.max(p.gymDays, 3), 5)];
  const name = split[history.length % split.length];
  const groups = GROUPS[name];
  const count = p.sessionMin >= 60 ? 6 : p.sessionMin >= 45 ? 5 : 4;
  const per = Math.ceil(count / groups.length);
  const picked = groups.flatMap((g) => LIB.filter((e) => e.group === g).slice(0, per)).slice(0, count);
  const light = feeling === "Tired" || feeling === "Sore";
  const sets = Math.max(2, (p.experience === "beginner" ? 3 : 4) - (light ? 1 : 0));
  const reps = p.goal === "build_muscle" ? 10 : 12;
  return {
    date: today, focus: name,
    workout: {
      title: `${name} day`, summary: `${picked.length} exercises, about ${p.sessionMin} minutes`,
      why: light ? "You feel a bit worn out, so today is lighter." : "Keeping your week balanced.",
      exercises: picked.map((e) => ({ name: e.name, sets, reps, restSec: 75 })),
    },
    food: food(p),
  };
}

async function generatePlan(p, history, feeling, today) {
  if (feeling === "Pain") return restPlan(p, today, PAIN_NOTE);
  const thisWeek = history.filter((s) => { const d = daysAgo(s.date, today); return d >= 1 && d <= 6; }).length;
  if (thisWeek >= p.gymDays) return restPlan(p, today, "You've hit your gym days this week. Walk 20 minutes and eat your protein.");

  const fallback = fallbackPlan(p, history, feeling, today);
  const key = process.env.XAI_API_KEY;
  if (!key) return fallback;

  try {
    const res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: { "content-type": "application/json", Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(25000),
      body: JSON.stringify({
        model: process.env.XAI_MODEL || "grok-4.5",
        temperature: 0.4,
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: JSON.stringify({ profile: p, feeling: feeling || "Good", today, recentSessions: history.slice(-7), exercises: LIB }) },
        ],
      }),
    });
    const data = await res.json();
    const text = (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || "";
    const ai = JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1));

    const exercises = (ai.exercises || [])
      .filter((e) => LIB.some((l) => l.name === e.name))
      .map((e) => ({ name: e.name, sets: Number(e.sets) || 3, reps: Number(e.reps) || 10, restSec: Number(e.restSec) || 75 }));
    if (exercises.length < 3) return fallback;

    const f = food(p);
    return {
      date: today, focus: String(ai.focus || ai.title || "Workout"), note: ai.note ? String(ai.note) : undefined,
      workout: { title: String(ai.title || ai.focus || "Today's workout"), summary: `${exercises.length} exercises, about ${p.sessionMin} minutes`, why: String(ai.why || ""), exercises },
      food: { ...f, meals: Array.isArray(ai.meals) && ai.meals.length ? ai.meals : f.meals },
    };
  } catch {
    return fallback;
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  const { profile, history, feeling, today } = req.body || {};
  if (!profile || !today) return res.status(400).json({ error: "Missing data" });
  res.status(200).json(await generatePlan(profile, history || [], feeling, today));
}
