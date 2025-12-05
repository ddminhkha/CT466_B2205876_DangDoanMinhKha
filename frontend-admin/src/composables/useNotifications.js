import { ref, reactive } from 'vue'

// Global notification state
const notifications = ref([])
let nextId = 1

export function useNotifications() {
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

    // Helper methods for different notification types
    const showSuccess = (message, duration = 4000) => addNotification(message, 'success', duration)
    const showError = (message, duration = 6000) => addNotification(message, 'error', duration)
    const showWarning = (message, duration = 5000) => addNotification(message, 'warning', duration)
    const showInfo = (message, duration = 4000) => addNotification(message, 'info', duration)

    return {
        notifications,
        addNotification,
        showNotification: addNotification, // Alias for compatibility
        removeNotification,
        clearAll,
        showSuccess,
        showError,
        showWarning,
        showInfo
    }
}