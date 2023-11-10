// Vue Router
import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';

// Auth Store
import { useAuthStore } from '@/stores/auth';

// Amplify
import { Auth, CognitoHostedUIIdentityProvider } from '@aws-amplify/auth';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'index',
    component: () => import('@/pages/index.vue'),
  },
  {
    path: '/likes',
    name: 'likes',
    component: () => import('@/pages/likes.vue'),
  },
  {
    path: '/playground',
    name: 'playground',
    component: () => import('@/pages/playground.vue'),
  },
  {
    path: '/search',
    name: 'search',
    component: () => import('@/pages/search.vue'),
    props: ({ query: { q } }) => ({ query: q }),
  },
  {
    path: '/settings',
    name: 'settings',
    component: () => import('@/pages/settings.vue'),
  },
  {
    path: '/users/:id',
    name: 'users-id',
    component: () => import('@/pages/users/_id.vue'),
    props: ({ params: { id } }) => ({ id }),
  },
  {
    path: '/watch',
    name: 'watch',
    component: () => import('@/pages/watch.vue'),
    props: ({ query: { v } }) => ({ id: v }),
  },
  {
    path: '/:pathMatch(.*)',
    redirect: '/',
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(_, __, savedPosition) {
    return savedPosition ?? { top: 0 };
  },
});

router.beforeEach(async ({ name }) => {
  const auth = useAuthStore();

  if (auth.user) {
    return true;
  }

  if (['likes', 'settings'].includes(String(name))) {
    return await Auth.federatedSignIn({ provider: CognitoHostedUIIdentityProvider.Google }).then(() => {
      return false;
    });
  }
});

export default router;
