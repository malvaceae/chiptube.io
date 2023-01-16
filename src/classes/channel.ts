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
  pan: Tone.Unit.NormalRange = 64 / 127;

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
  rpnLsb: Tone.Unit.NormalRange = 1;

  /**
   * The registered parameter number (RPN) MSB.
   */
  rpnMsb: Tone.Unit.NormalRange = 1;

  /**
   * The pitch bend.
   */
  pitchBend: Tone.Unit.AudioRange = 0;

  /**
   * The pitch bend sensitivity.
   */
  private _pitchBendSensitivity = 256;

  /**
   * Set the data entry MSB.
   */
  set dataEntryMsb(dataEntryMsb: Tone.Unit.NormalRange) {
    // pitch bend sensitivity
    if (this.rpnMsb === 0 && this.rpnLsb === 0) {
      this._pitchBendSensitivity = this._pitchBendSensitivity & 0x007F | dataEntryMsb * 127 << 7;
    }
  }

  /**
   * Set the data entry LSB.
   */
  set dataEntryLsb(dataEntryLsb: Tone.Unit.NormalRange) {
    // pitch bend sensitivity
    if (this.rpnMsb === 0 && this.rpnLsb === 0) {
      this._pitchBendSensitivity = this._pitchBendSensitivity & 0x3F80 | dataEntryLsb * 127 << 0;
    }
  }

  /**
   * Get the pitch bend sensitivity.
   */
  get pitchBendSensitivity() {
    return (
      (this._pitchBendSensitivity & 0x3F80) / 128 +
      (this._pitchBendSensitivity & 0x007F) / 100
    );
  }
}
