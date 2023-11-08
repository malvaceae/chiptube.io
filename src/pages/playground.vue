<script lang="ts" setup>
// Vue.js
import { computed, ref, watchEffect } from 'vue';

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

// the midi file
const midiFile = ref<File | null>(null);

// the midi buffer
const midiBuffer = computed(() => midiFile.value?.arrayBuffer?.());

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

// watch midi buffer
watchEffect(async () => {
  if (midiBuffer.value) {
    // load midi
    await loadMidi(midiBuffer.value);
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
        <q-file v-model="midiFile" accept=".mid" label-slot outlined square>
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
              <template v-if="midiBuffer">
                <tune-player :midi-buffer="midiBuffer" />
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
                <template v-if="midi">
                  <template v-if="auth.user">
                    <router-link :to="{ name: 'users-id', params: { id: auth.user.sub } }">
                      <q-item-section avatar>
                        <q-avatar>
                          <img :src="auth.user.picture" referrerpolicy="no-referrer">
                        </q-avatar>
                      </q-item-section>
                    </router-link>
                  </template>
                  <template v-else>
                    <q-item-section avatar>
                      <q-avatar>
                        <q-icon name="mdi-account-circle" size="40px" />
                      </q-avatar>
                    </q-item-section>
                  </template>
                </template>
                <template v-else>
                  <q-item-section avatar>
                    <q-avatar>
                      <q-skeleton animation="none" type="QAvatar" />
                    </q-avatar>
                  </q-item-section>
                </template>
                <q-item-section>
                  <q-item-label class="text-weight-bold">
                    <template v-if="midi">
                      <template v-if="auth.user">
                        <router-link :to="{ name: 'users-id', params: { id: auth.user.sub } }">
                          {{ auth.user.nickname }}
                        </router-link>
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
                      <template v-for="line in (description || 'no description').split(/(?=\n)/)">
                        <template v-for="text in line.split(/(?=https?:\/\/[!#-;=?-[\]_a-z~]+)|(?![!#-;=?-[\]_a-z~])/)">
                          <template v-if="/^https?:\/\/[!#-;=?-[\]_a-z~]+$/.test(text)">
                            <a :href="text" rel="ugc nofollow" target="_blank">
                              {{ text }}
                            </a>
                          </template>
                          <template v-else>
                            {{ text }}
                          </template>
                        </template>
                      </template>
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
                  <template v-if="midiFile">
                    <td class="text-no-wrap text-weight-bold">
                      File name
                    </td>
                    <td class="full-width">
                      {{ midiFile.name }}
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
                  <template v-if="midiFile">
                    <td class="text-no-wrap text-weight-bold">
                      File size
                    </td>
                    <td class="full-width">
                      {{ format.humanStorageSize(midiFile.size) }}
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
a {
  color: inherit;
  text-decoration: none;
}

a[target="_blank"] {
  color: $blue;
  text-decoration: underline;
}

a[target="_blank"]:visited {
  color: $purple;
}
</style>
