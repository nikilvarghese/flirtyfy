import { useEffect, useRef, useState } from 'react'
import { ActivityIndicator, ScrollView, StyleSheet, TextInput, View } from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { Text } from '@/components/ui/Text'
import { Chip, GradientButton, ScreenShell } from '@/components/FlirtyfyShell'
import { DEMO_CHAT, TONES } from '@/constants/flirtyfy'
import { DemoAction } from '@/components/DemoAction'
import { ToolTextArea } from '@/components/ToolTextArea'
import { useFlirtyfy } from '@/store/flirtyfyStore'
import { generateDatingCopy } from '@/services/openai'
import { ACCENT_DIM, BORDER, TEXT_PRIMARY, TEXT_SECONDARY, TEXT_TERTIARY } from '@/lib/theme'
import { useToast } from '@/contexts/ToastContext'
import type { Tone } from '@/types/flirtyfy'

export default function ChatPasteScreen() {
  const params = useLocalSearchParams<{ demo?: string }>()
  const { persona, tone, setTone, addGeneration, defaultToneReplies } = useFlirtyfy()
  const { showToast } = useToast()
  const inputRef = useRef<TextInput>(null)
  const [input, setInput] = useState(params.demo ?? '')
  const [loading, setLoading] = useState(false)
  const [demoFlashKey, setDemoFlashKey] = useState(0)

  useEffect(() => {
    setTone(defaultToneReplies)
  }, [defaultToneReplies])

  function loadDemoConversation() {
    const demoConversation = params.demo?.trim() ? params.demo : DEMO_CHAT
    setInput(demoConversation)
    setDemoFlashKey((current) => current + 1)

    requestAnimationFrame(() => {
      setTimeout(() => {
        inputRef.current?.focus()
        inputRef.current?.setNativeProps?.({
          selection: { start: demoConversation.length, end: demoConversation.length },
        })
      }, 40)
    })
  }

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
      {!input.trim() && (
        <DemoAction
          label="Use demo conversation"
          hint="See how Flirtyfy works instantly."
          onPress={loadDemoConversation}
        />
      )}

      <ToolTextArea
        ref={inputRef}
        value={input}
        onChangeText={setInput}
        placeholder="Paste the chat here..."
        flashKey={demoFlashKey}
        overlay={
          <View style={s.overlay}>
            <Text style={s.overlayLabel}>Conversation</Text>
            <Text style={s.overlayTitle}>Paste a chat or load the demo.</Text>
            <Text style={s.overlayBody}>Preview AI-generated replies from a realistic dating exchange.</Text>
          </View>
        }
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
  overlay: { maxWidth: 320, gap: 8 },
  overlayLabel: { color: TEXT_TERTIARY, fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  overlayTitle: { color: TEXT_PRIMARY, fontSize: 19, lineHeight: 24, fontWeight: '800', marginTop: 2 },
  overlayBody: { color: TEXT_SECONDARY, fontSize: 13, lineHeight: 19, fontWeight: '500' },
  label: { color: TEXT_SECONDARY, fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12, marginTop: 26 },
  chips: { gap: 9, paddingRight: 6 },
  loading: { alignItems: 'center', gap: 12, marginTop: 32, padding: 18, borderRadius: 18, borderWidth: 1, borderColor: BORDER, backgroundColor: ACCENT_DIM },
  loadingText: { color: TEXT_SECONDARY, fontSize: 14, fontWeight: '600' },
})
