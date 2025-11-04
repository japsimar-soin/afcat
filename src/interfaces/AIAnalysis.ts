export default interface AIAnalysis {
	score_overall: number;
	strengths: string[];
	weaknesses: string[];
	personality_traits: {
		leadership: number;
		creativity: number;
		analytical_thinking: number;
		emotional_intelligence: number;
		communication: number;
	};
	suggested_rewrite: string;
	explanation: string;
	metadata: {
		model: string;
		prompt_version: string;
		timestamp: string;
	};
}