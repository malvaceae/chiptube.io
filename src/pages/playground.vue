<script lang="ts" setup>
// Vue.js
import { nextTick, ref, watchEffect } from 'vue';

// Auth Store
import { useAuthStore } from '@/stores/auth';

// Midi
import { useMidi } from '@/composables/midi';

// Quasar
import { date, format, useMeta } from 'quasar';

// Tune Player
import TunePlayer from '@/components/TunePlayer.vue';

// get the auth store
const auth = useAuthStore();

// the file
const file = ref<File | null>(null);

// use midi
const {
  midi,
  title,
  description,
  copyright,
  lyrics,
  duration,
  timeSignatures,
  tempos,
  formatTime,
  convertSJISToUnicode,
  loadMidi,
} = useMidi();

// watch file
watchEffect(async () => {
  if (file.value) {
    midi.value = null;

    // wait for next tick
    await nextTick();

    // load midi
    await loadMidi(file.value.arrayBuffer());
  }
});

// use meta
useMeta(() => ({
  title: 'Playground',
  meta: {
    description: {
      content: 'Enjoy the tunes you love, upload original MIDI file, and share it all with friends, family, and the world on ChipTube.',
    },
  },
}));
</script>

<template>
  <q-page padding>
    <q-card flat square>
      <q-card-section>
        <div class="q-mb-sm text-subtitle1 text-weight-medium">
          1. Select MIDI file
        </div>
        <q-file v-model="file" accept=".mid" label-slot outlined square>
          <template #prepend>
            <q-icon name="mdi-file-music" />
          </template>
          <template #label>
            MIDI File
          </template>
        </q-file>
      </q-card-section>
      <q-card-section>
        <div class="q-mb-sm text-subtitle1 text-weight-medium">
          2. Watch MIDI
        </div>
        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-8">
            <q-responsive :ratio="16 / 9">
              <template v-if="file">
                <tune-player :midi-buffer="file.arrayBuffer()" />
              </template>
              <template v-else>
                <q-skeleton animation="none" square />
              </template>
            </q-responsive>
            <q-list dense padding>
              <q-item>
                <q-item-section>
                  <q-item-label class="text-h6">
                    <template v-if="midi">
                      {{ title || 'no title' }}
                    </template>
                    <template v-else>
                      <q-skeleton class="text-subtitle1" animation="none" type="text" />
                    </template>
                  </q-item-label>
                </q-item-section>
              </q-item>
              <q-item>
                <q-item-section>
                  <q-item-label>
                    <template v-if="midi">
                      999,999 views • {{ date.formatDate(new Date(), 'MMM D, YYYY') }}
                    </template>
                    <template v-else>
                      <q-skeleton animation="none" type="text" width="35%" />
                    </template>
                  </q-item-label>
                </q-item-section>
              </q-item>
              <q-separator spaced />
              <q-item class="q-mt-md q-mb-sm">
                <q-item-section avatar>
                  <q-avatar>
                    <template v-if="midi">
                      <template v-if="auth.user">
                        <img :src="auth.user.picture" referrerpolicy="no-referrer">
                      </template>
                      <template v-else>
                        <q-icon name="mdi-account-circle" size="40px" />
                      </template>
                    </template>
                    <template v-else>
                      <q-skeleton animation="none" type="QAvatar" />
                    </template>
                  </q-avatar>
                </q-item-section>
                <q-item-section>
                  <q-item-label class="text-weight-bold">
                    <template v-if="midi">
                      <template v-if="auth.user">
                        {{ auth.user.nickname }}
                      </template>
                      <template v-else>
                        Guest
                      </template>
                    </template>
                    <template v-else>
                      <q-skeleton animation="none" type="text" width="65%" />
                    </template>
                  </q-item-label>
                  <q-item-label caption>
                    <template v-if="midi">
                      0 subscribers
                    </template>
                    <template v-else>
                      <q-skeleton animation="none" type="text" width="35%" />
                    </template>
                  </q-item-label>
                </q-item-section>
                <q-item-section side>
                </q-item-section>
              </q-item>
              <q-item class="q-mt-sm q-mb-md" :inset-level="1">
                <q-item-section>
                  <q-item-label :style="{ whiteSpace: 'pre-wrap' }">
                    <template v-if="midi">
                      {{ description || 'no description' }}
                    </template>
                    <template v-else>
                      <q-skeleton animation="none" type="text" />
                      <q-skeleton animation="none" type="text" />
                      <q-skeleton animation="none" type="text" />
                    </template>
                  </q-item-label>
                </q-item-section>
              </q-item>
              <q-separator spaced />
            </q-list>
          </div>
          <div class="col-12 col-md-4">
            <q-markup-table flat square wrap-cells>
              <tbody>
                <tr>
                  <template v-if="file">
                    <td class="text-no-wrap text-weight-bold">
                      File name
                    </td>
                    <td class="full-width">
                      {{ file.name }}
                    </td>
                  </template>
                  <template v-else>
                    <td :style="{ width: '100px' }">
                      <q-skeleton animation="none" type="text" />
                    </td>
                    <td>
                      <q-skeleton animation="none" type="text" />
                    </td>
                  </template>
                </tr>
                <tr>
                  <template v-if="file">
                    <td class="text-no-wrap text-weight-bold">
                      File size
                    </td>
                    <td class="full-width">
                      {{ format.humanStorageSize(file.size) }}
                    </td>
                  </template>
                  <template v-else>
                    <td :style="{ width: '100px' }">
                      <q-skeleton animation="none" type="text" />
                    </td>
                    <td>
                      <q-skeleton animation="none" type="text" />
                    </td>
                  </template>
                </tr>
                <tr>
                  <template v-if="midi">
                    <td class="text-no-wrap text-weight-bold">
                      MIDI format
                    </td>
                    <td class="full-width">
                      {{ midi.header.format }}
                    </td>
                  </template>
                  <template v-else>
                    <td :style="{ width: '100px' }">
                      <q-skeleton animation="none" type="text" />
                    </td>
                    <td>
                      <q-skeleton animation="none" type="text" />
                    </td>
                  </template>
                </tr>
                <tr>
                  <template v-if="midi">
                    <td class="text-no-wrap text-weight-bold">
                      MIDI tracks
                    </td>
                    <td class="full-width">
                      {{ midi.header.numTracks }}
                    </td>
                  </template>
                  <template v-else>
                    <td :style="{ width: '100px' }">
                      <q-skeleton animation="none" type="text" />
                    </td>
                    <td>
                      <q-skeleton animation="none" type="text" />
                    </td>
                  </template>
                </tr>
                <tr>
                  <template v-if="midi">
                    <td class="text-no-wrap text-weight-bold">
                      Resolution
                    </td>
                    <td class="full-width">
                      {{ midi.ppq }} pulses per quarter note
                    </td>
                  </template>
                  <template v-else>
                    <td :style="{ width: '100px' }">
                      <q-skeleton animation="none" type="text" />
                    </td>
                    <td>
                      <q-skeleton animation="none" type="text" />
                    </td>
                  </template>
                </tr>
                <tr>
                  <template v-if="midi">
                    <td class="text-no-wrap text-weight-bold">
                      Duration
                    </td>
                    <td class="full-width">
                      {{ formatTime(duration) }}
                    </td>
                  </template>
                  <template v-else>
                    <td :style="{ width: '100px' }">
                      <q-skeleton animation="none" type="text" />
                    </td>
                    <td>
                      <q-skeleton animation="none" type="text" />
                    </td>
                  </template>
                </tr>
                <tr>
                  <template v-if="midi">
                    <td class="text-no-wrap text-weight-bold">
                      Initial tempo
                    </td>
                    <td class="full-width">
                      {{ tempos[0] ? `${Math.floor(60000000 / tempos[0].value)} beats per minute` : 'not available' }}
                    </td>
                  </template>
                  <template v-else>
                    <td :style="{ width: '100px' }">
                      <q-skeleton animation="none" type="text" />
                    </td>
                    <td>
                      <q-skeleton animation="none" type="text" />
                    </td>
                  </template>
                </tr>
                <tr>
                  <template v-if="midi">
                    <td class="text-no-wrap text-weight-bold">
                      Initial time signature
                    </td>
                    <td class="full-width">
                      {{ timeSignatures[0] ? timeSignatures[0].value.join('/') : 'not available' }}
                    </td>
                  </template>
                  <template v-else>
                    <td :style="{ width: '100px' }">
                      <q-skeleton animation="none" type="text" />
                    </td>
                    <td>
                      <q-skeleton animation="none" type="text" />
                    </td>
                  </template>
                </tr>
                <tr>
                  <template v-if="midi">
                    <td class="text-no-wrap text-weight-bold">
                      Lyrics
                    </td>
                    <td class="full-width">
                      {{ lyrics.length ? 'words available' : 'not available' }}
                    </td>
                  </template>
                  <template v-else>
                    <td :style="{ width: '100px' }">
                      <q-skeleton animation="none" type="text" />
                    </td>
                    <td>
                      <q-skeleton animation="none" type="text" />
                    </td>
                  </template>
                </tr>
                <tr>
                  <template v-if="midi">
                    <td class="text-no-wrap text-weight-bold">
                      Copyright
                    </td>
                    <td class="full-width">
                      {{ copyright || 'no copyright' }}
                    </td>
                  </template>
                  <template v-else>
                    <td :style="{ width: '100px' }">
                      <q-skeleton animation="none" type="text" />
                    </td>
                    <td>
                      <q-skeleton animation="none" type="text" />
                    </td>
                  </template>
                </tr>
              </tbody>
            </q-markup-table>
            <q-markup-table flat square wrap-cells>
              <thead>
                <template v-if="midi">
                  <tr>
                    <th class="text-left">
                      Track
                    </th>
                    <th class="text-left">
                      Name
                    </th>
                    <th class="text-left">
                      Notes
                    </th>
                  </tr>
                </template>
                <template v-else>
                  <tr>
                    <th>
                      <q-skeleton animation="none" type="text" />
                    </th>
                    <th>
                      <q-skeleton animation="none" type="text" />
                    </th>
                    <th>
                      <q-skeleton animation="none" type="text" />
                    </th>
                  </tr>
                </template>
              </thead>
              <tbody>
                <template v-if="midi">
                  <tr v-for="(track, i) in midi.tracks">
                    <td>
                      {{ i + 1 }}
                    </td>
                    <td>
                      {{ convertSJISToUnicode(track.getEvents('trackName')[0]?.text ?? '') }}
                    </td>
                    <td>
                      {{ track.getEvents('noteOn').length }}
                    </td>
                  </tr>
                </template>
                <template v-else>
                  <tr v-for="_ in 3">
                    <td>
                      <q-skeleton animation="none" type="text" />
                    </td>
                    <td>
                      <q-skeleton animation="none" type="text" />
                    </td>
                    <td>
                      <q-skeleton animation="none" type="text" />
                    </td>
                  </tr>
                </template>
              </tbody>
            </q-markup-table>
          </div>
        </div>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<style lang="scss" scoped>
:deep(.q-stepper__step-inner) {
  padding-bottom: 8px;
}
</style>
