import { useState } from 'react'
import { ActivityIndicator, ScrollView, StyleSheet, TextInput, View } from 'react-native'
import { router } from 'expo-router'
import { Text } from '@/components/ui/Text'
import { Chip, GradientButton, ScreenShell } from '@/components/FlirtyfyShell'
import { useFlirtyfy } from '@/store/flirtyfyStore'
import { generateDatingCopy } from '@/services/openai'
import { BORDER, SURFACE, TEXT_SECONDARY } from '@/lib/theme'
import type { Tone } from '@/types/flirtyfy'

const styles: Tone[] = ['Funny', 'Confident', 'Soft', 'Gen Z', 'Direct', 'Bold']

export default function BioWriterScreen() {
  const { persona, tone, setTone, addGeneration } = useFlirtyfy()
  const [input, setInput] = useState('I like design, gym, sushi, travel, late-night drives, and dry humor.')
  const [loading, setLoading] = useState(false)

  async function generate() {
    setLoading(true)
    const generation = await generateDatingCopy({ kind: 'bio', input, tone, persona })
    addGeneration(generation)
    setLoading(false)
    router.push({ pathname: '/results', params: { id: generation.id } })
  }

  return (
    <ScreenShell title="Bio writer" subtitle="Write Tinder, Bumble, and Hinge bios that feel specific and premium.">
      <TextInput value={input} onChangeText={setInput} multiline textAlignVertical="top" style={s.input} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chips}>
        {styles.map((item) => <Chip key={item} label={item} active={tone === item} onPress={() => setTone(item)} />)}
      </ScrollView>
      <GradientButton label={loading ? 'Writing...' : 'Rewrite my bio'} onPress={generate} disabled={loading || input.trim().length < 8} />
      {loading ? <View style={s.loading}><ActivityIndicator /><Text style={s.help}>Making it sound like you, just sharper.</Text></View> : null}
    </ScreenShell>
  )
}

const s = StyleSheet.create({
  input: { minHeight: 230, borderRadius: 18, borderWidth: 1, borderColor: BORDER, backgroundColor: SURFACE, padding: 16, color: '#fff', fontSize: 15, lineHeight: 22 },
  chips: { gap: 9 },
  loading: { alignItems: 'center', gap: 8 },
  help: { color: TEXT_SECONDARY, fontSize: 13 },
})
