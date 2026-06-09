# Codeblock — модульный проект на Vue 3 + Vite

Сайт собран как настоящий проект: `index.html` — только точка входа,
он подключает `/src/main.js`, а тот импортирует компоненты и модули.
Вся логика разнесена по отдельным файлам.

## Как запустить

```bash
npm install
npm run dev
```

Откроется на `http://localhost:5173`. Сборка для сдачи — `npm run build`.

Проверить ядро интерпретатора без браузера:

```bash
node interpreter.test.mjs     # 21 тест, все проходят
```

## Что на что ссылается

```
index.html                      → <script type="module" src="/src/main.js">
  └─ src/main.js                → createApp(App).use(router); import './assets/codeblock.css'
       ├─ src/App.vue           → <NavBar/> <RouterView/> <Footer/>
       ├─ src/router/index.js   → '/' → MainView, '/about' → AboutView
       ├─ src/components/NavBar.vue
       ├─ src/components/Footer.vue
       └─ src/views/MainView.vue
            └─ components/codeblock/CodeBlockEditor.vue
                 ├─ EditorToolbar.vue   (Запуск/Отладка/Шаг/Стоп, файлы, примеры)
                 ├─ BlockPalette.vue    (палитра блоков слева)
                 ├─ BlockSlot.vue  ⇄ BlockNode.vue   (рекурсивные блоки)
                 └─ Inspector.vue       (статус, переменные, консоль)
```

Общие данные и логика вынесены в обычные модули, которые импортируются где нужно:

- `src/interpreter.js` — **ядро**: токенайзер, парсер рекурсивного спуска (AST),
  обход AST, обход дерева блоков на генераторе. Без `eval` и сторонних парсеров.
- `src/blocks.js` — описание блоков: категории, подписи, палитра, фабрика блоков,
  компиляция UI-блока в форму интерпретатора, готовые примеры.
- `src/composables/useEditor.js` — общий стор (`useEditor()`): программа,
  drag-and-drop, движок запуска/отладки, проверка ошибок, сохранение/загрузка.
- `src/assets/codeblock.css` — все стили редактора (под `.codeblock`, чтобы не
  конфликтовать с остальным сайтом).

## Если вставлять в свой проект

У тебя уже есть `src/components/NavBar.vue`, `Footer.vue`, `views/…` и роутер.
Можно перенести по частям:

1. Скопируй `src/interpreter.js`, `src/blocks.js`, `src/composables/useEditor.js`,
   `src/assets/codeblock.css` и папку `src/components/codeblock/`.
2. В `main.js` добавь `import './assets/codeblock.css';`.
3. В нужном view (например `EditsView.vue` или `MainView.vue`) подключи редактор:
   ```vue
   <script>
   import CodeBlockEditor from '../components/codeblock/CodeBlockEditor.vue';
   export default { components: { CodeBlockEditor } };
   </script>
   <template><CodeBlockEditor /></template>
   ```
4. Свои `NavBar.vue` / `Footer.vue` оставляй — они независимы.

## Соответствие заданию (кратко)

- **Основа** — целые переменные, присваивание, арифметика (+ − ∗, целочисленное
  деление, %), скобки, `if` со всеми сравнениями. ✅
- **Сортировка пузырьком** — `while` и `for`, `if/else`, массивы с индексацией,
  логика `AND/OR/NOT`. Пример «Сортировка пузырьком» в меню. ✅
- **HARD (доп.)** — функции с рекурсией, строки, float, пошаговая отладка,
  сохранение/загрузка алгоритма. ✅
- **Ошибки** — подсветка синтаксиса и ошибок исполнения на конкретном блоке. ✅

Интерпретация написана вручную; программа хранится в дереве блоков и не
превращается в текст. Vue — только для интерфейса (разрешено заданием).

## Git

```bash
git add .
git commit -m "Codeblock: модульная структура (Vue SFC) + интерпретатор"
git push
```
