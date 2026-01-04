"use client";

import React from "react";

type TimerProps = {
	initialSeconds: number;
	isRunning: boolean;
	onComplete?: () => void;
};

export function Timer({ initialSeconds, isRunning, onComplete }: TimerProps) {
	const [secondsLeft, setSecondsLeft] = React.useState<number>(initialSeconds);
	const prevRunning = React.useRef<boolean>(false);

	React.useEffect(() => {
		let interval: ReturnType<typeof setInterval> | undefined;
		if (isRunning) {
			interval = setInterval(() => {
				setSecondsLeft((prev) => {
					if (prev <= 1) {
						clearInterval(interval);
						onComplete?.();
						return 0;
					}
					return prev - 1;
				});
			}, 1000);
		}
		if (!isRunning && prevRunning.current) {
			setSecondsLeft(initialSeconds);
		}
		prevRunning.current = isRunning;
		return () => interval && clearInterval(interval);
	}, [isRunning, initialSeconds, onComplete]);

	const minutes = Math.floor(secondsLeft / 60)
		.toString()
		.padStart(2, "0");
	const seconds = (secondsLeft % 60).toString().padStart(2, "0");

	return (
		<div className="font-mono text-2xl tabular-nums" aria-live="polite">
			{minutes}:{seconds}
		</div>
	);
}
