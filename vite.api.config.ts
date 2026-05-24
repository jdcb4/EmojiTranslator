import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    outDir: 'dist-api',
    emptyOutDir: true,
    ssr: 'src/api/node-server.ts',
    target: 'node22',
    rollupOptions: {
      output: {
        entryFileNames: 'node-server.js',
      },
    },
  },
});
