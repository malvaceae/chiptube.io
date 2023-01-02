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
   * The damper pedal.
   */
  damperPedal: Tone.Unit.NormalRange = 0;

  /**
   * The registered parameter number (RPN) LSB.
   */
  rpnLsb?: Tone.Unit.NormalRange;

  /**
   * The registered parameter number (RPN) MSB.
   */
  rpnMsb?: Tone.Unit.NormalRange;

  /**
   * The pitch bend.
   */
  pitchBend: Tone.Unit.AudioRange = 0;

  /**
   * The pitch bend sensitivity.
   */
  pitchBendSensitivity: number = 2;

  /**
   * Get the panner value.
   */
  get pannerValue(): Tone.Unit.AudioRange | undefined {
    return this.pan ? (this.pan - .5) * 2 : undefined;
  }
}
