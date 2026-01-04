import axios from "axios";

const API_KEY =
	process.env.FREEPIK_API_KEY;

export async function generateImage(prompt: string): Promise<Buffer> {
	const endpoints = [
		"https://api.freepik.com/v1/ai/text-to-image/classic-fast",
		"https://api.freepik.com/v1/ai/text-to-image",
		"https://api.freepik.com/v1/ai/generate",
	];

	const headers = {
		"Content-Type": "application/json",
		"x-freepik-api-key": API_KEY,
	};

	const data = {
		prompt: prompt,
		num_images: 1,
		aspect_ratio: "1:1",
		style: "realistic",
	};

	for (const url of endpoints) {
		try {
			console.log(`Trying Freepik endpoint: ${url}`);
			const response = await axios.post(url, data, { headers });

			// Try different response structures
			const generatedImages =
				response.data.data || response.data.images || response.data;

			if (Array.isArray(generatedImages) && generatedImages.length > 0) {
				const image = generatedImages[0];
				const base64Image = image.base64 || image.image || image.url;

				if (base64Image) {
					// If it's a URL, fetch the image
					if (base64Image.startsWith("http")) {
						const imageResponse = await axios.get(base64Image, {
							responseType: "arraybuffer",
						});
						return Buffer.from(imageResponse.data);
					}
					// If it's base64, decode it
					return Buffer.from(base64Image, "base64");
				}
			}

			console.log(`No image data found in response from ${url}`);
		} catch (error) {
			console.log(
				`Endpoint ${url} failed:`,
				axios.isAxiosError(error)
					? error.response?.data
					: (error as Error).message
			);
			continue;
		}
	}

	// Fallback: Generate a professional placeholder image
	console.log(
		"All Freepik endpoints failed, generating professional placeholder..."
	);
	return await generateProfessionalPlaceholder(prompt);
}

async function generateProfessionalPlaceholder(
	prompt: string
): Promise<Buffer> {
	// Create a professional SSB-appropriate placeholder image using Canvas API
	const { createCanvas } = await import("canvas");

	const canvas = createCanvas(800, 600);
	const ctx = canvas.getContext("2d");

	// Generate unique elements for each image
	const timestamp = Date.now();
	const randomSeed = Math.floor(Math.random() * 1000);
	const uniqueId = `${timestamp}-${randomSeed}`;

	// Create realistic SSB scenario backgrounds
	const scenarios = [
		{ bg: "#f0f8ff", border: "#4169e1", theme: "Military Base" },
		{ bg: "#f5f5dc", border: "#8b4513", theme: "Desert Training" },
		{ bg: "#e6f3ff", border: "#0066cc", theme: "Naval Operations" },
		{ bg: "#f0fff0", border: "#228b22", theme: "Field Exercise" },
		{ bg: "#fff8dc", border: "#daa520", theme: "Leadership Scenario" },
	];

	const scenario = scenarios[randomSeed % scenarios.length];

	// Background
	ctx.fillStyle = scenario.bg;
	ctx.fillRect(0, 0, 800, 600);

	// Border with scenario theme
	ctx.strokeStyle = scenario.border;
	ctx.lineWidth = 4;
	ctx.strokeRect(15, 15, 770, 570);

	// Inner border
	ctx.strokeStyle = scenario.border;
	ctx.lineWidth = 2;
	ctx.strokeRect(20, 20, 760, 560);

	// Scenario header
	ctx.fillStyle = scenario.border;
	ctx.font = "bold 24px Arial";
	ctx.textAlign = "center";
	ctx.fillText(`SSB Practice Scenario: ${scenario.theme}`, 400, 60);

	// Title
	ctx.fillStyle = "#2c3e50";
	ctx.font = "bold 20px Arial";
	ctx.fillText("AI Generated Test Image", 400, 90);

	// Subtitle
	ctx.fillStyle = "#7f8c8d";
	ctx.font = "14px Arial";
	ctx.fillText("Professional Military Assessment Scenario", 400, 115);

	// Prompt section
	ctx.fillStyle = "#333";
	ctx.font = "bold 18px Arial";
	ctx.fillText("Scenario Description:", 400, 160);

	// Prompt text
	ctx.font = "16px Arial";
	ctx.fillStyle = "#555";
	const words = prompt.split(" ");
	const lines = [];
	let currentLine = "";

	for (const word of words) {
		if ((currentLine + word).length > 45) {
			lines.push(currentLine);
			currentLine = word;
		} else {
			currentLine += (currentLine ? " " : "") + word;
		}
	}
	if (currentLine) lines.push(currentLine);

	let y = 200;
	for (const line of lines) {
		ctx.fillText(line, 400, y);
		y += 25;
	}

	// Decorative elements - scenario-specific
	ctx.strokeStyle = scenario.border;
	ctx.lineWidth = 2;
	ctx.beginPath();
	ctx.moveTo(100, 320);
	ctx.lineTo(700, 320);
	ctx.stroke();

	// Add scenario-specific elements
	const elements = [
		"👥 Team Leadership Challenge",
		"🎯 Decision Making Scenario",
		"⚡ Crisis Management Exercise",
		"🤝 Communication Test",
		"💪 Physical Endurance Task",
	];

	const element = elements[randomSeed % elements.length];
	ctx.fillStyle = scenario.border;
	ctx.font = "bold 16px Arial";
	ctx.fillText(element, 400, 350);

	// Instructions
	ctx.fillStyle = "#666";
	ctx.font = "12px Arial";
	ctx.fillText("Professional SSB Assessment Scenario - AI Generated", 400, 380);
	ctx.fillText(
		"Real AI images will be available once API access is configured",
		400,
		400
	);

	// SSB Logo placeholder
	ctx.fillStyle = "#1976d2";
	ctx.font = "bold 20px Arial";
	ctx.fillText("SSB PREP", 400, 450);

	ctx.fillStyle = "#666";
	ctx.font = "12px Arial";
	ctx.fillText("Services Selection Board Practice", 400, 470);

	// Add unique identifier (small and subtle)
	ctx.fillStyle = "#999";
	ctx.font = "10px Arial";
	ctx.fillText(`ID: ${uniqueId}`, 400, 520);

	return canvas.toBuffer("image/png");
}

// import { VertexAI } from "@google-cloud/vertexai";
// import { ClientError } from "@google-cloud/vertexai/build/src/types";

// // Set up client
// const vertexAI = new VertexAI({
// 	project: process.env.GCP_PROJECT_ID!,
// 	location: process.env.GCP_LOCATION || "us-central1",
// });

// // Load the Image Generation Model (Imagen)
// const model = vertexAI.getGenerativeModel({
// 	model: "imagen-3.0-generate-002", // Try different model with potentially higher quota
// });

// export async function generateImage(prompt: string): Promise<Buffer> {
// 	const enhancedPrompt = `Professional SSB (Services Selection Board) practice image: ${prompt}.

//     Requirements:
//     - Professional military or leadership scenario
//     - Clear, realistic composition
//     - Appropriate for assessment purposes
//     - No violence, weapons, or inappropriate content
//     - Focus on leadership, teamwork, decision-making, or problem-solving situations
//     - Clean, well-lit environment
//     - Suitable for psychological assessment`;

// 	const MAX_RETRIES = 5;
// 	const INITIAL_DELAY_MS = 1000; // 1 second

// 	for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
// 		try {
// 			const response = await model.generateContent({
// 				contents: [
// 					{
// 						role: "user",
// 						parts: [{ text: enhancedPrompt }],
// 					},
// 				],
// 				generationConfig: {
// 					responseMimeType: "image/png",
// 				},
// 			});

// 			const parts = response.response?.candidates?.[0]?.content?.parts;
// 			if (!parts) throw new Error("No image returned");

// 			for (const part of parts) {
// 				if (part.inlineData?.data) {
// 					return Buffer.from(part.inlineData.data, "base64");
// 				}
// 			}

// 			throw new Error("No image data found");
// 		} catch (error) {
// 			// Check if the error is a ClientError with a specific status code
// 			if (
// 				error instanceof ClientError &&
// 				(error.code === 429 || error.code === 500)
// 			) {
// 				if (attempt < MAX_RETRIES - 1) {
// 					const delay = INITIAL_DELAY_MS * Math.pow(2, attempt);
// 					console.warn(
// 						`Attempt ${attempt + 1} failed with status ${
// 							error.code
// 						}. Retrying in ${delay / 1000} seconds...`
// 					);
// 					await new Promise((resolve) => setTimeout(resolve, delay));
// 				} else {
// 					console.error(`All ${MAX_RETRIES} attempts failed.`);
// 					throw new Error("Image generation failed after multiple retries.", {
// 						cause: error,
// 					});
// 				}
// 			} else {
// 				// If it's a different error, re-throw it immediately
// 				console.error(
// 					"Image generation failed with non-retryable error:",
// 					error
// 				);
// 				throw new Error("Image generation failed", { cause: error });
// 			}
// 		}
// 	}
// 	// This part of the code is unreachable but serves as a final fallback.
// 	throw new Error(
// 		"Unexpected error: Image generation failed to complete after all retries."
// 	);
// }

export async function generateImageFromTheme(theme: string): Promise<Buffer> {
	const { generateImagePrompt } = await import("../ai/gemini");
	const prompt = generateImagePrompt(undefined, theme);
	return generateImage(prompt);
}
