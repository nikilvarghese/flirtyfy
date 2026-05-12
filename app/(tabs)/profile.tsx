import { Pressable, StyleSheet, View } from 'react-native'
import { router } from 'expo-router'
import { Crown, Heart, Settings, ShieldCheck } from 'lucide-react-native'
import { Text } from '@/components/ui/Text'
import { GlowCard, ScreenShell, shellStyles } from '@/components/FlirtyfyShell'
import { TAB_BAR_CLEARANCE } from '@/components/TabBar'
import { useFlirtyfy } from '@/store/flirtyfyStore'
import { ACCENT, TEXT_PRIMARY, TEXT_SECONDARY } from '@/lib/theme'

export default function ProfileScreen() {
  const { persona, history, favorites } = useFlirtyfy()

  return (
    <ScreenShell title="Profile" subtitle="Account, subscription, persona, and product settings." bottomPadding={TAB_BAR_CLEARANCE + 18}>
      <GlowCard style={s.hero}>
        <View style={s.avatar}><Text style={s.avatarText}>F</Text></View>
        <View style={{ alignItems: 'center', gap: 5 }}>
          <View style={s.memberPill}>
            <Crown size={13} color={ACCENT} />
            <Text style={s.memberText}>Pro member</Text>
          </View>
          <Text style={s.name}>Flirtyfy user</Text>
          <Text style={s.body}>{persona} mode</Text>
        </View>
      </GlowCard>
      <View style={s.stats}>
        <View style={[shellStyles.card, s.stat]}><Text style={s.count}>{history.length}</Text><Text style={s.body}>Generations</Text></View>
        <View style={[shellStyles.card, s.stat]}><Text style={s.count}>{favorites.length}</Text><Text style={s.body}>Favorites</Text></View>
      </View>
      <Row icon={<Heart size={18} color={ACCENT} />} label="Favorites" value={`${favorites.length}`} onPress={() => router.push('/favorites')} />
      <Row icon={<Settings size={18} color={ACCENT} />} label="Settings" value="Open" onPress={() => router.push('/settings')} />
      <Row icon={<ShieldCheck size={18} color={ACCENT} />} label="Privacy and terms" value="Legal" onPress={() => router.push('/privacy')} />
    </ScreenShell>
  )
}

function Row({ icon, label, value, onPress }: { icon: React.ReactNode; label: string; value: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [shellStyles.card, s.row, pressed && { opacity: 0.76 }]}>
      {icon}
      <Text style={s.rowLabel}>{label}</Text>
      <Text style={s.rowValue}>{value}</Text>
    </Pressable>
  )
}

const s = StyleSheet.create({
  hero: { alignItems: 'center', gap: 14, paddingVertical: 24 },
  avatar: { width: 82, height: 82, borderRadius: 26, backgroundColor: 'rgba(255,79,123,0.18)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,79,123,0.35)' },
  avatarText: { color: ACCENT, fontSize: 32, fontWeight: '900' },
  memberPill: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(255,79,123,0.28)', backgroundColor: 'rgba(255,79,123,0.10)', paddingHorizontal: 10, paddingVertical: 6 },
  memberText: { color: ACCENT, fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.6 },
  name: { color: TEXT_PRIMARY, fontSize: 23, fontWeight: '900' },
  body: { color: TEXT_SECONDARY, fontSize: 13, lineHeight: 20 },
  stats: { flexDirection: 'row', gap: 12 },
  stat: { flex: 1, minHeight: 96, justifyContent: 'center' },
  count: { color: TEXT_PRIMARY, fontSize: 24, fontWeight: '900' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 58 },
  rowLabel: { color: TEXT_PRIMARY, fontSize: 15, fontWeight: '800', flex: 1 },
  rowValue: { color: TEXT_SECONDARY, fontSize: 13, fontWeight: '700' },
})
