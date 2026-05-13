import React, { useEffect, useState } from 'react'
import { AccessibilityInfo, Pressable, ScrollView, StyleSheet, useWindowDimensions, View, type PressableProps, type StyleProp, type ViewStyle } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import { Text } from '@/components/ui/Text'
import {
  ACCENT,
  ACCENT_BORDER,
  ACCENT_DIM,
  ACCENT_GLOW,
  BG,
  BORDER,
  MAX_CONTENT_WIDTH,
  RADIUS_LG,
  RADIUS_MD,
  RADIUS_XL,
  SURFACE,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
  TEXT_TERTIARY,
} from '@/lib/theme'

import { ArrowLeft } from 'lucide-react-native'
import { router } from 'expo-router'

const MOTION_EASE = Easing.out(Easing.cubic)
const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

function useReducedMotionPreference() {
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduced)
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced)
    return () => subscription.remove()
  }, [])

  return reduced
}

export function ScreenShell({
  children,
  title,
  subtitle,
  right,
  back,
  onBack,
  bottomPadding = 28,
}: {
  children: React.ReactNode
  title?: string
  subtitle?: string
  right?: React.ReactNode
  back?: boolean
  onBack?: () => void
  bottomPadding?: number
}) {
  const insets = useSafeAreaInsets()
  const { width } = useWindowDimensions()
  const reducedMotion = useReducedMotionPreference()
  const horizontalPadding = width >= 768 ? 32 : 20

  const handleBack = () => {
    if (onBack) {
      onBack()
    } else if (router.canGoBack()) {
      router.back()
    } else {
      router.replace('/')
    }
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: BG }}
      contentContainerStyle={[
        styles.scrollContent,
        {
          paddingTop: insets.top + (width >= 768 ? 28 : 16),
          paddingBottom: bottomPadding + insets.bottom,
          paddingHorizontal: horizontalPadding,
        },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <LinearGradient
        pointerEvents="none"
        colors={['rgba(255,79,123,0.10)', 'rgba(255,255,255,0)', 'rgba(255,79,123,0.04)']}
        locations={[0, 0.42, 1]}
        style={styles.backgroundWash}
      />
      <Animated.View
        entering={reducedMotion ? undefined : FadeIn.duration(220)}
        style={styles.content}
      >
        {(title || subtitle || right || back) && (
          <View style={styles.header}>
            {back && (
              <Pressable onPress={handleBack} style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]} hitSlop={15}>
                <ArrowLeft size={22} color={TEXT_SECONDARY} />
              </Pressable>
            )}
            <View style={{ flex: 1 }}>
              {title ? <Text style={styles.title}>{title}</Text> : null}
              {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
            </View>
            {right}
          </View>
        )}
        {children}
      </Animated.View>
    </ScrollView>
  )
}

export function Reveal({
  children,
  delay = 0,
  style,
}: {
  children: React.ReactNode
  delay?: number
  style?: StyleProp<ViewStyle>
}) {
  const reducedMotion = useReducedMotionPreference()

  return (
    <Animated.View
      entering={reducedMotion ? undefined : FadeInDown.delay(delay).duration(320).easing(MOTION_EASE)}
      style={style}
    >
      {children}
    </Animated.View>
  )
}

export function TactilePressable({
  children,
  style,
  disabled,
  onPressIn,
  onPressOut,
  accessibilityRole,
  ...rest
}: PressableProps & {
  children: React.ReactNode
  style?: StyleProp<ViewStyle>
}) {
  const reducedMotion = useReducedMotionPreference()
  const scale = useSharedValue(1)
  const lift = useSharedValue(0)

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: disabled ? 0.5 : 1,
    shadowOpacity: 0.18 + lift.value * 0.08,
  }))

  return (
    <AnimatedPressable
      accessibilityRole={accessibilityRole ?? 'button'}
      disabled={disabled}
      onPressIn={(event) => {
        if (!reducedMotion) {
          scale.value = withTiming(0.985, { duration: 90, easing: MOTION_EASE })
          lift.value = withTiming(1, { duration: 120, easing: MOTION_EASE })
        }
        onPressIn?.(event)
      }}
      onPressOut={(event) => {
        if (!reducedMotion) {
          scale.value = withTiming(1, { duration: 160, easing: MOTION_EASE })
          lift.value = withTiming(0, { duration: 180, easing: MOTION_EASE })
        }
        onPressOut?.(event)
      }}
      style={[style, animatedStyle]}
      {...rest}
    >
      {children}
    </AnimatedPressable>
  )
}

export function GlowCard({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
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
}: {
  label: string
  active?: boolean
  onPress?: () => void
}) {
  return (
    <TactilePressable onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </TactilePressable>
  )
}

export function GradientButton({
  label,
  onPress,
  disabled,
  style,
}: {
  label: string
  onPress?: () => void
  disabled?: boolean
  style?: StyleProp<ViewStyle>
}) {
  return (
    <TactilePressable onPress={onPress} disabled={disabled} style={[styles.button, style]}>
      <LinearGradient colors={[ACCENT, '#ff275d']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFillObject} />
      <Text style={styles.buttonText}>{label}</Text>
    </TactilePressable>
  )
}

export const shellStyles = {
  card: {
    backgroundColor: SURFACE,
    borderColor: BORDER,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: RADIUS_LG,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.22,
    shadowRadius: 24,
    elevation: 4,
  } as ViewStyle,
}

const styles = StyleSheet.create({
  scrollContent: { alignItems: 'center', minHeight: '100%' },
  content: { width: '100%', maxWidth: MAX_CONTENT_WIDTH, gap: 16 },
  backgroundWash: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 360,
  },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 2 },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: RADIUS_MD,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginTop: -2,
  },
  title: { color: TEXT_PRIMARY, fontSize: 29, fontWeight: '800', letterSpacing: 0, lineHeight: 36 },
  subtitle: { color: TEXT_SECONDARY, fontSize: 14, lineHeight: 21, marginTop: 5, maxWidth: 560 },
  glowCard: {
    overflow: 'hidden',
    borderRadius: RADIUS_XL,
    borderWidth: 1,
    borderColor: ACCENT_BORDER,
    padding: 20,
    backgroundColor: SURFACE,
    shadowColor: ACCENT_GLOW,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.18,
    shadowRadius: 28,
    elevation: 5,
  },
  glassHairline: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  chip: {
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
    minHeight: 36,
    justifyContent: 'center',
  },
  chipActive: { borderColor: ACCENT_BORDER, backgroundColor: ACCENT_DIM },
  chipText: { color: TEXT_TERTIARY, fontSize: 12, fontWeight: '700' },
  chipTextActive: { color: ACCENT },
  button: {
    minHeight: 56,
    borderRadius: RADIUS_LG,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.24,
    shadowRadius: 20,
    elevation: 5,
  },
  buttonText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  pressed: { opacity: 0.78, transform: [{ scale: 0.98 }] },
})
