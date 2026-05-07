# Flirtyfy Reflection

## What Was Easy

The 8x template gave the project a strong starting point: Expo Router, protected auth guards, Supabase OTP auth, RevenueCat context, Sentry, PostHog, i18n, offline UI, and reusable components were already in place. That made it fast to focus on product behavior instead of boilerplate.

## What Was Difficult

The hardest part was balancing contest completeness with production safety. A real OpenAI mobile app should proxy model calls through Supabase Edge Functions so API keys are never shipped to the client. For the challenge demo, the app supports direct `EXPO_PUBLIC_OPENAI_API_KEY` configuration, but the README calls out the production proxy path.

## What Was Learned

RIZZ-style products live or die by small UX details: fast entry points, strong defaults, multiple outputs, clear tone/persona controls, and copy/favorite/regenerate actions. The app also needs graceful fallback content so a Loom walkthrough can still show the end-to-end flow even before external services are configured.

## What Would Be Improved

Next I would add a Supabase Edge Function for rate-limited OpenAI calls, a native clipboard dependency, server-side OCR audit logs, deeper RevenueCat entitlement testing, and automated screenshot capture for the final submission gallery.
