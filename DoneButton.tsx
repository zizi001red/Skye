"use client";
import { useEffect, useState } from "react";
import { isDoneToday, markDone } from "@/lib/storage";

export default function DoneButton({ focus }: { focus: string }) {
  const [done, setDone] = useState(false);
  useEffect(() => setDone(isDoneToday()), []);
  if (done) return <p className="rounded-lg border border-accent px-4 py-3 text-center text-accent">Workout done today. Nice work.</p>;
  return (
    <button onClick={() => { markDone(focus); setDone(true); }} className="w-full rounded-lg bg-accent px-4 py-3 text-white">
      I finished my workout
    </button>
  );
}
