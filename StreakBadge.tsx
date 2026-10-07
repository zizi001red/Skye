"use client";
import { useEffect, useState } from "react";
import { getProfile, workoutsLast7Days } from "@/lib/storage";

export default function StreakBadge() {
  const [done, setDone] = useState(0);
  const [goal, setGoal] = useState(0);
  useEffect(() => {
    const update = () => { setDone(workoutsLast7Days()); setGoal(getProfile()?.gymDays ?? 0); };
    update();
    window.addEventListener("sf-update", update);
    return () => window.removeEventListener("sf-update", update);
  }, []);
  if (!goal) return null;
  return <p className="rounded-lg border border-line px-4 py-3">{done} of {goal} workouts in the last 7 days.</p>;
}
