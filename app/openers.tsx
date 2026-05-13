import { useEffect, useRef, useState } from 'react'
import { ActivityIndicator, ScrollView, StyleSheet, TextInput, View } from 'react-native'
import { router } from 'expo-router'
import { Text } from '@/components/ui/Text'
import { Chip, GradientButton, ScreenShell } from '@/components/FlirtyfyShell'
import { DEMO_PROFILE, TONES } from '@/constants/flirtyfy'
import { DemoAction } from '@/components/DemoAction'
import { ToolTextArea } from '@/components/ToolTextArea'
import { useFlirtyfy } from '@/store/flirtyfyStore'
import { generateDatingCopy } from '@/services/openai'
import { ACCENT_DIM, BORDER, TEXT_PRIMARY, TEXT_SECONDARY, TEXT_TERTIARY } from '@/lib/theme'
import { useToast } from '@/contexts/ToastContext'
import type { Tone } from '@/types/flirtyfy'

export default function OpenersScreen() {
  const {
    persona,
    tone,
    setTone,
    addGeneration,
    defaultToneOpeners,
  } = useFlirtyfy()
  const { showToast } = useToast()
  const inputRef = useRef<TextInput>(null)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [demoFlashKey, setDemoFlashKey] = useState(0)

  useEffect(() => {
    setTone(defaultToneOpeners)
  }, [defaultToneOpeners])

  function loadDemoProfile() {
    setInput(DEMO_PROFILE)
    setDemoFlashKey((current) => current + 1)

    requestAnimationFrame(() => {
      setTimeout(() => {
        inputRef.current?.focus()
        inputRef.current?.setNativeProps?.({
          selection: { start: DEMO_PROFILE.length, end: DEMO_PROFILE.length },
        })
      }, 40)
    })
  }

  async function generate() {
    if (loading || input.trim().length < 8) return
    setLoading(true)
    try {
      const generation = await generateDatingCopy({ kind: 'opener', input, tone, persona })
      addGeneration(generation)
      showToast('Openers generated', 'success')
      router.push({ pathname: '/results', params: { id: generation.id } } as any)
    } catch {
      showToast('Failed to generate openers', 'error')
    } finally {
      setLoading(false)
    }
  }

  function switchTone(nextTone: Tone) {
    setTone(nextTone)
    if (nextTone !== tone) showToast(`Tone switched to ${nextTone}`, 'success')
  }

  return (
    <ScreenShell title="Openers" subtitle="Personalized first messages from profile details." back>
      {!input.trim() && (
        <DemoAction
          label="Use demo profile"
          hint="Load a sample interaction."
          onPress={loadDemoProfile}
        />
      )}

      <ToolTextArea
        ref={inputRef}
        value={input}
        onChangeText={setInput}
        placeholder="Enter profile details, interests, or prompts..."
        flashKey={demoFlashKey}
        overlay={
          <View style={s.overlay}>
            <Text style={s.overlayLabel}>Profile context</Text>
            <Text style={s.overlayTitle}>Describe the person you want to message.</Text>
            <Text style={s.overlayBody}>Add profile details or load the demo to preview AI-generated openers.</Text>
          </View>
        }
      />

      <Text style={s.label}>Opening Tone</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chips} style={{ maxHeight: 50 }}>
        {TONES.map((item) => <Chip key={item} label={item} active={tone === item} onPress={() => switchTone(item)} />)}
      </ScrollView>

      <View style={{ marginTop: 24 }}>
        <GradientButton
          label={loading ? 'Writing openers...' : 'Generate openers'}
          onPress={generate}
          disabled={loading || input.trim().length < 8}
        />
      </View>

      {loading && (
        <View style={s.loading}>
          <ActivityIndicator color="#ff4f7b" />
          <Text style={s.loadingText}>Crafting the perfect icebreaker...</Text>
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScreenShell>
  )
}

const s = StyleSheet.create({
  overlay: { maxWidth: 340, gap: 8 },
  overlayLabel: { color: TEXT_TERTIARY, fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  overlayTitle: { color: TEXT_PRIMARY, fontSize: 19, lineHeight: 24, fontWeight: '800', marginTop: 2 },
  overlayBody: { color: TEXT_SECONDARY, fontSize: 13, lineHeight: 19, fontWeight: '500' },
  label: { color: TEXT_SECONDARY, fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 26, marginBottom: 12 },
  chips: { gap: 9, paddingRight: 6 },
  loading: { alignItems: 'center', gap: 12, marginTop: 32, padding: 18, borderRadius: 18, borderWidth: 1, borderColor: BORDER, backgroundColor: ACCENT_DIM },
  loadingText: { color: TEXT_SECONDARY, fontSize: 14, fontWeight: '600' },
})
