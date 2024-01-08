<script lang="ts" setup>
// Vue.js
import { ref, toRefs } from 'vue';

// Amplify - API
import { get } from 'aws-amplify/api';

// Amplify - Storage
import { getUrl } from 'aws-amplify/storage';

// Quasar
import { useMeta, useQuasar } from 'quasar';

// Tune List Item
import TuneListItem from '@/components/TuneListItem.vue';

// properties
const props = defineProps<{ query: string }>();

// get the search query
const { query } = toRefs(props);

// use meta
useMeta(() => ({
  title: query.value,
  meta: {
    description: {
      content: 'Enjoy the tunes you love, upload original MIDI file, and share it all with friends, family, and the world on ChipTube.',
    },
  },
}));

// get the $q object
const $q = useQuasar();

// tunes
const tunes = ref<Record<string, any>[]>([]);

// the after token
const after = ref<string>();

// get tunes
const getTunes = async (_: number, done: (stop?: boolean) => void) => {
  // show loading
  $q.loading.show({ customClass: 'invisible' });

  // get tunes
  const data = await get({
    apiName: 'Api',
    path: '/tunes',
    options: {
      queryParams: {
        query: query.value,
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

  // hide loading
  $q.loading.hide();
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
      <q-list class="q-gutter-md">
        <tune-list-item v-for="tune in tunes" :tune="tune" />
      </q-list>
      <template #loading>
        <div class="row justify-center q-my-md">
          <q-spinner-dots size="lg" />
        </div>
      </template>
    </q-infinite-scroll>
    <template v-if="!$q.loading.isActive && tunes.length === 0">
      <div class="absolute-center text-h6">
        No results found
      </div>
    </template>
  </q-page>
</template>
