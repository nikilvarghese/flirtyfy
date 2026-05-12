import { useState, useEffect } from 'react'
import { ActivityIndicator, ScrollView, StyleSheet, TextInput, View, Pressable, Alert } from 'react-native'
import * as Clipboard from 'expo-clipboard'
import { useLocalSearchParams } from 'expo-router'
import { Copy, Heart } from 'lucide-react-native'
import { Text } from '@/components/ui/Text'
import { Chip, GradientButton, ScreenShell, shellStyles } from '@/components/FlirtyfyShell'
import { DEMO_CHAT, TONES } from '@/constants/flirtyfy'
import { useFlirtyfy } from '@/store/flirtyfyStore'
import { generateDatingCopy } from '@/services/openai'
import { ACCENT, BORDER, SURFACE, TEXT_PRIMARY, TEXT_SECONDARY, TEXT_TERTIARY } from '@/lib/theme'
import type { Generation, Tone } from '@/types/flirtyfy'

export default function ChatPasteScreen() {
  const params = useLocalSearchParams<{ demo?: string }>()
  const { persona, tone, setTone, addGeneration, history, toggleFavorite, defaultToneReplies } = useFlirtyfy()
  const [input, setInput] = useState(params.demo ?? DEMO_CHAT)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<Generation | null>(null)

  useEffect(() => {
    setTone(defaultToneReplies)
  }, [defaultToneReplies])

  async function generate(overrideTone?: Tone) {
    const activeTone = overrideTone || tone
    if (overrideTone) setTone(overrideTone)
    
    setLoading(true)
    try {
      const generation = await generateDatingCopy({ kind: 'reply', input, tone: activeTone, persona })
      addGeneration(generation)
      setResults(generation)
    } catch (err: any) {
      Alert.alert('Generation failed', err.message || 'Please try again later.')
    } finally {
      setLoading(false)
    }
  }

  const remainingTones = TONES.filter(t => t !== tone)
  const isCurrentFavorited = results ? history.find(h => h.id === results.id)?.favorite : false

  return (
    <ScreenShell title="Paste chat" subtitle="Keep the context intact. Flirtyfy reads the vibe and gives multiple replies." back>
      <TextInput
        value={input}
        onChangeText={setInput}
        multiline
        textAlignVertical="top"
        placeholder="Paste the chat here..."
        placeholderTextColor="rgba(255,255,255,0.28)"
        style={s.input}
      />
      
      <Text style={s.label}>Initial Tone</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chips}>
        {TONES.map((item) => <Chip key={item} label={item} active={tone === item} onPress={() => setTone(item)} />)}
      </ScrollView>

      <View style={{ marginTop: 8 }}>
        <GradientButton label={loading ? 'Generating...' : results ? 'Regenerate set' : 'Generate replies'} onPress={() => generate()} disabled={loading || input.trim().length < 8} />
      </View>

      {loading && !results && (
        <View style={s.loading}><ActivityIndicator color={ACCENT} /><Text style={s.loadingText}>Writing options that sound human...</Text></View>
      )}

      {results && (
        <View style={s.resultsContainer}>
          <View style={s.resultsHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={s.label}>Suggested Replies ({tone})</Text>
              {loading && <ActivityIndicator size="small" color={ACCENT} />}
            </View>
            <Pressable 
              onPress={() => results && toggleFavorite(results)} 
              style={s.favoriteBtn}
            >
              <Heart size={20} color={isCurrentFavorited ? ACCENT : TEXT_TERTIARY} fill={isCurrentFavorited ? ACCENT : 'transparent'} />
            </Pressable>
          </View>

          {results.suggestions.map((item) => (
            <View key={item.id} style={[shellStyles.card, s.resultCard, loading && { opacity: 0.5 }]}>
              <View style={s.resultHeader}>
                <Text style={s.resultTone}>{item.tone}</Text>
                <View style={s.resultActions}>
                  <Pressable 
                    onPress={() => {
                      Clipboard.setStringAsync(item.reply)
                    }} 
                    style={s.actionIcon}
                  >
                    <Copy size={16} color={ACCENT} />
                  </Pressable>
                </View>
              </View>
              <Text style={s.replyText}>{item.reply}</Text>
              {item.reason ? <Text style={s.reasonText}>{item.reason}</Text> : null}
            </View>
          ))}

          {!loading && (
            <View style={s.regenSection}>
              <Text style={s.regenLabel}>Try different vibe</Text>
              <View style={s.regenRow}>
                {remainingTones.map((t) => (
                  <Pressable 
                    key={t} 
                    onPress={() => generate(t)}
                    style={({ pressed }) => [
                      s.regenChip,
                      pressed && { opacity: 0.7 }
                    ]}
                  >
                    <Text style={s.regenChipText}>{t}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScreenShell>
  )
}

const s = StyleSheet.create({
  input: { minHeight: 200, borderRadius: 18, borderWidth: 1, borderColor: BORDER, backgroundColor: SURFACE, padding: 16, color: '#fff', fontSize: 15, lineHeight: 22 },
  label: { color: TEXT_SECONDARY, fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10, marginTop: 18 },
  chips: { gap: 9 },
  loading: { alignItems: 'center', gap: 10, paddingVertical: 24 },
  loadingText: { color: TEXT_SECONDARY, fontSize: 14, fontWeight: '600' },
  resultsContainer: { marginTop: 10, gap: 16 },
  resultsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  resultCard: { gap: 10, backgroundColor: 'rgba(255,255,255,0.03)' },
  resultHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  resultTone: { color: ACCENT, fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
  resultActions: { flexDirection: 'row', gap: 14 },
  actionIcon: { padding: 4 },
  favoriteBtn: { padding: 8, marginRight: -8 },
  replyText: { color: TEXT_PRIMARY, fontSize: 16, lineHeight: 24, fontWeight: '700' },
  reasonText: { color: TEXT_SECONDARY, fontSize: 13, lineHeight: 20, marginTop: 4 },
  regenSection: { marginTop: 10, gap: 12 },
  regenLabel: { color: TEXT_TERTIARY, fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, textAlign: 'center' },
  regenRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  regenChip: { 
    backgroundColor: SURFACE, 
    borderWidth: 1, 
    borderColor: BORDER, 
    paddingHorizontal: 12, 
    paddingVertical: 8, 
    borderRadius: 10 
  },
  regenChipText: { color: TEXT_SECONDARY, fontSize: 12, fontWeight: '700' },
})
