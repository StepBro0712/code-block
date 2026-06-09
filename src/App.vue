<!-- App.vue — корневой макет сайта -->
<template>
  <div class="app-shell">
    <NavBar />
    <main class="app-main">
      <RouterView />
    </main>
    <Footer />
  </div>
</template>

<script>
import NavBar from './components/NavBar.vue';
import Footer from './components/Footer.vue';

export default {
  name: 'App',
  components: { NavBar, Footer },
};
</script>

<style scoped>
.app-shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
.app-main { flex: 1; }
</style>
