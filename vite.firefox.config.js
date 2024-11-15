import { defineConfig } from 'vite'
import { crx } from '@crxjs/vite-plugin'
import manifest from './manifest.json'

delete manifest['$schema']

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
