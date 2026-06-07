# Workout logging — tester guide

Step-by-step flow for manual QA and demo walkthroughs.

## 1. Sign in

1. Open the app → `/login`
2. Sign in with **email OTP**, **Google**, or **Apple**
3. Confirm you land on **Dashboard**

## 2. Start a workout

**Option A — Slide control (dashboard)**

1. On Dashboard, slide **“Slide to start workout”** to the right
2. You arrive at **New workout**

**Option B — Workouts tab**

1. Tap **Workouts** in the bottom nav
2. Tap **New workout** (or resume banner if a session was left open)

**Option C — Direct**

1. Navigate to `/workouts/new`

On **New workout**:

1. Edit **Title** (default: “Workout”)
2. Set **Date** if needed
3. Optional **Notes**
4. Tap **Start workout** → **Active workout** screen

## 3. Add exercises

1. Tap **Add exercise**
2. **Search** tab: filter by muscle group or type a name
3. Tap an exercise to add it (or **Create custom** for a one-off)
4. Repeat for more exercises

Each exercise starts with **one empty set**.

## 4. Log sets

For each set row:

| Field | Description |
|-------|-------------|
| **Weight (kg)** | Load used |
| **Reps** | Repetitions completed |
| **RPE** | Optional effort 1–10 |

- Tap **Duplicate** to copy a set
- Tap **Remove** to delete a set
- Use **Add set** at the bottom of an exercise card for more sets
- Completing weight + reps may start the **rest timer** (bottom bar)

**Pause / resume** — header buttons freeze logging without losing data.

## 5. Finish or discard

**Finish**

1. Tap **Finish workout** (requires at least one exercise)
2. Optional: pick how it felt (Terrible → Great)
3. Tap **Save workout**
4. Redirect to workout **detail** or **history** (offline saves queue and sync later)

**Discard**

1. Tap **Discard workout** → confirm
2. Session cleared; returns to workouts list

## 6. Verify saved data

1. **Workouts** tab → new entry in history
2. Tap workout → see exercises, sets, volume, duration
3. **Progress** tab → charts update after enough data
4. **Dashboard** → recent workouts and streak

## Edge cases to test

| Scenario | Expected |
|----------|----------|
| Reload during active workout | Session restored from browser storage |
| Start new workout while one is active | Confirm discard of in-progress session |
| Complete with no sets logged | Save allowed; empty sets ignored in volume |
| Offline complete | Toast/queue; sync when back online |
| Sign out mid-workout | Session cleared on next sign-in guard |

## Related

- [manual-qa-mobile.md](./manual-qa-mobile.md) — device checklist
- [pwa-install-testing.md](./pwa-install-testing.md) — install + standalone mode

## Templates & daily plans

### Workout templates

1. Open **Workouts → Templates** (`/workouts/templates`)
2. Save a template from a **completed workout detail** (“Save as template”)
3. Edit exercises and targets on a template’s edit page
4. Start from a template on **New workout** under “My templates”

### AI daily suggestion

1. Open **Dashboard** or **New workout** — today’s plan is generated once per day (if none exists)
2. Review the **Today’s workout** card (title, exercises, AI rationale)
3. **Upcoming workouts** on the dashboard lists saved plans for future dates
4. **Accept & start** to pre-fill the active session, **Regenerate** for a new suggestion, or **Skip** for a rest day
5. Active **weekly programs** override greenfield AI with scheduled template/rest days

### AI coach — plan & exercise import

In **AI Coach** (`/ai`):

| Say / attach | Result |
|--------------|--------|
| “Plan a leg day for tomorrow” | Preview → **Save plan for tomorrow** |
| “Schedule upper body for next Monday” | Preview for that date → confirm save |
| “Today’s workout should be legs” | Preview plan patch for today |
| “Skip tomorrow” | Marks that date skipped (confirm first) |
| “Add Bulgarian split squat to tomorrow” | Preview exercises → **Save exercises** |
| Workout sheet photo + “import exercises” | Same confirm-then-save flow |
| “Start my suggested workout” | Navigates to **New workout** |

Future dates are planned via chat (not auto-generated). Saved plans appear under **Upcoming workouts** on the dashboard.

All AI writes require explicit confirmation (same as nutrition/BMA).

### Weekly programs (Phase 2)

1. **Workouts → Templates → Programs** (`/workouts/programs`)
2. Activate a preset (PPL, Upper/Lower, Full Body ×3) or your own program
3. Link templates whose names match preset labels (e.g. “Push day”) for auto daily plans

