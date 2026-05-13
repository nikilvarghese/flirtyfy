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
        setToasts([{ id, message, type }])
        AccessibilityInfo.announceForAccessibility(message)
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
        case 'success': return ACCENT
        case 'error':   return ERROR
        case 'warning': return WARNING
        default:        return ACCENT
    }
}

function ToastIcon({ type, color }: { type: ToastType; color: string }) {
    switch (type) {
        case 'success':
            return <Check size={12} color={color} strokeWidth={3.5} />
        case 'error':
            return <XCircle size={12} color={color} strokeWidth={2.5} />
        case 'warning':
            return <AlertTriangle size={12} color={color} strokeWidth={2.5} />
        default:
            return <Info size={12} color={color} strokeWidth={2.5} />
    }
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
    const opacity = useRef(new Animated.Value(0)).current
    const translateY = useRef(new Animated.Value(10)).current

    React.useEffect(() => {
        Animated.parallel([
            Animated.timing(opacity, { toValue: 1, duration: 150, useNativeDriver: true }),
            Animated.timing(translateY, { toValue: 0, duration: 150, useNativeDriver: true }),
        ]).start()

        const t = setTimeout(() => {
            Animated.parallel([
                Animated.timing(opacity, { toValue: 0, duration: 150, useNativeDriver: true }),
                Animated.timing(translateY, { toValue: -8, duration: 150, useNativeDriver: true }),
            ]).start(onDismiss)
        }, 1500)

        return () => clearTimeout(t)
    }, [])

    const color = toastColor(toast.type)
    const isSuccess = toast.type === 'success'

    return (
        <Animated.View
            style={[
                s.toast,
                {
                    opacity,
                    borderColor: isSuccess ? `${ACCENT}25` : `${color}20`,
                    shadowColor: color,
                    transform: [{ translateY }],
                },
            ]}
        >
            <View style={[s.iconWrap, { 
                borderColor: isSuccess ? `${ACCENT}30` : `${color}25`, 
                backgroundColor: `${color}10` 
            }]}>
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
            style={[s.container, { top: insets.top + 12 }]}
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
        left: 20,
        right: 20,
        alignItems: 'center',
        zIndex: 9999,
    },
    toast: {
        width: 'auto',
        minWidth: 160,
        maxWidth: 320,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: 'rgba(12, 9, 14, 0.88)',
        borderWidth: 0.8,
        borderRadius: 14,
        paddingHorizontal: 12,
        paddingVertical: 7,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        elevation: 6,
    },
    iconWrap: {
        width: 18,
        height: 18,
        borderRadius: 9,
        borderWidth: 0.8,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    message: {
        flex: 0,
        fontSize: 13,
        color: TEXT_PRIMARY,
        fontWeight: '600',
        letterSpacing: -0.1,
    },
})
