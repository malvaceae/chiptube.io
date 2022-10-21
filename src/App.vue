<script lang="ts" setup>
// Vue.js
import { reactive, ref } from 'vue';

// Vue Router
import { useRouter } from 'vue-router';

// Amplify
import { API, Hub, Storage } from 'aws-amplify';

// Amplify - Auth
import { Auth, CognitoHostedUIIdentityProvider, CognitoUser } from '@aws-amplify/auth';

// Quasar
import { uid, useQuasar } from 'quasar';

// get the $router object
const $router = useRouter();

// get the $q object
const $q = useQuasar();

// set dark mode status to 'auto'
$q.dark.set('auto');

// variables
const dialog = ref(false);
const drawer = ref(false);
const search = ref('');

// user
const user = ref<CognitoUser & { attributes: Record<string, any> } | null>(null);

// subscribe auth events
Hub.listen('auth', ({ payload: { event } }) => {
  if (event === 'signIn') {
    $router.replace({});
  }
});

// get the current user
Auth.currentAuthenticatedUser().then((currentUser) => {
  user.value = currentUser;
});

// sign in
const signIn = async () => {
  await Auth.federatedSignIn({ provider: CognitoHostedUIIdentityProvider.Google });
};

// sign out
const signOut = async () => {
  await Auth.signOut();
};

// the tune
const tune = reactive({
  title: '',
  description: '',
  midi: ref<File | null>(null),
});

// upload the tune
const uploadTune = async () => {
  if (!tune.midi) {
    return;
  }

  // show loading
  $q.loading.show({ spinnerSize: 46 });

  // upload the tune
  const { key: midiKey } = await Storage.put(`tunes/${uid()}.mid`, tune.midi, {
    level: 'protected',
  });

  // register the tune info
  const data = await API.post('V1', '/tunes', {
    body: {
      title: tune.title,
      description: tune.description,
      midiKey,
    },
  });

  // move to watch route
  await $router.push({ name: 'watch', params: { id: data.id } });

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
        <div class="row q-gutter-sm no-wrap items-center">
          <template v-if="user">
            <q-btn flat round @click="dialog = !dialog">
              <q-icon name="mdi-video-plus-outline" />
            </q-btn>
          </template>
          <q-btn flat round>
            <template v-if="user">
              <q-avatar>
                <img :src="user.attributes.picture">
              </q-avatar>
            </template>
            <template v-else>
              <q-icon name="mdi-dots-vertical" />
            </template>
            <q-menu class="full-width" anchor="bottom right" max-width="300px" self="top right" square>
              <q-list bordered dense padding>
                <template v-if="user">
                  <q-item>
                    <q-item-section avatar>
                      <q-avatar>
                        <img :src="user.attributes.picture">
                      </q-avatar>
                    </q-item-section>
                    <q-item-section>
                      <q-item-label>
                        {{ user.attributes.name }}
                      </q-item-label>
                      <q-item-label>
                        {{ user.attributes.email }}
                      </q-item-label>
                    </q-item-section>
                  </q-item>
                  <q-separator spaced />
                  <q-item clickable v-close-popup @click="signOut">
                    <q-item-section side>
                      <q-icon name="mdi-logout" />
                    </q-item-section>
                    <q-item-section>
                      Sign out
                    </q-item-section>
                  </q-item>
                  <q-separator spaced />
                </template>
                <q-item clickable v-close-popup @click="$q.dark.toggle()">
                  <q-item-section side>
                    <q-icon name="mdi-theme-light-dark" />
                  </q-item-section>
                  <q-item-section>
                    Appearance: {{ $q.dark.isActive ? 'Dark' : 'Light' }}
                  </q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </q-btn>
          <template v-if="user === null">
            <q-btn no-wrap outline padding="6px 12px" square @click="signIn">
              <q-icon class="q-mr-sm" name="mdi-google" />
              <span class="block">Sign in</span>
            </q-btn>
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
            <template v-if="user === null">
              <q-separator spaced />
              <q-item>
                <q-item-section class="q-gutter-sm">
                  <div class="q-px-sm">
                    Sign in to like tunes, comment, and subscribe.
                  </div>
                  <div class="q-px-sm">
                    <q-btn no-wrap outline padding="6px 18px" square @click="signIn">
                      <q-icon class="q-mr-sm" name="mdi-google" />
                      <span class="block">Sign in</span>
                    </q-btn>
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

.mdi-google {
  color: transparent;
  background-image: conic-gradient(from 55deg at 40%, #4285f4 70deg, #0f9d58 70deg 175deg, #f4b400 175deg 255deg, #db4437 255deg 360deg);
  background-clip: text;
}

a {
  color: inherit;
  text-decoration: none;
}
</style>
