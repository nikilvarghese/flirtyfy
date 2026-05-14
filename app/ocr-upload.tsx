import { useState, useEffect } from 'react'
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, View, type ImageSourcePropType } from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { Asset } from 'expo-asset'
import * as FileSystem from 'expo-file-system/legacy'
import { LinearGradient } from 'expo-linear-gradient'
import { router } from 'expo-router'
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated'
import { Camera, Sparkles } from 'lucide-react-native'
import { Text } from '@/components/ui/Text'
import { Chip, GradientButton, ScreenShell } from '@/components/FlirtyfyShell'
import { DemoAction } from '@/components/DemoAction'
import { ToolTextArea } from '@/components/ToolTextArea'
import { useFlirtyfy } from '@/store/flirtyfyStore'
import { extractChatTextFromImage, generateDatingCopy } from '@/services/openai'
import { ACCENT, ACCENT_DIM, ACCENT_BORDER, BORDER, SURFACE, TEXT_PRIMARY, TEXT_SECONDARY, TEXT_TERTIARY } from '@/lib/theme'
import { TONES } from '@/constants/flirtyfy'
import { useToast } from '@/contexts/ToastContext'
import type { Tone } from '@/types/flirtyfy'

const OCR_DEMO_ASSET = require('../assets/ocr-demo.png')

function imagePickerDataUrl(asset: ImagePicker.ImagePickerAsset) {
  if (!asset.base64) return asset.uri

  return `data:${asset.mimeType ?? 'image/jpeg'};base64,${asset.base64}`
}

export default function OcrUploadScreen() {
  const {
    persona,
    tone,
    setTone,
    addGeneration,
    defaultToneOCR,
  } = useFlirtyfy()
  const { showToast } = useToast()
  const [previewSource, setPreviewSource] = useState<ImageSourcePropType | null>(null)
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [ocrLoading, setOcrLoading] = useState(false)
  const [previewKey, setPreviewKey] = useState(0)
  const [textFlashKey, setTextFlashKey] = useState(0)
  const [imageAspectRatio, setImageAspectRatio] = useState<number | undefined>(undefined)

  useEffect(() => {
    setTone(defaultToneOCR)
  }, [defaultToneOCR])

  async function runOcrFlow(preview: ImageSourcePropType, ocrSource: string) {
    setPreviewSource(preview)
    setPreviewKey((current) => current + 1)
    setText('')
    showToast('Screenshot uploaded', 'success')
    setOcrLoading(true)

    try {
      const extracted = await extractChatTextFromImage(ocrSource)
      console.log('[OCR TEXT]', extracted)

      if (!extracted || !extracted.trim()) {
        showToast('No readable text found', 'warning')
        return
      }

      setText(extracted)
      setTextFlashKey((current) => current + 1)
      showToast('Chat extracted successfully', 'success')
    } catch {
      showToast('Could not read screenshot', 'error')
    } finally {
      setOcrLoading(false)
    }
  }

  async function pickImage() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!permission.granted) {
      showToast('Photo permission is needed', 'warning')
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      base64: true,
      quality: 0.85,
    })
    if (result.canceled) return
    const asset = result.assets[0]
    if (!asset?.uri) return

    if (asset.width && asset.height) {
      setImageAspectRatio(asset.width / asset.height)
    }

    await runOcrFlow({ uri: asset.uri }, imagePickerDataUrl(asset))
  }

  async function useDemoOcr() {
    try {
      console.log('[DEMO] step 1')

      const asset = Asset.fromModule(
        require('../assets/ocr-demo.png')
      )

      console.log('[DEMO] step 2', asset)

      await asset.downloadAsync()

      console.log('[DEMO] step 3')

      const uri = asset.localUri || asset.uri

      console.log('[DEMO] step 4 URI:', uri)

      if (!uri) {
        throw new Error('URI missing')
      }

      if (asset.width && asset.height) {
        setImageAspectRatio(asset.width / asset.height)
      } else {
        setImageAspectRatio(0.58)
      }

      console.log('[DEMO] step 5 reading directly from URI')

      const base64 =
        await FileSystem.readAsStringAsync(uri, {
          encoding: 'base64',
        })

      console.log('[DEMO] step 7 base64:', base64.length)

      const dataUrl = `data:image/png;base64,${base64}`

      console.log('[DEMO OCR PAYLOAD]', {
        startsWithData: dataUrl.startsWith('data:'),
        length: dataUrl.length,
        preview: dataUrl.slice(0, 80),
      })

      await runOcrFlow(OCR_DEMO_ASSET, dataUrl)
    } catch (e) {
      console.error('[DEMO OCR ERROR]', e)
      showToast('Could not read screenshot', 'error')
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
    if (nextTone !== tone) showToast(`Tone switched to ${nextTone}`, 'success')
  }

  function swapSides() {
    setText((prev) => {
      return prev
        .split('\n')
        .map(line => {
          if (line.startsWith('Person A:')) return line.replace('Person A:', 'Person B:');
          if (line.startsWith('Person B:')) return line.replace('Person B:', 'Person A:');
          return line;
        })
        .join('\n');
    });
  }

  return (
    <ScreenShell title="OCR Upload" subtitle="Screenshot to text, then generate the perfect reply." back>
      {previewSource ? (
        <Animated.View key={`preview-${previewKey}`} entering={FadeInDown.duration(220)} style={s.previewBlock}>
          <View style={[s.previewContainer, imageAspectRatio ? { aspectRatio: imageAspectRatio } : null]}>
            <Image source={previewSource} style={s.preview} />
            <Pressable onPress={pickImage} style={s.changeImageBtn}>
              <Text style={s.changeImageText}>Change</Text>
            </Pressable>
          </View>
          <Text style={s.previewHelp}>Preview the screenshot, keep the extracted text editable, and generate when ready.</Text>
        </Animated.View>
      ) : (
        <Animated.View entering={FadeIn.duration(220)} style={s.emptyState}>
          <LinearGradient
            colors={['rgba(255,79,123,0.14)', 'rgba(255,79,123,0.04)', 'rgba(255,255,255,0.02)']}
            locations={[0, 0.55, 1]}
            style={StyleSheet.absoluteFillObject}
          />
          <View style={s.emptyIcon}>
            <Camera size={22} color={ACCENT} />
          </View>
          <Text style={s.emptyTitle}>Bring in a chat screenshot</Text>
          <Text style={s.emptyBody}>Preview the image, extract the text, then turn it into polished reply ideas in one flow.</Text>
          <Pressable onPress={pickImage} style={s.uploadBtn}>
            <Text style={s.uploadText}>Choose screenshot</Text>
          </Pressable>
          <Text style={s.emptyFoot}>Best with clear bubbles and readable text.</Text>
        </Animated.View>
      )}

      {!previewSource && !text.trim() && (
        <DemoAction
          label="Use OCR demo"
          hint="Load a sample interaction."
          onPress={useDemoOcr}
        />
      )}

      {ocrLoading && (
        <View style={s.loading}>
          <ActivityIndicator color="#ff4f7b" />
          <Text style={s.help}>Reading screenshot...</Text>
        </View>
      )}

      <ToolTextArea
        value={text}
        onChangeText={setText}
        placeholder="Extracted chat text will appear here..."
        minHeight={190}
        containerStyle={s.input}
        flashKey={textFlashKey}
        overlay={
          !ocrLoading && !text.trim() && (
            <View style={s.overlay}>
              <View style={s.overlayRow}>
                <Sparkles size={14} color={ACCENT} />
                <Text style={s.overlayLabel}>Extraction preview</Text>
              </View>
              <Text style={s.overlayTitle}>Upload a screenshot or load the demo.</Text>
              <Text style={s.overlayBody}>The extracted chat will land here, ready for edits before you generate.</Text>
            </View>
          )
        }
      />

      {text.trim().length > 0 && (
        <View style={s.swapContainer}>
          <Pressable onPress={swapSides} style={s.swapBtn}>
            <Text style={s.swapText}>↔ Swap sides</Text>
          </Pressable>
        </View>
      )}

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
  previewBlock: { gap: 10 },
  previewContainer: { width: '100%', borderRadius: 20, overflow: 'hidden', position: 'relative', backgroundColor: SURFACE, borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)', shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.2, shadowRadius: 22, elevation: 3 },
  preview: { width: '100%', height: '100%', resizeMode: 'contain' },
  changeImageBtn: { position: 'absolute', bottom: 12, right: 12, backgroundColor: 'rgba(0,0,0,0.68)', paddingHorizontal: 13, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  changeImageText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  previewHelp: { color: TEXT_SECONDARY, fontSize: 13, lineHeight: 19, fontWeight: '500' },
  emptyState: { position: 'relative', overflow: 'hidden', minHeight: 250, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', backgroundColor: SURFACE, paddingHorizontal: 22, paddingVertical: 24, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.22, shadowRadius: 22, elevation: 4, gap: 14 },
  emptyIcon: { width: 58, height: 58, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: ACCENT_BORDER, backgroundColor: 'rgba(255,79,123,0.09)' },
  emptyTitle: { color: TEXT_PRIMARY, fontSize: 22, lineHeight: 28, fontWeight: '800', textAlign: 'center' },
  emptyBody: { color: TEXT_SECONDARY, fontSize: 14, lineHeight: 21, fontWeight: '500', textAlign: 'center', maxWidth: 360 },
  emptyFoot: { color: TEXT_TERTIARY, fontSize: 12, lineHeight: 18, fontWeight: '600', textAlign: 'center' },
  uploadBtn: { minHeight: 46, paddingHorizontal: 18, paddingVertical: 12, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(255,79,123,0.28)', backgroundColor: 'rgba(255,79,123,0.08)', justifyContent: 'center' },
  uploadText: { color: ACCENT, fontSize: 13, fontWeight: '800' },
  input: { marginTop: 8 },
  overlay: { maxWidth: 320, gap: 8 },
  overlayRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  overlayLabel: { color: TEXT_TERTIARY, fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  overlayTitle: { color: TEXT_PRIMARY, fontSize: 18, lineHeight: 24, fontWeight: '800' },
  overlayBody: { color: TEXT_SECONDARY, fontSize: 13, lineHeight: 19, fontWeight: '500' },
  loading: { alignItems: 'center', gap: 10, padding: 18, borderRadius: 18, borderWidth: 1, borderColor: BORDER, backgroundColor: ACCENT_DIM },
  help: { color: TEXT_SECONDARY, fontSize: 13, fontWeight: '600' },
  loadingText: { color: TEXT_SECONDARY, fontSize: 14, fontWeight: '600' },
  label: { color: TEXT_SECONDARY, fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 24, marginBottom: 12 },
  chips: { gap: 9, paddingRight: 6 },
  swapContainer: { alignItems: 'flex-end', marginTop: 12 },
  swapBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  swapText: { color: TEXT_SECONDARY, fontSize: 13, fontWeight: '700' },
})
