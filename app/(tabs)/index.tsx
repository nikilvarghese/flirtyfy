import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native'
import { router } from 'expo-router'
import { ArrowRight, Camera, Clipboard, Heart, Sparkles, UserRoundPen, Zap } from 'lucide-react-native'
import { Text } from '@/components/ui/Text'
import { Chip, GlowCard, Reveal, ScreenShell, shellStyles, TactilePressable } from '@/components/FlirtyfyShell'
import { TAB_BAR_CLEARANCE } from '@/components/TabBar'
import { ACCENT, BORDER, SURFACE, TEXT_PRIMARY, TEXT_SECONDARY, TEXT_TERTIARY } from '@/lib/theme'
import { APP_BRAND, APP_TAGLINE, TONES } from '@/constants/flirtyfy'
import { useFlirtyfy } from '@/store/flirtyfyStore'
import { formatRelativeDate } from '@/lib/utils'
import { useToast } from '@/contexts/ToastContext'
import type { Tone } from '@/types/flirtyfy'

export default function HomeScreen() {
  const { persona, tone, setTone, history, favorites } = useFlirtyfy()
  const { showToast } = useToast()
  const { width } = useWindowDimensions()
  const isWide = width >= 720

  const lastGen = history[0]
  const lastFav = favorites[0]

  function switchTone(nextTone: Tone) {
    setTone(nextTone)
    if (nextTone !== tone) showToast(`Tone switched to ${nextTone}`, 'success')
  }

  return (
    <ScreenShell bottomPadding={TAB_BAR_CLEARANCE + 18}>
      {/* Hero Section */}
      <Reveal>
        <GlowCard style={[s.hero, isWide && s.heroWide]}>
          <View style={s.heroCopy}>
            <View style={s.badge}>
              <Zap size={13} color={ACCENT} />
              <Text style={s.badgeText}>Premium AI dating assistant</Text>
            </View>
            <View>
              <Text style={s.heroTitle}>{APP_BRAND}</Text>
              <Text style={s.heroSub}>{APP_TAGLINE}</Text>
            </View>
          </View>
          <View style={[s.heroMetrics, isWide && s.heroMetricsWide]}>
            <View style={s.heroMetric}>
              <Text style={s.metricValue}>{history.length}</Text>
              <Text style={s.metricLabel}>Generations</Text>
            </View>
            <View style={[s.metricDivider, isWide && s.metricDividerWide]} />
            <View style={s.heroMetric}>
              <Text style={s.metricValue}>{favorites.length}</Text>
              <Text style={s.metricLabel}>Favorites</Text>
            </View>
          </View>
        </GlowCard>
      </Reveal>

      <Reveal delay={60}>
        <View style={s.toneHeader}>
          <Text style={s.section}>Reply tone</Text>
          <TactilePressable
            onPress={() => router.push('/persona')}
            style={s.personaTrigger}
            accessibilityLabel={`Edit persona, currently ${persona}`}
          >
            <Text style={s.personaLabel}>Persona: <Text style={{ color: ACCENT }}>{persona}</Text></Text>
            <Text style={s.link}>Edit</Text>
          </TactilePressable>
        </View>
        <View style={s.chips}>
          {TONES.map((item) => (
            <Chip key={item} label={item} active={item === tone} onPress={() => switchTone(item)} />
          ))}
        </View>
      </Reveal>

      {/* Quick Actions */}
      <Reveal delay={100}>
        <Text style={s.section}>AI Tools</Text>
        <View style={s.quickActionsGrid}>
          <QuickActionCard
            label="Paste Chat"
            description="Drop in a conversation"
            icon={Clipboard}
            route="/chat-paste"
          />
          <QuickActionCard
            label="OCR Upload"
            description="Screenshot to text"
            icon={Camera}
            route="/ocr-upload"
          />
          <QuickActionCard
            label="Openers"
            description="First messages"
            icon={Sparkles}
            route="/openers"
          />
          <QuickActionCard
            label="Bio Writer"
            description="Profile bios"
            icon={UserRoundPen}
            route="/bio-writer"
          />
        </View>
      </Reveal>

      {/* Continue Section */}
      {lastGen && (
        <>
          <Text style={s.section}>Continue where you left off</Text>
          <TactilePressable
            onPress={() => router.push({ pathname: '/results', params: { id: lastGen.id } } as any)}
            style={[shellStyles.card, s.continueCard]}
            accessibilityLabel="Continue your last generation"
          >
            <View style={s.continueInfo}>
              <View style={s.kindBadge}><Text style={s.kindText}>{lastGen.kind.toUpperCase()}</Text></View>
              <Text style={s.continueTitle} numberOfLines={1}>{lastGen.title || 'Last generation'}</Text>
              <Text style={s.continueSub} numberOfLines={1}>{lastGen.input.substring(0, 40)}...</Text>
            </View>
            <ArrowRight size={20} color={ACCENT} />
          </TactilePressable>
        </>
      )}

      {/* Recent Generations */}
      <View style={s.toneHeader}>
        <Text style={s.section}>Recent activity</Text>
        <Pressable onPress={() => router.push('/history')}><Text style={s.link}>View all</Text></Pressable>
      </View>
      {history.length === 0 ? (
        <View style={shellStyles.card}>
          <Text style={s.emptyTitle}>No history yet</Text>
          <Text style={s.empty}>Start creating to see your activity here.</Text>
        </View>
      ) : (
        <View style={s.recentList}>
          {history.slice(0, 3).map((item, index) => (
            <Reveal key={item.id} delay={140 + index * 45}>
            <TactilePressable
              onPress={() => router.push({ pathname: '/results', params: { id: item.id } } as any)}
              style={s.recentItem}
              accessibilityLabel={`Open ${item.kind} result`}
            >
              <View style={s.recentMain}>
                <View style={s.recentRow}>
                  <Text style={s.recentType}>{item.kind}</Text>
                  <Text style={s.recentDot}>/</Text>
                  <Text style={s.recentTone}>{item.tone}</Text>
                  <Text style={s.recentDot}>/</Text>
                  <Text style={s.recentTime}>{formatRelativeDate(item.createdAt)}</Text>
                </View>
                <Text style={s.recentText} numberOfLines={1}>
                  {item.suggestions[0]?.reply || item.input}
                </Text>
              </View>
            </TactilePressable>
            </Reveal>
          ))}
        </View>
      )}

      {/* Favorites Preview */}
      {lastFav && (
        <>
          <View style={s.toneHeader}>
            <Text style={s.section}>Favorites</Text>
            <Pressable onPress={() => router.push('/favorites' as any)}><Text style={s.link}>See all</Text></Pressable>
          </View>
          <TactilePressable
            onPress={() => router.push({ pathname: '/results', params: { id: lastFav.id } } as any)}
            style={[shellStyles.card, s.favCard]}
            accessibilityLabel="Open latest favorite"
          >
            <Heart size={16} color={ACCENT} fill={ACCENT} style={{ marginRight: 10 }} />
            <Text style={s.favText} numberOfLines={1}>{lastFav.suggestions[0]?.reply}</Text>
          </TactilePressable>
        </>
      )}
    </ScreenShell>
  )
}

function QuickActionCard({ label, description, icon: Icon, route }: { label: string, description: string, icon: any, route: string }) {
  return (
    <TactilePressable
      onPress={() => router.push(route as any)}
      style={s.qaCard}
      accessibilityLabel={label}
    >
      <View style={s.qaIcon}><Icon size={20} color={ACCENT} /></View>
      <View>
        <Text style={s.qaLabel}>{label}</Text>
        <Text style={s.qaDesc}>{description}</Text>
      </View>
    </TactilePressable>
  )
}

const s = StyleSheet.create({
  hero: { gap: 16, minHeight: 176, justifyContent: 'space-between' },
  heroWide: { flexDirection: 'row', alignItems: 'stretch', minHeight: 214, padding: 24 },
  heroCopy: { flex: 1, justifyContent: 'space-between', gap: 22 },
  badge: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 7, borderWidth: 1, borderColor: 'rgba(255,79,123,0.35)', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7, backgroundColor: 'rgba(255,79,123,0.11)' },
  badgeText: { color: ACCENT, fontSize: 12, fontWeight: '800' },
  heroTitle: { color: '#fff', fontSize: 38, lineHeight: 45, fontWeight: '900' },
  heroSub: { color: TEXT_SECONDARY, fontSize: 15, lineHeight: 23, marginTop: 6, maxWidth: 520 },
  heroMetrics: { flexDirection: 'row', borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', backgroundColor: 'rgba(0,0,0,0.16)', overflow: 'hidden' },
  heroMetricsWide: { width: 210, flexDirection: 'column' },
  heroMetric: { flex: 1, padding: 16, justifyContent: 'center' },
  metricValue: { color: TEXT_PRIMARY, fontSize: 24, lineHeight: 29, fontWeight: '900' },
  metricLabel: { color: TEXT_TERTIARY, fontSize: 11, lineHeight: 16, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.7 },
  metricDivider: { width: 1, minHeight: 1, backgroundColor: 'rgba(255,255,255,0.08)' },
  metricDividerWide: { width: '100%', height: 1 },
  toneHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 10 },
  personaTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)'
  },
  personaLabel: { color: TEXT_TERTIARY, fontSize: 12, fontWeight: '700' },
  section: { color: TEXT_TERTIARY, fontSize: 11, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase', marginTop: 14, marginBottom: -2 },
  link: { color: ACCENT, fontSize: 12, fontWeight: '800' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },

  // Quick Actions Grid
  quickActionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 6 },
  qaCard: {
    flexGrow: 1,
    flexBasis: 220,
    minWidth: 150,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 18,
    padding: 17,
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 3,
  },
  qaIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: 'rgba(255,79,123,0.11)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,79,123,0.18)' },
  qaLabel: { color: TEXT_PRIMARY, fontSize: 15, fontWeight: '800' },
  qaDesc: { color: TEXT_TERTIARY, fontSize: 12, lineHeight: 17, fontWeight: '600', marginTop: 3 },

  // Continue Section
  continueCard: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 16 },
  continueInfo: { flex: 1, gap: 5 },
  kindBadge: { alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.06)', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 7 },
  kindText: { color: TEXT_TERTIARY, fontSize: 9, fontWeight: '900' },
  continueTitle: { color: TEXT_PRIMARY, fontSize: 15, fontWeight: '800' },
  continueSub: { color: TEXT_SECONDARY, fontSize: 13, lineHeight: 18 },

  // Recent Activity
  recentList: { gap: 10 },
  recentItem: { ...shellStyles.card, paddingVertical: 14, paddingHorizontal: 15 },
  recentMain: { gap: 5 },
  recentRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  recentType: { color: ACCENT, fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
  recentDot: { color: TEXT_TERTIARY, fontSize: 10 },
  recentTone: { color: TEXT_TERTIARY, fontSize: 11, fontWeight: '600' },
  recentTime: { color: TEXT_TERTIARY, fontSize: 11 },
  recentText: { color: TEXT_PRIMARY, fontSize: 14, lineHeight: 20, fontWeight: '600' },

  // Favorites
  favCard: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 15 },
  favText: { flex: 1, color: TEXT_PRIMARY, fontSize: 14, lineHeight: 20, fontWeight: '600' },

  emptyTitle: { color: TEXT_PRIMARY, fontSize: 15, fontWeight: '800' },
  empty: { color: TEXT_SECONDARY, fontSize: 13, lineHeight: 20, marginTop: 4 },
})
