<!-- CodeBlockEditor.vue — собирает редактор: панель + палитра + холст + инспектор -->
<template>
  <div class="codeblock">
    <header class="cb-topbar">
      <EditorToolbar />
      <div class="cat-pill">
        <span class="dot" :style="{ background: 'var(--run)' }"></span>
        <span>Шагов: <b>{{ exec.steps }}</b></span>
      </div>
    </header>

    <div class="cb-body">
      <BlockPalette />

      <main class="panel canvas-wrap" @dragend="ed.dragEnd()">
        <p class="canvas-title">Программа · {{ program.length }} блок(ов) верхнего уровня</p>
        <div v-if="!program.length" class="empty-hint">
          <b>Холст пуст</b>
          Перетащите сюда блоки слева, чтобы собрать алгоритм.<br />
          Или загрузите готовый пример из меню «Примеры…».
        </div>
        <BlockSlot :list="program" rail="#2a3a47" />
      </main>

      <Inspector />
    </div>
  </div>
</template>

<script>
import { useEditor } from '../../composables/useEditor.js';
import EditorToolbar from './EditorToolbar.vue';
import BlockPalette from './BlockPalette.vue';
import BlockSlot from './BlockSlot.vue';
import Inspector from './Inspector.vue';

export default {
  name: 'CodeBlockEditor',
  components: { EditorToolbar, BlockPalette, BlockSlot, Inspector },
  data() { return { ed: useEditor() }; },
  computed: {
    program() { return this.ed.state.program; },
    exec() { return this.ed.state.exec; },
  },
};
</script>
