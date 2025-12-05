<template>
  <div class="container py-3">
    <div class="d-flex justify-content-between align-items-center">
      <h2>Quản lý Nhà xuất bản</h2>
      <div>
        <button class="btn btn-secondary me-2" @click="load">Tải lại</button>
        <button class="btn btn-primary" @click="openCreate">Thêm NXB</button>
      </div>
    </div>

    <div class="list-group mt-3">
      <div class="list-group-item d-flex justify-content-between align-items-center" v-for="p in publishers"
        :key="p._id">
        <div>
          <div class="fw-bold">{{ p.tenNXB }}</div>
          <div class="text-muted small">{{ p.diaChi }}</div>
        </div>
        <div>
          <button class="btn btn-sm btn-outline-secondary me-2" @click="openEdit(p)">Sửa</button>
          <button class="btn btn-sm btn-danger" @click="del(p._id)">Xóa</button>
        </div>
      </div>
    </div>

    <!-- modal -->
    <div v-if="showForm"
      class="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
      style="background: rgba(0,0,0,0.4); z-index:1050;">
      <div class="card p-4" style="width:420px; max-width:95%;">
        <h5 class="mb-3">{{ editing ? 'Sửa NXB' : 'Thêm NXB' }}</h5>
        <form @submit.prevent="save">
          <div class="mb-2">
            <input class="form-control" v-model="form.tenNXB" placeholder="Tên nhà xuất bản" required />
          </div>
          <div class="mb-2">
            <input class="form-control" v-model="form.diaChi" placeholder="Địa chỉ" />
          </div>
          <div class="d-flex justify-content-end">
            <button type="button" class="btn btn-secondary me-2" @click="closeForm">Hủy</button>
            <button type="submit" class="btn btn-primary">Lưu</button>
          </div>
        </form>
      </div>
    </div>

  </div>
</template>

<script>
import api from '../services/api'
export default {
  data() {
    return {
      publishers: [],
      showForm: false,
      editing: false,
      form: { tenNXB: '', diaChi: '' }
    }
  },
  created() { this.load() },
  methods: {
    async load() {
      try {
        const r = await api.get('/publishers')
        this.publishers = r.data
      } catch (e) {
        alert('Không thể tải NXB: ' + (e.response?.data?.message || e.message))
      }
    },
    openCreate() {
      this.editing = false
      this.form = { tenNXB: '', diaChi: '' }
      this.showForm = true
    },
    openEdit(p) {
      this.editing = true
      this.form = { ...p }
      this.showForm = true
    },
    closeForm() { this.showForm = false },
    async save() {
      try {
        if (this.editing) {
          await api.put('/publishers/' + this.form._id, { tenNXB: this.form.tenNXB, diaChi: this.form.diaChi })
        } else {
          await api.post('/publishers', { tenNXB: this.form.tenNXB, diaChi: this.form.diaChi })
        }
        this.showForm = false
        this.load()
      } catch (e) {
        alert(e.response?.data?.message || e.message)
      }
    },
    async del(id) {
      if (!confirm('Xác nhận xóa?')) return
      try {
        await api.delete('/publishers/' + id)
        this.load()
      } catch (e) {
        alert('Lỗi khi xóa: ' + (e.response?.data?.message || e.message))
      }
    }
  }
}
</script>

<style scoped>
.card {
  border-radius: 6px
}
</style>
