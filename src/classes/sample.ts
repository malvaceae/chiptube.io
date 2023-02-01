/**
 * Sample
 */
export interface Sample {
  /**
   * The sample name.
   */
  name: string;

  /**
   * The data points.
   */
  dataPoints: [number, number];

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

  /**
   * The sample link.
   */
  link: number;

  /**
   * The sample type.
   */
  type: number;
}
