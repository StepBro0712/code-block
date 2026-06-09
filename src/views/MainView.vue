<!-- MainView.vue — главная страница: редактор алгоритмов -->
<template>
  <section class="view-editor">
    <CodeBlockEditor />
  </section>
</template>

<script>
import CodeBlockEditor from '../components/codeblock/CodeBlockEditor.vue';

export default {
  name: 'MainView',
  components: { CodeBlockEditor },
};
</script>

<style scoped>
.view-editor { padding: 16px; }
</style>
