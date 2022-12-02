<script lang="ts" setup>
// Vue.js
import { computed, onMounted, onUnmounted, ref, shallowRef, watch } from 'vue';

// Pinia
import { storeToRefs } from 'pinia';

// Tune Store
import { useTuneStore } from '@/stores/tune';

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

// instruments
const instruments = shallowRef<(Tone.PolySynth | Tone.Sampler)[]>([]);

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
  Tone.Destination.volume.value = Math.log10(volume) * 20 - 40 - 10;
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

  // samples
  const samples = [...new Set(tracks.value.map(({ instrument: { number } }) => number))].reduce((samples, number) => {
    if (samples[number]) {
      return samples;
    }

    // acoustic grand piano
    if (number === 0) {
      samples[number] = new Tone.Sampler({
        urls: {
          'A7': 'A7.mp3',
          'A6': 'A6.mp3',
          'A#5': 'As5.mp3',
          'B4': 'B4.mp3',
          'C3': 'C3.mp3',
          'C#2': 'Cs2.mp3',
          'D1': 'D1.mp3',
          'D#7': 'Ds7.mp3',
          'D#6': 'Ds6.mp3',
          'E5': 'E5.mp3',
          'F4': 'F4.mp3',
          'F#3': 'Fs3.mp3',
          'G2': 'G2.mp3',
          'G#1': 'Gs1.mp3',
        },
        baseUrl: '/samples/piano/',
        release: 2,
      }).toDestination();
      return samples;
    }

    // square synths (guitars)
    if (number >= 24 && number <= 31) {
      samples[number] = new Tone.PolySynth(Tone.Synth, {
        oscillator: {
          type: 'square',
        },
        envelope: {
          attack: .001,
          decay: .3,
          sustain: .3,
          release: .7,
        },
      }).toDestination();
      return samples;
    }

    // triangle synths (bass instruments)
    if (number >= 32 && number <= 39) {
      samples[number] = new Tone.PolySynth(Tone.Synth, {
        oscillator: {
          type: 'triangle',
        },
        envelope: {
          attack: .01,
          decay: .5,
          sustain: .5,
          release: .7,
        },
      }).toDestination();
      return samples;
    }

    // sawtooth synths (stringed instruments)
    if (number >= 40 && number <= 55 || number === 81) {
      samples[number] = new Tone.PolySynth(Tone.Synth, {
        oscillator: {
          type: 'sawtooth',
        },
        envelope: {
          attack: .05,
          decay: .5,
          sustain: .5,
          release: .7,
        },
      }).toDestination();
      return samples;
    }

    // square synths (wind instruments)
    if (number >= 56 && number <= 80) {
      samples[number] = new Tone.PolySynth(Tone.Synth, {
        oscillator: {
          type: 'square',
        },
        envelope: {
          attack: .001,
          decay: .3,
          sustain: .3,
          release: .7,
        },
      }).toDestination();
      return samples;
    }

    // pulse synths for all else
    samples[number] = new Tone.PolySynth(Tone.Synth, {
      oscillator: {
        type: 'pulse',
      },
      envelope: {
        attack: .001,
        decay: .1,
        sustain: .3,
        release: .7,
      },
    }).toDestination();
    return samples;
  }, {} as Record<number, Tone.PolySynth | Tone.Sampler>);

  // instruments
  instruments.value = tracks.value.map(({ instrument: { number } }) => {
    return samples[number];
  });

  // wait for samplers to load
  await Tone.loaded();

  // sustains
  const sustains = tracks.value.reduce((sustains, { instrument: { number }, controlChanges: { sustain } }) => {
    return sustain ? { ...sustains, [number]: sustain } : sustains;
  }, {} as Record<number, Track['controlChanges']['sustain']>);

  // parts
  tracks.value.forEach(({ instrument: { number }, notes }, i) => {
    const instrument = instruments.value[i];

    const part = new Tone.Part((time, { midi, name, duration, velocity }) => {
      // the current sustain
      const currentSustain = sustains[number]?.filter?.(({ time }) => {
        return time <= Tone.Transport.seconds;
      })?.pop?.();

      if (currentSustain?.value) {
        // the next sustain
        const nextSustain = sustains[number]?.find?.(({ time }) => {
          return time > Tone.Transport.seconds;
        });

        if (nextSustain?.value === 0) {
          duration = format.between(duration * 4, duration, nextSustain.time - Tone.Transport.seconds);
        } else {
          duration = duration * 4;
        }
      }

      // the next note
      const nextNote = notesByKey.value[midi]?.find?.(({ time }) => {
        return time > Tone.Transport.seconds;
      });

      if (nextNote) {
        duration = Math.min(duration, nextNote.time - Tone.Transport.seconds);
      }

      // attack and release the note
      instrument.triggerAttackRelease(name, duration, time, velocity);
    }, notes);

    part.start();
  });

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

  // release all instruments
  instruments.value.forEach((instrument) => {
    instrument.releaseAll();
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

  // release all instruments
  instruments.value.forEach((instrument) => {
    instrument.releaseAll();
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

  // release all instruments
  instruments.value.forEach((instrument) => {
    instrument.releaseAll();
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
      pause();
      seek(0);
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
  canvas.value?.remove();

  // stop
  stop();
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
