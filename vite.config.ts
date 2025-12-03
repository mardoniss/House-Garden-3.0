import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Use '.' instead of process.cwd() to avoid TypeScript error "Property 'cwd' does not exist on type 'Process'"
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react()],
    define: {
      // Isso garante que process.env.API_KEY funcione no navegador sem alterar seu código
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
      // Polyfill simples para evitar erros de process.env em outras partes
      'process.env': JSON.stringify(env)
    },
    server: {
      port: 3000
    }
  };
});