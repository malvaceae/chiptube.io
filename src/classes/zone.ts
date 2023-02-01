// Generator
import { Generator } from '@/classes/generator';

// Modulator
import { Modulator } from '@/classes/modulator';

/**
 * Zone
 */
export interface Zone {
  /**
   * The generator.
   */
  generator: Partial<Generator>;

  /**
   * The modulator.
   */
  modulator: Partial<Modulator>;
}
