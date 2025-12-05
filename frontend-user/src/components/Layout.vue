<template>
  <div class="app-wrapper">
    <Navbar />
    <main class="app-main">
      <router-view />
    </main>
    <FooterBar />
  </div>
</template>

<script>
import Navbar from './Navbar.vue'
import FooterBar from './Footer.vue'
export default {
  name: 'Layout',
  components: { Navbar, FooterBar }
}
</script>

<style>
.app-wrapper {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-main {
  flex: 1;
  width: 100%;
  max-width: 1000px;
  margin: 0 auto;
  padding: 0;
}
</style>
