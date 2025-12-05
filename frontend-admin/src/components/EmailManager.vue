<template>
    <div class="container-fluid py-4">
        <div class="row">
            <div class="col-12">
                <div class="d-flex justify-content-between align-items-center mb-4">
                    <h2><i class="bi bi-envelope"></i> Quản lý Email</h2>
                </div>

                <!-- Email Statistics -->
                <div class="row mb-4">
                    <div class="col-md-4">
                        <div class="card text-center">
                            <div class="card-body">
                                <i class="bi bi-clock-history text-warning h1"></i>
                                <h5 class="card-title">Sách quá hạn</h5>
                                <p class="card-text display-6">{{ overdueCount }}</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="card text-center">
                            <div class="card-body">
                                <i class="bi bi-exclamation-triangle text-info h1"></i>
                                <h5 class="card-title">Sắp tới hạn</h5>
                                <p class="card-text display-6">{{ dueSoonCount }}</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="card text-center">
                            <div class="card-body">
                                <i class="bi bi-envelope-check text-success h1"></i>
                                <h5 class="card-title">Email đã gửi hôm nay</h5>
                                <p class="card-text display-6">{{ todayEmailCount }}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Email Actions -->
                <div class="row mb-4">
                    <div class="col-12">
                        <div class="card">
                            <div class="card-header">
                                <h5><i class="bi bi-send"></i> Gửi thông báo Email</h5>
                            </div>
                            <div class="card-body">
                                <div class="row">
                                    <div class="col-md-6">
                                        <button class="btn btn-warning w-100 mb-3" @click="sendOverdueNotifications"
                                            :disabled="loading.overdue">
                                            <i class="bi bi-clock-history"></i>
                                            {{ loading.overdue ? 'Đang gửi...' : 'Gửi thông báo quá hạn' }}
                                        </button>
                                        <p class="text-muted small">Gửi email thông báo cho tất cả sách đã quá hạn trả
                                        </p>
                                    </div>
                                    <div class="col-md-6">
                                        <button class="btn btn-info w-100 mb-3" @click="sendReminderNotifications"
                                            :disabled="loading.reminder">
                                            <i class="bi bi-bell"></i>
                                            {{ loading.reminder ? 'Đang gửi...' : 'Gửi nhắc nhở sắp tới hạn' }}
                                        </button>
                                        <p class="text-muted small">Gửi email nhắc nhở cho sách sắp tới hạn trả (3 ngày)
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Send Notification -->
                <div class="row mb-4">
                    <div class="col-12">
                        <div class="card">
                            <div class="card-header">
                                <h5><i class="bi bi-send-check"></i> Gửi thông báo</h5>
                            </div>
                            <div class="card-body">
                                <div class="mb-3">
                                    <label for="notificationRecipient" class="form-label">Chọn người nhận</label>
                                    <select class="form-select" id="notificationRecipient"
                                        v-model="notificationForm.recipient" required>
                                        <option value="">-- Chọn người dùng --</option>
                                        <option v-for="user in users" :key="user._id" :value="user.email">
                                            {{ user.hoLot }} {{ user.ten }} ({{ user.email }})
                                        </option>
                                    </select>
                                </div>
                                <div class="mb-3">
                                    <label for="notificationSubject" class="form-label">Tiêu đề</label>
                                    <input type="text" class="form-control" id="notificationSubject"
                                        v-model="notificationForm.subject" placeholder="Nhập tiêu đề email" required>
                                </div>
                                <div class="mb-3">
                                    <label for="notificationContent" class="form-label">Nội dung</label>
                                    <textarea class="form-control" id="notificationContent"
                                        v-model="notificationForm.content" placeholder="Nhập nội dung email" rows="6"
                                        required></textarea>
                                </div>
                                <button class="btn btn-primary" @click="sendNotification"
                                    :disabled="loading.notification || !notificationForm.recipient || !notificationForm.subject || !notificationForm.content">
                                    <i class="bi bi-envelope-check"></i>
                                    {{ loading.notification ? 'Đang gửi...' : 'Gửi thông báo' }}
                                </button>
                                <p class="text-muted small mt-2">Gửi email thông báo tùy chỉnh đến người dùng</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Notification Toast -->
        <NotificationToast />
    </div>
</template>

<script setup>
import { ref, onMounted, readonly } from 'vue'
import api from '../services/api.js'
import { useNotifications } from '../composables/useNotifications.js'
import NotificationToast from './NotificationToast.vue'

const { showNotification } = useNotifications()

// State
const overdueCount = ref(0)
const dueSoonCount = ref(0)
const todayEmailCount = ref(0)
const recentActivity = ref([])
const users = ref([])
const notificationForm = ref({
    recipient: '',
    subject: '',
    content: ''
})

const loading = ref({
    overdue: false,
    reminder: false,
    notification: false
})

// Methods
const loadUsers = async () => {
    try {
        const response = await api.get('/users')
        const allUsers = response.data.users || response.data || []
        // Lọc bỏ user có role admin
        users.value = allUsers.filter(user => user.role !== 'admin')
    } catch (error) {
        console.error('Error loading users:', error)
        users.value = []
    }
}

const loadStats = async () => {
    try {
        const response = await api.get('/notifications/stats')
        const stats = response.data

        overdueCount.value = stats.overdueCount || 0
        dueSoonCount.value = stats.dueSoonCount || 0
        todayEmailCount.value = stats.todayEmailCount || 0
        recentActivity.value = stats.recentActivity || []
    } catch (error) {
        console.error('Error loading email stats:', error)
        // Silently fail - don't show error notification on page load
        // Set default values
        overdueCount.value = 0
        dueSoonCount.value = 0
        todayEmailCount.value = 0
        recentActivity.value = []
    }
}

const sendOverdueNotifications = async () => {
    loading.value.overdue = true
    try {
        const response = await api.post('/notifications/send-overdue-notifications')
        const result = response.data

        showNotification(
            `Đã gửi ${result.sent} email thông báo quá hạn`,
            'success'
        )
        await loadStats()
    } catch (error) {
        console.error('Error sending overdue notifications:', error)
        showNotification(
            error.response?.data?.message || 'Lỗi khi gửi thông báo quá hạn',
            'error'
        )
    } finally {
        loading.value.overdue = false
    }
}

const sendReminderNotifications = async () => {
    loading.value.reminder = true
    try {
        const response = await api.post('/notifications/send-reminder-notifications')
        const result = response.data

        showNotification(
            `Đã gửi ${result.sent} email nhắc nhở`,
            'success'
        )
        await loadStats()
    } catch (error) {
        console.error('Error sending reminder notifications:', error)
        showNotification(
            error.response?.data?.message || 'Lỗi khi gửi thông báo nhắc nhở',
            'error'
        )
    } finally {
        loading.value.reminder = false
    }
}

const sendNotification = async () => {
    loading.value.notification = true
    try {
        await api.post('/notifications/send-custom', {
            recipient: notificationForm.value.recipient,
            subject: notificationForm.value.subject,
            content: notificationForm.value.content
        })
        showNotification('Thông báo đã được gửi thành công', 'success')
        notificationForm.value = {
            recipient: '',
            subject: '',
            content: ''
        }
        await loadStats()
    } catch (error) {
        console.error('Error sending notification:', error)
        showNotification(
            error.response?.data?.message || 'Lỗi khi gửi thông báo',
            'error'
        )
    } finally {
        loading.value.notification = false
    }
}

// Load data on component mount
onMounted(() => {
    loadStats()
    loadUsers()
})
</script>

<style scoped>
.card {
    box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
    border: 1px solid rgba(0, 0, 0, 0.125);
}

.card-header {
    background-color: #f8f9fa;
    border-bottom: 1px solid rgba(0, 0, 0, 0.125);
}

.display-6 {
    font-weight: 600;
}

.btn:disabled {
    opacity: 0.65;
}

.border-bottom:last-child {
    border-bottom: none !important;
}
</style>