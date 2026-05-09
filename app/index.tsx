import { useEffect } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { router } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import { MessageCircleHeart, Sparkles, Upload } from 'lucide-react-native'
import { Text } from '@/components/ui/Text'
import { GlowCard, GradientButton } from '@/components/FlirtyfyShell'
import { APP_NAME, APP_TAGLINE } from '@/lib/constants'
import { ACCENT, BG, BORDER, TEXT_PRIMARY, TEXT_SECONDARY } from '@/lib/theme'

export default function LandingScreen() {
  useEffect(() => {
    router.replace('/(tabs)')
  }, [])

  return (
    <View style={s.root}>
      <LinearGradient colors={[BG, '#1c0b13', BG]} style={StyleSheet.absoluteFillObject} />
      <View style={s.content}>
        <View style={s.logo}>
          <Text style={s.logoText}>F</Text>
        </View>
        <View>
          <Text style={s.title}>{APP_NAME}</Text>
          <Text style={s.subtitle}>{APP_TAGLINE} Paste a dating chat, upload a screenshot, or rewrite your profile in seconds.</Text>
        </View>
        <GlowCard style={s.demoCard}>
          <View style={s.row}><Upload size={18} color={ACCENT} /><Text style={s.cardText}>Upload screenshot OCR</Text></View>
          <View style={s.row}><MessageCircleHeart size={18} color={ACCENT} /><Text style={s.cardText}>Generate 3-10 replies</Text></View>
          <View style={s.row}><Sparkles size={18} color={ACCENT} /><Text style={s.cardText}>Openers, bios, personas</Text></View>
        </GlowCard>
        <GradientButton label="Get Started" onPress={() => router.push('/(tabs)')} />
        <Pressable onPress={() => router.push('/privacy')} style={s.legal}>
          <Text style={s.legalText}>Privacy-first AI dating assistant</Text>
        </Pressable>
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: 24, gap: 22 },
  logo: { width: 82, height: 82, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,79,123,0.14)', borderWidth: 1, borderColor: BORDER },
  logoText: { color: ACCENT, fontSize: 42, fontWeight: '900' },
  title: { color: TEXT_PRIMARY, fontSize: 46, fontWeight: '900', letterSpacing: 0, lineHeight: 52 },
  subtitle: { color: TEXT_SECONDARY, fontSize: 16, lineHeight: 24, marginTop: 10 },
  demoCard: { gap: 13 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cardText: { color: TEXT_PRIMARY, fontSize: 15, fontWeight: '800' },
  legal: { alignItems: 'center' },
  legalText: { color: TEXT_SECONDARY, fontSize: 12 },
})
