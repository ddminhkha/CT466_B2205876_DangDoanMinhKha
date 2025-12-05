<template>
    <div class="container-fluid p-4">
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h1>Quản lý Đầu sách</h1>
            <button class="btn btn-success" @click="showAddForm = true">+ Thêm đầu sách</button>
        </div>

        <!-- Add/Edit Modal -->
        <div v-if="showAddForm" class="modal d-block" style="background: rgba(0, 0, 0, 0.5)">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">{{ editingId ? 'Sửa đầu sách' : 'Thêm đầu sách mới' }}</h5>
                        <button type="button" class="btn-close" @click="cancelEdit"></button>
                    </div>
                    <form @submit.prevent="saveBookTitle">
                        <div class="modal-body">
                            <div class="mb-3">
                                <label class="form-label">Tiêu đề</label>
                                <input v-model="form.title" type="text" class="form-control" required />
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Tác giả</label>
                                <input v-model="form.author" type="text" class="form-control" required />
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Thể loại</label>
                                <select v-model="form.category" class="form-select">
                                    <option value="">-- Chọn thể loại --</option>
                                    <option value="Tiểu thuyết">Tiểu thuyết</option>
                                    <option value="Truyện tranh">Truyện tranh</option>
                                    <option value="Khoa học kỹ thuật">Khoa học kỹ thuật</option>
                                    <option value="Lịch sử">Lịch sử</option>
                                    <option value="Tâm lý - Tự giúp">Tâm lý - Tự giúp</option>
                                    <option value="Kinh tế - Quản lý">Kinh tế - Quản lý</option>
                                    <option value="Giáo dục">Giáo dục</option>
                                    <option value="Thơ - Văn học">Thơ - Văn học</option>
                                    <option value="Ngoại ngữ">Ngoại ngữ</option>
                                    <option value="Từ điển - Tài liệu">Từ điển - Tài liệu</option>
                                    <option value="Khác">Khác</option>
                                </select>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Mô tả</label>
                                <textarea v-model="form.description" class="form-control" rows="3"></textarea>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Số tập (để trống nếu chưa biết)</label>
                                <input v-model.number="form.totalVolumes" type="number" class="form-control" />
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Trạng thái</label>
                                <select v-model="form.status" class="form-select">
                                    <option value="active">Đang hoạt động</option>
                                    <option value="inactive">Không hoạt động</option>
                                </select>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" @click="cancelEdit">Hủy</button>
                            <button type="submit" class="btn btn-primary">{{ editingId ? 'Cập nhật' : 'Thêm' }}</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>

        <!-- Search and Filter -->
        <div class="mb-4 d-flex gap-2">
            <input v-model="searchQuery" type="text" class="form-control"
                placeholder="Tìm kiếm theo tiêu đề hoặc tác giả..." />
            <button class="btn btn-outline-secondary" @click="resetSearch">Xoá</button>
        </div>

        <!-- Table -->
        <div class="table-responsive">
            <table class="table table-striped table-hover">
                <thead class="table-dark">
                    <tr>
                        <th>Tiêu đề</th>
                        <th>Tác giả</th>
                        <th>Thể loại</th>
                        <th>Số tập</th>
                        <th>Số quyển</th>
                        <th>Trạng thái</th>
                        <th>Hành động</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="title in displayedTitles" :key="title._id">
                        <td>{{ title.title }}</td>
                        <td>{{ title.author }}</td>
                        <td>{{ title.category || '-' }}</td>
                        <td>{{ title.totalVolumes || '-' }}</td>
                        <td>{{ title.totalCopies || 0 }}</td>
                        <td>
                            <span :class="{
                                'badge bg-success': title.status === 'active',
                                'badge bg-danger': title.status === 'inactive'
                            }">
                                {{ title.status === 'active' ? 'Đang hoạt động' : 'Không hoạt động' }}
                            </span>
                        </td>
                        <td>
                            <button class="btn btn-sm btn-info" @click="editTitle(title)">Sửa</button>
                            <button class="btn btn-sm btn-warning" @click="viewBooks(title)">Xem tập</button>
                            <button class="btn btn-sm btn-danger" @click="deleteTitle(title._id)">Xóa</button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- Books Modal -->
        <div v-if="showBooksModal" class="modal d-block" style="background: rgba(0, 0, 0, 0.5)">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Các tập của: {{ selectedTitle?.title }}</h5>
                        <button type="button" class="btn-close" @click="showBooksModal = false"></button>
                    </div>
                    <div class="modal-body">
                        <table v-if="selectedTitleBooks.length" class="table table-sm table-striped">
                            <thead>
                                <tr>
                                    <th>Tập</th>
                                    <th>Nhà xuất bản</th>
                                    <th>Năm</th>
                                    <th>Ngôn ngữ</th>
                                    <th>Số quyển</th>
                                    <th>Giá</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="book in selectedTitleBooks" :key="book._id">
                                    <td>{{ book.volume || '-' }}</td>
                                    <td>{{ book.publisher?.tenNXB || '-' }}</td>
                                    <td>{{ book.year || '-' }}</td>
                                    <td>{{ book.language || '-' }}</td>
                                    <td>{{ book.soQuyen }}</td>
                                    <td>{{ formatPrice(book.donGia) }}</td>
                                </tr>
                            </tbody>
                        </table>
                        <p v-else class="text-muted">Chưa có tập nào cho đầu sách này</p>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" @click="showBooksModal = false">
                            Đóng
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Notification Modal -->
        <div v-if="notification.show" class="modal d-block" style="background: rgba(0, 0, 0, 0.5)">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header"
                        :class="notification.type === 'success' ? 'bg-success text-white' : 'bg-danger text-white'">
                        <h5 class="modal-title">
                            <i
                                :class="notification.type === 'success' ? 'bi bi-check-circle' : 'bi bi-exclamation-triangle'"></i>
                            {{ notification.type === 'success' ? 'Thành công' : 'Lỗi' }}
                        </h5>
                        <button type="button" class="btn-close btn-close-white"
                            @click="notification.show = false"></button>
                    </div>
                    <div class="modal-body">
                        <p class="mb-0">{{ notification.message }}</p>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn"
                            :class="notification.type === 'success' ? 'btn-success' : 'btn-danger'"
                            @click="notification.show = false">
                            Đóng
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import api from '../services/api'
import { useConfirmDialog } from '../composables/useConfirmDialog'

export default {
    name: 'BookTitles',
    setup() {
        const { showConfirm } = useConfirmDialog()
        return { showConfirm }
    },
    data() {
        return {
            bookTitles: [],
            showAddForm: false,
            editingId: null,
            searchQuery: '',
            showBooksModal: false,
            selectedTitle: null,
            selectedTitleBooks: [],
            notification: {
                show: false,
                message: '',
                type: 'success' // 'success' or 'error'
            },
            form: {
                title: '',
                author: '',
                category: '',
                description: '',
                totalVolumes: null,
                status: 'active'
            }
        }
    },
    computed: {
        displayedTitles() {
            if (!this.searchQuery) return this.bookTitles

            const query = this.searchQuery.toLowerCase()
            return this.bookTitles.filter(
                title =>
                    title.title.toLowerCase().includes(query) ||
                    title.author.toLowerCase().includes(query)
            )
        }
    },
    methods: {
        showNotification(message, type = 'success') {
            this.notification.message = message
            this.notification.type = type
            this.notification.show = true
        },
        async fetchBookTitles() {
            try {
                const response = await api.get('/booktitles')
                this.bookTitles = response.data.bookTitles || []
            } catch (error) {
                console.error('Error fetching book titles:', error)
                this.showNotification('Lỗi khi tải danh sách đầu sách', 'error')
            }
        },
        async saveBookTitle() {
            try {
                if (this.editingId) {
                    await api.put(`/booktitles/${this.editingId}`, this.form)
                } else {
                    await api.post('/booktitles', this.form)
                }

                this.showNotification(this.editingId ? 'Cập nhật thành công' : 'Thêm mới thành công', 'success')
                this.resetForm()
                await this.fetchBookTitles()
            } catch (error) {
                console.error('Error saving book title:', error)
                this.showNotification(error.response?.data?.message || 'Lỗi khi lưu đầu sách', 'error')
            }
        },
        editTitle(title) {
            this.editingId = title._id
            this.form = {
                title: title.title,
                author: title.author,
                category: title.category,
                description: title.description,
                totalVolumes: title.totalVolumes,
                status: title.status
            }
            this.showAddForm = true
        },
        async deleteTitle(id) {
            const confirmed = await this.showConfirm({
                title: 'Xác nhận xóa',
                message: 'Bạn chắc chắn muốn xóa đầu sách này?',
                type: 'danger',
                confirmText: 'Xóa',
                cancelText: 'Hủy'
            })
            if (!confirmed) return

            try {
                await api.delete(`/booktitles/${id}`)
                this.showNotification('Xóa thành công', 'success')
                await this.fetchBookTitles()
            } catch (error) {
                console.error('Error deleting book title:', error)
                this.showNotification(error.response?.data?.message || 'Lỗi khi xóa đầu sách', 'error')
            }
        },
        async viewBooks(title) {
            try {
                const response = await api.get(`/booktitles/${title._id}`)
                this.selectedTitle = title
                this.selectedTitleBooks = response.data.books || []
                this.showBooksModal = true
            } catch (error) {
                console.error('Error fetching books:', error)
                this.showNotification('Lỗi khi tải danh sách tập', 'error')
            }
        },
        cancelEdit() {
            this.resetForm()
        },
        resetForm() {
            this.showAddForm = false
            this.editingId = null
            this.form = {
                title: '',
                author: '',
                category: '',
                description: '',
                totalVolumes: null,
                status: 'active'
            }
        },
        resetSearch() {
            this.searchQuery = ''
        },
        formatPrice(price) {
            return new Intl.NumberFormat('vi-VN', {
                style: 'currency',
                currency: 'VND'
            }).format(price)
        }
    },
    mounted() {
        this.fetchBookTitles()
    }
}
</script>

<style scoped>
.modal.d-block {
    display: block !important;
}

.table {
    margin-bottom: 0;
}

.btn {
    margin: 0 2px;
}
</style>
