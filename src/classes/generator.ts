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
