import axios from 'axios'
import { useConfirmDialog } from '../composables/useConfirmDialog'

const api = axios.create({ baseURL: 'http://localhost:4000/api' })

// optional: add interceptor to attach token
api.interceptors.request.use(cfg => {
    const token = localStorage.getItem('token')
    if (token) cfg.headers.Authorization = 'Bearer ' + token
    return cfg
})

// response interceptor: handle expired / invalid token / banned account globally
api.interceptors.response.use(
    res => res,
    async err => {
        const status = err.response?.status
        const data = err.response?.data || {}
        const msg = (data.message || data.error || err.message || '').toString().toLowerCase()
        const { showAlert } = useConfirmDialog()

        // Handle banned account (403 with 'bị khoá' or 'khoá')
        if (status === 403 && (msg.includes('bị khoá') || msg.includes('khoá'))) {
            try {
                localStorage.removeItem('token')
                localStorage.removeItem('user')
            } catch (e) { }

            await showAlert({
                title: 'Tài khoản bị khoá',
                message: 'Tài khoản của bạn đã bị khoá bởi quản trị viên. Vui lòng liên hệ đến dangdmkha@gmail.com để xử lý.',
                type: 'danger',
                confirmText: 'Đóng'
            })
            window.location.href = '/login'
            return Promise.reject(err)
        }

        // Handle token errors (401)
        if (status === 401 && (msg.includes('jwt') || msg.includes('expired') || msg.includes('invalid'))) {
            // Only clear storage and redirect if we actually had a token (was logged in)
            const hadToken = localStorage.getItem('token')

            try {
                localStorage.removeItem('token')
                localStorage.removeItem('user')
            } catch (e) { }

            // Only show alert and redirect if we had a token and not on public pages
            const currentPath = window.location.pathname
            const publicPaths = ['/login', '/register', '/forgot-password', '/reset-password']

            if (hadToken && !publicPaths.includes(currentPath)) {
                await showAlert({
                    title: 'Phiên đăng nhập hết hạn',
                    message: 'Phiên đăng nhập đã hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại.',
                    type: 'warning',
                    confirmText: 'Đóng'
                })
                window.location.href = '/login'
            }
        }
        return Promise.reject(err)
    }
)

export default api
