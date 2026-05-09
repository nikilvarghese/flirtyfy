import React, { useState, useMemo, useCallback } from 'react'
import { StyleSheet, View, TouchableOpacity, Alert, FlatList, Pressable, LayoutAnimation, Platform, UIManager, Share } from 'react-native'
import { Text } from '@/components/ui/Text'
import { ScreenShell } from '@/components/FlirtyfyShell'
import { useFlirtyfy } from '@/store/flirtyfyStore'
import { TEXT_PRIMARY, TEXT_SECONDARY, ACCENT, CARD_BG, BORDER_COLOR } from '@/lib/theme'
import { Trash2, CheckCircle2, Circle, MoreVertical, Copy, Heart, ChevronDown, ChevronUp, History as HistoryIcon, X } from 'lucide-react-native'
import { LinearGradient } from 'expo-linear-gradient'
import * as Haptics from 'expo-haptics'
// Wait, checking package.json... date-fns is NOT there. I'll write a small helper.

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true)
}

function timeAgo(date: string | number | Date) {
  const now = new Date().getTime()
  const then = new Date(date).getTime()
  const seconds = Math.floor((now - then) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export default function HistoryScreen() {
  const { history, clearHistory, removeGeneration, removeGenerations, toggleFavorite } = useFlirtyfy()
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isSelectMode, setIsSelectMode] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const toggleSelectMode = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    setIsSelectMode(!isSelectMode)
    setSelectedIds([])
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
  }, [isSelectMode])

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
    Haptics.selectionAsync()
  }, [])

  const handleBatchDelete = () => {
    if (selectedIds.length === 0) return
    Alert.alert(
      'Delete Selected',
      `Are you sure you want to delete ${selectedIds.length} items?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            removeGenerations(selectedIds)
            setSelectedIds([])
            setIsSelectMode(false)
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
          }
        },
      ]
    )
  }

  const handleClearAll = () => {
    Alert.alert(
      'Clear All History',
      'This will permanently delete all your conversation history. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: () => {
            clearHistory()
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
          }
        },
      ]
    )
  }

  const renderItem = ({ item }: { item: any }) => {
    const isSelected = selectedIds.includes(item.id)
    const isExpanded = expandedId === item.id

    return (
      <Pressable
        onPress={() => isSelectMode ? toggleSelect(item.id) : setExpandedId(isExpanded ? null : item.id)}
        onLongPress={() => !isSelectMode && toggleSelectMode()}
        style={[s.cardWrapper, isSelected && s.cardSelected]}
      >
        <LinearGradient
          colors={[CARD_BG, 'rgba(30, 30, 35, 0.95)']}
          style={s.card}
        >
          <View style={s.cardHeader}>
            {isSelectMode && (
              <View style={s.checkbox}>
                {isSelected ? <CheckCircle2 size={22} color={ACCENT} /> : <Circle size={22} color={TEXT_SECONDARY} />}
              </View>
            )}
            <View style={s.headerContent}>
              <View style={s.badgeRow}>
                <View style={s.kindBadge}>
                  <Text style={s.kindText}>{item.kind.toUpperCase()}</Text>
                </View>
                <View style={s.toneBadge}>
                  <Text style={s.toneText}>{item.tone}</Text>
                </View>
                {item.persona && (
                  <View style={s.personaBadge}>
                    <Text style={s.personaText}>{item.persona}</Text>
                  </View>
                )}
                <Text style={s.timeText}>{timeAgo(item.createdAt)}</Text>
              </View>
              <Text numberOfLines={isExpanded ? undefined : 2} style={s.inputText}>
                {item.input}
              </Text>
            </View>
            {!isSelectMode && (
              <TouchableOpacity onPress={() => setExpandedId(isExpanded ? null : item.id)} style={s.expandBtn}>
                {isExpanded ? <ChevronUp size={20} color={TEXT_SECONDARY} /> : <ChevronDown size={20} color={TEXT_SECONDARY} />}
              </TouchableOpacity>
            )}
          </View>

          {isExpanded && (
            <View style={s.expandedContent}>
              <View style={s.divider} />
              <Text style={s.resultsTitle}>SUGGESTED REPLIES</Text>
              {item.suggestions.map((suggestion: any, index: number) => (
                <View key={suggestion.id} style={s.replyItem}>
                  <Text style={s.replyNumber}>{index + 1}</Text>
                  <Text style={s.replyText}>{suggestion.reply}</Text>
                </View>
              ))}

              <View style={s.actionRow}>
                <TouchableOpacity
                  onPress={() => {
                    const allText = item.suggestions.map((s: any) => s.reply).join('\n\n')
                    Share.share({ message: allText })
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
                  }}
                  style={s.actionBtn}
                >
                  <Copy size={16} color={TEXT_SECONDARY} />
                  <Text style={s.actionLabel}>Copy All</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    toggleFavorite(item)
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
                  }}
                  style={s.actionBtn}
                >
                  <Heart size={16} color={item.favorite ? ACCENT : TEXT_SECONDARY} fill={item.favorite ? ACCENT : 'transparent'} />
                  <Text style={[s.actionLabel, item.favorite && { color: ACCENT }]}>Favorite</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    Alert.alert('Delete Item', 'Are you sure?', [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Delete', style: 'destructive', onPress: () => removeGeneration(item.id) }
                    ])
                  }}
                  style={s.actionBtn}
                >
                  <Trash2 size={16} color="#ff4444" />
                  <Text style={[s.actionLabel, { color: '#ff4444' }]}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </LinearGradient>
      </Pressable>
    )
  }

  const EmptyState = () => (
    <View style={s.emptyState}>
      <View style={s.emptyIconCircle}>
        <HistoryIcon size={40} color={TEXT_SECONDARY} strokeWidth={1.5} />
      </View>
      <Text style={s.emptyTitle}>No history yet</Text>
      <Text style={s.emptySubtitle}>Your generated replies and OCR scans will appear here for easy access.</Text>
    </View>
  )

  return (
    <ScreenShell
      title={isSelectMode ? `${selectedIds.length} Selected` : "History"}
      subtitle={isSelectMode ? "Select items to delete them in batch." : "A complete memory of your AI interactions."}
    >
      {history.length > 0 && (
        <View style={s.topBar}>
          <TouchableOpacity
            onPress={isSelectMode ? toggleSelectMode : handleClearAll}
            style={s.topAction}
          >
            {isSelectMode ? (
              <X size={20} color={TEXT_PRIMARY} />
            ) : (
              <Text style={s.clearText}>Clear All</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
      <FlatList
        data={history}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={[s.list, history.length === 0 && { flex: 1 }]}
        ListEmptyComponent={EmptyState}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
      />

      {isSelectMode && selectedIds.length > 0 && (
        <View style={s.batchActionContainer}>
          <TouchableOpacity onPress={handleBatchDelete} style={s.batchDeleteBtn}>
            <LinearGradient
              colors={['#ff4444', '#cc0000']}
              style={s.batchGradient}
            >
              <Trash2 size={20} color="white" />
              <Text style={s.batchText}>Delete Selected ({selectedIds.length})</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
    </ScreenShell>
  )
}

const s = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 12,
  },

  list: {
    paddingBottom: 100,
  },

  topAction: {
    padding: 8,
  },

  clearText: {
    color: '#ff4444',
    fontWeight: '700',
    fontSize: 13,
  },
  cardWrapper: {
    marginBottom: 12,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: BORDER_COLOR,
  },
  cardSelected: {
    borderColor: ACCENT,
    backgroundColor: 'rgba(255, 79, 123, 0.1)',
  },
  card: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkbox: {
    marginRight: 12,
    marginTop: 4,
  },
  headerContent: {
    flex: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  kindBadge: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  kindText: { color: TEXT_SECONDARY, fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
  toneBadge: {
    backgroundColor: 'rgba(255, 79, 123, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  toneText: { color: ACCENT, fontSize: 10, fontWeight: '800' },
  personaBadge: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  personaText: { color: TEXT_PRIMARY, fontSize: 10, fontWeight: '700' },
  timeText: { color: TEXT_SECONDARY, fontSize: 10, marginLeft: 'auto' },
  inputText: {
    color: TEXT_PRIMARY,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },
  expandBtn: {
    padding: 4,
    marginLeft: 8,
  },
  expandedContent: {
    marginTop: 12,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginBottom: 12,
  },
  resultsTitle: {
    color: TEXT_SECONDARY,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 10,
  },
  replyItem: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  replyNumber: {
    color: ACCENT,
    fontSize: 12,
    fontWeight: '900',
    marginRight: 10,
    width: 15,
  },
  replyText: {
    flex: 1,
    color: TEXT_PRIMARY,
    fontSize: 14,
    lineHeight: 20,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 8,
  },
  actionLabel: {
    color: TEXT_SECONDARY,
    fontSize: 12,
    fontWeight: '700',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.03)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  emptyTitle: {
    color: TEXT_PRIMARY,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
  },
  emptySubtitle: {
    color: TEXT_SECONDARY,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 40,
  },
  batchActionContainer: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
  },
  batchDeleteBtn: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  batchGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
  },
  batchText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '800',
  },
})
