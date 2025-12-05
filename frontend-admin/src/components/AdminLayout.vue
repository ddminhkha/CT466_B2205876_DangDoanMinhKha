<template>
  <div class="admin-wrapper">
    <AdminNavbar v-if="isAuthenticated" />

    <!-- When authenticated keep the normal centered content width; when not, center the router-view vertically -->
    <main v-if="isAuthenticated" class="admin-main" style="padding:16px;max-width:1000px;margin:0 auto;">
      <router-view v-slot="{ Component, route }">
        <transition name="page" mode="out-in">
          <component :is="Component" :key="route.path" />
        </transition>
      </router-view>
    </main>

    <main v-else class="d-flex align-items-center justify-content-center flex-grow-1" style="padding:16px;">
      <router-view v-slot="{ Component, route }">
        <transition name="page" mode="out-in">
          <component :is="Component" :key="route.path" />
        </transition>
      </router-view>
    </main>

    <!-- <AdminFooter v-if="isAuthenticated" /> -->
  </div>
</template>

<script>
import AdminNavbar from './AdminNavbar.vue'
// import AdminFooter from './AdminFooter.vue'

export default {
  components: { AdminNavbar }, // AdminFooter
  computed: {
    isAuthenticated() {
      // reference $route to make this computed update on route changes
      // eslint-disable-next-line no-unused-expressions
      this.$route && this.$route.fullPath
      return !!localStorage.getItem('token')
    }
  }
}
</script>

<style scoped>
.admin-wrapper {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.admin-main {
  flex: 1;
}

/* Unified page transition effect */
.page-enter-active,
.page-leave-active {
  transition: all 0.3s ease;
}

.page-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.page-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
