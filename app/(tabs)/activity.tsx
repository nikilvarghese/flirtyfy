import { Pressable, StyleSheet, View } from 'react-native'
import { router } from 'expo-router'
import { Heart, History } from 'lucide-react-native'
import { Text } from '@/components/ui/Text'
import { ScreenShell, shellStyles } from '@/components/FlirtyfyShell'
import { TAB_BAR_CLEARANCE } from '@/components/TabBar'
import { ACCENT, TEXT_PRIMARY, TEXT_SECONDARY } from '@/lib/theme'
import { useFlirtyfy } from '@/store/flirtyfyStore'

export default function HistoryTab() {
  const { history, favorites } = useFlirtyfy()
  const items = history.length ? history : []

  return (
    <ScreenShell title="History" subtitle="Every generation is saved locally and synced to Supabase when configured." bottomPadding={TAB_BAR_CLEARANCE + 18}>
      <View style={s.summaryRow}>
        <Pressable onPress={() => router.push('/history')} style={[shellStyles.card, s.summary]}>
          <History size={18} color={ACCENT} />
          <Text style={s.count}>{history.length}</Text>
          <Text style={s.label}>Generations</Text>
        </Pressable>
        <Pressable onPress={() => router.push('/favorites')} style={[shellStyles.card, s.summary]}>
          <Heart size={18} color={ACCENT} />
          <Text style={s.count}>{favorites.length}</Text>
          <Text style={s.label}>Favorites</Text>
        </Pressable>
      </View>

      {items.length === 0 ? (
        <View style={shellStyles.card}>
          <Text style={s.title}>Your best lines will live here</Text>
          <Text style={s.body}>Generate a reply, opener, or bio to populate history for the walkthrough.</Text>
        </View>
      ) : items.map((item) => (
        <View key={item.id} style={shellStyles.card}>
          <Text style={s.title}>{item.title}</Text>
          <Text style={s.body}>{item.suggestions[0]?.reply}</Text>
        </View>
      ))}
    </ScreenShell>
  )
}

const s = StyleSheet.create({
  summaryRow: { flexDirection: 'row', gap: 12 },
  summary: { flex: 1, gap: 5 },
  count: { color: TEXT_PRIMARY, fontSize: 24, fontWeight: '900' },
  label: { color: TEXT_SECONDARY, fontSize: 12 },
  title: { color: TEXT_PRIMARY, fontSize: 15, fontWeight: '800' },
  body: { color: TEXT_SECONDARY, fontSize: 13, lineHeight: 20, marginTop: 4 },
})
