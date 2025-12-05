<template>
  <div class="container py-4">
    <div class="d-flex justify-content-between align-items-center">
      <h2>Người dùng</h2>
      <div>
        <button class="btn btn-secondary me-2" @click="load">Tải lại</button>
        <button class="btn btn-primary" @click="openCreate">Thêm người dùng</button>
      </div>
    </div>

    <div class="table-responsive mt-3">
      <table class="table table-sm table-hover">
        <thead>
          <tr>
            <th>Email</th>
            <th>Họ tên</th>
            <th>SDT</th>
            <th>Vai trò</th>
            <th>Trạng thái</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          <template v-for="u in users" :key="u._id">
            <tr>
              <td class="align-middle">{{ u.email }}</td>
              <td class="align-middle" style="cursor:pointer" @click="toggleDetails(u)">{{ (u.hoLot || '') + ' ' +
                (u.ten || '') }}</td>
              <td class="align-middle">{{ u.soDienThoai || '-' }}</td>
              <td class="align-middle">{{ u.role }}</td>
              <td class="align-middle">
                <select class="form-select form-select-sm" v-model="u.status" @change="changeStatus(u)">
                  <option value="active">active</option>
                  <option value="banned">banned</option>
                </select>
              </td>
              <td class="align-middle">
                <button class="btn btn-sm btn-outline-secondary me-2" @click.stop="openEdit(u)">Sửa</button>
                <button class="btn btn-sm btn-danger" @click.stop="remove(u._id)">Xóa</button>
              </td>
            </tr>

            <tr v-if="selectedUser && selectedUser._id === u._id">
              <td colspan="6" class="bg-light">
                <div class="p-3">
                  <h6>Chi tiết người dùng</h6>
                  <div><strong>Email:</strong> {{ selectedUser.email }}</div>
                  <div><strong>Họ tên:</strong> {{ (selectedUser.hoLot || '') + ' ' + (selectedUser.ten || '') }}</div>
                  <div><strong>Ngày sinh:</strong> {{ selectedUser.ngaySinh ? new
                    Date(selectedUser.ngaySinh).toLocaleDateString() : '-' }}</div>
                  <div><strong>Phái:</strong> {{ selectedUser.phai || '-' }}</div>
                  <div><strong>Địa chỉ:</strong> {{ selectedUser.diaChi || '-' }}</div>
                  <div><strong>Số điện thoại:</strong> {{ selectedUser.soDienThoai || '-' }}</div>
                  <div><strong>Vai trò:</strong> {{ selectedUser.role }}</div>
                  <div><strong>Trạng thái:</strong> {{ selectedUser.status }}</div>
                  <div class="mt-2">
                    <button class="btn btn-sm btn-outline-primary me-2" @click="openEdit(selectedUser)">Sửa</button>
                    <button class="btn btn-sm btn-secondary" @click="closeDetails">Đóng</button>
                  </div>
                </div>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>

    <!-- modal for add/edit -->
    <div v-if="showForm"
      class="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
      style="background: rgba(0,0,0,0.4); z-index:1050;">
      <div class="card p-4" style="width:520px; max-width:95%;">
        <h5 class="mb-3">{{ editing ? 'Sửa người dùng' : 'Thêm người dùng' }}</h5>
        <form @submit.prevent="save">
          <div class="mb-2">
            <input class="form-control" v-model="form.email" placeholder="Email" required type="email" />
          </div>
          <div class="mb-2" v-if="!editing">
            <input class="form-control" v-model="form.password" placeholder="Mật khẩu" required type="password" />
          </div>
          <div class="mb-2 row">
            <div class="col-6"><input class="form-control" v-model="form.hoLot" placeholder="Họ lót" /></div>
            <div class="col-6"><input class="form-control" v-model="form.ten" placeholder="Tên" /></div>
          </div>
          <div class="mb-2 row">
            <div class="col-6"><input class="form-control" v-model="form.soDienThoai" placeholder="Số điện thoại" />
            </div>
            <div class="col-6"><input class="form-control" v-model="form.diaChi" placeholder="Địa chỉ" /></div>
          </div>
          <div class="mb-2 row">
            <div class="col-6">
              <select class="form-select" v-model="form.phai">
                <option value="">-- Phái --</option>
                <option value="M">Nam</option>
                <option value="F">Nữ</option>
                <option value="O">Khác</option>
              </select>
            </div>
            <div class="col-6">
              <select class="form-select" v-model="form.role">
                <option value="user">user</option>
                <option value="admin">admin</option>
              </select>
            </div>
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
import { useNotifications } from '../composables/useNotifications'
import { useConfirmDialog } from '../composables/useConfirmDialog'

export default {
  setup() {
    const { showError, showSuccess, showInfo } = useNotifications()
    const { showConfirm } = useConfirmDialog()
    return { showError, showSuccess, showInfo, showConfirm }
  },
  data() {
    return {
      users: [],
      selectedUser: null,
      showForm: false,
      editing: false,
      form: { email: '', password: '', hoLot: '', ten: '', ngaySinh: '', phai: '', diaChi: '', soDienThoai: '', role: 'user' }
    }
  },
  created() { this.load() },
  methods: {
    async load() {
      try {
        const r = await api.get('/users')
        this.users = r.data
        // clear selected user if it's not in the list anymore
        if (this.selectedUser) {
          const found = this.users.find(x => x._id === this.selectedUser._id)
          if (!found) this.selectedUser = null
          else this.selectedUser = found
        }
      } catch (e) {
        this.showError('Không thể tải người dùng: ' + (e.response?.data?.message || e.message))
      }
    },
    openCreate() {
      this.editing = false
      this.form = { email: '', password: '', hoLot: '', ten: '', ngaySinh: '', phai: '', diaChi: '', soDienThoai: '', role: 'user' }
      this.showForm = true
    },
    openEdit(u) {
      this.editing = true
      this.form = { ...u }
      // don't keep password
      delete this.form.password
      this.showForm = true
      // also set selected user for continuity
      this.selectedUser = u
    },
    closeForm() { this.showForm = false },
    async save() {
      try {
        if (this.editing) {
          // update full profile
          const payload = { ...this.form }
          // don't send empty password
          if (!payload.password) delete payload.password
          await api.put(`/users/${this.form._id}`, payload)
        } else {
          await api.post('/users', this.form)
        }
        this.showForm = false
        this.load()
        this.showSuccess(this.editing ? 'Cập nhật người dùng thành công' : 'Tạo người dùng thành công')
      } catch (e) {
        this.showError(e.response?.data?.message || e.message)
      }
    },
    async changeStatus(u) {
      try {
        await api.put(`/users/${u._id}/status`, { status: u.status })
        this.showSuccess('Cập nhật trạng thái thành công')
      } catch (e) {
        this.showError('Không thể cập nhật trạng thái: ' + (e.response?.data?.message || e.message))
        this.load()
      }
    },
    async remove(id) {
      const user = this.users.find(u => u._id === id)
      const confirmed = await this.showConfirm({
        title: 'Xóa người dùng',
        message: `Bạn có chắc muốn xóa người dùng "${user?.ten || 'này'}"? Hành động này không thể hoàn tác.`,
        confirmText: 'Xóa',
        type: 'danger'
      })
      if (!confirmed) return
      try {
        await api.delete(`/users/${id}`)
        this.load()
        this.showSuccess('Xóa người dùng thành công')
      } catch (e) {
        this.showError('Lỗi khi xóa: ' + (e.response?.data?.message || e.message))
      }
    },
    toggleDetails(u) {
      if (this.selectedUser && this.selectedUser._id === u._id) this.selectedUser = null
      else this.selectedUser = u
    },
    closeDetails() { this.selectedUser = null }
  }
}
</script>

<style scoped>
.card {
  border-radius: 6px
}
</style>
