# Flirtyfy

Flirtyfy is a production-minded Android-first React Native app for the 8x Build Challenge: **Build a RIZZ Clone - AI Dating Message Assistant**. Users paste or upload dating conversations, choose a tone and AI persona, then generate copy-ready replies, openers, and dating bio rewrites.

The project is built on the `8xsocial/template-mobile` architecture and preserves the template foundations: Expo Router file routing, Stack protected guards, Supabase OTP auth, RevenueCat subscription context, Sentry, PostHog, centralized theme constants, custom tab bar, i18n, offline banners/overlays, and reusable UI components.

## Features

- Supabase OTP login with persisted sessions and protected routes.
- Onboarding flow after first login.
- Home dashboard with paste chat, screenshot OCR, opener, bio writer, persona, history, and favorites entry points.
- AI reply generation with Funny, Flirty, Confident, Direct, Romantic, Savage, Gen Z, Soft, and Bold tones.
- AI personas: Charmer, Savage, Gentleman, Flirty, Meme Lord, and Minimalist.
- OpenAI integration using `gpt-4o-mini` by default, with demo fallbacks when keys are missing.
- Screenshot upload via Expo Image Picker and OCR extraction through OpenAI vision.
- Results screen with multiple suggestions, copy/share, favorite, and regenerate actions.
- Supabase schema for `profiles`, `generations`, `favorites`, `subscriptions`, and `usage_tracking`.
- RevenueCat paywall hook for unlimited generations, premium tones, and premium personas.
- PostHog events for onboarding, generation, OCR, subscription, and screen tracking.
- Sentry capture for generation/OCR/API failures.
- Offline UI inherited from the template.
- Contest deliverables: `ai-logs/`, `Reflection.md`, screenshots placeholders, schema, setup docs.

## Tech Stack

- React Native + Expo SDK
- Expo Router
- TypeScript
- Supabase
- NativeWind/Tailwind-ready theme setup
- TanStack Query
- RevenueCat
- OpenAI
- Expo Image Picker
- Secure Store
- Sentry
- PostHog
- Reanimated + Gesture Handler

## Setup

```bash
npm install
npm run start
```

Run on Android:

```bash
npm run android
```

Type-check:

```bash
npm run typecheck
```

## Environment Variables

Copy `.env.example` to `.env.local` and fill:

```bash
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY=
EXPO_PUBLIC_REVENUECAT_IOS_API_KEY=
EXPO_PUBLIC_SENTRY_DSN=
EXPO_PUBLIC_POSTHOG_KEY=
EXPO_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
EXPO_PUBLIC_OPENAI_API_KEY=
EXPO_PUBLIC_OPENAI_MODEL=gpt-4o-mini
```

For production, move OpenAI calls into a Supabase Edge Function and keep the OpenAI secret server-side. The direct Expo public key path is included only for contest/demo speed.

## Supabase Setup

1. Create a Supabase project.
2. Enable email OTP auth.
3. Apply migrations:

```bash
supabase db push
```

4. Tables included:

- `profiles`
- `generations`
- `favorites`
- `subscriptions`
- `usage_tracking`

The app inserts generation records when Supabase is configured. Without Supabase, local demo state still works for a Loom walkthrough.

## OpenAI Setup

Set:

```bash
EXPO_PUBLIC_OPENAI_API_KEY=sk-...
EXPO_PUBLIC_OPENAI_MODEL=gpt-4o-mini
```

Structured prompts live in `services/openai.ts`. Outputs normalize to:

```json
[
  {
    "tone": "flirty",
    "reply": "Not yet. You still have time to surprise me.",
    "reason": "Playful challenge without being harsh."
  }
]
```

## RevenueCat Setup

1. Create a RevenueCat project.
2. Add Android and iOS apps.
3. Create a `premium` entitlement.
4. Add a monthly or annual package to the default offering.
5. Set `EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY` and/or `EXPO_PUBLIC_REVENUECAT_IOS_API_KEY`.

The paywall is implemented in `app/upgrade.tsx` and uses the existing template subscription context.

## Android And Expo Build

Android package: `com.flirtyfy.app`

```bash
npx eas build --platform android --profile preview
npx eas build --platform android --profile production
```

The app config includes Android permissions for camera/gallery flows, adaptive icon configuration, splash configuration, and deep linking through the `flirtyfy://` scheme.

## Architecture

```text
app/                 Expo Router screens and protected groups
components/          Shared UI and Flirtyfy product shell
constants/           Product constants, tones, personas, demo input
contexts/            Template subscription/toast contexts
hooks/               Template query hooks
lib/                 Supabase, analytics, purchases, theme, i18n
services/            OpenAI generation and OCR integration
store/               Flirtyfy app state provider
types/               Domain TypeScript types
supabase/            Migrations and functions
ai-logs/             Required contest AI logs
screenshots/         Submission screenshot placeholders
```

## AI Logging Instructions

The contest requires AI logs. The repository includes `ai-logs/example-log.md`.

### Claude Code

- Logs saved automatically to:
  `~/.claude/projects/<name>/`
- Copy `.md` and `.jsonl` files into:
  `./ai-logs/`

### Cursor

- Open Chat panel
- Click `...`
- Export conversation
- Save export into:
  `./ai-logs/` as `.txt`

### Windsurf / Codeium

- Open Cascade
- Right click thread
- Copy all messages
- Paste into:
  `./ai-logs/<thread>.txt`

### Required Log Structure

Every AI interaction log must follow:

```md
## Prompt
<user prompt>

## Response
<AI response>

---
```

## Screenshots

Place final app screenshots in `screenshots/`. Recommended coverage: splash, onboarding, login, home, paste chat, OCR upload, results, openers, bio writer, personas, favorites, history, profile, settings, and paywall.

## Loom Walkthrough

Suggested flow:

1. Launch app and show onboarding/login.
2. Use the dev skip button for demo speed if running locally.
3. Paste the demo conversation and generate replies.
4. Favorite and copy/share a result.
5. Upload a screenshot or show OCR fallback.
6. Generate openers and bio rewrites.
7. Open persona selector and paywall.
8. Show history/favorites and `ai-logs/`.

## Deployment

Use EAS for Android builds. Configure Supabase, RevenueCat, Sentry, PostHog, and OpenAI environment variables in EAS secrets before production builds.
