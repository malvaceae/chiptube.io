<script lang="ts" setup>
// Vue.js
import { ref } from 'vue';

// Axios
import axios from 'axios';

// tunes
const tunes = ref<Record<string, string>[]>([]);

// the after token
const after = ref<string>();

// get tunes
const getTunes = async (_: number, done: (stop?: boolean) => void) => {
  const { data } = await axios.get('/tunes', {
    params: {
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
    <q-infinite-scroll :offset="250" @load="getTunes">
      <div class="row q-col-gutter-md">
        <div v-for="tune in tunes" class="col-12 col-sm-6 col-md-4 col-lg-3">
          <router-link :to="{ name: 'watch', params: { id: tune.id } }">
            <q-card bordered flat square>
              <q-img src="@/assets/thumbnail.png">
                <template v-if="$q.dark.isActive">
                  <div class="absolute-full" />
                </template>
                <div class="absolute-center full-width text-h6 text-center ellipsis">
                  {{ tune.title }}
                </div>
              </q-img>
              <q-item>
                <q-item-section avatar>
                  <q-skeleton type="QAvatar" />
                </q-item-section>
                <q-item-section>
                  <q-item-label class="text-subtitle1 text-weight-medium" lines="2">
                    {{ tune.title }}
                  </q-item-label>
                  <q-item-label caption lines="3">
                    {{ tune.description }}
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
