import { defineConfig } from 'vite'
import { crx } from '@crxjs/vite-plugin'
import manifest from './manifest.json'

export default defineConfig({
  base: './',
  build: {
    outDir: 'dist_firefox',
  },
  plugins: [
    crx({
      manifest,
      browser: 'firefox',
    }),
  ]
})
