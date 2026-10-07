"use client";
import { useRouter } from "next/navigation";
import { clearPlan, setFeeling } from "@/lib/storage";
import type { Feeling } from "@/lib/types";

const options: { value: Feeling; label: string }[] = [
  { value: "Good", label: "Feeling good" },
  { value: "Tired", label: "Tired" },
  { value: "Sore", label: "Muscles are sore" },
  { value: "Pain", label: "Sharp pain somewhere" },
];

export default function CheckInForm() {
  const router = useRouter();
  function choose(f: Feeling) { setFeeling(f); clearPlan(); router.push("/"); }
  return (
    <div className="space-y-3">
      {options.map((o) => (
        <button key={o.value} onClick={() => choose(o.value)} className="block w-full rounded-lg border border-line bg-white px-4 py-3 text-left">{o.label}</button>
      ))}
    </div>
  );
}
