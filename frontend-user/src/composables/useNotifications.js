import { ref, reactive } from 'vue'

// Global notification state
const notifications = ref([])
let nextId = 1

export function useNotifications() {
    // Load persisted notifications from localStorage on init
    const loadPersistedNotifications = () => {
        try {
            const saved = localStorage.getItem('pendingNotifications')
            if (saved) {
                const parsed = JSON.parse(saved)
                localStorage.removeItem('pendingNotifications') // Clear after loading
                parsed.forEach(notif => {
                    addNotification(notif.message, notif.type, notif.duration || 5000)
                })
            }
        } catch (e) {
            console.warn('Failed to load persisted notifications:', e)
        }
    }

    const addNotification = (message, type = 'info', duration = 5000) => {
        const id = nextId++
        const notification = {
            id,
            message,
            type, // success, error, warning, info
            timestamp: Date.now()
        }

        notifications.value.push(notification)

        // Auto remove after duration
        if (duration > 0) {
            setTimeout(() => {
                removeNotification(id)
            }, duration)
        }

        return id
    }

    const removeNotification = (id) => {
        const index = notifications.value.findIndex(n => n.id === id)
        if (index > -1) {
            notifications.value.splice(index, 1)
        }
    }

    const clearAll = () => {
        notifications.value.splice(0)
    }

    // Helper method to persist notification across navigation
    const showSuccessAfterNavigation = (message, duration = 4000) => {
        try {
            const pending = [{ message, type: 'success', duration }]
            localStorage.setItem('pendingNotifications', JSON.stringify(pending))
        } catch (e) {
            console.warn('Failed to persist notification:', e)
            // Fallback to immediate notification
            addNotification(message, 'success', duration)
        }
    }

    // Helper methods for different notification types
    const showSuccess = (message, duration = 4000) => addNotification(message, 'success', duration)
    const showError = (message, duration = 6000) => addNotification(message, 'error', duration)
    const showWarning = (message, duration = 5000) => addNotification(message, 'warning', duration)
    const showInfo = (message, duration = 4000) => addNotification(message, 'info', duration)

    // Load persisted notifications when composable is used
    if (typeof window !== 'undefined') {
        loadPersistedNotifications()
    }

    return {
        notifications,
        addNotification,
        removeNotification,
        clearAll,
        showSuccess,
        showError,
        showWarning,
        showInfo,
        showSuccessAfterNavigation
    }
}