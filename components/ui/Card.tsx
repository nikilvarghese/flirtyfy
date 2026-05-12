import { View, StyleSheet, type ViewProps } from 'react-native'
import { BORDER, RADIUS_LG, SURFACE_RAISED } from '@/lib/theme'

interface CardProps extends ViewProps {
  /** Tighter padding */
  compact?: boolean
}

/**
 * Generic container card.
 * Use as a surface for list items, form sections, info panels, etc.
 */
export function Card({ compact, style, children, ...rest }: CardProps) {
  return (
    <View
      style={[
        styles.card,
        compact ? styles.compact : styles.normal,
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor:  SURFACE_RAISED,
    borderRadius:     RADIUS_LG,
    borderWidth:      StyleSheet.hairlineWidth,
    borderColor:      BORDER,
    shadowColor:      '#000',
    shadowOffset:     { width: 0, height: 10 },
    shadowOpacity:    0.22,
    shadowRadius:     22,
    elevation:        4,
  },
  normal:  { padding: 18 },
  compact: { padding: 12 },
})
