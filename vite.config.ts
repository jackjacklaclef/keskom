import { execSync } from 'node:child_process'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// Identifie le build déployé : sha Vercel en prod, sinon le sha git local.
const commitSha =
  process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ||
  (() => {
    try {
      return execSync('git rev-parse --short HEAD').toString().trim()
    } catch {
      return 'dev'
    }
  })()

// https://vite.dev/config/
export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(commitSha),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
  plugins: [
    react(),
    VitePWA({
      // 'prompt' plutôt que 'autoUpdate' : un nouveau build ne doit pas remplacer
      // silencieusement le service worker sous les pieds d'un onglet ouvert (perte
      // d'état en cours) — on affiche plutôt un bandeau (UpdatePrompt) qui laisse
      // l'utilisateur choisir le moment de recharger.
      registerType: 'prompt',
      includeAssets: ['icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-512-maskable.png'],
      manifest: {
        name: 'Keskom',
        short_name: 'Keskom',
        description: "Qu'est-ce qu'on mange ? Planificateur de repas familial.",
        start_url: '/',
        display: 'standalone',
        background_color: '#F6F1E4',
        theme_color: '#6B8C5A',
        orientation: 'portrait',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,ico}'],
      },
    }),
  ],
})
