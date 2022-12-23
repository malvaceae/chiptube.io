// Tone.js
import * as Tone from 'tone';

// Options
import { generators, samples } from '@/composables/options';

/**
 * Generator
 */
export interface Generator {
  /**
   * startAddrsOffset
   *
   * The offset, in sample data points, beyond the Start sample header parameter to the
   * first sample data point to be played for this instrument. For example, if Start were 7
   * and startAddrOffset were 2, the first sample data point played would be sample data
   * point 9.
   */
  0: number;

  /**
   * endAddrsOffset
   *
   * The offset, in sample sample data points, beyond the End sample header parameter to
   * the last sample data point to be played for this instrument. For example, if End were
   * 17 and endAddrOffset were -2, the last sample data point played would be sample
   * data point 15.
   */
  1: number;

  /**
   * startloopAddrsOffset
   *
   * The offset, in sample data points, beyond the Startloop sample header parameter to
   * the first sample data point to be repeated in the loop for this instrument. For
   * example, if Startloop were 10 and startloopAddrsOffset were -1, the first repeated
   * loop sample data point would be sample data point 9.
   */
  2: number;

  /**
   * endloopAddrsOffset
   *
   * The offset, in sample data points, beyond the Endloop sample header parameter to
   * the sample data point considered equivalent to the Startloop sample data point for the
   * loop for this instrument. For example, if Endloop were 15 and endloopAddrsOffset
   * were 2, sample data point 17 would be considered equivalent to the Startloop sample
   * data point, and hence sample data point 16 would effectively precede Startloop
   * during looping.
   */
  3: number;

  /**
   * startAddrsCoarseOffset
   *
   * The offset, in 32768 sample data point increments beyond the Start sample header
   * parameter and the first sample data point to be played in this instrument. This
   * parameter is added to the startAddrsOffset parameter. For example, if Start were 5,
   * startAddrsOffset were 3 and startAddrsCoarseOffset were 2, the first sample data
   * point played would be sample data point 65544.
   */
  4: number;

  /**
   * modLfoToPitch
   *
   * This is the degree, in cents, to which a full scale excursion of the Modulation LFO
   * will influence pitch. A positive value indicates a positive LFO excursion increases
   * pitch; a negative value indicates a positive excursion decreases pitch. Pitch is always
   * modified logarithmically, that is the deviation is in cents, semitones, and octaves
   * rather than in Hz. For example, a value of 100 indicates that the pitch will first rise 1
   * semitone, then fall one semitone.
   */
  5: number;

  /**
   * vibLfoToPitch
   *
   * This is the degree, in cents, to which a full scale excursion of the Vibrato LFO will
   * influence pitch. A positive value indicates a positive LFO excursion increases pitch;
   * a negative value indicates a positive excursion decreases pitch. Pitch is always
   * modified logarithmically, that is the deviation is in cents, semitones, and octaves
   * rather than in Hz. For example, a value of 100 indicates that the pitch will first rise 1
   * semitone, then fall one semitone.
   */
  6: number;

  /**
   * modEnvToPitch
   *
   * This is the degree, in cents, to which a full scale excursion of the Modulation
   * Envelope will influence pitch. A positive value indicates an increase in pitch; a
   * negative value indicates a decrease in pitch. Pitch is always modified
   * logarithmically, that is the deviation is in cents, semitones, and octaves rather than in
   * Hz. For example, a value of 100 indicates that the pitch will rise 1 semitone at the
   * envelope peak.
   */
  7: number;

  /**
   * initialFilterFc
   *
   * This is the cutoff and resonant frequency of the lowpass filter in absolute cent units.
   * The lowpass filter is defined as a second order resonant pole pair whose pole
   * frequency in Hz is defined by the Initial Filter Cutoff parameter. When the cutoff
   * frequency exceeds 20kHz and the Q (resonance) of the filter is zero, the filter does
   * not affect the signal.
   */
  8: number;

  /**
   * initialFilterQ
   *
   * This is the height above DC gain in centibels which the filter resonance exhibits at
   * the cutoff frequency. A value of zero or less indicates the filter is not resonant; the
   * gain at the cutoff frequency (pole angle) may be less than zero when zero is
   * specified. The filter gain at DC is also affected by this parameter such that the gain
   * at DC is reduced by half the specified gain. For example, for a value of 100, the
   * filter gain at DC would be 5 dB below unity gain, and the height of the resonant peak
   * would be 10 dB above the DC gain, or 5 dB above unity gain. Note also that if
   * initialFilterQ is set to zero or less and the cutoff frequency exceeds 20 kHz, then the
   * filter response is flat and unity gain.
   */
  9: number;

  /**
   * modLfoToFilterFc
   *
   * This is the degree, in cents, to which a full scale excursion of the Modulation LFO
   * will influence filter cutoff frequency. A positive number indicates a positive LFO
   * excursion increases cutoff frequency; a negative number indicates a positive
   * excursion decreases cutoff frequency. Filter cutoff frequency is always modified
   * logarithmically, that is the deviation is in cents, semitones, and octaves rather than in
   * Hz. For example, a value of 1200 indicates that the cutoff frequency will first rise 1
   * octave, then fall one octave.
   */
  10: number;

  /**
   * modEnvToFilterFc
   *
   * This is the degree, in cents, to which a full scale excursion of the Modulation
   * Envelope will influence filter cutoff frequency. A positive number indicates an
   * increase in cutoff frequency; a negative number indicates a decrease in filter cutoff
   * frequency. Filter cutoff frequency is always modified logarithmically, that is the
   * deviation is in cents, semitones, and octaves rather than in Hz. For example, a value
   * of 1000 indicates that the cutoff frequency will rise one octave at the envelope attack
   * peak.
   */
  11: number;

  /**
   * endAddrsCoarseOffset
   *
   * The offset, in 32768 sample data point increments beyond the End sample header
   * parameter and the last sample data point to be played in this instrument. This
   * parameter is added to the endAddrsOffset parameter. For example, if End were
   * 65536, startAddrsOffset were -3 and startAddrsCoarseOffset were -1, the last sample
   * data point played would be sample data point 32765.
   */
  12: number;

  /**
   * modLfoToVolume
   *
   * This is the degree, in centibels, to which a full scale excursion of the Modulation
   * LFO will influence volume. A positive number indicates a positive LFO excursion
   * increases volume; a negative number indicates a positive excursion decreases
   * volume. Volume is always modified logarithmically, that is the deviation is in
   * decibels rather than in linear amplitude. For example, a value of 100 indicates that
   * the volume will first rise ten dB, then fall ten dB.
   */
  13: number;

  /**
   * unused1
   *
   * Unused, reserved. Should be ignored if encountered.
   */
  14: number;

  /**
   * chorusEffectsSend
   *
   * This is the degree, in 0.1% units, to which the audio output of the note is sent to the
   * chorus effects processor. A value of 0% or less indicates no signal is sent from this
   * note; a value of 100% or more indicates the note is sent at full level. Note that this
   * parameter has no effect on the amount of this signal sent to the “dry” or unprocessed
   * portion of the output. For example, a value of 250 indicates that the signal is sent at
   * 25% of full level (attenuation of 12 dB from full level) to the chorus effects
   * processor.
   */
  15: number;

  /**
   * reverbEffectsSend
   *
   * This is the degree, in 0.1% units, to which the audio output of the note is sent to the
   * reverb effects processor. A value of 0% or less indicates no signal is sent from this
   * note; a value of 100% or more indicates the note is sent at full level. Note that this
   * parameter has no effect on the amount of this signal sent to the “dry” or unprocessed
   * portion of the output. For example, a value of 250 indicates that the signal is sent at
   * 25% of full level (attenuation of 12 dB from full level) to the reverb effects
   * processor.
   */
  16: number;

  /**
   * pan
   *
   * This is the degree, in 0.1% units, to which the “dry” audio output of the note is
   * positioned to the left or right output. A value of -50% or less indicates the signal is
   * sent entirely to the left output and not sent to the right output; a value of +50% or
   * more indicates the note is sent entirely to the right and not sent to the left. A value of
   * zero places the signal centered between left and right. For example, a value of -250
   * indicates that the signal is sent at 75% of full level to the left output and 25% of full
   * level to the right output.
   */
  17: number;

  /**
   * unused2
   *
   * Unused, reserved. Should be ignored if encountered.
   */
  18: number;

  /**
   * unused3
   *
   * Unused, reserved. Should be ignored if encountered.
   */
  19: number;

  /**
   * unused4
   *
   * Unused, reserved. Should be ignored if encountered.
   */
  20: number;

  /**
   * delayModLFO
   *
   * This is the delay time, in absolute timecents, from key on until the Modulation LFO
   * begins its upward ramp from zero value. A value of 0 indicates a 1 second delay. A
   * negative value indicates a delay less than one second and a positive value a delay
   * longer than one second. The most negative number (-32768) conventionally
   * indicates no delay. For example, a delay of 10 msec would be 1200log2(.01) = -
   * 7973.
   */
  21: number;

  /**
   * freqModLFO
   *
   * This is the frequency, in absolute cents, of the Modulation LFO’s triangular period.
   * A value of zero indicates a frequency of 8.176 Hz. A negative value indicates a
   * frequency less than 8.176 Hz; a positive value a frequency greater than 8.176 Hz.
   * For example, a frequency of 10 mHz would be 1200log2(.01/8.176) = -11610.
   */
  22: number;

  /**
   * delayVibLFO
   *
   * This is the delay time, in absolute timecents, from key on until the Vibrato LFO
   * begins its upward ramp from zero value. A value of 0 indicates a 1 second delay. A
   * negative value indicates a delay less than one second; a positive value a delay longer
   * than one second. The most negative number (-32768) conventionally indicates no
   * delay. For example, a delay of 10 msec would be 1200log2(.01) = -7973.
   */
  23: number;

  /**
   * freqVibLFO
   *
   * This is the frequency, in absolute cents, of the Vibrato LFO’s triangular period. A
   * value of zero indicates a frequency of 8.176 Hz. A negative value indicates a
   * frequency less than 8.176 Hz; a positive value a frequency greater than 8.176 Hz.
   * For example, a frequency of 10 mHz would be 1200log2(.01/8.176) = -11610.
   */
  24: number;

  /**
   * delayModEnv
   *
   * This is the delay time, in absolute timecents, between key on and the start of the
   * attack phase of the Modulation envelope. A value of 0 indicates a 1 second delay. A
   * negative value indicates a delay less than one second; a positive value a delay longer
   * than one second. The most negative number (-32768) conventionally indicates no
   * delay. For example, a delay of 10 msec would be 1200log2(.01) = -7973.
   */
  25: number;

  /**
   * attackModEnv
   *
   * This is the time, in absolute timecents, from the end of the Modulation Envelope
   * Delay Time until the point at which the Modulation Envelope value reaches its peak.
   * Note that the attack is “convex”; the curve is nominally such that when applied to a
   * decibel or semitone parameter, the result is linear in amplitude or Hz respectively. A
   * value of 0 indicates a 1 second attack time. A negative value indicates a time less
   * than one second; a positive value a time longer than one second. The most negative
   * number (-32768) conventionally indicates instantaneous attack. For example, an
   * attack time of 10 msec would be 1200log2(.01) = -7973.
   */
  26: number;

  /**
   * holdModEnv
   *
   * This is the time, in absolute timecents, from the end of the attack phase to the entry
   * into decay phase, during which the envelope value is held at its peak. A value of 0
   * indicates a 1 second hold time. A negative value indicates a time less than one
   * second; a positive value a time longer than one second. The most negative number (-
   * 32768) conventionally indicates no hold phase. For example, a hold time of 10 msec
   * would be 1200log2(.01) = -7973.
   */
  27: number;

  /**
   * decayModEnv
   *
   * This is the time, in absolute timecents, for a 100% change in the Modulation
   * Envelope value during decay phase. For the Modulation Envelope, the decay phase
   * linearly ramps toward the sustain level. If the sustain level were zero, the
   * Modulation Envelope Decay Time would be the time spent in decay phase. A value
   * of 0 indicates a 1 second decay time for a zero-sustain level. A negative value
   * indicates a time less than one second; a positive value a time longer than one second.
   * For example, a decay time of 10 msec would be 1200log2(.01) = -7973.
   */
  28: number;

  /**
   * sustainModEnv
   *
   * This is the decrease in level, expressed in 0.1% units, to which the Modulation
   * Envelope value ramps during the decay phase. For the Modulation Envelope, the
   * sustain level is properly expressed in percent of full scale. Because the volume
   * envelope sustain level is expressed as an attenuation from full scale, the sustain level
   * is analogously expressed as a decrease from full scale. A value of 0 indicates the
   * sustain level is full level; this implies a zero duration of decay phase regardless of
   * decay time. A positive value indicates a decay to the corresponding level. Values
   * less than zero are to be interpreted as zero; values above 1000 are to be interpreted as
   * 1000. For example, a sustain level which corresponds to an absolute value 40% of
   * peak would be 600.
   */
  29: number;

  /**
   * releaseModEnv
   *
   * This is the time, in absolute timecents, for a 100% change in the Modulation
   * Envelope value during release phase. For the Modulation Envelope, the release
   * phase linearly ramps toward zero from the current level. If the current level were
   * full scale, the Modulation Envelope Release Time would be the time spent in release
   * phase until zero value were reached. A value of 0 indicates a 1 second decay time
   * for a release from full level. A negative value indicates a time less than one second;
   * a positive value a time longer than one second. For example, a release time of 10
   * msec would be 1200log2(.01) = -7973.
   */
  30: number;

  /**
   * keynumToModEnvHold
   *
   * This is the degree, in timecents per KeyNumber units, to which the hold time of the
   * Modulation Envelope is decreased by increasing MIDI key number. The hold time
   * at key number 60 is always unchanged. The unit scaling is such that a value of 100
   * provides a hold time which tracks the keyboard; that is, an upward octave causes the
   * hold time to halve. For example, if the Modulation Envelope Hold Time were -7973
   * = 10 msec and the Key Number to Mod Env Hold were 50 when key number 36 was
   * played, the hold time would be 20 msec.
   */
  31: number;

  /**
   * keynumToModEnvDecay
   *
   * This is the degree, in timecents per KeyNumber units, to which the hold time of the
   * Modulation Envelope is decreased by increasing MIDI key number. The hold time
   * at key number 60 is always unchanged. The unit scaling is such that a value of 100
   * provides a hold time that tracks the keyboard; that is, an upward octave causes the
   * hold time to halve. For example, if the Modulation Envelope Hold Time were -7973
   * = 10 msec and the Key Number to Mod Env Hold were 50 when key number 36 was
   * played, the hold time would be 20 msec.
   */
  32: number;

  /**
   * delayVolEnv
   *
   * This is the delay time, in absolute timecents, between key on and the start of the
   * attack phase of the Volume envelope. A value of 0 indicates a 1 second delay. A
   * negative value indicates a delay less than one second; a positive value a delay longer
   * than one second. The most negative number (-32768) conventionally indicates no
   * delay. For example, a delay of 10 msec would be 1200log2(.01) = -7973.
   */
  33: number;

  /**
   * attackVolEnv
   *
   * This is the time, in absolute timecents, from the end of the Volume Envelope Delay
   * Time until the point at which the Volume Envelope value reaches its peak. Note that
   * the attack is “convex”; the curve is nominally such that when applied to the decibel
   * volume parameter, the result is linear in amplitude. A value of 0 indicates a 1 second
   * attack time. A negative value indicates a time less than one second; a positive value
   * a time longer than one second. The most negative number (-32768) conventionally
   * indicates instantaneous attack. For example, an attack time of 10 msec would be
   * 1200log2(.01) = -7973.
   */
  34: number;

  /**
   * holdVolEnv
   *
   * This is the time, in absolute timecents, from the end of the attack phase to the entry
   * into decay phase, during which the Volume envelope value is held at its peak. A
   * value of 0 indicates a 1 second hold time. A negative value indicates a time less than
   * one second; a positive value a time longer than one second. The most negative
   * number (-32768) conventionally indicates no hold phase. For example, a hold time
   * of 10 msec would be 1200log2(.01) = -7973.
   */
  35: number;

  /**
   * decayVolEnv
   *
   * This is the time, in absolute timecents, for a 100% change in the Volume Envelope
   * value during decay phase. For the Volume Envelope, the decay phase linearly ramps
   * toward the sustain level, causing a constant dB change for each time unit. If the
   * sustain level were -100dB, the Volume Envelope Decay Time would be the time
   * spent in decay phase. A value of 0 indicates a 1-second decay time for a zero-sustain
   * level. A negative value indicates a time less than one second; a positive value a time
   * longer than one second. For example, a decay time of 10 msec would be
   * 1200log2(.01) = -7973.
   */
  36: number;

  /**
   * sustainVolEnv
   *
   * This is the decrease in level, expressed in centibels, to which the Volume Envelope
   * value ramps during the decay phase. For the Volume Envelope, the sustain level is
   * best expressed in centibels of attenuation from full scale. A value of 0 indicates the
   * sustain level is full level; this implies a zero duration of decay phase regardless of
   * decay time. A positive value indicates a decay to the corresponding level. Values
   * less than zero are to be interpreted as zero; conventionally 1000 indicates full
   * attenuation. For example, a sustain level which corresponds to an absolute value
   * 12dB below of peak would be 120.
   */
  37: number;

  /**
   * releaseVolEnv
   *
   * This is the time, in absolute timecents, for a 100% change in the Volume Envelope
   * value during release phase. For the Volume Envelope, the release phase linearly
   * ramps toward zero from the current level, causing a constant dB change for each
   * time unit. If the current level were full scale, the Volume Envelope Release Time
   * would be the time spent in release phase until 100dB attenuation were reached. A
   * value of 0 indicates a 1-second decay time for a release from full level. A negative
   * value indicates a time less than one second; a positive value a time longer than one
   * second. For example, a release time of 10 msec would be 1200log2(.01) = -7973.
   */
  38: number;

  /**
   * keynumToVolEnvHold
   *
   * This is the degree, in timecents per KeyNumber units, to which the hold time of the
   * Volume Envelope is decreased by increasing MIDI key number. The hold time at
   * key number 60 is always unchanged. The unit scaling is such that a value of 100
   * provides a hold time which tracks the keyboard; that is, an upward octave causes the
   * hold time to halve. For example, if the Volume Envelope Hold Time were -7973 =
   * 10 msec and the Key Number to Vol Env Hold were 50 when key number 36 was
   * played, the hold time would be 20 msec.
   */
  39: number;

  /**
   * keynumToVolEnvDecay
   *
   * This is the degree, in timecents per KeyNumber units, to which the hold time of the
   * Volume Envelope is decreased by increasing MIDI key number. The hold time at
   * key number 60 is always unchanged. The unit scaling is such that a value of 100
   * provides a hold time that tracks the keyboard; that is, an upward octave causes the
   * hold time to halve. For example, if the Volume Envelope Hold Time were -7973 =
   * 10 msec and the Key Number to Vol Env Hold were 50 when key number 36 was
   * played, the hold time would be 20 msec.
   */
  40: number;

  /**
   * instrument
   *
   * This is the index into the INST sub-chunk providing the instrument to be used for the
   * current preset zone. A value of zero indicates the first instrument in the list. The
   * value should never exceed two less than the size of the instrument list. The
   * instrument enumerator is the terminal generator for PGEN zones. As such, it should
   * only appear in the PGEN sub-chunk, and it must appear as the last generator
   * enumerator in all but the global preset zone.
   */
  41: number;

  /**
   * reserved1
   *
   * Unused, reserved. Should be ignored if encountered.
   */
  42: number;

  /**
   * keyRange
   *
   * This is the minimum and maximum MIDI key number values for which this preset
   * zone or instrument zone is active. The LS byte indicates the highest and the MS byte
   * the lowest valid key. The keyRange enumerator is optional, but when it does appear,
   * it must be the first generator in the zone generator list.
   */
  43: number;

  /**
   * velRange
   *
   * This is the minimum and maximum MIDI velocity values for which this preset zone
   * or instrument zone is active. The LS byte indicates the highest and the MS byte the
   * lowest valid velocity. The velRange enumerator is optional, but when it does appear,
   * it must be preceded only by keyRange in the zone generator list.
   */
  44: number;

  /**
   * startloopAddrsCoarseOffset
   *
   * The offset, in 32768 sample data point increments beyond the Startloop sample
   * header parameter and the first sample data point to be repeated in this instrument’s
   * loop. This parameter is added to the startloopAddrsOffset parameter. For example,
   * if Startloop were 5, startloopAddrsOffset were 3 and startAddrsCoarseOffset were 2,
   * the first sample data point in the loop would be sample data point 65544.
   */
  45: number;

  /**
   * keynum
   *
   * This enumerator forces the MIDI key number to effectively be interpreted as the
   * value given. This generator can only appear at the instrument level. Valid values are
   * from 0 to 127.
   */
  46: number;

  /**
   * velocity
   *
   * This enumerator forces the MIDI velocity to effectively be interpreted as the value
   * given. This generator can only appear at the instrument level. Valid values are from
   * 0 to 127.
   */
  47: number;

  /**
   * initialAttenuation
   *
   * This is the attenuation, in centibels, by which a note is attenuated below full scale. A
   * value of zero indicates no attenuation; the note will be played at full scale. For
   * example, a value of 60 indicates the note will be played at 6 dB below full scale for
   * the note.
   */
  48: number;

  /**
   * reserved2
   *
   * Unused, reserved. Should be ignored if encountered.
   */
  49: number;

  /**
   * endloopAddrsCoarseOffset
   *
   * The offset, in 32768 sample data point increments beyond the Endloop sample
   * header parameter to the sample data point considered equivalent to the Startloop
   * sample data point for the loop for this instrument. This parameter is added to the
   * endloopAddrsOffset parameter. For example, if Endloop were 5,
   * endloopAddrsOffset were 3 and endAddrsCoarseOffset were 2, sample data point
   * 65544 would be considered equivalent to the Startloop sample data point, and hence
   * sample data point 65543 would effectively precede Startloop during looping.
   */
  50: number;

  /**
   * coarseTune
   *
   * This is a pitch offset, in semitones, which should be applied to the note. A positive
   * value indicates the sound is reproduced at a higher pitch; a negative value indicates a
   * lower pitch. For example, a Coarse Tune value of -4 would cause the sound to be
   * reproduced four semitones flat.
   */
  51: number;

  /**
   * fineTune
   *
   * This is a pitch offset, in cents, which should be applied to the note. It is additive
   * with coarseTune. A positive value indicates the sound is reproduced at a higher
   * pitch; a negative value indicates a lower pitch. For example, a Fine Tuning value of -
   * 5 would cause the sound to be reproduced five cents flat.
   */
  52: number;

  /**
   * sampleID
   *
   * This is the index into the SHDR sub-chunk providing the sample to be used for the
   * current instrument zone. A value of zero indicates the first sample in the list. The
   * value should never exceed two less than the size of the sample list. The sampleID
   * enumerator is the terminal generator for IGEN zones. As such, it should only appear
   * in the IGEN sub-chunk, and it must appear as the last generator enumerator in all but
   * the global zone.
   */
  53: number;

  /**
   * sampleModes
   *
   * This enumerator indicates a value which gives a variety of Boolean flags describing
   * the sample for the current instrument zone. The sampleModes should only appear in
   * the IGEN sub-chunk, and should not appear in the global zone. The two LS bits of
   * the value indicate the type of loop in the sample: 0 indicates a sound reproduced with
   * no loop, 1 indicates a sound which loops continuously, 2 is unused but should be
   * interpreted as indicating no loop, and 3 indicates a sound which loops for the
   * duration of key depression then proceeds to play the remainder of the sample.
   */
  54: number;

  /**
   * reserved3
   *
   * Unused, reserved. Should be ignored if encountered.
   */
  55: number;

  /**
   * scaleTuning
   *
   * This parameter represents the degree to which MIDI key number influences pitch. A
   * value of zero indicates that MIDI key number has no effect on pitch; a value of 100
   * represents the usual tempered semitone scale.
   */
  56: number;

  /**
   * exclusiveClass
   *
   * This parameter provides the capability for a key depression in a given instrument to
   * terminate the playback of other instruments. This is particularly useful for
   * percussive instruments such as a hi-hat cymbal. An exclusive class value of zero
   * indicates no exclusive class; no special action is taken. Any other value indicates
   * that when this note is initiated, any other sounding note with the same exclusive class
   * value should be rapidly terminated. The exclusive class generator can only appear at
   * the instrument level. The scope of the exclusive class is the entire preset. In other
   * words, any other instrument zone within the same preset holding a corresponding
   * exclusive class will be terminated.
   */
  57: number;

  /**
   * overridingRootKey
   *
   * This parameter represents the MIDI key number at which the sample is to be played
   * back at its original sample rate. If not present, or if present with a value of -1, then
   * the sample header parameter Original Key is used in its place. If it is present in the
   * range 0-127, then the indicated key number will cause the sample to be played back
   * at its sample header Sample Rate. For example, if the sample were a recording of a
   * piano middle C (Original Key = 60) at a sample rate of 22.050 kHz, and Root Key
   * were set to 69, then playing MIDI key number 69 (A above middle C) would cause a
   * piano note of pitch middle C to be heard.
   */
  58: number;

  /**
   * unused5
   *
   * Unused, reserved. Should be ignored if encountered.
   */
  59: number;

  /**
   * endOper
   *
   * Unused, reserved. Should be ignored if encountered. Unique name provides value
   * to end of defined list.
   */
  60: number;
}

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

/**
 * Note
 */
export interface Note {
  /**
   * The generator.
   */
  generator: Generator;

  /**
   * The sample.
   */
  sample: Sample;

  /**
   * The output.
   */
  output: Tone.Gain;

  /**
   * The filter.
   */
  filter: Tone.BiquadFilter;

  /**
   * The source.
   */
  source: Tone.ToneBufferSource;
}

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
   * The chorus effects.
   */
  private _chorus: Tone.Chorus;

  /**
   * The reverb effects.
   */
  private _reverb: Tone.Reverb;

  /**
   * The generators.
   */
  private _generators: Generator[];

  /**
   * The samples.
   */
  private _samples: Map<number, Sample> = new Map();

  /**
   * The stored and loaded buffers.
   */
  private _buffers: Tone.ToneAudioBuffers;

  /**
   * The object of all currently playing notes.
   */
  private _activeNotes: Map<Tone.Unit.MidiNote, Note[]> = new Map();

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

    // chorus effects
    this._chorus = new Tone.Chorus({
      context,
    });

    // reverb effects
    this._reverb = new Tone.Reverb({
      context,
    });

    // connect the effects
    this._chorus.connect(this.output);
    this._reverb.connect(this.output);

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

    // sample urls
    const urls = Object.fromEntries(samples.map((sample) => {
      return [sample.id, `${sample.id}.wav`];
    }));

    // buffers
    this._buffers = new Tone.ToneAudioBuffers({
      urls,
      baseUrl,
    });
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
  triggerAttack(note: Tone.Unit.Frequency, time?: Tone.Unit.Time, velocity: Tone.Unit.NormalRange = 1, volume: Tone.Unit.NormalRange = 1) {
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

    // chorus
    const chorus = (({ context }, gain) => {
      if (gain) {
        return new Tone.Gain({
          context,
          gain,
        });
      }
    })(this, generator[15] / 1000);

    // reverb
    const reverb = (({ context }, gain) => {
      if (gain) {
        return new Tone.Gain({
          context,
          gain,
        });
      }
    })(this, generator[16] / 1000);

    // output - base gain and peak gain
    const outputBaseGain = 0;
    const outputPeakGain = volume * velocity * toDecayRate(generator[48]);

    // output - sustain gain
    const outputSustainGain = outputPeakGain * toDecayRate(generator[37]);

    // output - times
    const [outputDelay, outputAttack, outputHold, outputDecay] = [
      this.toSeconds(time) + toSeconds(generator[33]),
      this.toSeconds(time) + toSeconds(generator[33]) + toSeconds(generator[34]),
      this.toSeconds(time) + toSeconds(generator[33]) + toSeconds(generator[34]) + toSeconds(generator[35]) * toSeconds((60 - key) * generator[39]),
      this.toSeconds(time) + toSeconds(generator[33]) + toSeconds(generator[34]) + toSeconds(generator[35]) * toSeconds((60 - key) * generator[39]) + toSeconds(generator[36]) * toSeconds((60 - key) * generator[40]),
    ];

    // output
    const output = new Tone.Gain({
      context: this.context,
    });

    // output - default value
    output.gain.setValueAtTime(outputBaseGain, this.toSeconds(time));

    // output - delay
    output.gain.setValueAtTime(outputBaseGain, outputDelay);

    // output - attack
    output.gain.linearRampToValueAtTime(outputPeakGain, outputAttack);

    // output - hold
    output.gain.linearRampToValueAtTime(outputPeakGain, outputHold);

    // output - decay
    output.gain.linearRampToValueAtTime(outputSustainGain, outputDecay);

    // panner
    const panner = new Tone.Panner({
      context: this.context,
    });

    // panner - default value
    panner.pan.setValueAtTime(generator[17] / 500, this.toSeconds(time));

    // filter - base frequency and peak frequency
    const filterBaseFreq = toFrequency(generator[8]);
    const filterPeakFreq = toFrequency(generator[8] + generator[11]);

    // filter - sustain frequency
    const filterSustainFreq = filterBaseFreq + (filterPeakFreq - filterBaseFreq) * toDecayRate(generator[29]);

    // filter - times
    const [filterDelay, filterAttack, filterHold, filterDecay] = [
      this.toSeconds(time) + toSeconds(generator[25]),
      this.toSeconds(time) + toSeconds(generator[25]) + toSeconds(generator[26]),
      this.toSeconds(time) + toSeconds(generator[25]) + toSeconds(generator[26]) + toSeconds(generator[27]) * toSeconds((60 - key) * generator[31]),
      this.toSeconds(time) + toSeconds(generator[25]) + toSeconds(generator[26]) + toSeconds(generator[27]) * toSeconds((60 - key) * generator[31]) + toSeconds(generator[28]) * toSeconds((60 - key) * generator[32]),
    ];

    // filter
    const filter = new Tone.BiquadFilter({
      context: this.context,
    });

    // filter - default value
    filter.frequency.setValueAtTime(filterBaseFreq, this.toSeconds(time));

    // filter - delay
    filter.frequency.setValueAtTime(filterBaseFreq, filterDelay);

    // filter - attack
    filter.frequency.linearRampToValueAtTime(filterPeakFreq, filterAttack + 1);

    // filter - hold
    filter.frequency.linearRampToValueAtTime(filterPeakFreq, filterHold);

    // filter - decay
    filter.frequency.linearRampToValueAtTime(filterSustainFreq, filterDecay);

    // filter - Q factor
    filter.Q.value = Math.pow(10, generator[9] / 200);

    // source - parameters
    const [url, loopStart, loopEnd, loop] = [
      buffer,
      sample.loopPoints[0] / sample.sampleRate,
      sample.loopPoints[1] / sample.sampleRate,
      generator[54] === 1,
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
    const playbackRateBaseFreq = toPlaybackRateBaseFrequency(key, generator, sample);
    const playbackRatePeakFreq = toPlaybackRateBaseFrequency(key, generator, sample) * toPlaybackRateFrequency(generator[7] / 100, generator[56]);

    // playback rate - sustain frequency
    const playbackRateSustainFreq = playbackRateBaseFreq + (playbackRatePeakFreq - playbackRateBaseFreq) * toDecayRate(generator[29]);

    // playback rate - times
    const [playbackRateDelay, playbackRateAttack, playbackRateHold, playbackRateDecay] = [
      this.toSeconds(time) + toSeconds(generator[25]),
      this.toSeconds(time) + toSeconds(generator[25]) + toSeconds(generator[26]),
      this.toSeconds(time) + toSeconds(generator[25]) + toSeconds(generator[26]) + toSeconds(generator[27]) * toSeconds((60 - key) * generator[31]),
      this.toSeconds(time) + toSeconds(generator[25]) + toSeconds(generator[26]) + toSeconds(generator[27]) * toSeconds((60 - key) * generator[31]) + toSeconds(generator[28]) * toSeconds((60 - key) * generator[32]),
    ];

    // playback rate - default value
    source.playbackRate.setValueAtTime(playbackRateBaseFreq, this.toSeconds(time));

    // playback rate - delay
    source.playbackRate.setValueAtTime(playbackRateBaseFreq, playbackRateDelay);

    // playback rate - attack
    source.playbackRate.linearRampToValueAtTime(playbackRatePeakFreq, playbackRateAttack);

    // playback rate - hold
    source.playbackRate.linearRampToValueAtTime(playbackRatePeakFreq, playbackRateHold);

    // playback rate - decay
    source.playbackRate.linearRampToValueAtTime(playbackRateSustainFreq, playbackRateDecay);

    // connect chorus
    if (chorus) {
      output.chain(chorus, this._chorus);
    }

    // connect reverb
    if (reverb) {
      output.chain(reverb, this._reverb);
    }

    // connect
    output.connect(this.output);
    panner.connect(output);
    filter.connect(panner);
    source.connect(filter);

    // start
    source.start(time, 0);

    // invoke after the source is done playing
    source.onended = () => {
      // disconnect
      source.disconnect();
      filter.disconnect();
      panner.disconnect();
      output.disconnect();

      // disconnect reverb
      reverb?.disconnect();

      // disconnect chorus
      chorus?.disconnect();
    };

    // add note to active notes
    this._activeNotes.set(key, [...(this._activeNotes.get(key) ?? []), {
      generator,
      sample,
      output,
      filter,
      source,
    }]);
  }

  /**
   * Trigger the release.
   */
  triggerRelease(note: Tone.Unit.Frequency, time?: Tone.Unit.Time) {
    // key
    const key = Tone.Frequency(note).toMidi();

    // release
    this._activeNotes.get(key)?.splice?.(0)?.forEach?.(({ generator, sample, output, filter, source }) => {
      // set ramp point to release time
      [output.gain, filter.frequency, source.playbackRate].forEach((parameter) => {
        parameter.setRampPoint(this.toSeconds(time));
      });

      // output - release time
      const outputRelease = this.toSeconds(time) + toSeconds(generator[38]) * output.gain.getValueAtTime(this.toSeconds(time));

      // output - release
      output.gain.linearRampToValueAtTime(0, outputRelease);

      // filter - base frequency and peak frequency
      const filterBaseFreq = toFrequency(generator[8]);
      const filterPeakFreq = toFrequency(generator[8] + generator[11]);

      // filter - release time
      const filterRelease = this.toSeconds(time) + toSeconds(generator[30]) * (filterBaseFreq === filterPeakFreq ? 1 : (this.toFrequency(filter.frequency.getValueAtTime(this.toSeconds(time))) - filterBaseFreq) / (filterPeakFreq - filterBaseFreq));

      // filter - release
      filter.frequency.linearRampToValueAtTime(filterBaseFreq, filterRelease);

      // playback rate - release time
      const playbackRateRelease = filterRelease;

      // playback rate - release
      source.playbackRate.linearRampToValueAtTime(toPlaybackRateBaseFrequency(key, generator, sample), playbackRateRelease);

      // stop
      source.stop(outputRelease);
    });
  }

  /**
   * Trigger the attack and release.
   */
  triggerAttackRelease(note: Tone.Unit.Frequency, duration: Tone.Unit.Time, time?: Tone.Unit.Time, velocity: Tone.Unit.NormalRange = 1, volume: Tone.Unit.NormalRange = 1) {
    // attack time
    time = this.toSeconds(time);

    // attack
    this.triggerAttack(note, time, velocity, volume);

    // release time
    time = time + this.toSeconds(duration);

    // release
    this.triggerRelease(note, time);
  }

  /**
   * Release all currently active notes.
   */
  releaseAll(time?: Tone.Unit.Time) {
    this._activeNotes.forEach((notes) => {
      notes.splice(0).forEach((note) => {
        note.source.stop(time);
      });
    });
  }

  /**
   * Dispose and disconnect.
   */
  dispose() {
    this._reverb.disconnect();
    this._chorus.disconnect();
    return super.dispose();
  }
};

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
 * Get a sampler.
 */
export const getSampler = ((cache: Record<number, Sampler> = {}) => (number: number) => {
  return cache[number] ??= new Sampler({
    generators: generators[number],
    samples: samples[number],
    baseUrl: '/samples/',
  });
})();
