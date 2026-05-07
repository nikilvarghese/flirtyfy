import React from 'react'
import { Pressable, ScrollView, StyleSheet, View, type ViewStyle } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Text } from '@/components/ui/Text'
import { ACCENT, ACCENT_BORDER, ACCENT_DIM, BG, BORDER, SURFACE, TEXT_PRIMARY, TEXT_SECONDARY, TEXT_TERTIARY } from '@/lib/theme'

export function ScreenShell({
  children,
  title,
  subtitle,
  right,
  bottomPadding = 28,
}: {
  children: React.ReactNode
  title?: string
  subtitle?: string
  right?: React.ReactNode
  bottomPadding?: number
}) {
  const insets = useSafeAreaInsets()
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: BG }}
      contentContainerStyle={[styles.container, { paddingTop: insets.top + 16, paddingBottom: bottomPadding + insets.bottom }]}
      showsVerticalScrollIndicator={false}
    >
      {(title || subtitle || right) && (
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            {title ? <Text style={styles.title}>{title}</Text> : null}
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          </View>
          {right}
        </View>
      )}
      {children}
    </ScrollView>
  )
}

export function GlowCard({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return (
    <View style={[styles.glowCard, style]}>
      <LinearGradient
        colors={['rgba(255,79,123,0.22)', 'rgba(255,255,255,0.04)', 'rgba(255,79,123,0.04)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      {children}
    </View>
  )
}

export function Chip({
  label,
  active,
  onPress,
  locked,
}: {
  label: string
  active?: boolean
  onPress?: () => void
  locked?: boolean
}) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}{locked ? ' PRO' : ''}</Text>
    </Pressable>
  )
}

export function GradientButton({ label, onPress, disabled }: { label: string; onPress?: () => void; disabled?: boolean }) {
  return (
    <Pressable onPress={onPress} disabled={disabled} style={({ pressed }) => [styles.button, (pressed || disabled) && { opacity: disabled ? 0.45 : 0.82 }]}>
      <LinearGradient colors={[ACCENT, '#ff275d']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFillObject} />
      <Text style={styles.buttonText}>{label}</Text>
    </Pressable>
  )
}

export const shellStyles = {
  card: {
    backgroundColor: SURFACE,
    borderColor: BORDER,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 18,
    padding: 16,
  } as ViewStyle,
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 20, gap: 16 },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  title: { color: TEXT_PRIMARY, fontSize: 28, fontWeight: '800', letterSpacing: 0, lineHeight: 34 },
  subtitle: { color: TEXT_SECONDARY, fontSize: 14, lineHeight: 21, marginTop: 4 },
  glowCard: {
    overflow: 'hidden',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: ACCENT_BORDER,
    padding: 18,
    backgroundColor: SURFACE,
  },
  chip: {
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 999,
    paddingHorizontal: 13,
    paddingVertical: 9,
  },
  chipActive: { borderColor: ACCENT_BORDER, backgroundColor: ACCENT_DIM },
  chipText: { color: TEXT_TERTIARY, fontSize: 12, fontWeight: '700' },
  chipTextActive: { color: ACCENT },
  button: { minHeight: 54, borderRadius: 16, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18 },
  buttonText: { color: '#fff', fontSize: 15, fontWeight: '800' },
})
