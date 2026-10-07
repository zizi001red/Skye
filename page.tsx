"use client";
import Link from "next/link";
import TodayCard from "@/components/TodayCard";
import StreakBadge from "@/components/StreakBadge";
import DoneButton from "@/components/DoneButton";
import { usePlan } from "@/lib/usePlan";

export default function Home() {
  const { plan, loading, error, retry } = usePlan();
  return (
    <div className="space-y-4">
      <h1 className="text-4xl font-bold">Today</h1>
      {loading && <p className="text-muted">Getting your plan ready…</p>}
      {error && (
        <div className="space-y-2">
          <p>Couldn't load your plan. Check your internet and try again.</p>
          <button onClick={retry} className="rounded-lg bg-accent px-4 py-2 text-white">Try again</button>
        </div>
      )}
      {plan && (
        <>
          {plan.note && <p className="rounded-lg border border-warn px-4 py-3">{plan.note}</p>}
          <TodayCard title="Workout" headline={plan.workout.title} detail={plan.workout.why || plan.workout.summary} href="/workout" />
          <TodayCard title="Food" headline={`${plan.food.calories} calories`} detail={`Aim for ${plan.food.proteinG}g protein`} href="/food" />
          {plan.workout.exercises.length > 0 && <DoneButton focus={plan.focus} />}
          <StreakBadge />
          <Link href="/checkin" className="block text-center text-muted underline">Not feeling your best? Adjust today's plan</Link>
        </>
      )}
    </div>
  );
}
