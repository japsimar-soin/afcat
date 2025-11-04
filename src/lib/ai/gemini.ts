import { GoogleGenerativeAI } from "@google/generative-ai";
import AttemptAnalysis from "@/interfaces/AttemptANalysis";
import AttemptWithRelations from "@/interfaces/AttemptWithRelations";
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const ANALYSIS_PROMPT = `You are an expert SSB (Services Selection Board) evaluator analyzing practice responses for PPDT/TAT tests. 

Analyze the following response and provide structured feedback:

**Context:**
- Test Type: {mode}
- Stimulus Image: {stimulusDescription}
- User Response: {userResponse}
- OCR Text (if available): {ocrText}

**Evaluation Criteria:**
1. **Story Structure**: Logical flow, beginning-middle-end
2. **Character Development**: Well-defined protagonist with clear motivations
3. **Conflict Resolution**: How problems are identified and solved
4. **Leadership Qualities**: Initiative, decision-making, responsibility
5. **Creativity**: Original thinking, innovative solutions
6. **Communication**: Clarity, coherence, language skills
7. **Values & Ethics**: Moral judgment, social responsibility

**Sample Good Response:**
"A young officer notices a group of children playing near a construction site. Concerned for their safety, he immediately takes action by cordoning off the area and speaking to the construction supervisor. He then organizes a community meeting to discuss child safety and proposes building a playground in a safer location. The story shows leadership, problem-solving, and social responsibility."

**Sample Poor Response:**
"The man is walking. He sees something. He goes home. The end."
(This lacks structure, character development, and meaningful content)

**Your Analysis:**
Provide a JSON response with the following structure:
{
  "score_overall": 85,
  "strengths": ["Clear leadership demonstrated", "Good problem-solving approach"],
  "weaknesses": ["Could develop characters more", "Ending feels rushed"],
  "personality_traits": {
    "leadership": 8,
    "creativity": 7,
    "analytical_thinking": 6,
    "emotional_intelligence": 8,
    "communication": 7
  },
  "suggested_rewrite": "A more detailed version with better character development...",
  "explanation": "This response shows strong leadership qualities but needs improvement in..."
}

Score ranges: 0-100 (0-40: Poor, 41-60: Below Average, 61-75: Average, 76-85: Good, 86-95: Very Good, 96-100: Excellent)
Personality traits: 1-10 scale (1-3: Low, 4-6: Average, 7-8: Good, 9-10: Excellent)

Respond only with valid JSON.`;

export async function analyzeAttempt(
	attempt: AttemptWithRelations
): Promise<AttemptAnalysis> {
	try {
		// Build the prompt with attempt data
		const prompt = ANALYSIS_PROMPT.replace("{mode}", attempt.mode)
			.replace(
				"{stimulusDescription}",
				attempt.image?.storageKey || "Unknown image"
			)
			.replace("{userResponse}", attempt.storyText || "No text response")
			.replace("{ocrText}", attempt.ocrText || "No OCR text available");

		const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

		const result = await model.generateContent([
			"You are an expert SSB evaluator. Provide only valid JSON responses.\n\n" +
				prompt,
		]);

		const response = await result.response;
		const responseText = response.text();
		if (!responseText) {
			throw new Error("No response from Gemini");
		}

		// Parse the JSON response - handle markdown code blocks
		let jsonText = responseText.trim();

		// Remove markdown code blocks if present
		if (jsonText.startsWith("```json")) {
			jsonText = jsonText.replace(/^```json\s*/, "").replace(/\s*```$/, "");
		} else if (jsonText.startsWith("```")) {
			jsonText = jsonText.replace(/^```\s*/, "").replace(/\s*```$/, "");
		}

		const analysis: AttemptAnalysis = JSON.parse(jsonText);

		// Add metadata
		analysis.metadata = {
			model: "gemini-1.5-flash",
			prompt_version: "1.0",
			timestamp: new Date().toISOString(),
		};

		// Validate and normalize scores
		analysis.score_overall = Math.max(0, Math.min(100, analysis.score_overall));

		// Normalize personality traits
		Object.keys(analysis.personality_traits).forEach((trait) => {
			analysis.personality_traits[
				trait as keyof typeof analysis.personality_traits
			] = Math.max(
				1,
				Math.min(
					10,
					analysis.personality_traits[
						trait as keyof typeof analysis.personality_traits
					]
				)
			);
		});

		return analysis;
	} catch (error) {
		console.error("OpenAI analysis failed:", error);

		// Return fallback analysis
		return {
			score_overall: 50,
			strengths: ["Response submitted successfully"],
			weaknesses: ["Analysis temporarily unavailable"],
			personality_traits: {
				leadership: 5,
				creativity: 5,
				analytical_thinking: 5,
				emotional_intelligence: 5,
				communication: 5,
			},
			suggested_rewrite: "Please try again later for detailed feedback.",
			explanation: "AI analysis service is temporarily unavailable.",
			metadata: {
				model: "fallback",
				prompt_version: "1.0",
				timestamp: new Date().toISOString(),
			},
		};
	}
}

// Helper function to generate image generation prompts
export function generateImagePrompt(
	seedImageId?: string,
	theme?: string
): string {
	const basePrompts = {
		PPDT: [
			"A dramatic scene showing leadership and decision-making in a challenging situation",
			"People working together to solve a complex problem in a professional setting",
			"A moment of crisis that requires quick thinking and moral judgment",
			"A group of individuals collaborating on an important project",
		],
		TAT: [
			"An emotional moment between people showing deep human connection",
			"A person facing a difficult choice with serious consequences",
			"A scene of achievement and celebration after overcoming obstacles",
			"A quiet moment of reflection and personal growth",
		],
	};

	if (theme) {
		return `High-quality photograph: ${theme}. Professional lighting, clear composition, realistic details.`;
	}

	const mode = seedImageId ? "PPDT" : "TAT";
	const prompts = basePrompts[mode as keyof typeof basePrompts];
	const randomPrompt = prompts[Math.floor(Math.random() * prompts.length)];

	return `High-quality photograph: ${randomPrompt}. Professional lighting, clear composition, realistic details, 4K resolution.`;
}
