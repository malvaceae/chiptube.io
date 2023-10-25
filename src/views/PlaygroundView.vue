<script lang="ts" setup>
// Vue.js
import { computed, ref, watchEffect } from 'vue';

// Auth Store
import { useAuthStore } from '@/stores/auth';

// Midi
import { Midi } from '@/classes/midi';

// Quasar
import { date, format, useMeta } from 'quasar';

// encoding.js
import { codeToString, convert } from 'encoding-japanese';

// Tune Player
import TunePlayer from '@/components/TunePlayer.vue';

// get the auth store
const auth = useAuthStore();

// the file
const file = ref<File | null>(null);

// the midi
const midi = ref<Midi | null>(null);

// watch file
watchEffect(async () => {
  if (file.value) {
    const body = new Blob([file.value], {
      type: file.value.type,
    });

    midi.value = null;
    midi.value = new Midi(new Uint8Array(await new Response(body).arrayBuffer()));
  } else {
    midi.value = null;
  }
});

// the midi title
const midiTitle = computed(() => convertToUnicode(midi.value?.tracks?.[0]?.getEvents?.('trackName')?.[0]?.text ?? ''));

// the midi description
const midiDescription = computed(() => convertToUnicode(midi.value?.tracks?.[0]?.getEvents?.('text')?.map?.(({ text }) => text)?.join?.('\n') ?? ''));

// the midi copyright
const midiCopyright = computed(() => convertToUnicode(midi.value?.tracks?.[0]?.getEvents?.('copyrightNotice')?.[0]?.text ?? ''));

// exists midi lyrics
const existsMidiLyrics = computed(() => Boolean(midi.value?.getEvents?.('lyrics')?.length));

// the midi duration in seconds
const midiDuration = computed(() => {
  if (midi.value) {
    return midi.value.ticksToSeconds(midi.value.duration);
  } else {
    return 0;
  }
});

// the midi time signatures
const midiTimeSignatures = computed(() => {
  if (midi.value) {
    return midi.value.timeSignatures;
  } else {
    return [];
  }
});

// the midi tempos
const midiTempos = computed(() => {
  if (midi.value) {
    return midi.value.tempos;
  } else {
    return [];
  }
});

// convert to unicode
const convertToUnicode = (s: string) => codeToString(convert(s.split('').map((c) => c.charCodeAt(0)), 'UNICODE'));

// format time
const formatTime = (seconds: number) => {
  return [
    format.pad(Math.floor(Math.max(seconds, 0) % (60 ** 3) / (60 ** 2)).toString(), 2),
    format.pad(Math.floor(Math.max(seconds, 0) % (60 ** 2) / (60 ** 1)).toString(), 2),
    format.pad(Math.floor(Math.max(seconds, 0) % (60 ** 1) / (60 ** 0)).toString(), 2),
  ].slice(midiDuration.value >= (60 ** 2) ? 0 : 1).join(':');
};

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
    <q-stepper active-color="grey" flat :model-value="1" vertical>
      <q-step active-icon="mdi-file-music" :name="1" title="Select MIDI file">
        <q-file v-model="file" accept=".mid" label-slot outlined square>
          <template #prepend>
            <q-icon name="mdi-file-music" />
          </template>
          <template #label>
            MIDI File
          </template>
        </q-file>
      </q-step>
      <q-step active-icon="mdi-music-note" :name="1" title="Watch MIDI">
        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-8">
            <q-responsive :ratio="16 / 9">
              <template v-if="midi">
                <tune-player :midi="midi" />
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
                      <template v-if="midiTitle">
                        {{ midiTitle }}
                      </template>
                      <template v-else>
                        no title
                      </template>
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
                      {{ midiDescription || 'no description' }}
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
                      {{ formatTime(midiDuration) }}
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
                      {{ midiTempos[0] ? Math.floor(60000000 / midiTempos[0].value) : 'not available' }} beats per minute
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
                      {{ midiTimeSignatures[0] ? midiTimeSignatures[0].value.join('/') : 'not available' }}
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
                      {{ existsMidiLyrics ? 'words available' : 'not available' }}
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
                      {{ midiCopyright || 'no copyright' }}
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
                      {{ convertToUnicode(track.getEvents('trackName')[0]?.text ?? '') }}
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
      </q-step>
    </q-stepper>
  </q-page>
</template>

<style lang="scss" scoped>
:deep(.q-stepper__step-inner) {
  padding-bottom: 8px;
}
</style>
