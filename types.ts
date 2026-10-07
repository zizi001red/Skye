export type Profile = {
  sex: "male" | "female";
  age: number;
  heightCm: number;
  weightKg: number;
  goal: "build_muscle" | "lose_fat" | "general";
  gymDays: number;
  experience: "beginner" | "intermediate" | "advanced";
  sessionMin: number;
  diet: "veg" | "eggs" | "nonveg";
  avoid: string;
  injuries: string;
};
export type Exercise = { name: string; sets: number; reps: number; restSec: number; videoUrl?: string };
export type Plan = {
  date: string;
  focus: string;
  workout: { title: string; summary: string; why: string; exercises: Exercise[] };
  food: { calories: number; proteinG: number; meals: { name: string; portions: string }[] };
  note?: string;
};
export type Session = { date: string; focus: string };
export type Feeling = "Good" | "Tired" | "Sore" | "Pain";
export type WeightEntry = { date: string; kg: number };
