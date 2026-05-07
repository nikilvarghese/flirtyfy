import { Pressable, StyleSheet, View } from 'react-native'
import { router } from 'expo-router'
import { Camera, MessageSquareQuote, Sparkles, UserRoundPen } from 'lucide-react-native'
import { Text } from '@/components/ui/Text'
import { ScreenShell, shellStyles } from '@/components/FlirtyfyShell'
import { TAB_BAR_CLEARANCE } from '@/components/TabBar'
import { ACCENT, TEXT_PRIMARY, TEXT_SECONDARY } from '@/lib/theme'

const tools = [
  { title: 'Reply generator', body: 'Funny, flirty, confident, direct, soft, bold, and more.', route: '/chat-paste', icon: MessageSquareQuote },
  { title: 'Screenshot OCR', body: 'Upload a chat screenshot and extract the text in order.', route: '/ocr-upload', icon: Camera },
  { title: 'Openers', body: 'Non-cringe personalized first messages from profile details.', route: '/openers', icon: Sparkles },
  { title: 'Bio writer', body: 'Tinder, Bumble, and Hinge bios in premium styles.', route: '/bio-writer', icon: UserRoundPen },
]

export default function CreateScreen() {
  return (
    <ScreenShell title="Create" subtitle="All the AI dating tools judges expect, with fast demo-ready flows." bottomPadding={TAB_BAR_CLEARANCE + 18}>
      {tools.map((tool) => {
        const Icon = tool.icon
        return (
          <Pressable key={tool.title} onPress={() => router.push(tool.route as any)} style={({ pressed }) => [shellStyles.card, s.tool, pressed && { opacity: 0.75 }]}>
            <View style={s.icon}><Icon size={20} color={ACCENT} /></View>
            <View style={{ flex: 1 }}>
              <Text style={s.title}>{tool.title}</Text>
              <Text style={s.body}>{tool.body}</Text>
            </View>
          </Pressable>
        )
      })}
    </ScreenShell>
  )
}

const s = StyleSheet.create({
  tool: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  icon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,79,123,0.12)' },
  title: { color: TEXT_PRIMARY, fontSize: 16, fontWeight: '800' },
  body: { color: TEXT_SECONDARY, fontSize: 13, lineHeight: 19, marginTop: 3 },
})
