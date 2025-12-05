import axios from 'axios'
import { useConfirmDialog } from '../composables/useConfirmDialog'

const api = axios.create({ baseURL: 'http://localhost:4000/api' })

api.interceptors.request.use(cfg => {
    const t = localStorage.getItem('token')
    if (t) cfg.headers.Authorization = 'Bearer ' + t
    return cfg
})

// handle errors globally - 401, 403 (banned)
api.interceptors.response.use(undefined, async err => {
    const status = err.response?.status
    const data = err.response?.data || {}
    const msg = (data.message || data.error || err.message || '').toString().toLowerCase()
    const { showAlert } = useConfirmDialog()

    // Handle banned account (403)
    if (status === 403 && (msg.includes('bị khoá') || msg.includes('khoá'))) {
        localStorage.removeItem('token')
        try {
            await showAlert({
                title: 'Tài khoản bị khoá',
                message: 'Tài khoản của bạn đã bị khoá bởi quản trị viên. Vui lòng liên hệ đến dangdmkha@gmail.com để xử lý.',
                type: 'danger',
                confirmText: 'Đóng'
            })
            // Only redirect if not already on login page
            if (window.location.pathname !== '/login') {
                window.location = '/login'
            }
        } catch (e) { }
    }
    // Handle token errors (401)
    else if (status === 401) {
        localStorage.removeItem('token')
        try {
            // Only redirect if not already on login page
            if (window.location.pathname !== '/login') {
                window.location = '/login'
            }
        } catch (e) { }
    }
    return Promise.reject(err)
})

export default api
