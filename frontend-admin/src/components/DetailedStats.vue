<template>
    <div class="container py-3">
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h2>Thống kê chi tiết</h2>
            <div class="btn-group" role="group">
                <button :class="['btn', selectedPeriod === 'today' ? 'btn-primary' : 'btn-outline-primary']"
                    @click="setPeriod('today')">Hôm nay</button>
                <button :class="['btn', selectedPeriod === 'month' ? 'btn-primary' : 'btn-outline-primary']"
                    @click="setPeriod('month')">Tháng này</button>
                <button :class="['btn', selectedPeriod === 'year' ? 'btn-primary' : 'btn-outline-primary']"
                    @click="setPeriod('year')">Năm này</button>
                <button :class="['btn', selectedPeriod === 'all' ? 'btn-primary' : 'btn-outline-primary']"
                    @click="setPeriod('all')">Tất cả</button>
            </div>
        </div>

        <div v-if="loading" class="text-center">
            <div class="spinner-border" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
            <p>Đang tải thống kê...</p>
        </div>

        <div v-else>
            <!-- Summary Cards -->
            <div class="row mb-4">
                <div class="col-md-3 mb-3">
                    <div class="card bg-primary text-white">
                        <div class="card-body text-center">
                            <div class="h3">{{ stats.loansCount }}</div>
                            <div>Phiếu mượn</div>
                        </div>
                    </div>
                </div>
                <div class="col-md-3 mb-3">
                    <div class="card bg-success text-white">
                        <div class="card-body text-center">
                            <div class="h3">{{ stats.booksBorrowedCount }}</div>
                            <div>Sách được mượn</div>
                        </div>
                    </div>
                </div>
                <div class="col-md-3 mb-3">
                    <div class="card bg-info text-white">
                        <div class="card-body text-center">
                            <div class="h3">{{ stats.mostBorrowedBooks?.length || 0 }}</div>
                            <div>Đầu sách được mượn</div>
                        </div>
                    </div>
                </div>
                <div class="col-md-3 mb-3">
                    <div class="card bg-warning text-white">
                        <div class="card-body text-center">
                            <div class="h3">{{ stats.mostActiveUsers?.length || 0 }}</div>
                            <div>Người dùng hoạt động</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Detailed Tables -->
            <div class="row">
                <!-- Most Borrowed Books -->
                <div class="col-md-6 mb-4">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="mb-0">
                                <i class="fas fa-book me-2"></i>
                                Sách được mượn nhiều nhất
                            </h5>
                        </div>
                        <div class="card-body">
                            <div v-if="stats.mostBorrowedBooks && stats.mostBorrowedBooks.length">
                                <div class="table-responsive">
                                    <table class="table table-sm">
                                        <thead>
                                            <tr>
                                                <th>#</th>
                                                <th>Tên sách</th>
                                                <th>Tác giả</th>
                                                <th class="text-end">Số lần mượn</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr v-for="(book, index) in stats.mostBorrowedBooks" :key="book._id">
                                                <td>
                                                    <span class="badge" :class="getRankBadgeClass(index + 1)">{{ index +
                                                        1 }}</span>
                                                </td>
                                                <td>
                                                    <div class="fw-bold">{{ book.title || 'N/A' }}</div>
                                                </td>
                                                <td class="text-muted">{{ book.author || 'N/A' }}</td>
                                                <td class="text-end">
                                                    <span class="badge bg-primary">{{ book.count }}</span>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            <div v-else class="text-muted text-center py-3">
                                Không có dữ liệu trong khoảng thời gian này
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Most Active Users -->
                <div class="col-md-6 mb-4">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="mb-0">
                                <i class="fas fa-users me-2"></i>
                                Người dùng hoạt động nhất
                            </h5>
                        </div>
                        <div class="card-body">
                            <div v-if="stats.mostActiveUsers && stats.mostActiveUsers.length">
                                <div class="table-responsive">
                                    <table class="table table-sm">
                                        <thead>
                                            <tr>
                                                <th>#</th>
                                                <th>Người dùng</th>
                                                <th class="text-end">Phiếu mượn</th>
                                                <th class="text-end">Sách mượn</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr v-for="(user, index) in stats.mostActiveUsers" :key="user._id">
                                                <td>
                                                    <span class="badge" :class="getRankBadgeClass(index + 1)">{{ index +
                                                        1 }}</span>
                                                </td>
                                                <td>
                                                    <div class="fw-bold">{{ user.fullName.trim() || 'N/A' }}</div>
                                                    <div class="small text-muted">{{ user.email }}</div>
                                                </td>
                                                <td class="text-end">
                                                    <span class="badge bg-info">{{ user.count }}</span>
                                                </td>
                                                <td class="text-end">
                                                    <span class="badge bg-success">{{ user.booksBorrowed }}</span>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            <div v-else class="text-muted text-center py-3">
                                Không có dữ liệu trong khoảng thời gian này
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Period Info -->
            <div class="row">
                <div class="col-12">
                    <div class="alert alert-info">
                        <i class="fas fa-info-circle me-2"></i>
                        <strong>Khoảng thời gian:</strong> {{ getPeriodDescription() }}
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import api from '../services/api'

export default {
    name: 'DetailedStats',
    data() {
        return {
            loading: false,
            selectedPeriod: 'month',
            stats: {
                loansCount: 0,
                booksBorrowedCount: 0,
                mostBorrowedBooks: [],
                mostActiveUsers: []
            }
        }
    },
    async created() {
        await this.loadStats()
    },
    methods: {
        async setPeriod(period) {
            this.selectedPeriod = period
            await this.loadStats()
        },
        async loadStats() {
            this.loading = true
            try {
                const response = await api.get(`/stats/detailed?period=${this.selectedPeriod}`)
                this.stats = response.data || {}
                console.log('Stats loaded:', this.stats) // Debug log
            } catch (error) {
                console.error('Failed to load detailed stats:', error)
                alert('Không thể tải thống kê chi tiết: ' + (error.response?.data?.message || error.message))
            } finally {
                this.loading = false
            }
        },
        getRankBadgeClass(rank) {
            if (rank === 1) return 'bg-warning text-dark'
            if (rank === 2) return 'bg-secondary'
            if (rank === 3) return 'bg-dark'
            return 'bg-light text-dark'
        },
        getPeriodDescription() {
            const descriptions = {
                today: 'Hôm nay',
                month: 'Tháng này',
                year: 'Năm này',
                all: 'Tất cả thời gian'
            }
            return descriptions[this.selectedPeriod] || 'Không xác định'
        }
    }
}
</script>

<style scoped>
.table th {
    border-top: none;
}

.card {
    box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
    border: 1px solid rgba(0, 0, 0, 0.125);
}

.card-header {
    background-color: #f8f9fa;
    border-bottom: 1px solid rgba(0, 0, 0, 0.125);
}

.badge {
    font-size: 0.75em;
}

.spinner-border {
    width: 3rem;
    height: 3rem;
}
</style>