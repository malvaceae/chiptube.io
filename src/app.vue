<script lang="ts" setup>
// Vue.js
import { computed, ref, watch } from 'vue';

// Vue Router
import { useRouter } from 'vue-router';

// Stores
import { useAuthStore } from '@/stores/auth';
import { usePageStore } from '@/stores/page';

// Amplify
import { Auth, Hub } from 'aws-amplify';

// Quasar
import { useMeta, useQuasar } from 'quasar';

// Feedback Dialog
import FeedbackDialog from '@/components/FeedbackDialog.vue';

// Google Sign In
import GoogleSignIn from '@/components/GoogleSignIn.vue';

// Tune Dialog
import TuneDialog from '@/components/TuneDialog.vue';

// get stores
const auth = useAuthStore();
const page = usePageStore();

// get the $router object
const $router = useRouter();

// the drawer behavior
const drawerBehavior = computed(() => {
  const { name } = $router.resolve(location.pathname);
  if (['watch'].includes(String(name))) {
    return 'mobile';
  }
});

// get the $q object
const $q = useQuasar();

// set dark mode status
$q.dark.set(page.dark);

// watch dark mode status
watch(() => $q.dark.mode, (dark) => {
  page.dark = dark;
});

// use meta
useMeta({
  titleTemplate: (title) => `${title} - ChipTube`,
  meta: {
    description: {
      name: 'description',
    },
  },
});

// the drawer state
const drawer = ref(false);

// the search query
const query = ref(new URLSearchParams(location.search).get('q') ?? '');

// search
const search = async () => {
  if (query.value) {
    await $router.push({ name: 'search', query: { q: query.value } });
  }
};

// subscribe auth events
Hub.listen('auth', ({ payload: { event } }) => {
  switch (event) {
    case 'signIn':
    case 'signIn_failure':
      $router.replace({});
  }
});

// is loading
const isLoading = ref(true);

// get the current user
Auth.currentAuthenticatedUser({ bypassCache: true }).then(({ attributes }) => (auth.user = attributes)).catch(() => (auth.user = null)).finally(() => {
  isLoading.value = false;
});
</script>

<template>
  <q-layout view="hHh LpR fFf">
    <q-header>
      <q-toolbar>
        <q-btn flat round @click="drawer = !drawer">
          <q-icon name="mdi-menu" />
        </q-btn>
        <q-toolbar-title shrink>
          <router-link :to="{ name: 'index' }">
            ChipTube
          </router-link>
        </q-toolbar-title>
        <q-space />
        <q-input v-model="query" class="col-grow gt-xs" dense outlined placeholder="Search" square @keyup.enter="search">
          <template #after>
            <q-btn flat round @click="search">
              <q-icon name="mdi-magnify" />
            </q-btn>
          </template>
        </q-input>
        <q-space />
        <div class="row q-gutter-md no-wrap items-center">
          <template v-if="!isLoading">
            <template v-if="auth.user">
              <q-btn flat round @click="$q.dialog({ component: TuneDialog })">
                <q-icon name="mdi-music-note-plus" />
              </q-btn>
            </template>
            <q-btn flat round>
              <template v-if="auth.user">
                <q-avatar>
                  <img :src="auth.user.picture" referrerpolicy="no-referrer">
                </q-avatar>
              </template>
              <template v-else>
                <q-icon name="mdi-dots-vertical" />
              </template>
              <q-menu class="full-width no-shadow" anchor="bottom right" max-width="300px" self="top right" square>
                <q-list bordered dense padding>
                  <template v-if="auth.user">
                    <q-item>
                      <q-item-section avatar>
                        <q-avatar>
                          <img :src="auth.user.picture" referrerpolicy="no-referrer">
                        </q-avatar>
                      </q-item-section>
                      <q-item-section>
                        <q-item-label>
                          {{ auth.user.nickname }}
                        </q-item-label>
                        <q-item-label>
                          {{ auth.user.email }}
                        </q-item-label>
                      </q-item-section>
                    </q-item>
                    <q-separator spaced />
                    <q-item clickable v-close-popup @click="Auth.signOut()">
                      <q-item-section side>
                        <q-icon name="mdi-logout" />
                      </q-item-section>
                      <q-item-section>
                        Sign out
                      </q-item-section>
                    </q-item>
                    <q-separator spaced />
                  </template>
                  <q-item clickable>
                    <q-item-section side>
                      <q-icon name="mdi-theme-light-dark" />
                    </q-item-section>
                    <q-item-section>
                      <template v-if="page.dark === 'auto'">
                        Appearance: Device theme
                      </template>
                      <template v-if="page.dark === true">
                        Appearance: Dark
                      </template>
                      <template v-if="page.dark === false">
                        Appearance: Light
                      </template>
                    </q-item-section>
                    <q-item-section side>
                      <q-icon name="mdi-chevron-right" />
                    </q-item-section>
                    <q-menu class="no-shadow" anchor="top right" :offset="[1.33125, 9]" self="top right" square>
                      <q-list bordered dense padding>
                        <q-item-label caption header>
                          Setting applies to this browser only
                        </q-item-label>
                        <q-item clickable v-close-popup @click="$q.dark.set('auto')">
                          <q-item-section side>
                            <q-icon :class="{ invisible: !(page.dark === 'auto') }" name="mdi-check" />
                          </q-item-section>
                          <q-item-section>
                            Use device theme
                          </q-item-section>
                        </q-item>
                        <q-item clickable v-close-popup @click="$q.dark.set(true)">
                          <q-item-section side>
                            <q-icon :class="{ invisible: !(page.dark === true) }" name="mdi-check" />
                          </q-item-section>
                          <q-item-section>
                            Dark theme
                          </q-item-section>
                        </q-item>
                        <q-item clickable v-close-popup @click="$q.dark.set(false)">
                          <q-item-section side>
                            <q-icon :class="{ invisible: !(page.dark === false) }" name="mdi-check" />
                          </q-item-section>
                          <q-item-section>
                            Light theme
                          </q-item-section>
                        </q-item>
                      </q-list>
                    </q-menu>
                  </q-item>
                  <q-separator spaced />
                  <q-item active-class="" :to="{ name: 'settings' }">
                    <q-item-section side>
                      <q-icon name="mdi-cog-outline" />
                    </q-item-section>
                    <q-item-section>
                      Settings
                    </q-item-section>
                  </q-item>
                  <q-separator spaced />
                  <q-item disable>
                    <q-item-section side>
                      <q-icon name="mdi-help-circle-outline" />
                    </q-item-section>
                    <q-item-section>
                      Help
                    </q-item-section>
                  </q-item>
                  <q-item clickable v-close-popup @click="$q.dialog({ component: FeedbackDialog })">
                    <q-item-section side>
                      <q-icon name="mdi-message-alert-outline" />
                    </q-item-section>
                    <q-item-section>
                      Send feedback
                    </q-item-section>
                  </q-item>
                </q-list>
              </q-menu>
            </q-btn>
            <template v-if="auth.user === null">
              <google-sign-in />
            </template>
          </template>
          <template v-else>
            <q-avatar size="42px">
              <q-skeleton animation="none" type="QAvatar" />
            </q-avatar>
            <q-avatar size="42px">
              <q-skeleton animation="none" type="QAvatar" />
            </q-avatar>
          </template>
        </div>
      </q-toolbar>
    </q-header>
    <q-drawer v-model="drawer" :behavior="drawerBehavior" :persistent="$q.screen.gt.sm" show-if-above :width="240">
      <div class="column full-height">
        <q-toolbar v-if="drawerBehavior === 'mobile' || $q.screen.lt.md">
          <q-btn flat round @click="drawer = !drawer">
            <q-icon name="mdi-menu" />
          </q-btn>
          <q-toolbar-title shrink>
            <router-link :to="{ name: 'index' }">
              ChipTube
            </router-link>
          </q-toolbar-title>
        </q-toolbar>
        <q-scroll-area v-if="!isLoading" class="col-grow">
          <q-list dense padding>
            <q-item :active-class="$q.dark.isActive ? 'bg-grey-9' : 'bg-grey-4'" :to="{ name: 'index' }" v-ripple>
              <q-item-section side>
                <q-icon name="mdi-home-variant" />
              </q-item-section>
              <q-item-section>
                Home
              </q-item-section>
            </q-item>
            <q-item disable v-ripple>
              <q-item-section side>
                <q-icon name="mdi-youtube-subscription" />
              </q-item-section>
              <q-item-section>
                Subscriptions
              </q-item-section>
            </q-item>
            <q-item :active-class="$q.dark.isActive ? 'bg-grey-9' : 'bg-grey-4'" :to="{ name: 'playground' }" v-ripple>
              <q-item-section side>
                <q-icon name="mdi-pinwheel-outline" />
              </q-item-section>
              <q-item-section>
                Playground
              </q-item-section>
            </q-item>
            <q-separator spaced />
            <q-item disable v-ripple>
              <q-item-section side>
                <q-icon name="mdi-music-box-multiple-outline" />
              </q-item-section>
              <q-item-section>
                Library
              </q-item-section>
            </q-item>
            <q-item disable v-ripple>
              <q-item-section side>
                <q-icon name="mdi-history" />
              </q-item-section>
              <q-item-section>
                History
              </q-item-section>
            </q-item>
            <template v-if="auth.user">
              <q-item disable v-ripple>
                <q-item-section side>
                  <q-icon name="mdi-thumb-up-outline" />
                </q-item-section>
                <q-item-section>
                  Liked tunes
                </q-item-section>
              </q-item>
              <q-separator spaced />
            </template>
            <template v-else>
              <q-separator spaced />
              <q-item>
                <q-item-section class="q-gutter-sm">
                  <div class="q-px-sm">
                    Sign in to like tunes, comment, and subscribe.
                  </div>
                  <div class="q-px-sm">
                    <google-sign-in />
                  </div>
                </q-item-section>
              </q-item>
              <q-separator spaced />
            </template>
            <q-item :active-class="$q.dark.isActive ? 'bg-grey-9' : 'bg-grey-4'" :to="{ name: 'settings' }" v-ripple>
              <q-item-section side>
                <q-icon name="mdi-cog-outline" />
              </q-item-section>
              <q-item-section>
                Settings
              </q-item-section>
            </q-item>
            <q-item disable v-ripple>
              <q-item-section side>
                <q-icon name="mdi-flag-outline" />
              </q-item-section>
              <q-item-section>
                Report history
              </q-item-section>
            </q-item>
            <q-item disable v-ripple>
              <q-item-section side>
                <q-icon name="mdi-help-circle-outline" />
              </q-item-section>
              <q-item-section>
                Help
              </q-item-section>
            </q-item>
            <q-item clickable v-ripple @click="$q.dialog({ component: FeedbackDialog })">
              <q-item-section side>
                <q-icon name="mdi-message-alert-outline" />
              </q-item-section>
              <q-item-section>
                Send feedback
              </q-item-section>
            </q-item>
            <q-separator spaced />
            <q-item-label header>
              Others
            </q-item-label>
            <q-item href="https://github.com/malvaceae/chiptube.io" target="_blank" v-ripple>
              <q-item-section side>
                <q-icon name="mdi-github" />
              </q-item-section>
              <q-item-section>
                GitHub
              </q-item-section>
            </q-item>
            <q-separator spaced />
          </q-list>
        </q-scroll-area>
      </div>
    </q-drawer>
    <q-page-container>
      <router-view v-slot="{ Component }">
        <keep-alive exclude="playground,settings,watch" max="1">
          <component :is="Component" :key="$route.fullPath" />
        </keep-alive>
      </router-view>
    </q-page-container>
  </q-layout>
</template>

<style lang="scss" scoped>
.body--light {
  .q-layout {
    background-color: $grey-1;
  }

  .q-header {
    background-color: #fff;
  }

  .q-toolbar {
    color: $grey-8;
  }
}

.body--dark {
  .q-header {
    background-color: $dark;
  }
}

.q-menu .q-list .q-item {
  padding: 8px 16px;
}

.q-menu .q-list .q-item__label--header {
  padding: 5px 16px 13px;
}

.q-drawer .q-list .q-item {
  padding: 8px 25px;

  .q-item__section--side {
    padding-right: 25px;
  }
}

.q-drawer .q-list .q-item__label--header {
  padding: 8px 25px 16px;
}

a {
  color: inherit;
  text-decoration: none;
}
</style>
