<template>
  <div class="container">
    <div class="row justify-content-center">
      <div class="col-12 col-md-6">
        <h2 class="mt-4 mb-3">Đăng nhập</h2>
        <form @submit.prevent="submit">
          <div class="mb-3">
            <label class="form-label">Email <span class="text-danger">*</span></label>
            <input class="form-control" v-model="email" type="email" required />
          </div>
          <div class="mb-3">
            <label class="form-label">Mật khẩu <span class="text-danger">*</span></label>
            <input class="form-control" v-model="password" type="password" required minlength="6" />
          </div>
          <div class="mb-3 text-end">
            <router-link to="/forgot-password" class="text-decoration-none small">
              Quên mật khẩu?
            </router-link>
          </div>
          <div>
            <button class="btn btn-primary" type="submit">Đăng nhập</button>
          </div>
        </form>
        <div v-if="error" class="text-danger mt-2">{{ error }}</div>
        <div class="mt-3">
          <span class="text-muted">Chưa có tài khoản?</span>
          <router-link to="/register" class="text-decoration-none ms-2">
            Đăng ký ngay
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import api from '../services/api'
export default {
  data() { return { email: '', password: '', error: null } },
  methods: {
    async submit() {
      try {
        const res = await api.post('/auth/login', { email: this.email, password: this.password })
        localStorage.setItem('token', res.data.token)
        // store user object for UI
        if (res.data.user) {
          localStorage.setItem('user', JSON.stringify(res.data.user))
          // notify in-app listeners that user changed
          try { window.dispatchEvent(new Event('user-changed')) } catch (e) { /* ignore */ }
        }
        this.$router.push('/')
      } catch (err) { this.error = err.response?.data?.message || err.message }
    }
  }
}
</script>
