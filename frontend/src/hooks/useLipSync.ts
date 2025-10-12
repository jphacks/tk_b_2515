"use client";

import { useEffect, useRef, useState } from "react";

interface UseLipSyncOptions {
	smoothing?: number; // 0.0 to 1.0, higher = smoother
	threshold?: number; // Minimum volume to trigger mouth movement
	frequencyRange?: { min: number; max: number }; // 人間の音声周波数範囲
	attackTime?: number; // 口が開くまでの時間（ミリ秒）
	releaseTime?: number; // 口が閉じるまでの時間（ミリ秒）
}

export function useLipSync(
	audioElement: HTMLAudioElement | null,
	options: UseLipSyncOptions = {},
) {
	const {
		smoothing = 0.8,
		threshold = 0.01,
		frequencyRange = { min: 300, max: 3400 }, // 人間の音声範囲
		attackTime = 50,
		releaseTime = 100,
	} = options;

	const [lipSyncValue, setLipSyncValue] = useState(0);
	const analyserRef = useRef<AnalyserNode | null>(null);
	const dataArrayRef = useRef<Uint8Array | null>(null);
	const animationFrameRef = useRef<number | null>(null);
	const targetValueRef = useRef(0);
	const currentValueRef = useRef(0);
	const lastUpdateTimeRef = useRef(Date.now());

	useEffect(() => {
		if (!audioElement) return;

		// Create audio context and analyser
		const audioContext = new AudioContext();
		const analyser = audioContext.createAnalyser();
		analyser.fftSize = 2048; // より高精度な分析
		analyser.smoothingTimeConstant = smoothing;

		const bufferLength = analyser.frequencyBinCount;
		const dataArray = new Uint8Array(bufferLength);

		// Connect audio element to analyser
		const source = audioContext.createMediaElementSource(audioElement);
		source.connect(analyser);
		analyser.connect(audioContext.destination);

		analyserRef.current = analyser;
		dataArrayRef.current = dataArray;

		// 周波数範囲から対応するビンインデックスを計算
		const sampleRate = audioContext.sampleRate;
		const minBin = Math.floor(
			(frequencyRange.min * analyser.fftSize) / sampleRate,
		);
		const maxBin = Math.floor(
			(frequencyRange.max * analyser.fftSize) / sampleRate,
		);

		// Animation loop to update lip sync value
		const updateLipSync = () => {
			if (!analyserRef.current || !dataArrayRef.current) return;

			// TypeScriptの型の問題を回避（実行時は問題なし）
			// @ts-expect-error - Uint8Array type compatibility issue with ArrayBufferLike
			analyserRef.current.getByteFrequencyData(dataArrayRef.current);

			// 人間の音声周波数範囲のみを分析
			let sum = 0;
			let count = 0;
			for (let i = minBin; i <= maxBin && i < dataArrayRef.current.length; i++) {
				sum += dataArrayRef.current[i];
				count++;
			}

			const average = count > 0 ? sum / count : 0;

			// Normalize to 0-1 range (より動的な範囲)
			const normalizedValue = Math.min(average / 180, 1);

			// Apply threshold
			targetValueRef.current =
				normalizedValue > threshold ? normalizedValue : 0;

			// スムーズなアニメーション（アタック/リリース）
			const now = Date.now();
			const deltaTime = now - lastUpdateTimeRef.current;
			lastUpdateTimeRef.current = now;

			const current = currentValueRef.current;
			const target = targetValueRef.current;

			let newValue: number;
			if (target > current) {
				// アタック（口を開く）
				const attackRate = deltaTime / attackTime;
				newValue = Math.min(current + (target - current) * attackRate, target);
			} else {
				// リリース（口を閉じる）
				const releaseRate = deltaTime / releaseTime;
				newValue = Math.max(
					current - (current - target) * releaseRate,
					target,
				);
			}

			currentValueRef.current = newValue;
			setLipSyncValue(newValue);

			animationFrameRef.current = requestAnimationFrame(updateLipSync);
		};

		// Start when audio plays
		const handlePlay = () => {
			if (audioContext.state === "suspended") {
				audioContext.resume();
			}
			updateLipSync();
		};

		// Stop when audio pauses or ends
		const handlePause = () => {
			if (animationFrameRef.current) {
				cancelAnimationFrame(animationFrameRef.current);
				animationFrameRef.current = null;
			}
			setLipSyncValue(0);
		};

		audioElement.addEventListener("play", handlePlay);
		audioElement.addEventListener("pause", handlePause);
		audioElement.addEventListener("ended", handlePause);

		return () => {
			if (animationFrameRef.current) {
				cancelAnimationFrame(animationFrameRef.current);
			}
			audioElement.removeEventListener("play", handlePlay);
			audioElement.removeEventListener("pause", handlePause);
			audioElement.removeEventListener("ended", handlePause);
			audioContext.close();
		};
	}, [
		audioElement,
		smoothing,
		threshold,
		frequencyRange.min,
		frequencyRange.max,
		attackTime,
		releaseTime,
	]);

	return lipSyncValue;
}
