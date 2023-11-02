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
  volume?: Tone.Unit.Decibels;

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
   * The base url.
   */
  baseUrl: string;

  /**
   * The sf2 list.
   */
  private _sf2List: Map<number, Sf2> = new Map();

  /**
   * The buffers.
   */
  private _buffers: Map<number, Tone.ToneAudioBuffers> = new Map();

  /**
   * The channels.
   */
  private _channels = [...Array(16)].map(() => new Channel());

  /**
   * The object of all currently playing voices.
   */
  private _activeVoices: Voice[] = Array(32);

  /**
   * @param options The options associated with the sampler.
   */
  constructor(options?: Partial<SamplerOptions>);
  constructor() {
    super(Tone.optionsFromArguments(Sampler.getDefaults(), arguments, [
      //
    ]));

    // options
    const { context, volume, baseUrl } = Tone.optionsFromArguments(Sampler.getDefaults(), arguments, [
      //
    ]);

    // output nodes
    this.output = new Tone.Volume({
      context,
      volume,
    });

    // base url
    this.baseUrl = baseUrl;

    // set bank
    this._channels.forEach((channel, i) => {
      channel.bank = i === 9 ? 128 : 0;
    });
  }

  /**
   * Get the default options.
   */
  static getDefaults(): SamplerOptions {
    const options = super.getDefaults();
    return Object.assign(options, {
      baseUrl: '',
    });
  }

  /**
   * Load the sf2 file.
   */
  async loadSf2(patch: number, bank: number) {
    // preset id
    const presetId = getPresetId(patch, bank);

    // sf2 file name
    const filename = `${this.baseUrl}${presetId.toString(16).padStart(4, '0')}.sf2`;

    // sf2 buffer
    const buffer = await fetch(filename).then((response) => response.arrayBuffer());

    // sf2
    const sf2 = new Sf2(new Uint8Array(buffer));

    // set sf2
    this._sf2List.set(presetId, sf2);

    // buffers
    const buffers = new Tone.ToneAudioBuffers();

    // add audio buffers
    sf2.samples.forEach(({ dataPoints, sampleRate }, i) => {
      // buffer length
      const length = dataPoints[1] - dataPoints[0];

      // create buffer
      const buffer = this.context.createBuffer(1, length, sampleRate);

      // set sample to buffer
      buffer.copyToChannel(sf2.buffers.subarray(...dataPoints), 0);

      // add buffer
      buffers.add(i, buffer);
    });

    // set buffers
    this._buffers.set(presetId, buffers);
  }

  /**
   * Trigger the attack.
   */
  triggerAttack(note: Tone.Unit.Frequency, time?: Tone.Unit.Time, velocity: Tone.Unit.NormalRange = 1, channel: number = 0) {
    // computed time
    const computedTime = this.toSeconds(time);

    // key
    const key = Tone.Frequency(note).toMidi();

    // original velocity
    const vel = velocity * 127;

    // preset id
    const presetId = getPresetId(
      this._channels[channel].patch,
      this._channels[channel].bank,
    );

    // sf2
    const sf2 = this._sf2List.get(presetId);

    if (!sf2) {
      throw Error('The sf2 file not loaded.');
    }

    // generator
    const generator = sf2.getGenerator(
      this._channels[channel].patch,
      this._channels[channel].bank,
      key,
      vel,
    );

    if (!generator) {
      throw Error('The generator not found.');
    }

    // sample
    const sample = sf2.samples[generator[53]];

    if (!sample) {
      throw Error('The sample not found.');
    }

    // buffers
    const buffers = this._buffers.get(presetId);

    if (!buffers) {
      throw Error('The buffers not found.');
    }

    // buffer
    const buffer = buffers.get(generator[53]);

    if (!buffer) {
      throw Error('The buffer not found.');
    }

    // candidate voice
    const candidate = (() => {
      for (const candidate of this._activeVoices.keys()) {
        if (this._activeVoices[candidate] === undefined) {
          continue;
        }

        if (this._activeVoices[candidate].key === key && this._activeVoices[candidate].velocity === velocity && this._activeVoices[candidate].channel === channel && computedTime - this._activeVoices[candidate].start < 1e-3) {
          return candidate;
        }
      }

      for (const candidate of this._activeVoices.keys()) {
        if (this._activeVoices[candidate] === undefined) {
          return candidate;
        }
      }

      return this._activeVoices.reduce((candidate, voice, i, activeVoices) => {
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

    ((voice = this._activeVoices[candidate]) => {
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

    // volume - connect
    volume.connect(output);

    // panner
    const panner = new Tone.Panner({
      context: this.context,
    });

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

    // pitch bend - connect
    pitchBend.connect(playbackRate);

    // status
    const status = new Tone.Signal({
      context: this.context,
    });

    // voice
    const voice: Voice = {
      channel,
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
    this._activeVoices[candidate] = voice;

    // update volume to default value
    this._updateVolumeAtTime(voice, 0, channel);

    // update pan to default value
    this._updatePanAtTime(voice, 0, channel);

    // update pitch bend to default value
    this._updatePitchBendAtTime(voice, 0, channel);

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
      ((i = this._activeVoices.indexOf(voice)) => {
        if (i >= 0) {
          delete this._activeVoices[i];
        }
      })();
    };
  }

  /**
   * Trigger the release.
   */
  triggerRelease(note: Tone.Unit.Frequency, time?: Tone.Unit.Time, channel: number = 0) {
    // computed time
    const computedTime = this.toSeconds(time);

    // key
    const key = Tone.Frequency(note).toMidi();

    // release
    this._activeVoices.filter((voice) => voice.channel === channel && voice.key === key && !voice.end).forEach((voice) => {
      // set end time
      voice.end = computedTime;

      // release
      if (this._channels[channel].damperPedal <= 63 / 127) {
        this._release(voice, computedTime);
      }
    });
  }

  /**
   * Trigger the attack and release.
   */
  triggerAttackRelease(note: Tone.Unit.Frequency, duration: Tone.Unit.Time, time?: Tone.Unit.Time, velocity: Tone.Unit.NormalRange = 1, channel: number = 0) {
    // attack time
    const attackTime = this.toSeconds(time);

    // attack
    this.triggerAttack(note, attackTime, velocity, channel);

    // release time
    const releaseTime = attackTime + this.toSeconds(duration);

    // release
    this.triggerRelease(note, releaseTime, channel);
  }

  /**
   * Release all currently active voices.
   */
  releaseAll(time?: Tone.Unit.Time) {
    // computed time
    const computedTime = this.toSeconds(time);

    this._activeVoices.forEach((voice) => {
      voice.source.stop(computedTime);
    });
  }

  /**
   * Set the control change.
   */
  setControlChange(number: number, value: Tone.Unit.NormalRange, time?: Tone.Unit.Time, channel: number = 0) {
    switch (number) {
      case 0:
        this.changeBank(value, channel);
        break;
      case 6:
        this.changeDataEntryMsb(value, time, channel);
        break;
      case 7:
        this.changeVolume(value, time, channel);
        break;
      case 10:
        this.changePan(value, time, channel);
        break;
      case 11:
        this.changeExpression(value, time, channel);
        break;
      case 38:
        this.changeDataEntryLsb(value, time, channel);
        break;
      case 64:
        this.changeDamperPedal(value, time, channel);
        break;
      case 100:
        this.changeRpnLsb(value, channel);
        break;
      case 101:
        this.changeRpnMsb(value, channel);
        break;
      case 120:
        this.allSoundOff(time, channel);
        break;
      case 121:
        this.resetAllControllers(channel);
        break;
      case 123:
        this.allNotesOff(time, channel);
        break;
    }
  }

  /**
   * Change the bank.
   */
  changeBank(_: number, channel: number = 0) {
    if (channel === 9) {
      this._channels[channel].bank = 128;
    } else {
      this._channels[channel].bank = 0;
    }
  }

  /**
   * Change the data entry MSB.
   */
  changeDataEntryMsb(dataEntryMsb: Tone.Unit.NormalRange, time?: Tone.Unit.Time, channel: number = 0) {
    this._channels[channel].dataEntryMsb = dataEntryMsb;

    // computed time
    const computedTime = this.toSeconds(time);

    this._activeVoices.filter((voice) => voice.channel === channel && voice.status.getValueAtTime(computedTime)).forEach((voice) => {
      this._updatePitchBendAtTime(voice, computedTime, channel);
    });
  }

  /**
   * Change the volume.
   */
  changeVolume(volume: Tone.Unit.NormalRange, time?: Tone.Unit.Time, channel: number = 0) {
    this._channels[channel].volume = volume;

    // computed time
    const computedTime = this.toSeconds(time);

    this._activeVoices.filter((voice) => voice.channel === channel && voice.status.getValueAtTime(computedTime)).forEach((voice) => {
      this._updateVolumeAtTime(voice, computedTime, channel);
    });
  }

  /**
   * Change the pan.
   */
  changePan(pan: Tone.Unit.NormalRange, time?: Tone.Unit.Time, channel: number = 0) {
    this._channels[channel].pan = pan;

    // computed time
    const computedTime = this.toSeconds(time);

    this._activeVoices.filter((voice) => voice.channel === channel && voice.status.getValueAtTime(computedTime)).forEach((voice) => {
      this._updatePanAtTime(voice, computedTime, channel);
    });
  }

  /**
   * Change the expression.
   */
  changeExpression(expression: Tone.Unit.NormalRange, time?: Tone.Unit.Time, channel: number = 0) {
    this._channels[channel].expression = expression;

    // computed time
    const computedTime = this.toSeconds(time);

    this._activeVoices.filter((voice) => voice.channel === channel && voice.status.getValueAtTime(computedTime)).forEach((voice) => {
      this._updateVolumeAtTime(voice, computedTime, channel);
    });
  }

  /**
   * Change the data entry LSB.
   */
  changeDataEntryLsb(dataEntryLsb: Tone.Unit.NormalRange, time?: Tone.Unit.Time, channel: number = 0) {
    this._channels[channel].dataEntryLsb = dataEntryLsb;

    // computed time
    const computedTime = this.toSeconds(time);

    this._activeVoices.filter((voice) => voice.channel === channel && voice.status.getValueAtTime(computedTime)).forEach((voice) => {
      this._updatePitchBendAtTime(voice, computedTime, channel);
    });
  }

  /**
   * Change the damper pedal.
   */
  changeDamperPedal(damperPedal: Tone.Unit.NormalRange, time?: Tone.Unit.Time, channel: number = 0) {
    this._channels[channel].damperPedal = damperPedal;

    // computed time
    const computedTime = this.toSeconds(time);

    this._activeVoices.filter((voice) => voice.channel === channel && voice.status.getValueAtTime(computedTime)).forEach((voice) => {
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
  changeRpnLsb(rpnLsb: Tone.Unit.NormalRange, channel: number = 0) {
    this._channels[channel].rpnLsb = rpnLsb;
  }

  /**
   * Change the registered parameter number (RPN) MSB.
   */
  changeRpnMsb(rpnMsb: Tone.Unit.NormalRange, channel: number = 0) {
    this._channels[channel].rpnMsb = rpnMsb;
  }

  /**
   * All sound off.
   */
  allSoundOff(time?: Tone.Unit.Time, channel: number = 0) {
    // computed time
    const computedTime = this.toSeconds(time);

    this._activeVoices.filter((voice) => voice.channel === channel).forEach((voice) => {
      voice.source.stop(computedTime);
    });
  }

  /**
   * Reset all controllers.
   */
  resetAllControllers(channel: number = 0) {
    Object.assign(this._channels[channel], {
      expression: 1,
      damperPedal: 0,
      rpnLsb: 1,
      rpnMsb: 1,
      pitchBend: 0,
    });
  }

  /**
   * All notes off.
   */
  allNotesOff(time?: Tone.Unit.Time, channel: number = 0) {
    // computed time
    const computedTime = this.toSeconds(time);

    this._activeVoices.filter((voice) => voice.channel === channel).forEach((voice) => {
      if (this._channels[channel].damperPedal <= 63 / 127) {
        this._release(voice, computedTime);
      }
    });
  }

  /**
   * Set the program change.
   */
  setProgramChange(patch: number, channel: number = 0) {
    if (channel === 9) {
      this._channels[channel].patch = 0;
    } else {
      this._channels[channel].patch = patch;
    }
  }

  /**
   * Change the pitch bend.
   */
  changePitchBend(pitchBend: Tone.Unit.AudioRange, time?: Tone.Unit.Time, channel: number = 0) {
    this._channels[channel].pitchBend = pitchBend;

    // computed time
    const computedTime = this.toSeconds(time);

    this._activeVoices.filter((voice) => voice.channel === channel && voice.status.getValueAtTime(computedTime)).forEach((voice) => {
      this._updatePitchBendAtTime(voice, computedTime, channel);
    });
  }

  /**
   * Dispose and disconnect.
   */
  dispose() {
    // release all voices
    this.releaseAll();

    // dispose buffers
    this._buffers.forEach((buffers) => {
      buffers.dispose();
    });

    // dispose
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

  /**
   * Update the volume at time.
   */
  private _updateVolumeAtTime({ volume }: Voice, time?: Tone.Unit.Time, channel: number = 0) {
    // computed time
    const computedTime = this.toSeconds(time);

    // computed volume
    const computedVolume = this._channels[channel].volume * this._channels[channel].expression;

    // update volume at time
    volume.gain.setValueAtTime(Math.pow(computedVolume, 2), computedTime);
  }

  /**
   * Update the pan at time.
   */
  private _updatePanAtTime({ generator, panner }: Voice, time?: Tone.Unit.Time, channel: number = 0) {
    // computed time
    const computedTime = this.toSeconds(time);

    // computed pan
    const computedPan = (this._channels[channel].pan - .5) * 2 + generator[17] / 500;

    // update pan at time
    panner.pan.setValueAtTime(Math.min(Math.max(computedPan, -1), 1), computedTime);
  }

  /**
   * Update the pitch bend at time.
   */
  private _updatePitchBendAtTime({ generator, pitchBend }: Voice, time?: Tone.Unit.Time, channel: number = 0) {
    // computed time
    const computedTime = this.toSeconds(time);

    // computed pitch bend
    const computedPitchBend = this._channels[channel].pitchBend * this._channels[channel].pitchBendSensitivity;

    // update pitch bend at time
    pitchBend.setValueAtTime(toPlaybackRateFrequency(computedPitchBend, generator[56]), computedTime);
  }
}

/**
 * Get the preset id.
 */
const getPresetId = (patch: number, bank: number) => {
  return bank << 8 | patch;
};

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
