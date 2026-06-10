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
  background: #110b0c;
  border-top: 1px solid #3a1418;
  padding: 12px 20px;
}
.footer-inner {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 18px;
  align-items: center;
  justify-content: space-between;
  color: #b08a8c;
  font-size: 13px;
}
.copy {
  color: #7d5a5c;
}
</style>
