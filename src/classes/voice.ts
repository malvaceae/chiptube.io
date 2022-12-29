// Tone.js
import * as Tone from 'tone';

// Sampler
import { Sampler } from '@/classes/sampler';

// Generator
import { Generator } from '@/classes/generator';

// Sample
import { Sample } from '@/classes/sample';

/**
 * Voice
 */
export interface Voice {
  /**
   * The sampler.
   */
  sampler: Sampler;

  /**
   * The key.
   */
  key: Tone.Unit.MidiNote;

  /**
   * The time.
   */
  time: Tone.Unit.Seconds;

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
   * The status.
   */
  status: Tone.Signal;
}
