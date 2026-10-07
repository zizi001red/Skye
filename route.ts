import { NextResponse } from "next/server";
import { generatePlan } from "@/lib/ai/planGenerator";

export const maxDuration = 30;

export async function POST(req: Request) {
  const { profile, history, feeling, today } = await req.json();
  if (!profile || !today) return NextResponse.json({ error: "Missing data" }, { status: 400 });
  return NextResponse.json(await generatePlan(profile, history ?? [], feeling, today));
}
