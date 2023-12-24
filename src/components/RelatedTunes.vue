<script lang="ts" setup>
// Vue.js
import { onMounted, ref, toRefs } from 'vue';

// Amplify - API
import { get } from 'aws-amplify/api';

// Amplify - Storage
import { getUrl } from 'aws-amplify/storage';

// Quasar
import { QInfiniteScroll, date } from 'quasar';

// properties
const props = defineProps<{ id: string }>();

// get the tune id
const { id } = toRefs(props);

// root element
const el = ref<QInfiniteScroll>();

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
    path: `/tunes/${id.value}/tunes`,
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

// initialize
onMounted(() => {
  // load tunes
  el.value?.trigger();
});
</script>

<template>
  <q-infinite-scroll ref="el" :offset="250" @load="getTunes">
    <q-list class="q-gutter-md">
      <q-item v-for="tune in tunes" class="q-py-none" active-class="" :to="{ query: { v: tune.id } }">
        <q-item-section side>
          <template v-if="tune.thumbnail">
            <q-img :ratio="16 / 9" :src="tune.thumbnail" width="148px" />
          </template>
          <template v-else>
            <q-img src="@/assets/thumbnail.png" width="148px">
              <div class="absolute-center full-width text-caption text-center ellipsis">
                {{ tune.title }}
              </div>
            </q-img>
          </template>
        </q-item-section>
        <q-item-section>
          <q-item-label class="text-subtitle1" lines="2" :style="{ wordBreak: 'break-all' }">
            {{ tune.title }}
          </q-item-label>
          <q-item-label class="q-pt-sm" caption :style="{ wordBreak: 'break-all' }">
            {{ tune.user.nickname }}
          </q-item-label>
          <q-item-label caption>
            {{ tune.views.toLocaleString() }} views • {{ date.formatDate(tune.publishedAt, 'MMM D, YYYY') }}
          </q-item-label>
        </q-item-section>
      </q-item>
    </q-list>
    <template v-if="!isLoading && tunes.length === 0">
      <div class="q-my-md text-subtitle1 text-center">
        No related tunes found
      </div>
    </template>
    <template #loading>
      <div class="row justify-center q-my-md">
        <q-spinner-dots size="lg" />
      </div>
    </template>
  </q-infinite-scroll>
</template>
