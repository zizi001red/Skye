// Everything is saved on Sagar's phone (localStorage). No login, no database.
import type { Feeling, Plan, Profile, Session, WeightEntry } from "./types";

const K = { profile: "sf_profile", plan: "sf_plan", history: "sf_history", weights: "sf_weights", feeling: "sf_feeling" };

function read<T>(key: string, fallback: T): T {
  try { const v = localStorage.getItem(key); return v ? (JSON.parse(v) as T) : fallback; } catch { return fallback; }
}
function write(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

export const today = () => new Date().toLocaleDateString("en-CA"); // local YYYY-MM-DD
const ping = () => window.dispatchEvent(new Event("sf-update"));

export const getProfile = () => read<Profile | null>(K.profile, null);
export const saveProfile = (p: Profile) => write(K.profile, p);

export function getPlan(): Plan | null {
  const p = read<Plan | null>(K.plan, null);
  return p && p.date === today() ? p : null;
}
export const savePlan = (p: Plan) => write(K.plan, p);
export const clearPlan = () => { try { localStorage.removeItem(K.plan); } catch {} };

export const getHistory = () => read<Session[]>(K.history, []);
export const isDoneToday = () => getHistory().some((s) => s.date === today());
export function markDone(focus: string) {
  if (isDoneToday()) return;
  write(K.history, [...getHistory(), { date: today(), focus }]);
  ping();
}
export function workoutsLast7Days() {
  const t = new Date(today()).getTime();
  return getHistory().filter((s) => (t - new Date(s.date).getTime()) / 86400000 < 7).length;
}

export function getFeeling(): Feeling | undefined {
  const f = read<{ date: string; feeling: Feeling } | null>(K.feeling, null);
  return f && f.date === today() ? f.feeling : undefined;
}
export const setFeeling = (feeling: Feeling) => write(K.feeling, { date: today(), feeling });

export const getWeights = () => read<WeightEntry[]>(K.weights, []);
export function addWeight(kg: number) {
  write(K.weights, [...getWeights(), { date: today(), kg }]);
  const p = getProfile();
  if (p) saveProfile({ ...p, weightKg: kg });
  clearPlan(); // calorie target changes with weight
  ping();
}
