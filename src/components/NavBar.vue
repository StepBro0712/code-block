<!-- NavBar.vue — шапка сайта -->
<template>
  <header class="navbar">
    <RouterLink to="/" class="brand">
      <img class="mark" src="../assets/fit-logo.svg" alt="FIT" />
      <span class="brand-text">
        <strong>CodeBlock</strong>
        <small class="brand-text">визуальный интерпретатор</small>
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
  background: #0b0809;
  border-bottom: 1px solid #ff0000;
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
  height: auto;
  display: block;
}
.brand-text {
  display: flex;
  flex-direction: column;
  line-height: 1.15;
}
.brand-text strong {
  font-size: 18px;
  color: #ff0000;
}
.brand-text small {
  font-size: 12px;
  color: #ffffff;
}
.nav-links {
  display: flex;
  gap: 6px;
}
.nav-links a {
  padding: 7px 14px;
  border-radius: 8px;
  text-decoration: none;
  color: #ffffff;
  font-size: 14px;
  font-weight: 600;
}
.nav-links a:hover {
  background: #fd0025;
  color: #fff;
}
.nav-links a.router-link-active {
  background: #2c0f12;
  color: #fff;
  box-shadow: inset 2px 0 0 var(--accent-hi, #d83440);
}
</style>
