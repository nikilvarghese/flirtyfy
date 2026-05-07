export type Tone =
  | 'Funny'
  | 'Flirty'
  | 'Confident'
  | 'Direct'
  | 'Romantic'
  | 'Savage'
  | 'Gen Z'
  | 'Soft'
  | 'Bold'

export type Persona =
  | 'Charmer'
  | 'Savage'
  | 'Gentleman'
  | 'Flirty'
  | 'Meme Lord'
  | 'Minimalist'

export type GenerationKind = 'reply' | 'opener' | 'bio' | 'ocr'

export type Suggestion = {
  id: string
  tone: Tone | string
  reply: string
  reason?: string
}

export type Generation = {
  id: string
  kind: GenerationKind
  title: string
  input: string
  persona: Persona
  tone: Tone
  suggestions: Suggestion[]
  createdAt: string
  favorite?: boolean
}

export type UsagePlan = {
  freeDailyLimit: number
  usedToday: number
}
