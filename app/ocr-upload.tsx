import { useState } from 'react'
import { ActivityIndicator, Image, Platform, StyleSheet, TextInput, View, TouchableOpacity } from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { router } from 'expo-router'
import { Text } from '@/components/ui/Text'
import { GradientButton, ScreenShell } from '@/components/FlirtyfyShell'
import { useFlirtyfy } from '@/store/flirtyfyStore'
import { extractChatTextFromImage, generateDatingCopy } from '@/services/openai'
import { BORDER, SURFACE, TEXT_SECONDARY } from '@/lib/theme'

export default function OcrUploadScreen() {
  const {
    persona,
    tone,
    setTone,
    addGeneration,
  } = useFlirtyfy()
  const [image, setImage] = useState<string | null>(null)
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)

  async function pickImage() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!permission.granted) return
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.85 })
    if (result.canceled) return
    const uri = result.assets[0]?.uri
    if (!uri) return
    setImage(uri)
    setLoading(true)
    try {
      const extracted = await extractChatTextFromImage(uri)
      setText(extracted)
    } catch (error: any) {
      console.error('[OCR Screen] Extraction error:', error.message)
      if (Platform.OS === 'web') {
        alert(`OCR Failed: ${error.message}`)
      } else {
        // Fallback for native if Alert is used elsewhere
        console.error(error)
      }
    } finally {
      setLoading(false)
    }
  }

  async function generate() {
    setLoading(true)
    const generation = await generateDatingCopy({ kind: 'reply', input: text, tone, persona })
    addGeneration(generation)
    setLoading(false)
    router.push({ pathname: '/results', params: { id: generation.id } })
  }

  return (
    <ScreenShell title="Screenshot OCR" subtitle="Upload a chat screenshot, clean the extracted text, then generate replies.">
      {image ? <Image source={{ uri: image }} style={s.preview} /> : <View style={s.empty}><Text style={s.emptyText}>No screenshot selected</Text></View>}
      <GradientButton label="Choose screenshot" onPress={pickImage} disabled={loading} />
      {loading ? <View style={s.loading}><ActivityIndicator /><Text style={s.help}>Reading screenshot...</Text></View> : null}
      <TextInput value={text} onChangeText={setText} multiline textAlignVertical="top" placeholder="Extracted chat text appears here" placeholderTextColor="rgba(255,255,255,0.28)" style={s.input} />
      <View style={s.toneContainer}>
        {tones.map((item) => {
          const active =
            tone.toLowerCase() ===
            item.toLowerCase()

          return (
            <TouchableOpacity
              key={item}
              onPress={() => setTone(item as any)}
              style={[
                s.toneChip,
                active && s.activeToneChip,
              ]}
            >
              <Text
                style={[
                  s.toneText,
                  active && s.activeToneText,
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          )
        })}
      </View>
      <GradientButton label="Generate replies from OCR" onPress={generate} disabled={loading || text.trim().length < 8} />
    </ScreenShell>
  )
}
const tones = [
  'Funny',
  'Flirty',
  'Confident',
  'Direct',
  'Romantic',
  'Savage',
  'Gen Z',
  'Soft',
  'Bold',
]
const s = StyleSheet.create({
  preview: { width: '100%', aspectRatio: 0.78, borderRadius: 18, borderWidth: 1, borderColor: BORDER, backgroundColor: SURFACE },
  empty: { height: 220, borderRadius: 18, borderWidth: 1, borderColor: BORDER, backgroundColor: SURFACE, alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: TEXT_SECONDARY },
  input: { minHeight: 170, borderRadius: 18, borderWidth: 1, borderColor: BORDER, backgroundColor: SURFACE, padding: 16, color: '#fff', fontSize: 15, lineHeight: 22 },
  loading: { alignItems: 'center', gap: 8 },
  help: { color: TEXT_SECONDARY, fontSize: 13 },
  toneContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 14,
    marginBottom: 18,
  },

  toneChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: SURFACE,
  },

  activeToneChip: {
    backgroundColor: '#ff4f7b',
    borderColor: '#ff4f7b',
  },

  toneText: {
    color: TEXT_SECONDARY,
    fontSize: 13,
    fontWeight: '700',
  },

  activeToneText: {
    color: '#fff',
  },
})
