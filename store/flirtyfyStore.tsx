import React, { createContext, useContext, useMemo, useState } from 'react'
import type { Generation, Persona, Tone } from '@/types/flirtyfy'

type FlirtyfyState = {
  persona: Persona
  tone: Tone
  history: Generation[]
  favorites: Generation[]
  setPersona: (persona: Persona) => void
  setTone: (tone: Tone) => void
  addGeneration: (generation: Generation) => void
  removeGeneration: (id: string) => void
  clearHistory: () => void
  toggleFavorite: (generation: Generation) => void
}

const FlirtyfyContext = createContext<FlirtyfyState | null>(null)

export function FlirtyfyProvider({ children }: { children: React.ReactNode }) {
  const [persona, setPersona] = useState<Persona>('Charmer')
  const [tone, setTone] = useState<Tone>('Flirty')
  const [history, setHistory] = useState<Generation[]>([])
  const [favorites, setFavorites] = useState<Generation[]>([])

  const value = useMemo<FlirtyfyState>(() => ({
    persona,
    tone,
    history,
    favorites,
    setPersona,
    setTone,
    addGeneration: (generation) => {
      setHistory((current) => [generation, ...current.filter((item) => item.id !== generation.id)])
    },
    removeGeneration: (id) => {
      setHistory((current) => current.filter((item) => item.id !== id))
    },
    clearHistory: () => {
      setHistory([])
    },
    toggleFavorite: (generation) => {
      setFavorites((current) => {
        const exists = current.some((item) => item.id === generation.id)
        return exists
          ? current.filter((item) => item.id !== generation.id)
          : [{ ...generation, favorite: true }, ...current]
      })
    },
  }), [persona, tone, history, favorites])

  return <FlirtyfyContext.Provider value={value}>{children}</FlirtyfyContext.Provider>
}

export function useFlirtyfy() {
  const ctx = useContext(FlirtyfyContext)
  if (!ctx) throw new Error('useFlirtyfy must be used inside FlirtyfyProvider')
  return ctx
}
