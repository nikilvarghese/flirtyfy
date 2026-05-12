import React, { createContext, useContext, useMemo, useState, useEffect } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import type { Generation, Persona, Tone } from '@/types/flirtyfy'

const HISTORY_KEY = '@flirtyfy_history'
const PERSONA_KEY = '@flirtyfy_persona'
const TONE_KEY = '@flirtyfy_tone'
const SETTINGS_KEY = '@flirtyfy_settings_v2'

type FlirtyfyState = {
  persona: Persona
  tone: Tone
  history: Generation[]
  favorites: Generation[]
  setPersona: (persona: Persona) => void
  setTone: (tone: Tone) => void
  addGeneration: (generation: Generation) => void
  removeGeneration: (id: string) => void
  removeGenerations: (ids: string[]) => void
  clearHistory: () => void
  toggleFavorite: (generation: Generation) => void
  
  // Default Settings
  defaultToneReplies: Tone
  defaultToneOpeners: Tone
  defaultToneBio: Tone
  defaultToneOCR: Tone
  defaultPersona: Persona
  setDefaultToneReplies: (tone: Tone) => void
  setDefaultToneOpeners: (tone: Tone) => void
  setDefaultToneBio: (tone: Tone) => void
  setDefaultToneOCR: (tone: Tone) => void
  setDefaultPersona: (persona: Persona) => void
}

const FlirtyfyContext = createContext<FlirtyfyState | null>(null)

export function FlirtyfyProvider({ children }: { children: React.ReactNode }) {
  const [persona, setPersona] = useState<Persona>('Charmer')
  const [tone, setTone] = useState<Tone>('Flirty')
  const [history, setHistory] = useState<Generation[]>([])
  const [favorites, setFavorites] = useState<Generation[]>([])

  const [defaultToneReplies, setDefaultToneReplies] = useState<Tone>('Flirty')
  const [defaultToneOpeners, setDefaultToneOpeners] = useState<Tone>('Confident')
  const [defaultToneBio, setDefaultToneBio] = useState<Tone>('Funny')
  const [defaultToneOCR, setDefaultToneOCR] = useState<Tone>('Savage')
  const [defaultPersona, setDefaultPersona] = useState<Persona>('Charmer')

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [storedHistory, storedPersona, storedTone, storedSettings] = await Promise.all([
          AsyncStorage.getItem(HISTORY_KEY),
          AsyncStorage.getItem(PERSONA_KEY),
          AsyncStorage.getItem(TONE_KEY),
          AsyncStorage.getItem(SETTINGS_KEY),
        ])

        if (storedHistory) {
          const parsedHistory = JSON.parse(storedHistory)
          setHistory(parsedHistory)
          setFavorites(parsedHistory.filter((item: Generation) => item.favorite))
        }

        if (storedPersona) setPersona(storedPersona as Persona)
        if (storedTone) setTone(storedTone as Tone)

        if (storedSettings) {
          const s = JSON.parse(storedSettings)
          if (s.defaultToneReplies) setDefaultToneReplies(s.defaultToneReplies)
          if (s.defaultToneOpeners) setDefaultToneOpeners(s.defaultToneOpeners)
          if (s.defaultToneBio) setDefaultToneBio(s.defaultToneBio)
          if (s.defaultToneOCR) setDefaultToneOCR(s.defaultToneOCR)
          if (s.defaultPersona) setDefaultPersona(s.defaultPersona)
        }
      } catch (e) {
        console.error('Failed to load storage', e)
      }
    }
    loadData()
  }, [])

  // Persist data when it changes
  useEffect(() => {
    AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(history))
  }, [history])

  useEffect(() => {
    AsyncStorage.setItem(PERSONA_KEY, persona)
  }, [persona])

  useEffect(() => {
    AsyncStorage.setItem(TONE_KEY, tone)
  }, [tone])

  useEffect(() => {
    const settings = {
      defaultToneReplies,
      defaultToneOpeners,
      defaultToneBio,
      defaultToneOCR,
      defaultPersona,
    }
    AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
  }, [defaultToneReplies, defaultToneOpeners, defaultToneBio, defaultToneOCR, defaultPersona])

  const value = useMemo<FlirtyfyState>(() => ({
    persona,
    tone,
    history,
    favorites,
    setPersona,
    setTone,
    addGeneration: (generation) => {
      setHistory((current) => [
        {
          ...generation,
          favorite: false,
        },
        ...current,
      ])
    },
    removeGeneration: (id) => {
      setHistory((current) =>
        current.filter(
          (item) => item.id !== id
        )
      )

      setFavorites((current) =>
        current.filter(
          (item) => item.id !== id
        )
      )
    },
    removeGenerations: (ids) => {
      setHistory((current) =>
        current.filter(
          (item) => !ids.includes(item.id)
        )
      )

      setFavorites((current) =>
        current.filter(
          (item) => !ids.includes(item.id)
        )
      )
    },
    clearHistory: () => {
      setHistory([])
      setFavorites([])
    },
    toggleFavorite: (generation) => {
      const updatedHistory = history.map((item) =>
        item.id === generation.id
          ? {
            ...item,
            favorite: !item.favorite,
          }
          : item
      )

      setHistory(updatedHistory)

      const updatedFavorites =
        updatedHistory.filter(
          (item) => item.favorite
        )

      setFavorites(updatedFavorites)
    },
    defaultToneReplies,
    defaultToneOpeners,
    defaultToneBio,
    defaultToneOCR,
    defaultPersona,
    setDefaultToneReplies: (t: Tone) => setDefaultToneReplies(t),
    setDefaultToneOpeners: (t: Tone) => setDefaultToneOpeners(t),
    setDefaultToneBio: (t: Tone) => setDefaultToneBio(t),
    setDefaultToneOCR: (t: Tone) => setDefaultToneOCR(t),
    setDefaultPersona: (p: Persona) => {
      setDefaultPersona(p)
      setPersona(p)
    },
  }), [persona, tone, history, favorites, defaultToneReplies, defaultToneOpeners, defaultToneBio, defaultToneOCR, defaultPersona])

  return <FlirtyfyContext.Provider value={value}>{children}</FlirtyfyContext.Provider>
}

export function useFlirtyfy() {
  const ctx = useContext(FlirtyfyContext)
  if (!ctx) throw new Error('useFlirtyfy must be used inside FlirtyfyProvider')
  return ctx
}
