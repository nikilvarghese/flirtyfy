import { useState, useEffect } from 'react'
import { ActivityIndicator, Image, StyleSheet, TextInput, View, Pressable, ScrollView } from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { router } from 'expo-router'
import { Text } from '@/components/ui/Text'
import { Chip, GradientButton, ScreenShell } from '@/components/FlirtyfyShell'
import { useFlirtyfy } from '@/store/flirtyfyStore'
import { extractChatTextFromImage, generateDatingCopy } from '@/services/openai'
import { ACCENT, ACCENT_DIM, BORDER, SURFACE, TEXT_PRIMARY, TEXT_SECONDARY } from '@/lib/theme'
import { TONES } from '@/constants/flirtyfy'
import { useToast } from '@/contexts/ToastContext'
import type { Tone } from '@/types/flirtyfy'

export default function OcrUploadScreen() {
  const {
    persona,
    tone,
    setTone,
    addGeneration,
    defaultToneOCR,
  } = useFlirtyfy()
  const { showToast } = useToast()
  const [image, setImage] = useState<string | null>(null)
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [ocrLoading, setOcrLoading] = useState(false)

  useEffect(() => {
    setTone(defaultToneOCR)
  }, [defaultToneOCR])

  async function pickImage() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!permission.granted) {
      showToast('Photo permission is needed', 'warning')
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.85 })
    if (result.canceled) return
    const uri = result.assets[0]?.uri
    if (!uri) return
    setImage(uri)
    showToast('Screenshot uploaded', 'success')
    setOcrLoading(true)
    try {
      const extracted = await extractChatTextFromImage(uri)
      setText(extracted)
      showToast('Chat extracted successfully', 'success')
    } catch {
      showToast('Could not read screenshot', 'error')
    } finally {
      setOcrLoading(false)
    }
  }

  async function generate() {
    if (loading || text.trim().length < 8 || ocrLoading) return
    setLoading(true)
    try {
      const generation = await generateDatingCopy({ kind: 'reply', input: text, tone, persona })
      addGeneration(generation)
      showToast('Replies generated', 'success')
      router.push({ pathname: '/results', params: { id: generation.id } } as any)
    } catch {
      showToast('Failed to generate replies', 'error')
    } finally {
      setLoading(false)
    }
  }

  function switchTone(nextTone: Tone) {
    setTone(nextTone)
    if (nextTone !== tone) showToast(`Tone switched to ${nextTone}`, 'info')
  }

  return (
    <ScreenShell title="OCR Upload" subtitle="Screenshot to text, then generate the perfect reply." back>
      {image ? (
        <View style={s.previewContainer}>
          <Image source={{ uri: image }} style={s.preview} />
          <Pressable onPress={pickImage} style={s.changeImageBtn}>
            <Text style={s.changeImageText}>Change</Text>
          </Pressable>
        </View>
      ) : (
        <View style={s.empty}>
          <Pressable onPress={pickImage} style={s.uploadBtn}>
            <Text style={s.uploadText}>Select Screenshot</Text>
          </Pressable>
        </View>
      )}

      {ocrLoading && (
        <View style={s.loading}>
          <ActivityIndicator color="#ff4f7b" />
          <Text style={s.help}>Reading screenshot...</Text>
        </View>
      )}

      <TextInput
        value={text}
        onChangeText={setText}
        multiline
        textAlignVertical="top"
        placeholder="Extracted chat text will appear here..."
        placeholderTextColor="rgba(255,255,255,0.28)"
        style={s.input}
      />

      <Text style={s.label}>Initial Tone</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chips} style={{ maxHeight: 50 }}>
        {TONES.map((item) => <Chip key={item} label={item} active={tone === item} onPress={() => switchTone(item)} />)}
      </ScrollView>

      <View style={{ marginTop: 24 }}>
        <GradientButton
          label={loading ? 'Thinking...' : 'Generate replies'}
          onPress={generate}
          disabled={loading || text.trim().length < 8 || ocrLoading}
        />
      </View>

      {loading && (
        <View style={s.loading}>
          <ActivityIndicator color="#ff4f7b" />
          <Text style={s.loadingText}>Vibe check in progress...</Text>
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScreenShell>
  )
}

const s = StyleSheet.create({
  previewContainer: { width: '100%', aspectRatio: 1.5, borderRadius: 20, overflow: 'hidden', position: 'relative', backgroundColor: SURFACE, borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)', shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.2, shadowRadius: 22, elevation: 3 },
  preview: { width: '100%', height: '100%', resizeMode: 'contain' },
  changeImageBtn: { position: 'absolute', bottom: 12, right: 12, backgroundColor: 'rgba(0,0,0,0.68)', paddingHorizontal: 13, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  changeImageText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  empty: { height: 150, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)', backgroundColor: SURFACE, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.2, shadowRadius: 22, elevation: 3 },
  uploadBtn: { padding: 20 },
  uploadText: { color: ACCENT, fontWeight: '800' },
  input: { minHeight: 190, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)', backgroundColor: SURFACE, padding: 18, color: TEXT_PRIMARY, fontSize: 15, lineHeight: 23, marginTop: 20 },
  loading: { alignItems: 'center', gap: 10, padding: 18, borderRadius: 18, borderWidth: 1, borderColor: BORDER, backgroundColor: ACCENT_DIM },
  help: { color: TEXT_SECONDARY, fontSize: 13, fontWeight: '600' },
  loadingText: { color: TEXT_SECONDARY, fontSize: 14, fontWeight: '600' },
  label: { color: TEXT_SECONDARY, fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 24, marginBottom: 12 },
  chips: { gap: 9, paddingRight: 6 },
})
