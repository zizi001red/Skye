import { COACH_SYSTEM } from "./prompts";
import { PAIN_NOTE, clampCalories } from "./safety";
import { dailyTargets } from "../nutrition/calculator";
import { splitGroups, splits } from "../workouts/splits";
import library from "../workouts/exercises.json";
import type { Exercise, Feeling, Plan, Profile, Session } from "../types";

type LibItem = { name: string; group: string; videoUrl: string };
const lib = library as LibItem[];

const daysAgo = (date: string, today: string) => Math.round((+new Date(today) - +new Date(date)) / 86400000);

function meals(diet: Profile["diet"]) {
  const protein = diet === "nonveg" ? "150g chicken or 3 eggs" : diet === "eggs" ? "3 eggs" : "100g paneer or 1 big bowl dal";
  return [
    { name: "Breakfast", portions: diet === "veg" ? "Oats with milk, 1 banana, 1 bowl curd" : "2 eggs, 2 rotis, 1 bowl curd" },
    { name: "Lunch", portions: `3 rotis, 1 bowl dal, ${protein}, salad` },
    { name: "Snack", portions: "1 fruit and a handful of nuts" },
    { name: "Dinner", portions: `2 rotis, ${protein}, vegetables` },
  ];
}

function foodFor(p: Profile) {
  const t = dailyTargets(p);
  return { calories: clampCalories(t.calories, p.sex), proteinG: t.proteinG, meals: meals(p.diet) };
}

function restPlan(p: Profile, today: string, note: string): Plan {
  return {
    date: today, focus: "Rest", note,
    workout: { title: "Rest day", summary: "Recover", why: "Muscles grow while you rest.", exercises: [] },
    food: foodFor(p),
  };
}

function fallbackPlan(p: Profile, history: Session[], feeling: Feeling | undefined, today: string): Plan {
  const split = splits[Math.min(Math.max(p.gymDays, 3), 5)];
  const name = split[history.length % split.length];
  const groups = splitGroups[name];
  const count = p.sessionMin >= 60 ? 6 : p.sessionMin >= 45 ? 5 : 4;
  const perGroup = Math.ceil(count / groups.length);
  const picked = groups.flatMap((g) => lib.filter((e) => e.group === g).slice(0, perGroup)).slice(0, count);
  const light = feeling === "Tired" || feeling === "Sore";
  const sets = Math.max(2, (p.experience === "beginner" ? 3 : 4) - (light ? 1 : 0));
  const reps = p.goal === "build_muscle" ? 10 : 12;
  return {
    date: today, focus: name,
    workout: {
      title: `${name} day`, summary: `${picked.length} exercises, about ${p.sessionMin} minutes`,
      why: light ? "You feel a bit worn out, so today is lighter." : "Keeping your week balanced.",
      exercises: picked.map((e) => ({ name: e.name, sets, reps, restSec: 75, videoUrl: e.videoUrl })),
    },
    food: foodFor(p),
  };
}

export async function generatePlan(p: Profile, history: Session[], feeling: Feeling | undefined, today: string): Promise<Plan> {
  if (feeling === "Pain") return restPlan(p, today, PAIN_NOTE);
  const thisWeek = history.filter((s) => { const d = daysAgo(s.date, today); return d >= 1 && d <= 6; }).length;
  if (thisWeek >= p.gymDays) return restPlan(p, today, "You've hit your gym days this week. Walk 20 minutes and eat your protein.");

  const fallback = fallbackPlan(p, history, feeling, today);
  const key = process.env.XAI_API_KEY;
  if (!key) return fallback;

  try {
    const food = foodFor(p);
    const res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: { "content-type": "application/json", Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(25000),
      body: JSON.stringify({
        model: process.env.XAI_MODEL ?? "grok-4.5",
        temperature: 0.4,
        messages: [
          { role: "system", content: COACH_SYSTEM },
          {
            role: "user",
            content: JSON.stringify({
              profile: p, feeling: feeling ?? "Good", today,
              recentSessions: history.slice(-7),
              exercises: lib.map((e) => ({ name: e.name, group: e.group })),
            }),
          },
        ],
      }),
    });
    const data = await res.json();
    const text: string = data.choices?.[0]?.message?.content ?? "";
    const ai = JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1));

    const exercises: Exercise[] = (ai.exercises ?? [])
      .filter((e: Exercise) => lib.some((l) => l.name === e.name))
      .map((e: Exercise) => ({
        name: e.name, sets: Number(e.sets) || 3, reps: Number(e.reps) || 10, restSec: Number(e.restSec) || 75,
        videoUrl: lib.find((l) => l.name === e.name)?.videoUrl,
      }));
    if (exercises.length < 3) return fallback;

    return {
      date: today, focus: String(ai.focus ?? ai.title ?? "Workout"),
      note: ai.note ? String(ai.note) : undefined,
      workout: {
        title: String(ai.title ?? ai.focus ?? "Today's workout"),
        summary: `${exercises.length} exercises, about ${p.sessionMin} minutes`,
        why: String(ai.why ?? ""), exercises,
      },
      food: { ...food, meals: Array.isArray(ai.meals) && ai.meals.length ? ai.meals : food.meals },
    };
  } catch {
    return fallback;
  }
}
