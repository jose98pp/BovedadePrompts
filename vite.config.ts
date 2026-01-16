
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // Esto permite que process.env funcione en el cliente como lo espera el SDK de Gemini
    'process.env': {
      ...process.env,
      NODE_ENV: JSON.stringify(process.env.NODE_ENV || 'development')
    }
  },
  server: {
    port: 3000
  },
  build: {
    outDir: 'dist',
    sourcemap: false, // Desactivado para producción para evitar errores de carga de mapas fuente
    minify: 'esbuild'
  }
});
