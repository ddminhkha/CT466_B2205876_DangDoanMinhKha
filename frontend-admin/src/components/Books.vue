<template>
  <div class="py-2 py-md-3">
    <div class="d-flex flex-column flex-md-row justify-content-between align-items-start gap-2 mb-3">
      <h2 class="mt-0 mb-0">Quản lý Sách</h2>
      <div class="w-100 w-md-auto d-flex gap-2">
        <button class="btn btn-secondary btn-sm" @click="load">Tải lại</button>
        <button class="btn btn-primary btn-sm" @click="openCreate">Thêm sách</button>
      </div>
    </div>

    <!-- search / filter / sort controls placed under the heading -->
    <div class="d-flex flex-column flex-lg-row align-items-start gap-2 mt-2 mb-2">
      <div class="input-group input-group-sm" style="max-width: 100%; width: auto;">
        <input class="form-control form-control-sm" placeholder="Tìm sách" v-model="searchTerm"
          @keyup.enter="applyFilters" />
        <button class="btn btn-outline-secondary btn-sm" @click="applyFilters">Tìm</button>
        <button class="btn btn-outline-secondary btn-sm" @click="toggleFilter">Lọc</button>
      </div>

      <!-- sort controls: alphabetical asc/desc -->
      <div class="btn-group btn-group-sm">
        <button class="btn btn-outline-secondary" @click="setAlphaAsc" :class="{ active: sortAlpha === 'asc' }"
          :title="alphaTitle">A↓</button>
        <button class="btn btn-outline-secondary" @click="setAlphaDesc" :class="{ active: sortAlpha === 'desc' }"
          :title="alphaTitle">A↑</button>
      </div>
      <div class="text-muted" style="font-size: 0.85rem;">Kết quả: {{ displayedBooks.length }}</div>
    </div>

    <div class="list-group list-group-flush mt-2" style="font-size: 0.9rem;">
      <!-- filter panel -->
      <div v-if="showFilter" class="card card-sm p-2 mb-2">
        <div class="row g-1">
          <div class="col-12 col-sm-6 col-lg-5">
            <label class="form-label form-label-sm mb-1">Nhà xuất bản</label>
            <select class="form-select form-select-sm" v-model="filterPublisherId">
              <option value="">-- Tất cả --</option>
              <option v-for="p in publishers" :key="p._id" :value="p._id">{{ p.tenNXB }}</option>
            </select>
          </div>
          <div class="col-12 col-sm-6 col-lg-3">
            <label class="form-label form-label-sm mb-1">Năm xuất bản</label>
            <input class="form-control form-control-sm" type="number" v-model.number="filterYear" placeholder="2020" />
          </div>
          <div class="col-12 col-lg-4 d-flex align-items-end gap-1">
            <button class="btn btn-primary btn-sm" @click="applyFilters">Áp dụng</button>
            <button class="btn btn-outline-secondary btn-sm" @click="clearFilters">Xóa</button>
          </div>
        </div>
      </div>

      <!-- Thông tin trang và tổng kết -->
      <div class="mb-3 text-muted" style="font-size: 0.9rem;">
        Hiển thị {{ displayedBooks.length }} / {{ filteredBooks.length }} sách
        <span v-if="totalPages > 1">(Trang {{ currentPage }} / {{ totalPages }})</span>
      </div>

      <div class="list-group-item d-block d-lg-flex justify-content-lg-between align-items-lg-start p-2 mb-2"
        v-for="b in displayedBooks" :key="b._id">
        <div class="d-flex gap-3 flex-grow-1 mb-2">
          <img v-if="b.coverImage" :src="getCoverImageUrl(b.coverImage)" alt="Book cover"
            style="width: 80px; height: 120px; object-fit: cover; border: 1px solid #ddd; border-radius: 4px;">
          <div class="flex-grow-1">
            <div class="fw-bold">{{ b.bookTitle?.title || b.title }}</div>
            <div class="text-muted" style="font-size: 0.85rem;">{{ b.bookTitle?.author || b.author || '—' }} — <span
                v-if="b.publisher">{{
                  b.publisher.tenNXB
                }}</span></div>
            <div class="mt-1">
              <div class="row g-2" style="font-size: 0.85rem;">
                <div v-if="b.volume" class="col-6 col-sm-4 col-lg-auto"><strong>Tập:</strong> {{ b.volume }}</div>
                <div class="col-6 col-sm-4 col-lg-auto"><strong>Tổng:</strong> {{ b.totalQuantity ?? b.soQuyen ?? '-' }}
                </div>
                <div class="col-6 col-sm-4 col-lg-auto"><strong>Sẵn:</strong> {{ b.availableQuantity ?? b.soQuyen ?? '-'
                }}</div>
                <div class="col-6 col-sm-4 col-lg-auto"><strong>Năm:</strong> {{ b.year ?? '-' }}</div>
                <div class="col-6 col-sm-4 col-lg-auto"><strong>Giá:</strong> {{ fmtPrice(b.donGia) }}</div>
                <div v-if="b.language" class="col-6 col-sm-4 col-lg-auto"><strong>Ngôn ngữ:</strong> {{ b.language }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="d-flex flex-column align-items-start align-lg-end gap-1 mt-2">
          <div class="text-muted" style="font-size: 0.85rem;">{{ fmtDate(b.createdAt) }}</div>
          <div class="d-flex gap-1">
            <button class="btn btn-sm btn-outline-secondary" @click="openEdit(b)">Sửa</button>
            <button class="btn btn-sm btn-danger" @click="del(b._id)">Xóa</button>
          </div>
        </div>
      </div>

      <!-- Pagination Controls -->
      <div v-if="totalPages > 1" class="d-flex justify-content-center mt-3">
        <nav>
          <ul class="pagination pagination-sm">
            <li class="page-item" :class="{ disabled: currentPage === 1 }">
              <button class="page-link" @click="goToPage(currentPage - 1)" :disabled="currentPage === 1">Trước</button>
            </li>

            <!-- Hiển thị trang đầu -->
            <li v-if="currentPage > 3" class="page-item">
              <button class="page-link" @click="goToPage(1)">1</button>
            </li>
            <li v-if="currentPage > 4" class="page-item disabled">
              <span class="page-link">...</span>
            </li>

            <!-- Hiển thị các trang xung quanh trang hiện tại -->
            <li v-for="page in visiblePages" :key="page" class="page-item" :class="{ active: page === currentPage }">
              <button class="page-link" @click="goToPage(page)">{{ page }}</button>
            </li>

            <!-- Hiển thị trang cuối -->
            <li v-if="currentPage < totalPages - 3" class="page-item disabled">
              <span class="page-link">...</span>
            </li>
            <li v-if="currentPage < totalPages - 2" class="page-item">
              <button class="page-link" @click="goToPage(totalPages)">{{ totalPages }}</button>
            </li>

            <li class="page-item" :class="{ disabled: currentPage === totalPages }">
              <button class="page-link" @click="goToPage(currentPage + 1)"
                :disabled="currentPage === totalPages">Sau</button>
            </li>
          </ul>
        </nav>
      </div>

      <!-- modal-like overlay for create/edit -->
      <div v-if="showForm"
        class="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
        style="background: rgba(0,0,0,0.4); z-index:1050; padding: 20px;">
        <div class="card p-3 p-md-4" style="width: 100%; max-width: 600px;">
          <h5 class="mb-3" style="font-size: 1.1rem;">{{ editing ? 'Sửa phiên bản sách' : 'Thêm phiên bản sách' }}
          </h5>
          <form @submit.prevent="save">
            <!-- Select BookTitle -->
            <div class="mb-3">
              <label class="form-label">Đầu sách *</label>
              <select class="form-select" v-model="form.bookTitle" required :disabled="editing">
                <option value="">-- Chọn đầu sách --</option>
                <option v-for="title in bookTitles" :key="title._id" :value="title._id">
                  {{ title.title }} ({{ title.author }})
                </option>
              </select>
            </div>

            <!-- Volume -->
            <div class="mb-3">
              <label class="form-label">Số tập/Volume</label>
              <input class="form-control" v-model.number="form.volume" type="number" placeholder="Ví dụ: 1, 2, 3..." />
            </div>

            <!-- Publisher -->
            <div class="mb-3">
              <label class="form-label">Nhà xuất bản *</label>
              <select class="form-select" v-model="form.publisher" required>
                <option value="">-- Chọn nhà xuất bản --</option>
                <option v-for="p in publishers" :key="p._id" :value="p._id">{{ p.tenNXB }}</option>
              </select>
            </div>

            <!-- Year -->
            <div class="mb-3">
              <label class="form-label">Năm xuất bản</label>
              <select class="form-select" v-model.number="form.year">
                <option value="">-- Chọn năm --</option>
                <option v-for="year in yearOptions" :key="year" :value="year">{{ year }}</option>
              </select>
            </div>

            <!-- Language -->
            <div class="mb-3">
              <label class="form-label">Ngôn ngữ</label>
              <select class="form-select" v-model="form.language">
                <option value="">-- Chọn ngôn ngữ --</option>
                <option value="Tiếng Việt">Tiếng Việt</option>
                <option value="Tiếng Anh">Tiếng Anh</option>
                <option value="Tiếng Pháp">Tiếng Pháp</option>
                <option value="Tiếng Nhật">Tiếng Nhật</option>
                <option value="Tiếng Trung">Tiếng Trung</option>
                <option value="Tiếng Hàn">Tiếng Hàn</option>
                <option value="Tiếng Đức">Tiếng Đức</option>
                <option value="Tiếng Tây Ban Nha">Tiếng Tây Ban Nha</option>
              </select>
            </div>

            <!-- Quantity and Price in row -->
            <div class="row g-2">
              <div class="col-12 col-sm-6 mb-3">
                <label class="form-label">Số quyển *</label>
                <input class="form-control" v-model.number="form.soQuyen" type="number" placeholder="Số lượng"
                  required />
              </div>
              <div class="col-12 col-sm-6 mb-3">
                <label class="form-label">Đơn giá (VNĐ)</label>
                <input class="form-control" v-model.number="form.donGia" type="number" placeholder="Giá tiền" />
              </div>
            </div>

            <!-- Cover Image Upload (for both create and edit) -->
            <div class="mb-3">
              <label class="form-label">Ảnh bìa</label>
              <div v-if="form.coverImage && editing" class="mb-2 d-flex align-items-center gap-2">
                <span class="text-muted">{{ getImageFileName(form.coverImage) }}</span>
                <button type="button" class="btn btn-sm btn-danger" @click="deleteCover" title="Xóa ảnh bìa">
                  ✕
                </button>
              </div>
              <input type="file" class="form-control" accept="image/*" @change="handleFileSelect" ref="fileInput">
              <small class="text-muted">Chọn ảnh bìa cho quyển sách này (tối đa 5MB)</small>
            </div>

            <div class="d-grid gap-2 d-sm-flex justify-content-sm-end">
              <button type="button" class="btn btn-secondary btn-sm" @click="closeForm">Hủy</button>
              <button type="submit" class="btn btn-primary btn-sm">{{ editing ? 'Cập nhật' : 'Thêm' }}</button>
            </div>
          </form>
        </div>
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
      books: [],
      bookTitles: [],
      publishers: [],
      // UI state for search/filter/sort
      searchTerm: '',
      showFilter: false,
      filterPublisherId: '',
      filterYear: null,
      sortAlpha: 'none', // 'none' | 'asc' | 'desc'
      // Pagination
      currentPage: 1,
      itemsPerPage: 10,
      showForm: false,
      editing: false,
      selectedFile: null,
      form: {
        bookTitle: '',
        volume: null,
        publisher: '',
        year: null,
        language: 'Tiếng Việt',
        soQuyen: 1,
        donGia: null,
        coverImage: null
      }
    }
  },
  created() { this.load(); this.loadPublishers(); this.loadBookTitles() },
  computed: {
    filteredBooks() {
      let list = Array.isArray(this.books) ? [...this.books] : []
      const term = (this.searchTerm || '').trim().toLowerCase()
      if (term) {
        list = list.filter(b => {
          const title = (b.bookTitle?.title || b.title || '').toLowerCase()
          const author = (b.bookTitle?.author || b.author || '').toLowerCase()
          return title.includes(term) || author.includes(term)
        })
      }
      if (this.filterPublisherId) {
        list = list.filter(b => {
          const pid = b.publisher ? (b.publisher._id || b.publisher) : ''
          return String(pid) === String(this.filterPublisherId)
        })
      }
      if (this.filterYear) {
        list = list.filter(b => Number(b.year) === Number(this.filterYear))
      }
      if (this.sortAlpha === 'asc') {
        list.sort((a, b) => (a.bookTitle?.title || a.title || '').localeCompare(b.bookTitle?.title || b.title || '', 'vi'))
      } else if (this.sortAlpha === 'desc') {
        list.sort((a, b) => (b.bookTitle?.title || b.title || '').localeCompare(a.bookTitle?.title || a.title || '', 'vi'))
      }
      return list
    },
    displayedBooks() {
      const startIndex = (this.currentPage - 1) * this.itemsPerPage
      const endIndex = startIndex + this.itemsPerPage
      return this.filteredBooks.slice(startIndex, endIndex)
    },
    totalPages() {
      return Math.ceil(this.filteredBooks.length / this.itemsPerPage)
    },
    visiblePages() {
      const pages = []
      const total = this.totalPages
      const current = this.currentPage

      // Luôn hiển thị trang hiện tại và 1 trang trước/sau nó
      const start = Math.max(1, current - 1)
      const end = Math.min(total, current + 1)

      for (let i = start; i <= end; i++) {
        pages.push(i)
      }

      return pages
    },
    alphaTitle() {
      if (this.sortAlpha === 'none') return 'Sắp xếp theo chữ cái: Mặc định'
      if (this.sortAlpha === 'asc') return 'Sắp xếp theo chữ cái: A→Z'
      return 'Sắp xếp theo chữ cái: Z→A'
    },
    yearOptions() {
      const currentYear = new Date().getFullYear()
      const years = []
      for (let i = currentYear; i >= 1900; i--) {
        years.push(i)
      }
      return years
    }
  },
  methods: {
    // set alphabetical sort explicitly
    setAlphaAsc() { this.sortAlpha = 'asc' },
    setAlphaDesc() { this.sortAlpha = 'desc' },
    goToPage(page) {
      if (page >= 1 && page <= this.totalPages) {
        this.currentPage = page
      }
    },
    async load() {
      try {
        const r = await api.get('/books')
        this.books = r.data.books || r.data || []
      } catch (e) {
        this.showError('Lỗi khi tải sách: ' + (e.response?.data?.message || e.message))
      }
    },
    async loadBookTitles() {
      try {
        const r = await api.get('/booktitles')
        this.bookTitles = r.data.bookTitles || []
      } catch (e) {
        console.error('Không thể tải book titles', e)
      }
    },
    toggleFilter() { this.showFilter = !this.showFilter },
    applyFilters() { /* computed displayedBooks reacts automatically */ },
    clearFilters() { this.searchTerm = ''; this.filterPublisherId = ''; this.filterYear = null; this.sortAlpha = 'none' },
    fmtPrice(v) {
      if (v == null || v === '') return '-'
      try { return Number(v).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' }) } catch (e) { return v }
    },
    fmtDate(d) {
      if (!d) return ''
      try { return new Date(d).toLocaleString() } catch (e) { return d }
    },
    getCoverImageUrl(coverImage) {
      if (!coverImage) return ''
      if (coverImage.startsWith('http://') || coverImage.startsWith('https://')) {
        return coverImage
      }
      return `http://localhost:4000${coverImage}`
    },
    getImageFileName(coverImage) {
      if (!coverImage) return ''
      // Extract filename from path like /uploads/books/book-1234567890.jpg
      const parts = coverImage.split('/')
      return parts[parts.length - 1]
    },
    async loadPublishers() {
      try {
        const r = await api.get('/publishers')
        this.publishers = r.data
      } catch (e) {
        console.error('Không thể tải publishers', e)
      }
    },
    openCreate() {
      this.editing = false
      this.selectedFile = null
      this.form = {
        bookTitle: '',
        volume: null,
        publisher: '',
        year: null,
        language: 'Tiếng Việt',
        soQuyen: 1,
        donGia: null,
        coverImage: null
      }
      if (this.$refs.fileInput) {
        this.$refs.fileInput.value = ''
      }
      this.showForm = true
    },
    openEdit(b) {
      this.editing = true
      this.selectedFile = null
      this.form = {
        bookTitle: b.bookTitle?._id || b.bookTitle,
        volume: b.volume,
        publisher: b.publisher?._id || b.publisher,
        year: b.year,
        language: b.language,
        soQuyen: b.soQuyen,
        donGia: b.donGia,
        coverImage: b.coverImage || null,
        _id: b._id
      }
      if (this.$refs.fileInput) {
        this.$refs.fileInput.value = ''
      }
      this.showForm = true
    },
    closeForm() {
      this.showForm = false
    },
    async save() {
      try {
        const payload = {
          bookTitle: this.form.bookTitle,
          volume: this.form.volume || null,
          publisher: this.form.publisher,
          year: this.form.year,
          language: this.form.language,
          soQuyen: this.form.soQuyen,
          donGia: this.form.donGia
        }

        let bookId = this.form._id

        if (this.editing) {
          await api.put('/books/' + this.form._id, payload)
        } else {
          const response = await api.post('/books', payload)
          bookId = response.data._id
        }

        // Upload file if selected
        if (this.selectedFile && bookId) {
          const formData = new FormData()
          formData.append('cover', this.selectedFile)
          await api.post(`/books/${bookId}/cover`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          })
        }

        this.showForm = false
        this.selectedFile = null
        if (this.$refs.fileInput) {
          this.$refs.fileInput.value = ''
        }
        this.showSuccess(this.editing ? 'Cập nhật sách thành công' : 'Thêm sách mới thành công')
        await this.load()
      } catch (e) {
        // Show info notification for duplicate book
        if (e.response?.status === 400 && e.response?.data?.message?.includes('tồn tại')) {
          this.showInfo(e.response.data.message)
        } else {
          this.showError(e.response?.data?.message || e.message)
        }
      }
    },
    handleFileSelect(event) {
      const file = event.target.files[0]
      if (file) {
        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
          this.showError('File quá lớn! Vui lòng chọn file dưới 5MB')
          event.target.value = ''
          return
        }
        this.selectedFile = file
      }
    },
    async deleteCover() {
      const confirmed = await this.showConfirm('Bạn có chắc muốn xóa ảnh bìa này?')
      if (!confirmed) return

      try {
        // If editing existing book, delete from server
        if (this.editing && this.form._id) {
          await api.delete(`/books/${this.form._id}/cover`)
          this.showSuccess('Đã xóa ảnh bìa thành công')
          await this.load()
        }

        // Clear form data
        this.form.coverImage = null
        this.selectedFile = null
        if (this.$refs.fileInput) {
          this.$refs.fileInput.value = ''
        }
      } catch (e) {
        this.showError('Lỗi khi xóa ảnh bìa: ' + (e.response?.data?.message || e.message))
      }
    },
    async del(id) {
      const confirmed = await this.showConfirm('Xác nhận xóa sách này?')
      if (!confirmed) return
      try {
        await api.delete('/books/' + id)
        this.showSuccess('Đã xóa sách thành công')
        this.load()
      } catch (e) {
        this.showError('Lỗi khi xóa: ' + (e.response?.data?.message || e.message))
      }
    }
  },
  watch: {
    // Reset trang về 1 khi filters thay đổi
    searchTerm() {
      this.currentPage = 1
    },
    filterPublisherId() {
      this.currentPage = 1
    },
    filterYear() {
      this.currentPage = 1
    },
    sortAlpha() {
      this.currentPage = 1
    }
  }
}
</script>

<style scoped>
/* small style adjustments for modal card */
.card {
  border-radius: 6px
}

/* hide spinner arrows on number inputs for a cleaner UI */
input[type=number]::-webkit-outer-spin-button,
input[type=number]::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

input[type=number] {
  -moz-appearance: textfield;
}
</style>
