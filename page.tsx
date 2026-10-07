"use client";
import ExerciseCard from "@/components/ExerciseCard";
import DoneButton from "@/components/DoneButton";
import { usePlan } from "@/lib/usePlan";

export default function Workout() {
  const { plan, loading } = usePlan();
  if (loading || !plan) return <p className="text-muted">Getting your plan ready…</p>;
  const { workout } = plan;
  return (
    <div className="space-y-4">
      <h1 className="text-4xl font-bold">{workout.title}</h1>
      <p className="text-muted">{workout.why} {workout.summary}.</p>
      {workout.exercises.length === 0 && <p>No exercises today. Rest, walk a little, and eat well.</p>}
      {workout.exercises.map((e) => <ExerciseCard key={e.name} {...e} />)}
      {workout.exercises.length > 0 && <DoneButton focus={plan.focus} />}
    </div>
  );
}
