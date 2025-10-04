/**
 * @file Vite configuration for the Discolors Chrome extension.
 * @description Sets up Vite with CRX plugin for Chrome extensions, defines
 * public assets directory, development server options, and HMR settings.
 */

// --- Imports ---
import { defineConfig } from 'vite';
import { crx } from '@crxjs/vite-plugin';
import manifest from './src/manifest.json';

// --- Vite Configuration ---
export default defineConfig({
  /**
   * Public directory for static assets
   * Files here are copied as-is to the build output.
   */
  publicDir: 'src/assets',

  /**
   * Plugins configuration
   * Using @crxjs/vite-plugin to handle Chrome extension manifest.
   */
  plugins: [crx({ manifest })],
  build: {
    outDir: 'build/discolors', // <- aqui você define a pasta de saída
    emptyOutDir: true, // limpa o diretório antes do build
  },

  /**
   * Development server configuration
   */
  server: {
    port: 5173, // Port to run the dev server
    strictPort: true, // Fail if port is already in use
    hmr: {
      clientPort: 5173, // HMR websocket port
    },
    cors: true, // Enable CORS for easier extension dev
  },
});
