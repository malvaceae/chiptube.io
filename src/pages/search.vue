<script lang="ts" setup>
// Vue.js
import { ref, toRefs } from 'vue';

// Amplify
import { API } from 'aws-amplify';

// Quasar
import { date, useMeta, useQuasar } from 'quasar';

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
  const data = await API.get('Api', '/tunes', {
    queryStringParameters: {
      query: query.value,
      after: after.value,
    },
  });

  // add tunes
  tunes.value.push(...data.tunes);

  // update the after token
  after.value = data.after;

  // complete updates
  done(!after.value);

  // hide loading
  $q.loading.hide();
};
</script>

<template>
  <q-page padding>
    <q-infinite-scroll :offset="250" @load="getTunes">
      <q-list class="q-gutter-md">
        <q-item v-for="tune in tunes" :to="{ name: 'watch', query: { v: tune.id } }">
          <q-item-section side>
            <q-img src="@/assets/thumbnail.png">
              <div class="absolute-center full-width text-h6 text-center ellipsis">
                {{ tune.title }}
              </div>
            </q-img>
          </q-item-section>
          <q-item-section top>
            <q-item-label class="text-h6" lines="2">
              {{ tune.title }}
            </q-item-label>
            <q-item-label caption>
              {{ tune.views.toLocaleString() }} views • {{ date.formatDate(tune.publishedAt, 'MMM D, YYYY') }}
            </q-item-label>
            <q-item-label class="q-py-sm" caption>
              <q-avatar class="q-mr-xs" size="sm">
                <img :src="tune.user.picture" referrerpolicy="no-referrer">
              </q-avatar>
              {{ tune.user.nickname }}
            </q-item-label>
            <q-item-label caption lines="2">
              {{ tune.description }}
            </q-item-label>
          </q-item-section>
        </q-item>
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

<style lang="scss" scoped>
.q-item__section--side {
  width: 30%;
}
</style>
