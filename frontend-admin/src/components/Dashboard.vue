<template>
  <div>
    <h2 class="mt-2">Dashboard</h2>
    <p class="text-muted">Chào mừng quản trị viên. Sử dụng menu để điều hướng.</p>

    <div v-if="loading" class="mt-3">Đang tải số liệu...</div>
    <div v-else class="row mt-3">
      <div class="col-12 col-md-4 mb-3">
        <div class="card p-3" role="button" @click="go('/books')" title="Xem Sách" style="cursor:pointer">
          <div class="h5">Tổng số đầu sách</div>
          <div class="display-6">{{ stats.totalBooks }}</div>
        </div>
      </div>
      <div class="col-12 col-md-4 mb-3">
        <div class="card p-3" role="button" @click="go('/books')" title="Xem Sách" style="cursor:pointer">
          <div class="h5">Tổng số sách</div>
          <div class="display-6">{{ stats.totalCopies }}</div>
        </div>
      </div>
      <div class="col-12 col-md-4 mb-3">
        <div class="card p-3" role="button" @click="go('/users')" title="Xem Người dùng" style="cursor:pointer">
          <div class="h5">Người dùng</div>
          <div class="display-6">{{ stats.totalUsers }}</div>
        </div>
      </div>

      <div class="col-12 col-md-4 mb-3">
        <div class="card p-3" role="button" @click="go('/loans', { status: 'approved,borrowed' })"
          title="Xem Phiếu đang hoạt động (Approved + Borrowed)" style="cursor:pointer">
          <div class="h6">Phiếu đang hoạt động</div>
          <div class="h4">{{ stats.activeLoans }}</div>
        </div>
      </div>
      <div class="col-12 col-md-4 mb-3">
        <div class="card p-3" role="button" @click="go('/loans', { status: 'borrowed' })" title="Xem Phiếu đang mượn"
          style="cursor:pointer">
          <div class="h6">Phiếu đang mượn</div>
          <div class="h4">{{ stats.borrowedLoans }}</div>
        </div>
      </div>
      <div class="col-12 col-md-4 mb-3">
        <div class="card p-3" role="button" @click="go('/loans', { status: 'borrowed' })"
          title="Xem Sách đang được mượn" style="cursor:pointer">
          <div class="h6">Sách đang được mượn</div>
          <div class="h4">{{ stats.borrowedBooks }}</div>
        </div>
      </div>

      <div class="col-12 col-md-4 mb-3">
        <div class="card p-3" :class="{ 'border border-danger bg-warning': stats.requestedLoans > 0 }" role="button"
          @click="go('/loans', { status: 'requested' })" title="Xem Phiếu chờ" style="cursor:pointer">
          <div class="h6">Phiếu chờ</div>
          <div class="h4">{{ stats.requestedLoans }}</div>
        </div>
      </div>
      <div class="col-12 col-md-4 mb-3">
        <div class="card p-3" role="button" @click="go('/loans', { status: 'overdue' })" title="Xem Phiếu quá hạn"
          style="cursor:pointer">
          <div class="h6">Quá hạn</div>
          <div class="h4">{{ stats.overdueLoans }}</div>
        </div>
      </div>
      <div class="col-12 col-md-4 mb-3">
        <div class="card p-3 border-danger" role="button" @click="go('/loans', { status: 'cancelled' })"
          title="Xem Phiếu đã hủy" style="cursor:pointer">
          <div class="h6 text-danger">Đã hủy</div>
          <div class="h4 text-danger">{{ stats.cancelledLoans || 0 }}</div>
        </div>
      </div>
      <div class="col-12 col-md-4 mb-3">
        <div class="card p-3" role="button" @click="go('/publishers')" title="Xem Nhà xuất bản" style="cursor:pointer">
          <div class="h6">Nhà xuất bản</div>
          <div class="h4">{{ stats.publishers }}</div>
        </div>
      </div>

      <!-- Detailed Statistics Card -->
      <div class="col-12 col-md-4 mb-3">
        <div class="card p-3 bg-info text-white" role="button" @click="go('/stats')" title="Xem thống kê chi tiết"
          style="cursor:pointer">
          <div class="h6">
            <i class="fas fa-chart-bar me-2"></i>
            Thống kê chi tiết
          </div>
          <div class="small">Xem báo cáo theo ngày/tháng</div>
        </div>
      </div>

    </div>
  </div>
</template>

<script>
import api from '../services/api'
export default {
  name: 'Dashboard',
  data() { return { loading: true, stats: {} } },
  async created() {
    console.log('Dashboard created')
    await this.load()
  },
  methods: {
    async load() {
      console.log('Dashboard loading stats...')
      this.loading = true
      try {
        const r = await api.get('/stats')
        this.stats = r.data || {}
        console.log('Stats loaded successfully')
      } catch (e) {
        console.error('Failed to load stats', e)
        this.stats = {}
      } finally {
        this.loading = false
      }
    },
    go(path, query) {
      // navigate using the router; optionally include query
      try {
        if (query) this.$router.push({ path, query })
        else this.$router.push(path)
      } catch (e) { console.error('Navigation failed', e) }
    }
  }
}
</script>

<style scoped>
/* minimal */
</style>
