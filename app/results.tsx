import { useState } from 'react'
import { Alert, Pressable, Clipboard, StyleSheet, View, ActivityIndicator } from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { Copy, Heart, RefreshCcw } from 'lucide-react-native'
import { Text } from '@/components/ui/Text'
import { GradientButton, ScreenShell, shellStyles } from '@/components/FlirtyfyShell'
import { useFlirtyfy } from '@/store/flirtyfyStore'
import { generateDatingCopy } from '@/services/openai'
import { ACCENT, TEXT_PRIMARY, TEXT_SECONDARY, TEXT_TERTIARY } from '@/lib/theme'

export default function ResultsScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>()
  const { history, toggleFavorite, addGeneration, persona, tone } = useFlirtyfy()
  const generation = history.find((item) => item.id === id) ?? history[0]
  const [loading, setLoading] = useState(false)

  async function regenerate() {
    if (!generation || loading) return
    setLoading(true)
    try {
      const previousReplies = generation.suggestions.map(s => s.reply)
      const next = await generateDatingCopy({
        kind: generation.kind,
        input: generation.input,
        tone,
        persona,
        previousReplies
      })
      addGeneration(next)
      router.setParams({ id: next.id })
    } catch (err: any) {
      Alert.alert('Generation failed', err.message || 'Please try again later.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ScreenShell title="Reply results" subtitle="Copy, favorite, or regenerate until the message has the right temperature.">
      {!generation ? (
        <View style={shellStyles.card}><Text style={s.body}>No generation found yet.</Text></View>
      ) : (
        <>
          <View style={s.meta}>
            <Text style={s.metaText}>{generation.persona}</Text>
            <Text style={s.metaText}>{generation.tone}</Text>
            <Text style={s.metaText}>{generation.suggestions.length} options</Text>
          </View>
          {generation.suggestions.map((item) => (
            <View key={item.id} style={[shellStyles.card, s.result]}>
              <Text style={s.tone}>{item.tone}</Text>
              <Text style={s.reply}>{item.reply}</Text>
              {item.reason ? <Text style={s.body}>{item.reason}</Text> : null}
              <View style={s.actions}>
                <Pressable
                  onPress={() => {
                    Clipboard.setString(item.reply)
                  }}
                  style={s.iconBtn}
                ><Copy size={16} color={ACCENT} /><Text style={s.iconText}>Copy</Text></Pressable>
                <Pressable onPress={() => toggleFavorite(generation)} style={s.iconBtn}><Heart size={16} color={ACCENT} /><Text style={s.iconText}>Favorite</Text></Pressable>
              </View>
            </View>
          ))}
          <GradientButton label={loading ? 'Regenerating...' : 'Regenerate set'} onPress={regenerate} disabled={loading} />
        </>
      )}
      <Pressable onPress={regenerate} style={[s.regen, loading && { opacity: 0.5 }]} disabled={loading}>
        {loading ? <ActivityIndicator size="small" color={TEXT_TERTIARY} /> : <RefreshCcw size={14} color={TEXT_TERTIARY} />}
        <Text style={s.body}>{loading ? 'Writing new options...' : 'Try a different read of the vibe'}</Text>
      </Pressable>
    </ScreenShell>
  )
}

const s = StyleSheet.create({
  meta: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  metaText: { color: ACCENT, borderWidth: 1, borderColor: 'rgba(255,79,123,0.35)', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6, fontSize: 12, fontWeight: '800' },
  result: { gap: 8 },
  tone: { color: ACCENT, fontSize: 12, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.8 },
  reply: { color: TEXT_PRIMARY, fontSize: 17, lineHeight: 25, fontWeight: '800' },
  body: { color: TEXT_SECONDARY, fontSize: 13, lineHeight: 20 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  iconBtn: { flexDirection: 'row', gap: 6, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 11, paddingHorizontal: 11, paddingVertical: 8 },
  iconText: { color: ACCENT, fontSize: 12, fontWeight: '800' },
  regen: { flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', paddingVertical: 4 },
})
