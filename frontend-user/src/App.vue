<template>
  <Layout />
  <NotificationToast />
  <ConfirmDialog />
</template>

<script>
import Layout from './components/Layout.vue'
import NotificationToast from './components/NotificationToast.vue'
import ConfirmDialog from './components/ConfirmDialog.vue'

export default {
  name: 'App',
  components: { Layout, NotificationToast, ConfirmDialog }
}
</script>

<style>
/* global styles */
body {
  font-family: Arial, Helvetica, sans-serif;
  margin: 0;
}

/* Smooth scrolling for all pages */
html {
  scroll-behavior: smooth;
}
</style>
