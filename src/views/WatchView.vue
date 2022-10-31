<script lang="ts" setup>
// Vue.js
import { onActivated, onDeactivated, ref, toRef } from 'vue';

// Vue Router
import { onBeforeRouteUpdate } from 'vue-router';

// Auth Store
import { useAuthStore } from '@/stores/auth';

// Amplify
import { API, Storage } from 'aws-amplify';

// Quasar
import { date, exportFile } from 'quasar';

// Google Sign In
import GoogleSignIn from '@/components/GoogleSignIn.vue';

// MIDI Player
import MidiPlayer from '@/components/MidiPlayer.vue';

// properties
const props = defineProps<{ id: string }>();

// get the tune id
const id = toRef(props, 'id');

// get the auth store
const auth = useAuthStore();

// toggle is liked
const toggleIsLiked = async () => {
  if (tune.value && auth.user) {
    tune.value = await API.put('Api', `/tunes/${id.value}`, {
      body: {
        isLiked: !tune.value.isLiked,
      },
    });
  }
};

// download tune
const downloadTune = async () => {
  if (tune.value) {
    const { Body } = await Storage.get(tune.value.midiKey, {
      level: 'protected',
      identityId: tune.value.identityId,
      download: true,
    });

    if (Body instanceof Blob) {
      exportFile(`${tune.value.title}.mid`, Body, {
        mimeType: 'audio/midi',
      });
    }
  }
};

// tunes
const tunes = ref<Record<string, any>[]>([]);

// the after token
const after = ref<string>();

// get tunes
const getTunes = async (_: number, done: (stop?: boolean) => void) => {
  const data = await API.get('Api', '/tunes', {
    queryStringParameters: {
      after: after.value,
    },
  });

  // add tunes
  tunes.value.push(...data.tunes);

  // update the after token
  after.value = data.after;

  // complete updates
  done(!after.value);
};

// the tune
const tune = ref<Record<string, any> | null>(null);

// get the tune
onActivated(() => {
  API.get('Api', `/tunes/${id.value}`, {}).then((data) => {
    tune.value = data;
  });
});

// update the tune
onBeforeRouteUpdate(({ query: { v: id } }) => {
  // reset the tune
  tune.value = null;

  // get the tune
  API.get('Api', `/tunes/${id}`, {}).then((data) => {
    tune.value = data;
  });
});

// reset the tune
onDeactivated(() => (tune.value = null));
</script>

<template>
  <q-page padding>
    <div class="row q-col-gutter-md">
      <div class="col-12 col-md-8">
        <q-responsive :ratio="16 / 9">
          <midi-player v-if="tune" :identity-id="tune.identityId" :midi-key="tune.midiKey" />
        </q-responsive>
        <q-list v-if="tune" dense padding>
          <q-item>
            <q-item-section>
              <q-item-label class="text-h6">
                {{ tune.title }}
              </q-item-label>
            </q-item-section>
          </q-item>
          <q-item>
            <q-item-section>
              <q-item-label>
                {{ tune.views.toLocaleString() }} views • {{ date.formatDate(tune.publishedAt, 'MMM D, YYYY') }}
              </q-item-label>
            </q-item-section>
            <div class="absolute-right">
              <q-btn flat square @click="toggleIsLiked">
                <template v-if="tune.isLiked">
                  <q-icon class="q-mr-sm" name="mdi-thumb-up" />
                </template>
                <template v-else>
                  <q-icon class="q-mr-sm" name="mdi-thumb-up-outline" />
                </template>
                <span class="block">
                  {{ tune.likes.toLocaleString() }}
                </span>
                <q-menu v-if="auth.user === null" anchor="bottom right" :offset="[0, 4]" self="top right" square>
                  <q-list bordered padding>
                    <q-item dense>
                      <q-item-section>
                        <q-item-label class="text-subtitle1 text-weight-medium">
                          Like this tune?
                        </q-item-label>
                      </q-item-section>
                    </q-item>
                    <q-item dense>
                      <q-item-section>
                        <q-item-label>
                          Sign in to make your opinion count.
                        </q-item-label>
                      </q-item-section>
                    </q-item>
                    <q-item>
                      <q-item-section side>
                        <google-sign-in />
                      </q-item-section>
                    </q-item>
                  </q-list>
                </q-menu>
              </q-btn>
              <q-btn flat square @click="downloadTune">
                <q-icon class="q-mr-sm" name="mdi-download-outline" />
                <span class="block">Download</span>
              </q-btn>
            </div>
          </q-item>
          <q-separator spaced />
          <q-item class="q-mt-md q-mb-sm">
            <q-item-section avatar>
              <q-avatar>
                <img :src="tune.user.picture">
              </q-avatar>
            </q-item-section>
            <q-item-section>
              <q-item-label class="text-weight-bold">
                {{ tune.user.name }}
              </q-item-label>
              <q-item-label caption>
                0 subscribers
              </q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-btn color="red" padding="6px 12px" square unelevated>
                <span class="block">Subscribe</span>
              </q-btn>
            </q-item-section>
          </q-item>
          <q-item class="q-mt-sm q-mb-md">
            <q-item-section avatar />
            <q-item-section>
              <q-item-label v-for="line in tune.description.split('\n')">
                <template v-for="text in line.split(/(?=https?:\/\/[!#-;=?-[\]_a-z~]+)|(?![!#-;=?-[\]_a-z~])/)">
                  <a v-if="/^https?:\/\/[!#-;=?-[\]_a-z~]+$/.test(text)" :href="text" target="_blank">
                    {{ text }}
                  </a>
                  <template v-else>
                    {{ text }}
                  </template>
                </template>
              </q-item-label>
            </q-item-section>
          </q-item>
          <q-separator spaced />
          <q-item>
            <q-item-section class="items-center">
              <q-item-label>
                Comments are turned off.
              </q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </div>
      <div class="col-12 col-md-4">
        <q-infinite-scroll :offset="250" @load="getTunes">
          <q-list v-if="tune" class="q-gutter-md">
            <q-item v-for="tune in tunes" class="q-py-none" active-class="" :to="{ query: { v: tune.id } }">
              <q-item-section side>
                <q-img src="@/assets/thumbnail.png" width="148px">
                  <div class="absolute-center full-width text-caption text-center ellipsis">
                    {{ tune.title }}
                  </div>
                </q-img>
              </q-item-section>
              <q-item-section>
                <q-item-label class="text-subtitle1" lines="2">
                  {{ tune.title }}
                </q-item-label>
                <q-item-label class="q-pt-sm" caption>
                  {{ tune.user.name }}
                </q-item-label>
                <q-item-label caption>
                  {{ tune.views.toLocaleString() }} views • {{ date.formatDate(tune.publishedAt, 'MMM D, YYYY') }}
                </q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-infinite-scroll>
      </div>
    </div>
  </q-page>
</template>

<style lang="scss" scoped>
a:not(.q-link) {
  color: $blue;
}

a:not(.q-link):visited {
  color: $purple;
}
</style>
