import { StyleSheet, View } from 'react-native'
import { Text } from '@/components/ui/Text'
import { ScreenShell, shellStyles } from '@/components/FlirtyfyShell'
import { useFlirtyfy } from '@/store/flirtyfyStore'
import { TEXT_PRIMARY, TEXT_SECONDARY } from '@/lib/theme'

export default function FavoritesScreen() {
  const { favorites } = useFlirtyfy()
  return (
    <ScreenShell title="Favorites" subtitle="Saved replies for fast one-tap reuse during a demo or real chat.">
      {favorites.length === 0 ? (
        <View style={shellStyles.card}><Text style={s.body}>Favorite a result to keep it here.</Text></View>
      ) : favorites.map((item) => (
        <View key={item.id} style={shellStyles.card}>
          <Text style={s.title}>{item.title}</Text>
          <Text style={s.body}>{item.suggestions[0]?.reply}</Text>
        </View>
      ))}
    </ScreenShell>
  )
}

const s = StyleSheet.create({
  title: { color: TEXT_PRIMARY, fontSize: 15, fontWeight: '800' },
  body: { color: TEXT_SECONDARY, fontSize: 13, lineHeight: 20, marginTop: 4 },
})
