# Sagar Fit

Open the app and today's plan is already there: what to train, what to eat.

## How it works
1. First time: Sagar answers 11 quick questions (weight, goal, gym days, experience, diet, injuries).
2. Every day the first open asks the Grok coach for today's workout. It looks at his recent sessions so it never repeats the same muscles back to back.
3. Calories and protein come from a formula in `lib/nutrition/calculator.ts`, not from the AI.
4. He taps "I finished my workout" so tomorrow's plan knows what he did.
5. If he feels tired, sore or has pain, "Adjust today's plan" changes the plan. Pain gives a rest day.
6. Rest day appears automatically once he's hit his gym days for the week.
7. If the AI is unavailable, a built-in rotation (Push/Pull/Legs, Upper/Lower) is used, so the app always works.

His data is stored on his phone (no login, no database).
This is a coaching aid, not medical advice.

## Run it
```bash
npm install
cp .env.example .env.local   # add XAI_API_KEY
npm run dev
```
Without `XAI_API_KEY` the built-in rotation is used.

## Deploy on Vercel
1. Push this folder to a GitHub repo.
2. On vercel.com choose "Add New Project" and import the repo.
3. Under Environment Variables add `XAI_API_KEY` (and optionally `XAI_MODEL`).
4. Deploy, then send Sagar the link. On his phone he can tap Share > Add to Home Screen.

## Structure
- `app/` screens and the `/api/plan` route
- `components/` cards and buttons
- `lib/ai/` coach prompt, plan generator (Grok), safety checks
- `lib/nutrition/` calorie maths
- `lib/workouts/` exercise library and splits
- `lib/storage.ts` saves everything on the phone
