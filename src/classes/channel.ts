// Tone.js
import * as Tone from 'tone';

/**
 * Channel
 */
export class Channel {
  /**
   * The volume.
   */
  volume: Tone.Unit.NormalRange = 100 / 127;

  /**
   * The pan.
   */
  pan?: Tone.Unit.NormalRange;

  /**
   * The expression.
   */
  expression: Tone.Unit.NormalRange = 1;

  /**
   * The sustain.
   */
  sustain: Tone.Unit.NormalRange = 0;

  /**
   * Get the panner value.
   */
  get pannerValue(): Tone.Unit.AudioRange | undefined {
    return this.pan ? (this.pan - .5) * 2 : undefined;
  }
}
