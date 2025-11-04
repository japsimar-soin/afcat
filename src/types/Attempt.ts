import AIFeedback from "@/interfaces/AIFeedback";

export type Attempt = {
	id: string;
	mode: string;
	status: string;
	storyText?: string;
	ocrText?: string;
	score?: number;
	feedbackJson?: AIFeedback;
	timerSeconds: number;
	createdAt: string;
	image: {
		storageKey: string;
		mode: string;
		source: string;
	};
	answerImage?: {
		storageKey: string;
		format: string;
	};
};