<template>
    <div class="container py-2 py-md-3">
        <div class="d-flex flex-column flex-md-row justify-content-between align-items-start gap-2 mb-3">
            <h2 class="mb-0">Quản lý Mượn sách</h2>
            <div class="w-100 w-md-auto">
                <div class="btn-group btn-group-sm flex-wrap" role="group" aria-label="filter">
                    <button
                        :class="['btn', 'btn-sm', selectedStatuses.length === 0 ? 'btn-primary' : 'btn-outline-secondary']"
                        @click="clearFilters">Tất cả</button>
                    <button
                        :class="['btn', 'btn-sm', selectedStatuses.includes('requested') ? 'btn-primary' : 'btn-outline-secondary']"
                        @click="toggleStatus('requested')">Yêu cầu</button>
                    <button
                        :class="['btn', 'btn-sm', selectedStatuses.includes('approved') ? 'btn-primary' : 'btn-outline-secondary']"
                        @click="toggleStatus('approved')">Đã duyệt</button>
                    <button
                        :class="['btn', 'btn-sm', selectedStatuses.includes('borrowed') ? 'btn-primary' : 'btn-outline-secondary']"
                        @click="toggleStatus('borrowed')">Đã mượn</button>
                    <button
                        :class="['btn', 'btn-sm', selectedStatuses.includes('overdue') ? 'btn-primary' : 'btn-outline-secondary']"
                        @click="toggleStatus('overdue')">Quá hạn</button>
                    <button
                        :class="['btn', 'btn-sm', selectedStatuses.includes('returned') ? 'btn-primary' : 'btn-outline-secondary']"
                        @click="toggleStatus('returned')">Đã trả</button>
                    <button
                        :class="['btn', 'btn-sm', selectedStatuses.includes('rejected') ? 'btn-primary' : 'btn-outline-secondary']"
                        @click="toggleStatus('rejected')">Từ chối</button>
                    <button
                        :class="['btn', 'btn-sm', selectedStatuses.includes('cancelled') ? 'btn-primary' : 'btn-outline-secondary']"
                        @click="toggleStatus('cancelled')">Đã hủy</button>
                </div>
                <button class="btn btn-secondary" @click="load">Tải lại</button>
            </div>
        </div>

        <!-- Thông tin trang -->
        <div class="mb-3 text-muted" style="font-size: 0.9rem;">
            Hiển thị {{ displayedLoans.length }} / {{ loans.length }} thẻ mượn
            <span v-if="totalPages > 1">(Trang {{ currentPage }} / {{ totalPages }})</span>
        </div>

        <div class="table-responsive mt-2" style="font-size: 0.85rem;">
            <table class="table table-sm table-hover mb-0">
                <thead class="d-none d-lg-table-header-group">
                    <tr>
                        <th>Người mượn</th>
                        <th>Sách</th>
                        <th>Trạng thái</th>
                        <th>Thời gian</th>
                        <th>Hành động</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="l in displayedLoans" :key="l._id"
                        class="d-block d-lg-table-row mb-3 border rounded d-lg-border-0 d-lg-mb-0">
                        <td class="d-block d-lg-table-cell pb-2 border-bottom d-lg-border-bottom-0">
                            <div class="d-lg-none fw-bold mb-1">Người mượn</div>
                            <div>{{ (l.user?.hoLot || '') + ' ' + (l.user?.ten || '') }}</div>
                        </td>
                        <td class="d-block d-lg-table-cell pb-2 border-bottom d-lg-border-bottom-0">
                            <div class="d-lg-none fw-bold mb-1">Sách</div>
                            <div v-if="Array.isArray(l.books) && l.books.length">
                                <div v-for="b in l.books" :key="b._id" class="mb-1">
                                    <div class="fw-bold">{{ b.title }}</div>
                                    <div class="small text-muted">{{ b.author }}</div>
                                </div>
                            </div>
                            <div v-else>
                                <div class="text-muted">-</div>
                            </div>
                        </td>
                        <td class="d-block d-lg-table-cell pb-2 border-bottom d-lg-border-bottom-0">
                            <div class="d-lg-none fw-bold mb-1">Trạng thái</div>
                            <span class="badge" :class="getStatusClass(l.status)">{{ getStatusText(l.status) }}</span>
                        </td>
                        <td class="d-block d-lg-table-cell pb-2 border-bottom d-lg-border-bottom-0">
                            <div class="d-lg-none fw-bold mb-1">Thời gian</div>
                            <div v-if="l.pickupDate && (l.status === 'requested' || l.status === 'approved')"
                                class="small">
                                <strong>Pickup: {{ fmtDate(l.pickupDate) }}</strong>
                            </div>
                            <div class="small">Create: {{ fmtDate(l.create || l.createdAt) }}</div>
                            <div v-if="(l.borrow || l.borrowDate) && l.status !== 'requested' && l.status !== 'rejected' && l.status !== 'cancelled'"
                                class="small">
                                Borrow: {{ fmtDate(l.borrow || l.borrowDate) }}</div>
                            <div v-if="l.dueDate && l.status !== 'rejected' && l.status !== 'cancelled'" class="small">
                                Due: {{ fmtDate(l.dueDate) }}
                            </div>
                            <div v-if="l.returnDate && l.status === 'returned'" class="small">Return: {{
                                fmtDate(l.returnDate) }}</div>
                        </td>
                        <td class="d-block d-lg-table-cell pb-2">
                            <div class="d-lg-none fw-bold mb-1">Hành động</div>
                            <div class="btn-group btn-group-sm flex-wrap d-flex" role="group">
                                <button v-if="l.status === 'requested'" class="btn btn-outline-success flex-grow-1"
                                    @click="approve(l)">Duyệt</button>
                                <button v-if="l.status === 'requested'" class="btn btn-outline-danger flex-grow-1"
                                    @click="reject(l)">Từ chối</button>
                                <button v-if="l.status === 'approved'" class="btn btn-outline-primary flex-grow-1"
                                    @click="markBorrowed(l)">Đã giao sách</button>
                                <button v-if="l.status === 'approved'" class="btn btn-outline-danger flex-grow-1"
                                    @click="cancelLoan(l)">Hủy</button>
                                <button v-if="l.status === 'borrowed' || l.status === 'overdue'"
                                    class="btn btn-outline-success flex-grow-1" @click="markReturned(l)">Trả
                                    sách</button>
                                <button v-if="l.status === 'borrowed'" class="btn btn-outline-warning flex-grow-1"
                                    :disabled="!isOverdue(l)" :title="isOverdue(l) ? 'Quá hạn' : 'Chưa quá hạn'"
                                    @click="markOverdue(l)">Quá hạn</button>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- Pagination Controls -->
        <div v-if="totalPages > 1" class="d-flex justify-content-center mt-3">
            <nav>
                <ul class="pagination pagination-sm">
                    <li class="page-item" :class="{ disabled: currentPage === 1 }">
                        <button class="page-link" @click="goToPage(currentPage - 1)"
                            :disabled="currentPage === 1">Trước</button>
                    </li>

                    <!-- Hiển thị trang đầu -->
                    <li v-if="currentPage > 3" class="page-item">
                        <button class="page-link" @click="goToPage(1)">1</button>
                    </li>
                    <li v-if="currentPage > 4" class="page-item disabled">
                        <span class="page-link">...</span>
                    </li>

                    <!-- Hiển thị các trang xung quanh trang hiện tại -->
                    <li v-for="page in visiblePages" :key="page" class="page-item"
                        :class="{ active: page === currentPage }">
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
    </div>
</template>

<script>
import api from '../services/api'
import { useNotifications } from '../composables/useNotifications'
import { useConfirmDialog } from '../composables/useConfirmDialog'

export default {
    name: 'LoansAdmin',
    setup() {
        const { showError, showSuccess, showInfo } = useNotifications()
        const { showConfirm } = useConfirmDialog()
        return { showError, showSuccess, showInfo, showConfirm }
    },
    data() {
        const raw = this.$route.query.status || ''
        const initial = raw ? String(raw).split(',').filter(Boolean) : []
        return {
            loans: [],
            allLoans: [],
            selectedStatuses: initial,
            // Pagination
            currentPage: 1,
            itemsPerPage: 10
        }
    },
    created() { this.load() },
    watch: {
        '$route.query.status'(nv) {
            const arr = nv ? String(nv).split(',').filter(Boolean) : []
            this.selectedStatuses = arr
            this.applyFilter()
        }
    },
    computed: {
        displayedLoans() {
            const startIndex = (this.currentPage - 1) * this.itemsPerPage
            const endIndex = startIndex + this.itemsPerPage
            return this.loans.slice(startIndex, endIndex)
        },
        totalPages() {
            return Math.ceil(this.loans.length / this.itemsPerPage)
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
        }
    },
    methods: {
        fmtDate(d) { if (!d) return '-'; try { return new Date(d).toLocaleString() } catch (e) { return d } },
        async load() {
            try {
                const r = await api.get('/loans')
                this.allLoans = r.data || []
                this.applyFilter()
            } catch (e) { this.showError('Không thể tải danh sách mượn: ' + (e.response?.data?.message || e.message)) }
        },
        applyFilter() {
            if (!this.selectedStatuses || this.selectedStatuses.length === 0) {
                this.loans = this.allLoans
            } else {
                this.loans = this.allLoans.filter(l => this.selectedStatuses.includes(l.status))
            }
            // Reset về trang 1 khi filter thay đổi
            this.currentPage = 1
        },
        goToPage(page) {
            if (page >= 1 && page <= this.totalPages) {
                this.currentPage = page
            }
        },
        toggleStatus(status) {
            const i = this.selectedStatuses.indexOf(status)
            if (i === -1) this.selectedStatuses.push(status)
            else this.selectedStatuses.splice(i, 1)
            const q = {}
            if (this.selectedStatuses.length) q.status = this.selectedStatuses.join(',')
            this.$router.push({ path: '/loans', query: q })
            this.applyFilter()
        },
        clearFilters() {
            this.selectedStatuses = []
            this.$router.push({ path: '/loans' })
            this.applyFilter()
        },
        async approve(l) {
            const confirmed = await this.showConfirm({
                title: 'Chấp nhận yêu cầu mượn',
                message: `Bạn có chắc muốn duyệt yêu cầu mượn sách của ${l.user?.ten || 'người dùng'}?`,
                confirmText: 'Chấp nhận',
                type: 'success'
            })
            if (!confirmed) return
            try {
                await api.post(`/loans/${l._id}/approve`)
                this.load()
                this.showSuccess('Đã duyệt yêu cầu mượn sách thành công')
            } catch (e) {
                this.showError('Lỗi khi duyệt: ' + (e.response?.data?.message || e.message))
            }
        },
        async reject(l) {
            const confirmed = await this.showConfirm({
                title: 'Từ chối yêu cầu mượn',
                message: `Bạn có chắc muốn từ chối yêu cầu mượn sách của ${l.user?.ten || 'người dùng'}?`,
                confirmText: 'Từ chối',
                type: 'danger'
            })
            if (!confirmed) return
            try {
                await api.post(`/loans/${l._id}/reject`)
                this.load()
                this.showSuccess('Đã từ chối yêu cầu mượn sách')
            } catch (e) {
                this.showError('Lỗi khi từ chối: ' + (e.response?.data?.message || e.message))
            }
        },
        async markBorrowed(l) {
            const confirmed = await this.showConfirm({
                title: 'Đánh dấu đã phát sách',
                message: 'Xác nhận rằng sách đã được phát cho người mượn?',
                confirmText: 'Đã phát sách',
                type: 'primary'
            })
            if (!confirmed) return
            try {
                await api.post(`/loans/${l._id}/mark-borrowed`)
                this.load()
                this.showSuccess('Đã đánh dấu phát sách thành công')
            } catch (e) {
                this.showError('Lỗi khi đánh dấu: ' + (e.response?.data?.message || e.message))
            }
        },
        async markReturned(l) {
            const confirmed = await this.showConfirm({
                title: 'Xác nhận trả sách',
                message: 'Xác nhận rằng sách đã được trả lại thư viện?',
                confirmText: 'Đã trả sách',
                type: 'success'
            })
            if (!confirmed) return
            try {
                await api.post(`/loans/${l._id}/return`)
                this.load()
                this.showSuccess('Đã xác nhận trả sách thành công')
            } catch (e) {
                this.showError('Lỗi khi xác nhận trả sách: ' + (e.response?.data?.message || e.message))
            }
        },
        async markOverdue(l) {
            if (!this.isOverdue(l)) return
            const confirmed = await this.showConfirm({
                title: 'Đánh dấu quá hạn',
                message: 'Đánh dấu phiếu mượn này là quá hạn?',
                confirmText: 'Đánh dấu quá hạn',
                type: 'warning'
            })
            if (!confirmed) return
            try {
                await api.post(`/loans/${l._id}/mark-overdue`)
                this.load()
                this.showWarning('Đã đánh dấu phiếu mượn quá hạn')
            } catch (e) {
                this.showError('Lỗi khi đánh dấu quá hạn: ' + (e.response?.data?.message || e.message))
            }
        },
        async cancelLoan(l) {
            const confirmed = await this.showConfirm({
                title: 'Hủy phiếu mượn',
                message: 'Xác nhận hủy phiếu mượn này? Sách sẽ được trả lại kho và người dùng sẽ nhận thông báo.',
                confirmText: 'Hủy phiếu',
                type: 'danger'
            })
            if (!confirmed) return
            try {
                await api.post(`/loans/${l._id}/cancel`)
                this.load()
                this.showSuccess('Đã hủy phiếu mượn thành công')
            } catch (e) {
                this.showError('Lỗi khi hủy phiếu: ' + (e.response?.data?.message || e.message))
            }
        },
        isOverdue(l) {
            if (!l || !l.dueDate) return false
            try {
                const due = new Date(l.dueDate)
                const now = new Date()
                return due.getTime() < now.getTime()
            } catch (e) { return false }
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
        getStatusClass(status) {
            const classMap = {
                'requested': 'bg-warning text-dark',
                'approved': 'bg-info text-dark',
                'borrowed': 'bg-success',
                'overdue': 'bg-danger',
                'returned': 'bg-secondary',
                'rejected': 'bg-dark',
                'cancelled': 'bg-danger'
            }
            return classMap[status] || 'bg-secondary'
        }
    }
}
</script>

<style scoped>
.fw-bold {
    font-weight: 600;
}
</style>
