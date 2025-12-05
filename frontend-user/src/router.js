import { createRouter, createWebHistory } from 'vue-router'
import Login from './components/Login.vue'
import Register from './components/Register.vue'
import Homepage from './components/Homepage.vue'
import BookList from './components/BookList.vue'
import BorrowRegister from './components/BorrowRegister.vue'
import UserLoans from './components/UserLoans.vue'
import UserProfile from './components/UserProfile.vue'
import ForgotPassword from './components/ForgotPassword.vue'
import ResetPassword from './components/ResetPassword.vue'

const routes = [
    { path: '/', component: Homepage },
    { path: '/books', component: BookList },
    { path: '/login', component: Login },
    { path: '/register', component: Register },
    { path: '/forgot-password', component: ForgotPassword },
    { path: '/reset-password', component: ResetPassword },
    { path: '/borrow-register', component: BorrowRegister, meta: { requiresAuth: true } },
    { path: '/my-loans', component: UserLoans, meta: { requiresAuth: true } },
    { path: '/profile', component: UserProfile, meta: { requiresAuth: true } }
]

const router = createRouter({ history: createWebHistory(), routes })

// global guard: if a route sets meta.requiresAuth === true, redirect to /login when no token
router.beforeEach((to, from, next) => {
    const requires = to.meta && to.meta.requiresAuth
    if (requires) {
        const t = localStorage.getItem('token')
        if (!t) return next({ path: '/login', query: { redirect: to.fullPath } })
    }
    next()
})

export default router
