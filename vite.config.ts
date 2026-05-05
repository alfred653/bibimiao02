import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// PWA 插件待 Phase 4 安装（当前 vite-plugin-pwa 不支持 Vite 8）
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { port: 5173 },
});
