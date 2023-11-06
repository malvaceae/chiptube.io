<script lang="ts" setup>
// Vue.js
import { ref } from 'vue';

// Amplify
import { API, Storage } from 'aws-amplify';

// Quasar
import { date, useMeta } from 'quasar';

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
  const data = await API.get('Api', '/tunes', {
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
};

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
      <template #loading>
        <div class="row justify-center q-my-md">
          <q-spinner-dots size="lg" />
        </div>
      </template>
    </q-infinite-scroll>
  </q-page>
</template>

<style lang="scss" scoped>
a {
  color: inherit;
  text-decoration: none;
}
</style>
