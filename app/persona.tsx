import { Pressable, StyleSheet, View } from 'react-native'
import { Check } from 'lucide-react-native'
import { Text } from '@/components/ui/Text'
import { ScreenShell, shellStyles } from '@/components/FlirtyfyShell'
import { PERSONAS } from '@/constants/flirtyfy'
import { useFlirtyfy } from '@/store/flirtyfyStore'
import { ACCENT, TEXT_PRIMARY, TEXT_SECONDARY } from '@/lib/theme'

export default function PersonaScreen() {
  const { persona, setPersona } = useFlirtyfy()

  return (
    <ScreenShell title="AI persona" subtitle="Personas change the prompt strategy, not just the label." back>
      {PERSONAS.map((item) => {
        const active = persona === item.name
        return (
          <Pressable
            key={item.name}
            onPress={() => setPersona(item.name)}
            style={({ pressed }) => [
              shellStyles.card,
              s.row,
              active && s.active,
              pressed && { opacity: 0.78 }
            ]}
          >
            <View style={{ flex: 1 }}>
              <Text style={[s.name, active && { color: ACCENT }]}>{item.name}</Text>
              <Text style={s.caption}>{item.caption}</Text>
            </View>
            {active && (
              <View style={s.checkCircle}>
                <Check size={14} color="#fff" strokeWidth={3} />
              </View>
            )}
          </Pressable>
        )
      })}
    </ScreenShell>
  )
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1.5, borderColor: 'transparent' },
  active: { 
    borderColor: ACCENT, 
    backgroundColor: 'rgba(255,79,123,0.08)',
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { color: TEXT_PRIMARY, fontSize: 17, fontWeight: '900' },
  caption: { color: TEXT_SECONDARY, fontSize: 13, lineHeight: 19, marginTop: 3 },
})
