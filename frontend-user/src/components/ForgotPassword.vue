<template>
    <div class="container py-5">
        <div class="row justify-content-center">
            <div class="col-md-6 col-lg-5">
                <div class="card shadow">
                    <div class="card-body p-5">
                        <div class="text-center mb-4">
                            <i class="bi bi-lock text-primary" style="font-size: 3rem;"></i>
                            <h2 class="mt-3">Quên mật khẩu?</h2>
                            <p class="text-muted">Nhập email để nhận link đặt lại mật khẩu</p>
                        </div>

                        <div v-if="successMessage" class="alert alert-success" role="alert">
                            <i class="bi bi-check-circle me-2"></i>
                            {{ successMessage }}
                        </div>

                        <div v-if="errorMessage" class="alert alert-danger" role="alert">
                            <i class="bi bi-exclamation-circle me-2"></i>
                            {{ errorMessage }}
                        </div>

                        <form @submit.prevent="handleSubmit" v-if="!successMessage">
                            <div class="mb-3">
                                <label for="email" class="form-label">Email</label>
                                <div class="input-group">
                                    <span class="input-group-text">
                                        <i class="bi bi-envelope"></i>
                                    </span>
                                    <input type="email" class="form-control" id="email" v-model="email"
                                        placeholder="your.email@example.com" required :disabled="loading" />
                                </div>
                            </div>

                            <button type="submit" class="btn btn-primary w-100 mb-3" :disabled="loading">
                                <span v-if="loading">
                                    <span class="spinner-border spinner-border-sm me-2"></span>
                                    Đang gửi...
                                </span>
                                <span v-else>
                                    <i class="bi bi-send me-2"></i>
                                    Gửi link đặt lại mật khẩu
                                </span>
                            </button>
                        </form>

                        <div class="text-center mt-3">
                            <router-link to="/login" class="text-decoration-none">
                                <i class="bi bi-arrow-left me-2"></i>
                                Quay lại đăng nhập
                            </router-link>
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
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import api from '../services/api.js'
import { useNotifications } from '../composables/useNotifications.js'
import NotificationToast from './NotificationToast.vue'

const router = useRouter()
const { showSuccess, showError } = useNotifications()

const email = ref('')
const loading = ref(false)
const successMessage = ref('')
const errorMessage = ref('')

const handleSubmit = async () => {
    loading.value = true
    errorMessage.value = ''
    successMessage.value = ''

    try {
        const response = await api.post('/auth/forgot-password', {
            email: email.value
        })

        successMessage.value = response.data.message || 'Link đặt lại mật khẩu đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư.'
        showSuccess('Email đã được gửi!')

        // Redirect to login after 5 seconds
        setTimeout(() => {
            router.push('/login')
        }, 5000)

    } catch (error) {
        console.error('Forgot password error:', error)
        errorMessage.value = error.response?.data?.message || 'Có lỗi xảy ra. Vui lòng thử lại.'
        showError(errorMessage.value)
    } finally {
        loading.value = false
    }
}
</script>

<style scoped>
.card {
    border: none;
    border-radius: 15px;
}

.input-group-text {
    background-color: #f8f9fa;
    border-right: none;
}

.form-control {
    border-left: none;
}

.form-control:focus {
    box-shadow: none;
    border-color: #ced4da;
}

.btn-primary {
    padding: 12px;
    font-weight: 500;
}
</style>
