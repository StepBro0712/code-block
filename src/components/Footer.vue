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
  background: #0b0809;
  border-top: 1px solid #ff0000;
  padding: 12px 20px;
}
.footer-inner {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 18px;
  align-items: center;
  justify-content: space-between;
  color: #ffffff;
  font-size: 13px;
}
.copy {
  color: #7e7e7e;
}
</style>
