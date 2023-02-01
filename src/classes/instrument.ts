// Zone
import { Zone } from '@/classes/zone';

/**
 * Instrument
 */
export interface Instrument {
  /**
   * The instrument name.
   */
  name: string;

  /**
   * The global zone.
   */
  globalZone?: Zone;

  /**
   * The zones.
   */
  zones: Zone[];
}
