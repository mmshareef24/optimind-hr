import base44 from "@base44/vite-plugin"
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import path from 'path'

// https://vite.dev/config/
// Allow disabling Base44 plugin entirely when migrating off Base44.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const BASE44_ENABLED = env.BASE44_ENABLED === 'true'
  const BASE44_LEGACY = env.BASE44_LEGACY_SDK_IMPORTS === 'true'

  return {
    plugins: [
      BASE44_ENABLED
        ? base44({
            // Support for legacy code that imports the base44 SDK with @/integrations, @/entities, etc.
            // can be removed if the code has been updated to use the new SDK imports from @base44/sdk
            legacySDKImports: BASE44_LEGACY
          })
        : null,
      react(),
    ].filter(Boolean),
    resolve: {
      alias: {
        '@': path.resolve(process.cwd(), 'src')
      }
    },
    // Increase the default 500kB chunk size warning limit to reduce noisy warnings
    build: {
      chunkSizeWarningLimit: 1600
    }
  }
});