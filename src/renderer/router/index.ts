import { createWebHashHistory, RouteComponent, createRouter, RouteRecordRaw } from 'vue-router'
import { setupLayouts } from 'virtual:generated-layouts'
import generatedRoutes from 'virtual:generated-pages'
import { useUserStore } from '../stores/userStore'

// const routes: Array<RouteRecordRaw> = [
//   {
//     path: '/',
//     redirect: () => {
//       return '/login'
//     }
//   },
//   {
//     path: '/login',
//     component: (): Promise<RouteComponent> => import('@renderer/views/login.vue'),
//     meta: { disallowAuthed: true }
//   },
//   {
//     path: '/publishing',
//     component: (): Promise<RouteComponent> => import('@renderer/publishing/views/ArtLayout.vue'),
//     meta: { disallowAuthed: true },
//     children: [
//       {
//         path: 'login',
//         component: (): Promise<RouteComponent> => import('@renderer/publishing/views/login.vue')
//       },
//       {
//         path: 'art',
//         component: (): Promise<RouteComponent> => import('@renderer/publishing/views/ChartInquiry.vue')
//       }
//     ]
//   }
// ]

const routes = setupLayouts(generatedRoutes)
const router = createRouter({
  history: createWebHashHistory(),
  routes,
  strict: true
})

router.beforeEach((to, from, next) => {
  if (to.meta.disallowAuthed) {
    return next()
  } else {
    const userStore = useUserStore()
    if (!userStore.isLogin) {
      return next({ path: '/Parent' })
    } else {
      return next()
    }
  }
})

export default router
