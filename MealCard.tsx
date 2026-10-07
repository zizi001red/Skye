export default function MealCard({ name, portions }: { name: string; portions: string }) {
  return (
    <div className="rounded-lg border border-line bg-white p-4">
      <p className="font-display text-2xl font-semibold">{name}</p>
      <p className="text-muted">{portions}</p>
    </div>
  );
}
