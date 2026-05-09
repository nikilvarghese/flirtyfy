import React, { createContext, useContext, useMemo, useState, useEffect } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import type { Generation, Persona, Tone } from '@/types/flirtyfy'

const HISTORY_KEY = '@flirtyfy_history'
const FAVORITES_KEY = '@flirtyfy_favorites'

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
}

const FlirtyfyContext = createContext<FlirtyfyState | null>(null)

export function FlirtyfyProvider({ children }: { children: React.ReactNode }) {
  const [persona, setPersona] = useState<Persona>('Charmer')
  const [tone, setTone] = useState<Tone>('Flirty')
  const [history, setHistory] = useState<Generation[]>([])
  const [favorites, setFavorites] = useState<Generation[]>([])

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const storedHistory = await AsyncStorage.getItem(HISTORY_KEY)
        const storedFavorites = await AsyncStorage.getItem(FAVORITES_KEY)
        if (storedHistory) setHistory(JSON.parse(storedHistory))
        if (storedFavorites) setFavorites(JSON.parse(storedFavorites))
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
    AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites))
  }, [favorites])

  const value = useMemo<FlirtyfyState>(() => ({
    persona,
    tone,
    history,
    favorites,
    setPersona,
    setTone,
    addGeneration: (generation) => {
      setHistory((current) => [generation, ...current])
    },
    removeGeneration: (id) => {
      setHistory((current) => current.filter((item) => item.id !== id))
    },
    removeGenerations: (ids) => {
      setHistory((current) => current.filter((item) => !ids.includes(item.id)))
    },
    clearHistory: () => {
      setHistory([])
    },
    toggleFavorite: (generation) => {
      setFavorites((current) => {
        const exists = current.some((item) => item.id === generation.id)
        if (exists) {
          return current.filter((item) => item.id !== generation.id)
        } else {
          return [{ ...generation, favorite: true }, ...current]
        }
      })
      // Update favorite status in history too
      setHistory((current) => current.map(item => 
        item.id === generation.id ? { ...item, favorite: !item.favorite } : item
      ))
    },
  }), [persona, tone, history, favorites])

  return <FlirtyfyContext.Provider value={value}>{children}</FlirtyfyContext.Provider>
}

export function useFlirtyfy() {
  const ctx = useContext(FlirtyfyContext)
  if (!ctx) throw new Error('useFlirtyfy must be used inside FlirtyfyProvider')
  return ctx
}
