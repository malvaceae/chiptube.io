<script lang="ts" setup>
// Vue.js
import { reactive, ref, watch } from 'vue';

// Vue Router
import { useRouter } from 'vue-router';

// Stores
import { useAuthStore } from '@/stores/auth';
import { usePageStore } from '@/stores/page';

// Amplify
import { API, Auth, Hub, Storage } from 'aws-amplify';

// Quasar
import { uid, useQuasar } from 'quasar';

// Google Sign In
import GoogleSignIn from '@/components/GoogleSignIn.vue';

// get stores
const auth = useAuthStore();
const page = usePageStore();

// get the $router object
const $router = useRouter();

// get the $q object
const $q = useQuasar();

// set dark mode status
$q.dark.set(page.dark);

// watch dark mode status
watch(() => $q.dark.mode, (dark) => {
  page.dark = dark;
});

// variables
const dialog = ref(false);
const drawer = ref(false);
const search = ref('');

// subscribe auth events
Hub.listen('auth', ({ payload: { event } }) => {
  switch (event) {
    case 'signIn':
    case 'signIn_failure':
      $router.replace({});
  }
});

// get the current user
Auth.currentAuthenticatedUser().then(({ attributes }) => (auth.user = attributes)).catch(() => (auth.user = null));

// the midi
const midi = ref<File | null>(null);

// the tune
const tune = reactive({
  title: '',
  description: '',
  midi,
});

// upload the tune
const uploadTune = async () => {
  if (tune.midi === null) {
    return;
  }

  // show loading
  $q.loading.show({ spinnerSize: 46 });

  // upload the tune
  const { key: midiKey } = await Storage.put(`tunes/${uid()}.mid`, tune.midi, {
    level: 'protected',
  });

  // register the tune info
  const data = await API.post('Api', '/tunes', {
    body: {
      title: tune.title,
      description: tune.description,
      midiKey,
    },
  });

  // move to watch route
  await $router.push({ name: 'watch', query: { v: data.id } });

  // close dialog
  dialog.value = false;

  // hide loading
  $q.loading.hide();
};
</script>

<template>
  <q-layout view="hHh lpR fFf">
    <q-header bordered>
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
        <q-input v-model="search" class="col-grow gt-xs" dense outlined placeholder="Search" square>
          <template #after>
            <q-btn flat round @click="void 0">
              <q-icon name="mdi-magnify" />
            </q-btn>
          </template>
        </q-input>
        <q-space />
        <div class="row q-gutter-md no-wrap items-center">
          <template v-if="auth.user">
            <q-btn flat round @click="dialog = !dialog">
              <q-icon name="mdi-music-note-plus" />
            </q-btn>
          </template>
          <q-btn flat round>
            <template v-if="auth.user">
              <q-avatar>
                <img :src="auth.user.picture">
              </q-avatar>
            </template>
            <template v-else>
              <q-icon name="mdi-dots-vertical" />
            </template>
            <q-menu class="full-width" anchor="bottom right" max-width="300px" self="top right" square>
              <q-list bordered padding>
                <template v-if="auth.user">
                  <q-item>
                    <q-item-section avatar>
                      <q-avatar>
                        <img :src="auth.user.picture">
                      </q-avatar>
                    </q-item-section>
                    <q-item-section>
                      <q-item-label>
                        {{ auth.user.name }}
                      </q-item-label>
                      <q-item-label>
                        {{ auth.user.email }}
                      </q-item-label>
                    </q-item-section>
                  </q-item>
                  <q-separator spaced />
                  <q-item clickable dense v-close-popup @click="Auth.signOut()">
                    <q-item-section side>
                      <q-icon name="mdi-logout" />
                    </q-item-section>
                    <q-item-section>
                      Sign out
                    </q-item-section>
                  </q-item>
                  <q-separator spaced />
                </template>
                <q-item clickable dense>
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
                  <q-menu anchor="top right" :offset="[1.33125, 9]" self="top right" square>
                    <q-list bordered padding>
                      <q-item dense>
                        <q-item-section>
                          <q-item-label caption>
                            Setting applies to this browser only
                          </q-item-label>
                        </q-item-section>
                      </q-item>
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
              </q-list>
            </q-menu>
          </q-btn>
          <template v-if="auth.user === null">
            <google-sign-in />
          </template>
        </div>
      </q-toolbar>
    </q-header>
    <q-drawer v-model="drawer" behavior="mobile" :width="240">
      <div class="column full-height">
        <q-toolbar>
          <q-btn flat round @click="drawer = !drawer">
            <q-icon name="mdi-menu" />
          </q-btn>
          <q-toolbar-title shrink>
            <router-link :to="{ name: 'index' }">
              ChipTube
            </router-link>
          </q-toolbar-title>
        </q-toolbar>
        <q-scroll-area class="col-grow">
          <q-list dense padding>
            <q-item :active-class="$q.dark.isActive ? 'bg-grey-9' : 'bg-grey-4'" :to="{ name: 'index' }" v-ripple>
              <q-item-section side>
                <q-icon name="mdi-home-variant" />
              </q-item-section>
              <q-item-section>
                Home
              </q-item-section>
            </q-item>
            <template v-if="auth.user === null">
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
            <template v-else>
              <q-separator spaced />
            </template>
            <q-item href="https://github.com/malvaceae/chiptube.io" target="_blank" v-ripple>
              <q-item-section side>
                <q-icon name="mdi-github" />
              </q-item-section>
              <q-item-section>
                GitHub
              </q-item-section>
            </q-item>
          </q-list>
        </q-scroll-area>
      </div>
    </q-drawer>
    <q-page-container>
      <router-view v-slot="{ Component }">
        <keep-alive>
          <component :is="Component" />
        </keep-alive>
      </router-view>
    </q-page-container>
  </q-layout>
  <q-dialog v-model="dialog" persistent>
    <q-card class="full-width" square>
      <q-card-section class="text-h6">
        Upload tune
      </q-card-section>
      <q-card-section class="q-pt-none">
        <div class="column q-gutter-md">
          <q-input v-model="tune.title" label-slot outlined square>
            <template #label>
              Title
            </template>
          </q-input>
          <q-input v-model="tune.description" label-slot outlined square type="textarea">
            <template #label>
              Description
            </template>
          </q-input>
          <q-file v-model="tune.midi" accept=".mid" label-slot outlined square>
            <template #prepend>
              <q-icon name="mdi-file-music" />
            </template>
            <template #label>
              MIDI File
            </template>
          </q-file>
        </div>
      </q-card-section>
      <q-separator />
      <q-card-actions align="right">
        <q-btn color="grey-6" flat square v-close-popup>
          <span class="block">Cancel</span>
        </q-btn>
        <q-btn color="primary" :disable="!Object.values(tune).every(Boolean)" flat square @click="uploadTune">
          <span class="block">Upload tune</span>
        </q-btn>
      </q-card-actions>
    </q-card>
  </q-dialog>
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

.q-drawer .q-list .q-item {
  padding: 8px 25px;

  .q-item__section--side {
    padding-right: 25px;
  }
}

a {
  color: inherit;
  text-decoration: none;
}
</style>
