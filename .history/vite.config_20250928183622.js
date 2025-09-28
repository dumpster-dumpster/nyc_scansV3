import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/nyc_scansV3/', // Change this if your app is served from a different path
  build: {
    outDir: 'dist',
  },
})