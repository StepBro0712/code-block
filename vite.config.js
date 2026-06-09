import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

// Конфигурация Vite: подключаем поддержку .vue-компонентов
export default defineConfig({
  plugins: [vue()],
});
