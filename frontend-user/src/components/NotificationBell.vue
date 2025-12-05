<template>
    <div class="notification-bell position-relative">
        <!-- Debug info (remove in production) -->
        <div v-if="false" class="small text-muted mb-2">
            Debug: dropdown={{ showDropdown }}, count={{ unreadCount }}
        </div>

        <!-- Notification Bell Icon -->
        <button class="btn btn-link p-2 position-relative notification-btn" @click.stop="toggleNotifications"
            :class="{ 'text-warning': hasUnreadNotifications }" type="button" style="z-index: 1000;" title="Thông báo">
            <i class="bi bi-bell fs-5"></i>
            <!-- Unread count badge -->
            <span v-if="unreadCount > 0"
                class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
                style="font-size: 0.65rem; z-index: 1001;">
                {{ unreadCount > 99 ? '99+' : unreadCount }}
            </span>
            <!-- Always visible dot when no notifications to ensure visibility -->
            <span v-else class="position-absolute top-0 start-100 translate-middle"
                style="width: 6px; height: 6px; background-color: rgba(255,255,255,0.4); border-radius: 50%;"></span>
        </button>

        <!-- Notifications Dropdown -->
        <div v-show="showDropdown" class="notification-dropdown position-absolute" ref="dropdown" @click.stop>
            <div class="card shadow-lg" style="width: 350px; max-height: 400px;">
                <!-- Header -->
                <div class="card-header d-flex justify-content-between align-items-center py-2">
                    <h6 class="mb-0"><i class="bi bi-bell"></i> Thông báo</h6>
                    <div>
                        <button v-if="hasUnreadNotifications" @click="markAllAsRead"
                            class="btn btn-sm btn-outline-primary me-2"
                            style="color: #007bff !important; border-color: #007bff !important;">
                            Đánh dấu đã đọc
                        </button>
                        <button @click="showDropdown = false" class="btn btn-sm btn-outline-secondary"
                            style="color: #6c757d !important; border-color: #6c757d !important;">
                            <i class="bi bi-x" style="color: #6c757d !important;"></i>
                        </button>
                    </div>
                </div>

                <!-- Notifications List -->
                <div class="card-body p-0" style="max-height: 300px; overflow-y: auto;">
                    <div v-if="notifications.length === 0" class="text-center py-4 text-muted">
                        <i class="bi bi-inbox h3"></i>
                        <p class="mb-0">Không có thông báo nào</p>
                    </div>

                    <div v-for="notification in notifications" :key="notification.id"
                        class="notification-item border-bottom p-3"
                        :class="{ 'bg-light': !notification.isRead, 'notification-unread': !notification.isRead }"
                        @click="markAsRead(notification.id)">
                        <!-- Notification Icon -->
                        <div class="d-flex align-items-start">
                            <div class="notification-icon me-3">
                                <i :class="getNotificationIcon(notification.type)"
                                    :style="{ color: getNotificationColor(notification.type) }" class="fs-5"></i>
                            </div>

                            <!-- Notification Content -->
                            <div class="flex-grow-1">
                                <div class="d-flex justify-content-between align-items-start">
                                    <h6 class="mb-1" :class="{ 'fw-bold': !notification.isRead }">
                                        {{ notification.title }}
                                    </h6>
                                    <div class="d-flex align-items-center">
                                        <small class="text-muted me-2">{{ formatTimeAgo(notification.createdAt)
                                        }}</small>
                                        <button @click.stop="deleteNotification(notification.id)"
                                            class="btn btn-sm btn-outline-danger p-1"
                                            style="width: 24px; height: 24px; font-size: 0.7rem; color: #dc3545 !important; border-color: #dc3545 !important;"
                                            title="Xóa thông báo">
                                            <i class="bi bi-trash" style="color: #dc3545 !important;"></i>
                                        </button>
                                    </div>
                                </div>
                                <p class="mb-1 small text-muted">{{ notification.message }}</p>

                                <!-- Additional details for loan notifications -->
                                <div v-if="notification.data" class="mt-2">
                                    <div v-if="notification.data.bookTitle" class="small">
                                        <i class="bi bi-book"></i> {{ notification.data.bookTitle }}
                                    </div>
                                    <div v-if="notification.data.dueDate" class="small text-warning">
                                        <i class="bi bi-calendar-event"></i> Hạn trả: {{
                                            formatDate(notification.data.dueDate) }}
                                    </div>
                                </div>

                                <!-- Unread indicator -->
                                <div v-if="!notification.isRead" class="mt-2">
                                    <span class="badge bg-primary rounded-pill small">Mới</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Footer -->
                <div class="card-footer text-center py-2">
                    <button @click="clearAllNotifications" class="btn btn-sm btn-outline-danger"
                        style="color: #dc3545 !important; border-color: #dc3545 !important;">
                        <i class="bi bi-trash" style="color: #dc3545 !important;"></i> Clear All
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import api from '../services/api.js'

// State
const notifications = ref([])
const showDropdown = ref(false)
const dropdown = ref(null)

// Computed
const unreadCount = computed(() =>
    notifications.value.filter(n => !n.isRead).length
)

const hasUnreadNotifications = computed(() => unreadCount.value > 0)

// Methods
const toggleNotifications = () => {
    console.log('🔔 Toggle notifications clicked')
    showDropdown.value = !showDropdown.value
    console.log('Dropdown state:', showDropdown.value)
    if (showDropdown.value) {
        loadNotifications()
    }
}

const loadNotifications = async () => {
    try {
        console.log('🔔 Loading notifications...')
        const response = await api.get('/notifications/user')
        console.log('📨 Notifications response:', response.data)
        notifications.value = response.data.notifications || []
    } catch (error) {
        console.error('❌ Error loading notifications:', error)
        console.error('Error details:', error.response?.data)
        // Don't show dummy data - only show real notifications from database
        notifications.value = []
    }
}

const markAsRead = async (notificationId) => {
    try {
        console.log('📖 Marking notification as read:', notificationId)
        await api.patch(`/notifications/${notificationId}/read`)

        // Update local state
        const notification = notifications.value.find(n => n.id === notificationId)
        if (notification) {
            notification.isRead = true
            console.log('✅ Notification marked as read')
        }
    } catch (error) {
        console.error('❌ Error marking notification as read:', error)
    }
}

const markAllAsRead = async () => {
    try {
        await api.patch('/notifications/mark-all-read')

        // Update local state
        notifications.value.forEach(n => n.isRead = true)
    } catch (error) {
        console.error('Error marking all notifications as read:', error)
    }
}

const deleteNotification = async (notificationId) => {
    try {
        console.log('🗑️ Deleting notification:', notificationId)

        // Call backend API to delete notification
        await api.delete(`/notifications/${notificationId}`)

        // Remove from local state
        const index = notifications.value.findIndex(n => n.id === notificationId)
        if (index !== -1) {
            notifications.value.splice(index, 1)
            console.log('✅ Notification deleted successfully')
        }
    } catch (error) {
        console.error('❌ Error deleting notification:', error)
        // If API call fails, still remove from local state for better UX
        const index = notifications.value.findIndex(n => n.id === notificationId)
        if (index !== -1) {
            notifications.value.splice(index, 1)
        }
    }
}

const clearAllNotifications = async () => {
    try {
        console.log('🗑️ Clearing all notifications')

        // Call backend API to clear all notifications
        await api.delete('/notifications/clear-all')

        // Clear local state
        notifications.value = []
        console.log('✅ All notifications cleared successfully')
    } catch (error) {
        console.error('❌ Error clearing all notifications:', error)
        // If API call fails, still clear local state for better UX
        notifications.value = []
    }
}

const loadMoreNotifications = async () => {
    // Implementation for pagination if needed
    await loadNotifications()
}

const getNotificationIcon = (type) => {
    const icons = {
        'loan_created': 'bi bi-plus-circle',
        'loan_due_soon': 'bi bi-clock',
        'loan_overdue': 'bi bi-exclamation-triangle',
        'loan_returned': 'bi bi-check-circle',
        'loan_renewed': 'bi bi-arrow-repeat',
        'system': 'bi bi-info-circle',
        'default': 'bi bi-bell'
    }
    return icons[type] || icons.default
}

const getNotificationColor = (type) => {
    const colors = {
        'loan_created': '#28a745',
        'loan_due_soon': '#ffc107',
        'loan_overdue': '#dc3545',
        'loan_returned': '#28a745',
        'loan_renewed': '#17a2b8',
        'system': '#6c757d',
        'default': '#007bff'
    }
    return colors[type] || colors.default
}

const formatTimeAgo = (dateString) => {
    const now = new Date()
    const date = new Date(dateString)
    const diffInMinutes = Math.floor((now - date) / (1000 * 60))

    if (diffInMinutes < 1) return 'Vừa xong'
    if (diffInMinutes < 60) return `${diffInMinutes} phút trước`

    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours} giờ trước`

    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays} ngày trước`

    return date.toLocaleDateString('vi-VN')
}

const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN')
}

// Check user status every 30 seconds to detect if banned
const checkUserStatus = async () => {
    try {
        const response = await api.get('/users/me')
        if (response.data.status === 'banned') {
            // User is banned, force logout
            localStorage.removeItem('token')
            localStorage.removeItem('user')
            window.location.href = '/login'
        }
    } catch (error) {
        // If error is 403 banned, handle it
        if (error.response?.status === 403 && error.response?.data?.message?.includes('khoá')) {
            localStorage.removeItem('token')
            localStorage.removeItem('user')
            window.location.href = '/login'
        }
    }
}

// Click outside to close dropdown
const handleClickOutside = (event) => {
    console.log('🖱️ Click outside detected')
    if (dropdown.value && !dropdown.value.contains(event.target)) {
        console.log('🔔 Closing dropdown')
        showDropdown.value = false
    } else {
        console.log('🔔 Click was inside dropdown or target not found')
    }
}

// Lifecycle
onMounted(() => {
    loadNotifications()
    checkUserStatus() // Initial check
    document.addEventListener('click', handleClickOutside)

    // Poll for new notifications every 30 seconds
    const pollInterval = setInterval(() => {
        loadNotifications()
        checkUserStatus() // Check user status every 30 seconds
    }, 30000)

    onUnmounted(() => {
        document.removeEventListener('click', handleClickOutside)
        clearInterval(pollInterval)
    })
})
</script>

<style scoped>
.notification-bell {
    position: relative;
}

.notification-bell .btn {
    border: none;
    background: none;
    color: #ffffff !important;
    /* Always white for visibility on dark navbar */
    transition: all 0.2s ease;
    opacity: 0.9;
    cursor: pointer;
    z-index: 1000;
    position: relative;
    min-width: 40px;
    min-height: 40px;
}

.notification-bell .btn:hover {
    color: #ffc107 !important;
    opacity: 1;
    transform: scale(1.05);
    background-color: rgba(255, 255, 255, 0.1) !important;
}

.notification-bell .btn:focus {
    box-shadow: 0 0 0 0.2rem rgba(255, 193, 7, 0.25) !important;
    outline: none !important;
}

.notification-bell .btn:active {
    transform: scale(0.98);
}

.notification-bell .btn.text-warning {
    color: #ffc107 !important;
    animation: gentle-pulse 2s ease-in-out infinite;
    opacity: 1;
}

@keyframes gentle-pulse {

    0%,
    100% {
        transform: scale(1);
    }

    50% {
        transform: scale(1.05);
    }
}

.notification-dropdown {
    top: 100%;
    right: 0;
    z-index: 1050;
    margin-top: 0.5rem;
    animation: slideDown 0.2s ease-out;
    min-width: 320px;
}

.notification-dropdown .card {
    border: 1px solid #dee2e6;
    box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15) !important;
}

@keyframes slideDown {
    from {
        opacity: 0;
        transform: translateY(-10px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.notification-item {
    cursor: pointer;
    transition: all 0.2s ease;
    border-left: 3px solid transparent;
}

.notification-item:hover {
    background-color: #f8f9fa !important;
    border-left-color: #007bff;
}

.notification-unread {
    background-color: #f0f8ff;
    border-left-color: #007bff;
}

.notification-unread:hover {
    background-color: #e6f3ff !important;
}

.notification-icon {
    flex-shrink: 0;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background-color: rgba(0, 123, 255, 0.1);
}

.card-footer {
    background-color: #f8f9fa;
    border-top: 1px solid #dee2e6;
}

.badge {
    font-size: 0.65rem;
    animation: fadeIn 0.3s ease-in;
}

@keyframes fadeIn {
    from {
        opacity: 0;
    }

    to {
        opacity: 1;
    }
}

@media (max-width: 768px) {
    .notification-dropdown .card {
        width: 300px !important;
        max-height: 350px;
    }

    .notification-dropdown {
        right: -50px;
    }
}

/* Custom scrollbar for notifications list */
.card-body::-webkit-scrollbar {
    width: 6px;
}

.card-body::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 3px;
}

.card-body::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 3px;
}

.card-body::-webkit-scrollbar-thumb:hover {
    background: #a1a1a1;
}

/* Button styling overrides for better visibility */
.btn-outline-primary {
    color: #007bff !important;
    border-color: #007bff !important;
}

.btn-outline-primary:hover {
    background-color: #007bff !important;
    color: #ffffff !important;
    border-color: #007bff !important;
}

.btn-outline-secondary {
    color: #6c757d !important;
    border-color: #6c757d !important;
}

.btn-outline-secondary:hover {
    background-color: #6c757d !important;
    color: #ffffff !important;
    border-color: #6c757d !important;
}

.btn-outline-danger {
    color: #dc3545 !important;
    border-color: #dc3545 !important;
}

.btn-outline-danger:hover {
    background-color: #dc3545 !important;
    color: #ffffff !important;
    border-color: #dc3545 !important;
}

/* Icon visibility */
.bi-trash,
.bi-x {
    color: inherit !important;
}

.btn-outline-danger:hover .bi-trash {
    color: #ffffff !important;
}

.btn-outline-secondary:hover .bi-x {
    color: #ffffff !important;
}
</style>