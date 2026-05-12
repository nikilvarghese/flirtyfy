import { useState, useEffect } from 'react'
import { ActivityIndicator, ScrollView, StyleSheet, TextInput, View } from 'react-native'
import { router } from 'expo-router'
import { Text } from '@/components/ui/Text'
import { Chip, GradientButton, ScreenShell } from '@/components/FlirtyfyShell'
import { useFlirtyfy } from '@/store/flirtyfyStore'
import { generateDatingCopy } from '@/services/openai'
import { ACCENT_DIM, BORDER, SURFACE, TEXT_PRIMARY, TEXT_SECONDARY } from '@/lib/theme'
import { useToast } from '@/contexts/ToastContext'
import type { Tone } from '@/types/flirtyfy'

const styles: Tone[] = ['Funny', 'Confident', 'Soft', 'Gen Z', 'Direct', 'Bold']

export default function BioWriterScreen() {
  const { persona, tone, setTone, addGeneration, defaultToneBio } = useFlirtyfy()
  const { showToast } = useToast()
  const [input, setInput] = useState('I like design, gym, sushi, travel, late-night drives, and dry humor.')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setTone(defaultToneBio)
  }, [defaultToneBio])

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
    if (nextTone !== tone) showToast(`Tone switched to ${nextTone}`, 'info')
  }

  return (
    <ScreenShell title="Bio Writer" subtitle="Write Tinder, Bumble, and Hinge bios that feel specific and premium." back>
      <TextInput
        value={input}
        onChangeText={setInput}
        multiline
        textAlignVertical="top"
        style={s.input}
        placeholder="Enter your interests, facts, or current bio..."
        placeholderTextColor="rgba(255,255,255,0.28)"
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
  label: { color: TEXT_SECONDARY, fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 26, marginBottom: 12 },
  chips: { gap: 9, paddingRight: 6 },
  loading: { alignItems: 'center', gap: 12, marginTop: 32, padding: 18, borderRadius: 18, borderWidth: 1, borderColor: BORDER, backgroundColor: ACCENT_DIM },
  loadingText: { color: TEXT_SECONDARY, fontSize: 14, fontWeight: '600' },
})
