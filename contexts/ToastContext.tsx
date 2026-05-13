import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { AccessibilityInfo, Animated, Platform, StyleSheet, useWindowDimensions, View } from 'react-native'
import * as Haptics from 'expo-haptics'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react-native'
import { Text } from '@/components/ui/Text'
import { ACCENT, BORDER, ERROR, SUCCESS, SURFACE_RAISED, TEXT_PRIMARY, TEXT_SECONDARY, WARNING } from '@/lib/theme'

export type ToastType = 'success' | 'error' | 'info' | 'warning'
type ToastPresentation = 'compact' | 'banner'
type ToastHaptic = 'none' | 'success' | 'warning' | 'error'

interface ToastCopy {
    title: string
    body?: string
    accessibilityLabel?: string
    duration?: number
    haptic?: ToastHaptic
    presentation?: ToastPresentation
}

interface Toast {
    id: number
    type: ToastType
    dedupeKey: string
    title: string
    body: string
    accessibilityLabel: string
    duration: number
    haptic: ToastHaptic
    presentation: ToastPresentation
}

interface ToastContextValue {
    showToast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextValue>({ showToast: () => {} })

export function useToast() {
    return useContext(ToastContext)
}

let _nextId = 0
const TOAST_LIMIT = 1
const COMPACT_TOAST_LIFETIME_MS = 1800
const BANNER_TOAST_LIFETIME_MS = 3200
const TOAST_EXIT_DURATION_MS = 220

const TOAST_COPY: Record<string, { title: string; body: string }> = {
    'Replies generated': {
        title: 'Replies ready',
        body: 'Your reply suggestions are ready to review.',
    },
    'Failed to generate replies': {
        title: 'Unable to generate replies',
        body: 'Please try again in a moment.',
    },
    'Openers generated': {
        title: 'Openers ready',
        body: 'Your opener suggestions are ready to review.',
    },
    'Failed to generate openers': {
        title: 'Unable to generate openers',
        body: 'Please try again in a moment.',
    },
    'Bios generated': {
        title: 'Bios ready',
        body: 'Your bio suggestions are ready to review.',
    },
    'Failed to generate bios': {
        title: 'Unable to generate bios',
        body: 'Please try again in a moment.',
    },
    'Photo permission is needed': {
        title: 'Photo access required',
        body: 'Allow photo library access to upload a screenshot.',
    },
    'Screenshot uploaded': {
        title: 'Screenshot uploaded',
        body: 'Your screenshot was added successfully.',
    },
    'Chat extracted successfully': {
        title: 'Chat extracted',
        body: 'The conversation text is ready to use.',
    },
    'Could not read screenshot': {
        title: 'Unable to read screenshot',
        body: 'Try another image with clearer text.',
    },
    'Copied to clipboard': {
        title: 'Copied to clipboard',
        body: 'The selected text is ready to paste.',
    },
    'Clipboard unavailable': {
        title: 'Clipboard unavailable',
        body: 'This device could not access the clipboard.',
    },
    'Saved to favorites': {
        title: 'Saved to favorites',
        body: 'This item was added to your favorites.',
    },
    'Removed from favorites': {
        title: 'Removed from favorites',
        body: 'This item was removed from your favorites.',
    },
    'Selected items deleted': {
        title: 'Items deleted',
        body: 'The selected history items were removed.',
    },
    'History cleared': {
        title: 'History cleared',
        body: 'All saved history items were removed.',
    },
    'Deleted from history': {
        title: 'Removed from history',
        body: 'This item was deleted successfully.',
    },
    'Persona updated': {
        title: 'Persona updated',
        body: 'Your assistant persona has been applied.',
    },
    'Settings saved': {
        title: 'Settings saved',
        body: 'Your preferences have been updated.',
    },
}

function sentence(text: string) {
    return /[.!?]$/.test(text) ? text : `${text}.`
}

function titleCase(value: string) {
    return value
        .trim()
        .split(/[\s_-]+/)
        .filter(Boolean)
        .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
        .join(' ')
}

function defaultPresentation(type: ToastType) {
    return type === 'error' || type === 'warning' ? 'banner' : 'compact'
}

function defaultDuration(presentation: ToastPresentation) {
    return presentation === 'compact' ? COMPACT_TOAST_LIFETIME_MS : BANNER_TOAST_LIFETIME_MS
}

function defaultHaptic(type: ToastType, presentation: ToastPresentation): ToastHaptic {
    if (type === 'error') return 'error'
    if (type === 'warning') return 'warning'
    return presentation === 'banner' ? 'success' : 'none'
}

function resolveToastCopy(message: string, type: ToastType): ToastCopy {
    const mapped = TOAST_COPY[message]
    if (mapped) {
        const presentation = defaultPresentation(type)
        return { ...mapped, presentation }
    }

    const toneMatch = message.match(/^Tone switched to (.+)$/i)
    if (toneMatch) {
        const toneName = titleCase(toneMatch[1])
        return {
            title: `Tone set to ${toneName}`,
            body: `Responses will now use the ${toneName} tone.`,
            duration: 1400,
            haptic: 'none',
            presentation: 'compact',
        }
    }

    return {
        title: sentence(message),
        presentation: defaultPresentation(type),
    }
}

function createToast(id: number, message: string, type: ToastType): Toast {
    const copy = resolveToastCopy(message, type)
    const presentation = copy.presentation ?? defaultPresentation(type)
    const body = copy.body ?? ''
    const title = copy.title
    const accessibilityLabel = copy.accessibilityLabel ?? (body ? `${title}. ${body}` : title)

    return {
        id,
        type,
        dedupeKey: `${type}:${message}`,
        title,
        body,
        accessibilityLabel,
        duration: copy.duration ?? defaultDuration(presentation),
        haptic: copy.haptic ?? defaultHaptic(type, presentation),
        presentation,
    }
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([])
    const timersRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map())
    const toastsRef = useRef<Toast[]>([])

    useEffect(() => {
        toastsRef.current = toasts
    }, [toasts])

    useEffect(() => {
        return () => {
            timersRef.current.forEach((timer) => clearTimeout(timer))
            timersRef.current.clear()
        }
    }, [])

    const clearToastTimer = useCallback((id: number) => {
        const timer = timersRef.current.get(id)
        if (!timer) return
        clearTimeout(timer)
        timersRef.current.delete(id)
    }, [])

    const dismissToast = useCallback((id: number) => {
        clearToastTimer(id)
        setToasts((prev) => {
            const next = prev.filter((toast) => toast.id !== id)
            toastsRef.current = next
            return next
        })
    }, [clearToastTimer])

    const showToast = useCallback((message: string, type: ToastType = 'info') => {
        const toast = createToast(++_nextId, message, type)
        const current = toastsRef.current
        const nextToasts = [...current.filter((item) => item.dedupeKey !== toast.dedupeKey), toast].slice(-TOAST_LIMIT)
        const nextIds = new Set(nextToasts.map((item) => item.id))

        current
            .filter((item) => !nextIds.has(item.id))
            .forEach((item) => clearToastTimer(item.id))

        toastsRef.current = nextToasts
        setToasts(nextToasts)
        AccessibilityInfo.announceForAccessibility(toast.accessibilityLabel)

        if (Platform.OS !== 'web') {
            const feedbackType =
                toast.haptic === 'error'
                    ? Haptics.NotificationFeedbackType.Error
                    : toast.haptic === 'warning'
                        ? Haptics.NotificationFeedbackType.Warning
                        : Haptics.NotificationFeedbackType.Success

            if (toast.haptic !== 'none') {
                void Haptics.notificationAsync(feedbackType).catch(() => {})
            }
        }

        const timeout = setTimeout(() => dismissToast(toast.id), toast.duration)
        timersRef.current.set(toast.id, timeout)
    }, [clearToastTimer, dismissToast])

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <ToastList toasts={toasts} onDismiss={dismissToast} />
        </ToastContext.Provider>
    )
}

function toastColor(type: ToastType) {
    switch (type) {
        case 'success': return SUCCESS
        case 'error': return ERROR
        case 'warning': return WARNING
        default: return ACCENT
    }
}

function ToastIcon({ type, color }: { type: ToastType; color: string }) {
    switch (type) {
        case 'success':
            return <CheckCircle2 size={18} color={color} strokeWidth={2.6} />
        case 'error':
            return <XCircle size={18} color={color} strokeWidth={2.4} />
        case 'warning':
            return <AlertTriangle size={18} color={color} strokeWidth={2.4} />
        default:
            return <Info size={18} color={color} strokeWidth={2.4} />
    }
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
    const opacity = useRef(new Animated.Value(0)).current
    const translateY = useRef(new Animated.Value(-12)).current
    const scale = useRef(new Animated.Value(0.98)).current
    const exitDelay = Math.max(toast.duration - TOAST_EXIT_DURATION_MS - 80, 900)
    const isCompact = toast.presentation === 'compact'

    React.useEffect(() => {
        Animated.parallel([
            Animated.timing(opacity, { toValue: 1, duration: 160, useNativeDriver: true }),
            Animated.spring(translateY, { toValue: 0, tension: 120, friction: 14, useNativeDriver: true }),
            Animated.spring(scale, { toValue: 1, tension: 120, friction: 14, useNativeDriver: true }),
        ]).start()

        const t = setTimeout(() => {
            Animated.parallel([
                Animated.timing(opacity, { toValue: 0, duration: TOAST_EXIT_DURATION_MS, useNativeDriver: true }),
                Animated.timing(translateY, { toValue: -8, duration: TOAST_EXIT_DURATION_MS, useNativeDriver: true }),
                Animated.timing(scale, { toValue: 0.98, duration: TOAST_EXIT_DURATION_MS, useNativeDriver: true }),
            ]).start(({ finished }) => {
                if (finished) onDismiss()
            })
        }, exitDelay)

        return () => clearTimeout(t)
    }, [exitDelay, onDismiss, opacity, scale, translateY])

    const color = toastColor(toast.type)

    return (
        <Animated.View
            style={[
                s.toastShell,
                {
                    opacity,
                    transform: [{ translateY }, { scale }],
                },
            ]}
        >
            <View
                accessible
                accessibilityRole="alert"
                accessibilityLabel={toast.accessibilityLabel}
                style={[
                    s.toast,
                    isCompact ? s.toastCompact : s.toastBanner,
                    {
                        borderColor: `${color}33`,
                    },
                ]}
            >
                <View style={[s.accentBar, { backgroundColor: color }]} />
                <View style={s.topHighlight} />
                <View style={s.content}>
                    <View
                        style={[
                            s.iconWrap,
                            isCompact ? s.iconWrapCompact : s.iconWrapBanner,
                            {
                                borderColor: `${color}30`,
                                backgroundColor: `${color}14`,
                            },
                        ]}
                    >
                        <ToastIcon type={toast.type} color={color} />
                    </View>
                    <View style={s.copy}>
                        <Text style={[s.title, isCompact ? s.titleCompact : s.titleBanner]} numberOfLines={1}>
                            {toast.title}
                        </Text>
                        {!isCompact && !!toast.body && (
                            <Text style={s.body} numberOfLines={2}>{toast.body}</Text>
                        )}
                    </View>
                </View>
            </View>
        </Animated.View>
    )
}

function ToastList({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: number) => void }) {
    const insets = useSafeAreaInsets()
    const { width } = useWindowDimensions()
    const isLargeViewport = width >= 768

    if (toasts.length === 0) return null

    return (
        <View
            style={[
                s.container,
                isLargeViewport
                    ? { top: insets.top + 18, left: 24, right: 24, alignItems: 'flex-end' }
                    : { top: insets.top + 10, left: 12, right: 12, alignItems: 'center' },
            ]}
            pointerEvents="none"
        >
            {toasts.map((t) => (
                <ToastItem key={t.id} toast={t} onDismiss={() => onDismiss(t.id)} />
            ))}
        </View>
    )
}

const s = StyleSheet.create({
    container: {
        position: 'absolute',
        gap: 8,
        zIndex: 999,
    },
    toastShell: {
        width: '100%',
        maxWidth: 380,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.16,
        shadowRadius: 18,
        elevation: 10,
    },
    toast: {
        position: 'relative',
        overflow: 'hidden',
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: SURFACE_RAISED,
        borderWidth: 1,
        borderRadius: 16,
    },
    toastCompact: {
        minHeight: 52,
    },
    toastBanner: {
        minHeight: 74,
    },
    accentBar: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: 4,
    },
    topHighlight: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 1,
        backgroundColor: BORDER,
    },
    content: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingLeft: 14,
        paddingRight: 14,
        paddingVertical: 12,
    },
    iconWrap: {
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    iconWrapCompact: {
        width: 28,
        height: 28,
        borderRadius: 10,
    },
    iconWrapBanner: {
        width: 36,
        height: 36,
        borderRadius: 12,
        marginTop: 1,
    },
    copy: {
        flex: 1,
        gap: 3,
    },
    title: {
        color: TEXT_PRIMARY,
        fontSize: 14,
        fontWeight: '700',
    },
    titleCompact: {
        fontSize: 14,
        fontWeight: '600',
    },
    titleBanner: {
        fontSize: 14,
        fontWeight: '700',
    },
    body: {
        flex: 1,
        color: TEXT_SECONDARY,
        fontSize: 13,
        lineHeight: 18,
        fontWeight: '500',
    },
})
