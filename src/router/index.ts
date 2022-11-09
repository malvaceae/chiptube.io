// Vue Router
import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'index',
    component: () => import('@/views/IndexView.vue'),
  },
  {
    path: '/search',
    name: 'search',
    component: () => import('@/views/SearchView.vue'),
    props: ({ query: { q: query } }) => ({ query }),
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
  scrollBehavior(_, __, savedPosition) {
    return savedPosition ?? { top: 0 };
  },
});

export default router;
