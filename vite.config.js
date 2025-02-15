
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [],
  server: {
    host: '0.0.0.0',
    hmr: true,
    allowedHosts: [
      'e1e6a6a9-d805-4c2a-8803-136776730b21-00-24tj4jdkm6wey.pike.replit.dev',
      '.replit.dev'
    ]
  }
})
