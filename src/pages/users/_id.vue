<script lang="ts" setup>
// Vue.js
import { ref, toRefs } from 'vue';

// Vue Router
import { useRouter } from 'vue-router';

// Auth Store
import { useAuthStore } from '@/stores/auth';

// Amplify
import { API, Storage } from 'aws-amplify';

// Quasar
import { date, useMeta, useQuasar } from 'quasar';

// properties
const props = defineProps<{ id: string }>();

// get the user id
const { id } = toRefs(props);

// get the auth store
const auth = useAuthStore();

// get the $router object
const $router = useRouter();

// get the $q object
const $q = useQuasar();

// is loading
const isLoading = ref(true);

// the user
const user = ref<Record<string, any> | null>(null);

// tunes
const tunes = ref<Record<string, any>[]>([]);

// the after token
const after = ref<string>();

// get tunes
const getTunes = async (_: number, done: (stop?: boolean) => void) => {
  // start loading
  isLoading.value = true;

  // get tunes
  const data = await API.get('Api', `/users/${id.value}/tunes`, {
    queryStringParameters: {
      after: after.value,
    },
  });

  // get the thumbnail
  for (const tune of data.tunes) {
    tune.thumbnail = await getThumbnail(tune);
  }

  // add tunes
  tunes.value.push(...data.tunes);

  // update the after token
  after.value = data.after;

  // complete updates
  done(!after.value);

  // stop loading
  isLoading.value = false;
};

// use meta
useMeta(() => ({
  title: user.value?.nickname,
  meta: {
    description: {
      content: 'Enjoy the tunes you love, upload original MIDI file, and share it all with friends, family, and the world on ChipTube.',
    },
  },
}));

(async () => {
  try {
    // get the user
    user.value = await API.get('Api', `/users/${id.value}`, {});
  } catch (e: any) {
    if (e.response.status === 404) {
      $q.notify({
        type: 'negative',
        message: 'The user you are looking for is not found.',
        html: true,
      });

      // move to index route
      await $router.replace({ name: 'index' });
    }
  }
})();

// get the thumbnail
const getThumbnail = async ({ thumbnailKey, identityId }: Record<string, any>) => {
  if (thumbnailKey) {
    return await Storage.get(thumbnailKey, {
      level: 'protected',
      identityId,
    });
  }
};
</script>

<template>
  <q-page padding>
    <div class="column q-gutter-md">
      <q-card flat square>
        <q-item class="q-py-md">
          <q-item-section avatar>
            <q-avatar class="fit">
              <template v-if="user">
                <img :src="user.picture" referrerpolicy="no-referrer">
              </template>
              <template v-else>
                <q-skeleton animation="none" height="96px" type="QAvatar" width="96px" />
              </template>
            </q-avatar>
          </q-item-section>
          <q-item-section>
            <q-item-label class="text-h4" :style="{ wordBreak: 'break-all' }">
              <template v-if="user">
                {{ user.nickname }}
                <template v-if="auth.user && user.id === auth.user.sub">
                  <q-btn dense flat round :to="{ name: 'settings' }">
                    <q-icon name="mdi-pencil-outline" />
                  </q-btn>
                </template>
              </template>
              <template v-else>
                <q-skeleton animation="none" height="1.2em" type="text" width="35%" />
              </template>
            </q-item-label>
            <q-item-label class="text-grey-6" caption>
              <template v-if="user">
                ID: {{ user.id }}
              </template>
              <template v-else>
                <q-skeleton animation="none" height="1.2em" type="text" width="65%" />
              </template>
            </q-item-label>
          </q-item-section>
        </q-item>
      </q-card>
      <q-infinite-scroll :offset="250" @load="getTunes">
        <div class="row q-col-gutter-md">
          <div v-for="tune in tunes" class="col-12 col-sm-6 col-md-4 col-lg-3">
            <router-link :to="{ name: 'watch', query: { v: tune.id } }">
              <q-card class="column full-height" flat square>
                <template v-if="tune.thumbnail">
                  <q-img :ratio="16 / 9" :src="tune.thumbnail" />
                </template>
                <template v-else>
                  <q-img src="@/assets/thumbnail.png">
                    <div class="absolute-center full-width text-h6 text-center ellipsis">
                      {{ tune.title }}
                    </div>
                  </q-img>
                </template>
                <q-item class="col-grow">
                  <q-item-section avatar top>
                    <q-avatar>
                      <img :src="tune.user.picture" referrerpolicy="no-referrer">
                    </q-avatar>
                  </q-item-section>
                  <q-item-section>
                    <q-space />
                    <q-item-label class="text-subtitle1 text-weight-medium" lines="2" :style="{ wordBreak: 'break-all' }">
                      {{ tune.title }}
                    </q-item-label>
                    <q-space />
                    <q-item-label class="q-mt-sm" caption :style="{ wordBreak: 'break-all' }">
                      {{ tune.user.nickname }}
                    </q-item-label>
                    <q-item-label caption>
                      {{ tune.views.toLocaleString() }} views • {{ date.formatDate(tune.publishedAt, 'MMM D, YYYY') }}
                    </q-item-label>
                  </q-item-section>
                </q-item>
              </q-card>
            </router-link>
          </div>
        </div>
        <template v-if="!isLoading && tunes.length === 0">
          <div class="q-my-md text-subtitle1 text-center">
            No tunes found
          </div>
        </template>
        <template #loading>
          <div class="row justify-center q-my-md">
            <q-spinner-dots size="lg" />
          </div>
        </template>
      </q-infinite-scroll>
    </div>
  </q-page>
</template>

<style lang="scss" scoped>
a {
  color: inherit;
  text-decoration: none;
}
</style>
