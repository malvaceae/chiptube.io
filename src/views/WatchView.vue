<script lang="ts" setup>
// Vue.js
import { computed, ref, toRefs } from 'vue';

// Auth Store
import { useAuthStore } from '@/stores/auth';

// Midi
import { Midi } from '@/classes/midi';

// Amplify
import { API, Storage } from 'aws-amplify';

// Quasar
import { date, exportFile, useMeta, useQuasar } from 'quasar';

// Google Sign In
import GoogleSignIn from '@/components/GoogleSignIn.vue';

// Related Tunes
import RelatedTunes from '@/components/RelatedTunes.vue';

// Tune Comments
import TuneComments from '@/components/TuneComments.vue';

// Tune Dialog
import TuneDialog from '@/components/TuneDialog.vue';

// Tune Player
import TunePlayer from '@/components/TunePlayer.vue';

// properties
const props = defineProps<{ id: string }>();

// get the tune id
const { id } = toRefs(props);

// get the auth store
const auth = useAuthStore();

// get the $q object
const $q = useQuasar();

// edit the tune
const editTune = () => {
  if (tune.value) {
    const dialog = $q.dialog({
      component: TuneDialog,
      componentProps: {
        tune: tune.value,
      },
    });

    dialog.onOk(({ title, description }) => {
      if (tune.value) {
        Object.assign(tune.value, {
          title,
          description,
        });
      }
    });
  }
};

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

// download the tune
const downloadTune = async () => {
  if (tune.value) {
    const { midiKey, identityId } = tune.value;

    const { Body: body } = await Storage.get(midiKey, {
      level: 'protected',
      download: true,
      identityId,
    });

    if (body) {
      exportFile(`${tune.value.title}.mid`, body, {
        mimeType: 'audio/midi',
      });
    }
  }
};

// the tune
const tune = ref<Record<string, any> | null>(null);

// the midi
const midi = computed(() => {
  if (tune.value) {
    const { midiKey, identityId } = tune.value;

    return async () => {
      const { Body: body } = await Storage.get(midiKey, {
        level: 'protected',
        download: true,
        identityId,
      });

      return new Midi(new Uint8Array(await new Response(body).arrayBuffer()));
    };
  }
});

// use meta
useMeta(() => ({
  title: tune.value?.title,
  meta: {
    description: {
      content: tune.value?.description ?? 'Enjoy the tunes you love, upload original MIDI file, and share it all with friends, family, and the world on ChipTube.',
    },
  },
}));

// get the tune
API.get('Api', `/tunes/${id.value}`, {}).then((data) => {
  tune.value = data;
});
</script>

<template>
  <q-page padding>
    <div class="row q-col-gutter-md">
      <div class="col-12 col-md-8">
        <q-responsive :ratio="16 / 9">
          <template v-if="midi">
            <tune-player :midi="midi" />
          </template>
          <template v-else>
            <q-skeleton animation="none" square />
          </template>
        </q-responsive>
        <q-list dense padding>
          <q-item>
            <q-item-section>
              <q-item-label class="text-h6">
                <template v-if="tune">
                  {{ tune.title }}
                </template>
                <template v-else>
                  <q-skeleton class="text-subtitle1" animation="none" type="text" />
                </template>
              </q-item-label>
            </q-item-section>
          </q-item>
          <q-item>
            <q-item-section>
              <q-item-label>
                <template v-if="tune">
                  {{ tune.views.toLocaleString() }} views • {{ date.formatDate(tune.publishedAt, 'MMM D, YYYY') }}
                </template>
                <template v-else>
                  <q-skeleton animation="none" type="text" width="35%" />
                </template>
              </q-item-label>
            </q-item-section>
            <div v-if="tune" class="absolute-right">
              <template v-if="tune.userId === auth.user?.sub">
                <q-btn flat square @click="editTune">
                  <q-icon name="mdi-pencil-outline" />
                </q-btn>
              </template>
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
                <template v-if="auth.user === null">
                  <q-menu class="no-shadow" anchor="bottom right" :offset="[0, 4]" self="top right" square>
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
                </template>
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
                <template v-if="tune">
                  <img :src="tune.user.picture" referrerpolicy="no-referrer">
                </template>
                <template v-else>
                  <q-skeleton animation="none" type="QAvatar" />
                </template>
              </q-avatar>
            </q-item-section>
            <q-item-section>
              <q-item-label class="text-weight-bold">
                <template v-if="tune">
                  {{ tune.user.nickname }}
                </template>
                <template v-else>
                  <q-skeleton animation="none" type="text" width="65%" />
                </template>
              </q-item-label>
              <q-item-label caption>
                <template v-if="tune">
                  0 subscribers
                </template>
                <template v-else>
                  <q-skeleton animation="none" type="text" width="35%" />
                </template>
              </q-item-label>
            </q-item-section>
            <q-item-section side>
              <template v-if="tune">
                <q-btn color="red" padding="6px 12px" square unelevated>
                  <span class="block">Subscribe</span>
                </q-btn>
              </template>
            </q-item-section>
          </q-item>
          <q-item class="q-mt-sm q-mb-md" :inset-level="1">
            <q-item-section>
              <q-item-label :style="{ whiteSpace: 'pre-wrap' }">
                <template v-if="tune">
                  <template v-for="line in tune.description.split(/(?=\n)/)">
                    <template v-for="text in line.split(/(?=https?:\/\/[!#-;=?-[\]_a-z~]+)|(?![!#-;=?-[\]_a-z~])/)">
                      <template v-if="/^https?:\/\/[!#-;=?-[\]_a-z~]+$/.test(text)">
                        <a :href="text" rel="ugc nofollow" target="_blank">
                          {{ text }}
                        </a>
                      </template>
                      <template v-else>
                        {{ text }}
                      </template>
                    </template>
                  </template>
                </template>
                <template v-else>
                  <q-skeleton animation="none" type="text" />
                  <q-skeleton animation="none" type="text" />
                  <q-skeleton animation="none" type="text" />
                </template>
              </q-item-label>
            </q-item-section>
          </q-item>
          <q-separator spaced />
          <q-item>
            <q-item-section>
              <q-item-label class="text-subtitle1">
                <template v-if="tune">
                  {{ tune.comments.toLocaleString() }} Comments
                </template>
              </q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
        <tune-comments :id="id" @update="tune && tune.comments++" />
      </div>
      <div class="col-12 col-md-4">
        <related-tunes :id="id" />
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
