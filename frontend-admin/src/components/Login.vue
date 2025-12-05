<template>
  <div class="container" style="max-width:460px;padding-top:24px;">
    <div class="text-center mb-4 w-100">
      <h2 class="fw-bold fs-3 mb-0">Chào mừng bạn đến với hệ thống quản lý mượn sách</h2>
    </div>

    <div class="card p-4 shadow-sm">
      <h3 class="mb-3 text-center">Admin Login</h3>
      <form @submit.prevent="submit">
        <div class="mb-2">
          <input class="form-control" v-model="email" placeholder="Email" />
        </div>
        <div class="mb-3">
          <input class="form-control" v-model="password" type="password" placeholder="Password" />
        </div>
        <div>
          <button class="btn btn-primary w-100" type="submit">Login</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
import api from '../services/api'
import { useNotifications } from '../composables/useNotifications'

export default {
  setup() {
    const { showError, showSuccess } = useNotifications()
    return { showError, showSuccess }
  },
  data() { return { email: '', password: '' } },
  methods: {
    async submit() {
      try {
        const r = await api.post('/auth/login', { email: this.email, password: this.password })
        localStorage.setItem('token', r.data.token)

        // Save user object
        if (r.data.user) {
          localStorage.setItem('user', JSON.stringify(r.data.user))
        }

        // Check if user is admin
        if (r.data.user?.role !== 'admin') {
          this.showError('Chỉ admin mới có thể đăng nhập vào trang này')
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          return
        }

        this.showSuccess('Đăng nhập thành công!')
        // redirect to intended page if provided
        const redirect = this.$route.query.redirect || '/'
        this.$router.push(redirect)
      } catch (e) {
        this.showError(e.response?.data?.message || e.message)
      }
    }
  }
}
</script>
