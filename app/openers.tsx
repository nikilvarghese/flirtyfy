import { useState } from 'react'
import { ActivityIndicator, StyleSheet, TextInput, View } from 'react-native'
import { router } from 'expo-router'
import { Text } from '@/components/ui/Text'
import { GradientButton, ScreenShell } from '@/components/FlirtyfyShell'
import { DEMO_PROFILE } from '@/constants/flirtyfy'
import { useFlirtyfy } from '@/store/flirtyfyStore'
import { generateDatingCopy } from '@/services/openai'
import { BORDER, SURFACE, TEXT_SECONDARY } from '@/lib/theme'

export default function OpenersScreen() {
  const { persona, tone, addGeneration } = useFlirtyfy()
  const [input, setInput] = useState(DEMO_PROFILE)
  const [loading, setLoading] = useState(false)

  async function generate() {
    setLoading(true)
    const generation = await generateDatingCopy({ kind: 'opener', input, tone, persona, count: 8 })
    addGeneration(generation)
    setLoading(false)
    router.push({ pathname: '/results', params: { id: generation.id } })
  }

  return (
    <ScreenShell title="Openers" subtitle="Paste profile prompts, interests, or a bio. Get personalized first messages.">
      <TextInput value={input} onChangeText={setInput} multiline textAlignVertical="top" style={s.input} />
      <GradientButton label={loading ? 'Generating...' : 'Generate openers'} onPress={generate} disabled={loading || input.trim().length < 8} />
      {loading ? <View style={s.loading}><ActivityIndicator /><Text style={s.help}>Avoiding generic pickup lines.</Text></View> : null}
    </ScreenShell>
  )
}

const s = StyleSheet.create({
  input: { minHeight: 250, borderRadius: 18, borderWidth: 1, borderColor: BORDER, backgroundColor: SURFACE, padding: 16, color: '#fff', fontSize: 15, lineHeight: 22 },
  loading: { alignItems: 'center', gap: 8 },
  help: { color: TEXT_SECONDARY, fontSize: 13 },
})
