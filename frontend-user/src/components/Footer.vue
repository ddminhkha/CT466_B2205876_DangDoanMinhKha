<template>
  <footer class="footer bg-dark text-white">
    <div class="container py-4">
      <div class="row">
        <!-- Thông tin thư viện -->
        <div class="col-md-6 mb-3">
          <h5 class="fw-bold mb-3">Thư viện CTU</h5>
          <p class="text-light small mb-2">
            <i class="bi bi-geo-alt-fill me-2"></i>
            Đại học Cần Thơ, Khu II, đường 3/2, phường Xuân Khánh, quận Ninh Kiều, TP. Cần Thơ
          </p>
          <p class="text-light small mb-2">
            <i class="bi bi-telephone-fill me-2"></i>
            (0292) 3872 167
          </p>
          <p class="text-light small mb-0">
            <i class="bi bi-envelope-fill me-2"></i>
            thuvien@ctu.edu.vn
          </p>
        </div>

        <!-- Liên kết nhanh -->
        <div class="col-md-6 mb-3">
          <h5 class="fw-bold mb-3">Liên kết nhanh</h5>
          <ul class="list-unstyled">
            <li class="mb-2">
              <router-link to="/books" class="text-light text-decoration-none">
                <i class="bi bi-book me-2"></i>Danh sách sách
              </router-link>
            </li>
            <li class="mb-2">
              <router-link to="/my-loans" class="text-light text-decoration-none">
                <i class="bi bi-card-list me-2"></i>Phiếu mượn của tôi
              </router-link>
            </li>
            <li class="mb-2">
              <router-link to="/profile" class="text-light text-decoration-none">
                <i class="bi bi-person me-2"></i>Thông tin cá nhân
              </router-link>
            </li>
          </ul>
        </div>
      </div>

      <!-- Copyright -->
      <div class="row mt-3 pt-3 border-top border-secondary">
        <div class="col text-center">
          <p class="mb-0 small text-light">
            © 2025 Thư viện CTU. Hệ thống quản lý mượn trả sách.
          </p>
        </div>
      </div>
    </div>

    <!-- Nút Back to Top -->
    <a href="#top" class="btn-back-to-top" title="Về đầu trang">
      <i class="bi bi-arrow-up"></i>
    </a>
  </footer>
</template>

<script>
export default {
  name: 'FooterBar',
  mounted() {
    // Show/hide back to top button based on scroll position
    window.addEventListener('scroll', this.handleScroll)
  },
  beforeUnmount() {
    window.removeEventListener('scroll', this.handleScroll)
  },
  methods: {
    handleScroll() {
      const backToTop = document.querySelector('.btn-back-to-top')
      if (backToTop) {
        if (window.scrollY > 300) {
          backToTop.classList.add('show')
        } else {
          backToTop.classList.remove('show')
        }
      }
    }
  }
}
</script>

<style scoped>
.footer {
  margin-top: auto;
  background-color: #212529 !important;
}

.footer a:hover {
  color: #0d6efd !important;
  transition: color 0.3s ease;
}

.btn-back-to-top {
  position: fixed;
  bottom: 30px;
  right: 30px;
  width: 50px;
  height: 50px;
  background-color: #0d6efd;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  opacity: 0;
  visibility: hidden;
  transition: all 0.3s ease;
  z-index: 1000;
}

.btn-back-to-top:hover {
  background-color: #0b5ed7;
  color: white;
  transform: translateY(-5px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.3);
}

.btn-back-to-top.show {
  opacity: 1;
  visibility: visible;
}

.btn-back-to-top i {
  font-size: 1.5rem;
}
</style>
