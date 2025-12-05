<template>
  <nav class="navbar navbar-expand-md navbar-dark bg-dark sticky-top">
    <div class="container-fluid px-2 px-md-3">
      <router-link class="navbar-brand text-white fw-bold" to="/">
        <i class="bi bi-book"></i> Thư viện
      </router-link>

      <div class="d-flex d-md-none align-items-center gap-2">
        <!-- Notification icon on mobile -->
        <div v-if="user" class="navbar-nav">
          <li class="nav-item">
            <NotificationBell />
          </li>
        </div>
        <!-- Hamburger button -->
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navLinks"
          aria-controls="navLinks" aria-expanded="false" aria-label="Toggle navigation" @click="toggleNavbar">
          <span class="navbar-toggler-icon"></span>
        </button>
      </div>

      <div class="collapse navbar-collapse" id="navLinks">
        <!-- centered main links -->
        <ul class="navbar-nav mx-auto mt-2 mt-md-0">
          <li class="nav-item"><router-link class="nav-link text-white" to="/" @click="closeNavbar">Trang
              chủ</router-link></li>
          <li class="nav-item"><router-link class="nav-link text-white" to="/books" @click="closeNavbar">Danh sách
              sách</router-link></li>
          <li class="nav-item"><router-link class="nav-link text-white" to="/borrow-register" @click="closeNavbar">Đăng
              ký mượn</router-link>
          </li>
          <li v-if="!user" class="nav-item"><router-link class="nav-link text-white" to="/login"
              @click="closeNavbar">Đăng nhập</router-link>
          </li>
          <li v-if="!user" class="nav-item"><router-link class="nav-link text-white" to="/register"
              @click="closeNavbar">Đăng
              ký</router-link></li>
          <li v-if="user" class="nav-item"><router-link class="nav-link text-white" to="/my-loans"
              @click="closeNavbar">Danh sách
              mượn</router-link></li>
        </ul>

        <!-- right side: notifications and user dropdown (desktop only) -->
        <ul class="navbar-nav ms-auto align-items-center d-none d-md-flex gap-1" style="padding-right: 0.5rem;">
          <li v-if="user" class="nav-item">
            <NotificationBell />
          </li>
          <li v-if="user" class="nav-item dropdown" ref="dropdownRoot">
            <a class="nav-link dropdown-toggle text-white" href="#" role="button" @click.prevent="toggleDropdown">
              <i class="bi bi-person-circle"></i> {{ displayName }}
            </a>
            <ul :class="['dropdown-menu', 'dropdown-menu-end', { show: showDropdown }]" v-show="showDropdown">
              <li><router-link class="dropdown-item" to="/profile" @click="showDropdown = false">
                  <i class="bi bi-person-gear"></i> Thông tin tài khoản
                </router-link></li>
              <li>
                <hr class="dropdown-divider">
              </li>
              <li><a class="dropdown-item" @click.prevent="logout" href="#"><i class="bi bi-box-arrow-right"></i> Đăng
                  xuất</a></li>
            </ul>
          </li>
        </ul>

        <!-- Mobile user menu -->
        <div v-if="user" class="d-md-none border-top pt-2 mt-2">
          <div class="nav-link text-white-50 small mb-2 text-center">{{ displayName }}</div>
          <router-link to="/profile" class="btn btn-sm btn-outline-light w-100 mb-2" @click="closeNavbar">
            <i class="bi bi-person-gear"></i> Thông tin tài khoản
          </router-link>
          <button class="btn btn-sm btn-outline-danger w-100" @click="logout(); closeNavbar()">
            <i class="bi bi-box-arrow-right"></i> Đăng xuất
          </button>
        </div>
      </div>
    </div>
  </nav>
</template>

<script>
import api from '../services/api'
import NotificationBell from './NotificationBell.vue'
// import SimpleNotificationBell from './SimpleNotificationBell.vue' // For testing

export default {
  name: 'Navbar',
  components: {
    NotificationBell
    // SimpleNotificationBell // For testing
  },
  data() {
    return { user: null, showDropdown: false }
  },
  computed: {
    displayName() {
      if (!this.user) return ''
      return this.user.name || this.user.ten || this.user.email || 'Người dùng'
    }
  },
  created() {
    this.loadUser()
    // listen to storage events from other tabs
    window.addEventListener('storage', this.loadUser)
    // listen to in-app user change events (dispatched when code updates localStorage.user)
    window.addEventListener('user-changed', this.loadUser)
    // also poll localStorage in the same tab to catch updates that don't fire storage event
    this._userSyncInterval = setInterval(this.loadUser, 1000)
    // poll server for updated user profile when logged in (to catch admin-side changes)
    this._serverSyncInterval = setInterval(() => {
      if (localStorage.getItem('token')) this.refreshFromServer()
    }, 5000)
  },
  beforeUnmount() { window.removeEventListener('storage', this.loadUser); window.removeEventListener('user-changed', this.loadUser); this.removeDocListener(); if (this._userSyncInterval) clearInterval(this._userSyncInterval); if (this._serverSyncInterval) clearInterval(this._serverSyncInterval) },
  watch: {
    // update user info on route change (useful after login/register redirects)
    '$route'() { this.loadUser() }
  },
  methods: {
    loadUser() {
      try { this.user = JSON.parse(localStorage.getItem('user') || 'null') } catch (e) { this.user = null }
    },
    closeNavbar() {
      // Auto-close navbar collapse on mobile when link is clicked
      const navbarCollapse = document.querySelector('#navLinks')
      if (navbarCollapse) {
        // Remove 'show' class to close the navbar
        navbarCollapse.classList.remove('show')
        // Also ensure the toggler button is not expanded
        const toggler = document.querySelector('.navbar-toggler')
        if (toggler) {
          toggler.classList.add('collapsed')
          toggler.setAttribute('aria-expanded', 'false')
        }
      }
    },
    async refreshFromServer() {
      try {
        const res = await api.get('/users/me')
        const serverUser = res.data
        // if server user differs from local copy, update localStorage and notify
        let localU = null
        try { localU = JSON.parse(localStorage.getItem('user') || 'null') } catch (e) { localU = null }
        if (JSON.stringify(serverUser) !== JSON.stringify(localU)) {
          localStorage.setItem('user', JSON.stringify(serverUser))
          try { window.dispatchEvent(new Event('user-changed')) } catch (e) { /* ignore */ }
        }
      } catch (err) {
        // if token invalid/expired, clear and redirect to login (api interceptor may already handle this)
        if (err.response && err.response.status === 401) {
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          try { window.dispatchEvent(new Event('user-changed')) } catch (e) { /* ignore */ }
          this.$router.push('/login')
        }
      }
    },
    logout() {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      this.user = null
      this.showDropdown = false
      this.$router.push('/login')
    },
    toggleNavbar() {
      // Toggle navbar on hamburger click
      const navbarCollapse = document.querySelector('#navLinks')
      if (navbarCollapse) {
        new bootstrap.Collapse(navbarCollapse, { toggle: true })
      }
    },
    toggleDropdown() {
      this.showDropdown = !this.showDropdown
      if (this.showDropdown) this.addDocListener(); else this.removeDocListener()
    },
    onDocClick(e) {
      const root = this.$refs.dropdownRoot
      if (!root) return
      if (!root.contains(e.target)) {
        this.showDropdown = false
        this.removeDocListener()
      }
    },
    addDocListener() { document.addEventListener('click', this.onDocClick) },
    removeDocListener() { document.removeEventListener('click', this.onDocClick) }
  }
}
</script>

<style scoped>
.navbar {
  background-color: #222 !important;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.navbar-brand {
  font-weight: 700;
  color: #fff !important;
  font-size: 1.2rem;
  white-space: nowrap;
  margin-right: 0.5rem;
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

.navbar-nav .nav-link {
  color: #fff !important;
  padding: 0.5rem 0.75rem !important;
  font-size: 0.95rem;
  transition: color 0.2s ease;
  white-space: nowrap;
}

.navbar-nav .nav-link:hover {
  color: #f8f9fa !important;
  text-shadow: 0 0 8px rgba(255, 255, 255, 0.2);
}

.navbar-nav.mx-auto {
  display: flex;
  align-items: center;
}

/* Desktop dropdown styling */
.nav-item.dropdown {
  position: relative;
}

.dropdown-toggle::after {
  display: inline-block;
  margin-left: 0.3rem;
}

.dropdown-menu {
  min-width: 220px;
  right: 0;
  left: auto;
  margin-top: 0.5rem;
}

.dropdown-menu.dropdown-menu-end {
  right: 0 !important;
  left: auto !important;
}

.dropdown-menu.show {
  animation: slideDown 0.15s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-5px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.dropdown-item {
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
}

.dropdown-item:hover {
  background-color: #f8f9fa;
  color: #222;
}

/* Mobile responsive */
@media (max-width: 767px) {
  .navbar {
    padding: 0.5rem 0;
  }

  .container-fluid {
    padding-right: 0.5rem;
    padding-left: 0.5rem;
  }

  .navbar-brand {
    font-size: 1rem;
  }

  .navbar-nav .nav-link {
    padding: 0.5rem 0.5rem !important;
    font-size: 0.9rem;
  }

  .navbar-collapse {
    margin-top: 0.5rem;
    background-color: rgba(34, 34, 34, 0.95);
    border-radius: 0.25rem;
    padding: 0.5rem;
  }

  .navbar-nav.mx-auto {
    flex-direction: column;
    margin: 0.5rem 0;
  }

  .navbar-nav.mx-auto .nav-link {
    padding-left: 1rem !important;
    padding-right: 1rem !important;
  }

  .btn-outline-danger {
    border-color: #dc3545;
    color: #dc3545;
    font-size: 0.85rem;
  }

  .btn-outline-danger:hover {
    background-color: #dc3545;
    border-color: #dc3545;
  }

  .nav-link.text-white-50 {
    color: rgba(255, 255, 255, 0.7) !important;
    font-weight: 500;
  }
}

/* Extra small screens (< 360px) */
@media (max-width: 360px) {
  .navbar-brand {
    font-size: 0.9rem;
  }

  .navbar-brand i {
    display: none;
  }

  .navbar-nav .nav-link {
    padding: 0.4rem 0.4rem !important;
    font-size: 0.85rem;
  }
}
</style>
