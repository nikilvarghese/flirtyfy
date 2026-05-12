import { useState, useEffect } from 'react'
import { ActivityIndicator, Image, StyleSheet, TextInput, View, Pressable, ScrollView, Alert } from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import * as Clipboard from 'expo-clipboard'
import { Copy, Heart } from 'lucide-react-native'
import { Text } from '@/components/ui/Text'
import { Chip, GradientButton, ScreenShell, shellStyles } from '@/components/FlirtyfyShell'
import { useFlirtyfy } from '@/store/flirtyfyStore'
import { extractChatTextFromImage, generateDatingCopy } from '@/services/openai'
import { ACCENT, BORDER, SURFACE, TEXT_PRIMARY, TEXT_SECONDARY, TEXT_TERTIARY } from '@/lib/theme'
import { TONES } from '@/constants/flirtyfy'
import type { Generation, Tone } from '@/types/flirtyfy'

export default function OcrUploadScreen() {
  const {
    persona,
    tone,
    setTone,
    addGeneration,
    history,
    toggleFavorite,
    defaultToneOCR,
  } = useFlirtyfy()
  const [image, setImage] = useState<string | null>(null)
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [ocrLoading, setOcrLoading] = useState(false)
  const [results, setResults] = useState<Generation | null>(null)

  useEffect(() => {
    setTone(defaultToneOCR)
  }, [defaultToneOCR])

  async function pickImage() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!permission.granted) return
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.85 })
    if (result.canceled) return
    const uri = result.assets[0]?.uri
    if (!uri) return
    setImage(uri)
    setOcrLoading(true)
    try {
      const extracted = await extractChatTextFromImage(uri)
      setText(extracted)
    } catch (error: any) {
      console.error('[OCR Screen] Extraction error:', error.message)
      Alert.alert('OCR Failed', error.message || 'Please try again.')
    } finally {
      setOcrLoading(false)
    }
  }

  async function generate(overrideTone?: Tone) {
    const activeTone = overrideTone || tone
    if (overrideTone) setTone(overrideTone)

    setLoading(true)
    try {
      const generation = await generateDatingCopy({ kind: 'reply', input: text, tone: activeTone, persona })
      addGeneration(generation)
      setResults(generation)
    } catch (err: any) {
      Alert.alert('Generation failed', err.message || 'Please try again later.')
    } finally {
      setLoading(false)
    }
  }

  const remainingTones = TONES.filter(t => t !== tone)
  const isCurrentFavorited = results ? history.find(h => h.id === results.id)?.favorite : false

  return (
    <ScreenShell title="Screenshot OCR" subtitle="Upload a chat screenshot, clean the extracted text, then generate replies." back>
      {image ? (
        <View style={s.previewContainer}>
          <Image source={{ uri: image }} style={s.preview} />
          <Pressable onPress={pickImage} style={s.changeImageBtn}>
            <Text style={s.changeImageText}>Change</Text>
          </Pressable>
        </View>
      ) : (
        <View style={s.empty}><Text style={s.emptyText}>No screenshot selected</Text></View>
      )}

      {!image && <GradientButton label="Choose screenshot" onPress={pickImage} disabled={ocrLoading} />}

      {ocrLoading ? (
        <View style={s.loading}><ActivityIndicator color={ACCENT} /><Text style={s.help}>Reading screenshot...</Text></View>
      ) : null}

      <TextInput
        value={text}
        onChangeText={setText}
        multiline
        textAlignVertical="top"
        placeholder="Extracted chat text appears here"
        placeholderTextColor="rgba(255,255,255,0.28)"
        style={s.input}
      />

      <View style={s.toneRow}>
        <Text style={s.label}>Initial Tone</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chips}>
          {TONES.map((item) => <Chip key={item} label={item} active={tone === item} onPress={() => setTone(item)} />)}
        </ScrollView>
      </View>

      <GradientButton label={loading ? 'Generating...' : results ? 'Regenerate set' : 'Generate replies'} onPress={() => generate()} disabled={loading || text.trim().length < 8 || ocrLoading} />

      {loading && !results && (
        <View style={s.loading}><ActivityIndicator color={ACCENT} /><Text style={s.loadingText}>Analyzing context...</Text></View>
      )}

      {results && (
        <View style={s.resultsContainer}>
          <View style={s.resultsHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={s.label}>AI Replies ({tone})</Text>
              {loading && <ActivityIndicator size="small" color={ACCENT} />}
            </View>
            <Pressable
              onPress={() => results && toggleFavorite(results)}
              style={s.favoriteBtn}
            >
              <Heart size={20} color={isCurrentFavorited ? ACCENT : TEXT_TERTIARY} fill={isCurrentFavorited ? ACCENT : 'transparent'} />
            </Pressable>
          </View>

          {results.suggestions.map((item) => (
            <View key={item.id} style={[shellStyles.card, s.resultCard, loading && { opacity: 0.5 }]}>
              <View style={s.resultHeader}>
                <Text style={s.resultTone}>{item.tone}</Text>
                <View style={s.resultActions}>
                  <Pressable onPress={() => Clipboard.setStringAsync(item.reply)} style={s.actionIcon}>
                    <Copy size={16} color={ACCENT} />
                  </Pressable>
                </View>
              </View>
              <Text style={s.replyText}>{item.reply}</Text>
            </View>
          ))}

          {!loading && (
            <View style={s.regenSection}>
              <Text style={s.regenLabel}>Try different vibe</Text>
              <View style={s.regenRow}>
                {remainingTones.map((t) => (
                  <Pressable
                    key={t}
                    onPress={() => generate(t)}
                    style={({ pressed }) => [
                      s.regenChip,
                      pressed && { opacity: 0.7 }
                    ]}
                  >
                    <Text style={s.regenChipText}>{t}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScreenShell>
  )
}

const s = StyleSheet.create({
  previewContainer: { width: '100%', aspectRatio: 1.2, borderRadius: 18, overflow: 'hidden', position: 'relative' },
  preview: { width: '100%', height: '100%', backgroundColor: SURFACE },
  changeImageBtn: { position: 'absolute', bottom: 12, right: 12, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  changeImageText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  empty: { height: 180, borderRadius: 18, borderWidth: 1, borderColor: BORDER, backgroundColor: SURFACE, alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: TEXT_SECONDARY },
  input: { minHeight: 140, borderRadius: 18, borderWidth: 1, borderColor: BORDER, backgroundColor: SURFACE, padding: 16, color: '#fff', fontSize: 15, lineHeight: 22, marginTop: 12 },
  loading: { alignItems: 'center', gap: 10, paddingVertical: 20 },
  help: { color: TEXT_SECONDARY, fontSize: 13 },
  loadingText: { color: TEXT_SECONDARY, fontSize: 14, fontWeight: '600' },
  label: { color: TEXT_SECONDARY, fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8 },
  toneRow: { marginTop: 16, marginBottom: 20, gap: 10 },
  chips: { gap: 9 },
  resultsContainer: { marginTop: 10, gap: 16 },
  resultsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  resultCard: { gap: 10, backgroundColor: 'rgba(255,255,255,0.03)' },
  resultHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  resultTone: { color: ACCENT, fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
  resultActions: { flexDirection: 'row', gap: 14 },
  actionIcon: { padding: 4 },
  favoriteBtn: { padding: 8, marginRight: -8 },
  replyText: { color: TEXT_PRIMARY, fontSize: 16, lineHeight: 24, fontWeight: '700' },
  regenSection: { marginTop: 10, gap: 12 },
  regenLabel: { color: TEXT_TERTIARY, fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, textAlign: 'center' },
  regenRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  regenChip: {
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10
  },
  regenChipText: { color: TEXT_SECONDARY, fontSize: 12, fontWeight: '700' },
})
