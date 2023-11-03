// Vue.js
import { MaybeRefOrGetter, computed, shallowRef, toValue } from 'vue';

// encoding.js
import Encoding from 'encoding-japanese';

// Midi
import { Midi } from '@/classes/midi';

export const useMidi = () => {
  // the midi
  const midi = shallowRef<Midi | null>(null);

  // the midi tracks
  const tracks = computed(() => midi.value?.tracks ?? []);

  // the midi title
  const title = computed(() => convertSJISToUnicode(tracks.value[0]?.getEvents?.('trackName')?.[0]?.text ?? ''));

  // the midi description
  const description = computed(() => convertSJISToUnicode(tracks.value[0]?.getEvents?.('text')?.map?.(({ text }) => text)?.join?.('\n') ?? ''));

  // the midi copyright
  const copyright = computed(() => convertSJISToUnicode(tracks.value[0]?.getEvents?.('copyrightNotice')?.[0]?.text ?? ''));

  // the midi lyrics
  const lyrics = computed(() => midi.value?.getEvents?.('lyrics') ?? []);

  // the midi duration in seconds
  const duration = computed(() => midi.value?.ticksToSeconds?.(midi.value.duration) ?? 0);

  // the midi time signatures
  const timeSignatures = computed(() => midi.value?.timeSignatures ?? []);

  // the midi tempos
  const tempos = computed(() => midi.value?.tempos ?? []);

  // the midi measure seconds
  const measureSeconds = computed(() => midi.value?.measureTicks?.map?.(Midi.prototype.ticksToSeconds.bind(midi.value)) ?? []);

  // the midi channel events
  const channelEvents = computed(() => tracks.value.map((track) => track.flatMap((event) => {
    switch (event.type) {
      case 'controller':
      case 'programChange':
      case 'pitchBend':
        return [{ ...event, time: midi.value?.ticksToSeconds?.(event.absoluteTime) ?? 0 }];
      default:
        return [];
    }
  })));

  // the midi notes by a track
  const notesByTrack = computed(() => tracks.value.map((track) => {
    // note offs and note ons
    const [noteOffs, noteOns] = [
      track.getEvents('noteOff'),
      track.getEvents('noteOn'),
    ];

    // note offs by a channel
    const noteOffsByChannel = noteOffs.reduce((noteOffs, { channel, ...noteOff }) => {
      return { ...noteOffs, [channel]: [...(noteOffs[channel] ?? []), noteOff] };
    }, {} as Record<number, { absoluteTime: number, noteNumber: number }[]>);

    // notes
    return noteOns.flatMap(({ absoluteTime, channel, noteNumber, velocity }) => {
      // note off index
      const noteOffIndex = noteOffsByChannel[channel].findIndex((noteOff) => {
        return noteOff.noteNumber === noteNumber
          && noteOff.absoluteTime - absoluteTime >= 0;
      });

      if (noteOffIndex >= 0) {
        // note off
        const noteOff = noteOffsByChannel[channel].splice(noteOffIndex, 1)[0];

        // note off time
        const noteOffTime = midi.value?.ticksToSeconds?.(noteOff.absoluteTime) ?? 0;

        // note time
        const time = midi.value?.ticksToSeconds?.(absoluteTime) ?? 0;

        // note duration
        const duration = noteOffTime - time;

        // note is played
        const isPlayed = false;

        return [{
          channel,
          noteNumber,
          velocity,
          time,
          duration,
          isPlayed,
        }];
      } else {
        return [];
      }
    });
  }));

  // the midi notes
  const notes = computed(() => notesByTrack.value.flat());

  // format time
  const formatTime = (seconds: number) => {
    return [
      Math.floor(Math.max(seconds, 0) % (60 ** 3) / (60 ** 2)).toString().padStart(2, '0'),
      Math.floor(Math.max(seconds, 0) % (60 ** 2) / (60 ** 1)).toString().padStart(2, '0'),
      Math.floor(Math.max(seconds, 0) % (60 ** 1) / (60 ** 0)).toString().padStart(2, '0'),
    ].slice(duration.value >= (60 ** 2) ? 0 : 1).join(':');
  };

  // convert SJIS to unicode
  const convertSJISToUnicode = (data: string) => Encoding.detect(data, 'SJIS') ? Encoding.convert(data, 'UNICODE', 'SJIS') : data;

  // load midi
  const loadMidi = async (midiBuffer: MaybeRefOrGetter<Promise<ArrayBuffer>>) => {
    try {
      midi.value = new Midi(new Uint8Array(await toValue(midiBuffer)));
    } catch {
      midi.value = null;
    }
  };

  return {
    midi,
    tracks,
    title,
    description,
    copyright,
    lyrics,
    duration,
    timeSignatures,
    tempos,
    measureSeconds,
    channelEvents,
    notesByTrack,
    notes,
    formatTime,
    convertSJISToUnicode,
    loadMidi,
  };
};
