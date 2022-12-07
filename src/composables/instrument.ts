// Tone.js
import * as Tone from 'tone';

// Sampler Name
export type SamplerName =
  | 'bass-electric'
  | 'guitar-acoustic'
  | 'guitar-electric'
  | 'guitar-nylon'
  | 'harp'
  | 'oboe'
  | 'percussion'
  | 'piano'
  | 'trumpet';

// Synth Name
export type SynthName =
  | 'bass'
  | 'pulse'
  | 'stringed'
  | 'wind';

export const useInstrument = () => {
  // get instrument
  const getInstrument = (number: number, percussion: boolean) => {
    // percussion instruments
    if (percussion) {
      return getSampler('percussion');
    }

    // piano
    if (number >= 0 && number <= 7) {
      return getSampler('piano');
    }

    // acoustic guitar (nylon)
    if (number === 24) {
      return getSampler('guitar-nylon');
    }

    // acoustic guitar (steel)
    if (number === 25) {
      return getSampler('guitar-acoustic');
    }

    // electric guitar
    if (number >= 26 && number <= 31) {
      return getSampler('guitar-electric');
    }

    // triangle synths (bass instruments)
    if (number === 32) {
      return getSynth('bass');
    }

    // electric bass
    if (number === 33 || number === 34) {
      return getSampler('bass-electric');
    }

    // triangle synths (bass instruments)
    if (number >= 35 && number <= 39) {
      return getSynth('bass');
    }

    // sawtooth synths (stringed instruments)
    if (number >= 40 && number <= 45) {
      return getSynth('stringed');
    }

    // harp
    if (number === 46) {
      return getSampler('harp');
    }

    // sawtooth synths (stringed instruments)
    if (number >= 47 && number <= 55) {
      return getSynth('stringed');
    }

    // trumpet
    if (number === 56) {
      return getSampler('trumpet');
    }

    // square synths (wind instruments)
    if (number >= 57 && number <= 67) {
      return getSynth('wind');
    }

    // oboe
    if (number === 68) {
      return getSampler('oboe');
    }

    // square synths (wind instruments)
    if (number >= 69 && number <= 80) {
      return getSynth('wind');
    }

    // sawtooth synths (stringed instruments)
    if (number === 81) {
      return getSynth('stringed');
    }

    // pulse synths for all else
    return getSynth('pulse');
  };

  // get sampler
  const getSampler = ((cache: { [name in SamplerName]?: Tone.Sampler } = {}) => (name: SamplerName) => {
    return cache[name] ??= (() => {
      switch (name) {
        case 'bass-electric':
          // electric bass
          return new Tone.Sampler({
            urls: {
              'C#1': 'Cs1.mp3',
              'E1': 'E1.mp3',
              'G1': 'G1.mp3',
              'A#1': 'As1.mp3',
              'C#2': 'Cs2.mp3',
              'E2': 'E2.mp3',
              'G2': 'G2.mp3',
              'A#2': 'As2.mp3',
              'C#3': 'Cs3.mp3',
              'E3': 'E3.mp3',
              'G3': 'G3.mp3',
              'A#3': 'As3.mp3',
              'C#4': 'Cs4.mp3',
              'E4': 'E4.mp3',
              'G4': 'G4.mp3',
              'A#4': 'As4.mp3',
            },
            baseUrl: `/samples/${name}/`,
            release: 2,
          });
        case 'guitar-acoustic':
          // acoustic guitar (steel)
          return new Tone.Sampler({
            urls: {
              'E2': 'E2.mp3',
              'G2': 'G2.mp3',
              'B2': 'B2.mp3',
              'F3': 'F3.mp3',
              'G#3': 'Gs3.mp3',
              'C4': 'C4.mp3',
              'F4': 'F4.mp3',
              'A4': 'A4.mp3',
              'C#5': 'Cs5.mp3',
              'D5': 'D5.mp3',
            },
            baseUrl: `/samples/${name}/`,
            release: 2,
          });
        case 'guitar-electric':
          // electric guitar
          return new Tone.Sampler({
            urls: {
              'C#2': 'Cs2.mp3',
              'F#2': 'Fs2.mp3',
              'A2': 'A2.mp3',
              'C3': 'C3.mp3',
              'D#3': 'Ds3.mp3',
              'F#4': 'Fs4.mp3',
              'A4': 'A4.mp3',
              'C5': 'C5.mp3',
              'D#5': 'Ds5.mp3',
            },
            baseUrl: `/samples/${name}/`,
            release: 2,
          });
        case 'guitar-nylon':
          // acoustic guitar (nylon)
          return new Tone.Sampler({
            urls: {
              'B1': 'B1.mp3',
              'F#2': 'Fs2.mp3',
              'G#2': 'Gs2.mp3',
              'C#3': 'Cs3.mp3',
              'D3': 'D3.mp3',
              'E3': 'E3.mp3',
              'G3': 'G3.mp3',
              'A3': 'A3.mp3',
              'B3': 'B3.mp3',
              'D#4': 'Ds4.mp3',
              'F#4': 'Fs4.mp3',
              'C#5': 'Cs5.mp3',
              'E5': 'E5.mp3',
              'G#5': 'Gs5.mp3',
              'A5': 'A5.mp3',
            },
            baseUrl: `/samples/${name}/`,
            release: 2,
          });
        case 'harp':
          // harp
          return new Tone.Sampler({
            urls: {
              'G1': 'G1.mp3',
              'B1': 'B1.mp3',
              'F2': 'F2.mp3',
              'C3': 'C3.mp3',
              'E3': 'E3.mp3',
              'D4': 'D4.mp3',
              'A4': 'A4.mp3',
              'C5': 'C5.mp3',
              'G5': 'G5.mp3',
              'B5': 'B5.mp3',
              'F6': 'F6.mp3',
              'D7': 'D7.mp3',
            },
            baseUrl: `/samples/${name}/`,
            release: 2,
          });
        case 'oboe':
          // oboe
          return new Tone.Sampler({
            urls: {
              'F3': 'F3.mp3',
              'A3': 'A3.mp3',
              'C4': 'C4.mp3',
              'D#4': 'Ds4.mp3',
              'F4': 'F4.mp3',
              'G4': 'G4.mp3',
              'A#4': 'As4.mp3',
              'D5': 'D5.mp3',
              'F5': 'F5.mp3',
              'A5': 'A5.mp3',
              'C6': 'C6.mp3',
            },
            baseUrl: `/samples/${name}/`,
            release: 2,
          });
        case 'percussion':
          // percussion instruments
          return new Tone.Sampler({
            urls: {
              'D#1': 'Ds1.mp3',
              'E1': 'E1.mp3',
              'F1': 'F1.mp3',
              'F#1': 'Fs1.mp3',
              'G1': 'G1.mp3',
              'A#1': 'As1.mp3',
              'B1': 'B1.mp3',
              'C2': 'C2.mp3',
              'C#2': 'Cs2.mp3',
              'D2': 'D2.mp3',
              'D#2': 'Ds2.mp3',
              'E2': 'E2.mp3',
              'F2': 'F2.mp3',
              'F#2': 'Fs2.mp3',
              'G2': 'G2.mp3',
              'G#2': 'Gs2.mp3',
              'A2': 'A2.mp3',
              'A#2': 'As2.mp3',
              'B2': 'B2.mp3',
              'C3': 'C3.mp3',
              'C#3': 'Cs3.mp3',
              'D3': 'D3.mp3',
              'D#3': 'Ds3.mp3',
              'E3': 'E3.mp3',
              'F3': 'F3.mp3',
              'F#3': 'Fs3.mp3',
              'G3': 'G3.mp3',
              'G#3': 'Gs3.mp3',
              'A3': 'A3.mp3',
              'A#3': 'As3.mp3',
              'B3': 'B3.mp3',
              'C4': 'C4.mp3',
              'C#4': 'Cs4.mp3',
              'D#4': 'Ds4.mp3',
              'E4': 'E4.mp3',
              'F4': 'F4.mp3',
              'F#4': 'Fs4.mp3',
              'G4': 'G4.mp3',
              'G#4': 'Gs4.mp3',
              'A4': 'A4.mp3',
              'A#4': 'As4.mp3',
              'B4': 'B4.mp3',
              'C5': 'C5.mp3',
              'D5': 'D5.mp3',
              'D#5': 'Ds5.mp3',
            },
            baseUrl: `/samples/${name}/`,
            release: 2,
          });
        case 'piano':
          // piano
          return new Tone.Sampler({
            urls: {
              'D1': 'D1.mp3',
              'G#1': 'Gs1.mp3',
              'C#2': 'Cs2.mp3',
              'G2': 'G2.mp3',
              'C3': 'C3.mp3',
              'F#3': 'Fs3.mp3',
              'F4': 'F4.mp3',
              'B4': 'B4.mp3',
              'E5': 'E5.mp3',
              'A#5': 'As5.mp3',
              'D#6': 'Ds6.mp3',
              'A6': 'A6.mp3',
              'D#7': 'Ds7.mp3',
              'A7': 'A7.mp3',
            },
            baseUrl: `/samples/${name}/`,
            release: 2,
          });
        case 'trumpet':
          // trumpet
          return new Tone.Sampler({
            urls: {
              'F3': 'F3.mp3',
              'A3': 'A3.mp3',
              'C4': 'C4.mp3',
              'D#4': 'Ds4.mp3',
              'F4': 'F4.mp3',
              'G4': 'G4.mp3',
              'A#4': 'As4.mp3',
              'D5': 'D5.mp3',
              'F5': 'F5.mp3',
              'A5': 'A5.mp3',
              'C6': 'C6.mp3',
            },
            baseUrl: `/samples/${name}/`,
            release: 2,
          });
      }
    })();
  })();

  // get synth
  const getSynth = (name: SynthName, volume = -5) => {
    switch (name) {
      case 'bass':
        // triangle synths (bass instruments)
        return new Tone.PolySynth(Tone.Synth, {
          volume,
          oscillator: {
            type: 'triangle',
          },
          envelope: {
            attack: .01,
            decay: .5,
            sustain: .5,
            release: .7,
          },
        });
      case 'pulse':
        // pulse synths
        return new Tone.PolySynth(Tone.Synth, {
          volume,
          oscillator: {
            type: 'pulse',
          },
          envelope: {
            attack: .001,
            decay: .1,
            sustain: .3,
            release: .7,
          },
        });
      case 'stringed':
        // sawtooth synths (stringed instruments)
        return new Tone.PolySynth(Tone.Synth, {
          volume,
          oscillator: {
            type: 'sawtooth',
          },
          envelope: {
            attack: .05,
            decay: .5,
            sustain: .5,
            release: .7,
          },
        });
      case 'wind':
        // square synths (wind instruments)
        return new Tone.PolySynth(Tone.Synth, {
          volume,
          oscillator: {
            type: 'square',
          },
          envelope: {
            attack: .001,
            decay: .3,
            sustain: .3,
            release: .7,
          },
        });
    }
  };

  return {
    getInstrument,
    getSampler,
    getSynth,
  };
};
