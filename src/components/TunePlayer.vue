<script lang="ts" setup>
// Vue.js
import { computed, onMounted, onUnmounted, ref, shallowRef, watch } from 'vue';

// Pinia
import { storeToRefs } from 'pinia';

// Tune Store
import { useTuneStore } from '@/stores/tune';

// q5.js
import { Q5 } from '@/classes/q5';

// Sampler
import { Sampler } from '@/classes/sampler';

// Utilities
import { search } from '@/classes/utils';

// Midi
import { useMidi } from '@/composables/midi';

// Quasar
import { dom, format } from 'quasar';

// Tone.js
import * as Tone from 'tone';

// properties
const props = defineProps<{ midiBuffer: Promise<ArrayBuffer> | (() => Promise<ArrayBuffer>), thumbnail?: string }>();

// volume, mute and frame rate
const { volume, mute, frameRate } = storeToRefs(useTuneStore());

// 88 keys in A0 (21) to C8 (108)
const keys = [...Array(88).keys()].map((i) => i + 21).map((id) => {
  let pos = id % 12 / 2;

  if (pos > 2) {
    pos += .5;
  }

  // shift the position by the octaves
  pos += Math.floor(id / 12) * 7;

  // shift the position to start at A0
  pos -= 12;

  // if the position is not an integer, the key is black. otherwise, it is white
  const color = Number.isInteger(pos) ? 'white' : 'black';

  return { id, pos, color };
});

// 52 white keys
const whiteKeys = keys.filter(({ color }) => color === 'white');

// 36 black keys
const blackKeys = keys.filter(({ color }) => color === 'black');

// keys by id
const keysById = Object.fromEntries(keys.map((key) => {
  return [key.id, key];
}));

// minor second lines
const minorSecondLines = whiteKeys.filter(({ id }) => id % 12 === 0 || id % 12 === 5).map(({ pos }) => pos);

// sampler
const sampler = new Sampler({
  baseUrl: '/samples/',
}).toDestination();

// channel colors
const channelColors = [
  '#ef7272',
  '#81ef72',
  '#7291ef',
  '#efa272',
  '#72ef91',
  '#8372ef',
  '#efd072',
  '#72efc1',
  '#b072ef',
  '#deef72',
  '#72efef',
  '#e072ef',
  '#b0ef72',
  '#72bfef',
  '#ef72d0',
  '#ef72a0',
];

// root element
const el = ref<HTMLElement>();

// canvas size
const [canvasWidth, canvasHeight] = [ref(0), ref(0)];

// calc canvas size
const calcCanvasSize = () => [canvasWidth.value, canvasHeight.value] = (
  el.value ? [dom.width(el.value), dom.height(el.value)] : [0, 0]
);

// white key size
const [whiteKeyWidth, whiteKeyHeight] = [
  computed(() => canvasWidth.value / 52),
  computed(() => canvasWidth.value / 52 * 6),
];

// black key size
const [blackKeyWidth, blackKeyHeight] = [
  computed(() => whiteKeyWidth.value / 2),
  computed(() => whiteKeyWidth.value * 3.75),
];

// x-coordinate of keys
const posToWhiteKeyX = (pos: number) => pos * whiteKeyWidth.value;
const posToBlackKeyX = (pos: number) => pos * whiteKeyWidth.value + blackKeyWidth.value / 2;

// y-coordinate of keys
const keyY = computed(() => canvasHeight.value - whiteKeyHeight.value);

// use midi
const {
  midi,
  duration,
  timeSignatures,
  tempos,
  measureSeconds,
  channelEvents,
  notesByTrack,
  notes,
  formatTime,
  loadMidi,
} = useMidi();

// notes with a key
const notesWithKey = computed(() => notes.value.flatMap((note) => {
  if (keysById[note.noteNumber]) {
    return [{ ...note, key: keysById[note.noteNumber] }];
  } else {
    return [];
  }
}));

// notes on a white key
const whiteNotes = computed(() => notesWithKey.value.filter(({ key: { color } }) => color === 'white'));

// notes on a black key
const blackNotes = computed(() => notesWithKey.value.filter(({ key: { color } }) => color === 'black'));

// notes by a key
const notesByKey = computed(() => notesWithKey.value.reduce((notes, note) => {
  return { ...notes, [note.key.id]: [...(notes[note.key.id] ?? []), note] };
}, {} as Record<number, typeof notesWithKey.value>));

// set the volume
const setVolume = (volume: number) => {
  Tone.Destination.volume.value = Tone.gainToDb(volume / 100) - 5;
};

// set the mute
const setMute = (mute: boolean) => {
  Tone.Destination.mute = mute;
};

// set the initial volume
setVolume(volume.value);

// set the initial mute
setMute(mute.value);

// watch volume
watch(volume, () => {
  setVolume(volume.value);

  if (volume.value > 0) {
    mute.value = false;
  } else {
    mute.value = true;
  }
});

// watch mute
watch(mute, () => {
  setMute(mute.value);

  if (mute.value === false) {
    volume.value ||= 30;
  }
});

// volume control value
const volumeControlValue = computed({
  get() {
    if (mute.value === false) {
      return volume.value;
    } else {
      return 0;
    }
  },
  set(value: number) {
    volume.value = value;
  },
});

// volume control icon name
const volumeControlIconName = computed(() => {
  if (volume.value === 0 || mute.value) {
    return 'mdi-volume-off';
  } else if (volume.value <= 50) {
    return 'mdi-volume-medium';
  } else {
    return 'mdi-volume-high';
  }
});

// current time in seconds
const currentTime = ref(0);

// current time signature
const currentTimeSignature = computed(() => search(timeSignatures.value, 'time', currentTime.value) ?? timeSignatures.value[0]);

// current tempo
const currentTempo = computed(() => search(tempos.value, 'time', currentTime.value) ?? tempos.value[0]);

// current state
const currentState = ref<Tone.PlaybackState | 'loading'>('stopped');

// play
const play = async () => {
  // resume
  await resume();

  // stop
  stop();

  // set current state to loading
  currentState.value = 'loading';

  // load midi
  await loadMidi(props.midiBuffer);

  // parts of channel events
  channelEvents.value.forEach((events) => new Tone.Part((time, event) => {
    switch (event.type) {
      case 'controller':
        sampler.setControlChange(
          event.controllerType,
          event.value / 127,
          time,
          event.channel,
        );
        break;
      case 'programChange':
        sampler.setProgramChange(
          event.programNumber,
          event.channel,
        );
        break;
      case 'pitchBend':
        sampler.changePitchBend(
          event.value / (event.value < 0 ? 8192 : 8191),
          time,
          event.channel,
        );
        break;
    }
  }, events).start());

  // parts of notes
  notesByTrack.value.forEach((notes) => new Tone.Part((time, note) => {
    if (currentState.value === 'started') {
      /**
       * If note is played, do nothing.
       *
       * Related Issues
       * https://github.com/Tonejs/Tone.js/issues/944
       * https://github.com/Tonejs/Tone.js/issues/999
       * https://github.com/Tonejs/Tone.js/issues/1080
       * https://github.com/Tonejs/Tone.js/issues/1098
       * https://github.com/Tonejs/Tone.js/issues/1175
       */
      if (note.isPlayed) {
        return;
      }

      sampler.triggerAttackRelease(
        Tone.Frequency(note.noteNumber, 'midi').toNote(),
        note.duration,
        time,
        note.velocity / 127,
        note.channel,
      );

      // set note is played to true
      note.isPlayed = true;
    }
  }, notes).start());

  // channels
  const channels = [...new Set(notes.value.map(({ channel }) => channel))];

  // program changes
  const programChanges = midi.value?.getEvents?.('programChange')?.filter?.(({ channel }) => channels.includes(channel)) ?? [];

  // first program change by channel
  const firstProgramChangeByChannel = programChanges.reduce((programChanges, { channel, programNumber }) => {
    return { ...programChanges, [channel]: programChanges[channel] ?? programNumber };
  }, {} as Record<number, number>);

  // set default program change
  Object.entries(firstProgramChangeByChannel).forEach(([channel, programNumber]) => {
    sampler.setProgramChange(programNumber, Number(channel));
  });

  // preset ids
  const presetIds = programChanges.map(({ channel, programNumber }) => {
    return channel === 9 ? 128 << 8 : programNumber;
  });

  // add preset id for percussion
  if (channels.includes(9)) {
    presetIds.push(128 << 8);
  }

  // add preset id for piano
  if (channels.some((channel) => !(channel === 9 || firstProgramChangeByChannel[channel]))) {
    presetIds.push(0);
  }

  // wait for sf2 files to load
  await Promise.all([...new Set(presetIds)].map((id) => {
    return sampler.loadSf2(
      (id & 0x00FF) >> 0,
      (id & 0xFF00) >> 8,
    );
  }));

  // start
  start();
};

// resume
const resume = async () => {
  if (Tone.context.state === 'suspended') {
    await Tone.context.resume();
  }
};

// start
const start = () => {
  // start
  Tone.Transport.start();

  // set current state to started
  currentState.value = 'started';
};

// pause
const pause = () => {
  // pause
  Tone.Transport.pause();

  // release all voices
  sampler.releaseAll();

  // set current state to paused
  currentState.value = 'paused';
};

// stop
const stop = () => {
  // stop
  Tone.Transport.stop();

  // cancel
  Tone.Transport.cancel();

  // release all voices
  sampler.releaseAll();

  // set current state to stopped
  currentState.value = 'stopped';
};

// toggle
const toggle = () => {
  switch (currentState.value) {
    case 'stopped':
      play();
      break;
    case 'started':
      pause();
      break;
    case 'paused':
      start();
      break;
  }
};

// seek
const seek = (seconds: number) => {
  Tone.Transport.seconds = seconds;

  // set note is played to false
  notesByTrack.value.forEach((notes) => {
    notes.forEach((note) => {
      note.isPlayed = false;
    });
  });

  // release all voices
  sampler.releaseAll();
};

// seekbar value
const seekbarValue = computed({
  get() {
    return currentTime.value;
  },
  set(value: number) {
    seek(value);
  },
});

// triggered when user starts panning on the seekbar
const onPan = (phase: 'start' | 'end') => {
  if (currentState.value === 'started') {
    switch (phase) {
      case 'start':
        Tone.Transport.pause();
        break;
      case 'end':
        Tone.Transport.start();
        break;
    }
  }
};

// update current time
const updateTime = () => {
  if (Tone.Transport.seconds <= duration.value) {
    currentTime.value = Tone.Transport.seconds;
  } else {
    if (currentState.value === 'started') {
      // pause
      Tone.Transport.pause();

      // set current state to paused
      currentState.value = 'paused';

      // seek to first
      Tone.Transport.seconds = 0;

      // set note is played to false
      notesByTrack.value.forEach((notes) => {
        notes.forEach((note) => {
          note.isPlayed = false;
        });
      });
    }
  }
};

// q5
const q5 = shallowRef<Q5>();

// initialize
onMounted(() => {
  // q5
  q5.value = new class extends Q5 {
    setup() {
      const canvas = this.createCanvas(...calcCanvasSize());
      canvas.classList.add('block');
      this.frameRate(frameRate.value);
    }

    draw() {
      updateTime();
      this.background('#202020');
      this.drawMinorSecondLines();
      this.drawMeasureLines();
      this.drawNotes();
      this.drawKeys();
      this.drawInfo();
    }

    drawKeys() {
      [...whiteKeys, ...blackKeys].forEach(({ id, pos, color }) => {
        // get active channel that current time is inside a pressed interval
        const { channel } = notesByKey.value[id]?.filter?.(({ time, duration }) => {
          return time < currentTime.value && time + duration > currentTime.value;
        })?.pop?.() ?? {};

        // draw the key
        this.drawKey(pos, color, channel);
      });
    }

    drawKey(pos: number, color: string, channel?: number) {
      this.fill(color);
      this.stroke('#808080');

      if (typeof channel === 'number' && channelColors[channel]) {
        this.fill(channelColors[channel]);
      }

      // draw the white key
      if (color === 'white') {
        this.rect(posToWhiteKeyX(pos), keyY.value, whiteKeyWidth.value, whiteKeyHeight.value);
      }

      // draw the black key
      if (color === 'black') {
        this.rect(posToBlackKeyX(pos), keyY.value, blackKeyWidth.value, blackKeyHeight.value);
      }
    }

    drawNotes() {
      [...whiteNotes.value, ...blackNotes.value].forEach(({ time, duration, channel, key: { pos, color } }) => {
        // y-coordinate of the note
        const y = ((currentTime.value + 4) - (time + duration)) * (keyY.value / 4) - 4;

        if (y > keyY.value - 4) {
          return;
        }

        // height of the note
        const height = format.between((duration) * (keyY.value / 4), 1, keyY.value - 4 - y);

        if (y + height < 0) {
          return;
        }

        // draw the note
        this.drawNote(pos, color, channel, y, height);
      });
    }

    drawNote(pos: number, color: string, channel: number, y: number, height: number) {
      this.fill(channelColors[channel]);
      this.stroke('#202020');

      // draw the note of white key
      if (color === 'white') {
        this.rect(posToWhiteKeyX(pos), y, whiteKeyWidth.value, height, 4);
      }

      // draw the note of black key
      if (color === 'black') {
        this.rect(posToBlackKeyX(pos), y, blackKeyWidth.value, height, 4);
      }
    }

    drawMinorSecondLines() {
      this.noFill();
      this.stroke('#404040');

      // draw minor second lines
      minorSecondLines.map(posToWhiteKeyX).forEach((x) => {
        this.line(x, 0, x, keyY.value);
      });
    }

    drawMeasureLines() {
      this.noFill();
      this.stroke('#404040');

      // draw measure lines
      measureSeconds.value.filter((seconds) => seconds >= currentTime.value && seconds < (currentTime.value + 4)).forEach((seconds) => {
        // y-coordinate of the measure line
        const y = keyY.value - (seconds - currentTime.value) * (keyY.value / 4) - 4;

        if (y < 0) {
          return;
        }

        // draw the measure line
        this.line(0, y, canvasWidth.value, y);
      });
    }

    drawInfo() {
      this.fill('white');
      this.noStroke();

      // set style of the info text
      this.textFont('Roboto');
      this.textSize(18);

      // draw the info text
      if (currentTempo.value && currentTimeSignature.value) {
        this.text(`BPM:${Math.floor(60000000 / currentTempo.value.value)} BEAT:${currentTimeSignature.value.value.join('/')}`, 8, keyY.value - 8);
      }
    }
  }(el.value);
});

// watch midi buffer
watch(() => props.midiBuffer, () => {
  // stop
  stop();

  // reset all controllers and program changes
  [...Array(16)].forEach((_, channel) => {
    sampler.resetAllControllers(channel);
    sampler.setProgramChange(0, channel);
  });

  // reset midi
  midi.value = null;
});

// finalize
onUnmounted(() => {
  // stop
  stop();

  // dispose sampler
  sampler.dispose();
});
</script>

<template>
  <div ref="el" class="tune-player relative-position fit text-white non-selectable" @click="toggle">
    <template v-if="currentState === 'stopped'">
      <div class="absolute-full cursor-pointer">
        <div class="absolute-center">
          <q-btn outline padding="xs lg" size="xl">
            <q-icon name="mdi-play" />
          </q-btn>
        </div>
      </div>
    </template>
    <template v-if="currentState === 'loading'">
      <div class="absolute-full" @click.stop>
        <div class="absolute-center">
          <q-spinner size="xl" />
        </div>
      </div>
    </template>
    <template v-if="props.thumbnail">
      <q-img class="thumbnail absolute no-pointer-events" :ratio="16 / 9" :src="props.thumbnail" />
    </template>
    <template v-if="['started', 'paused'].includes(currentState)">
      <div class="backdrop absolute-bottom" />
      <div class="controls" @click.stop>
        <div class="seekbar absolute">
          <q-slider v-model="seekbarValue" color="white" dense :max="duration" :step="0" thumb-size="0" @pan="onPan" />
        </div>
        <div class="actions absolute row no-wrap items-center">
          <div>
            <q-btn flat padding="xs" :ripple="false" size="lg" square @click="toggle">
              <q-icon :name="currentState === 'started' ? 'mdi-pause' : 'mdi-play'" />
            </q-btn>
          </div>
          <div class="volume-control row no-wrap items-center">
            <q-btn flat padding="sm" :ripple="false" size="lg" square @click="mute = !mute">
              <q-icon :name="volumeControlIconName" size="1.315em" />
            </q-btn>
            <q-slider v-model="volumeControlValue" class="q-mx-sm" color="white" dense />
          </div>
          <div class="time text-no-wrap">
            {{ formatTime(currentTime) }} / {{ formatTime(duration) }}
          </div>
          <q-space />
          <div>
            <q-btn flat padding="sm" :ripple="false" size="md" square>
              <q-icon name="mdi-cog" />
              <q-menu class="no-shadow" anchor="top right" :offset="[0, 8]" self="bottom right" square>
                <q-list bordered dense padding>
                  <q-item clickable>
                    <q-item-section side>
                      <q-icon name="mdi-play-speed" />
                    </q-item-section>
                    <q-item-section>
                      Frame rate: {{ frameRate }} fps
                    </q-item-section>
                    <q-item-section side>
                      <q-icon name="mdi-chevron-right" />
                    </q-item-section>
                    <q-menu class="no-shadow" anchor="bottom right" :offset="[1.33125, 9]" self="bottom right" square>
                      <q-list bordered dense padding>
                        <q-item clickable v-close-popup @click="q5?.frameRate?.(frameRate = 60)">
                          <q-item-section side>
                            <q-icon :class="{ invisible: !(frameRate === 60) }" name="mdi-check" />
                          </q-item-section>
                          <q-item-section>
                            60 fps
                          </q-item-section>
                        </q-item>
                        <q-item clickable v-close-popup @click="q5?.frameRate?.(frameRate = 30)">
                          <q-item-section side>
                            <q-icon :class="{ invisible: !(frameRate === 30) }" name="mdi-check" />
                          </q-item-section>
                          <q-item-section>
                            30 fps
                          </q-item-section>
                        </q-item>
                        <q-item clickable v-close-popup @click="q5?.frameRate?.(frameRate = 24)">
                          <q-item-section side>
                            <q-icon :class="{ invisible: !(frameRate === 24) }" name="mdi-check" />
                          </q-item-section>
                          <q-item-section>
                            24 fps
                          </q-item-section>
                        </q-item>
                      </q-list>
                    </q-menu>
                  </q-item>
                </q-list>
              </q-menu>
            </q-btn>
          </div>
          <div>
            <q-btn flat padding="xs" :ripple="false" size="lg" square @click="$q.fullscreen.toggle(el)">
              <q-icon :name="$q.fullscreen.isActive ? 'mdi-fullscreen-exit' : 'mdi-fullscreen'" />
            </q-btn>
          </div>
        </div>
      </div>
    </template>
    <q-resize-observer debounce="0" @resize="q5?.resizeCanvas?.(...calcCanvasSize())" />
  </div>
</template>

<style lang="scss" scoped>
.thumbnail,
.backdrop,
.controls {
  transition: opacity .25s cubic-bezier(0, 0, .2, 1);
}

body:not(.no-pointer-events--children) .tune-player:not(:hover) .thumbnail {
  opacity: v-bind("['started', 'paused'].includes(currentState) ? 0 : .75");
}

body:not(.no-pointer-events--children) .tune-player:not(:hover) .backdrop,
body:not(.no-pointer-events--children) .tune-player:not(:hover) .controls {
  opacity: 0;
}

.thumbnail {
  right: 0;
  bottom: v-bind('`${whiteKeyHeight + 4}px`');
  width: v-bind('`${whiteKeyWidth * 6}px`');
  opacity: .75;
}

.backdrop {
  min-height: 146px;
  max-height: 146px;
  background-image: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAACSCAYAAACE56BkAAAAAXNSR0IArs4c6QAAAPVJREFUKFNlyOlHGAAcxvHuY93H1n1fW1v3fbej+zAmI5PIRGYiM5JEEkkiiSSRRPoj83nze9Pz4uPrSUh4tURPEpKDFJWKtCBdZSAzeKOykB3kqFzkBfmqAIVBkSrGW7wLSlQpyoJyVYHKoEpVoyaoVXWoDxpUI5qCZtWC98EH1YqPwSfVhvagQ3WiK+hWPegN+lQ/BoJBNYRhjASjagzjwYSaxOfgi/qKb8GUmsZMMKvmMB8sqEUsYRnf8QMr+IlV/MIa1rGB39jEFv7gL7axg3/4j13sYR8HOMQRjnGCU5zhHBe4xBWucYNb3OEeD3jEE55fAOe7I9q0+rDDAAAAAElFTkSuQmCC");
}

.seekbar {
  right: 8px;
  bottom: 32px;
  left: 8px;
}

.actions {
  right: 8px;
  bottom: 0;
  left: 8px;

  :deep(.q-focus-helper) {
    visibility: hidden;
  }
}

.volume-control .q-slider {
  width: 52px;
}

.time {
  margin-right: 8px;
  margin-left: 12px;
}

:deep(.q-slider__selection),
:deep(.q-slider__thumb) {
  transition: none;
}
</style>
