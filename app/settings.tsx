import { ScrollView, StyleSheet, View } from 'react-native'
import { router } from 'expo-router'
import { Text } from '@/components/ui/Text'
import { Chip, ScreenShell, shellStyles } from '@/components/FlirtyfyShell'
import { useFlirtyfy } from '@/store/flirtyfyStore'
import { PERSONAS, TONES } from '@/constants/flirtyfy'
import { ACCENT, TEXT_PRIMARY, TEXT_SECONDARY, TEXT_TERTIARY, BORDER } from '@/lib/theme'
import type { Persona, Tone } from '@/types/flirtyfy'

export default function SettingsScreen() {
  const {
    defaultToneReplies,
    defaultToneOpeners,
    defaultToneBio,
    defaultToneOCR,
    defaultPersona,
    setDefaultToneReplies,
    setDefaultToneOpeners,
    setDefaultToneBio,
    setDefaultToneOCR,
    setDefaultPersona,
  } = useFlirtyfy()

  const toneSections: Array<{
    label: string
    value: Tone
    onChange: (t: Tone) => void
  }> = [
    { label: 'Replies Default Tone', value: defaultToneReplies, onChange: setDefaultToneReplies },
    { label: 'Openers Default Tone', value: defaultToneOpeners, onChange: setDefaultToneOpeners },
    { label: 'Bio Rewrites Default Tone', value: defaultToneBio, onChange: setDefaultToneBio },
    { label: 'OCR Replies Default Tone', value: defaultToneOCR, onChange: setDefaultToneOCR },
  ]

  return (
    <ScreenShell title="Settings" subtitle="Control your AI's default behavior and app preferences." back>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.container}>
        
        <Text style={s.sectionTitle}>Default Persona</Text>
        <View style={s.personaGrid}>
          {PERSONAS.map((p) => {
            const active = defaultPersona === p.name
            return (
              <Pressable
                key={p.name}
                onPress={() => setDefaultPersona(p.name as Persona)}
                style={[
                  s.personaCard,
                  active && s.activeCard
                ]}
              >
                <Text style={[s.personaName, active && { color: ACCENT }]}>{p.name}</Text>
              </Pressable>
            )
          })}
        </View>

        {toneSections.map((section) => (
          <View key={section.label} style={s.section}>
            <Text style={s.sectionTitle}>{section.label}</Text>
            <View style={s.chipRow}>
              {TONES.map((t) => (
                <Chip
                  key={t}
                  label={t}
                  active={section.value === t}
                  onPress={() => section.onChange(t)}
                />
              ))}
            </View>
          </View>
        ))}

        <Text style={s.sectionTitle}>Legal</Text>
        <View style={shellStyles.card}>
          <Pressable onPress={() => router.push('/privacy')} style={s.legalRow}>
            <Text style={s.legalText}>Privacy Policy</Text>
          </Pressable>
          <View style={s.divider} />
          <Pressable onPress={() => router.push('/terms')} style={s.legalRow}>
            <Text style={s.legalText}>Terms of Service</Text>
          </Pressable>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </ScreenShell>
  )
}

import { Pressable } from 'react-native'

const s = StyleSheet.create({
  container: { gap: 24, paddingBottom: 40 },
  section: { gap: 12 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: TEXT_TERTIARY,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  personaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  personaCard: {
    ...shellStyles.card,
    flex: 1,
    minWidth: '30%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: BORDER,
  },
  activeCard: {
    borderColor: ACCENT,
    backgroundColor: 'rgba(255,79,123,0.08)',
  },
  personaName: {
    color: TEXT_PRIMARY,
    fontSize: 13,
    fontWeight: '800',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  legalRow: {
    paddingVertical: 12,
  },
  legalText: {
    color: TEXT_PRIMARY,
    fontSize: 15,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
})
