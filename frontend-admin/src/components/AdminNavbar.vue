<template>
  <nav class="navbar navbar-expand-lg navbar-dark bg-dark sticky-top">
    <div class="container-fluid px-2 px-md-3">
      <!-- brand on the left -->
      <router-link class="navbar-brand fw-bold" to="/">
        <i class="bi bi-shield-lock"></i> Admin
      </router-link>

      <!-- Hamburger button for mobile -->
      <button class="navbar-toggler" type="button" 
        aria-controls="adminNavLinks" aria-expanded="false" aria-label="Toggle navigation" @click="toggleNavbar">
        <span class="navbar-toggler-icon"></span>
      </button>

      <!-- centered nav links -->
      <div class="collapse navbar-collapse" id="adminNavLinks">
        <div class="navbar-nav mx-auto">
          <router-link class="nav-link text-white" to="/" @click="closeNavbar">Dashboard</router-link>
          <router-link class="nav-link text-white" to="/booktitles" @click="closeNavbar">Đầu sách</router-link>
          <router-link class="nav-link text-white" to="/books" @click="closeNavbar">Sách</router-link>
          <router-link class="nav-link text-white" to="/loans" @click="closeNavbar">Mượn trả</router-link>
          <router-link class="nav-link text-white" to="/publishers" @click="closeNavbar">NXB</router-link>
          <router-link class="nav-link text-white" to="/users" @click="closeNavbar">Người dùng</router-link>
          <router-link class="nav-link text-white" to="/stats" @click="closeNavbar">Thống kê</router-link>
          <router-link class="nav-link text-white" to="/emails" @click="closeNavbar">Email</router-link>
        </div>

        <!-- right side actions -->
        <div class="navbar-nav ms-auto">
          <button class="btn btn-sm btn-outline-light" @click="logout(); closeNavbar()">
            <i class="bi bi-box-arrow-right"></i> Đăng xuất
          </button>
        </div>
      </div>
    </div>
  </nav>
</template>

<script>
export default {
  name: 'AdminNavbar',
  methods: {
    closeNavbar() {
      // Close mobile hamburger menu after clicking a link
      const navbarCollapse = document.getElementById('adminNavLinks')
      if (navbarCollapse && navbarCollapse.classList.contains('show')) {
        navbarCollapse.classList.remove('show')
        const toggler = document.querySelector('.navbar-toggler')
        if (toggler) {
          toggler.classList.add('collapsed')
          toggler.setAttribute('aria-expanded', 'false')
        }
      }
    },
    toggleNavbar() {
      // Toggle navbar manually without Bootstrap JS
      const navbarCollapse = document.getElementById('adminNavLinks')
      const toggler = document.querySelector('.navbar-toggler')
      
      if (navbarCollapse && toggler) {
        const isExpanded = navbarCollapse.classList.contains('show')
        
        if (isExpanded) {
          navbarCollapse.classList.remove('show')
          toggler.classList.add('collapsed')
          toggler.setAttribute('aria-expanded', 'false')
        } else {
          navbarCollapse.classList.add('show')
          toggler.classList.remove('collapsed')
          toggler.setAttribute('aria-expanded', 'true')
        }
      }
    },
    logout() {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      this.$router.push('/login')
    }
  }
}
</script>

<style scoped>
.navbar {
  background-color: #1a1a1a !important;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.navbar-brand {
  font-weight: 700;
  font-size: 1.1rem;
  white-space: nowrap;
}

.navbar-brand i {
  margin-right: 0.3rem;
}

.navbar-toggler {
  border: 1px solid rgba(255, 255, 255, 0.3);
  padding: 0.25rem 0.5rem;
}

.navbar-toggler:focus {
  outline: none;
  box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
}

.nav-link {
  padding: 0.5rem 0.75rem !important;
  font-size: 0.95rem;
  transition: all 0.2s ease;
  border-radius: 0.25rem;
}

.nav-link:hover {
  background-color: rgba(255, 255, 255, 0.1);
  color: #f8f9fa !important;
}

.navbar-nav {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
}

/* Mobile responsive */
@media (max-width: 991px) {
  .navbar {
    padding: 0.5rem 0;
  }

  .container-fluid {
    padding-right: 0.5rem;
    padding-left: 0.5rem;
  }

  .navbar-brand {
    font-size: 0.95rem;
  }

  .navbar-collapse {
    margin-top: 0.5rem;
    background-color: rgba(26, 26, 26, 0.98);
    border-radius: 0.25rem;
    padding: 0.5rem;
  }

  .navbar-nav {
    flex-direction: column;
    margin-bottom: 0.5rem;
  }

  .nav-link {
    padding-left: 1rem !important;
    padding-right: 1rem !important;
  }

  .btn-outline-light {
    width: 100%;
    font-size: 0.85rem;
    margin-top: 0.5rem;
  }
}

/* Extra small screens */
@media (max-width: 576px) {
  .navbar-brand {
    font-size: 0.85rem;
  }

  .navbar-brand i {
    display: none;
  }

  .nav-link {
    padding: 0.4rem 0.5rem !important;
    font-size: 0.85rem;
  }
}
</style>
