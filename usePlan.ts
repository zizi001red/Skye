"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getFeeling, getHistory, getPlan, getProfile, savePlan, today } from "./storage";
import type { Plan, Profile } from "./types";

// Opens with today's plan already there: uses the saved one, or asks the coach once per day.
export function usePlan() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [error, setError] = useState(false);

  const load = useCallback(async (p: Profile) => {
    setError(false);
    try {
      const res = await fetch("/api/plan", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ profile: p, history: getHistory().slice(-14), feeling: getFeeling(), today: today() }),
      });
      if (!res.ok) throw new Error("plan failed");
      const next = (await res.json()) as Plan;
      savePlan(next);
      setPlan(next);
    } catch {
      setError(true);
    }
  }, []);

  useEffect(() => {
    const p = getProfile();
    if (!p) { router.replace("/onboarding"); return; }
    setProfile(p);
    const cached = getPlan();
    if (cached) { setPlan(cached); return; }
    load(p);
  }, [router, load]);

  return { profile, plan, error, loading: !plan && !error, retry: () => profile && load(profile) };
}
