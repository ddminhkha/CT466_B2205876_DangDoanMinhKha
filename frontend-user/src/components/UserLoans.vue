<template>
  <div class="container py-2 py-md-4">
    <h3 class="mb-3">Danh sách mượn trả</h3>

    <!-- Form tìm kiếm -->
    <div class="card mb-4">
      <div class="card-body">
        <h5 class="card-title mb-3">
          <i class="bi bi-search"></i> Tìm kiếm & Lọc
        </h5>
        <div class="row g-3">
          <!-- Tìm kiếm theo tên sách -->
          <div class="col-md-4">
            <label for="searchBook" class="form-label">Tên sách/Tác giả</label>
            <input v-model="searchQuery" type="text" class="form-control" id="searchBook"
              placeholder="Nhập tên sách hoặc tác giả..." @input="debounceSearch">
          </div>

          <!-- Lọc theo trạng thái -->
          <div class="col-md-2">
            <label for="statusFilter" class="form-label">Trạng thái</label>
            <select v-model="statusFilter" class="form-select" id="statusFilter" @change="applyFilters">
              <option value="all">Tất cả</option>
              <option value="requested">Yêu cầu</option>
              <option value="approved">Đã duyệt</option>
              <option value="borrowed">Đã mượn</option>
              <option value="overdue">Quá hạn</option>
              <option value="returned">Đã trả</option>
              <option value="rejected">Từ chối</option>
              <option value="cancelled">Đã hủy</option>
            </select>
          </div>

          <!-- Từ ngày -->
          <div class="col-md-2">
            <label for="dateFrom" class="form-label">Từ ngày</label>
            <input v-model="dateFrom" type="date" class="form-control" id="dateFrom" @change="applyFilters">
          </div>

          <!-- Đến ngày -->
          <div class="col-md-2">
            <label for="dateTo" class="form-label">Đến ngày</label>
            <input v-model="dateTo" type="date" class="form-control" id="dateTo" @change="applyFilters">
          </div>

          <!-- Buttons -->
          <div class="col-md-2 d-flex align-items-end gap-2">
            <button @click="applyFilters" class="btn btn-primary btn-sm flex-fill">
              <i class="bi bi-search"></i> Tìm
            </button>
            <button @click="clearFilters" class="btn btn-outline-secondary btn-sm flex-fill">
              <i class="bi bi-x-lg"></i> Xóa
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Thống kê -->
    <div v-if="pagination.total > 0" class="alert alert-info mb-3">
      <i class="bi bi-info-circle me-2"></i>
      Hiển thị {{ loans.length }} trong tổng số {{ pagination.total }} phiếu mượn
      (Trang {{ pagination.page }}/{{ pagination.pages }})
      <span v-if="hasActiveFilters" class="badge bg-warning text-dark ms-2">
        <i class="bi bi-funnel"></i> Đang lọc
      </span>
    </div>

    <div v-if="loans.length === 0 && !loading" class="alert alert-info">
      <i class="bi bi-inbox me-2"></i>
      Bạn chưa có thẻ mượn nào.
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Đang tải...</span>
      </div>
      <p class="mt-3 text-muted">Đang tải danh sách phiếu mượn...</p>
    </div>

    <!-- Danh sách phiếu mượn -->
    <div v-for="loan in loans" :key="loan._id" class="card mb-2 mb-md-3"
      :class="{ 'border-warning': loan.status === 'overdue', 'border-success': loan.status === 'returned' }">
      <div class="card-body pb-2">
        <div class="d-flex flex-column flex-sm-row justify-content-between gap-2">
          <div>
            <strong>Trạng thái:</strong>
            <span class="badge bg-secondary" :class="statusClass(loan.status)">{{ getStatusText(loan.status) }}</span>
          </div>
          <div class="text-start text-sm-end text-muted" style="font-size: 0.9rem;">
            <div v-if="loan.pickupDate && (loan.status === 'requested' || loan.status === 'approved')"
              class="text-warning"><strong>Hẹn lấy: {{ fmt(loan.pickupDate) }}</strong></div>
            <div>Ngày tạo: {{ fmt(loan.create || loan.createdAt) }}</div>
            <div
              v-if="(loan.borrow || loan.borrowDate) && loan.status !== 'requested' && loan.status !== 'rejected' && loan.status !== 'cancelled'">
              Ngày mượn: {{ fmt(loan.borrow || loan.borrowDate) }}</div>
            <div v-if="loan.dueDate && loan.status !== 'rejected' && loan.status !== 'cancelled'">Hẹn trả: {{
              fmt(loan.dueDate) }}</div>
            <div v-if="loan.returnDate && loan.status === 'returned'">Ngày trả: {{ fmt(loan.returnDate) }}</div>
          </div>
        </div>

        <hr />

        <div class="mt-2">
          <strong style="font-size: 0.95rem;">Sách:</strong>
          <ul v-if="loan.books && loan.books.length > 0" class="mb-0 ps-4">
            <li v-for="b in loan.books" :key="b._id" style="font-size: 0.9rem;">
              <span v-if="b.bookTitle?.title">
                {{ b.bookTitle.title }}
                <small class="text-muted">- {{ b.bookTitle.author || 'N/A' }}</small>
                <small v-if="b.volume" class="text-muted ms-2">(Tập {{ b.volume }})</small>
              </span>
              <span v-else class="text-muted">{{ b._id }}</span>
            </li>
          </ul>
          <p v-else class="text-muted mb-0" style="font-size: 0.9rem;">Không có thông tin sách</p>
        </div>

        <!-- Cancel Button for requested/approved loans -->
        <div v-if="loan.status === 'requested' || loan.status === 'approved'" class="mt-2">
          <button type="button" class="btn btn-danger btn-sm" @click="cancelLoan(loan)"
            :disabled="cancelling === loan._id" style="padding: 0.25rem 0.75rem; font-size: 0.875rem;">
            <span v-if="cancelling === loan._id">
              <i class="spinner-border spinner-border-sm me-1"></i>
              Đang hủy...
            </span>
            <span v-else>
              <i class="bi bi-x-circle me-1"></i>
              Hủy phiếu mượn
            </span>
          </button>
        </div>

        <div v-if="loan.staff" class="text-muted small">Xử lý bởi: {{ loan.staff }}</div>
      </div>
    </div>

    <!-- Phân trang -->
    <nav v-if="pagination.pages > 1" class="d-flex justify-content-center mt-4">
      <ul class="pagination">
        <li class="page-item" :class="{ disabled: !pagination.hasPrev }">
          <a class="page-link" href="#" @click.prevent="changePage(pagination.page - 1)">
            <i class="bi bi-chevron-left"></i> Trước
          </a>
        </li>
        <li class="page-item" v-for="page in visiblePages" :key="page" :class="{ active: page === pagination.page }">
          <a class="page-link" href="#" @click.prevent="changePage(page)">{{ page }}</a>
        </li>
        <li class="page-item" :class="{ disabled: !pagination.hasNext }">
          <a class="page-link" href="#" @click.prevent="changePage(pagination.page + 1)">
            Sau <i class="bi bi-chevron-right"></i>
          </a>
        </li>
      </ul>
    </nav>
  </div>
</template>

<script>
import api from '../services/api'
import { useNotifications } from '../composables/useNotifications'
import { useConfirmDialog } from '../composables/useConfirmDialog'

export default {
  name: 'UserLoans',
  setup() {
    const { showError, showSuccess, showInfo } = useNotifications()
    const { showConfirm } = useConfirmDialog()
    return { showError, showSuccess, showInfo, showConfirm }
  },
  data() {
    return {
      loans: [],
      cancelling: null, // Track which loan is being cancelled
      loading: false,
      currentPage: 1,
      pagination: {
        page: 1,
        limit: 5,
        total: 0,
        pages: 0,
        hasNext: false,
        hasPrev: false
      },
      // Search & Filter
      searchQuery: '',
      statusFilter: 'all',
      dateFrom: '',
      dateTo: '',
      searchTimeout: null
    }
  },
  computed: {
    hasActiveFilters() {
      return this.searchQuery || this.statusFilter !== 'all' || this.dateFrom || this.dateTo
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
  async created() {
    await this.load(1);
    // Sync borrowedBooks when component loads
    await this.rebuildBorrowedBooks();
  },
  methods: {
    async load(page = 1) {
      try {
        this.loading = true

        // Build query parameters
        const params = new URLSearchParams({
          page: page,
          limit: 5
        })

        if (this.searchQuery) params.append('search', this.searchQuery)
        if (this.statusFilter !== 'all') params.append('status', this.statusFilter)
        if (this.dateFrom) params.append('dateFrom', this.dateFrom)
        if (this.dateTo) params.append('dateTo', this.dateTo)

        const res = await api.get(`/loans/me?${params.toString()}`)

        if (res.data.pagination) {
          // Paginated response
          this.loans = res.data.loans
          this.pagination = res.data.pagination
          this.currentPage = page
        } else {
          // Fallback for old API response (without pagination)
          this.loans = res.data || []
          this.pagination = {
            page: 1,
            limit: 5,
            total: this.loans.length,
            pages: 1,
            hasNext: false,
            hasPrev: false
          }
        }
      } catch (err) {
        console.error(err)
        this.showError('Không thể tải danh sách mượn: ' + (err.response?.data?.message || err.message))
      } finally {
        this.loading = false
      }
    },
    debounceSearch() {
      // Debounce search to avoid too many API calls
      if (this.searchTimeout) {
        clearTimeout(this.searchTimeout)
      }
      this.searchTimeout = setTimeout(() => {
        this.applyFilters()
      }, 500)
    },
    async applyFilters() {
      this.currentPage = 1
      await this.load(1)
    },
    clearFilters() {
      this.searchQuery = ''
      this.statusFilter = 'all'
      this.dateFrom = ''
      this.dateTo = ''
      this.applyFilters()
    },
    async changePage(page) {
      if (page < 1 || page > this.pagination.pages || page === this.currentPage) return
      await this.load(page)
      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' })
    },
    async cancelLoan(loan) {
      console.log('cancelLoan called with:', loan);
      console.log('showConfirm function:', this.showConfirm);

      const confirmed = await this.showConfirm({
        title: 'Hủy phiếu mượn',
        message: `Bạn có chắc chắn muốn hủy phiếu mượn này? ${loan.books.map(b => b.title).join(', ')}`,
        confirmText: 'Hủy phiếu',
        type: 'danger'
      })
      console.log('User confirmed:', confirmed);
      if (!confirmed) return

      this.cancelling = loan._id;
      try {
        console.log('Calling API to cancel loan:', loan._id);
        await api.post(`/loans/${loan._id}/cancel`);

        // Update loan status locally
        const index = this.loans.findIndex(l => l._id === loan._id);
        if (index !== -1) {
          this.loans[index].status = 'cancelled';
        }

        // Xóa bookIds khỏi borrowedBooks
        const borrowedBooks = JSON.parse(localStorage.getItem('borrowedBooks') || '{}')
        console.log('Current borrowedBooks before cancel:', borrowedBooks);
        console.log('Loan ID being cancelled:', loan._id);
        console.log('Loan books structure:', loan.books);

        // Try multiple ways to extract book IDs
        if (Array.isArray(loan.books)) {
          loan.books.forEach(book => {
            // Try book._id (book instance ID)
            if (book._id) {
              console.log('Deleting book._id:', book._id);
              delete borrowedBooks[book._id];
            }

            // Try book.book (if bookTitle is populated with _id)
            if (book.book) {
              console.log('Deleting book.book:', book.book);
              delete borrowedBooks[book.book];
            }

            // Try book.bookTitle._id (if bookTitle is populated)
            if (book.bookTitle && book.bookTitle._id) {
              console.log('Deleting book.bookTitle._id:', book.bookTitle._id);
              delete borrowedBooks[book.bookTitle._id];
            }
          })
        }

        console.log('Updated borrowedBooks after cancel:', borrowedBooks);
        localStorage.setItem('borrowedBooks', JSON.stringify(borrowedBooks))

        // Trigger custom event để components trong cùng tab có thể listen
        window.dispatchEvent(new CustomEvent('borrowedBooksChanged', {
          detail: { borrowedBooks }
        }));

        // Trigger storage event để các component khác có thể listen
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'borrowedBooks',
          newValue: JSON.stringify(borrowedBooks),
          storageArea: localStorage
        }));

        console.log('Cancel successful');
        this.showSuccess('Đã hủy phiếu mượn thành công');

        // Rebuild borrowedBooks from all active loans
        await this.rebuildBorrowedBooks();

        // Reload current page to reflect changes
        await this.load(this.currentPage);
      } catch (err) {
        console.error('Cancel loan error:', err);
        const message = err.response?.data?.message || 'Không thể hủy phiếu mượn';
        this.showError(`Lỗi: ${message}`);
      } finally {
        this.cancelling = null;
      }
    },
    async rebuildBorrowedBooks() {
      try {
        console.log('Rebuilding borrowedBooks from active loans...');

        // Fetch all active loans (not paginated)
        const res = await api.get('/loans/me?limit=1000');
        const allLoans = res.data.loans || res.data || [];

        console.log('All loans fetched:', allLoans.length);

        // Rebuild borrowedBooks từ các loans còn active
        const borrowedBooks = {};
        let activeLoanCount = 0;
        let bookIdCount = 0;

        allLoans.forEach(loan => {
          console.log(`Loan ${loan._id}: status=${loan.status}, books count=${loan.books?.length || 0}`);

          // Only track active loans (not cancelled, not rejected, not returned)
          if (loan.status !== 'cancelled' && loan.status !== 'rejected' && loan.status !== 'returned') {
            activeLoanCount++;
            if (Array.isArray(loan.books)) {
              loan.books.forEach(book => {
                if (book._id) {
                  borrowedBooks[book._id] = 'borrowed';
                  bookIdCount++;
                  console.log(`  ✓ Added book ID: ${book._id}`);
                }
              });
            }
          }
        });

        console.log(`📊 Rebuild summary: ${activeLoanCount} active loans, ${bookIdCount} book IDs`);
        console.log('✅ Rebuilt borrowedBooks:', borrowedBooks);
        localStorage.setItem('borrowedBooks', JSON.stringify(borrowedBooks));

        // Trigger events
        window.dispatchEvent(new CustomEvent('borrowedBooksChanged', {
          detail: { borrowedBooks }
        }));

        window.dispatchEvent(new StorageEvent('storage', {
          key: 'borrowedBooks',
          newValue: JSON.stringify(borrowedBooks),
          storageArea: localStorage
        }));

      } catch (err) {
        console.error('Error rebuilding borrowedBooks:', err);
      }
    },
    fmt(d) {
      if (!d) return ''
      try { return new Date(d).toLocaleString() } catch (e) { return d }
    },
    getStatusText(status) {
      const statusMap = {
        'requested': 'Yêu cầu',
        'approved': 'Đã duyệt',
        'borrowed': 'Đã mượn',
        'overdue': 'Quá hạn',
        'returned': 'Đã trả',
        'rejected': 'Từ chối',
        'cancelled': 'Đã hủy'
      }
      return statusMap[status] || status
    },
    statusClass(s) {
      const classMap = {
        'requested': 'bg-warning text-dark',
        'approved': 'bg-info text-dark',
        'borrowed': 'bg-success',
        'overdue': 'bg-danger',
        'returned': 'bg-secondary',
        'rejected': 'bg-dark',
        'cancelled': 'bg-danger'
      }
      return classMap[s] || 'bg-secondary'
    }
  }
}
</script>

<style scoped>
.card {
  border-radius: 6px;
  transition: border-color 0.2s ease-in-out;
}

.card:hover {
  border-color: #0d6efd;
}

.border-warning {
  border-color: #ffc107 !important;
}

.border-success {
  border-color: #198754 !important;
}

.btn-outline-danger:hover {
  color: #fff;
  background-color: #dc3545;
  border-color: #dc3545;
}

.spinner-border-sm {
  width: 0.875rem;
  height: 0.875rem;
}

.pagination {
  margin-top: 2rem;
}

.page-link {
  color: #0d6efd;
  text-decoration: none;
}

.page-link:hover {
  color: #0a58ca;
  background-color: #e7f1ff;
  border-color: #0a58ca;
}

.page-item.active .page-link {
  background-color: #0d6efd;
  border-color: #0d6efd;
}

.page-item.disabled .page-link {
  color: #6c757d;
  pointer-events: none;
  background-color: #fff;
  border-color: #dee2e6;
}

.alert {
  border-radius: 6px;
}

/* Search Form Styling */
.card-title {
  color: #495057;
  font-weight: 600;
}

.form-label {
  font-weight: 500;
  color: #495057;
  font-size: 0.9rem;
}

.form-control,
.form-select {
  border-radius: 4px;
  border: 1px solid #ced4da;
  font-size: 0.9rem;
}

.form-control:focus,
.form-select:focus {
  border-color: #0d6efd;
  box-shadow: 0 0 0 0.2rem rgba(13, 110, 253, 0.25);
}

.btn-sm {
  font-size: 0.875rem;
  padding: 0.375rem 0.75rem;
}

.badge {
  font-size: 0.75rem;
}

@media (max-width: 768px) {
  .pagination {
    font-size: 0.875rem;
  }

  .page-link {
    padding: 0.375rem 0.75rem;
  }

  .btn-sm {
    padding: 0.25rem 0.5rem;
    font-size: 0.8rem;
  }

  .form-control,
  .form-select {
    font-size: 0.85rem;
  }

  .col-md-2 .btn-sm {
    padding: 0.5rem 0.25rem;
  }
}

/* Loading spinner styling */
.spinner-border {
  color: #0d6efd;
}

/* Filter active indicator */
.badge.bg-warning {
  color: #000 !important;
}

/* Responsive form adjustments */
@media (max-width: 576px) {
  .col-md-2.d-flex {
    flex-direction: column;
    gap: 0.5rem;
  }

  .col-md-2.d-flex .btn {
    width: 100%;
  }
}
</style>
