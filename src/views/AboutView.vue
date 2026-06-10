<!-- AboutView.vue — описание проекта -->
<template>
  <section class="about">
    <h1>О проекте</h1>
    <p>
      <b>Codeblock</b> — визуальный блочный интерпретатор алгоритмов. Программа
      собирается из перетаскиваемых структурных блоков, а исполняется
      <b>собственным интерпретатором</b>, написанным с нуля: токенайзер →
      парсер рекурсивного спуска (AST) → обход AST → обход дерева блоков на
      генераторе (что и даёт пошаговую отладку и подсветку текущего блока).
    </p>
    <p>
      Программа <b>не превращается в текст</b> и не исполняется через
      <code>eval</code>, <code>Function</code> или сторонние парсеры. Vue
      используется только для интерфейса.
    </p>

    <h2>Что реализовано</h2>
    <ul>
      <li>Основа: целые переменные, присваивание, арифметика (+ − ∗, целочисленное деление, %), скобки, условие <code>if</code> со всеми сравнениями.</li>
      <li>Сортировка пузырьком: циклы <code>while</code> и <code>for</code>, <code>if/else</code>, массивы с индексацией, логика <code>AND/OR/NOT</code>.</li>
      <li>Дополнительно: функции с рекурсией, строки, числа с плавающей точкой, пошаговая отладка, сохранение/загрузка алгоритма.</li>
      <li>Подсветка синтаксических ошибок и ошибок времени исполнения на конкретном блоке.</li>
    </ul>

    <p class="hint">
      Готовые примеры доступны в меню «Примеры…» на странице редактора.
    </p>
  </section>
</template>

<script>
export default { name: 'AboutView' };
</script>

<style scoped>
.about {
  max-width: 760px;
  margin: 0 auto;
  padding: 32px 20px;
  color: #ffffff;
  line-height: 1.6;
}
.about h1 {
  color: #fff;
  margin-bottom: 8px;
}
.about h2 {
  color: #fff;
  margin-top: 28px;
  border-left: 3px solid var(--accent, #b5232b);
  padding-left: 10px;
}
.about b {
  color: #ff0000;
}
.about code {
  font-family: "JetBrains Mono", ui-monospace, monospace;
  background: #ffffff;
  padding: 1px 6px;
  border-radius: 5px;
  color: #000000;
}
.about ul {
  padding-left: 20px;
}
.about li {
  margin: 6px 0;
}
.hint {
  color: #616161;
}
</style>
