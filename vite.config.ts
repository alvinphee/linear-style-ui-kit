import { spawn } from 'node:child_process'
import path from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const root = import.meta.dirname

// While the dev server runs, keep the shadcn registry (public/r/) current:
// build it once at start, then again a moment after a part, the theme, or
// the files its descriptions and versions come from (CLAUDE.md,
// package.json) change. Same steps as `npm run registry`.
const REGISTRY_SOURCES = /^(?:src\/(?:components|blocks|lib)\/|src\/styles\.css$|CLAUDE\.md$|package\.json$)/

function registryWatch(): Plugin {
  let timer: ReturnType<typeof setTimeout> | undefined
  let running = false
  let again = false

  const step = (args: string[]) =>
    new Promise<void>((resolve, reject) => {
      const child = spawn(process.execPath, args, { cwd: root })
      let output = ''
      child.stdout.on('data', (chunk) => (output += chunk))
      child.stderr.on('data', (chunk) => (output += chunk))
      child.on('close', (code) => (code === 0 ? resolve() : reject(new Error(output.trim()))))
    })

  return {
    name: 'registry-watch',
    apply: 'serve',
    configureServer(server) {
      const log = server.config.logger
      const build = async () => {
        if (running) {
          again = true
          return
        }
        running = true
        try {
          await step([path.join(root, 'scripts/build-registry.mjs')])
          await step([path.join(root, 'node_modules/shadcn/dist/index.js'), 'build'])
          log.info('registry rebuilt (public/r/)', { timestamp: true })
        } catch (error) {
          log.error(`registry not rebuilt: ${(error as Error).message}`, { timestamp: true })
        } finally {
          running = false
          if (again) {
            again = false
            void build()
          }
        }
      }
      const changed = (file: string) => {
        if (!REGISTRY_SOURCES.test(path.relative(root, file).split(path.sep).join('/'))) return
        clearTimeout(timer)
        timer = setTimeout(build, 1500)
      }
      server.watcher.on('add', changed).on('change', changed).on('unlink', changed)
      void build()
    },
  }
}

// Port 5180, not Vite's default 5173, so it never clashes with another Vite app.
export default defineConfig({
  plugins: [react(), tailwindcss(), registryWatch()],
  resolve: { alias: { '@': path.resolve(root, './src') } },
  server: { port: 5180, strictPort: true },
})
