<script lang="ts" setup>
// Vue.js
import { ref } from 'vue';

// Amplify - API
import { get } from 'aws-amplify/api';

// Amplify - Storage
import { getUrl } from 'aws-amplify/storage';

// Quasar
import { useMeta } from 'quasar';

// Tune Card
import TuneCard from '@/components/TuneCard.vue';

// use meta
useMeta({
  title: 'Liked tunes',
  meta: {
    description: {
      content: 'Enjoy the tunes you love, upload original MIDI file, and share it all with friends, family, and the world on ChipTube.',
    },
  },
});

// is loading
const isLoading = ref(true);

// tunes
const tunes = ref<Record<string, any>[]>([]);

// the after token
const after = ref<string>();

// get tunes
const getTunes = async (_: number, done: (stop?: boolean) => void) => {
  // start loading
  isLoading.value = true;

  // get tunes
  const data = await get({
    apiName: 'Api',
    path: '/users/me/likes',
    options: {
      queryParams: {
        after: after.value ?? '',
      },
    },
  }).response.then<Record<string, any>>(({ body }) => body.json());

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
</script>

<template>
  <q-page padding>
    <div class="column q-gutter-md">
      <div class="text-h6">
        Liked tunes
      </div>
      <q-infinite-scroll :offset="250" @load="getTunes">
        <div class="row q-col-gutter-md">
          <div v-for="tune in tunes" class="col-12 col-sm-6 col-md-4 col-lg-3">
            <tune-card :tune="tune" />
          </div>
        </div>
        <template v-if="!isLoading && tunes.length === 0">
          <div class="q-my-md text-subtitle1 text-center">
            No liked tunes found
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
