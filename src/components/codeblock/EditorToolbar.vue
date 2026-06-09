<!-- EditorToolbar.vue — верхняя панель управления редактором -->
<template>
  <div class="toolbar">
    <button class="btn run" @click="ed.runInstant()" :disabled="exec.running">
      <span class="ico">▶</span> Запустить
    </button>
    <button class="btn debug" @click="ed.startDebug()" :disabled="exec.running && exec.mode === 'debug'">
      <span class="ico">⦿</span> Отладка
    </button>
    <button class="btn ghost" @click="ed.step()" :disabled="!exec.run || exec.finished" v-if="exec.mode === 'debug'">
      <span class="ico">⤓</span> Шаг
    </button>
    <button class="btn ghost" @click="ed.play()" :disabled="!exec.run || exec.finished || exec.playing" v-if="exec.mode === 'debug'">
      <span class="ico">⏩</span> Авто
    </button>
    <button class="btn stop" @click="ed.stopExec()" :disabled="!exec.run && !exec.running">
      <span class="ico">■</span> Стоп
    </button>

    <div class="sep"></div>
    <div class="speed" v-if="exec.mode === 'debug'">
      Скорость <input type="range" min="0" max="600" step="20" v-model.number="exec.delay" />
    </div>
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
  computed: {
    exec() { return this.ed.state.exec; },
  },
  methods: {
    onExample(ev) {
      const v = ev.target.value;
      ev.target.value = '';
      this.ed.loadExample(v);
    },
  },
};
</script>
