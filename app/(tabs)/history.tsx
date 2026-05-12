import React, { useState, useCallback } from 'react'
import { StyleSheet, View, TouchableOpacity, Modal, FlatList, Pressable, Platform, UIManager, Clipboard } from 'react-native'
import { router } from 'expo-router'
import { Heart, History as HistoryIcon, Trash2, CheckCircle2, Circle, ChevronDown, ChevronUp, X, Copy, AlertTriangle } from 'lucide-react-native'
import { Text } from '@/components/ui/Text'
import { shellStyles } from '@/components/FlirtyfyShell'
import { TAB_BAR_CLEARANCE } from '@/components/TabBar'
import { ACCENT, TEXT_PRIMARY, TEXT_SECONDARY, CARD_BG, BORDER_COLOR, BG, SURFACE, BORDER } from '@/lib/theme'
import { useFlirtyfy } from '@/store/flirtyfyStore'
import { LinearGradient } from 'expo-linear-gradient'
import * as Haptics from 'expo-haptics'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { BlurView } from 'expo-blur'

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

export default function HistoryTab() {
  const insets = useSafeAreaInsets()
  const { history, favorites, clearHistory, removeGeneration, removeGenerations, toggleFavorite } = useFlirtyfy()
  
  // Selection State
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isSelectMode, setIsSelectMode] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // Custom Modal State
  const [confirmModal, setConfirmModal] = useState<{
    visible: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    visible: false,
    title: '',
    message: '',
    onConfirm: () => {},
  })

  const showConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmModal({ visible: true, title, message, onConfirm })
  }

  const toggleSelectMode = useCallback(() => {
    setIsSelectMode(!isSelectMode)
    setSelectedIds([])
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
  }, [isSelectMode])

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
    if (Platform.OS !== 'web') Haptics.selectionAsync()
  }, [])

  const handleBatchDelete = () => {
    if (selectedIds.length === 0) return
    showConfirm(
      'Delete Selected',
      `Are you sure you want to delete ${selectedIds.length} items? This cannot be undone.`,
      () => {
        removeGenerations(selectedIds)
        setSelectedIds([])
        setIsSelectMode(false)
        if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      }
    )
  }

  const handleClearAll = () => {
    showConfirm(
      'Clear History',
      'This will permanently delete all your conversation history. Are you absolutely sure?',
      () => {
        clearHistory()
        if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
      }
    )
  }

  const renderItem = ({ item }: { item: any }) => {
    const isSelected = selectedIds.includes(item.id)
    const isExpanded = expandedId === item.id

    return (
      <View style={[s.cardWrapper, isSelected && s.cardSelected]}>
        <LinearGradient
          colors={[CARD_BG, 'rgba(30, 30, 35, 0.95)']}
          style={s.card}
        >
          <Pressable 
            onPress={() => isSelectMode ? toggleSelect(item.id) : setExpandedId(isExpanded ? null : item.id)}
            onLongPress={() => !isSelectMode && toggleSelectMode()}
            style={s.cardHeader}
            delayLongPress={200}
          >
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
              <View style={s.expandBtn}>
                {isExpanded ? <ChevronUp size={20} color={TEXT_SECONDARY} /> : <ChevronDown size={20} color={TEXT_SECONDARY} />}
              </View>
            )}
          </Pressable>

          {isExpanded && (
            <View style={s.expandedContent}>
              <View style={s.divider} />
              <Text style={s.resultsTitle}>SUGGESTED REPLIES</Text>
              {item.suggestions.map((suggestion: any, index: number) => (
                <View key={suggestion.id} style={s.replyItem}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.replyNumber}>REPLY {index + 1}</Text>
                    <Text style={s.replyText}>{suggestion.reply}</Text>
                  </View>
                  <TouchableOpacity 
                    onPress={() => {
                      Clipboard.setString(suggestion.reply)
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
                      // Small visual feedback could be added here if needed
                    }}
                    style={s.miniCopyBtn}
                  >
                    <Copy size={14} color={ACCENT} />
                    <Text style={s.miniCopyText}>COPY</Text>
                  </TouchableOpacity>
                </View>
              ))}
              
              <View style={s.actionRow}>
                <TouchableOpacity 
                  onPress={() => {
                    toggleFavorite(item)
                    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
                  }}
                  style={s.actionBtn}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Heart size={16} color={item.favorite ? ACCENT : TEXT_SECONDARY} fill={item.favorite ? ACCENT : 'transparent'} />
                  <Text style={[s.actionLabel, item.favorite && { color: ACCENT }]}>Favorite</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  onPress={() => {
                    showConfirm(
                      'Delete Chat',
                      'Are you sure you want to delete this interaction?',
                      () => removeGeneration(item.id)
                    )
                  }}
                  style={s.actionBtn}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Trash2 size={16} color="#ff4444" />
                  <Text style={[s.actionLabel, { color: '#ff4444' }]}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </LinearGradient>
      </View>
    )
  }

  const Header = () => (
    <View style={s.headerContainer}>
      <View style={s.titleRow}>
        <View style={{ flex: 1 }}>
          <Text style={s.screenTitle}>{isSelectMode ? `${selectedIds.length} Selected` : "History"}</Text>
          <Text style={s.screenSubtitle}>{isSelectMode ? "Select items to delete them in batch." : "Every generation is saved locally for your access."}</Text>
        </View>
        {isSelectMode && (
          <TouchableOpacity onPress={toggleSelectMode} style={s.topAction}>
            <X size={20} color={TEXT_PRIMARY} />
          </TouchableOpacity>
        )}
      </View>

      <View style={s.summaryRow}>
        <View style={[shellStyles.card, s.summary]}>
          <HistoryIcon size={18} color={ACCENT} />
          <Text style={s.count}>{history.length}</Text>
          <Text style={s.label}>Generations</Text>
        </View>
        <Pressable onPress={() => router.push('/favorites')} style={[shellStyles.card, s.summary]}>
          <Heart size={18} color={ACCENT} />
          <Text style={s.count}>{favorites.length}</Text>
          <Text style={s.label}>Favorites</Text>
        </Pressable>
      </View>

      {history.length > 0 && !isSelectMode && (
        <View style={s.listHeader}>
          <Text style={s.listTitle}>RECENT ACTIVITY</Text>
          <TouchableOpacity onPress={handleClearAll} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={s.clearText}>Clear All</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  )

  const EmptyState = () => (
    <View style={s.emptyState}>
      <View style={s.emptyIconCircle}>
        <HistoryIcon size={40} color={TEXT_SECONDARY} strokeWidth={1.5} />
      </View>
      <Text style={s.emptyTitle}>No history yet</Text>
      <Text style={s.emptySubtitle}>Generate replies or openers to see them here.</Text>
    </View>
  )

  return (
    <View style={[s.container, { paddingTop: insets.top + 16 }]}>
      <FlatList
        data={history}
        renderItem={renderItem}
        ListHeaderComponent={Header}
        ListEmptyComponent={EmptyState}
        keyExtractor={item => item.id}
        contentContainerStyle={[s.list, { paddingBottom: TAB_BAR_CLEARANCE + insets.bottom + 100 }]}
        initialNumToRender={10}
        showsVerticalScrollIndicator={false}
      />

      {isSelectMode && selectedIds.length > 0 && (
        <View style={[s.batchActionContainer, { bottom: TAB_BAR_CLEARANCE + insets.bottom + 20 }]}>
          <TouchableOpacity onPress={handleBatchDelete} style={s.batchDeleteBtn}>
            <LinearGradient colors={['#ff4444', '#cc0000']} style={s.batchGradient}>
              <Trash2 size={20} color="white" />
              <Text style={s.batchText}>Delete Selected ({selectedIds.length})</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

      {/* CUSTOM PROFESSIONAL CONFIRMATION MODAL */}
      <Modal
        visible={confirmModal.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmModal({ ...confirmModal, visible: false })}
      >
        <View style={s.modalOverlay}>
          <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
          <View style={s.modalContainer}>
            <LinearGradient
              colors={[SURFACE, 'rgba(25, 25, 30, 0.98)']}
              style={s.modalCard}
            >
              <View style={s.modalIconCircle}>
                <AlertTriangle size={32} color="#ff4444" />
              </View>
              
              <Text style={s.modalTitle}>{confirmModal.title}</Text>
              <Text style={s.modalMessage}>{confirmModal.message}</Text>
              
              <View style={s.modalActionRow}>
                <TouchableOpacity 
                  onPress={() => setConfirmModal({ ...confirmModal, visible: false })}
                  style={s.modalCancelBtn}
                >
                  <Text style={s.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  onPress={() => {
                    confirmModal.onConfirm()
                    setConfirmModal({ ...confirmModal, visible: false })
                  }}
                  style={s.modalConfirmBtn}
                >
                  <LinearGradient
                    colors={['#ff4444', '#cc0000']}
                    style={s.modalConfirmGradient}
                  >
                    <Text style={s.modalConfirmText}>Delete</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG, paddingHorizontal: 20 },
  headerContainer: { marginBottom: 12 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 16 },
  screenTitle: { color: TEXT_PRIMARY, fontSize: 28, fontWeight: '800', lineHeight: 34 },
  screenSubtitle: { color: TEXT_SECONDARY, fontSize: 14, lineHeight: 21, marginTop: 4 },
  summaryRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  summary: { flex: 1, gap: 5 },
  count: { color: TEXT_PRIMARY, fontSize: 24, fontWeight: '900' },
  label: { color: TEXT_SECONDARY, fontSize: 12 },
  list: { },
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, marginTop: 10 },
  listTitle: { color: TEXT_SECONDARY, fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  clearText: { color: '#ff4444', fontWeight: '700', fontSize: 12 },
  cardWrapper: { marginBottom: 12, borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: BORDER_COLOR },
  cardSelected: { borderColor: ACCENT, backgroundColor: 'rgba(255, 79, 123, 0.1)' },
  card: { padding: 16 },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  checkbox: { marginRight: 12, marginTop: 4 },
  headerContent: { flex: 1 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  kindBadge: { backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  kindText: { color: TEXT_SECONDARY, fontSize: 9, fontWeight: '900' },
  toneBadge: { backgroundColor: 'rgba(255, 79, 123, 0.15)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  toneText: { color: ACCENT, fontSize: 10, fontWeight: '800' },
  personaBadge: { backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  personaText: { color: TEXT_PRIMARY, fontSize: 10, fontWeight: '700' },
  timeText: { color: TEXT_SECONDARY, fontSize: 10, marginLeft: 'auto' },
  inputText: { color: TEXT_PRIMARY, fontSize: 14, lineHeight: 20, fontWeight: '600' },
  expandBtn: { padding: 4, marginLeft: 8 },
  expandedContent: { marginTop: 12 },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginBottom: 12 },
  resultsTitle: { color: TEXT_SECONDARY, fontSize: 10, fontWeight: '900', letterSpacing: 1, marginBottom: 10 },
  replyItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  replyNumber: { color: ACCENT, fontSize: 9, fontWeight: '900', marginBottom: 4 },
  replyText: { color: TEXT_PRIMARY, fontSize: 14, lineHeight: 20 },
  miniCopyBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255, 79, 123, 0.1)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255, 79, 123, 0.2)', marginLeft: 10 },
  miniCopyText: { color: ACCENT, fontSize: 10, fontWeight: '900' },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, paddingTop: 8 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 8 },
  actionLabel: { color: TEXT_SECONDARY, fontSize: 12, fontWeight: '700' },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyIconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.03)', alignItems: 'center', justifyContent: 'center', marginBottom: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  emptyTitle: { color: TEXT_PRIMARY, fontSize: 18, fontWeight: '800', marginBottom: 8 },
  emptySubtitle: { color: TEXT_SECONDARY, fontSize: 14, textAlign: 'center', paddingHorizontal: 40 },
  batchActionContainer: { position: 'absolute', left: 20, right: 20 },
  batchDeleteBtn: { borderRadius: 16, overflow: 'hidden' },
  batchGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16 },
  batchText: { color: 'white', fontSize: 15, fontWeight: '800' },
  topAction: { padding: 8 },
  // Modal Styles
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContainer: { width: '100%', maxWidth: 400, borderRadius: 28, overflow: 'hidden', borderWidth: 1, borderColor: BORDER },
  modalCard: { padding: 24, alignItems: 'center' },
  modalIconCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(255, 68, 68, 0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255, 68, 68, 0.2)' },
  modalTitle: { color: TEXT_PRIMARY, fontSize: 20, fontWeight: '800', marginBottom: 8, textAlign: 'center' },
  modalMessage: { color: TEXT_SECONDARY, fontSize: 15, lineHeight: 22, textAlign: 'center', marginBottom: 24, paddingHorizontal: 10 },
  modalActionRow: { flexDirection: 'row', gap: 12, width: '100%' },
  modalCancelBtn: { flex: 1, height: 50, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  modalCancelText: { color: TEXT_PRIMARY, fontSize: 15, fontWeight: '700' },
  modalConfirmBtn: { flex: 1, height: 50, borderRadius: 14, overflow: 'hidden' },
  modalConfirmGradient: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  modalConfirmText: { color: 'white', fontSize: 15, fontWeight: '800' },
})
