// Vite
import { defineConfig } from 'vite';

// HTML
import { createHtmlPlugin } from 'vite-plugin-html';

export default defineConfig({
  plugins: [
    createHtmlPlugin({
      entry: '/src/main.js',
      inject: {
        data: {
          title: 'ChipTube',
        },
      },
    }),
  ],
});
