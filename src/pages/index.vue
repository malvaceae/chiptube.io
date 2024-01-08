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
  title: 'ChipTube',
  titleTemplate: (title) => title,
  meta: {
    description: {
      content: 'Enjoy the tunes you love, upload original MIDI file, and share it all with friends, family, and the world on ChipTube.',
    },
  },
});

// tunes
const tunes = ref<Record<string, any>[]>([]);

// the after token
const after = ref<string>();

// get tunes
const getTunes = async (_: number, done: (stop?: boolean) => void) => {
  const data = await get({
    apiName: 'Api',
    path: '/tunes',
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
    <q-infinite-scroll :offset="250" @load="getTunes">
      <div class="row q-col-gutter-md">
        <div v-for="tune in tunes" class="col-12 col-sm-6 col-md-4 col-lg-3">
          <tune-card :tune="tune" />
        </div>
      </div>
      <template #loading>
        <div class="row justify-center q-my-md">
          <q-spinner-dots size="lg" />
        </div>
      </template>
    </q-infinite-scroll>
  </q-page>
</template>
