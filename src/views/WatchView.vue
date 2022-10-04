<script lang="ts" setup>
// Vue.js
import { onActivated, onDeactivated, ref } from 'vue';

// Vue Router
import { useRoute } from 'vue-router';

// Axios
import axios from 'axios';

// MIDI Player
import MidiPlayer from '@/components/MidiPlayer.vue';

// get the $route object
const $route = useRoute();

// the tune
const tune = ref<Record<string, string> | null>(null);

// get the tune
onActivated(() => {
  axios.get(`/tunes/${$route.params.id}`).then(({ data }) => {
    tune.value = data;
  });
});

// reset the tune
onDeactivated(() => (tune.value = null));
</script>

<template>
  <q-page padding>
    <div class="row q-col-gutter-md">
      <div class="col-12 col-md-8">
        <q-responsive :ratio="16 / 9">
          <midi-player v-if="tune" :url="tune.url" />
        </q-responsive>
        <div v-if="tune" class="q-mt-md q-gutter-xs">
          <div class="text-h6">
            {{ tune.title }}
          </div>
          <div>
            {{ new Date(tune.publishedAt).toLocaleDateString() }}
          </div>
          <q-separator spaced />
          <div>
            {{ tune.description }}
          </div>
        </div>
      </div>
      <div class="col-12 col-md-4">
        <!-- -->
      </div>
    </div>
  </q-page>
</template>
