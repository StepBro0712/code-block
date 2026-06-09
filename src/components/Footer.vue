<!-- Footer.vue — подвал сайта -->
<template>
  <footer class="footer">
    <div class="footer-inner">
      <span>Codeblock — собственный интерпретатор без eval и сторонних парсеров.</span>
      <span class="copy">© {{ year }} · Stepan, Nikita, Timaphey</span>
    </div>
  </footer>
</template>

<script>
export default {
  name: 'AppFooter',
  computed: {
    year() { return new Date().getFullYear(); },
  },
};
</script>

<style scoped>
.footer {
  background: #0f1822;
  border-top: 1px solid #26333f;
  padding: 12px 20px;
}
.footer-inner {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 18px;
  align-items: center;
  justify-content: space-between;
  color: #8da2b5;
  font-size: 13px;
}
.copy { color: #5d7385; }
</style>
