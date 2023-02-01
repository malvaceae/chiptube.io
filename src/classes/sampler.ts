// Tone.js
import * as Tone from 'tone';

// Sf2
import { Sf2 } from '@/classes/sf2';

// Generator
import { Generator } from '@/classes/generator';

// Sample
import { Sample } from '@/classes/sample';

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
   * The preset id.
   */
  presetId: number;

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
   * The patch.
   */
  private _patch: number;

  /**
   * The bank.
   */
  private _bank: number;

  /**
   * The sf2.
   */
  private _sf2?: Sf2;

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
  private static _activeVoices: Voice[] = Array(32);

  /**
   * @param options The options associated with the sampler.
   */
  constructor(options?: Partial<SamplerOptions>);
  constructor() {
    super(Tone.optionsFromArguments(Sampler.getDefaults(), arguments, [
      //
    ]));

    // options
    const { context, volume, presetId, baseUrl } = Tone.optionsFromArguments(Sampler.getDefaults(), arguments, [
      //
    ]);

    // output nodes
    this.output = new Tone.Volume({
      context,
      volume,
    });

    // patch and bank
    [this._patch, this._bank] = [
      (presetId & 0x00FF) >> 0,
      (presetId & 0xFF00) >> 8,
    ];

    // sf2 file
    const sf2File = `${baseUrl}${presetId.toString(16).padStart(4, '0')}.sf2`;

    // download and parse sf2 file
    const done = fetch(sf2File).then((response) => response.arrayBuffer()).then((buffer) => {
      // sf2
      const sf2 = this._sf2 = new Sf2(new Uint8Array(buffer));

      // buffers
      sf2.samples.forEach(({ dataPoints, sampleRate }, i) => {
        // create buffer
        const buffer = context.createBuffer(1, dataPoints[1] - dataPoints[0], sampleRate);

        // set sample to buffer
        buffer.copyToChannel(sf2.getSampleBuffer(...dataPoints), 0);

        // set buffer to buffers
        this._buffers.set(i, new Tone.ToneAudioBuffer(buffer));
      });
    });

    // wait for sf2 file to download and parse
    Tone.ToneAudioBuffer.downloads.push(done);

    // delete resolved promise
    done.finally((i = Tone.ToneAudioBuffer.downloads.indexOf(done)) => {
      Tone.ToneAudioBuffer.downloads.splice(i, 1);
    });
  }

  /**
   * Get the default options.
   */
  static getDefaults(): SamplerOptions {
    const options = super.getDefaults();
    return Object.assign(options, {
      volume: 0,
      presetId: 0,
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

    if (!this._sf2) {
      throw Error('The sf2 file not loaded.');
    }

    // generator
    const generator = this._sf2.getGenerator(this._patch, this._bank, key, vel);

    if (!generator) {
      throw Error('The generator not found.');
    }

    // sample
    const sample = this._sf2.samples[generator[53]];

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
          toPriority(computedTime, voice),
          toPriority(computedTime, activeVoices[candidate]),
        ];

        if (priority < previousPriority) {
          return i;
        }

        if (priority - previousPriority < 1e-3 && previousPriority - priority < 1e-3 && voice.start < activeVoices[candidate].start) {
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
        voice.source.stop(computedTime);
      }
    })();

    // output
    const output = new Tone.Gain({
      context: this.context,
    });

    // output - connect
    output.connect(this.output);

    // volume
    const volume = new Tone.Gain({
      context: this.context,
    });

    // volume - default value
    volume.gain.setValueAtTime(Math.pow(this._channel.volume * this._channel.expression, 2), 0);

    // volume - connect
    volume.connect(output);

    // panner
    const panner = new Tone.Panner({
      context: this.context,
    });

    // panner - default value
    panner.pan.setValueAtTime(Math.min(Math.max((this._channel.pan - .5) * 2 + generator[17] / 500, -1), 1), 0);

    // panner - connect
    panner.connect(volume);

    // filter
    const filter = new Tone.BiquadFilter({
      context: this.context,
      Q: Math.pow(10, generator[9] / 200),
    });

    // filter - connect
    filter.connect(panner);

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

    // source - connect
    source.connect(filter);

    // playback rate
    const playbackRate = new Tone.Multiply({
      context: this.context,
    });

    // playback rate - connect
    playbackRate.connect(source.playbackRate);

    // pitch bend
    const pitchBend = new Tone.Signal({
      context: this.context,
    });

    // pitch bend - default value
    pitchBend.setValueAtTime(toPlaybackRateFrequency(this._channel.pitchBend * this._channel.pitchBendSensitivity, generator[56]), 0);

    // pitch bend - connect
    pitchBend.connect(playbackRate);

    // status
    const status = new Tone.Signal({
      context: this.context,
    });

    // voice
    const voice: Voice = {
      sampler: this,
      key,
      velocity,
      start: computedTime,
      generator,
      sample,
      output,
      volume,
      panner,
      filter,
      source,
      playbackRate,
      pitchBend,
      status,
    };

    // set voice to active voices
    Sampler._activeVoices[candidate] = voice;

    // attack
    this._attack(voice, computedTime);

    // start
    source.start(computedTime, 0);

    // invoke after the source is done playing
    source.onended = () => {
      // dispose
      status.dispose();
      pitchBend.dispose();
      playbackRate.dispose();
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
    this.allNotesOff(time);
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
  changePan(pan: Tone.Unit.NormalRange, time?: Tone.Unit.Time) {
    this._channel.pan = pan;

    // computed time
    const computedTime = this.toSeconds(time);

    Sampler._activeVoices.filter((voice) => voice.sampler === this && voice.status.getValueAtTime(computedTime)).forEach((voice) => {
      voice.panner.pan.setValueAtTime(Math.min(Math.max((pan - .5) * 2 + voice.generator[17] / 500, -1), 1), computedTime);
    });
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
      const { start, end } = voice;

      // computed end time
      const computedEnd = this.toSeconds(end);

      // release
      if (damperPedal <= 63 / 127) {
        this._release(voice, Math.max(computedTime, computedEnd));
      }

      // sustain
      if (damperPedal >= 64 / 127) {
        this._attack(voice, start);
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
   * All sound off.
   */
  allSoundOff(time?: Tone.Unit.Time) {
    // computed time
    const computedTime = this.toSeconds(time);

    Sampler._activeVoices.filter((voice) => voice.sampler === this).forEach((voice) => {
      voice.source.stop(computedTime);
    });
  }

  /**
   * Reset all controllers.
   */
  resetAllControllers() {
    this._channel = new Channel();
  }

  /**
   * All notes off.
   */
  allNotesOff(time?: Tone.Unit.Time) {
    // computed time
    const computedTime = this.toSeconds(time);

    Sampler._activeVoices.filter((voice) => voice.sampler === this).forEach((voice) => {
      if (this._channel.damperPedal <= 63 / 127) {
        this._release(voice, computedTime);
      }
    });
  }

  /**
   * Change the pitch bend.
   */
  changePitchBend(pitchBend: Tone.Unit.AudioRange, time?: Tone.Unit.Time) {
    this._channel.pitchBend = pitchBend;

    // computed time
    const computedTime = this.toSeconds(time);

    Sampler._activeVoices.filter((voice) => voice.sampler === this && voice.status.getValueAtTime(computedTime)).forEach(({ generator, pitchBend }) => {
      pitchBend.setValueAtTime(toPlaybackRateFrequency(this._channel.pitchBend * this._channel.pitchBendSensitivity, generator[56]), computedTime);
    });
  }

  /**
   * Dispose and disconnect.
   */
  dispose() {
    this.allSoundOff();
    super.dispose();
    return this;
  }

  /**
   * Attack the voice.
   */
  private _attack({ key, velocity, generator, sample, output, filter, source, playbackRate, status }: Voice, time?: Tone.Unit.Time) {
    // computed time
    const computedTime = this.toSeconds(time);

    // cancel parameters
    [output.gain, filter.frequency, playbackRate, status].forEach((parameter) => {
      parameter.cancelScheduledValues(0);
    });

    // cancel stop
    if (source.state === 'started') {
      source.cancelStop();
    }

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

    // output - base gain, peak gain and sustain gain
    const [outputBaseGain, outputPeakGain, outputSustainGain] = [
      0,
      Tone.dbToGain(2 * Tone.gainToDb(velocity) - .4 * (generator[48] / 10) - .5 * (generator[9] / 10)),
      Tone.dbToGain(2 * Tone.gainToDb(velocity) - .4 * (generator[48] / 10) - .5 * (generator[9] / 10) - (generator[37] / 10)),
    ];

    // output - default value
    output.gain.setValueAtTime(outputBaseGain, 0);

    // output - delay
    output.gain.setValueAtTime(outputBaseGain, volEnvDelay);

    // output - attack
    output.gain.linearRampToValueAtTime(outputPeakGain, volEnvAttack);

    // output - hold
    output.gain.linearRampToValueAtTime(outputPeakGain, volEnvHold);

    // output - decay
    output.gain.setValueCurveAtTime(calcExponentialCurve(32).map((value) => {
      return Math.max(outputPeakGain * value, outputSustainGain);
    }), volEnvHold, volEnvDecay - volEnvHold);

    // filter - base frequency and peak frequency
    const [filterBaseFreq, filterPeakFreq] = [
      toFrequency(generator[8]),
      toFrequency(generator[8] + generator[11]),
    ];

    // filter - sustain frequency
    const filterSustainFreq = filterBaseFreq + (filterPeakFreq - filterBaseFreq) * toDecayRate(generator[29]);

    // filter - default value
    filter.frequency.setValueAtTime(filterBaseFreq, 0);

    // filter - delay
    filter.frequency.setValueAtTime(filterBaseFreq, modEnvDelay);

    // filter - attack
    filter.frequency.linearRampToValueAtTime(filterPeakFreq, modEnvAttack);

    // filter - hold
    filter.frequency.linearRampToValueAtTime(filterPeakFreq, modEnvHold);

    // filter - decay
    filter.frequency.linearRampToValueAtTime(filterSustainFreq, modEnvDecay);

    // playback rate - base frequency and peak frequency
    const [playbackRateBaseFreq, playbackRatePeakFreq] = [
      toPlaybackRateBaseFrequency(key, generator, sample),
      toPlaybackRateBaseFrequency(key, generator, sample) * toPlaybackRateFrequency(generator[7] / 100, generator[56]),
    ];

    // playback rate - sustain frequency
    const playbackRateSustainFreq = playbackRateBaseFreq + (playbackRatePeakFreq - playbackRateBaseFreq) * toDecayRate(generator[29]);

    // playback rate - default value
    playbackRate.setValueAtTime(playbackRateBaseFreq, 0);

    // playback rate - delay
    playbackRate.setValueAtTime(playbackRateBaseFreq, modEnvDelay);

    // playback rate - attack
    playbackRate.linearRampToValueAtTime(playbackRatePeakFreq, modEnvAttack);

    // playback rate - hold
    playbackRate.linearRampToValueAtTime(playbackRatePeakFreq, modEnvHold);

    // playback rate - decay
    playbackRate.linearRampToValueAtTime(playbackRateSustainFreq, modEnvDecay);

    // status - default value
    status.setValueAtTime(5, 0);

    // status - delay
    status.setValueAtTime(4, volEnvDelay);

    // status - attack
    status.setValueAtTime(3, volEnvAttack);

    // status - hold
    status.setValueAtTime(2, volEnvHold);

    // status - decay
    status.setValueAtTime(1, volEnvDecay);
  }

  /**
   * Release the voice.
   */
  private _release({ key, generator, sample, output, filter, source, playbackRate, status }: Voice, time?: Tone.Unit.Time) {
    // computed time
    const computedTime = this.toSeconds(time);

    // set ramp point to release time
    [output.gain, filter.frequency, playbackRate, status].forEach((parameter) => {
      parameter.setRampPoint(computedTime);
    });

    // output - release time
    const outputRelease = computedTime + toSeconds(generator[38]);

    // output - release
    output.gain.setValueCurveAtTime(calcExponentialCurve(32).map((value) => {
      return value * output.gain.getValueAtTime(computedTime);
    }), computedTime, outputRelease - computedTime);

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
      toPlaybackRateBaseFrequency(key, generator, sample),
      toPlaybackRateBaseFrequency(key, generator, sample) * toPlaybackRateFrequency(generator[7] / 100, generator[56]),
    ];

    // playback rate - release time
    const playbackRateRelease = computedTime + toSeconds(generator[30]) * (playbackRateBaseFreq === playbackRatePeakFreq ? 1 : (playbackRate.getValueAtTime(computedTime) - playbackRateBaseFreq) / (playbackRatePeakFreq - playbackRateBaseFreq));

    // playback rate - release
    playbackRate.linearRampToValueAtTime(playbackRateBaseFreq, playbackRateRelease);

    // status - release
    status.setValueAtTime(0, computedTime);

    // stop
    source.stop(outputRelease);
  }
}

/**
 * Convert generator value to seconds.
 */
const toSeconds = (value: number) => {
  return Math.pow(2, value / 1200);
};

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
};

/**
 * Convert generator value to decay rate.
 */
const toDecayRate = (value: number) => {
  return Math.max(1 - value / 1000, 0);
};

/**
 * Convert generator value to playback rate frequency.
 */
const toPlaybackRateFrequency = (value: number, scaleTuning: number) => {
  return Math.pow(Math.pow(2, 1 / 12), value * (scaleTuning / 100));
};

/**
 * Convert generator value to playback rate base frequency.
 */
const toPlaybackRateBaseFrequency = (key: number, { 51: coarseTune, 52: fineTune, 56: scaleTuning, 58: overridingRootKey }: Generator, { originalKey, correction }: Sample) => {
  return toPlaybackRateFrequency(key - (overridingRootKey === -1 ? originalKey : overridingRootKey) + (coarseTune + fineTune / 100) + (correction / 100), scaleTuning);
};

/**
 * Convert voice value to priority.
 */
const toPriority = (time: Tone.Unit.Time, { output, status }: Voice) => {
  return status.getValueAtTime(time) + output.gain.getValueAtTime(time);
};

/**
 * Calculate exponential curve.
 */
const calcExponentialCurve = (length: number) => {
  return [...Array(length).keys()].map((i) => {
    return Math.exp(-9.226 * i / (length - 1));
  });
};

/**
 * Get a sampler.
 */
export const getSampler = (patch: number, bank: number, baseUrl = '/samples/') => {
  const presetId = bank << 8 | patch;
  return new Sampler({
    presetId,
    baseUrl,
  });
};
