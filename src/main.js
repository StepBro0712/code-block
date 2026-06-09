/* Точка входа приложения. index.html подключает именно этот файл. */
import { createApp } from 'vue';
import App from './App.vue';
import router from './router/index.js';
import './assets/base.css';
import './assets/codeblock.css';

// рекурсивные компоненты регистрируем глобально, чтобы они видели друг друга
import BlockSlot from './components/codeblock/BlockSlot.vue';
import BlockNode from './components/codeblock/BlockNode.vue';

const app = createApp(App);
app.use(router);
app.component('BlockSlot', BlockSlot);
app.component('BlockNode', BlockNode);
app.mount('#app');
