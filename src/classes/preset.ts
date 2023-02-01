// Zone
import { Zone } from '@/classes/zone';

/**
 * Preset
 */
export interface Preset {
  /**
   * The preset name.
   */
  name: string;

  /**
   * The patch.
   */
  patch: number;

  /**
   * The bank.
   */
  bank: number;

  /**
   * The global zone.
   */
  globalZone?: Zone;

  /**
   * The zones.
   */
  zones: Zone[];
}
