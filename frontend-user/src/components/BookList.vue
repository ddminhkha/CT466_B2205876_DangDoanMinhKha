<template>
  <div class="books-page">
    <div class="container">
      <div class="row g-3">
        <!-- Sidebar -->
        <div class="col-lg-3 mb-4 order-lg-1 order-2">
          <div class="card shadow-sm border-0 mb-3">
            <div class="card-body">
              <h5 class="card-title fw-bold mb-3">
                <i class="bi bi-search"></i> Tìm Kiếm
              </h5>
              <input v-model="q" type="text" class="form-control mb-3" placeholder="Tên sách, tác giả..." @input="search">
              <button @click="clearFilters" class="btn btn-sm btn-outline-secondary w-100">
                <i class="bi bi-x"></i> Xóa Bộ Lọc
              </button>
            </div>
          </div>

          <div class="card shadow-sm border-0">
            <div class="card-body">
              <h5 class="card-title fw-bold mb-3">
                <i class="bi bi-funnel"></i> Bộ Lọc
              </h5>

              <!-- Publisher Filter -->
              <div class="mb-3">
                <label class="form-label fw-bold">Nhà Xuất Bản</label>
                <select v-model="selectedPublisher" class="form-select form-select-sm" @change="applyFilters">
                  <option value="">-- Tất cả --</option>
                  <option v-for="pub in publishers" :key="pub" :value="pub">{{ pub }}</option>
                </select>
              </div>

              <!-- Category Filter -->
              <div class="mb-3">
                <label class="form-label fw-bold">Thể Loại</label>
                <select v-model="selectedCategory" class="form-select form-select-sm" @change="applyFilters">
                  <option value="">-- Tất cả --</option>
                  <option value="Tiểu thuyết">Tiểu thuyết</option>
                  <option value="Truyện tranh">Truyện tranh</option>
                  <option value="Khoa học viễn tưởng">Khoa học viễn tưởng</option>
                  <option value="Tâm lý">Tâm lý</option>
                  <option value="Kinh tế">Kinh tế</option>
                  <option value="Lịch sử">Lịch sử</option>
                  <option value="Tôn giáo">Tôn giáo</option>
                  <option value="Tự truyện">Tự truyện</option>
                  <option value="Dạy dỗ">Dạy dỗ</option>
                  <option value="Hư cấu">Hư cấu</option>
                  <option value="Công nghệ">Công nghệ</option>
                </select>
              </div>

              <!-- Year Filter -->
              <div class="mb-3">
                <label class="form-label fw-bold">Năm Xuất Bản</label>
                <select v-model.number="selectedYear" class="form-select form-select-sm" @change="applyFilters">
                  <option value="">-- Tất cả --</option>
                  <option v-for="year in yearOptions" :key="year" :value="year">{{ year }}</option>
                </select>
              </div>

              <!-- Status Filter -->
              <div>
                <label class="form-label fw-bold">Tình Trạng</label>
                <div class="form-check">
                  <input v-model="statusFilter" class="form-check-input" type="radio" value="all" id="status-all" @change="applyFilters">
                  <label class="form-check-label" for="status-all">Tất Cả</label>
                </div>
                <div class="form-check">
                  <input v-model="statusFilter" class="form-check-input" type="radio" value="available" id="status-available" @change="applyFilters">
                  <label class="form-check-label" for="status-available">Sẵn Có</label>
                </div>
                <div class="form-check">
                  <input v-model="statusFilter" class="form-check-input" type="radio" value="borrowed" id="status-borrowed" @change="applyFilters">
                  <label class="form-check-label" for="status-borrowed">Hết Sách</label>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Main Content -->
        <div class="col-lg-9 order-lg-2 order-1">
          <h2 class="mt-0 mb-3">Danh sách sách</h2>
          
          <!-- Stats and Sort -->
          <div class="d-flex justify-content-between align-items-center mb-4" v-if="books.length > 0">
            <p class="text-muted mb-0">
              <i class="bi bi-info-circle"></i> Hiển thị {{ books.length }} cuốn sách (Trang {{ pagination.page }}/{{ pagination.pages }})
            </p>
            <div>
              <select v-model="sortBy" class="form-select form-select-sm" style="width: auto;" @change="applySort">
                <option value="name">Sắp xếp: Tên A-Z</option>
                <option value="author">Sắp xếp: Tác Giả</option>
                <option value="newest">Sắp xếp: Mới Nhất</option>
              </select>
            </div>
          </div>

          <!-- Grid layout cho sách -->
          <div class="row g-3" v-if="books.length > 0">
            <div class="col-12 col-sm-6 col-lg-4" v-for="b in books" :key="b._id">
              <div class="card shadow-sm border-0 h-100 book-card">
                <img v-if="b.coverImage" :src="getCoverImageUrl(b.coverImage)"
                  class="card-img-top" :alt="b.title"
                  style="height: 280px; object-fit: contain; background-color: #f8f9fa;">
                <div v-else
                  class="card-img-top bg-light d-flex align-items-center justify-content-center"
                  style="height: 280px;">
                  <i class="bi bi-book text-muted" style="font-size: 3rem;"></i>
                </div>
                <div class="card-body d-flex flex-column">
                  <h5 class="card-title fw-bold mb-2" :title="b.title">{{ truncateText(b.title, 50) }}</h5>
                  <p class="card-text text-muted mb-2"><i class="bi bi-pencil-square"></i> {{ b.author }}</p>
                  <p class="card-text"><small class="text-muted"><i class="bi bi-building"></i> {{ b.publisher?.tenNXB || '' }}</small></p>
                  
                  <div class="mb-2">
                    <span v-if="b.soQuyen > 0" class="badge bg-success">
                      <i class="bi bi-check-circle"></i> Sẵn Có ({{ b.soQuyen }})
                    </span>
                    <span v-else class="badge bg-warning">
                      <i class="bi bi-hourglass-split"></i> Hết Sách
                    </span>
                  </div>

                  <div class="mt-auto">
                    <button class="btn btn-sm w-100"
                      :class="(inCart(b._id) || b.userHasActiveLoan || (b.reserved || b.soQuyen <= 0)) ? 'btn-success' : 'btn-outline-primary'"
                      @click="addToCart(b)" :disabled="inCart(b._id) || b.userHasActiveLoan || (b.reserved || b.soQuyen <= 0)">
                      {{ b.userHasActiveLoan ? 'Đã mượn' : ((b.reserved || b.soQuyen <= 0) ? 'Hết sách' : (inCart(b._id) ? 'Đã thêm' : 'Yêu cầu mượn')) }}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Thông báo không có sách -->
          <div v-else class="text-center text-muted py-5">
            <i class="bi bi-inbox h1 text-muted"></i>
            <h4 class="mt-3 text-muted">Không tìm thấy sách nào</h4>
            <p class="text-muted mb-3">Hãy thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
            <button @click="clearFilters" class="btn btn-primary">
              <i class="bi bi-arrow-clockwise"></i> Xóa Bộ Lọc
            </button>
          </div>
          
          <!-- Phân trang -->
          <nav v-if="pagination.pages > 1" class="d-flex justify-content-center mt-4">
            <ul class="pagination">
              <li class="page-item" :class="{ disabled: !pagination.hasPrev }">
                <a class="page-link" href="#" @click.prevent="changePage(pagination.page - 1)">Trước</a>
              </li>
              <li class="page-item" v-for="page in visiblePages" :key="page" :class="{ active: page === pagination.page }">
                <a class="page-link" href="#" @click.prevent="changePage(page)">{{ page }}</a>
              </li>
              <li class="page-item" :class="{ disabled: !pagination.hasNext }">
                <a class="page-link" href="#" @click.prevent="changePage(pagination.page + 1)">Sau</a>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import api from '../services/api'
import { useNotifications } from '../composables/useNotifications'

export default {
  setup() {
    const { showWarning, showSuccess } = useNotifications()
    return { showWarning, showSuccess }
  },
  data() { 
    return { 
      books: [], 
      q: '', 
      cart: [],
      currentPage: 1,
      pagination: {
        page: 1,
        limit: 9,
        total: 0,
        pages: 0,
        hasNext: false,
        hasPrev: false
      },
      publishers: [],
      selectedPublisher: '',
      selectedCategory: '',
      selectedYear: '',
      statusFilter: 'all',
      sortBy: 'name'
    } 
  },
  async created() { await this.load(); this.cart = this.getCart() },
  async activated() {
    // Refresh when navigating back to this component
    await this.load();
    this.cart = this.getCart()
  },
  computed: {
    yearOptions() {
      const years = new Set()
      this.books.forEach(book => {
        if (book.year) years.add(book.year)
      })
      return Array.from(years).sort((a, b) => b - a)
    },
    visiblePages() {
      const pages = []
      const total = this.pagination.pages
      const current = this.pagination.page
      
      // Hiển thị tối đa 5 trang
      let start = Math.max(1, current - 2)
      let end = Math.min(total, current + 2)
      
      // Điều chỉnh nếu không đủ 5 trang
      if (end - start < 4) {
        if (start === 1) {
          end = Math.min(total, start + 4)
        } else {
          start = Math.max(1, end - 4)
        }
      }
      
      for (let i = start; i <= end; i++) {
        pages.push(i)
      }
      
      return pages
    }
  },
  watch: {
    '$route'() {
      // Refresh when route changes
      this.load()
    }
  },
  methods: {
    async load(page = 1) {
      try {
        // Add timestamp to prevent caching
        const timestamp = Date.now()
        // Tạo query parameters với filters
        const params = new URLSearchParams({
          page: page,
          limit: 9,
          _t: timestamp
        })
        
        if (this.q) params.append('q', this.q)
        if (this.selectedPublisher) params.append('publisher', this.selectedPublisher)
        if (this.selectedCategory) params.append('category', this.selectedCategory)
        if (this.selectedYear) params.append('year', this.selectedYear)
        if (this.statusFilter !== 'all') params.append('status', this.statusFilter)
        if (this.sortBy) params.append('sort', this.sortBy)
        
        const res = await api.get(`/books?${params.toString()}`)
        
        if (res.data.pagination) {
          // Paginated API response
          this.books = res.data.books
          this.pagination = res.data.pagination
          this.currentPage = page
          this.extractPublishers(res.data.books)
        } else {
          // Fallback - shouldn't happen with limit=9
          this.books = res.data.books || res.data
          this.extractPublishers(this.books)
          this.pagination = {
            page: 1,
            limit: 9,
            total: (res.data.books || res.data).length,
            pages: 1,
            hasNext: false,
            hasPrev: false
          }
        }
        
        console.log('📚 Books API Response:', this.books.slice(0, 2)) // Log first 2 books for debugging
        console.log('📄 Pagination object:', this.pagination) // Log pagination for debugging
      } catch (error) {
        console.error('Error loading books:', error)
        this.showWarning('Có lỗi khi tải danh sách sách')
      }
    },
    extractPublishers(books) {
      const pubSet = new Set()
      books.forEach(book => {
        if (book.publisher?.tenNXB) {
          pubSet.add(book.publisher.tenNXB)
        }
      })
      this.publishers = Array.from(pubSet).sort()
    },
    async search() { 
      this.currentPage = 1
      await this.load(1) 
    },
    async applyFilters() {
      this.currentPage = 1
      await this.load(1)
    },
    async applySort() {
      await this.load(this.currentPage)
    },
    clearFilters() {
      this.q = ''
      this.selectedPublisher = ''
      this.selectedCategory = ''
      this.selectedYear = ''
      this.statusFilter = 'all'
      this.sortBy = 'name'
      this.applyFilters()
    },
    getCoverImageUrl(imagePath) {
      if (!imagePath) return null
      // Assume images are served from backend
      return `http://localhost:4000/uploads/books/${imagePath.split('/').pop()}`
    },
    truncateText(text, maxLength = 50) {
      if (!text) return ''
      return text.length > maxLength ? text.substr(0, maxLength) + '...' : text
    },
    async changePage(page) {
      if (page < 1 || page > this.pagination.pages || page === this.currentPage) return
      await this.load(page)
      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' })
    },
    getCart() {
      try { return JSON.parse(localStorage.getItem('borrowCart') || '[]') } catch (e) { return [] }
    },
    saveCart(cart) { localStorage.setItem('borrowCart', JSON.stringify(cart)) },
    inCart(id) { return this.cart.some(b => b._id === id) },
    addToCart(book) {
      const token = localStorage.getItem('token')
      if (!token) return this.$router.push('/login')
      // prevent banned users from requesting borrow
      try {
        const u = JSON.parse(localStorage.getItem('user') || 'null')
        if (u && u.status === 'banned') {
          return this.showWarning('Tài khoản của bạn đang bị khoá. Liên hệ với admin để active tài khoản của bạn')
        }
      } catch (e) { }
      if (!this.cart.some(b => b._id === book._id)) {
        this.cart.push({ _id: book._id, title: book.title, author: book.author })
        this.saveCart(this.cart)
        this.showSuccess(`Đã thêm "${book.title}" vào giỏ mượn`)
      }
      // stay on page; cart is reactive so button will update to "Đã thêm"
    },
    removeFromCart(id) { this.cart = this.cart.filter(b => b._id !== id); this.saveCart(this.cart) }
  }
}
</script>

<style scoped>
.books-page {
  padding: 20px 0;
}

.book-card {
  transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
}

.book-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1) !important;
}

.card-img-top {
  border-bottom: 1px solid #dee2e6;
}

.form-label {
  font-size: 0.9rem;
  color: #495057;
}

.badge {
  font-size: 0.75rem;
}

.pagination {
  margin-top: 2rem;
}

.form-check {
  margin-bottom: 0.5rem;
}

.form-check-input {
  margin-top: 0.125rem;
}

.btn-sm {
  font-size: 0.875rem;
}

@media (max-width: 768px) {
  .books-page {
    padding: 10px 0;
  }
  
  .card-img-top {
    height: 200px !important;
  }
  
  .card-title {
    font-size: 1rem;
  }
}
</style>
