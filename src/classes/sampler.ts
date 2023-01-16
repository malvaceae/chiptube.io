// Tone.js
import * as Tone from 'tone';

// Generator
import { Generator } from '@/classes/generator';

// Generators
import { generators } from '@/classes/generators';

// Sample
import { Sample } from '@/classes/sample';

// Samples
import { samples } from '@/classes/samples';

// Channel
import { Channel } from '@/classes/channel';

// Voice
import { Voice } from '@/classes/voice';

/**
 * Sampler Options
 */
export interface SamplerOptions extends Tone.ToneAudioNodeOptions {
  /**
   * The volume.
   */
  volume: Tone.Unit.Decibels;

  /**
   * The generators.
   */
  generators: Partial<Generator>[];

  /**
   * The samples.
   */
  samples: Sample[];

  /**
   * The path which is prefixed before every url.
   */
  baseUrl: string;
}

/**
 * Sampler
 */
export class Sampler extends Tone.ToneAudioNode<SamplerOptions> {
  /**
   * The name of the class.
   */
  readonly name = 'Sampler';

  /**
   * The sampler only has an output.
   */
  input = undefined;

  /**
   * The output nodes.
   */
  output: Tone.OutputNode;

  /**
   * The generators.
   */
  private _generators: Generator[];

  /**
   * The samples.
   */
  private _samples: Map<number, Sample> = new Map();

  /**
   * The buffers.
   */
  private _buffers: Map<number, Tone.ToneAudioBuffer> = new Map();

  /**
   * The channel.
   */
  private _channel: Channel = new Channel();

  /**
   * The object of all currently playing voices.
   */
  private static _activeVoices: Voice[] = Array(64);

  /**
   * @param options The options associated with the sampler.
   */
  constructor(options?: Partial<SamplerOptions>);
  constructor() {
    super(Tone.optionsFromArguments(Sampler.getDefaults(), arguments, [
      //
    ]));

    // options
    const { context, volume, generators, samples, baseUrl } = Tone.optionsFromArguments(Sampler.getDefaults(), arguments, [
      //
    ]);

    // output nodes
    this.output = new Tone.Volume({
      context,
      volume,
    });

    // generators
    this._generators = generators.map((generator) => ({
      0: 0,
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
      6: 0,
      7: 0,
      8: 13500,
      9: 0,
      10: 0,
      11: 0,
      12: 0,
      13: 0,
      14: 0,
      15: 0,
      16: 0,
      17: 0,
      18: 0,
      19: 0,
      20: 0,
      21: -12000,
      22: 0,
      23: -12000,
      24: 0,
      25: -12000,
      26: -12000,
      27: -12000,
      28: -12000,
      29: 0,
      30: -12000,
      31: 0,
      32: 0,
      33: -12000,
      34: -12000,
      35: -12000,
      36: -12000,
      37: 0,
      38: -12000,
      39: 0,
      40: 0,
      41: -1,
      42: 0,
      43: 32512,
      44: 32512,
      45: 0,
      46: -1,
      47: -1,
      48: 0,
      49: 0,
      50: 0,
      51: 0,
      52: 0,
      53: -1,
      54: 0,
      55: 0,
      56: 100,
      57: 0,
      58: -1,
      59: 0,
      60: 0,
      ...generator,
    } as Generator));

    // samples
    samples.forEach((sample) => this._samples.set(sample.id, sample));

    // buffers
    samples.forEach((sample) => this._buffers.set(sample.id, buffers.get(sample.id) ?? ((buffer) => (buffers.set(sample.id, buffer), buffer))(new Tone.ToneAudioBuffer(`${baseUrl}${sample.id}.wav`))));
  }

  /**
   * Get the default options.
   */
  static getDefaults(): SamplerOptions {
    const options = super.getDefaults();
    return Object.assign(options, {
      volume: 0,
      generators: [],
      samples: [],
      baseUrl: '',
    });
  }

  /**
   * Trigger the attack.
   */
  triggerAttack(note: Tone.Unit.Frequency, time?: Tone.Unit.Time, velocity: Tone.Unit.NormalRange = 1) {
    // computed time
    const computedTime = this.toSeconds(time);

    // key
    const key = Tone.Frequency(note).toMidi();

    // original velocity
    const vel = velocity * 127;

    // generator
    const generator = this._generators.find(({ 43: keyRange, 44: velRange }) => {
      if ((keyRange & 0x00FF) > key || (keyRange >> 8) < key) {
        return false;
      }

      if ((velRange & 0x00FF) > vel || (velRange >> 8) < vel) {
        return false;
      }

      return true;
    });

    if (!generator) {
      throw Error('The generator not found.');
    }

    // sample
    const sample = this._samples.get(generator[53]);

    if (!sample) {
      throw Error('The sample not found.');
    }

    // buffer
    const buffer = this._buffers.get(generator[53]);

    if (!buffer) {
      throw Error('The buffer not found.');
    }

    // candidate voice
    const candidate = (() => {
      for (const candidate of Sampler._activeVoices.keys()) {
        if (Sampler._activeVoices[candidate] === undefined) {
          return candidate;
        }
      }

      return Sampler._activeVoices.reduce((candidate, voice, i, activeVoices) => {
        if (candidate === -1) {
          return i;
        }

        // priorities
        const [priority, previousPriority] = [
          toPriority(voice),
          toPriority(activeVoices[candidate]),
        ];

        if (priority < previousPriority) {
          return i;
        }

        if (priority - previousPriority === 0 && voice.start < activeVoices[candidate].start) {
          return i;
        }

        return candidate;
      }, -1);
    })();

    if (candidate === -1) {
      throw Error('Too many voices.');
    }

    ((voice = Sampler._activeVoices[candidate]) => {
      if (voice) {
        voice.source.onended(voice.source);
      }
    })();

    // vol env - times
    const [volEnvDelay, volEnvAttack, volEnvHold, volEnvDecay] = [
      computedTime + toSeconds(generator[33]),
      computedTime + toSeconds(generator[33]) + toSeconds(generator[34]),
      computedTime + toSeconds(generator[33]) + toSeconds(generator[34]) + toSeconds(generator[35]) * toSeconds((60 - key) * generator[39]),
      computedTime + toSeconds(generator[33]) + toSeconds(generator[34]) + toSeconds(generator[35]) * toSeconds((60 - key) * generator[39]) + toSeconds(generator[36]) * toSeconds((60 - key) * generator[40]),
    ];

    // mod env - times
    const [modEnvDelay, modEnvAttack, modEnvHold, modEnvDecay] = [
      computedTime + toSeconds(generator[25]),
      computedTime + toSeconds(generator[25]) + toSeconds(generator[26]),
      computedTime + toSeconds(generator[25]) + toSeconds(generator[26]) + toSeconds(generator[27]) * toSeconds((60 - key) * generator[31]),
      computedTime + toSeconds(generator[25]) + toSeconds(generator[26]) + toSeconds(generator[27]) * toSeconds((60 - key) * generator[31]) + toSeconds(generator[28]) * toSeconds((60 - key) * generator[32]),
    ];

    // output
    const output = new Tone.Gain({
      context: this.context,
    });

    // output - base gain, peak gain and sustain gain
    const [outputBaseGain, outputPeakGain, outputSustainGain] = [
      0,
      Tone.dbToGain(2 * Tone.gainToDb(velocity) - .4 * (generator[48] / 10) - .5 * (generator[9] / 10)),
      Tone.dbToGain(2 * Tone.gainToDb(velocity) - .4 * (generator[48] / 10) - .5 * (generator[9] / 10) - (generator[37] / 10)),
    ];

    // output - default value
    output.gain.setValueAtTime(outputBaseGain, computedTime);

    // output - delay
    output.gain.setValueAtTime(outputBaseGain, volEnvDelay);

    // output - attack
    output.gain.linearRampToValueAtTime(outputPeakGain, volEnvAttack);

    // output - hold
    output.gain.linearRampToValueAtTime(outputPeakGain, volEnvHold);

    // output - decay
    output.gain.exponentialRampToValueAtTime(outputSustainGain, volEnvDecay);

    // volume
    const volume = new Tone.Gain({
      context: this.context,
    });

    // volume - default value
    volume.gain.setValueAtTime(Math.pow(this._channel.volume * this._channel.expression, 2), computedTime);

    // panner
    const panner = new Tone.Panner({
      context: this.context,
    });

    // panner - default value
    panner.pan.setValueAtTime(Math.min(Math.max((this._channel.pan - .5) * 2 + generator[17] / 500, -1), 1), computedTime);

    // filter
    const filter = new Tone.BiquadFilter({
      context: this.context,
    });

    // filter - base frequency and peak frequency
    const [filterBaseFreq, filterPeakFreq] = [
      toFrequency(generator[8]),
      toFrequency(generator[8] + generator[11]),
    ];

    // filter - sustain frequency
    const filterSustainFreq = filterBaseFreq + (filterPeakFreq - filterBaseFreq) * toDecayRate(generator[29]);

    // filter - default value
    filter.frequency.setValueAtTime(filterBaseFreq, computedTime);

    // filter - delay
    filter.frequency.setValueAtTime(filterBaseFreq, modEnvDelay);

    // filter - attack
    filter.frequency.linearRampToValueAtTime(filterPeakFreq, Math.max(modEnvAttack, modEnvDelay + this.blockTime * 8));

    // filter - hold
    filter.frequency.linearRampToValueAtTime(filterPeakFreq, modEnvHold);

    // filter - decay
    filter.frequency.linearRampToValueAtTime(filterSustainFreq, modEnvDecay);

    // filter - Q factor
    filter.Q.setValueAtTime(Math.pow(10, generator[9] / 200), computedTime);

    // source - parameters
    const [url, loopStart, loopEnd, loop] = [
      buffer,
      sample.loopPoints[0] / sample.sampleRate,
      sample.loopPoints[1] / sample.sampleRate,
      [1, 3].includes(generator[54]),
    ];

    // source
    const source = new Tone.ToneBufferSource({
      context: this.context,
      url,
      loopStart,
      loopEnd,
      loop,
    });

    // playback rate - base frequency and peak frequency
    const [playbackRateBaseFreq, playbackRatePeakFreq] = [
      toPlaybackRateBaseFrequency(key, generator, sample) * toPlaybackRateFrequency(this._channel.pitchBend * this._channel.pitchBendSensitivity, generator[56]),
      toPlaybackRateBaseFrequency(key, generator, sample) * toPlaybackRateFrequency(this._channel.pitchBend * this._channel.pitchBendSensitivity, generator[56]) * toPlaybackRateFrequency(generator[7] / 100, generator[56]),
    ];

    // playback rate - sustain frequency
    const playbackRateSustainFreq = playbackRateBaseFreq + (playbackRatePeakFreq - playbackRateBaseFreq) * toDecayRate(generator[29]);

    // playback rate - default value
    source.playbackRate.setValueAtTime(playbackRateBaseFreq, computedTime);

    // playback rate - delay
    source.playbackRate.setValueAtTime(playbackRateBaseFreq, modEnvDelay);

    // playback rate - attack
    source.playbackRate.linearRampToValueAtTime(playbackRatePeakFreq, modEnvAttack);

    // playback rate - hold
    source.playbackRate.linearRampToValueAtTime(playbackRatePeakFreq, modEnvHold);

    // playback rate - decay
    source.playbackRate.linearRampToValueAtTime(playbackRateSustainFreq, modEnvDecay);

    // status
    const status = new Tone.Signal({
      context: this.context,
    });

    // status - default value
    status.setValueAtTime(5, computedTime);

    // status - delay
    status.setValueAtTime(4, volEnvDelay);

    // status - attack
    status.setValueAtTime(3, volEnvAttack);

    // status - hold
    status.setValueAtTime(2, volEnvHold);

    // status - decay
    status.setValueAtTime(1, volEnvDecay);

    // connect
    source.chain(filter, panner, volume, output, this.output);

    // start
    source.start(computedTime, 0);

    // voice
    const voice: Voice = {
      sampler: this,
      key,
      start: computedTime,
      generator,
      sample,
      output,
      volume,
      panner,
      filter,
      source,
      status,
    };

    // set voice to active voices
    Sampler._activeVoices.splice(candidate, 1, voice);

    // invoke after the source is done playing
    source.onended = () => {
      // dispose
      status.dispose();
      source.dispose();
      filter.dispose();
      panner.dispose();
      volume.dispose();
      output.dispose();

      // delete voice
      ((i = Sampler._activeVoices.indexOf(voice)) => {
        if (i >= 0) {
          delete Sampler._activeVoices[i];
        }
      })();
    };
  }

  /**
   * Trigger the release.
   */
  triggerRelease(note: Tone.Unit.Frequency, time?: Tone.Unit.Time) {
    // computed time
    const computedTime = this.toSeconds(time);

    // key
    const key = Tone.Frequency(note).toMidi();

    // release
    Sampler._activeVoices.filter((voice) => voice.sampler === this && voice.key === key && !voice.end).forEach((voice) => {
      // set end time
      voice.end = computedTime;

      // release
      if (this._channel.damperPedal <= 63 / 127) {
        this._release(voice, computedTime);
      }
    });
  }

  /**
   * Trigger the attack and release.
   */
  triggerAttackRelease(note: Tone.Unit.Frequency, duration: Tone.Unit.Time, time?: Tone.Unit.Time, velocity: Tone.Unit.NormalRange = 1) {
    // attack time
    time = this.toSeconds(time);

    // attack
    this.triggerAttack(note, time, velocity);

    // release time
    time = time + this.toSeconds(duration);

    // release
    this.triggerRelease(note, time);
  }

  /**
   * Release all currently active voices.
   */
  releaseAll(time?: Tone.Unit.Time) {
    time = this.toSeconds(time);

    Sampler._activeVoices.filter((voice) => voice.sampler === this).forEach((voice) => {
      voice.source.stop(time);
    });
  }

  /**
   * Change the data entry MSB.
   */
  changeDataEntryMsb(dataEntryMsb: Tone.Unit.NormalRange) {
    this._channel.dataEntryMsb = dataEntryMsb;
  }

  /**
   * Change the volume.
   */
  changeVolume(volume: Tone.Unit.NormalRange, time?: Tone.Unit.Time) {
    this._channel.volume = volume;

    // computed time
    const computedTime = this.toSeconds(time);

    Sampler._activeVoices.filter((voice) => voice.sampler === this && voice.status.getValueAtTime(computedTime)).forEach((voice) => {
      voice.volume.gain.setValueAtTime(Math.pow(volume * this._channel.expression, 2), computedTime);
    });
  }

  /**
   * Change the pan.
   */
  changePan(pan: Tone.Unit.NormalRange) {
    this._channel.pan = pan;
  }

  /**
   * Change the expression.
   */
  changeExpression(expression: Tone.Unit.NormalRange, time?: Tone.Unit.Time) {
    this._channel.expression = expression;

    // computed time
    const computedTime = this.toSeconds(time);

    Sampler._activeVoices.filter((voice) => voice.sampler === this && voice.status.getValueAtTime(computedTime)).forEach((voice) => {
      voice.volume.gain.setValueAtTime(Math.pow(this._channel.volume * expression, 2), computedTime);
    });
  }

  /**
   * Change the data entry LSB.
   */
  changeDataEntryLsb(dataEntryLsb: Tone.Unit.NormalRange) {
    this._channel.dataEntryLsb = dataEntryLsb;
  }

  /**
   * Change the damper pedal.
   */
  changeDamperPedal(damperPedal: Tone.Unit.NormalRange, time?: Tone.Unit.Time) {
    this._channel.damperPedal = damperPedal;

    // computed time
    const computedTime = this.toSeconds(time);

    Sampler._activeVoices.filter((voice) => voice.sampler === this && voice.status.getValueAtTime(computedTime)).forEach((voice) => {
      const { end, output, filter, source, status } = voice;

      // computed end time
      const computedEnd = this.toSeconds(end);

      // release
      if (damperPedal <= 63 / 127) {
        this._release(voice, Math.max(computedTime, computedEnd));
      }

      // sustain
      if (damperPedal >= 64 / 127) {
        // cancel parameters
        [output.gain, filter.frequency, source.playbackRate, status].forEach((parameter) => {
          parameter.cancelScheduledValues(computedEnd);
        });

        // cancel stop
        source.cancelStop();
      }
    });
  }

  /**
   * Change the registered parameter number (RPN) LSB.
   */
  changeRpnLsb(rpnLsb: Tone.Unit.NormalRange) {
    this._channel.rpnLsb = rpnLsb;
  }

  /**
   * Change the registered parameter number (RPN) MSB.
   */
  changeRpnMsb(rpnMsb: Tone.Unit.NormalRange) {
    this._channel.rpnMsb = rpnMsb;
  }

  /**
   * Reset all controllers.
   */
  resetAllControllers() {
    this._channel = new Channel();
  }

  /**
   * Change the pitch bend.
   */
  changePitchBend(pitchBend: Tone.Unit.AudioRange, time?: Tone.Unit.Time) {
    this._channel.pitchBend = pitchBend;

    // computed time
    const computedTime = this.toSeconds(time);

    Sampler._activeVoices.filter((voice) => voice.sampler === this && voice.status.getValueAtTime(computedTime)).forEach((voice) => {
      const { key, end, generator, sample, source } = voice;

      // mod env - times
      const [modEnvDelay, modEnvAttack, modEnvHold, modEnvDecay] = [
        computedTime + toSeconds(generator[25]),
        computedTime + toSeconds(generator[25]) + toSeconds(generator[26]),
        computedTime + toSeconds(generator[25]) + toSeconds(generator[26]) + toSeconds(generator[27]) * toSeconds((60 - key) * generator[31]),
        computedTime + toSeconds(generator[25]) + toSeconds(generator[26]) + toSeconds(generator[27]) * toSeconds((60 - key) * generator[31]) + toSeconds(generator[28]) * toSeconds((60 - key) * generator[32]),
      ];

      // playback rate - base frequency and peak frequency
      const [playbackRateBaseFreq, playbackRatePeakFreq] = [
        toPlaybackRateBaseFrequency(key, generator, sample) * toPlaybackRateFrequency(pitchBend * this._channel.pitchBendSensitivity, generator[56]),
        toPlaybackRateBaseFrequency(key, generator, sample) * toPlaybackRateFrequency(pitchBend * this._channel.pitchBendSensitivity, generator[56]) * toPlaybackRateFrequency(generator[7] / 100, generator[56]),
      ];

      // playback rate - sustain frequency
      const playbackRateSustainFreq = playbackRateBaseFreq + (playbackRatePeakFreq - playbackRateBaseFreq) * toDecayRate(generator[29]);

      // playback rate - cancel
      source.playbackRate.cancelScheduledValues(computedTime);

      // playback rate - default value
      source.playbackRate.setValueAtTime(playbackRateBaseFreq, computedTime);

      // playback rate - delay
      source.playbackRate.setValueAtTime(playbackRateBaseFreq, modEnvDelay);

      // playback rate - attack
      source.playbackRate.linearRampToValueAtTime(playbackRatePeakFreq, modEnvAttack);

      // playback rate - hold
      source.playbackRate.linearRampToValueAtTime(playbackRatePeakFreq, modEnvHold);

      // playback rate - decay
      source.playbackRate.linearRampToValueAtTime(playbackRateSustainFreq, modEnvDecay);

      // computed end time
      const computedEnd = this.toSeconds(end);

      // release
      if (this._channel.damperPedal <= 63 / 127) {
        this._release(voice, computedEnd);
      }
    });
  }

  /**
   * Release the voice.
   */
  private _release({ key, generator, sample, output, filter, source, status }: Voice, time?: Tone.Unit.Time) {
    // computed time
    const computedTime = this.toSeconds(time);

    // set ramp point to release time
    [output.gain, filter.frequency, source.playbackRate, status].forEach((parameter) => {
      parameter.setRampPoint(computedTime);
    });

    // output - release time
    const outputRelease = computedTime + toSeconds(generator[38]);

    // output - release
    output.gain.exponentialApproachValueAtTime(0, computedTime, outputRelease - computedTime);

    // filter - base frequency and peak frequency
    const [filterBaseFreq, filterPeakFreq] = [
      toFrequency(generator[8]),
      toFrequency(generator[8] + generator[11]),
    ];

    // filter - release time
    const filterRelease = computedTime + toSeconds(generator[30]) * (filterBaseFreq === filterPeakFreq ? 1 : (this.toFrequency(filter.frequency.getValueAtTime(computedTime)) - filterBaseFreq) / (filterPeakFreq - filterBaseFreq));

    // filter - release
    filter.frequency.linearRampToValueAtTime(filterBaseFreq, filterRelease);

    // playback rate - base frequency and peak frequency
    const [playbackRateBaseFreq, playbackRatePeakFreq] = [
      toPlaybackRateBaseFrequency(key, generator, sample) * toPlaybackRateFrequency(this._channel.pitchBend * this._channel.pitchBendSensitivity, generator[56]),
      toPlaybackRateBaseFrequency(key, generator, sample) * toPlaybackRateFrequency(this._channel.pitchBend * this._channel.pitchBendSensitivity, generator[56]) * toPlaybackRateFrequency(generator[7] / 100, generator[56]),
    ];

    // playback rate - release time
    const playbackRateRelease = computedTime + toSeconds(generator[30]) * (playbackRateBaseFreq === playbackRatePeakFreq ? 1 : (source.playbackRate.getValueAtTime(computedTime) - playbackRateBaseFreq) / (playbackRatePeakFreq - playbackRateBaseFreq));

    // playback rate - release
    source.playbackRate.linearRampToValueAtTime(playbackRateBaseFreq, playbackRateRelease);

    // status - release
    status.setValueAtTime(0, computedTime);

    // stop
    source.stop(outputRelease);
  }
};

/**
 * The stored and loaded buffers.
 */
const buffers: Map<number, Tone.ToneAudioBuffer> = new Map();

/**
 * Convert generator value to seconds.
 */
const toSeconds = (value: number) => {
  return Math.pow(2, value / 1200);
}

/**
 * Convert generator value to frequency.
 */
const toFrequency = (value: number) => {
  if (value < 1500) {
    value = 1500;
  }

  if (value > 13500) {
    value = 13500;
  }

  return toSeconds(value - 6900) * 440;
}

/**
 * Convert generator value to decay rate.
 */
const toDecayRate = (value: number) => {
  return Math.max(1 - value / 1000, 0);
}

/**
 * Convert generator value to playback rate frequency.
 */
const toPlaybackRateFrequency = (value: number, scaleTuning: number) => {
  return Math.pow(Math.pow(2, 1 / 12), value * (scaleTuning / 100));
}

/**
 * Convert generator value to playback rate base frequency.
 */
const toPlaybackRateBaseFrequency = (key: number, { 51: coarseTune, 52: fineTune, 56: scaleTuning, 58: overridingRootKey }: Generator, { originalKey, correction }: Sample) => {
  return toPlaybackRateFrequency(key - (overridingRootKey === -1 ? originalKey : overridingRootKey) + (coarseTune + fineTune / 100) + (correction / 100), scaleTuning);
}

/**
 * Convert voice value to priority.
 */
const toPriority = ({ output: { gain }, status }: Voice) => {
  return gain.value >= .001 ? status.value + gain.value : 0;
}

/**
 * Get a sampler.
 */
export const getSampler = (number: number) => {
  return new Sampler({
    generators: generators[number],
    samples: samples[number],
    baseUrl: '/samples/',
  });
};

/**
 * Clear buffers.
 */
export const clearBuffers = () => {
  // dispose
  buffers.forEach((buffer) => {
    buffer.dispose();
  });

  // clear
  buffers.clear();
};
