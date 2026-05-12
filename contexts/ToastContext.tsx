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
        case 'success': return ACCENT
        case 'error':   return ERROR
        case 'warning': return WARNING
        default:        return ACCENT
    }
}

function ToastIcon({ type, color }: { type: ToastType; color: string }) {
    switch (type) {
        case 'success':
            return <Check size={14} color={color} strokeWidth={3.5} />
        case 'error':
            return <XCircle size={14} color={color} strokeWidth={2.5} />
        case 'warning':
            return <AlertTriangle size={14} color={color} strokeWidth={2.5} />
        default:
            return <Info size={14} color={color} strokeWidth={2.5} />
    }
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
    const opacity = useRef(new Animated.Value(0)).current
    const translateY = useRef(new Animated.Value(20)).current
    const scale = useRef(new Animated.Value(0.95)).current

    React.useEffect(() => {
        Animated.parallel([
            Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
            Animated.spring(translateY, { toValue: 0, tension: 80, friction: 10, useNativeDriver: true }),
            Animated.spring(scale, { toValue: 1, tension: 80, friction: 10, useNativeDriver: true }),
        ]).start()

        const t = setTimeout(() => {
            Animated.parallel([
                Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
                Animated.timing(translateY, { toValue: 10, duration: 200, useNativeDriver: true }),
                Animated.timing(scale, { toValue: 0.95, duration: 200, useNativeDriver: true }),
            ]).start(onDismiss)
        }, 2800)

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
                    borderColor: isSuccess ? `${ACCENT}60` : `${color}40`,
                    shadowColor: color,
                    transform: [{ translateY }, { scale }],
                },
            ]}
        >
            <View style={[s.iconWrap, { 
                borderColor: isSuccess ? `${ACCENT}80` : `${color}50`, 
                backgroundColor: `${color}15` 
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
            style={[s.container, { bottom: TAB_HEIGHT + insets.bottom + 20 }]}
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
        gap: 10,
        zIndex: 999,
    },
    toast: {
        width: '100%',
        maxWidth: 480,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: 'rgba(16,12,18,0.94)',
        borderWidth: 1.5,
        borderRadius: 22,
        paddingHorizontal: 16,
        paddingVertical: 14,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
        elevation: 10,
    },
    iconWrap: {
        width: 26,
        height: 26,
        borderRadius: 13,
        borderWidth: 1.5,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    message: {
        flex: 1,
        fontSize: 14,
        color: TEXT_PRIMARY,
        fontWeight: '600',
        letterSpacing: -0.2,
    },
})
