// Vite
import { defineConfig, splitVendorChunkPlugin } from 'vite';

// HTML
import { createHtmlPlugin } from 'vite-plugin-html';

// Vue.js
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [
    splitVendorChunkPlugin(),
    createHtmlPlugin({
      entry: '/src/main.js',
      inject: {
        data: {
          title: 'ChipTube',
        },
      },
    }),
    vue(),
  ],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  build: {
    rollupOptions: {
      output: {
        assetFileNames: ({ source }) => {
          if (typeof source === 'string') {
            return '[ext]/[hash][extname]';
          }

          // GIF
          if (source[0] === 0x47 && source[1] === 0x49 && source[2] === 0x46 && source[3] === 0x38) {
            return 'img/[hash][extname]';
          }

          // JPEG
          if (source[0] === 0xFF && source[1] === 0xD8) {
            return 'img/[hash][extname]';
          }

          // PNG
          if (source[0] === 0x89 && source[1] === 0x50 && source[2] === 0x4E && source[3] === 0x47) {
            return 'img/[hash][extname]';
          }

          return '[ext]/[hash][extname]';
        },
        chunkFileNames: 'js/[hash].js',
        entryFileNames: 'js/[hash].js',
        intro: 'window.TONE_SILENCE_LOGGING = true;',
      },
    },
    chunkSizeWarningLimit: 1536,
  },
});
