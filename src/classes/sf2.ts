// Generator
import { Generator } from '@/classes/generator';

// Preset
import { Preset } from '@/classes/preset';

// Instrument
import { Instrument } from '@/classes/instrument';

// Sample
import { Sample } from '@/classes/sample';

/**
 * Sf2
 */
export class Sf2 {
  /**
   * The presets.
   */
  readonly presets: Preset[];

  /**
   * The instruments.
   */
  readonly instruments: Instrument[];

  /**
   * The samples.
   */
  readonly samples: Sample[];

  /**
   * The buffers.
   */
  readonly buffers: Float32Array;

  /**
   * @param sf2 The sf2 buffer.
   */
  constructor(sf2: Uint8Array) {
    // chunks
    const {
      smpl,
      phdr,
      pbag,
      pmod,
      pgen,
      inst,
      ibag,
      imod,
      igen,
      shdr,
    } = splitRiffToChunks(sf2);

    // buffers
    this.buffers = new Float32Array(new Int16Array(smpl.buffer, smpl.byteOffset, smpl.length / 2)).map((smpl) => {
      return smpl < 0 ? smpl / 0x8000 : smpl / 0x7FFF;
    });

    // phdr chunks
    const phdrChunks = [...Array(phdr.length / 38)].map((_, i) => {
      return phdr.subarray(i * 38, i * 38 + 38);
    });

    // pbag chunks
    const pbagChunks = [...Array(pbag.length / 4)].map((_, i) => {
      return pbag.subarray(i * 4, i * 4 + 4);
    });

    // pmod chunks
    const pmodChunks = [...Array(pmod.length / 10)].map((_, i) => {
      return pmod.subarray(i * 10, i * 10 + 10);
    });

    // pgen chunks
    const pgenChunks = [...Array(pgen.length / 4)].map((_, i) => {
      return pgen.subarray(i * 4, i * 4 + 4);
    });

    // inst chunks
    const instChunks = [...Array(inst.length / 22)].map((_, i) => {
      return inst.subarray(i * 22, i * 22 + 22);
    });

    // ibag chunks
    const ibagChunks = [...Array(ibag.length / 4)].map((_, i) => {
      return ibag.subarray(i * 4, i * 4 + 4);
    });

    // imod chunks
    const imodChunks = [...Array(imod.length / 10)].map((_, i) => {
      return imod.subarray(i * 10, i * 10 + 10);
    });

    // igen chunks
    const igenChunks = [...Array(igen.length / 4)].map((_, i) => {
      return igen.subarray(i * 4, i * 4 + 4);
    });

    // shdr chunks
    const shdrChunks = [...Array(shdr.length / 46)].map((_, i) => {
      return shdr.subarray(i * 46, i * 46 + 46);
    });

    // presets
    this.presets = phdrChunks.slice(0, -1).map((phdr, i) => {
      // pbag points
      const pbagPoints = [
        getWord(phdrChunks[i + 0], 24),
        getWord(phdrChunks[i + 1], 24),
      ];

      // zones
      const zones = pbagChunks.slice(...pbagPoints).map((_, i) => {
        // pgen points
        const pgenPoints = [
          getWord(pbagChunks[pbagPoints[0] + i + 0], 0),
          getWord(pbagChunks[pbagPoints[0] + i + 1], 0),
        ];

        // pmod points
        const pmodPoints = [
          getWord(pbagChunks[pbagPoints[0] + i + 0], 2),
          getWord(pbagChunks[pbagPoints[0] + i + 1], 2),
        ];

        // generator
        const generator = Object.fromEntries(pgenChunks.slice(...pgenPoints).map((pgen) => {
          return [getWord(pgen, 0), getShort(pgen, 2)];
        }));

        // modulator
        const modulator = Object.fromEntries(pmodChunks.slice(...pmodPoints).map((pmod) => {
          return [getWord(pmod, 2), [
            getWord(pmod, 0),
            getWord(pmod, 2),
            getShort(pmod, 4),
            getWord(pmod, 6),
            getWord(pmod, 8),
          ]];
        }));

        return {
          generator,
          modulator,
        };
      });

      // global zone
      const globalZone = zones.find(({ generator }) => {
        return typeof generator[41] === 'undefined';
      });

      if (globalZone) {
        zones.splice(zones.indexOf(globalZone), 1);
      }

      return {
        name: toString(phdr.subarray(0, phdr.indexOf(0))),
        patch: getWord(phdr, 20),
        bank: getWord(phdr, 22),
        globalZone,
        zones,
      };
    });

    // instruments
    this.instruments = instChunks.slice(0, -1).map((inst, i) => {
      // ibag points
      const ibagPoints = [
        getWord(instChunks[i + 0], 20),
        getWord(instChunks[i + 1], 20),
      ];

      // zones
      const zones = ibagChunks.slice(...ibagPoints).map((_, i) => {
        // igen points
        const igenPoints = [
          getWord(ibagChunks[ibagPoints[0] + i + 0], 0),
          getWord(ibagChunks[ibagPoints[0] + i + 1], 0),
        ];

        // imod points
        const imodPoints = [
          getWord(ibagChunks[ibagPoints[0] + i + 0], 2),
          getWord(ibagChunks[ibagPoints[0] + i + 1], 2),
        ];

        // generator
        const generator = Object.fromEntries(igenChunks.slice(...igenPoints).map((igen) => {
          return [getWord(igen, 0), getShort(igen, 2)];
        }));

        // modulator
        const modulator = Object.fromEntries(imodChunks.slice(...imodPoints).map((imod) => {
          return [getWord(imod, 2), [
            getWord(imod, 0),
            getWord(imod, 2),
            getShort(imod, 4),
            getWord(imod, 6),
            getWord(imod, 8),
          ]];
        }));

        return {
          generator,
          modulator,
        };
      });

      // global zone
      const globalZone = zones.find(({ generator }) => {
        return typeof generator[53] === 'undefined';
      });

      if (globalZone) {
        zones.splice(zones.indexOf(globalZone), 1);
      }

      return {
        name: toString(inst.subarray(0, inst.indexOf(0))),
        globalZone,
        zones,
      };
    });

    // samples
    this.samples = shdrChunks.slice(0, -1).map((shdr) => ({
      name: toString(shdr.subarray(0, shdr.indexOf(0))),
      dataPoints: [
        getDword(shdr, 20),
        getDword(shdr, 24),
      ],
      loopPoints: [
        getDword(shdr, 28) - getDword(shdr, 20),
        getDword(shdr, 32) - getDword(shdr, 20),
      ],
      sampleRate: getDword(shdr, 36),
      originalKey: getByte(shdr, 40),
      correction: getChar(shdr, 41),
      link: getWord(shdr, 42),
      type: getWord(shdr, 44),
    }));
  }

  /**
   * Get the generator.
   */
  getGenerator(patch: number, bank: number, key: number, vel: number) {
    // preset
    const preset = this.presets.find((preset) => preset.patch === patch && preset.bank === bank);

    if (!preset) {
      return null;
    }

    // preset zone
    const presetZone = preset.zones.find(({ generator: { 43: keyRange, 44: velRange } }) => {
      keyRange ??= 0x7F00;
      velRange ??= 0x7F00;

      if ((keyRange & 0x00FF) > key || (keyRange >> 8) < key) {
        return false;
      }

      if ((velRange & 0x00FF) > vel || (velRange >> 8) < vel) {
        return false;
      }

      return true;
    });

    if (!presetZone) {
      return null;
    }

    // instrument
    const instrument = this.instruments.find((_, i) => {
      return i === presetZone.generator[41];
    });

    if (!instrument) {
      return null;
    }

    // instrument zone
    const instrumentZone = instrument.zones.find(({ generator: { 43: keyRange, 44: velRange } }) => {
      keyRange ??= 0x7F00;
      velRange ??= 0x7F00;

      if ((keyRange & 0x00FF) > key || (keyRange >> 8) < key) {
        return false;
      }

      if ((velRange & 0x00FF) > vel || (velRange >> 8) < vel) {
        return false;
      }

      return true;
    });

    if (!instrumentZone) {
      return null;
    }

    // generator
    const generator: Generator = {
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
      43: 0x7F00,
      44: 0x7F00,
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
    };

    // apply instrument generator
    Object.assign(generator, instrument.globalZone?.generator, instrumentZone.generator);

    // apply preset generator
    Object.keys(generator).map((key) => Number(key) as keyof typeof generator).forEach((key) => {
      generator[key] += presetZone.generator[key] ?? preset.globalZone?.generator?.[key] ?? 0;
    });

    return generator;
  }
}

/**
 * Split riff file to chunks.
 */
const splitRiffToChunks = (riff: Uint8Array) => {
  const chunks: Record<string, Uint8Array> = {};

  for (let i = 0; i <= (riff.length - 8); i += 8) {
    const id = toString(riff.subarray(i, i + 4));

    if (id === 'RIFF') {
      i += 4;
      continue;
    }

    if (id === 'LIST') {
      i += 4;
      continue;
    }

    // get subchunk
    chunks[id] = riff.subarray(i + 8, i + 8 + getDword(riff, i + 4));

    // add subchunk length
    i += chunks[id].length;
  }

  return chunks;
};

/**
 * Convert bytes to string.
 */
const toString = (input: BufferSource) => {
  return new TextDecoder().decode(input);
};

/**
 * Get signed 8-bit integer.
 */
const getChar = ({ buffer, byteOffset, byteLength }: Uint8Array, offset = 0) => {
  return new DataView(buffer, byteOffset, byteLength).getInt8(offset);
};

/**
 * Get unsigned 8-bit integer.
 */
const getByte = ({ buffer, byteOffset, byteLength }: Uint8Array, offset = 0) => {
  return new DataView(buffer, byteOffset, byteLength).getUint8(offset);
};

/**
 * Get signed 16-bit integer.
 */
const getShort = ({ buffer, byteOffset, byteLength }: Uint8Array, offset = 0) => {
  return new DataView(buffer, byteOffset, byteLength).getInt16(offset, true);
};

/**
 * Get unsigned 16-bit integer.
 */
const getWord = ({ buffer, byteOffset, byteLength }: Uint8Array, offset = 0) => {
  return new DataView(buffer, byteOffset, byteLength).getUint16(offset, true);
};

/**
 * Get unsigned 32-bit integer.
 */
const getDword = ({ buffer, byteOffset, byteLength }: Uint8Array, offset = 0) => {
  return new DataView(buffer, byteOffset, byteLength).getUint32(offset, true);
};
