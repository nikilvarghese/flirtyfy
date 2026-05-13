import type { Persona, Tone } from '@/types/flirtyfy'

export const APP_BRAND = 'Flirtyfy'
export const APP_TAGLINE = 'AI replies that do not sound AI.'

export const TONES: Tone[] = [
  'Funny',
  'Flirty',
  'Confident',
  'Direct',
  'Romantic',
  'Savage',
  'Gen Z',
  'Soft',
  'Bold',
]

export const PERSONAS: Array<{
  name: Persona
  caption: string
}> = [
  { name: 'Charmer', caption: 'Warm, witty, emotionally tuned.' },
  { name: 'Savage', caption: 'Playful pressure, never mean.' },
  { name: 'Gentleman', caption: 'Classy, calm, mature.' },
  { name: 'Flirty', caption: 'Fast spark with soft confidence.' },
  { name: 'Meme Lord', caption: 'Internet fluent without being cringe.' },
  { name: 'Minimalist', caption: 'Short, clean, high signal.' },
]

export const DEMO_CHAT =
  "Them: you always say you're trouble\nMe: only when the company is boring\nThem: so am I boring?"

export const DEMO_PROFILE =
  'Photographer, gym addict, espresso martinis, spontaneous road trips, dry humor, and a dangerous mini golf winning streak.'

export const DEMO_BIO =
  'Love late night drives, sushi, dogs, and pretending I know how to cook.'
