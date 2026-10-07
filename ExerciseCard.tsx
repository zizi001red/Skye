export default function ExerciseCard({ name, sets, reps, restSec, videoUrl }: { name: string; sets: number; reps: number; restSec: number; videoUrl?: string }) {
  return (
    <div className="rounded-lg border border-line bg-white p-4">
      <p className="font-display text-2xl font-semibold">{name}</p>
      <p>{sets} rounds of {reps}. Rest {restSec} seconds.</p>
      {videoUrl ? <a className="text-accent underline" href={videoUrl}>Watch how</a> : null}
    </div>
  );
}
