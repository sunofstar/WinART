import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import Pages from 'vite-plugin-pages'
import Layouts from 'vite-plugin-vue-layouts'
import { quasar, transformAssetUrls } from '@quasar/vite-plugin'
import * as path from 'path'
// https://vitejs.dev/config/
export default defineConfig({

    plugins: [
    vue({
      template: { transformAssetUrls }
    }),
    Pages({
      dirs: [
        { dir: 'src/renderer/views', baseRoute: '' },
        { dir: 'src/renderer/publishing', baseRoute: 'publishing' }
      ],
      extendRoute(route) {
        // return {
        //   beforeEnter: (route) => {
        //     console.log(route)
        //   }
        // }
      }
    }),
    Layouts({
      layoutsDirs: 'src/renderer/layout',
      defaultLayout: 'default'
    }),
    quasar({
      sassVariables: 'src/renderer/styles/quasar-variables.sass'
    })
  ],
  base: './',
  resolve: {
    alias: [
      { find: '@electron', replacement: path.resolve(__dirname, './src/electron') },
      { find: '@renderer', replacement: path.resolve(__dirname, './src/renderer') },
      { find: '@share', replacement: path.resolve(__dirname, './src/shared') }
    ]
  },
  server: {
    hmr: {
      overlay: false
    }
  },
  build: {
    outDir: 'dist/renderer',
    sourcemap: true
  }
})
