import { Pressable, StyleSheet, View } from 'react-native'
import { router } from 'expo-router'
import { Camera, Clipboard, Heart, Sparkles, UserRoundPen, Zap } from 'lucide-react-native'
import { Text } from '@/components/ui/Text'
import { Chip, GlowCard, GradientButton, ScreenShell, shellStyles } from '@/components/FlirtyfyShell'
import { TAB_BAR_CLEARANCE } from '@/components/TabBar'
import { ACCENT, TEXT_PRIMARY, TEXT_SECONDARY, TEXT_TERTIARY } from '@/lib/theme'
import { APP_BRAND, APP_TAGLINE, DEMO_CHAT, TONES } from '@/constants/flirtyfy'
import { useFlirtyfy } from '@/store/flirtyfyStore'

const actions = [
  { title: 'Paste conversation', body: 'Drop in a chat and get copy-ready replies.', icon: Clipboard, route: '/chat-paste' },
  { title: 'Upload screenshot', body: 'OCR a dating-app screenshot in order.', icon: Camera, route: '/ocr-upload' },
  { title: 'Generate opener', body: 'Profile-aware first messages that land.', icon: Sparkles, route: '/openers' },
  { title: 'Rewrite bio', body: 'Tinder, Bumble, and Hinge bios with taste.', icon: UserRoundPen, route: '/bio-writer' },
]

export default function HomeScreen() {
  const { tone, setTone, history } = useFlirtyfy()

  return (
    <ScreenShell bottomPadding={TAB_BAR_CLEARANCE + 18}>
      <GlowCard style={{ gap: 18 }}>
        <View style={s.badge}><Zap size={13} color={ACCENT} /><Text style={s.badgeText}>Premium AI dating assistant</Text></View>
        <View>
          <Text style={s.heroTitle}>{APP_BRAND}</Text>
          <Text style={s.heroSub}>{APP_TAGLINE} Paste the moment. Get the line.</Text>
        </View>
        <GradientButton label="Try demo conversation" onPress={() => router.push({ pathname: '/chat-paste', params: { demo: DEMO_CHAT } })} />
      </GlowCard>

      <View style={s.toneHeader}>
        <Text style={s.section}>Reply tone</Text>
        <Pressable onPress={() => router.push('/persona')}><Text style={s.link}>Persona: edit</Text></Pressable>
      </View>
      <View style={s.chips}>
        {TONES.map((item) => (
          <Chip key={item} label={item} active={item === tone} onPress={() => setTone(item)} />
        ))}
      </View>

      <Text style={s.section}>Create</Text>
      <View style={s.grid}>
        {actions.map((item) => {
          const Icon = item.icon
          return (
            <Pressable key={item.title} onPress={() => router.push(item.route as any)} style={({ pressed }) => [s.actionCard, pressed && { opacity: 0.75 }]}>
              <View style={s.actionIcon}><Icon size={18} color={ACCENT} /></View>
              <Text style={s.actionTitle}>{item.title}</Text>
              <Text style={s.actionBody}>{item.body}</Text>
            </Pressable>
          )
        })}
      </View>

      <View style={s.toneHeader}>
        <Text style={s.section}>Recent generations</Text>
        <Pressable onPress={() => router.push('/history')}><Text style={s.link}>View all</Text></Pressable>
      </View>
      {history.length === 0 ? (
        <View style={shellStyles.card}>
          <Text style={s.emptyTitle}>Nothing saved yet</Text>
          <Text style={s.empty}>Your replies, openers, and bios will appear here after generation.</Text>
        </View>
      ) : (
        history.slice(0, 3).map((item) => (
          <View key={item.id} style={shellStyles.card}>
            <Text style={s.actionTitle}>{item.title}</Text>
            <Text style={s.empty} numberOfLines={2}>{item.suggestions[0]?.reply}</Text>
          </View>
        ))
      )}
    </ScreenShell>
  )
}

const s = StyleSheet.create({
  badge: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 7, borderWidth: 1, borderColor: 'rgba(255,79,123,0.35)', borderRadius: 999, paddingHorizontal: 11, paddingVertical: 7, backgroundColor: 'rgba(255,79,123,0.11)' },
  badgeText: { color: ACCENT, fontSize: 12, fontWeight: '800' },
  heroTitle: { color: '#fff', fontSize: 42, lineHeight: 48, fontWeight: '900', letterSpacing: 0 },
  heroSub: { color: TEXT_SECONDARY, fontSize: 15, lineHeight: 23, marginTop: 8 },
  toneHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  section: { color: TEXT_TERTIARY, fontSize: 12, fontWeight: '800', letterSpacing: 0.8, textTransform: 'uppercase' },
  link: { color: ACCENT, fontSize: 12, fontWeight: '800' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  actionCard: { ...shellStyles.card, width: '48%', minHeight: 154, gap: 10 },
  actionIcon: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,79,123,0.12)' },
  actionTitle: { color: TEXT_PRIMARY, fontSize: 15, fontWeight: '800', lineHeight: 20 },
  actionBody: { color: TEXT_SECONDARY, fontSize: 12.5, lineHeight: 18 },
  emptyTitle: { color: TEXT_PRIMARY, fontSize: 15, fontWeight: '800' },
  empty: { color: TEXT_SECONDARY, fontSize: 13, lineHeight: 20, marginTop: 4 },
})
