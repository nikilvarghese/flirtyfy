import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native'
import Animated, {
  Easing,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import { Sparkles } from 'lucide-react-native'
import { Text } from '@/components/ui/Text'
import { ACCENT, ACCENT_BORDER, SURFACE, TEXT_PRIMARY, TEXT_SECONDARY } from '@/lib/theme'

const AnimatedView = Animated.createAnimatedComponent(View)

export function DemoAction({
  label,
  hint,
  onPress,
  style,
}: {
  label: string
  hint: string
  onPress: () => void
  style?: StyleProp<ViewStyle>
}) {
  const pressed = useSharedValue(0)

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - pressed.value * 0.012 }],
    borderColor: interpolateColor(pressed.value, [0, 1], ['rgba(255,79,123,0.22)', 'rgba(255,79,123,0.44)']),
    backgroundColor: interpolateColor(pressed.value, [0, 1], ['rgba(20,14,24,0.82)', 'rgba(32,18,28,0.96)']),
    shadowColor: ACCENT,
    shadowOpacity: pressed.value * 0.18,
    shadowRadius: 18 + pressed.value * 10,
  }))

  return (
    <AnimatedView style={[s.card, animatedStyle, style]}>
      <Pressable
        onPress={onPress}
        onPressIn={() => {
          pressed.value = withTiming(1, { duration: 120, easing: Easing.out(Easing.cubic) })
        }}
        onPressOut={() => {
          pressed.value = withTiming(0, { duration: 180, easing: Easing.out(Easing.cubic) })
        }}
        style={s.pressTarget}
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        <View style={s.badge}>
          <Sparkles size={13} color={ACCENT} />
          <Text style={s.badgeText}>Demo</Text>
        </View>
        <Text style={s.hint}>{hint}</Text>
        <View style={s.pill}>
          <Text style={s.pillText}>{label}</Text>
        </View>
      </Pressable>
    </AnimatedView>
  )
}

const s = StyleSheet.create({
  card: {
    borderRadius: 18,
    borderWidth: 1,
    backgroundColor: SURFACE,
    shadowOffset: { width: 0, height: 10 },
    elevation: 2,
  },
  pressTarget: {
    minHeight: 52,
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  badge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: ACCENT_BORDER,
    backgroundColor: 'rgba(255,79,123,0.09)',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  badgeText: {
    color: ACCENT,
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  hint: {
    color: TEXT_SECONDARY,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  pill: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,79,123,0.28)',
    backgroundColor: 'rgba(255,79,123,0.08)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 36,
    justifyContent: 'center',
  },
  pillText: {
    color: TEXT_PRIMARY,
    fontSize: 12,
    fontWeight: '700',
  },
})
