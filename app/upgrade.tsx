import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native'
import { Crown, Infinity, Lock, Zap } from 'lucide-react-native'
import { Text } from '@/components/ui/Text'
import { GlowCard, GradientButton, ScreenShell, shellStyles } from '@/components/FlirtyfyShell'
import { useSubscription } from '@/contexts/SubscriptionContext'
import { track } from '@/lib/analytics'
import { ACCENT, TEXT_PRIMARY, TEXT_SECONDARY } from '@/lib/theme'

const features = [
  { icon: Infinity, title: 'Unlimited generations', body: 'No daily cap for replies, openers, and bios.' },
  { icon: Lock, title: 'Premium personas', body: 'Savage and Meme Lord prompt modes unlocked.' },
  { icon: Zap, title: 'Faster AI responses', body: 'Priority generation path for high-intent users.' },
]

export default function UpgradeScreen() {
  const { offerings, isLoading, isPremium, purchase, restore } = useSubscription()
  const pkg = offerings?.current?.availablePackages?.[0]

  async function buy() {
    track('upgrade_cta_tapped')
    if (pkg) await purchase(pkg)
  }

  return (
    <ScreenShell title="Flirtyfy Pro" subtitle="Built for the subscription requirement with RevenueCat purchase and restore hooks.">
      <GlowCard style={{ gap: 14 }}>
        <Crown size={28} color={ACCENT} />
        <Text style={s.hero}>Unlimited confidence, zero overthinking.</Text>
        <Text style={s.body}>Free users get limited daily generations. Pro unlocks advanced tones, premium personas, and unlimited usage.</Text>
      </GlowCard>
      {features.map((item) => {
        const Icon = item.icon
        return (
          <View key={item.title} style={[shellStyles.card, s.feature]}>
            <Icon size={18} color={ACCENT} />
            <View style={{ flex: 1 }}>
              <Text style={s.title}>{item.title}</Text>
              <Text style={s.body}>{item.body}</Text>
            </View>
          </View>
        )
      })}
      {isLoading ? <ActivityIndicator /> : <GradientButton label={isPremium ? 'Pro active' : pkg ? 'Start Pro' : 'RevenueCat not configured'} onPress={buy} disabled={isPremium || !pkg} />}
      <Pressable onPress={restore} style={s.restore}><Text style={s.restoreText}>Restore purchases</Text></Pressable>
    </ScreenShell>
  )
}

const s = StyleSheet.create({
  hero: { color: TEXT_PRIMARY, fontSize: 26, fontWeight: '900', lineHeight: 32 },
  title: { color: TEXT_PRIMARY, fontSize: 15, fontWeight: '800' },
  body: { color: TEXT_SECONDARY, fontSize: 13, lineHeight: 20, marginTop: 4 },
  feature: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  restore: { alignItems: 'center', paddingVertical: 6 },
  restoreText: { color: ACCENT, fontSize: 13, fontWeight: '800' },
})
