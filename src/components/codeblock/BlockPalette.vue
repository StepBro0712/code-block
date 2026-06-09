<!-- BlockPalette.vue — палитра блоков слева -->
<template>
  <aside class="panel palette">
    <div class="panel-head">Блоки</div>
    <div class="palette-scroll">
      <div class="cat-group" v-for="grp in palette" :key="grp.cat">
        <div class="cat-label">
          <span class="dot" :style="{ background: catColor(grp.cat) }"></span>{{ grp.title }}
        </div>
        <div
          class="pal-item"
          v-for="it in grp.items"
          :key="it.type"
          :style="{ '--c': catColor(grp.cat) }"
          draggable="true"
          @dragstart="ed.dragNewStart(it.type, $event)"
          @dragend="ed.dragEnd()"
          @dblclick="ed.appendToRoot(it.type)"
        >
          <span class="glyph">{{ it.glyph }}</span>{{ it.label }}
        </div>
      </div>
      <div class="muted">Перетащите блок на холст или дважды кликните, чтобы добавить в конец.</div>
    </div>
  </aside>
</template>

<script>
import { useEditor } from '../../composables/useEditor.js';
import { PALETTE, CAT_COLOR } from '../../blocks.js';

export default {
  name: 'BlockPalette',
  data() { return { ed: useEditor(), palette: PALETTE }; },
  methods: {
    catColor(c) { return CAT_COLOR[c]; },
  },
};
</script>
