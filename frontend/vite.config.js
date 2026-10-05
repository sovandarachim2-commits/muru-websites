import tailwindcss from '@tailwindcss/vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import { rmSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

const siteRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

export default defineConfig({
  server: {
    proxy: { '/api': { target: 'http://127.0.0.1:8002' } },
  },
  build: {
    outDir: siteRoot,
    emptyOutDir: false,
  },
  plugins: [
    {
      name: 'clean-site-assets',
      buildStart() {
        rmSync(path.join(siteRoot, 'assets'), { recursive: true, force: true })
      },
    },
    react(),
    tailwindcss(),
    babel({ presets: [reactCompilerPreset()] }),
  ],
})
