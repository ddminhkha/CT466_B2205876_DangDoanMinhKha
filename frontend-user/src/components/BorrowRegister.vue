<template>
  <div class="container py-2 py-md-4">
    <h3 class="mb-3">Đăng ký mượn sách</h3>
    <div v-if="books.length === 0" class="alert alert-info">Không có sách trong giỏ. Vui lòng chọn sách từ Trang chủ.
    </div>

    <div v-else>
      <div class="list-group list-group-flush mb-3">
        <div
          class="list-group-item d-flex flex-column flex-sm-row justify-content-between align-items-start align-sm-items-center gap-2 py-2"
          v-for="b in books" :key="b._id">
          <div class="flex-grow-1">
            <div class="fw-bold small">{{ b.bookTitle?.title || b.title || 'N/A' }}</div>
            <div class="text-muted" style="font-size: 0.85rem;">{{ b.bookTitle?.author || b.author || 'N/A' }}</div>
            <div class="text-muted" style="font-size: 0.85rem;" v-if="b.volume">Tập: {{ b.volume }}</div>
            <div class="text-muted" style="font-size: 0.85rem;" v-if="b.publisher?.tenNXB">NXB: {{ b.publisher.tenNXB }}
            </div>
          </div>
          <div>
            <button class="btn btn-sm btn-outline-danger" @click="remove(b._id)">Xóa</button>
          </div>
        </div>
      </div>

      <div class="mb-3">
        <div class="alert alert-info mb-0" style="font-size: 0.95rem;">
          <i class="bi bi-info-circle"></i>
          <strong>Thông tin lịch hẹn:</strong>
          <ul class="mb-0 mt-2">
            <li>📅 <strong>Ngày hẹn lấy sách:</strong> 5:00PM ngày mai</li>
            <li>📅 <strong>Ngày hẹn trả sách:</strong> 5:00PM trong vòng 10 ngày</li>
            <li>⚠️ Vui lòng đến đúng hẹn, nếu không phiếu sẽ bị hủy</li>
          </ul>
        </div>
      </div>

      <div class="d-grid gap-2 d-sm-flex">
        <button class="btn btn-primary" :disabled="submitting || books.length === 0" @click="submit">
          <i class="bi bi-bookmark-plus"></i><span class="d-none d-sm-inline ms-1">Đăng ký mượn</span><span
            class="d-sm-none">Mượn</span>
        </button>
        <button class="btn btn-secondary" @click="clear">
          <i class="bi bi-trash"></i><span class="d-none d-sm-inline ms-1">Xóa giỏ</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import api from '../services/api'
import { useNotifications } from '../composables/useNotifications'

export default {
  setup() {
    const { showError, showSuccess, showWarning, showSuccessAfterNavigation } = useNotifications()
    return { showError, showSuccess, showWarning, showSuccessAfterNavigation }
  },
  data() { return { books: [], submitting: false } },
  created() { this.load() },
  methods: {
    load() {
      try { this.books = JSON.parse(localStorage.getItem('borrowCart') || '[]') } catch (e) { this.books = [] }
    },
    remove(id) {
      this.books = this.books.filter(b => b._id !== id)
      localStorage.setItem('borrowCart', JSON.stringify(this.books))
      this.showSuccess('Đã xóa sách khỏi giỏ mượn')
    },
    clear() {
      this.books = []
      localStorage.removeItem('borrowCart')
      this.showSuccess('Đã xóa toàn bộ giỏ mượn')
    },
    async submit() {
      const token = localStorage.getItem('token')
      if (!token) return this.$router.push('/login')

      // check user status
      try {
        const u = JSON.parse(localStorage.getItem('user') || 'null')
        if (u && u.status === 'banned') {
          return this.showWarning('Tài khoản của bạn đang bị khoá. Liên hệ với admin để active tài khoản của bạn')
        }
      } catch (e) { }

      this.submitting = true
      try {
        // send single request with multiple bookIds (không cần dueDate nữa)
        const bookIds = this.books.map(b => b._id)
        const response = await api.post('/loans/request', { bookIds })

        console.log('Loan request response:', response.data);

        // Lưu bookIds đã mượn để cập nhật UI
        // Use actual book IDs from the created loan response if available
        const borrowedBooks = JSON.parse(localStorage.getItem('borrowedBooks') || '{}')

        // If response contains the created loan with actual book IDs, use those
        if (response.data.loan && Array.isArray(response.data.loan.books)) {
          response.data.loan.books.forEach(book => {
            if (book._id) {
              borrowedBooks[book._id] = 'borrowed'
              console.log('Added to borrowedBooks:', book._id);
            }
          })
        } else {
          // Fallback to cart IDs
          bookIds.forEach(id => {
            borrowedBooks[id] = 'borrowed'
          })
        }

        localStorage.setItem('borrowedBooks', JSON.stringify(borrowedBooks))

        this.clear()

        // Persist success notification across navigation
        this.showSuccessAfterNavigation('Đăng ký mượn thành công! Ngày hẹn lấy sách: 5:00PM ngày mai. Vui lòng chờ admin duyệt.', 6000)

        // Navigate to my loans page
        await this.$router.push('/my-loans')
      } catch (err) {
        this.showError(err.response?.data?.message || err.message)
      } finally { this.submitting = false }
    }
  }
}
</script>

<style scoped>
.list-group-item {
  display: flex;
  justify-content: space-between;
  align-items: center
}
</style>
