// Vue Router
import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'index',
    component: () => import('@/views/IndexView.vue'),
  },
  {
    path: '/watch',
    name: 'watch',
    component: () => import('@/views/WatchView.vue'),
    props: ({ query: { v: id } }) => ({ id }),
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
