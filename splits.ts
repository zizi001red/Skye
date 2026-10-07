export const splits: Record<number, string[]> = {
  3: ["Push", "Pull", "Legs"],
  4: ["Upper", "Lower", "Upper", "Lower"],
  5: ["Push", "Pull", "Legs", "Upper", "Lower"],
};
export const splitGroups: Record<string, string[]> = {
  Push: ["chest", "shoulders", "triceps"],
  Pull: ["back", "biceps"],
  Legs: ["legs"],
  Upper: ["chest", "back", "shoulders"],
  Lower: ["legs"],
};
