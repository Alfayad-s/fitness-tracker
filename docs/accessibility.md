# Accessibility

Audit status for Fitness Tracker (mobile-first PWA).

## Semantic HTML

| Area | Status | Notes |
|------|--------|-------|
| Authenticated pages | ✅ | `<main>`, `<header>`, `<section>` on dashboard, workouts, progress, profile, nutrition |
| Auth pages | ✅ | Login uses `<header>` + `<main>` via auth layout |
| Active workout | ✅ | `<main>` + exercise `<section>` structure |
| Bottom navigation | ✅ | `<nav aria-label="Main navigation">` with visible text labels |
| Charts | ✅ | Wrapped in labelled sections; data tables available in history lists |

## ARIA labels (icon-only controls)

| Component | Status |
|-----------|--------|
| Bottom nav | ✅ Visible labels + `aria-current="page"` |
| Workout controls (pause, set actions, picker close) | ✅ |
| Profile avatar upload | ✅ |
| Header profile link | ✅ |
| AI prompt send / voice button | ✅ Dynamic `aria-label` |
| Rest timer cancel | ✅ |
| PWA install dismiss | ✅ |

Decorative icons use `aria-hidden` where paired with visible text.

## Color contrast (charts & cards)

Charts use theme tokens designed for light and dark mode:

| Element | Tokens | Notes |
|---------|--------|-------|
| Chart axes & grid | `muted-foreground`, border | Body text ≥ 4.5:1 on background in default themes |
| Bar / line fills | `primary`, `chart-*` CSS vars | Sufficient contrast against card background |
| Stat cards | `card`, `foreground` | shadcn/ui defaults |
| Destructive / alerts | `destructive` | Used for errors only |

**Manual check:** verify Progress charts in **both** light and dark mode on a physical device. Recharts tooltips inherit foreground colors.

**Known limitation:** feeling picker emojis are decorative; text labels carry meaning.

## Testing tools

- VoiceOver (iOS) / TalkBack (Android) — bottom nav and workout set inputs
- Safari → Develop → Accessibility Inspector
- [axe DevTools](https://www.deque.com/axe/devtools/) browser extension

## Future improvements

- Skip link to main content on auth pages
- Reduced motion preference for slide animations
- Live region announcements when workout saves offline
