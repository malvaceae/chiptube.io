/**
 * Sample
 */
export interface Sample {
  /**
   * The sample ID.
   */
  id: number;

  /**
   * The loop points.
   */
  loopPoints: [number, number];

  /**
   * The sample rate.
   */
  sampleRate: number;

  /**
   * The original key.
   */
  originalKey: number;

  /**
   * The correction.
   */
  correction: number;
}
