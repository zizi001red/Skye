export function clampCalories(calories: number, sex: "male" | "female") {
  return Math.max(calories, sex === "male" ? 1500 : 1200);
}
export const PAIN_NOTE = "Sharp pain is a signal to stop. Rest today, and speak to a doctor or trainer before training that area.";
