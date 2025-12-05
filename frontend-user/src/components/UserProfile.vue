<template>
    <div class="user-profile-page">
        <div class="container py-4">
            <div class="row justify-content-center">
                <div class="col-lg-8">
                    <div class="card shadow">
                        <div class="card-header bg-primary text-white">
                            <h4 class="mb-0">
                                <i class="bi bi-person-circle"></i> Thông tin tài khoản
                            </h4>
                        </div>
                        <div class="card-body">
                            <form @submit.prevent="updateProfile">
                                <div class="row mb-3">
                                    <div class="col-md-6">
                                        <label class="form-label">Email</label>
                                        <input type="email" class="form-control" v-model="form.email" readonly disabled>
                                        <small class="text-muted">Email không thể thay đổi</small>
                                    </div>
                                    <div class="col-md-6">
                                        <label class="form-label">Vai trò</label>
                                        <input type="text" class="form-control"
                                            :value="form.role === 'admin' ? 'Quản trị viên' : 'Người dùng'" readonly
                                            disabled>
                                    </div>
                                </div>

                                <div class="row mb-3">
                                    <div class="col-md-6">
                                        <label class="form-label">Họ và tên lót</label>
                                        <input type="text" class="form-control" v-model="form.hoLot" maxlength="100">
                                    </div>
                                    <div class="col-md-6">
                                        <label class="form-label">Tên <span class="text-danger">*</span></label>
                                        <input type="text" class="form-control" v-model="form.ten" required
                                            maxlength="50">
                                    </div>
                                </div>

                                <div class="row mb-3">
                                    <div class="col-md-6">
                                        <label class="form-label">Ngày sinh</label>
                                        <input type="date" class="form-control" v-model="form.ngaySinh">
                                    </div>
                                    <div class="col-md-6">
                                        <label class="form-label">Giới tính</label>
                                        <select class="form-select" v-model="form.phai">
                                            <option value="">-- Chọn --</option>
                                            <option value="M">Nam</option>
                                            <option value="F">Nữ</option>
                                            <option value="O">Khác</option>
                                        </select>
                                    </div>
                                </div>

                                <div class="mb-3">
                                    <label class="form-label">Địa chỉ</label>
                                    <input type="text" class="form-control" v-model="form.diaChi" maxlength="200">
                                </div>

                                <div class="mb-3">
                                    <label class="form-label">Số điện thoại</label>
                                    <input type="tel" class="form-control" v-model="form.soDienThoai"
                                        pattern="(03|05|07|08|09)[0-9]{8}" maxlength="10" @input="validatePhoneNumber">
                                    <div v-if="phoneError" class="text-danger small mt-1">{{ phoneError }}</div>
                                </div>

                                <hr>
                                <h5 class="mb-3">Đổi mật khẩu</h5>
                                <p class="text-muted small">Để trống các trường bên dưới nếu không muốn đổi mật khẩu</p>

                                <div class="mb-3">
                                    <label class="form-label">Mật khẩu cũ <span class="text-danger"
                                            v-if="form.password">*</span></label>
                                    <input type="password" class="form-control" v-model="form.currentPassword"
                                        :required="!!form.password" minlength="6">
                                    <small class="text-muted">Bắt buộc khi đổi mật khẩu để xác thực danh tính</small>
                                </div>

                                <div class="mb-3">
                                    <label class="form-label">Mật khẩu mới</label>
                                    <input type="password" class="form-control" v-model="form.password" minlength="6"
                                        maxlength="100">
                                    <small class="text-muted">Tối thiểu 6 ký tự</small>
                                </div>

                                <div class="mb-3">
                                    <label class="form-label">Xác nhận mật khẩu mới</label>
                                    <input type="password" class="form-control" v-model="confirmPassword" minlength="6"
                                        maxlength="100">
                                </div>
                                <div class="d-flex gap-2 justify-content-end">
                                    <button type="button" class="btn btn-secondary" @click="$router.push('/')">
                                        <i class="bi bi-x-circle"></i> Hủy
                                    </button>
                                    <button type="submit" class="btn btn-primary" :disabled="saving">
                                        <i class="bi bi-save"></i> {{ saving ? 'Đang lưu...' : 'Lưu thay đổi' }}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import api from '../services/api'
import { useNotifications } from '../composables/useNotifications'

export default {
    name: 'UserProfile',
    setup() {
        const { showSuccess, showError } = useNotifications()
        return { showSuccess, showError }
    },
    data() {
        return {
            form: {
                email: '',
                role: '',
                hoLot: '',
                ten: '',
                ngaySinh: '',
                phai: '',
                diaChi: '',
                soDienThoai: '',
                currentPassword: '',
                password: ''
            },
            confirmPassword: '',
            saving: false,
            phoneError: ''
        }
    },
    async created() {
        await this.loadProfile()
    },
    methods: {
        async loadProfile() {
            try {
                const response = await api.get('/users/me')
                const user = response.data

                this.form.email = user.email || ''
                this.form.role = user.role || 'user'
                this.form.hoLot = user.hoLot || ''
                this.form.ten = user.ten || ''
                this.form.phai = user.phai || ''
                this.form.diaChi = user.diaChi || ''
                this.form.soDienThoai = user.soDienThoai || ''

                // Format ngaySinh to YYYY-MM-DD for input[type="date"]
                if (user.ngaySinh) {
                    const date = new Date(user.ngaySinh)
                    this.form.ngaySinh = date.toISOString().split('T')[0]
                }
            } catch (error) {
                console.error('Error loading profile:', error)
                this.showError('Không thể tải thông tin tài khoản')
            }
        },
        validatePhoneNumber() {
            const phone = this.form.soDienThoai
            if (!phone) {
                this.phoneError = ''
                return
            }

            // Remove spaces and special characters
            const cleanPhone = phone.replace(/[^0-9]/g, '')
            this.form.soDienThoai = cleanPhone

            // Validate Vietnamese phone number format
            const vnPhoneRegex = /^(03|05|07|08|09)[0-9]{8}$/
            if (!vnPhoneRegex.test(cleanPhone)) {
                this.phoneError = 'Số điện thoại không hợp lệ. Vui lòng nhập đúng 10 số với đầu số 03, 05, 07, 08, 09'
            } else {
                this.phoneError = ''
            }
        },
        async updateProfile() {
            // Validate required fields
            if (!this.form.ten) {
                this.showError('Vui lòng nhập tên')
                return
            }

            // Validate phone number if provided
            if (this.form.soDienThoai) {
                const vnPhoneRegex = /^(03|05|07|08|09)[0-9]{8}$/
                if (!vnPhoneRegex.test(this.form.soDienThoai)) {
                    this.showError('Số điện thoại không hợp lệ. Phải là 10 số với đầu số 03, 05, 07, 08, 09')
                    return
                }
            }

            // Validate password change
            if (this.form.password) {
                if (!this.form.currentPassword) {
                    this.showError('Vui lòng nhập mật khẩu cũ để xác thực')
                    return
                }
                if (this.form.password.length < 6) {
                    this.showError('Mật khẩu mới phải có ít nhất 6 ký tự')
                    return
                }
                if (this.form.password !== this.confirmPassword) {
                    this.showError('Mật khẩu xác nhận không khớp')
                    return
                }
            }

            this.saving = true
            try {
                const updateData = {
                    hoLot: this.form.hoLot,
                    ten: this.form.ten,
                    ngaySinh: this.form.ngaySinh,
                    phai: this.form.phai,
                    diaChi: this.form.diaChi,
                    soDienThoai: this.form.soDienThoai
                }

                // Only include password fields if user wants to change password
                if (this.form.password) {
                    updateData.currentPassword = this.form.currentPassword
                    updateData.password = this.form.password
                }

                const response = await api.put('/users/me', updateData)

                // Update localStorage with new user data
                const updatedUser = response.data
                localStorage.setItem('user', JSON.stringify(updatedUser))
                window.dispatchEvent(new Event('user-changed'))

                this.showSuccess('Cập nhật thông tin thành công')

                // Clear password fields
                this.form.currentPassword = ''
                this.form.password = ''
                this.confirmPassword = ''

                // Redirect to home after 1 second
                setTimeout(() => {
                    this.$router.push('/')
                }, 1000)
            } catch (error) {
                console.error('Error updating profile:', error)
                this.showError(error.response?.data?.message || 'Không thể cập nhật thông tin')
            } finally {
                this.saving = false
            }
        }
    }
}
</script>

<style scoped>
.user-profile-page {
    min-height: calc(100vh - 60px);
    background-color: #f8f9fa;
}

.card {
    border: none;
    border-radius: 0.5rem;
}

.card-header {
    border-radius: 0.5rem 0.5rem 0 0 !important;
    padding: 1.25rem;
}

.form-label {
    font-weight: 500;
    margin-bottom: 0.5rem;
}

.form-control:disabled,
.form-control[readonly] {
    background-color: #e9ecef;
    cursor: not-allowed;
}

hr {
    margin: 1.5rem 0;
    opacity: 0.1;
}

.btn {
    padding: 0.5rem 1.5rem;
    font-weight: 500;
}

.btn i {
    margin-right: 0.5rem;
}

/* Mobile responsive */
@media (max-width: 768px) {
    .user-profile-page {
        padding: 0;
    }

    .card {
        border-radius: 0;
    }

    .card-header {
        border-radius: 0 !important;
    }

    .d-flex.gap-2 {
        flex-direction: column;
    }

    .btn {
        width: 100%;
    }
}
</style>
