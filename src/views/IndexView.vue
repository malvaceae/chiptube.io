<script lang="ts" setup>
// Vue.js
import { ref } from 'vue';

// Amplify
import { API } from 'aws-amplify';

// Quasar
import { date, useMeta } from 'quasar';

// use meta
useMeta({
  title: 'ChipTube',
  titleTemplate: (title) => title,
});

// the scroll target
const scrollTarget = ref<HTMLElement>();

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

  // add tunes
  tunes.value.push(...data.tunes);

  // update the after token
  after.value = data.after;

  // complete updates
  done(!after.value);
};
</script>

<template>
  <q-page padding>
    <q-infinite-scroll :offset="250" :scroll-target="scrollTarget" @load="getTunes">
      <div ref="scrollTarget" class="row q-col-gutter-md">
        <div v-for="tune in tunes" class="col-12 col-sm-6 col-md-4 col-lg-3">
          <router-link :to="{ name: 'watch', query: { v: tune.id } }">
            <q-card class="column full-height" flat square>
              <q-img src="@/assets/thumbnail.png">
                <div class="absolute-center full-width text-h6 text-center ellipsis">
                  {{ tune.title }}
                </div>
              </q-img>
              <q-item class="col-grow">
                <q-item-section avatar top>
                  <q-avatar>
                    <img :src="tune.user.picture">
                  </q-avatar>
                </q-item-section>
                <q-item-section>
                  <q-space />
                  <q-item-label class="text-subtitle1 text-weight-medium" lines="2">
                    {{ tune.title }}
                  </q-item-label>
                  <q-space />
                  <q-item-label class="q-mt-sm" caption>
                    {{ tune.user.name }}
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
        <div class="row q-col-gutter-md q-mt-none">
          <div v-for="_ in 24" class="col-12 col-sm-6 col-md-4 col-lg-3">
            <q-card flat square>
              <q-responsive :ratio="16 / 9">
                <q-skeleton animation="none" square />
              </q-responsive>
              <q-item>
                <q-item-section avatar top>
                  <q-avatar>
                    <q-skeleton animation="none" type="QAvatar" />
                  </q-avatar>
                </q-item-section>
                <q-item-section>
                  <q-space />
                  <q-item-label>
                    <q-skeleton class="text-subtitle2" animation="none" type="text" />
                  </q-item-label>
                  <q-space />
                  <q-item-label>
                    <q-skeleton animation="none" type="text" width="35%" />
                  </q-item-label>
                  <q-item-label>
                    <q-skeleton animation="none" type="text" width="65%" />
                  </q-item-label>
                </q-item-section>
              </q-item>
            </q-card>
          </div>
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
