type PitchSummary = {
  pitchValues: number[];
  pitchVariance: number;
  pitchRange: number;
};

export interface VoiceAnalysisDetails {
  rmsAverage: number;
  rmsVariance: number;
  pitchVariance: number;
  pitchRange: number;
  durationSeconds: number;
}

export interface VoiceAnalysisResult {
  strengthLabel: string;
  strengthScore: number;
  emotionLabel: string;
  emotionScore: number;
  details: VoiceAnalysisDetails;
}

const clamp01 = (value: number): number => {
  if (Number.isNaN(value)) return 0;
  return Math.min(Math.max(value, 0), 1);
};

const FRAME_SIZE = 1024;
const HOP_SIZE = 512;
const MIN_FREQUENCY = 60;
const MAX_FREQUENCY = 450;

async function decodeAudioBuffer(blob: Blob): Promise<AudioBuffer> {
  const arrayBuffer = await blob.arrayBuffer();
  const audioContext = new AudioContext();

  try {
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    return audioBuffer;
  } finally {
    // Release the context to avoid keeping resources alive
    if (audioContext.state !== "closed") {
      void audioContext.close();
    }
  }
}

function mergeToMono(buffer: AudioBuffer): Float32Array {
  if (buffer.numberOfChannels === 1) {
    return buffer.getChannelData(0);
  }

  const length = buffer.length;
  const tmp = new Float32Array(length);
  for (let channel = 0; channel < buffer.numberOfChannels; channel += 1) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < length; i += 1) {
      tmp[i] += channelData[i] / buffer.numberOfChannels;
    }
  }
  return tmp;
}

function computeRmsStats(frames: number[][]): {
  average: number;
  variance: number;
} {
  const rmsValues = frames.map((frame) => {
    let sumSquares = 0;
    for (let i = 0; i < frame.length; i += 1) {
      sumSquares += frame[i] * frame[i];
    }
    return Math.sqrt(sumSquares / frame.length);
  });

  const average =
    rmsValues.reduce((acc, value) => acc + value, 0) / (rmsValues.length || 1);
  const variance =
    rmsValues.reduce((acc, value) => acc + (value - average) ** 2, 0) /
    (rmsValues.length || 1);

  return { average, variance };
}

function autocorrelationPitch(
  frame: number[],
  sampleRate: number
): number | null {
  const frameLength = frame.length;
  if (frameLength === 0) return null;

  // Remove DC offset
  const mean = frame.reduce((acc, value) => acc + value, 0) / frameLength;
  const normalized = frame.map((value) => value - mean);

  const minLag = Math.floor(sampleRate / MAX_FREQUENCY);
  const maxLag = Math.floor(sampleRate / MIN_FREQUENCY);

  let bestLag = 0;
  let bestCorrelation = 0;

  for (let lag = minLag; lag <= maxLag; lag += 1) {
    let correlation = 0;
    for (let i = 0; i < frameLength - lag; i += 1) {
      correlation += normalized[i] * normalized[i + lag];
    }

    if (correlation > bestCorrelation) {
      bestCorrelation = correlation;
      bestLag = lag;
    }
  }

  if (bestLag === 0 || bestCorrelation <= 0) {
    return null;
  }

  return sampleRate / bestLag;
}

function computePitchSummary(
  frames: number[][],
  sampleRate: number
): PitchSummary {
  const pitches: number[] = [];
  for (const frame of frames) {
    const pitch = autocorrelationPitch(frame, sampleRate);
    if (pitch && Number.isFinite(pitch)) {
      pitches.push(pitch);
    }
  }

  if (pitches.length === 0) {
    return {
      pitchValues: [],
      pitchVariance: 0,
      pitchRange: 0,
    };
  }

  const averagePitch =
    pitches.reduce((acc, value) => acc + value, 0) / pitches.length;
  const variance =
    pitches.reduce((acc, value) => acc + (value - averagePitch) ** 2, 0) /
    pitches.length;
  const minPitch = Math.min(...pitches);
  const maxPitch = Math.max(...pitches);

  return {
    pitchValues: pitches,
    pitchVariance: variance,
    pitchRange: maxPitch - minPitch,
  };
}

function framesFromSignal(data: Float32Array): number[][] {
  const frames: number[][] = [];
  for (let start = 0; start + FRAME_SIZE <= data.length; start += HOP_SIZE) {
    const frame = data.slice(start, start + FRAME_SIZE);
    frames.push(Array.from(frame));
  }

  if (frames.length === 0 && data.length > 0) {
    frames.push(Array.from(data));
  }

  return frames;
}

function computeStrengthLabel(score: number): string {
  if (score >= 0.6) return "声が堂々としている";
  if (score >= 0.3) return "十分な声量";
  return "穏やかで控えめな声量";
}

function computeEmotionLabel(score: number): string {
  if (score >= 0.55) return "感情がよく乗っている";
  if (score >= 0.35) return "自然な抑揚";
  return "やや平坦で落ち着いた印象";
}

export async function analyzeVoiceFromBlob(
  blob: Blob
): Promise<VoiceAnalysisResult> {
  const buffer = await decodeAudioBuffer(blob);
  const mono = mergeToMono(buffer);
  const frames = framesFromSignal(mono);

  const { average: rmsAverage, variance: rmsVariance } =
    computeRmsStats(frames);
  const pitchSummary = computePitchSummary(frames, buffer.sampleRate);

  const loudnessScore = clamp01((rmsAverage - 0.018) / 0.06);
  const normalizedVariance = (Math.max(rmsVariance, 0) / 0.006) ** 1.19;
  const emotionScore = clamp01(normalizedVariance);

  return {
    strengthLabel: computeStrengthLabel(loudnessScore),
    strengthScore: Number(loudnessScore.toFixed(2)),
    emotionLabel: computeEmotionLabel(emotionScore),
    emotionScore: Number(emotionScore.toFixed(2)),
    details: {
      rmsAverage: Number(rmsAverage.toFixed(4)),
      rmsVariance: Number(rmsVariance.toFixed(6)),
      pitchVariance: Number((pitchSummary.pitchVariance || 0).toFixed(2)),
      pitchRange: Number((pitchSummary.pitchRange || 0).toFixed(2)),
      durationSeconds: Number(buffer.duration.toFixed(2)),
    },
  };
}
