<script lang="ts" setup>
// Vue.js
import { onActivated, onDeactivated, ref } from 'vue';

// Vue Router
import { useRoute } from 'vue-router';

// Amplify
import { API } from 'aws-amplify';

// Quasar
import { date } from 'quasar';

// MIDI Player
import MidiPlayer from '@/components/MidiPlayer.vue';

// get the $route object
const $route = useRoute();

// the tune
const tune = ref<Record<string, any> | null>(null);

// get the tune
onActivated(() => {
  API.get('V1', `/tunes/${$route.params.id}`, {}).then((data) => {
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
          <midi-player v-if="tune" :identity-id="tune.identityId" :midi-key="tune.midiKey" />
        </q-responsive>
        <q-list v-if="tune" dense padding>
          <q-item>
            <q-item-section>
              <q-item-label class="text-h6">
                {{ tune.title }}
              </q-item-label>
            </q-item-section>
          </q-item>
          <q-item>
            <q-item-section>
              <q-item-label>
                {{ tune.views.toLocaleString() }} views
              </q-item-label>
            </q-item-section>
          </q-item>
          <q-separator spaced />
          <q-item>
            <q-item-section avatar>
              <q-avatar>
                <img :src="tune.user.picture">
              </q-avatar>
            </q-item-section>
            <q-item-section>
              <q-item-label class="text-weight-bold">
                {{ tune.user.name }}
              </q-item-label>
              <q-item-label caption>
                Published on {{ date.formatDate(new Date(tune.publishedAt), 'MMM D, YYYY') }}
              </q-item-label>
            </q-item-section>
          </q-item>
          <q-item>
            <q-item-section avatar />
            <q-item-section>
              <q-item-label>
                {{ tune.description }}
              </q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </div>
      <div class="col-12 col-md-4">
        <!-- -->
      </div>
    </div>
  </q-page>
</template>
