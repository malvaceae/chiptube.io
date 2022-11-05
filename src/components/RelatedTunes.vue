<script lang="ts" setup>
// Vue.js
import { ref, toRefs } from 'vue';

// Amplify
import { API } from 'aws-amplify';

// Quasar
import { date } from 'quasar';

// properties
const props = defineProps<{ query: string }>();

// get the search query
const { query } = toRefs(props);

// root element
const el = ref<HTMLElement>();

// tunes
const tunes = ref<Record<string, any>[]>([]);

// the after token
const after = ref<string>();

// get tunes
const getTunes = async (_: number, done: (stop?: boolean) => void) => {
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
};
</script>

<template>
  <q-infinite-scroll ref="el" :offset="250" :scroll-target="el" @load="getTunes">
    <q-list class="q-gutter-md">
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
    <template #loading>
      <q-list class="q-gutter-md">
        <q-item v-for="_ in 24" class="q-py-none">
          <q-item-section side>
            <q-skeleton animation="none" height="83.25px" square width="148px" />
          </q-item-section>
          <q-item-section>
            <q-item-label>
              <q-skeleton class="text-subtitle1" animation="none" type="text" />
            </q-item-label>
            <q-item-label>
              <q-skeleton animation="none" type="text" width="35%" />
            </q-item-label>
            <q-item-label>
              <q-skeleton animation="none" type="text" width="65%" />
            </q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
    </template>
  </q-infinite-scroll>
</template>
