import { Pressable, StyleSheet, View } from 'react-native'
import { Crown } from 'lucide-react-native'
import { Text } from '@/components/ui/Text'
import { ScreenShell, shellStyles } from '@/components/FlirtyfyShell'
import { PERSONAS } from '@/constants/flirtyfy'
import { useFlirtyfy } from '@/store/flirtyfyStore'
import { useSubscription } from '@/contexts/SubscriptionContext'
import { ACCENT, TEXT_PRIMARY, TEXT_SECONDARY } from '@/lib/theme'

export default function PersonaScreen() {
  const { persona, setPersona } = useFlirtyfy()
  const { isPremium } = useSubscription()

  return (
    <ScreenShell title="AI persona" subtitle="Personas change the prompt strategy, not just the label.">
      {PERSONAS.map((item) => {
        const locked = item.premium && !isPremium
        const active = persona === item.name
        return (
          <Pressable
            key={item.name}
            onPress={() => !locked && setPersona(item.name)}
            style={({ pressed }) => [shellStyles.card, s.row, active && s.active, (pressed || locked) && { opacity: locked ? 0.55 : 0.78 }]}
          >
            <View style={{ flex: 1 }}>
              <Text style={s.name}>{item.name}</Text>
              <Text style={s.caption}>{item.caption}</Text>
            </View>
            {item.premium ? <Crown size={17} color={ACCENT} /> : null}
          </Pressable>
        )
      })}
    </ScreenShell>
  )
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  active: { borderColor: 'rgba(255,79,123,0.45)', backgroundColor: 'rgba(255,79,123,0.11)' },
  name: { color: TEXT_PRIMARY, fontSize: 16, fontWeight: '900' },
  caption: { color: TEXT_SECONDARY, fontSize: 13, lineHeight: 19, marginTop: 3 },
})
