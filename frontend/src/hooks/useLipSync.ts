"use client";

import { useEffect, useRef, useState } from "react";

interface UseLipSyncOptions {
	smoothing?: number; // 0.0 to 1.0, higher = smoother
	threshold?: number; // Minimum volume to trigger mouth movement
}

export function useLipSync(
	audioElement: HTMLAudioElement | null,
	options: UseLipSyncOptions = {},
) {
	const { smoothing = 0.8, threshold = 0.01 } = options;
	const [lipSyncValue, setLipSyncValue] = useState(0);
	const analyserRef = useRef<AnalyserNode | null>(null);
	const dataArrayRef = useRef<Uint8Array | null>(null);
	const animationFrameRef = useRef<number | null>(null);

	useEffect(() => {
		if (!audioElement) return;

		// Create audio context and analyser
		const audioContext = new AudioContext();
		const analyser = audioContext.createAnalyser();
		analyser.fftSize = 256;
		analyser.smoothingTimeConstant = smoothing;

		const bufferLength = analyser.frequencyBinCount;
		const dataArray = new Uint8Array(bufferLength);

		// Connect audio element to analyser
		const source = audioContext.createMediaElementSource(audioElement);
		source.connect(analyser);
		analyser.connect(audioContext.destination);

		analyserRef.current = analyser;
		dataArrayRef.current = dataArray;

		// Animation loop to update lip sync value
		const updateLipSync = () => {
			if (!analyserRef.current || !dataArrayRef.current) return;

			analyserRef.current.getByteFrequencyData(dataArrayRef.current);

			// Calculate average volume from frequency data
			const sum = dataArrayRef.current.reduce((acc, val) => acc + val, 0);
			const average = sum / dataArrayRef.current.length;

			// Normalize to 0-1 range
			const normalizedValue = Math.min(average / 128, 1);

			// Apply threshold
			const finalValue = normalizedValue > threshold ? normalizedValue : 0;

			setLipSyncValue(finalValue);

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
	}, [audioElement, smoothing, threshold]);

	return lipSyncValue;
}
