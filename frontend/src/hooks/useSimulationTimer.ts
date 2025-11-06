import { useEffect, useState } from "react";

interface UseSimulationTimerProps {
	conversationStarted: boolean;
	onTimeout?: () => void;
}

export function useSimulationTimer({
	conversationStarted,
	onTimeout,
}: UseSimulationTimerProps) {
	const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

	// Start timer
	const startTimer = (durationSeconds: number) => {
		setTimeRemaining(durationSeconds);
	};

	// Stop timer
	const stopTimer = () => {
		setTimeRemaining(null);
	};

	// Countdown effect
	useEffect(() => {
		let interval: NodeJS.Timeout | null = null;

		if (conversationStarted && timeRemaining !== null) {
			interval = setInterval(() => {
				setTimeRemaining((prev) => {
					if (prev === null) return prev;
					const next = prev - 1;
					if (next < 0) {
						if (interval) clearInterval(interval);
						return 0;
					}
					return next;
				});
			}, 1000);
		}

		return () => {
			if (interval) clearInterval(interval);
		};
	}, [conversationStarted, timeRemaining]);

	// Timeout effect
	useEffect(() => {
		if (timeRemaining === 0 && conversationStarted && onTimeout) {
			console.log("Time reached 0, triggering timeout callback");
			onTimeout();
		}
	}, [timeRemaining, conversationStarted, onTimeout]);

	return {
		timeRemaining,
		startTimer,
		stopTimer,
	};
}
