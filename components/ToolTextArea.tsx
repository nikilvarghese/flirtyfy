import { forwardRef, useEffect, useState } from 'react'
import { StyleSheet, TextInput, View, type StyleProp, type TextInputProps, type TextStyle, type ViewStyle } from 'react-native'
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated'
import { SURFACE, TEXT_PRIMARY } from '@/lib/theme'

export const ToolTextArea = forwardRef<TextInput, TextInputProps & {
  overlay?: React.ReactNode
  flashKey?: number
  minHeight?: number
  containerStyle?: StyleProp<ViewStyle>
  inputStyle?: StyleProp<TextStyle>
}>(function ToolTextArea({
  minHeight = 270,
  value,
  overlay,
  flashKey,
  placeholder,
  containerStyle,
  inputStyle,
  ...props
}, ref) {
  const [flashVisible, setFlashVisible] = useState(false)

  useEffect(() => {
    if (!flashKey) return
    setFlashVisible(true)
    const timeout = setTimeout(() => setFlashVisible(false), 260)
    return () => clearTimeout(timeout)
  }, [flashKey])

  return (
    <View style={[s.shell, containerStyle]}>
      <View style={[s.card, { minHeight }]}>
        <TextInput
          ref={ref}
          value={value}
          multiline
          textAlignVertical="top"
          placeholder={(!value || value.length === 0) && overlay ? '' : placeholder}
          placeholderTextColor="rgba(255,255,255,0.28)"
          style={[s.input, { minHeight }, inputStyle]}
          {...props}
        />

        {(!value || value.trim().length === 0) && overlay ? (
          <Animated.View
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(150)}
            pointerEvents="none"
            style={s.overlayWrap}
          >
            {overlay}
          </Animated.View>
        ) : null}

        {flashVisible ? (
          <Animated.View
            key={flashKey}
            entering={FadeIn.duration(140)}
            exiting={FadeOut.duration(280)}
            pointerEvents="none"
            style={s.flash}
          />
        ) : null}
      </View>
    </View>
  )
})

const s = StyleSheet.create({
  shell: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 22,
    elevation: 3,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
    backgroundColor: SURFACE,
    overflow: 'hidden',
  },
  input: {
    padding: 18,
    color: TEXT_PRIMARY,
    fontSize: 15,
    lineHeight: 23,
  },
  overlayWrap: {
    ...StyleSheet.absoluteFillObject,
    padding: 18,
    justifyContent: 'flex-start',
  },
  flash: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 20,
    backgroundColor: 'rgba(255,79,123,0.06)',
  },
})
