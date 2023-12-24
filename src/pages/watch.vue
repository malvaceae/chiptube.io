<script lang="ts" setup>
// Vue.js
import { computed, ref, toRefs } from 'vue';

// Vue Router
import { useRouter } from 'vue-router';

// Auth Store
import { useAuthStore } from '@/stores/auth';

// Amplify - API
import { get, put } from 'aws-amplify/api';

// Amplify - Storage
import { downloadData, getUrl } from 'aws-amplify/storage';

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

// get the $router object
const $router = useRouter();

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

    dialog.onOk(async ({ title, description, thumbnailKey, identityId }) => {
      if (tune.value) {
        // get the thumbnail
        const thumbnail = await getThumbnail({
          thumbnailKey,
          identityId,
        });

        Object.assign(tune.value, {
          title,
          description,
          thumbnailKey,
          thumbnail,
        });
      }
    });
  }
};

// toggle is liked
const toggleIsLiked = async () => {
  if (tune.value && auth.user) {
    Object.assign(tune.value, await put({
      apiName: 'Api',
      path: `/tunes/${id.value}`,
      options: {
        body: {
          isLiked: !tune.value.isLiked,
        },
      },
    }).response.then<Record<string, any>>(({ body }) => body.json()));
  }
};

// download the tune
const downloadTune = async ({ title, midiKey: key, identityId: targetIdentityId }: Record<string, any>) => {
  const { body } = await downloadData({
    key,
    options: {
      accessLevel: 'protected',
      targetIdentityId,
    },
  }).result;

  if (body) {
    exportFile(`${title}.mid`, await body.blob(), {
      mimeType: 'audio/midi',
    });
  }
};

// the tune
const tune = ref<Record<string, any> | null>(null);

// the midi buffer
const midiBuffer = computed(() => tune.value && getMidiBuffer(tune.value));

// get midi buffer
const getMidiBuffer = ({ midiKey: key, identityId: targetIdentityId }: Record<string, any>) => {
  return async () => {
    const { body } = await downloadData({
      key,
      options: {
        accessLevel: 'protected',
        targetIdentityId,
      },
    }).result;

    return await body.blob().then((blob) => blob.arrayBuffer());
  };
};

// use meta
useMeta(() => ({
  title: tune.value?.title,
  meta: {
    description: {
      content: tune.value?.description ?? 'Enjoy the tunes you love, upload original MIDI file, and share it all with friends, family, and the world on ChipTube.',
    },
  },
}));

// get the thumbnail
const getThumbnail = async ({ thumbnailKey: key, identityId: targetIdentityId }: Record<string, any>) => {
  if (key) {
    const { url } = await getUrl({
      key,
      options: {
        accessLevel: 'protected',
        targetIdentityId,
      },
    });

    return url.toString();
  }
};

(async () => {
  try {
    // get the tune
    const data = await get({
      apiName: 'Api',
      path: `/tunes/${id.value}`,
    }).response.then<Record<string, any>>(({ body }) => body.json());

    // get the thumbnail
    data.thumbnail = await getThumbnail(data);

    // set the tune
    tune.value = data;
  } catch (e: any) {
    if (e.message === 'Not Found') {
      $q.notify({
        type: 'negative',
        message: 'The tune you are looking for is not found.',
        html: true,
      });

      // move to index route
      await $router.replace({ name: 'index' });
    }
  }
})();
</script>

<template>
  <q-page padding>
    <div class="row q-col-gutter-md">
      <div class="col-12 col-md-8">
        <q-responsive :ratio="16 / 9">
          <template v-if="midiBuffer">
            <tune-player :midi-buffer="midiBuffer" :thumbnail="tune?.thumbnail" />
          </template>
          <template v-else>
            <q-skeleton animation="none" square />
          </template>
        </q-responsive>
        <q-list dense padding>
          <q-item>
            <q-item-section>
              <q-item-label class="text-h6" :style="{ wordBreak: 'break-all' }">
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
              <q-btn flat square @click="downloadTune(tune)">
                <q-icon class="q-mr-sm" name="mdi-download-outline" />
                <span class="block">Download</span>
              </q-btn>
            </div>
          </q-item>
          <q-separator spaced />
          <q-item class="q-mt-md q-mb-sm">
            <template v-if="tune">
              <router-link :to="{ name: 'users-id', params: { id: tune.user.id } }">
                <q-item-section avatar>
                  <q-avatar>
                    <img :src="tune.user.picture" referrerpolicy="no-referrer">
                  </q-avatar>
                </q-item-section>
              </router-link>
            </template>
            <template v-else>
              <q-item-section avatar>
                <q-avatar>
                  <q-skeleton animation="none" type="QAvatar" />
                </q-avatar>
              </q-item-section>
            </template>
            <q-item-section>
              <q-item-label class="text-weight-bold" :style="{ wordBreak: 'break-all' }">
                <template v-if="tune">
                  <router-link :to="{ name: 'users-id', params: { id: tune.user.id } }">
                    {{ tune.user.nickname }}
                  </router-link>
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
              <q-item-label :style="{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }">
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
a {
  color: inherit;
  text-decoration: none;
}

a[target="_blank"] {
  color: $blue;
  text-decoration: underline;
}

a[target="_blank"]:visited {
  color: $purple;
}
</style>
