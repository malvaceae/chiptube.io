<script lang="ts" setup>
// Vue.js
import { computed, onMounted, onUnmounted, ref, shallowRef, watch } from 'vue';

// Pinia
import { storeToRefs } from 'pinia';

// Tune Store
import { useTuneStore } from '@/stores/tune';

// Sampler
import { clearBuffers, getSampler, Sampler } from '@/classes/sampler';

// Amplify
import { Storage } from 'aws-amplify';

// Quasar
import { dom, format } from 'quasar';

// Tone.js
import * as Tone from 'tone';

// Tone.js - MIDI
import { Midi, Track } from '@tonejs/midi';

// p5.js
import p5 from 'p5';

// properties
const props = defineProps<{ identityId: string, midiKey: string }>();

// volume and mute
const { volume, mute } = storeToRefs(useTuneStore());

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

// midi
const midi = shallowRef<Midi>();

// midi - total length of the file in seconds
const duration = computed(() => midi.value?.duration ?? 0);

// midi - total length of the file in ticks
const durationTicks = computed(() => midi.value?.durationTicks ?? 0);

// midi header
const header = computed(() => midi.value?.header);

// midi header - array of all the tempo events
const tempos = computed(() => midi.value?.header?.tempos ?? []);

// midi header - time signatures
const timeSignatures = computed(() => midi.value?.header?.timeSignatures ?? []);

// midi header - ticks per quarter note
const ppq = computed(() => midi.value?.header?.ppq ?? 480);

// midi tracks
const tracks = computed(() => midi.value?.tracks ?? []);

// samplers
const samplers = shallowRef<(Sampler | null)[]>([]);

// current time in seconds
const currentTime = ref(0);

// current time in ticks
const currentTimeTicks = computed(() => header.value?.secondsToTicks?.(currentTime.value) ?? 0);

// current tempo
const currentTempo = computed(() => tempos.value.filter(({ ticks }, i) => {
  return ticks <= currentTimeTicks.value || i === 0;
}).pop());

// current time signature
const currentTimeSignature = computed(() => timeSignatures.value.filter(({ ticks }, i) => {
  return ticks <= currentTimeTicks.value || i === 0;
}).pop());

// bar line seconds
const barLineSeconds = computed(() => timeSignatures.value.flatMap(({ ticks, timeSignature }, i, timeSignatures) => {
  // ticks per bar
  const ticksPerBar = ppq.value * (timeSignature[0] / (timeSignature[1] / 4));

  // ticks of the next time signature
  const nextTicks = timeSignatures[i + 1]?.ticks ?? (durationTicks.value + ticksPerBar);

  // bar line seconds
  return [...Array(Math.ceil((nextTicks - ticks) / ticksPerBar)).keys()].map((i) => {
    return header.value?.ticksToSeconds?.(ticks + (ticksPerBar * i)) ?? 0;
  });
}));

// notes in A0 (21) to C8 (108)
const notes = computed(() => tracks.value.flatMap(({ notes, channel }) => {
  return notes.map(({ midi, name, duration, time, velocity }) => {
    return { midi, name, duration, time, velocity, channel };
  }).filter(({ midi }) => midi >= 21 && midi <= 108);
}));

// notes with a key
const notesWithKey = computed(() => notes.value.map((note) => {
  return { ...note, key: keysById[note.midi] };
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
  Tone.Destination.volume.value = Tone.gainToDb(volume / 100) - 10;
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

  // get the midi url
  const url = await Storage.get(props.midiKey, {
    level: 'protected',
    ...props,
  });

  // download and parse the midi file
  midi.value = await Midi.fromUrl(url);

  // samplers
  samplers.value = tracks.value.map(({ instrument: { number, percussion }, notes }) => {
    return notes.length ? getSampler(!percussion ? number : 128).toDestination() : null;
  });

  // control changes
  const controlChanges = tracks.value.reduce((values, { channel, controlChanges }) => {
    values[channel] = Object.entries(controlChanges).flatMap(([key, values]) => {
      switch (Number(key)) {
        case 6:
        case 7:
        case 10:
        case 11:
        case 38:
        case 64:
        case 100:
        case 101:
        case 121:
          return values;
        default:
          return [];
      }
    }).concat(values[channel] ?? []);

    return values;
  }, {} as Record<number, Track['controlChanges'][number]>);

  // pitch bends
  const pitchBends = tracks.value.reduce((values, { channel, pitchBends }) => {
    return { ...values, [channel]: pitchBends.concat(values[channel] ?? []) };
  }, {} as Record<number, Track['pitchBends']>);

  // parts
  tracks.value.forEach(({ notes, channel }, i) => {
    const sampler = samplers.value[i];

    if (sampler === null) {
      return;
    }

    // notes part
    const notesPart = new Tone.Part((time, { name, duration, velocity }) => {
      sampler.triggerAttackRelease(name, duration, time, velocity);
    }, notes);

    // start
    notesPart.start();

    // control changes part
    const controlChangesPart = new Tone.Part((time, { value, number }) => {
      switch (number) {
        case 6:
          sampler.changeDataEntryMsb(value);
          break;
        case 7:
          sampler.changeVolume(value, time);
          break;
        case 10:
          sampler.changePan(value);
          break;
        case 11:
          sampler.changeExpression(value, time);
          break;
        case 38:
          sampler.changeDataEntryLsb(value);
          break;
        case 64:
          sampler.changeDamperPedal(value, time);
          break;
        case 100:
          sampler.changeRpnLsb(value);
          break;
        case 101:
          sampler.changeRpnMsb(value);
          break;
        case 121:
          sampler.resetAllControllers();
          break;
      }
    }, controlChanges[channel]);

    // start
    controlChangesPart.start();

    // pitch bends part
    const pitchBendsPart = new Tone.Part((time, { value }) => {
      sampler.changePitchBend(value, time);
    }, pitchBends[channel]);

    // start
    pitchBendsPart.start();
  });

  // wait for samplers to load
  await Tone.loaded();

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

  // release all samplers
  samplers.value.forEach((sampler) => {
    sampler?.releaseAll();
  });

  // set current state to paused
  currentState.value = 'paused';
};

// stop
const stop = () => {
  // stop
  Tone.Transport.stop();

  // cancel
  Tone.Transport.cancel();

  // dispose samplers
  samplers.value.forEach((sampler) => {
    sampler?.dispose();
  });

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

  // release all samplers
  samplers.value.forEach((sampler) => {
    sampler?.releaseAll();
  });
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
    }
  }
};

// format time
const formatTime = (seconds: number) => {
  return [
    format.pad(Math.floor(Math.max(seconds, 0) % (60 ** 3) / (60 ** 2)).toString(), 2),
    format.pad(Math.floor(Math.max(seconds, 0) % (60 ** 2) / (60 ** 1)).toString(), 2),
    format.pad(Math.floor(Math.max(seconds, 0) % (60 ** 1) / (60 ** 0)).toString(), 2),
  ].slice(duration.value >= (60 ** 2) ? 0 : 1).join(':');
};

// canvas
const canvas = shallowRef<p5>();

// initialize
onMounted(() => {
  // canvas
  canvas.value = new class extends p5 {
    constructor() {
      super(() => {
        //
      }, el.value);
    }

    setup() {
      const canvas = this.createCanvas(...calcCanvasSize());
      canvas.class('block');
      this.frameRate(30);
    }

    draw() {
      updateTime();
      this.background(32);
      this.drawMinorSecondLines();
      this.drawBarLines();
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
      this.stroke(128);

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
        const height = this.min((duration) * (keyY.value / 4), keyY.value - 4 - y);

        if (y + height < 0) {
          return;
        }

        // draw the note
        this.drawNote(pos, color, channel, y, height);
      });
    }

    drawNote(pos: number, color: string, channel: number, y: number, height: number) {
      this.fill(channelColors[channel]);
      this.stroke(32);

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
      this.stroke(64);

      // draw minor second lines
      minorSecondLines.map(posToWhiteKeyX).forEach((x) => {
        this.line(x, 0, x, keyY.value);
      });
    }

    drawBarLines() {
      this.noFill();
      this.stroke(64);

      // draw bar lines
      barLineSeconds.value.filter((seconds) => seconds >= currentTime.value && seconds < (currentTime.value + 4)).forEach((seconds) => {
        // y-coordinate of the bar line
        const y = keyY.value - (seconds - currentTime.value) * (keyY.value / 4) - 4;

        if (y < 0) {
          return;
        }

        // draw the bar line
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
        this.text(`BPM:${this.round(currentTempo.value.bpm, 2)} BEAT:${currentTimeSignature.value.timeSignature.join('/')}`, 8, keyY.value - 8);
      }
    }
  };
});

// finalize
onUnmounted(() => {
  // remove the canvas
  canvas.value?.remove?.();

  // stop
  stop();

  // clear buffers
  clearBuffers();
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
    <template v-if="currentState === 'started' || currentState === 'paused'">
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
            <q-btn flat padding="xs" :ripple="false" size="lg" square @click="$q.fullscreen.toggle(el)">
              <q-icon :name="$q.fullscreen.isActive ? 'mdi-fullscreen-exit' : 'mdi-fullscreen'" />
            </q-btn>
          </div>
        </div>
      </div>
    </template>
    <q-resize-observer debounce="0" @resize="canvas?.resizeCanvas(...calcCanvasSize())" />
  </div>
</template>

<style lang="scss" scoped>
.backdrop,
.controls {
  transition: opacity .25s cubic-bezier(0, 0, .2, 1);
}

body:not(.no-pointer-events--children) .tune-player:not(:hover) .backdrop,
body:not(.no-pointer-events--children) .tune-player:not(:hover) .controls {
  opacity: 0;
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
