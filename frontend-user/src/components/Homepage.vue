<template>
    <div class="homepage">
        <!-- Hero Section -->
        <section class="hero-section bg-primary text-white py-3 py-md-5">
            <div class="container">
                <div class="row align-items-center">
                    <div class="col-lg-6">
                        <h1 class="display-5 display-md-4 fw-bold mb-2 mb-md-3">Thư Viện Số</h1>
                        <p class="lead mb-3 mb-md-4" style="font-size: 1rem;">Khám phá hàng ngàn cuốn sách, quản lý mượn
                            trả dễ dàng với hệ thống hiện
                            đại</p>
                        <div class="d-grid gap-2 d-sm-flex">
                            <router-link v-if="!user" to="/login" class="btn btn-light btn-sm">
                                <i class="bi bi-box-arrow-in-right"></i><span class="d-none d-sm-inline ms-1">Đăng
                                    Nhập</span>
                            </router-link>
                            <router-link v-if="!user" to="/register" class="btn btn-outline-light btn-sm">
                                <i class="bi bi-person-plus"></i><span class="d-none d-sm-inline ms-1">Đăng Ký</span>
                            </router-link>
                            <router-link v-if="user" to="/books" class="btn btn-light btn-sm">
                                <i class="bi bi-book"></i><span class="d-none d-sm-inline ms-1">Xem Sách</span>
                            </router-link>
                        </div>
                    </div>
                    <div class="col-lg-6 text-center d-none d-lg-block">
                        <i class="bi bi-book-half" style="font-size: 120px; opacity: 0.2;"></i>
                    </div>
                </div>
            </div>
        </section>

        <!-- Features Section -->
        <section class="features-section py-3 py-md-5 bg-light">
            <div class="container">
                <h2 class="text-center mb-3 mb-md-5 fw-bold" style="font-size: 1.75rem;">Tính Năng Nổi Bật</h2>
                <div class="row g-3">
                    <div class="col-12 col-sm-6 col-lg-4">
                        <div class="card shadow-sm border-0 h-100">
                            <div class="card-body text-center">
                                <i class="bi bi-search text-primary"
                                    style="font-size: 2.5rem; margin-bottom: 10px;"></i>
                                <h5 class="card-title fw-bold mb-2" style="font-size: 1rem;">Tìm Kiếm Dễ Dàng</h5>
                                <p class="card-text text-muted" style="font-size: 0.9rem;">Tìm kiếm sách theo tên, tác
                                    giả, hoặc thể loại một cách
                                    nhanh chóng</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-12 col-sm-6 col-lg-4">
                        <div class="card shadow-sm border-0 h-100">
                            <div class="card-body text-center">
                                <i class="bi bi-clipboard-check text-success"
                                    style="font-size: 2.5rem; margin-bottom: 10px;"></i>
                                <h5 class="card-title fw-bold mb-2" style="font-size: 1rem;">Mượn Trả Đơn Giản</h5>
                                <p class="card-text text-muted" style="font-size: 0.9rem;">Quản lý các phiếu mượn của
                                    bạn, xem hạn trả, và thực
                                    hiện các thao tác dễ dàng</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-12 col-sm-6 col-lg-4">
                        <div class="card shadow-sm border-0 h-100">
                            <div class="card-body text-center">
                                <i class="bi bi-bell text-warning" style="font-size: 2.5rem; margin-bottom: 10px;"></i>
                                <h5 class="card-title fw-bold mb-2" style="font-size: 1rem;">Thông Báo Kịp Thời</h5>
                                <p class="card-text text-muted" style="font-size: 0.9rem;">Nhận thông báo khi sách sắp
                                    tới hạn, được duyệt mượn,
                                    hoặc có sự kiện mới</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- My Activity Section (if logged in) -->
        <section v-if="user" class="activity-section py-3 py-md-5 bg-light">
            <div class="container">
                <h2 class="text-center mb-3 mb-md-5 fw-bold" style="font-size: 1.75rem;">Hoạt Động Của Bạn</h2>
                <div class="row g-3">
                    <div class="col-12 col-md-6">
                        <div class="card shadow-sm border-0">
                            <div class="card-body">
                                <h5 class="card-title fw-bold mb-2" style="font-size: 1rem;">
                                    <i class="bi bi-hourglass-split text-warning"></i> Sách Đang Mượn
                                </h5>
                                <p class="card-text text-muted mb-1" style="font-size: 0.95rem;">Bạn đang mượn
                                    <strong>{{ userBorrowedBooks
                                        }}</strong> cuốn sách
                                </p>
                                <p class="card-text text-muted mb-2" style="font-size: 0.95rem;">Bạn còn lại <strong>{{
                                    remainingBorrows }}</strong>
                                    lần mượn</p>
                                <router-link to="/my-loans" class="btn btn-sm btn-primary w-100">
                                    <i class="bi bi-arrow-right"></i><span class="d-none d-sm-inline ms-1">Xem Chi
                                        Tiết</span>
                                </router-link>
                            </div>
                        </div>
                    </div>
                    <div class="col-12 col-md-6">
                        <div class="card shadow-sm border-0">
                            <div class="card-body">
                                <h5 class="card-title fw-bold mb-2" style="font-size: 1rem;">
                                    <i class="bi bi-plus-circle text-success"></i> Đăng Ký Mượn Mới
                                </h5>
                                <p class="card-text text-muted mb-2" style="font-size: 0.95rem;">Khám phá các cuốn sách
                                    mới và đăng ký mượn</p>
                                <router-link to="/borrow-register" class="btn btn-sm btn-success w-100">
                                    <i class="bi bi-arrow-right"></i><span class="d-none d-sm-inline ms-1">Đăng Ký
                                        Mượn</span>
                                </router-link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- Call to Action Section -->
        <section class="cta-section py-3 py-md-5 bg-primary text-white">
            <div class="container text-center">
                <h2 class="fw-bold mb-2 mb-md-3" style="font-size: 1.5rem;">Bắt Đầu Khám Phá Ngay</h2>
                <p class="lead mb-3 mb-md-4" style="font-size: 1rem;">Tham gia cộng đồng độc giả của chúng tôi và tận
                    hưởng sự tiện lợi</p>
                <div style="display: flex; justify-content: center;">
                    <router-link v-if="!user" to="/login" class="btn btn-light btn-sm">
                        <i class="bi bi-play-fill"></i><span class="d-none d-sm-inline ms-1">Bắt Đầu Ngay</span>
                    </router-link>
                    <router-link v-if="user" to="/books" class="btn btn-light btn-sm">
                        <i class="bi bi-book"></i><span class="d-none d-sm-inline ms-1">Xem Sách</span>
                    </router-link>
                </div>
            </div>
        </section>
    </div>
</template>

<script>
import api from '../services/api'

export default {
    name: 'Homepage',
    data() {
        return {
            user: null,
            userBorrowedBooks: 0,
            remainingBorrows: 3
        }
    },
    mounted() {
        this.loadUser()
        this.loadUserStats()
    },
    methods: {
        loadUser() {
            try {
                this.user = JSON.parse(localStorage.getItem('user') || 'null')
            } catch (e) {
                this.user = null
            }
        },
        async loadUserStats() {
            if (!this.user) return
            try {
                const response = await api.get('/stats/me')
                this.userBorrowedBooks = response.data.userBorrowedBooks || 0
                this.remainingBorrows = response.data.remainingBorrows || 3
            } catch (error) {
                console.error('Lỗi khi tải thống kê:', error)
            }
        }
    }
}
</script>

<style scoped>
.homepage {
    background-color: #fff;
}

.hero-section {
    background: linear-gradient(135deg, #0d6efd 0%, #0d5c8f 100%);
    min-height: 400px;
    display: flex;
    align-items: center;
}

.hero-section h1 {
    font-size: 2rem;
    font-weight: 700;
    margin-bottom: 15px;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
}

@media (min-width: 768px) {
    .hero-section h1 {
        font-size: 3.5rem;
        margin-bottom: 20px;
    }
}

.hero-section .lead {
    font-size: 0.95rem;
    margin-bottom: 20px;
    opacity: 0.95;
}

@media (min-width: 768px) {
    .hero-section .lead {
        font-size: 1.3rem;
        margin-bottom: 30px;
    }
}

.features-section {
    padding: 40px 0;
}

@media (min-width: 768px) {
    .features-section {
        padding: 80px 0;
    }
}

.card {
    transition: all 0.3s ease;
}

.card:hover {
    transform: translateY(-10px);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15) !important;
}

.card-title {
    font-size: 1.3rem;
    margin-bottom: 15px;
}

.activity-section {
    padding: 80px 0;
}

.activity-section h2 {
    font-size: 2.5rem;
    margin-bottom: 50px;
}

.activity-section .card {
    transition: all 0.3s ease;
}

.activity-section .card:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1) !important;
}

.cta-section {
    background: linear-gradient(135deg, #0d6efd 0%, #0d5c8f 100%);
    padding: 100px 0;
    text-align: center;
}

.cta-section h2 {
    font-size: 2.5rem;
    margin-bottom: 20px;
}

.cta-section .lead {
    font-size: 1.2rem;
    margin-bottom: 40px;
}

@media (max-width: 768px) {
    .hero-section h1 {
        font-size: 2rem;
    }

    .hero-section .lead {
        font-size: 1rem;
    }

    .features-section h2,
    .activity-section h2,
    .cta-section h2 {
        font-size: 2rem;
    }
}
</style>
