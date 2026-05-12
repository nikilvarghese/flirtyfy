import { useState, useEffect } from 'react'
import { ActivityIndicator, ScrollView, StyleSheet, TextInput, View } from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { Text } from '@/components/ui/Text'
import { Chip, GradientButton, ScreenShell } from '@/components/FlirtyfyShell'
import { DEMO_CHAT, TONES } from '@/constants/flirtyfy'
import { useFlirtyfy } from '@/store/flirtyfyStore'
import { generateDatingCopy } from '@/services/openai'
import { ACCENT_DIM, BORDER, SURFACE, TEXT_PRIMARY, TEXT_SECONDARY } from '@/lib/theme'
import { useToast } from '@/contexts/ToastContext'
import type { Tone } from '@/types/flirtyfy'

export default function ChatPasteScreen() {
  const params = useLocalSearchParams<{ demo?: string }>()
  const { persona, tone, setTone, addGeneration, defaultToneReplies } = useFlirtyfy()
  const { showToast } = useToast()
  const [input, setInput] = useState(params.demo ?? DEMO_CHAT)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setTone(defaultToneReplies)
  }, [defaultToneReplies])

  async function generate() {
    if (loading || input.trim().length < 8) return
    setLoading(true)
    try {
      const generation = await generateDatingCopy({ kind: 'reply', input, tone, persona })
      addGeneration(generation)
      showToast('Replies generated', 'success')
      router.push({ pathname: '/results', params: { id: generation.id } } as any)
    } catch {
      showToast('Failed to generate replies', 'error')
    } finally {
      setLoading(false)
    }
  }

  function switchTone(nextTone: Tone) {
    setTone(nextTone)
    if (nextTone !== tone) showToast(`Tone switched to ${nextTone}`, 'success')
  }

  return (
    <ScreenShell title="Paste chat" subtitle="Drop in a conversation and get copy-ready replies." back>
      <TextInput
        value={input}
        onChangeText={setInput}
        multiline
        textAlignVertical="top"
        placeholder="Paste the chat here..."
        placeholderTextColor="rgba(255,255,255,0.28)"
        style={s.input}
      />

      <Text style={s.label}>Reply Tone</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chips} style={{ maxHeight: 50 }}>
        {TONES.map((item) => <Chip key={item} label={item} active={tone === item} onPress={() => switchTone(item)} />)}
      </ScrollView>

      <View style={{ marginTop: 24 }}>
        <GradientButton
          label={loading ? 'Writing replies...' : 'Generate replies'}
          onPress={generate}
          disabled={loading || input.trim().length < 8}
        />
      </View>

      {loading && (
        <View style={s.loading}>
          <ActivityIndicator color="#ff4f7b" />
          <Text style={s.loadingText}>Analyzing the vibe...</Text>
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScreenShell>
  )
}

const s = StyleSheet.create({
  input: {
    minHeight: 270,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
    backgroundColor: SURFACE,
    padding: 18,
    color: TEXT_PRIMARY,
    fontSize: 15,
    lineHeight: 23,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 22,
    elevation: 3,
  },
  label: { color: TEXT_SECONDARY, fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12, marginTop: 26 },
  chips: { gap: 9, paddingRight: 6 },
  loading: { alignItems: 'center', gap: 12, marginTop: 32, padding: 18, borderRadius: 18, borderWidth: 1, borderColor: BORDER, backgroundColor: ACCENT_DIM },
  loadingText: { color: TEXT_SECONDARY, fontSize: 14, fontWeight: '600' },
})
