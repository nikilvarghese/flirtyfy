import { useState } from 'react'
import { ActivityIndicator, ScrollView, StyleSheet, TextInput, View } from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { Text } from '@/components/ui/Text'
import { Chip, GradientButton, ScreenShell } from '@/components/FlirtyfyShell'
import { DEMO_CHAT, TONES } from '@/constants/flirtyfy'
import { useFlirtyfy } from '@/store/flirtyfyStore'
import { generateDatingCopy } from '@/services/openai'
import { BORDER, SURFACE, TEXT_SECONDARY } from '@/lib/theme'

export default function ChatPasteScreen() {
  const params = useLocalSearchParams<{ demo?: string }>()
  const { persona, tone, setTone, addGeneration } = useFlirtyfy()
  const [input, setInput] = useState(params.demo ?? DEMO_CHAT)
  const [loading, setLoading] = useState(false)

  async function generate() {
    setLoading(true)
    const generation = await generateDatingCopy({ kind: 'reply', input, tone, persona })
    addGeneration(generation)
    setLoading(false)
    router.push({ pathname: '/results', params: { id: generation.id } })
  }

  return (
    <ScreenShell title="Paste chat" subtitle="Keep the context intact. Flirtyfy reads the vibe and gives multiple replies.">
      <TextInput
        value={input}
        onChangeText={setInput}
        multiline
        textAlignVertical="top"
        placeholder="Paste the chat here..."
        placeholderTextColor="rgba(255,255,255,0.28)"
        style={s.input}
      />
      <Text style={s.label}>Tone</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chips}>
        {TONES.map((item) => <Chip key={item} label={item} active={tone === item} onPress={() => setTone(item)} />)}
      </ScrollView>
      <GradientButton label={loading ? 'Generating...' : 'Generate replies'} onPress={generate} disabled={loading || input.trim().length < 8} />
      {loading ? <View style={s.loading}><ActivityIndicator /><Text style={s.loadingText}>Writing options that sound human.</Text></View> : null}
    </ScreenShell>
  )
}

const s = StyleSheet.create({
  input: { minHeight: 260, borderRadius: 18, borderWidth: 1, borderColor: BORDER, backgroundColor: SURFACE, padding: 16, color: '#fff', fontSize: 15, lineHeight: 22 },
  label: { color: TEXT_SECONDARY, fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8 },
  chips: { gap: 9 },
  loading: { alignItems: 'center', gap: 8, paddingVertical: 8 },
  loadingText: { color: TEXT_SECONDARY, fontSize: 13 },
})
