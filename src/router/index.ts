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
    component: () => import('@/views/IndexView.vue'),
  },
  {
    path: '/search',
    name: 'search',
    component: () => import('@/views/SearchView.vue'),
    props: ({ query: { q: query } }) => ({ query }),
  },
  {
    path: '/settings',
    name: 'settings',
    component: () => import('@/views/SettingsView.vue'),
  },
  {
    path: '/playground',
    name: 'playground',
    component: () => import('@/views/PlaygroundView.vue'),
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

router.beforeEach(async ({ name }) => {
  const auth = useAuthStore();

  if (auth.user) {
    return true;
  }

  if (['settings'].includes(String(name))) {
    return await Auth.federatedSignIn({ provider: CognitoHostedUIIdentityProvider.Google }).then(() => {
      return false;
    });
  }
});

export default router;
