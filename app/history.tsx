import { StyleSheet, View, TouchableOpacity, Alert } from 'react-native'
import { Text } from '@/components/ui/Text'
import { ScreenShell, shellStyles } from '@/components/FlirtyfyShell'
import { useFlirtyfy } from '@/store/flirtyfyStore'
import { TEXT_PRIMARY, TEXT_SECONDARY, ACCENT } from '@/lib/theme'
import { Trash2 } from 'lucide-react-native'

export default function HistoryScreen() {
  const { history, clearHistory, removeGeneration } = useFlirtyfy()

  const handleClearAll = () => {
    Alert.alert(
      'Clear History',
      'Are you sure you want to delete all generations?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear All', style: 'destructive', onPress: clearHistory },
      ]
    )
  }

  return (
    <ScreenShell 
      title="Generation history" 
      subtitle="A persistent local timeline with Supabase inserts when configured."
    >
      {history.length > 0 && (
        <TouchableOpacity onPress={handleClearAll} style={s.clearAllButton}>
          <Text style={s.clearAllText}>Clear All History</Text>
        </TouchableOpacity>
      )}

      {history.length === 0 ? (
        <View style={shellStyles.card}><Text style={s.body}>No generations yet. Create a reply, opener, or bio first.</Text></View>
      ) : history.map((item) => (
        <View key={item.id} style={[shellStyles.card, s.cardContent]}>
          <View style={{ flex: 1 }}>
            <Text style={s.title}>{item.title}</Text>
            <Text style={s.body}>{item.input}</Text>
            <Text style={s.reply}>{item.suggestions[0]?.reply}</Text>
          </View>
          <TouchableOpacity 
            onPress={() => removeGeneration(item.id)}
            style={s.deleteButton}
          >
            <Trash2 size={20} color="#ff4444" />
          </TouchableOpacity>
        </View>
      ))}
    </ScreenShell>
  )
}

const s = StyleSheet.create({
  title: { color: TEXT_PRIMARY, fontSize: 15, fontWeight: '800' },
  body: { color: TEXT_SECONDARY, fontSize: 13, lineHeight: 20, marginTop: 4 },
  reply: { color: TEXT_PRIMARY, fontSize: 14, lineHeight: 21, marginTop: 10, fontWeight: '700' },
  clearAllButton: {
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  clearAllText: {
    color: '#ff4444',
    fontWeight: '700',
    fontSize: 14,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  deleteButton: {
    padding: 10,
    marginLeft: 10,
  },
})
