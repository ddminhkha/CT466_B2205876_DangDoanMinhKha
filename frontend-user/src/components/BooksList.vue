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
                            <input v-model="searchQuery" type="text" class="form-control mb-3"
                                placeholder="Tên sách, tác giả..." @input="handleSearch">
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

                            <!-- Publisher Filter Dropdown -->
                            <div class="mb-3">
                                <label class="form-label fw-bold">Nhà Xuất Bản</label>
                                <select v-model="selectedPublisher" class="form-select form-select-sm">
                                    <option value="">-- Tất cả --</option>
                                    <option v-for="pub in publishers" :key="pub" :value="pub">
                                        {{ pub }}
                                    </option>
                                </select>
                            </div>

                            <!-- Category Filter Dropdown -->
                            <div class="mb-3">
                                <label class="form-label fw-bold">Thể Loại</label>
                                <select v-model="selectedCategory" class="form-select form-select-sm">
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

                            <!-- Year Filter Dropdown -->
                            <div class="mb-3">
                                <label class="form-label fw-bold">Năm Xuất Bản</label>
                                <select v-model.number="selectedYear" class="form-select form-select-sm">
                                    <option value="">-- Tất cả --</option>
                                    <option v-for="year in yearOptions" :key="year" :value="year">
                                        {{ year }}
                                    </option>
                                </select>
                            </div>

                            <!-- Status Filter Radio -->
                            <div>
                                <label class="form-label fw-bold">Tình Trạng</label>
                                <div class="form-check">
                                    <input v-model="statusFilter" class="form-check-input" type="radio" value="all"
                                        id="status-all">
                                    <label class="form-check-label" for="status-all">
                                        Tất Cả
                                    </label>
                                </div>
                                <div class="form-check">
                                    <input v-model="statusFilter" class="form-check-input" type="radio"
                                        value="available" id="status-available">
                                    <label class="form-check-label" for="status-available">
                                        Sẵn Có
                                    </label>
                                </div>
                                <div class="form-check">
                                    <input v-model="statusFilter" class="form-check-input" type="radio" value="borrowed"
                                        id="status-borrowed">
                                    <label class="form-check-label" for="status-borrowed">
                                        Đang Mượn
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Main Content -->
                <div class="col-lg-9 order-lg-2 order-1">
                    <!-- Loading State -->
                    <div v-if="loading" class="text-center py-5">
                        <div class="spinner-border text-primary" role="status">
                            <span class="visually-hidden">Đang tải...</span>
                        </div>
                        <p class="mt-3 text-muted">Đang tải danh sách sách...</p>
                    </div>

                    <!-- Empty State -->
                    <div v-else-if="filteredBooks.length === 0" class="text-center py-5">
                        <i class="bi bi-inbox h1 text-muted"></i>
                        <h4 class="mt-3 text-muted">Không tìm thấy sách nào</h4>
                        <p class="text-muted mb-3">Hãy thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
                        <button @click="clearFilters" class="btn btn-primary">
                            <i class="bi bi-arrow-clockwise"></i> Xóa Bộ Lọc
                        </button>
                    </div>

                    <!-- Books Grid -->
                    <div v-else>
                        <div class="d-flex justify-content-between align-items-center mb-4">
                            <p class="text-muted mb-0">
                                <i class="bi bi-info-circle"></i> Hiển thị {{ filteredBooks.length }} cuốn sách
                            </p>
                            <div>
                                <select v-model="sortBy" class="form-select form-select-sm" style="width: auto;">
                                    <option value="name">Sắp xếp: Tên A-Z</option>
                                    <option value="author">Sắp xếp: Tác Giả</option>
                                    <option value="newest">Sắp xếp: Mới Nhất</option>
                                </select>
                            </div>
                        </div>

                        <!-- Books Grid -->
                        <div class="row g-3">
                            <div v-for="book in sortedBooks" :key="book._id" class="col-12 col-sm-6 col-lg-4">
                                <div class="card shadow-sm border-0 h-100 book-card">
                                    <img v-if="book.coverImage" :src="getCoverImageUrl(book.coverImage)"
                                        class="card-img-top" :alt="book.bookTitle?.title"
                                        style="height: 350px; object-fit: contain; background-color: #f8f9fa;">
                                    <div v-else
                                        class="card-img-top bg-light d-flex align-items-center justify-content-center"
                                        style="height: 350px;">
                                        <i class="bi bi-book text-muted" style="font-size: 4rem;"></i>
                                    </div>
                                    <div class="card-body pt-3">
                                        <h5 class="card-title fw-bold mb-2"
                                            :title="book.bookTitle?.title || book.title">
                                            {{ truncateText(book.bookTitle?.title || book.title || '', 80) }}
                                        </h5>
                                        <p class="card-text text-muted small mb-2">
                                            <i class="bi bi-pencil-square"></i>
                                            {{ book.bookTitle?.author || book.author || 'N/A' }}
                                        </p>
                                        <p class="card-text text-muted small mb-2">
                                            <i class="bi bi-building"></i>
                                            {{ book.publisher?.tenNXB || book.nhaXuatBan || 'N/A' }}
                                        </p>

                                        <div class="mb-2">
                                            <span v-if="(book.availableQuantity || 0) > 0" class="badge bg-success">
                                                <i class="bi bi-check-circle"></i> Sẵn Có ({{ book.availableQuantity ||
                                                    0 }})
                                            </span>
                                            <span v-else class="badge bg-warning">
                                                <i class="bi bi-hourglass-split"></i> Hết Sách
                                            </span>
                                        </div>

                                        <div class="small mb-3">
                                            <p class="mb-1" v-if="book.volume">
                                                <strong>Tập:</strong> {{ book.volume }}
                                            </p>
                                            <p class="mb-1">
                                                <strong>Năm XB:</strong> {{ book.year || 'N/A' }}
                                            </p>
                                            <p class="mb-1">
                                                <strong>Giá:</strong> {{ (book.donGia || 0).toLocaleString('vi-VN') }} đ
                                            </p>
                                            <p class="mb-1" v-if="book.language">
                                                <strong>Ngôn ngữ:</strong> {{ book.language }}
                                            </p>
                                        </div>
                                    </div>

                                    <div class="card-footer bg-white border-top d-flex flex-column flex-sm-row gap-2">
                                        <button @click="openDescription(book)"
                                            class="btn btn-sm btn-outline-info flex-grow-1">
                                            <i class="bi bi-info-circle me-1"></i><span class="d-none d-sm-inline">Xem
                                                Mô Tả</span><span class="d-sm-none">Mô Tả</span>
                                        </button>
                                        <button v-if="user" @click="addToBorrow(book)"
                                            class="btn btn-sm btn-primary flex-grow-1"
                                            :disabled="isButtonDisabled(book)">
                                            <span v-if="getButtonState(book._id) === 'added'"
                                                class="d-flex align-items-center justify-content-center">
                                                <i class="bi bi-check-circle me-1"></i><span
                                                    class="d-none d-sm-inline">Đã Thêm</span><span
                                                    class="d-sm-none">✓</span>
                                            </span>
                                            <span v-else-if="getButtonState(book._id) === 'borrowed'"
                                                class="d-flex align-items-center justify-content-center">
                                                <i class="bi bi-check2-all me-1"></i><span class="d-none d-sm-inline">Đã
                                                    Mượn</span><span class="d-sm-none">✓✓</span>
                                            </span>
                                            <span v-else class="d-flex align-items-center justify-content-center">
                                                <i class="bi bi-plus-circle me-1"></i><span
                                                    class="d-none d-sm-inline">Đăng Ký</span><span
                                                    class="d-sm-none">+</span>
                                            </span>
                                        </button>
                                        <router-link v-else to="/login" class="btn btn-sm btn-primary flex-grow-1">
                                            <i class="bi bi-box-arrow-in-right"></i><span
                                                class="d-none d-sm-inline">Đăng Nhập</span>
                                        </router-link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Description Modal -->
        <div v-if="selectedBook"
            class="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
            style="background: rgba(0,0,0,0.5); z-index:1050;">
            <div class="card p-4" style="width:500px; max-width:95%;">
                <div class="d-flex justify-content-between align-items-start mb-3">
                    <div>
                        <h5 class="card-title fw-bold mb-1">{{ selectedBook.bookTitle?.title }}</h5>
                        <p class="text-muted small mb-0">{{ selectedBook.bookTitle?.author }}</p>
                    </div>
                    <button @click="selectedBook = null" class="btn-close"></button>
                </div>
                <hr>
                <div class="mb-3">
                    <p v-if="selectedBook.bookTitle?.description" class="text-justify">
                        {{ selectedBook.bookTitle.description }}
                    </p>
                    <p v-else class="text-muted text-center">Chưa có mô tả cho sách này</p>
                </div>
                <div class="text-muted small mb-3">
                    <p class="mb-1" v-if="selectedBook.bookTitle?.category">
                        <strong>Thể loại:</strong> {{ selectedBook.bookTitle.category }}
                    </p>
                    <p class="mb-1">
                        <strong>Nhà xuất bản:</strong> {{ selectedBook.publisher?.tenNXB || 'N/A' }}
                    </p>
                    <p class="mb-1">
                        <strong>Năm xuất bản:</strong> {{ selectedBook.year || 'N/A' }}
                    </p>
                    <p class="mb-1">
                        <strong>Giá:</strong> {{ (selectedBook.donGia || 0).toLocaleString('vi-VN') }} đ
                    </p>
                </div>
                <button @click="selectedBook = null" class="btn btn-secondary w-100">Đóng</button>
            </div>
        </div>
    </div>
</template>

<script>
import api from '../services/api'
import { useNotifications } from '../composables/useNotifications'
import { useConfirmDialog } from '../composables/useConfirmDialog'

export default {
    name: 'BooksPage',
    setup() {
        const { showError, showSuccess, showWarning } = useNotifications()
        const { showConfirm } = useConfirmDialog()
        return { showError, showSuccess, showWarning, showConfirm }
    },
    data() {
        return {
            books: [],
            user: null,
            loading: true,
            searchQuery: '',
            selectedPublishers: [],
            selectedPublisher: '',
            selectedCategory: '',
            selectedYear: '',
            statusFilter: 'all',
            sortBy: 'name',
            publishers: [],
            borrowCart: [],
            activeBookCount: 0,
            borrowedBooks: {},  // { bookId: 'added'|'borrowed'|null }
            submitting: {},  // { bookId: isSubmitting }
            pollInterval: null,  // Interval ID for polling activeCount
            selectedBook: null  // Currently viewing book description
        }
    },
    computed: {
        yearOptions() {
            const years = []
            const currentYear = new Date().getFullYear()
            for (let i = currentYear; i >= 1900; i--) {
                years.push(i)
            }
            return years
        },
        filteredBooks() {
            let filtered = this.books

            // Search filter
            if (this.searchQuery.trim()) {
                const query = this.searchQuery.toLowerCase()
                filtered = filtered.filter(book => {
                    const title = (book.bookTitle?.title || book.title || '').toLowerCase()
                    const author = (book.bookTitle?.author || book.author || '').toLowerCase()
                    const publisher = (book.nhaXuatBan || '').toLowerCase()
                    return title.includes(query) || author.includes(query) || publisher.includes(query)
                })
            }

            // Publisher filter (dropdown)
            if (this.selectedPublisher) {
                filtered = filtered.filter(book => {
                    const pubName = book.publisher?.tenNXB || book.nhaXuatBan || ''
                    return pubName === this.selectedPublisher
                })
            }

            // Category filter (dropdown)
            if (this.selectedCategory) {
                filtered = filtered.filter(book => {
                    const category = book.bookTitle?.category || ''
                    return category === this.selectedCategory
                })
            }

            // Year filter (dropdown)
            if (this.selectedYear) {
                filtered = filtered.filter(book => {
                    return book.year === this.selectedYear
                })
            }

            // Status filter
            if (this.statusFilter === 'available') {
                filtered = filtered.filter(book => (book.soQuyen || 0) > 0)
            } else if (this.statusFilter === 'borrowed') {
                filtered = filtered.filter(book => (book.soQuyen || 0) === 0)
            }

            return filtered
        },
        sortedBooks() {
            const books = [...this.filteredBooks]

            if (this.sortBy === 'name') {
                const aTitle = a => a.bookTitle?.title || a.title || ''
                const bTitle = b => b.bookTitle?.title || b.title || ''
                return books.sort((a, b) => aTitle(a).localeCompare(bTitle(b), 'vi'))
            } else if (this.sortBy === 'author') {
                const aAuthor = a => a.bookTitle?.author || a.author || ''
                const bAuthor = b => b.bookTitle?.author || b.author || ''
                return books.sort((a, b) => aAuthor(a).localeCompare(bAuthor(b), 'vi'))
            } else if (this.sortBy === 'newest') {
                return books.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
            }

            return books
        }
    },
    mounted() {
        this.loadUser()
        this.loadBooks()

        // Only load borrow cart and active count if user is logged in
        if (this.user) {
            this.loadBorrowCart()
            this.loadActiveCount()
            // Poll activeCount every 10 seconds to detect when books are returned
            this.pollInterval = setInterval(() => {
                if (this.user) {
                    this.loadActiveCount()
                }
            }, 10000)
        }
    },
    beforeUnmount() {
        if (this.pollInterval) {
            clearInterval(this.pollInterval)
        }
    },
    watch: {
        '$route': {
            handler() {
                // Reload khi quay lại từ trang BorrowRegister hoặc UserLoans
                if (this.user) {
                    this.loadActiveCount()
                    this.loadBorrowCart()
                }
            }
        }
    },
    methods: {
        loadUser() {
            try {
                this.user = JSON.parse(localStorage.getItem('user') || 'null')
            } catch (e) {
                this.user = null
            }
        },
        async loadBooks() {
            try {
                this.loading = true
                const response = await api.get('/books')
                this.books = response.data.books || []

                // Extract unique publishers
                const pubSet = new Set()
                this.books.forEach(book => {
                    if (book.publisher?.tenNXB) {
                        pubSet.add(book.publisher.tenNXB)
                    } else if (book.nhaXuatBan) {
                        pubSet.add(book.nhaXuatBan)
                    }
                })
                this.publishers = Array.from(pubSet).sort()
            } catch (error) {
                console.error('Lỗi khi tải danh sách sách:', error)
            } finally {
                this.loading = false
            }
        },
        async loadActiveCount() {
            try {
                const response = await api.get('/loans/me/active-count')
                const newActiveCount = response.data.activeCount || 0

                // Nếu activeCount giảm, có nghĩa là user đã trả sách
                // Clear borrowedBooks và reload
                if (newActiveCount < this.activeBookCount) {
                    localStorage.removeItem('borrowedBooks')
                    this.borrowedBooks = {}
                }

                this.activeBookCount = newActiveCount

                // Also check if any borrowed books were rejected/cancelled
                this.checkRejectedLoans()
            } catch (error) {
                console.error('Lỗi khi tải số sách đang mượn:', error)
            }
        },
        async checkRejectedLoans() {
            try {
                const response = await api.get('/loans/me')
                const loans = response.data || []

                const borrowedBooks = JSON.parse(localStorage.getItem('borrowedBooks') || '{}')
                let changed = false

                // Check if any books in borrowedBooks are in rejected/cancelled/returned loans
                for (const bookId in borrowedBooks) {
                    if (borrowedBooks[bookId] === 'borrowed' || borrowedBooks[bookId] === 'added') {
                        // Check if this book is in any active (non-terminal) loan
                        let foundInActiveLoan = false

                        for (const loan of loans) {
                            // Skip terminal state loans (rejected, cancelled, returned)
                            if (['rejected', 'cancelled', 'returned'].includes(loan.status)) {
                                continue
                            }

                            // Check if bookId is in this loan
                            if (loan.books && Array.isArray(loan.books)) {
                                const bookIdInLoan = loan.books.some(b => b._id === bookId || b === bookId)
                                if (bookIdInLoan) {
                                    foundInActiveLoan = true
                                    break
                                }
                            }
                        }

                        // If book is not in any active loan, remove it from borrowedBooks
                        if (!foundInActiveLoan) {
                            delete borrowedBooks[bookId]
                            changed = true
                        }
                    }
                }

                if (changed) {
                    localStorage.setItem('borrowedBooks', JSON.stringify(borrowedBooks))
                    this.borrowedBooks = borrowedBooks
                }
            } catch (error) {
                console.error('Lỗi khi kiểm tra loans bị từ chối:', error)
            }
        },
        loadBorrowCart() {
            try {
                this.borrowCart = JSON.parse(localStorage.getItem('borrowCart') || '[]')
                const borrowedBooks = JSON.parse(localStorage.getItem('borrowedBooks') || '{}')
                // Nếu borrowedBooks trống, khởi tạo từ borrowCart
                if (Object.keys(borrowedBooks).length === 0) {
                    this.borrowCart.forEach(book => {
                        borrowedBooks[book._id] = 'added'
                    })
                }
                this.borrowedBooks = borrowedBooks
            } catch (e) {
                this.borrowCart = []
            }
        },
        handleSearch() {
            // Search is handled by computed property
        },
        togglePublisher(publisher) {
            const index = this.selectedPublishers.indexOf(publisher)
            if (index > -1) {
                this.selectedPublishers.splice(index, 1)
            } else {
                this.selectedPublishers.push(publisher)
            }
        },
        clearFilters() {
            this.searchQuery = ''
            this.selectedPublishers = []
            this.selectedPublisher = ''
            this.selectedCategory = ''
            this.selectedYear = ''
            this.statusFilter = 'all'
            this.sortBy = 'name'
        },
        addToBorrow(book) {
            if (this.isButtonDisabled(book)) return

            const currentState = this.getButtonState(book._id)

            if (currentState === 'added') {
                // Nếu đã thêm, hỏi user có muốn bỏ khỏi giỏ không
                this.showConfirm({
                    title: 'Xóa khỏi giỏ',
                    message: 'Bỏ sách này khỏi giỏ mượn?',
                    confirmText: 'Xóa',
                    type: 'danger'
                }).then(confirmed => {
                    if (confirmed) {
                        this.borrowCart = this.borrowCart.filter(b => b._id !== book._id)
                        this.borrowedBooks[book._id] = null
                        localStorage.setItem('borrowCart', JSON.stringify(this.borrowCart))
                        localStorage.setItem('borrowedBooks', JSON.stringify(this.borrowedBooks))
                        this.showSuccess('Đã xóa sách khỏi giỏ mượn')
                    }
                })
            } else if (currentState === 'borrowed') {
                // Nếu đã mượn, không làm gì
                return
            } else {
                // Thêm vào giỏ
                const totalBooks = this.activeBookCount + this.borrowCart.length
                if (totalBooks >= 3) {
                    this.showWarning('Bạn đã đạt giới hạn mượn 3 quyển. Vui lòng trả sách trước khi mượn sách khác.')
                    return
                }

                this.borrowCart.push(book)
                this.borrowedBooks[book._id] = 'added'
                localStorage.setItem('borrowCart', JSON.stringify(this.borrowCart))
                localStorage.setItem('borrowedBooks', JSON.stringify(this.borrowedBooks))
                this.showSuccess('Đã thêm sách vào giỏ mượn')
            }
        },
        isButtonDisabled(book) {
            const state = this.getButtonState(book._id)

            // Disable nếu sách hết
            if ((book.soQuyen || 0) === 0) return true

            // Disable nếu đã mượn
            if (state === 'borrowed') return true

            // Disable nếu user đã mượn 3 sách (và sách này chưa thêm vào giỏ)
            if (state !== 'added' && this.activeBookCount >= 3) return true

            return false
        },
        getButtonState(bookId) {
            return this.borrowedBooks[bookId] || null
        },
        selectBookForBorrow(book) {
            // Store selected book for borrow register
            sessionStorage.setItem('selectedBook', JSON.stringify(book))
        },
        truncateText(text, length) {
            return text.length > length ? text.substring(0, length) + '...' : text
        },
        openDescription(book) {
            this.selectedBook = book
        },
        getCoverImageUrl(coverImage) {
            if (!coverImage) return ''
            if (coverImage.startsWith('http://') || coverImage.startsWith('https://')) {
                return coverImage
            }
            return `http://localhost:4000${coverImage}`
        }
    }
}
</script>

<style scoped>
.books-page {
    background-color: #f8f9fa;
    min-height: calc(100vh - 200px);
    padding: 20px 0;
}

.book-card {
    transition: all 0.3s ease;
    overflow: hidden;
}

.book-card:hover {
    transform: translateY(-8px);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15) !important;
}

.book-cover-container {
    border-bottom: 1px solid #f0f0f0;
    position: relative;
}

.book-card .card-title {
    font-size: 1rem;
    line-height: 1.3;
}

.book-card .card-footer {
    background-color: #f8f9fa !important;
}

.badge {
    font-size: 0.85rem;
    padding: 0.5rem 0.75rem;
}

@media (max-width: 768px) {
    .book-card {
        margin-bottom: 1.5rem;
    }
}
</style>
