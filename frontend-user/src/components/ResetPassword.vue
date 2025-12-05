<template>
    <div class="container py-5">
        <div class="row justify-content-center">
            <div class="col-md-6 col-lg-5">
                <div class="card shadow">
                    <div class="card-body p-5">
                        <div class="text-center mb-4">
                            <i class="bi bi-key text-success" style="font-size: 3rem;"></i>
                            <h2 class="mt-3">Đặt lại mật khẩu</h2>
                            <p class="text-muted">Nhập mật khẩu mới cho tài khoản của bạn</p>
                        </div>

                        <div v-if="successMessage" class="alert alert-success" role="alert">
                            <i class="bi bi-check-circle me-2"></i>
                            {{ successMessage }}
                        </div>

                        <div v-if="errorMessage" class="alert alert-danger" role="alert">
                            <i class="bi bi-exclamation-circle me-2"></i>
                            {{ errorMessage }}
                        </div>

                        <form @submit.prevent="handleSubmit" v-if="!successMessage && !invalidToken">
                            <div class="mb-3">
                                <label for="password" class="form-label">Mật khẩu mới</label>
                                <div class="input-group">
                                    <span class="input-group-text">
                                        <i class="bi bi-lock"></i>
                                    </span>
                                    <input :type="showPassword ? 'text' : 'password'" class="form-control" id="password"
                                        v-model="newPassword" placeholder="Nhập mật khẩu mới" required minlength="6"
                                        :disabled="loading" />
                                    <button class="btn btn-outline-secondary" type="button"
                                        @click="showPassword = !showPassword" :disabled="loading">
                                        <i :class="showPassword ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
                                    </button>
                                </div>
                                <small class="text-muted">Tối thiểu 6 ký tự</small>
                            </div>

                            <div class="mb-3">
                                <label for="confirmPassword" class="form-label">Xác nhận mật khẩu</label>
                                <div class="input-group">
                                    <span class="input-group-text">
                                        <i class="bi bi-lock-fill"></i>
                                    </span>
                                    <input :type="showConfirmPassword ? 'text' : 'password'" class="form-control"
                                        id="confirmPassword" v-model="confirmPassword"
                                        placeholder="Nhập lại mật khẩu mới" required :disabled="loading" />
                                    <button class="btn btn-outline-secondary" type="button"
                                        @click="showConfirmPassword = !showConfirmPassword" :disabled="loading">
                                        <i :class="showConfirmPassword ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
                                    </button>
                                </div>
                            </div>

                            <div v-if="passwordMismatch" class="alert alert-warning" role="alert">
                                <i class="bi bi-exclamation-triangle me-2"></i>
                                Mật khẩu xác nhận không khớp
                            </div>

                            <button type="submit" class="btn btn-success w-100 mb-3"
                                :disabled="loading || passwordMismatch">
                                <span v-if="loading">
                                    <span class="spinner-border spinner-border-sm me-2"></span>
                                    Đang xử lý...
                                </span>
                                <span v-else>
                                    <i class="bi bi-check-circle me-2"></i>
                                    Đặt lại mật khẩu
                                </span>
                            </button>
                        </form>

                        <div v-if="invalidToken" class="text-center">
                            <div class="alert alert-danger" role="alert">
                                <i class="bi bi-x-circle me-2"></i>
                                Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn
                            </div>
                            <router-link to="/forgot-password" class="btn btn-primary">
                                <i class="bi bi-arrow-repeat me-2"></i>
                                Yêu cầu link mới
                            </router-link>
                        </div>

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
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import api from '../services/api.js'
import { useNotifications } from '../composables/useNotifications.js'
import NotificationToast from './NotificationToast.vue'

const router = useRouter()
const route = useRoute()
const { showSuccess, showError } = useNotifications()

const newPassword = ref('')
const confirmPassword = ref('')
const showPassword = ref(false)
const showConfirmPassword = ref(false)
const loading = ref(false)
const successMessage = ref('')
const errorMessage = ref('')
const invalidToken = ref(false)
const token = ref('')

const passwordMismatch = computed(() => {
    return confirmPassword.value && newPassword.value !== confirmPassword.value
})

onMounted(() => {
    // Get token from URL query parameter
    token.value = route.query.token
    if (!token.value) {
        invalidToken.value = true
        errorMessage.value = 'Thiếu mã xác thực'
    }
})

const handleSubmit = async () => {
    if (passwordMismatch.value) {
        showError('Mật khẩu xác nhận không khớp')
        return
    }

    if (newPassword.value.length < 6) {
        showError('Mật khẩu phải có ít nhất 6 ký tự')
        return
    }

    loading.value = true
    errorMessage.value = ''
    successMessage.value = ''

    try {
        const response = await api.post('/auth/reset-password', {
            token: token.value,
            newPassword: newPassword.value
        })

        successMessage.value = response.data.message || 'Mật khẩu đã được đặt lại thành công!'
        showSuccess('Đặt lại mật khẩu thành công!')

        // Redirect to login after 3 seconds
        setTimeout(() => {
            router.push('/login')
        }, 3000)

    } catch (error) {
        console.error('Reset password error:', error)

        if (error.response?.status === 400) {
            invalidToken.value = true
            errorMessage.value = error.response.data.message || 'Link đã hết hạn hoặc không hợp lệ'
        } else {
            errorMessage.value = error.response?.data?.message || 'Có lỗi xảy ra. Vui lòng thử lại.'
        }

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
    border-right: none;
}

.form-control:focus {
    box-shadow: none;
    border-color: #ced4da;
}

.btn-outline-secondary {
    border-left: none;
}

.btn-success {
    padding: 12px;
    font-weight: 500;
}
</style>
