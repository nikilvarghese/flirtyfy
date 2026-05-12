import React, { createContext, useContext, useRef, useState, useCallback } from 'react'
import { AccessibilityInfo, Animated, Platform, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { AlertTriangle, Check, Info, XCircle } from 'lucide-react-native'
import { Text } from '@/components/ui/Text'
import { ACCENT, ACCENT_BORDER, ERROR, SUCCESS, TAB_HEIGHT, TEXT_PRIMARY, WARNING } from '@/lib/theme'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

interface Toast {
    id: number
    message: string
    type: ToastType
}

interface ToastContextValue {
    showToast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextValue>({ showToast: () => {} })

export function useToast() {
    return useContext(ToastContext)
}

let _nextId = 0

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([])

    const showToast = useCallback((message: string, type: ToastType = 'info') => {
        const id = ++_nextId
        setToasts((prev) => {
            const withoutDuplicate = prev.filter((toast) => toast.message !== message)
            return [...withoutDuplicate, { id, message, type }].slice(-2)
        })
        AccessibilityInfo.announceForAccessibility(message)
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id))
        }, 3200)
    }, [])

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <ToastList toasts={toasts} onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))} />
        </ToastContext.Provider>
    )
}

function toastColor(type: ToastType) {
    switch (type) {
        case 'success': return SUCCESS
        case 'error':   return ERROR
        case 'warning': return WARNING
        default:        return ACCENT
    }
}

function ToastIcon({ type, color }: { type: ToastType; color: string }) {
    switch (type) {
        case 'success':
            return <Check size={15} color={color} strokeWidth={3} />
        case 'error':
            return <XCircle size={15} color={color} strokeWidth={2.5} />
        case 'warning':
            return <AlertTriangle size={15} color={color} strokeWidth={2.5} />
        default:
            return <Info size={15} color={color} strokeWidth={2.5} />
    }
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
    const opacity = useRef(new Animated.Value(0)).current
    const translateY = useRef(new Animated.Value(18)).current
    const scale = useRef(new Animated.Value(0.98)).current

    React.useEffect(() => {
        Animated.parallel([
            Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
            Animated.timing(translateY, { toValue: 0, duration: 220, useNativeDriver: true }),
            Animated.timing(scale, { toValue: 1, duration: 220, useNativeDriver: true }),
        ]).start()

        const t = setTimeout(() => {
            Animated.parallel([
                Animated.timing(opacity, { toValue: 0, duration: 180, useNativeDriver: true }),
                Animated.timing(translateY, { toValue: 10, duration: 180, useNativeDriver: true }),
                Animated.timing(scale, { toValue: 0.98, duration: 180, useNativeDriver: true }),
            ]).start(onDismiss)
        }, 2800)

        return () => clearTimeout(t)
    }, [])

    const color = toastColor(toast.type)

    return (
        <Animated.View
            style={[
                s.toast,
                {
                    opacity,
                    borderColor: toast.type === 'info' ? ACCENT_BORDER : `${color}55`,
                    shadowColor: toast.type === 'error' ? ERROR : ACCENT,
                    transform: [{ translateY }, { scale }],
                },
            ]}
        >
            <View style={[s.iconWrap, { borderColor: `${color}55`, backgroundColor: `${color}18` }]}>
                <ToastIcon type={toast.type} color={color} />
            </View>
            <Text style={s.message} numberOfLines={2}>{toast.message}</Text>
        </Animated.View>
    )
}

function ToastList({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: number) => void }) {
    const insets = useSafeAreaInsets()

    if (toasts.length === 0) return null

    return (
        <View
            style={[s.container, { bottom: TAB_HEIGHT + insets.bottom + 12 }]}
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
        left: 16,
        right: 16,
        alignItems: 'center',
        gap: 8,
        zIndex: 999,
    },
    toast: {
        width: '100%',
        maxWidth: 520,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: Platform.OS === 'web' ? 'rgba(14,11,17,0.92)' : 'rgba(14,11,17,0.96)',
        borderWidth: 1,
        borderColor: ACCENT_BORDER,
        borderRadius: 18,
        paddingHorizontal: 13,
        paddingVertical: 12,
        shadowColor: ACCENT,
        shadowOffset: { width: 0, height: 14 },
        shadowOpacity: 0.22,
        shadowRadius: 28,
        elevation: 12,
    },
    iconWrap: {
        width: 28,
        height: 28,
        borderRadius: 10,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    message: {
        flex: 1,
        fontSize: 13,
        color: TEXT_PRIMARY,
        fontWeight: '700',
        lineHeight: 19,
    },
})
