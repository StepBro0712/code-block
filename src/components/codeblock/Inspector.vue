<!-- Inspector.vue — правая панель: статус, переменные, консоль -->
<template>
  <aside class="panel inspector">
    <div class="panel-head">Состояние</div>
    <div class="inspector-body">
      <div class="status" :class="ed.statusClass()">
        <span class="dot"></span>{{ ed.statusText() }}
      </div>

      <div class="sub-head">Переменные <span>{{ exec.vars.length }}</span></div>
      <div v-if="!exec.vars.length" class="muted">Пока пусто. Запустите программу.</div>
      <div class="var-row" v-for="v in exec.vars" :key="v.name">
        <span class="vn">{{ v.name }}</span>
        <span class="vt">{{ v.type }}</span>
        <span class="vv" :class="{ arr: v.type === 'array' }">{{ v.value }}</span>
      </div>

      <div class="sub-head">
        Консоль вывода
        <span><button class="mini" @click="exec.output = []">очистить</button></span>
      </div>
      <div class="console">
        <div v-if="!exec.output.length" class="empty">— нет вывода —</div>
        <div class="ln" v-for="(o, i) in exec.output" :key="i">{{ o }}</div>
      </div>
    </div>
  </aside>
</template>

<script>
import { useEditor } from '../../composables/useEditor.js';

export default {
  name: 'EditorInspector',
  data() { return { ed: useEditor() }; },
  computed: {
    exec() { return this.ed.state.exec; },
  },
};
</script>
