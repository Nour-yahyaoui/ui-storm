import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const entry = fileURLToPath(new URL('./src/index.ts', import.meta.url));

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    target: 'es2022',
    sourcemap: true,
    lib: {
      entry,
      formats: ['es'],
      fileName: 'accessible-ui-lab',
      cssFileName: 'accessible-ui-lab',
    },
    rollupOptions: {
      // Consumers bring their own React. Keeping it external is what makes the
      // bundle small and prevents the classic "two Reacts" hooks crash.
      external: ['react', 'react-dom', 'react/jsx-runtime', 'react-dom/client'],
    },
  },
});
