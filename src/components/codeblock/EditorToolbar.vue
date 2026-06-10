<!-- EditorToolbar.vue — верхняя панель: запуск, файлы, примеры, очистка -->
<template>
  <div class="toolbar">
    <button class="btn run" @click="ed.runInstant()">
      <span class="ico">▶</span> Запустить
    </button>

    <div class="sep"></div>

    <button class="btn ghost tiny" @click="$refs.file.click()"><span class="ico">⭱</span> Открыть</button>
    <button class="btn ghost tiny" @click="ed.saveFile()"><span class="ico">⭳</span> Сохранить</button>
    <input ref="file" type="file" accept=".json,application/json" class="hide-file" @change="ed.loadFile($event)" />

    <select class="btn ghost tiny" @change="onExample($event)" style="padding-right:6px">
      <option value="">Примеры…</option>
      <option value="bubble">Сортировка пузырьком</option>
      <option value="factorial">Факториал (функция)</option>
      <option value="fizzbuzz">FizzBuzz</option>
    </select>
    <button class="btn ghost tiny" @click="ed.clearAll()"><span class="ico">⌫</span> Очистить</button>
  </div>
</template>

<script>
import { useEditor } from '../../composables/useEditor.js';

export default {
  name: 'EditorToolbar',
  data() { return { ed: useEditor() }; },
  methods: {
    onExample(ev) {
      const v = ev.target.value;
      ev.target.value = '';
      this.ed.loadExample(v);
    },
  },
};
</script>
