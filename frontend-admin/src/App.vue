<template>
  <AdminLayout />
  <NotificationToast />
  <ConfirmDialog />
</template>

<script>
import { onMounted, onBeforeUnmount } from 'vue'
import AdminLayout from './components/AdminLayout.vue'
import NotificationToast from './components/NotificationToast.vue'
import ConfirmDialog from './components/ConfirmDialog.vue'
import api from './services/api.js'
import { useConfirmDialog } from './composables/useConfirmDialog'
import { useRouter } from 'vue-router'

export default {
  name: 'App',
  components: { AdminLayout, NotificationToast, ConfirmDialog },
  setup() {
    const { showAlert } = useConfirmDialog()
    const router = useRouter()
    let statusCheckInterval = null

    onMounted(() => {
      // Only check admin status if not on login page
      if (router.currentRoute.value.path !== '/login') {
        checkAdminStatus()
        statusCheckInterval = setInterval(checkAdminStatus, 30000)
      }
    })

    onBeforeUnmount(() => {
      if (statusCheckInterval) {
        clearInterval(statusCheckInterval)
        statusCheckInterval = null
      }
    })

    const checkAdminStatus = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) return

        const response = await api.get('/users/me')
        if (response.data.status === 'banned') {
          // Clear interval before redirect to prevent further calls
          if (statusCheckInterval) {
            clearInterval(statusCheckInterval)
            statusCheckInterval = null
          }

          localStorage.removeItem('token')
          await showAlert({
            title: 'Tài khoản bị khoá',
            message: 'Tài khoản của bạn đã bị khoá bởi quản trị viên. Vui lòng liên hệ đến dangdmkha@gmail.com để xử lý.',
            type: 'danger',
            confirmText: 'Đóng'
          })
          router.push('/login')
        }
      } catch (error) {
        // Error will be handled by API interceptor
        // If auth error, clear interval
        if (error.response && error.response.status === 401) {
          if (statusCheckInterval) {
            clearInterval(statusCheckInterval)
            statusCheckInterval = null
          }
        }
      }
    }
  }
}
</script>

<style>
body {
  font-family: Arial, Helvetica, sans-serif
}

/* Smooth scrolling for admin */
html {
  scroll-behavior: smooth;
}
</style>
