import type { VoiceAnalysisResult } from "./voiceAnalysis";

const STORAGE_KEY = "voiceAnalysisResults";

type StoredResult = {
	sessionId: string;
	timestamp: number;
	strengthScore: number;
	trembleScore: number;
	emotionScore: number;
	tempoScore: number;
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
		trembleScore: result.trembleScore,
		emotionScore: result.emotionScore,
		tempoScore: result.tempoScore ?? 0,
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

export function getVoiceAnalysisSummary(sessionId: string): {
	sampleCount: number;
	averageStrength: number;
	averageTremble: number;
	averageEmotion: number;
	averageTempo: number;
} | null {
	if (typeof window === "undefined") return null;
	const storage = readStorage();
	const results = storage[sessionId];
	if (!results || results.length === 0) return null;

	const total = results.reduce(
		(acc, item) => ({
			strength: acc.strength + item.strengthScore,
			tremble: acc.tremble + item.trembleScore,
			emotion: acc.emotion + item.emotionScore,
			tempo: acc.tempo + (item.tempoScore ?? 0),
		}),
		{ strength: 0, tremble: 0, emotion: 0, tempo: 0 },
	);

	return {
		sampleCount: results.length,
		averageStrength: Number((total.strength / results.length).toFixed(2)),
		averageTremble: Number((total.tremble / results.length).toFixed(2)),
		averageEmotion: Number((total.emotion / results.length).toFixed(2)),
		averageTempo: Number((total.tempo / results.length).toFixed(2)),
	};
}
