<script lang="ts" setup>
// Vue.js
import { toRefs } from 'vue';

// Quasar
import { date } from 'quasar';

// properties
const props = withDefaults(defineProps<{ tune: Record<string, any>, dense?: boolean }>(), {
  dense: false,
});

// get the tune and dense
const { tune, dense } = toRefs(props);
</script>

<template>
  <q-item class="q-py-none" active-class="" :to="{ name: 'watch', query: { v: tune.id } }">
    <q-item-section side :style="{ width: dense || $q.screen.lt.sm ? '148px' : '30%' }">
      <template v-if="tune.thumbnail">
        <q-img :ratio="16 / 9" :src="tune.thumbnail" />
      </template>
      <template v-else>
        <q-img src="@/assets/thumbnail.png">
          <div class="absolute-center full-width text-center ellipsis" :class="dense || $q.screen.lt.sm ? 'text-caption' : 'text-h6'">
            {{ tune.title }}
          </div>
        </q-img>
      </template>
    </q-item-section>
    <template v-if="dense || $q.screen.lt.sm">
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
    </template>
    <template v-else>
      <q-item-section top>
        <q-item-label class="text-h6" lines="2" :style="{ wordBreak: 'break-all' }">
          {{ tune.title }}
        </q-item-label>
        <q-item-label caption>
          {{ tune.views.toLocaleString() }} views • {{ date.formatDate(tune.publishedAt, 'MMM D, YYYY') }}
        </q-item-label>
        <q-item-label class="q-py-sm" caption :style="{ wordBreak: 'break-all' }">
          <q-avatar class="q-mr-xs" size="sm">
            <img :src="tune.user.picture" referrerpolicy="no-referrer">
          </q-avatar>
          {{ tune.user.nickname }}
        </q-item-label>
        <q-item-label caption lines="2" :style="{ wordBreak: 'break-all' }">
          {{ tune.description }}
        </q-item-label>
      </q-item-section>
    </template>
  </q-item>
</template>
