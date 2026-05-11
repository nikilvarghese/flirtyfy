import React, { createContext, useContext, useMemo, useState, useEffect } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import type { Generation, Persona, Tone } from '@/types/flirtyfy'

const HISTORY_KEY = '@flirtyfy_history'

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
        if (storedHistory) {
          const parsedHistory =
            JSON.parse(storedHistory)

          setHistory(parsedHistory)

          setFavorites(
            parsedHistory.filter(
              (item: Generation) =>
                item.favorite
            )
          )
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
  }), [persona, tone, history, favorites])

  return <FlirtyfyContext.Provider value={value}>{children}</FlirtyfyContext.Provider>
}

export function useFlirtyfy() {
  const ctx = useContext(FlirtyfyContext)
  if (!ctx) throw new Error('useFlirtyfy must be used inside FlirtyfyProvider')
  return ctx
}
