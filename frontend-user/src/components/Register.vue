<template>
  <div class="container">
    <div class="row justify-content-center">
      <div class="col-12 col-md-6">
        <h2 class="mt-4 mb-3">Đăng ký</h2>
        <form @submit.prevent="submit">
          <div class="mb-3">
            <label class="form-label">Email <span class="text-danger">*</span></label>
            <input class="form-control" v-model="email" type="email" required />
          </div>
          <div class="mb-3">
            <label class="form-label">Mật khẩu <span class="text-danger">*</span></label>
            <input class="form-control" v-model="password" type="password" required minlength="6" />
            <small class="text-muted">Tối thiểu 6 ký tự</small>
          </div>
          <div class="mb-3">
            <label class="form-label">Họ và tên lót</label>
            <input class="form-control" v-model="hoLot" type="text" maxlength="100" />
          </div>
          <div class="mb-3">
            <label class="form-label">Tên <span class="text-danger">*</span></label>
            <input class="form-control" v-model="ten" type="text" required maxlength="50" />
          </div>
          <div class="mb-3">
            <label class="form-label">Ngày sinh</label>
            <input class="form-control" v-model="ngaySinh" type="date" />
          </div>
          <div class="mb-3">
            <label class="form-label">Phái</label>
            <select class="form-select" v-model="phai">
              <option value="">-- Chọn --</option>
              <option value="M">Nam</option>
              <option value="F">Nữ</option>
              <option value="O">Khác</option>
            </select>
          </div>
          <div class="mb-3">
            <label class="form-label">Địa chỉ</label>
            <input class="form-control" v-model="diaChi" type="text" maxlength="200" />
          </div>
          <div class="mb-3">
            <label class="form-label">Số điện thoại</label>
            <input class="form-control" v-model="soDienThoai" type="tel" pattern="(03|05|07|08|09)[0-9]{8}"
              maxlength="10" @input="validatePhone" />
            <div v-if="phoneError" class="text-danger small mt-1">{{ phoneError }}</div>
          </div>
          <div><button class="btn btn-success" type="submit">Đăng ký</button></div>
        </form>
        <div v-if="msg" class="mt-2">{{ msg }}</div>
      </div>
    </div>
  </div>
</template>

<script>
import api from '../services/api'
export default {
  data() { return { email: '', password: '', hoLot: '', ten: '', ngaySinh: '', phai: '', diaChi: '', soDienThoai: '', msg: null, phoneError: '' } },
  methods: {
    validatePhone() {
      const phone = this.soDienThoai
      if (!phone) {
        this.phoneError = ''
        return
      }
      const cleanPhone = phone.replace(/[^0-9]/g, '')
      this.soDienThoai = cleanPhone
      const vnPhoneRegex = /^(03|05|07|08|09)[0-9]{8}$/
      if (!vnPhoneRegex.test(cleanPhone)) {
        this.phoneError = 'Số điện thoại không hợp lệ. Vui lòng nhập đúng 10 số với đầu số 03, 05, 07, 08, 09'
      } else {
        this.phoneError = ''
      }
    },
    async submit() {
      // Validate phone before submit
      if (this.soDienThoai) {
        const vnPhoneRegex = /^(03|05|07|08|09)[0-9]{8}$/
        if (!vnPhoneRegex.test(this.soDienThoai)) {
          this.msg = 'Số điện thoại không hợp lệ'
          return
        }
      }
      try {
        const payload = {
          email: this.email,
          password: this.password,
          hoLot: this.hoLot || undefined,
          ten: this.ten || undefined,
          ngaySinh: this.ngaySinh || undefined,
          phai: this.phai || undefined,
          diaChi: this.diaChi || undefined,
          soDienThoai: this.soDienThoai || undefined
        }
        const res = await api.post('/auth/register', payload)
        // store token and user, then redirect to home
        localStorage.setItem('token', res.data.token)
        if (res.data.user) {
          localStorage.setItem('user', JSON.stringify(res.data.user))
          try { window.dispatchEvent(new Event('user-changed')) } catch (e) { /* ignore */ }
        }
        this.$router.push('/')
      } catch (err) { this.msg = err.response?.data?.message || err.message }
    }
  }
}
</script>
