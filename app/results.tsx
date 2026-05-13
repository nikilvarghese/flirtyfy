import { useState } from 'react'
import { Pressable, StyleProp, StyleSheet, useWindowDimensions, View, ActivityIndicator } from 'react-native'
import * as Clipboard from 'expo-clipboard'
import { useLocalSearchParams, router } from 'expo-router'
import { Copy, Heart, RefreshCcw } from 'lucide-react-native'
import { Text } from '@/components/ui/Text'
import { GradientButton, Reveal, ScreenShell, shellStyles, TactilePressable } from '@/components/FlirtyfyShell'
import { useFlirtyfy } from '@/store/flirtyfyStore'
import { generateDatingCopy } from '@/services/openai'
import { ACCENT, ACCENT_BORDER, ACCENT_DIM, BORDER, SURFACE, TEXT_PRIMARY, TEXT_SECONDARY, TEXT_TERTIARY } from '@/lib/theme'
import { useToast } from '@/contexts/ToastContext'

export default function ResultsScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>()
  const { history, toggleFavorite, addGeneration, persona, tone } = useFlirtyfy()
  const { showToast } = useToast()
  const generation = history.find((item) => item.id === id) ?? history[0]
  const [loading, setLoading] = useState(false)
  const { width } = useWindowDimensions()
  const isWide = width >= 820

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
      showToast('Replies generated', 'success')
      router.setParams({ id: next.id })
    } catch {
      showToast('Failed to generate replies', 'error')
    } finally {
      setLoading(false)
    }
  }

  async function copyReply(reply: string) {
    try {
      await Clipboard.setStringAsync(reply)
      showToast('Copied to clipboard', 'success')
    } catch {
      showToast('Clipboard unavailable', 'error')
    }
  }

  function toggleResultFavorite() {
    if (!generation) return
    const wasFavorite = !!generation.favorite
    toggleFavorite(generation)
    showToast(wasFavorite ? 'Removed from favorites' : 'Saved to favorites', 'success')
  }

  const contextBlock = generation ? (
    <Reveal delay={80} style={isWide ? s.desktopContext : undefined}>
      <Text style={s.sectionTitle}>Original Conversation</Text>
      <View style={[shellStyles.card, s.contextCard]}>
        <Text style={s.contextText}>{generation.input}</Text>
      </View>
      {isWide ? (
        <View style={s.regenPanel}>
          <View style={{ flex: 1 }}>
            <Text style={s.regenTitle}>Want another angle?</Text>
            <Text style={s.regenSub}>Regenerate keeps your conversation context and tries fresh options.</Text>
          </View>
          <GradientButton label={loading ? 'Regenerating...' : 'Regenerate all options'} onPress={regenerate} disabled={loading} />
        </View>
      ) : null}
    </Reveal>
  ) : null

  const repliesBlock = generation ? (
    <Reveal delay={120} style={isWide ? s.desktopReplies : undefined}>
      <Text style={s.sectionTitle}>Generated Replies</Text>
      <View style={s.replyStack}>
        {generation.suggestions.map((item, idx) => (
          <Reveal key={item.id} delay={150 + idx * 50}>
            <View style={[shellStyles.card, s.result]}>
              <View style={s.resultHeader}>
                <View>
                  <Text style={s.tone}>{item.tone}</Text>
                  <Text style={s.optionNum}>Option {idx + 1}</Text>
                </View>
                <TactilePressable
                  onPress={() => copyReply(item.reply)}
                  style={s.iconBtn}
                  accessibilityLabel={`Copy option ${idx + 1}`}
                >
                  <Copy size={16} color={ACCENT} />
                  <Text style={s.iconText}>Copy</Text>
                </TactilePressable>
              </View>
              <Text style={s.reply}>{item.reply}</Text>
              {item.reason ? <Text style={s.reason}>{item.reason}</Text> : null}
            </View>
          </Reveal>
        ))}
      </View>
    </Reveal>
  ) : null

  const regenBlock = generation && !isWide ? (
    <Reveal delay={220}>
      <View style={s.regenCard}>
        <View style={s.regenHeader}>
          <Text style={s.regenTitle}>Want another angle?</Text>
          <Text style={s.regenSub}>Fresh options while keeping your context.</Text>
        </View>
        <GradientButton
          label={loading ? 'Regenerating...' : 'Regenerate all options'}
          onPress={regenerate}
          disabled={loading}
          style={s.regenButton}
        />
      </View>
    </Reveal>
  ) : null

  return (
    <ScreenShell title="Reply results" subtitle="The perfect response is just a copy away." back>
      {!generation ? (
        <View style={shellStyles.card}><Text style={s.body}>No generation found yet.</Text></View>
      ) : (
        <View style={s.content}>
          {/* Header Meta */}
          <Reveal>
            <View style={s.meta}>
              <View style={{ flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                <View style={s.badge}><Text style={s.badgeText}>{generation.persona}</Text></View>
                <View style={s.badge}><Text style={s.badgeText}>{generation.tone}</Text></View>
                <View style={[s.badge, { borderColor: 'rgba(255,255,255,0.08)' }]}><Text style={[s.badgeText, { color: TEXT_TERTIARY }]}>{generation.kind}</Text></View>
              </View>
              <TactilePressable
                onPress={toggleResultFavorite}
                style={s.favoriteBtn}
                accessibilityLabel={generation.favorite ? 'Remove from favorites' : 'Add to favorites'}
              >
                <Heart size={22} color={generation.favorite ? ACCENT : TEXT_TERTIARY} fill={generation.favorite ? ACCENT : 'transparent'} />
              </TactilePressable>
            </View>
          </Reveal>

          {isWide ? (
            <View style={s.desktopGrid}>
              {contextBlock}
              {repliesBlock}
            </View>
          ) : (
            <>
              {contextBlock}
              {repliesBlock}
              {regenBlock}
            </>
          )}

          {loading ? (
            <Reveal delay={40}>
              <View style={s.thinkingPanel}>
                <ActivityIndicator size="small" color={ACCENT} />
                <View style={{ flex: 1 }}>
                  <Text style={s.thinkingTitle}>AI is reading the room</Text>
                  <Text style={s.thinkingSub}>Finding fresher replies without changing your context.</Text>
                </View>
              </View>
            </Reveal>
          ) : null}

          {/* Bottom spacing to prevent collision with toast */}
          <View style={{ height: 40 }} />
        </View>
      )}
    </ScreenShell>
  )
}

const s = StyleSheet.create({
  content: { paddingBottom: 20 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  desktopGrid: { flexDirection: 'row', alignItems: 'flex-start', gap: 24 },
  desktopContext: { flex: 0.8 },
  desktopReplies: { flex: 1.2 },
  favoriteBtn: { width: 46, height: 46, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: BORDER },
  badge: { borderWidth: 1, borderColor: 'rgba(255,79,123,0.25)', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 7, backgroundColor: ACCENT_DIM },
  badgeText: { color: ACCENT, fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.4 },

  sectionTitle: { color: TEXT_TERTIARY, fontSize: 10, fontWeight: '900', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 12, marginTop: 10 },

  contextCard: { backgroundColor: 'rgba(255,255,255,0.025)', borderColor: 'rgba(255,255,255,0.06)', marginBottom: 24, padding: 18 },
  contextText: { color: TEXT_SECONDARY, fontSize: 14, lineHeight: 22, fontWeight: '500' },

  replyStack: { gap: 16 },
  result: { gap: 16, borderColor: ACCENT_BORDER, backgroundColor: SURFACE, padding: 20 },
  resultHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tone: { color: ACCENT, fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.2 },
  optionNum: { color: TEXT_TERTIARY, fontSize: 10, fontWeight: '700', marginTop: 3 },

  reply: { color: TEXT_PRIMARY, fontSize: 18, lineHeight: 28, fontWeight: '800', letterSpacing: -0.3 },
  reason: { color: TEXT_TERTIARY, fontSize: 13, lineHeight: 20, fontStyle: 'italic', paddingTop: 4 },

  iconBtn: { flexDirection: 'row', gap: 8, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,79,123,0.18)', borderRadius: 999, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: 'rgba(255,79,123,0.04)' },
  iconText: { color: ACCENT, fontSize: 13, fontWeight: '800' },

  regenPanel: { ...shellStyles.card, gap: 16, marginTop: 8, borderColor: 'rgba(255,79,123,0.15)', padding: 20 },
  regenCard: { ...shellStyles.card, gap: 20, marginTop: 24, borderColor: 'rgba(255,79,123,0.15)', padding: 20, backgroundColor: 'rgba(255,79,123,0.02)' },
  regenHeader: { gap: 6 },
  regenTitle: { color: TEXT_PRIMARY, fontSize: 17, fontWeight: '800', letterSpacing: -0.2 },
  regenSub: { color: TEXT_SECONDARY, fontSize: 14, lineHeight: 20, fontWeight: '500' },
  regenButton: { height: 54 },

  thinkingPanel: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,79,123,0.15)', backgroundColor: 'rgba(255,79,123,0.04)', padding: 16, marginTop: 12 },
  thinkingTitle: { color: TEXT_PRIMARY, fontSize: 15, lineHeight: 20, fontWeight: '800' },
  thinkingSub: { color: TEXT_SECONDARY, fontSize: 13, lineHeight: 18, marginTop: 2, fontWeight: '500' },
  body: { color: TEXT_SECONDARY, fontSize: 14, textAlign: 'center', paddingVertical: 40 },
})
