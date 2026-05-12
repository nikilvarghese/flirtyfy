import { StyleSheet, TouchableOpacity, View } from 'react-native'
import * as Clipboard from 'expo-clipboard'
import { Copy, Trash2 } from 'lucide-react-native'

import { Text } from '@/components/ui/Text'
import {
  ScreenShell,
  shellStyles,
} from '@/components/FlirtyfyShell'

import { useFlirtyfy } from '@/store/flirtyfyStore'

import {
  ACCENT,
  BORDER,
  SURFACE,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
  TEXT_TERTIARY,
} from '@/lib/theme'

export default function FavoritesScreen() {
  const {
    favorites,
    toggleFavorite,
  } = useFlirtyfy()

  return (
    <ScreenShell
      title="Favorites"
      subtitle="Saved replies for fast one-tap reuse during a demo or real chat."
      back
    >
      {favorites.length === 0 ? (
        <View style={shellStyles.card}>
          <Text style={s.body}>
            Favorite a result to keep it here.
          </Text>
        </View>
      ) : (
        favorites.map((item) => (
          <View
            key={item.id}
            style={[shellStyles.card, s.card]}
          >
            <View style={s.header}>
              <View style={s.metaRow}>
                <View style={s.kindPill}>
                  <Text style={s.kindText}>
                    {item.kind.toUpperCase()}
                  </Text>
                </View>

                <View style={s.tonePill}>
                  <Text style={s.toneText}>
                    {item.tone}
                  </Text>
                </View>
              </View>

              <Text style={s.time}>
                just now
              </Text>
            </View>

            <Text style={s.input}>
              {item.input}
            </Text>

            <View style={s.divider} />

            <Text style={s.sectionTitle}>
              SUGGESTED REPLIES
            </Text>

            <View style={s.suggestions}>
              {item.suggestions.map(
                (suggestion, index) => (
                  <View
                    key={suggestion.id}
                    style={s.replyCard}
                  >
                    <View style={s.replyTop}>
                      <Text style={s.replyLabel}>
                        REPLY {index + 1}
                      </Text>

                      <TouchableOpacity
                        onPress={() => {
                          Clipboard.setStringAsync(
                            suggestion.reply
                          )
                        }}
                        style={s.copyBtn}
                      >
                        <Copy
                          size={14}
                          color={ACCENT}
                        />

                        <Text style={s.copyText}>
                          COPY
                        </Text>
                      </TouchableOpacity>
                    </View>

                    <Text style={s.replyText}>
                      {suggestion.reply}
                    </Text>
                  </View>
                )
              )}
            </View>

            <View style={s.bottomRow}>
              <TouchableOpacity
                onPress={() =>
                  toggleFavorite(item)
                }
                style={s.deleteBtn}
              >
                <Trash2
                  size={16}
                  color="#ff4444"
                />

                <Text style={s.deleteText}>
                  Delete
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}
    </ScreenShell>
  )
}

const s = StyleSheet.create({
  card: {
    gap: 16,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  metaRow: {
    flexDirection: 'row',
    gap: 8,
  },

  kindPill: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },

  tonePill: {
    backgroundColor: 'rgba(255,79,123,0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },

  kindText: {
    color: TEXT_TERTIARY,
    fontSize: 11,
    fontWeight: '800',
  },

  toneText: {
    color: ACCENT,
    fontSize: 11,
    fontWeight: '800',
  },

  time: {
    color: TEXT_TERTIARY,
    fontSize: 12,
    fontWeight: '600',
  },

  input: {
    color: TEXT_PRIMARY,
    fontSize: 16,
    lineHeight: 26,
    fontWeight: '700',
  },

  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },

  sectionTitle: {
    color: TEXT_TERTIARY,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },

  suggestions: {
    gap: 12,
  },

  replyCard: {
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: SURFACE,
    borderRadius: 18,
    padding: 14,
    gap: 10,
  },

  replyTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  replyLabel: {
    color: ACCENT,
    fontSize: 12,
    fontWeight: '900',
  },

  replyText: {
    color: TEXT_PRIMARY,
    fontSize: 15,
    lineHeight: 24,
    fontWeight: '600',
  },

  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,79,123,0.25)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },

  copyText: {
    color: ACCENT,
    fontSize: 12,
    fontWeight: '800',
  },

  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },

  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  deleteText: {
    color: '#ff4444',
    fontSize: 14,
    fontWeight: '700',
  },

  body: {
    color: TEXT_SECONDARY,
    fontSize: 13,
    lineHeight: 20,
  },
})