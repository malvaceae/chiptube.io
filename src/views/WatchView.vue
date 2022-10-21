<script lang="ts" setup>
// Vue.js
import { onActivated, onDeactivated, ref } from 'vue';

// Vue Router
import { useRoute } from 'vue-router';

// Amplify
import { API, Storage } from 'aws-amplify';

// MIDI Player
import MidiPlayer from '@/components/MidiPlayer.vue';

// get the $route object
const $route = useRoute();

// the tune
const tune = ref<Record<string, string> | null>(null);

// get the tune
onActivated(() => {
  API.get('V1', `/tunes/${$route.params.id}`, {}).then((data) => {
    Storage.get(`tunes/${data.id}.mid`).then((url) => {
      tune.value = Object.assign(data, { url });
    });
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
