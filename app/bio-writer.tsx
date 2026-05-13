import { useEffect, useRef, useState } from 'react'
import { ActivityIndicator, ScrollView, StyleSheet, TextInput, View } from 'react-native'
import { router } from 'expo-router'
import { Text } from '@/components/ui/Text'
import { Chip, GradientButton, ScreenShell } from '@/components/FlirtyfyShell'
import { DemoAction } from '@/components/DemoAction'
import { ToolTextArea } from '@/components/ToolTextArea'
import { DEMO_BIO } from '@/constants/flirtyfy'
import { useFlirtyfy } from '@/store/flirtyfyStore'
import { generateDatingCopy } from '@/services/openai'
import { ACCENT_DIM, BORDER, TEXT_PRIMARY, TEXT_SECONDARY, TEXT_TERTIARY } from '@/lib/theme'
import { useToast } from '@/contexts/ToastContext'
import type { Tone } from '@/types/flirtyfy'

const styles: Tone[] = ['Funny', 'Confident', 'Soft', 'Gen Z', 'Direct', 'Bold']

export default function BioWriterScreen() {
  const { persona, tone, setTone, addGeneration, defaultToneBio } = useFlirtyfy()
  const { showToast } = useToast()
  const inputRef = useRef<TextInput>(null)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [demoFlashKey, setDemoFlashKey] = useState(0)

  useEffect(() => {
    setTone(defaultToneBio)
  }, [defaultToneBio])

  function loadDemoBio() {
    setInput(DEMO_BIO)
    setDemoFlashKey((current) => current + 1)

    requestAnimationFrame(() => {
      setTimeout(() => {
        inputRef.current?.focus()
        inputRef.current?.setNativeProps?.({
          selection: { start: DEMO_BIO.length, end: DEMO_BIO.length },
        })
      }, 40)
    })
  }

  async function generate() {
    if (loading || input.trim().length < 8) return
    setLoading(true)
    try {
      const generation = await generateDatingCopy({ kind: 'bio', input, tone, persona })
      addGeneration(generation)
      showToast('Bios generated', 'success')
      router.push({ pathname: '/results', params: { id: generation.id } } as any)
    } catch {
      showToast('Failed to generate bios', 'error')
    } finally {
      setLoading(false)
    }
  }

  function switchTone(nextTone: Tone) {
    setTone(nextTone)
    if (nextTone !== tone) showToast(`Tone switched to ${nextTone}`, 'success')
  }

  return (
    <ScreenShell title="Bio Writer" subtitle="Write Tinder, Bumble, and Hinge bios that feel specific and premium." back>
      {!input.trim() && (
        <DemoAction
          label="Use demo bio"
          hint="Preview AI-generated rewrites."
          onPress={loadDemoBio}
        />
      )}

      <ToolTextArea
        ref={inputRef}
        value={input}
        onChangeText={setInput}
        placeholder="Enter your interests, facts, or current bio..."
        flashKey={demoFlashKey}
        overlay={
          <View style={s.overlay}>
            <Text style={s.overlayLabel}>Rough bio</Text>
            <Text style={s.overlayTitle}>Start with anything honest, messy, or unfinished.</Text>
            <Text style={s.overlayBody}>Load the demo to see how Flirtyfy turns a rough bio into polished options.</Text>
          </View>
        }
      />

      <Text style={s.label}>Bio Vibe</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chips} style={{ maxHeight: 50 }}>
        {styles.map((item) => <Chip key={item} label={item} active={tone === item} onPress={() => switchTone(item)} />)}
      </ScrollView>

      <View style={{ marginTop: 24 }}>
        <GradientButton
          label={loading ? 'Writing bios...' : 'Generate bios'}
          onPress={generate}
          disabled={loading || input.trim().length < 8}
        />
      </View>

      {loading && (
        <View style={s.loading}>
          <ActivityIndicator color="#ff4f7b" />
          <Text style={s.loadingText}>Polishing your bio to perfection...</Text>
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScreenShell>
  )
}

const s = StyleSheet.create({
  overlay: { maxWidth: 338, gap: 8 },
  overlayLabel: { color: TEXT_TERTIARY, fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  overlayTitle: { color: TEXT_PRIMARY, fontSize: 19, lineHeight: 24, fontWeight: '800', marginTop: 2 },
  overlayBody: { color: TEXT_SECONDARY, fontSize: 13, lineHeight: 19, fontWeight: '500' },
  label: { color: TEXT_SECONDARY, fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 26, marginBottom: 12 },
  chips: { gap: 9, paddingRight: 6 },
  loading: { alignItems: 'center', gap: 12, marginTop: 32, padding: 18, borderRadius: 18, borderWidth: 1, borderColor: BORDER, backgroundColor: ACCENT_DIM },
  loadingText: { color: TEXT_SECONDARY, fontSize: 14, fontWeight: '600' },
})
