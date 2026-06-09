<!-- BlockSlot.vue — список блоков с зонами вставки (drag-and-drop) -->
<template>
  <div class="slot" :class="{ nested }" :style="nested ? { '--rail': rail } : {}">
    <template v-for="(b, i) in list" :key="b.id">
      <div
        class="dropzone"
        :class="{ active: drag.active && drag.overKey === key(i) }"
        @dragover.prevent
        @dragenter.prevent="ed.over(key(i))"
        @dragleave="ed.out(key(i))"
        @drop.prevent.stop="ed.dropInto(list, b.id, $event)"
      ></div>
      <BlockNode :block="b" />
    </template>

    <div
      class="dropzone"
      :class="{ active: drag.active && drag.overKey === key(list.length) }"
      @dragover.prevent
      @dragenter.prevent="ed.over(key(list.length))"
      @dragleave="ed.out(key(list.length))"
      @drop.prevent.stop="ed.dropInto(list, null, $event)"
    ></div>
  </div>
</template>

<script>
import { useEditor } from '../../composables/useEditor.js';

let _sid = 0;

export default {
  name: 'BlockSlot',
  props: {
    list: { type: Array, required: true },
    nested: { type: Boolean, default: false },
    rail: { type: String, default: '#2a3a47' },
  },
  data() {
    return { ed: useEditor(), sid: 's' + (++_sid) };
  },
  computed: {
    drag() { return this.ed.state.drag; },
  },
  methods: {
    key(i) { return this.sid + ':' + i; },
  },
};
</script>
