<template>
    <div class="toast-container position-fixed top-0 end-0 p-3" style="z-index: 9999">
        <div v-for="notification in notifications" :key="notification.id" class="toast show"
            :class="getToastClass(notification.type)" role="alert">
            <div class="toast-header">
                <i :class="getIconClass(notification.type)" class="me-2"></i>
                <strong class="me-auto">{{ getTitle(notification.type) }}</strong>
                <small class="text-muted">{{ getTimeAgo(notification.timestamp) }}</small>
                <button type="button" class="btn-close" @click="removeNotification(notification.id)"></button>
            </div>
            <div class="toast-body">
                {{ notification.message }}
            </div>
        </div>
    </div>
</template>

<script>
import { useNotifications } from '../composables/useNotifications'

export default {
    name: 'NotificationToast',
    setup() {
        const { notifications, removeNotification } = useNotifications()

        const getToastClass = (type) => {
            const classes = {
                success: 'text-bg-success',
                error: 'text-bg-danger',
                warning: 'text-bg-warning',
                info: 'text-bg-info'
            }
            return classes[type] || classes.info
        }

        const getIconClass = (type) => {
            const icons = {
                success: 'bi bi-check-circle-fill',
                error: 'bi bi-exclamation-triangle-fill',
                warning: 'bi bi-exclamation-circle-fill',
                info: 'bi bi-info-circle-fill'
            }
            return icons[type] || icons.info
        }

        const getTitle = (type) => {
            const titles = {
                success: 'Thành công',
                error: 'Lỗi',
                warning: 'Cảnh báo',
                info: 'Thông báo'
            }
            return titles[type] || titles.info
        }

        const getTimeAgo = (timestamp) => {
            const seconds = Math.floor((Date.now() - timestamp) / 1000)
            if (seconds < 60) return 'Vừa xong'
            const minutes = Math.floor(seconds / 60)
            if (minutes < 60) return `${minutes} phút trước`
            return 'Trước đó'
        }

        return {
            notifications,
            removeNotification,
            getToastClass,
            getIconClass,
            getTitle,
            getTimeAgo
        }
    }
}
</script>

<style scoped>
.toast {
    min-width: 300px;
    margin-bottom: 0.5rem;
}

.toast-container {
    max-height: 100vh;
    overflow-y: auto;
}
</style>