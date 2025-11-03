import type { VoiceAnalysisResult } from "./voiceAnalysis";

const STORAGE_KEY = "voiceAnalysisResults";

type StoredResult = {
	sessionId: string;
	timestamp: number;
	strengthScore: number;
	emotionScore: number;
	rmsVariance: number;
	pitchRange: number;
};

type StorageShape = Record<string, StoredResult[]>;

function readStorage(): StorageShape {
	if (typeof window === "undefined") return {};
	try {
		const raw = window.localStorage.getItem(STORAGE_KEY);
		if (!raw) return {};
		const parsed = JSON.parse(raw) as StorageShape;
		return parsed && typeof parsed === "object" ? parsed : {};
	} catch {
		return {};
	}
}

function writeStorage(data: StorageShape): void {
	if (typeof window === "undefined") return;
	try {
		window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
	} catch {
		// ignore quota or serialization errors
	}
}

export function appendVoiceAnalysis(
	sessionId: string,
	result: VoiceAnalysisResult,
): void {
	if (typeof window === "undefined") return;
	const storage = readStorage();
	const entry: StoredResult = {
		sessionId,
		timestamp: Date.now(),
		strengthScore: result.strengthScore,
		emotionScore: result.emotionScore,
		rmsVariance: result.details.rmsVariance,
		pitchRange: result.details.pitchRange,
	};
	if (!storage[sessionId]) {
		storage[sessionId] = [];
	}
	storage[sessionId].push(entry);
	writeStorage(storage);
}

export function clearVoiceAnalysis(sessionId: string): void {
	if (typeof window === "undefined") return;
	const storage = readStorage();
	if (storage[sessionId]) {
		delete storage[sessionId];
		writeStorage(storage);
	}
}

export function getVoiceAnalysisSummary(sessionId: string):
	| {
			sampleCount: number;
			averageStrength: number;
			averageEmotion: number;
			averageRmsVariance: number;
			averagePitchRange: number;
	  }
	| null {
	if (typeof window === "undefined") return null;
	const storage = readStorage();
	const results = storage[sessionId];
	if (!results || results.length === 0) return null;

	const total = results.reduce(
		(acc, item) => ({
			strength: acc.strength + item.strengthScore,
			emotion: acc.emotion + item.emotionScore,
			rmsVariance: acc.rmsVariance + item.rmsVariance,
			pitchRange: acc.pitchRange + item.pitchRange,
		}),
		{ strength: 0, emotion: 0, rmsVariance: 0, pitchRange: 0 },
	);

	const averageRmsVariance = total.rmsVariance / results.length;
	const averagePitchRange = total.pitchRange / results.length;
	return {
		sampleCount: results.length,
		averageStrength: Number((total.strength / results.length).toFixed(2)),
		averageEmotion: Number((total.emotion / results.length).toFixed(2)),
		averageRmsVariance: Number(averageRmsVariance.toFixed(6)),
		averagePitchRange: Number(averagePitchRange.toFixed(2)),
	};
}
