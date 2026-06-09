<!-- BlockNode.vue — карточка блока с полями и вложенными слотами -->
<template>
  <div class="block" :class="['cat-' + cat, { active: isActive, errored: !!errMsg }]" :style="{ '--c': color }">
    <div class="block-head">
      <span
        class="drag"
        draggable="true"
        title="Перетащить"
        @dragstart="ed.dragBlockStart(block, $event)"
        @dragend="ed.dragEnd()"
      >⠿</span>
      <span class="block-name">{{ label }}</span>

      <span class="block-fields" v-if="block.type === 'varDecl'">
        <input class="f name" style="width:auto;min-width:120px" v-model="block.names" placeholder="a, b, c" />
        <span class="kw">= 0</span>
      </span>

      <span class="block-fields" v-else-if="block.type === 'arrayDecl'">
        <input class="f name" v-model="block.name" placeholder="A" />
        <span class="kw">[ </span><input class="f tiny" v-model="block.size" placeholder="5" /><span class="kw"> ]</span>
      </span>

      <span class="block-fields" v-else-if="block.type === 'assign'">
        <input class="f name" v-model="block.target" placeholder="x" />
        <span class="kw">←</span>
        <input class="f expr" v-model="block.expr" placeholder="выражение" />
      </span>

      <span class="block-fields" v-else-if="block.type === 'arrayAssign'">
        <input class="f name" v-model="block.name" placeholder="A" />
        <span class="kw">[</span><input class="f tiny" v-model="block.index" placeholder="i" /><span class="kw">]</span>
        <span class="kw">←</span>
        <input class="f expr" v-model="block.expr" placeholder="выражение" />
      </span>

      <span class="block-fields" v-else-if="block.type === 'if'">
        <span class="kw">(</span><input class="f expr" v-model="block.cond" placeholder="a > b AND c" /><span class="kw">)</span>
      </span>

      <span class="block-fields" v-else-if="block.type === 'while'">
        <span class="kw">(</span><input class="f expr" v-model="block.cond" placeholder="i < n" /><span class="kw">)</span>
      </span>

      <span class="block-fields" v-else-if="block.type === 'for'">
        <input class="f name" v-model="block.initTarget" /><span class="kw">=</span><input class="f tiny" v-model="block.initExpr" />
        <span class="kw">;</span><input class="f expr" style="min-width:80px" v-model="block.cond" />
        <span class="kw">;</span><input class="f name" v-model="block.stepTarget" /><span class="kw">=</span><input class="f" style="min-width:60px" v-model="block.stepExpr" />
      </span>

      <span class="block-fields" v-else-if="block.type === 'print'">
        <input class="f expr" v-model="block.expr" placeholder='x  или  "текст"' />
      </span>

      <span class="block-fields" v-else-if="block.type === 'funcDef'">
        <input class="f name" style="color:var(--func)" v-model="block.name" placeholder="f" />
        <span class="kw">(</span><input class="f" v-model="block.params" placeholder="x, y" style="min-width:70px" /><span class="kw">)</span>
      </span>

      <span class="block-fields" v-else-if="block.type === 'funcCall'">
        <input class="f name" style="color:var(--func)" v-model="block.name" placeholder="f" />
        <span class="kw">(</span><input class="f expr" v-model="block.args" placeholder="аргументы" /><span class="kw">)</span>
      </span>

      <span class="block-fields" v-else-if="block.type === 'return'">
        <input class="f expr" v-model="block.expr" placeholder="выражение (необязательно)" />
      </span>

      <button class="x" title="Удалить" @click="ed.deleteBlock(block.id)">×</button>
    </div>

    <!-- тело if -->
    <template v-if="block.type === 'if'">
      <div class="block-body"><BlockSlot :list="block.body" :nested="true" rail="#3a3060" /></div>
      <div class="else-bar" v-if="block.hasElse">
        <span>иначе</span>
        <button class="mini" @click="ed.removeElse(block)">убрать иначе</button>
      </div>
      <div class="block-body" v-if="block.hasElse"><BlockSlot :list="block.elseBody" :nested="true" rail="#3a3060" /></div>
      <div class="else-bar" v-else><button class="mini" @click="ed.addElse(block)">+ добавить «иначе»</button></div>
    </template>

    <!-- тело while / for -->
    <template v-else-if="block.type === 'while' || block.type === 'for'">
      <div class="block-body"><BlockSlot :list="block.body" :nested="true" rail="#3a3060" /></div>
    </template>

    <!-- тело функции -->
    <template v-else-if="block.type === 'funcDef'">
      <div class="block-body"><BlockSlot :list="block.body" :nested="true" rail="#52303a" /></div>
    </template>

    <div class="err-msg" v-if="errMsg">⚠ {{ errMsg }}</div>
  </div>
</template>

<script>
import { useEditor } from '../../composables/useEditor.js';
import { catOf, CAT_COLOR, BLOCK_LABEL } from '../../blocks.js';

export default {
  name: 'BlockNode',
  props: { block: { type: Object, required: true } },
  data() {
    return { ed: useEditor() };
  },
  computed: {
    cat() { return catOf(this.block.type); },
    color() { return CAT_COLOR[this.cat]; },
    label() { return BLOCK_LABEL[this.block.type] || this.block.type; },
    isActive() { return this.ed.state.exec.activeId === this.block.id; },
    runtimeErr() {
      const e = this.ed.state.exec;
      return e.errorId === this.block.id ? e.errorMsg : null;
    },
    liveErr() { return this.ed.blockError(this.block); },
    errMsg() { return this.runtimeErr || this.liveErr; },
  },
};
</script>
