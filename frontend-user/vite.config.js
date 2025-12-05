const { defineConfig } = require('vite')
const vue = require('@vitejs/plugin-vue').default || require('@vitejs/plugin-vue')

module.exports = defineConfig({
    plugins: [vue()],
    server: { port: 3000 }
})
