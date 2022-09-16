// Vue Router
import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'index',
    component: () => import('@/views/IndexView.vue'),
  },
  {
    path: '/:id([\\w-]{11})',
    name: 'watch',
    component: () => import('@/views/WatchView.vue'),
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;