// Utilities
import { search } from '@/classes/utils';

// midi-file
import {
  MidiEvent,
  MidiHeader,
  parseMidi,
} from 'midi-file';

/**
 * Midi Time Signature
 */
export interface MidiTimeSignature {
  /**
   * The ticks.
   */
  ticks: number;

  /**
   * The numerator and denominator.
   */
  value: [
    number,
    number,
  ];

  /**
   * The time.
   */
  time?: number;
}

/**
 * Midi Tempo
 */
export interface MidiTempo {
  /**
   * The ticks.
   */
  ticks: number;

  /**
   * The microseconds per beat.
   */
  value: number;

  /**
   * The time.
   */
  time?: number;
}

/**
 * Midi Track
 */
export class MidiTrack extends Array<MidiEvent & { absoluteTime: number }> {
  /**
   * Returns a new midi track from a set of events.
   */
  static from(events: MidiTrack[number][]) {
    const track = new this(events.length);

    // copy events
    events.forEach((_, i) => {
      track[i] = events[i];
    });

    return track;
  }

  /**
   * Get events by the type.
   */
  getEvents<T extends MidiEvent['type']>(type: T) {
    return this.flatMap((event) => {
      if (isEventOf(event, type)) {
        return [event];
      } else {
        return [];
      }
    });
  }
}

/**
 * Midi
 */
export class Midi {
  /**
   * The midi header.
   */
  readonly header: MidiHeader;

  /**
   * The midi tracks.
   */
  readonly tracks: MidiTrack[];

  /**
   * The midi duration.
   */
  readonly duration: number;

  /**
   * The midi time signatures.
   */
  readonly timeSignatures: MidiTimeSignature[];

  /**
   * The midi tempos.
   */
  readonly tempos: MidiTempo[];

  /**
   * The midi measure ticks.
   */
  readonly measureTicks: number[];

  /**
   * @param midi The midi buffer.
   */
  constructor(midi: Uint8Array) {
    // parse midi
    const {
      header,
      tracks,
    } = parseMidi(midi);

    // midi header
    this.header = header;

    // midi tracks
    this.tracks = tracks.map((track) => {
      let currentTicks = 0;

      // events
      const events = track.map((event) => {
        currentTicks += event.deltaTime;

        return Object.assign(event, {
          absoluteTime: currentTicks,
        });
      });

      return MidiTrack.from(events);
    });

    // midi duration
    this.duration = this.getEvents('noteOff').reduce((duration, event) => {
      return event.absoluteTime > duration ? event.absoluteTime : duration;
    }, 0);

    // midi time signatures
    this.timeSignatures = this.getEvents('timeSignature').map((event) => ({
      ticks: event.absoluteTime,
      value: [
        event.numerator,
        event.denominator,
      ],
    }));

    // sort midi time signatures
    this.timeSignatures.sort((a, b) => {
      return a.ticks - b.ticks;
    });

    // midi tempos
    this.tempos = this.getEvents('setTempo').map((event) => ({
      ticks: event.absoluteTime,
      value: event.microsecondsPerBeat,
    }));

    // sort midi tempos
    this.tempos.sort((a, b) => {
      return a.ticks - b.ticks;
    });

    // set midi tempo time
    this.tempos.reduce((previousTempo, currentTempo) => {
      if (typeof previousTempo.time === 'number') {
        currentTempo.time = (previousTempo.value / 1e6) * (currentTempo.ticks / this.ppq - previousTempo.ticks / this.ppq) + previousTempo.time;
      } else {
        currentTempo.time = (previousTempo.value / 1e6) * (currentTempo.ticks / this.ppq);
      }

      return currentTempo;
    }, this.tempos[0]);

    // set midi time signature time
    this.timeSignatures.forEach((timeSignature, i, { [i]: { ticks } }) => {
      Object.assign(timeSignature, { time: this.ticksToSeconds(ticks) });
    });

    // midi measure ticks
    this.measureTicks = this.timeSignatures.reduce((measureTicks, timeSignature, i, timeSignatures) => {
      // ticks per measure
      const ticksPerMeasure = timeSignature.value[0] / (timeSignature.value[1] / 4) * this.ppq;

      // ticks of next time signature
      const nextTicks = timeSignatures[i + 1]?.ticks ?? this.duration + ticksPerMeasure;

      // add measure ticks
      for (let ticks = timeSignature.ticks; ticks < nextTicks; ticks += ticksPerMeasure) {
        measureTicks.push(ticks);
      }

      return measureTicks;
    }, [] as number[]);
  }

  /**
   * Get pulses per quarter.
   */
  get ppq() {
    return this.header.ticksPerBeat ?? 480;
  }

  /**
   * Convert ticks to seconds.
   */
  ticksToSeconds(ticks: number) {
    // get last tempo less than or equal to passed ticks
    const tempo = search(this.tempos, 'ticks', ticks);

    if (typeof tempo?.time === 'undefined') {
      return (60 / 120) * (ticks / this.ppq);
    }

    // seconds per beat
    const secondsPerBeat = tempo.value / 1e6;

    // beats
    const beats = (ticks - tempo.ticks) / this.ppq;

    // seconds
    return tempo.time + secondsPerBeat * beats;
  }

  /**
   * Convert seconds to ticks.
   */
  secondsToTicks(seconds: number) {
    // get last tempo less than or equal to passed seconds
    const tempo = search(this.tempos, 'time', seconds);

    if (typeof tempo?.time === 'undefined') {
      return seconds / (60 / 120) * this.ppq;
    }

    // seconds per beat
    const secondsPerBeat = tempo.value / 1e6;

    // beats
    const beats = (seconds - tempo.time) / secondsPerBeat;

    // ticks
    return tempo.ticks + beats * this.ppq;
  }

  /**
   * Get events by the type.
   */
  getEvents<T extends MidiEvent['type']>(type: T) {
    return this.tracks.flatMap((track) => {
      return track.getEvents(type);
    });
  }
}

/**
 * Returns true if the event type matches the passed type, false otherwise.
 */
const isEventOf = <T extends MidiEvent, U extends T['type']>(event: T, type: U): event is Extract<T, { type: U }> => {
  return event.type === type;
};
