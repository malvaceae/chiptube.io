// Tone.js
import * as Tone from 'tone';

// Generator
import { Generator } from '@/classes/generator';

// Sample
import { Sample } from '@/classes/sample';

/**
 * Voice
 */
export interface Voice {
  /**
   * The channel.
   */
  channel: number;

  /**
   * The key.
   */
  key: Tone.Unit.MidiNote;

  /**
   * The velocity.
   */
  velocity: Tone.Unit.NormalRange;

  /**
   * The start time.
   */
  start: Tone.Unit.Seconds;

  /**
   * The end time.
   */
  end?: Tone.Unit.Seconds;

  /**
   * The generator.
   */
  generator: Generator;

  /**
   * The sample.
   */
  sample: Sample;

  /**
   * The output.
   */
  output: Tone.Gain;

  /**
   * The volume.
   */
  volume: Tone.Gain;

  /**
   * The panner.
   */
  panner: Tone.Panner;

  /**
   * The filter.
   */
  filter: Tone.BiquadFilter;

  /**
   * The source.
   */
  source: Tone.ToneBufferSource;

  /**
   * The playback rate.
   */
  playbackRate: Tone.Multiply;

  /**
   * The pitch bend.
   */
  pitchBend: Tone.Signal;

  /**
   * The status.
   */
  status: Tone.Signal;
}
