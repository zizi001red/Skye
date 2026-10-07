import type { Profile } from "../types";

// Mifflin-St Jeor. Calorie and protein numbers come from here, never from the AI.
export function dailyTargets(p: Profile) {
  const bmr = 10 * p.weightKg + 6.25 * p.heightCm - 5 * p.age + (p.sex === "male" ? 5 : -161);
  const activity = 1.2 + Math.min(p.gymDays, 6) * 0.1;
  const adjust = p.goal === "build_muscle" ? 300 : p.goal === "lose_fat" ? -400 : 0;
  return { calories: Math.round(bmr * activity + adjust), proteinG: Math.round(p.weightKg * 1.8) };
}
