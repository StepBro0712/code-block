<!-- NavBar.vue — шапка сайта -->
<template>
  <header class="navbar">
    <RouterLink to="/" class="brand">
      <span class="mark"></span>
      <span class="brand-text">
        <strong>Codeblock</strong>
        <small>визуальный интерпретатор алгоритмов</small>
      </span>
    </RouterLink>

    <nav class="nav-links">
      <RouterLink to="/">Редактор</RouterLink>
      <RouterLink to="/about">О проекте</RouterLink>
    </nav>
  </header>
</template>

<script>
export default { name: 'NavBar' };
</script>

<style scoped>
.navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 10px 20px;
  background: #0f1822;
  border-bottom: 1px solid #26333f;
}
.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  text-decoration: none;
  color: inherit;
}
.mark {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  background: conic-gradient(from 140deg, #2dd4bf, #5b9bff, #a78bfa, #fb7185, #2dd4bf);
  box-shadow: 0 0 0 1px rgba(255, 255, 255, .08) inset;
}
.brand-text {
  display: flex;
  flex-direction: column;
  line-height: 1.15;
}
.brand-text strong {
  font-size: 18px;
  color: #e7eef5;
}
.brand-text small {
  font-size: 12px;
  color: #8da2b5;
}
.nav-links {
  display: flex;
  gap: 6px;
}
.nav-links a {
  padding: 7px 14px;
  border-radius: 8px;
  text-decoration: none;
  color: #b9c8d6;
  font-size: 14px;
  font-weight: 600;
}
.nav-links a:hover {
  background: #182532;
  color: #fff;
}
.nav-links a.router-link-active {
  background: #1c2a38;
  color: #fff;
}
</style>
