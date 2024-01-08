<script lang="ts" setup>
// Vue.js
import { toRefs } from 'vue';

// Quasar
import { date } from 'quasar';

// properties
const props = defineProps<{ tune: Record<string, any> }>();

// get the tune
const { tune } = toRefs(props);
</script>

<template>
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
</template>

<style lang="scss" scoped>
a {
  color: inherit;
  text-decoration: none;
}
</style>
