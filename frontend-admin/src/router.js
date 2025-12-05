import { createRouter, createWebHistory } from 'vue-router'
import Login from './components/Login.vue'
import Books from './components/Books.vue'
import BookTitles from './components/BookTitles.vue'
import Dashboard from './components/Dashboard.vue'
import Users from './components/Users.vue'
import Publishers from './components/Publishers.vue'
import Loans from './components/Loans.vue'
import DetailedStats from './components/DetailedStats.vue'
import EmailManager from './components/EmailManager.vue'

const routes = [
    { path: '/', component: Dashboard, meta: { requiresAuth: true } },
    { path: '/books', component: Books, meta: { requiresAuth: true } },
    { path: '/booktitles', component: BookTitles, meta: { requiresAuth: true } },
    { path: '/loans', component: Loans, meta: { requiresAuth: true } },
    { path: '/users', component: Users, meta: { requiresAuth: true } },
    { path: '/publishers', component: Publishers, meta: { requiresAuth: true } },
    { path: '/stats', component: DetailedStats, meta: { requiresAuth: true } },
    { path: '/emails', component: EmailManager, meta: { requiresAuth: true } },
    { path: '/login', component: Login }
]

const router = createRouter({ history: createWebHistory(), routes })

// simple auth guard: check that a token exists in localStorage
router.beforeEach((to, from, next) => {
    const token = localStorage.getItem('token')

    // Only protect routes with requiresAuth
    if (to.meta.requiresAuth && !token) {
        return next('/login')
    }

    next()
})

export default router
