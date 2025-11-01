import { config } from "dotenv";
config(); // Load environment variables from .env file

import { Queue, Worker, Job } from "bullmq";
import { ImageAnnotatorClient } from "@google-cloud/vision";
import { PrismaClient } from "@prisma/client";
import sharp from "sharp";
import { storage } from "../src/lib/storage";
import { analyzeAttempt } from "../src/lib/ai/gemini";
import { generateImage } from "../src/lib/image-generation/replicate";

const prisma = new PrismaClient();

// Initialize Google Cloud Vision client
let visionClient: ImageAnnotatorClient | null = null;
if (
	process.env.GCP_PROJECT_ID &&
	process.env.VISION_CLIENT_EMAIL &&
	process.env.VISION_PRIVATE_KEY
) {
	visionClient = new ImageAnnotatorClient({
		projectId: process.env.GCP_PROJECT_ID,
		credentials: {
			client_email: process.env.VISION_CLIENT_EMAIL,
			private_key: process.env.VISION_PRIVATE_KEY.replace(/\\n/g, "\n"),
		},
	});
}

// Create queues
const ocrQueue = new Queue("ocr-run", {
	connection: {
		url: process.env.REDIS_URL || "redis://localhost:6379",
	},
});

const aiAnalysisQueue = new Queue("ai-analyze", {
	connection: {
		url: process.env.REDIS_URL || "redis://localhost:6379",
	},
});

const imageGenerationQueue = new Queue("image-generate", {
	connection: {
		url: process.env.REDIS_URL || "redis://localhost:6379",
	},
});

// OCR Job Processor
const ocrWorker = new Worker(
	"ocr-run",
	async (job: Job) => {
		const { attemptId } = job.data;
		console.log(`Processing OCR for attempt: ${attemptId}`);

		try {
			// Get attempt with answer image
			const attempt = await prisma.attempt.findUnique({
				where: { id: attemptId },
				include: {
					answerImage: true,
				},
			});

			if (!attempt || !attempt.answerImageId) {
				throw new Error("Attempt or answer image not found");
			}

			// Download image from storage
			if (!attempt.answerImage) {
				throw new Error("Answer image not found");
			}
			const imageUrl = storage.getUrl(attempt.answerImage.storageKey);
			const response = await fetch(imageUrl);
			const imageBuffer = await response.arrayBuffer();

			// Preprocess image for better OCR
			const processedBuffer = await sharp(Buffer.from(imageBuffer))
				.grayscale()
				.normalize()
				.threshold(128) // Optional: add threshold for better text detection
				.toBuffer();

			let ocrText = "";
			let confidence = 0;
			let provider = "";

			// Try Google Cloud Vision first
			if (visionClient) {
				try {
					const [result] = await visionClient.documentTextDetection(
						processedBuffer
					);
					const detections = result.fullTextAnnotation;

					if (detections && detections.text) {
						ocrText = detections.text;
						confidence = 0.9; // High confidence for Google Vision
						provider = "google-cloud-vision";
						console.log("Google Cloud Vision OCR successful");
					}
				} catch (error) {
					console.log("Google Cloud Vision failed, using fallback:", error);
				}
			}

			// Fallback OCR if needed
			if (!ocrText) {
				// Implement fallback OCR here (e.g., Tesseract.js)
				ocrText = "Fallback OCR text";
				confidence = 0.5;
				provider = "fallback-ocr";
			}

			// Update attempt with OCR results
			await prisma.attempt.update({
				where: { id: attemptId },
				data: {
					ocrText,
					ocrProvider: provider,
					ocrConfidence: confidence,
					status: "processed",
				},
			});

			// Enqueue AI analysis if we have OCR text
			if (ocrText.trim()) {
				await aiAnalysisQueue.add(
					"ai-analyze",
					{ attemptId },
					{
						delay: 1000, // 1 second delay
						attempts: 3,
						backoff: {
							type: "exponential",
							delay: 2000,
						},
					}
				);
			}

			console.log(`OCR completed for attempt: ${attemptId}`);
		} catch (error) {
			console.error(`OCR failed for attempt ${attemptId}:`, error);
			throw error;
		}
	},
	{
		connection: {
			url: process.env.REDIS_URL || "redis://localhost:6379",
		},
		concurrency: 2,
	}
);

// AI Analysis Job Processor
const aiAnalysisWorker = new Worker(
	"ai-analyze",
	async (job: Job) => {
		const { attemptId } = job.data;
		console.log(`Processing AI analysis for attempt: ${attemptId}`);

		try {
			// Get attempt with all related data
			const attempt = await prisma.attempt.findUnique({
				where: { id: attemptId },
				include: {
					image: true,
					answerImage: true,
					user: true,
				},
			});

			if (!attempt) {
				throw new Error("Attempt not found");
			}

			// Run AI analysis
			const analysis = await analyzeAttempt(attempt);

			// Update attempt with analysis results
			await prisma.attempt.update({
				where: { id: attemptId },
				data: {
					feedbackJson: analysis as any,
					score: analysis.score_overall,
					status: "scored",
				},
			});

			console.log(`AI analysis completed for attempt: ${attemptId}`);
		} catch (error) {
			console.error(`AI analysis failed for attempt ${attemptId}:`, error);
			throw error;
		}
	},
	{
		connection: {
			url: process.env.REDIS_URL || "redis://localhost:6379",
		},
		concurrency: 1, // Limit concurrency for AI API calls
	}
);

// Image Generation Job Processor
const imageGenerationWorker = new Worker(
	"image-generate",
	async (job: Job) => {
		const { prompt, seedImageId, theme } = job.data;
		console.log(`Processing image generation: ${prompt}`);

		try {
			// Generate image using Replicate
			const imageBuffer = await generateImage(prompt);

			// Upload generated image to storage
			const result = await storage.save(
				imageBuffer,
				`generated-${Date.now()}.webp`,
				{ contentType: "image/webp" }
			);

			if (!result.success) {
				throw new Error(`Failed to save generated image: ${result.error}`);
			}

			// Create image record in database
			const image = await prisma.image.create({
				data: {
					storageKey: result.path!,
					mode: "PPDT", // Default mode
					source: "ai",
					isPublic: false,
					width: 800,
					height: 600,
					format: "webp",
					bytes: imageBuffer.length,
					checksum: result.checksum!,
				},
			});

			console.log(`Image generation completed: ${image.id}`);
			return { imageId: image.id, storageKey: result.path };
		} catch (error) {
			console.error("Image generation failed:", error);
			throw error;
		}
	},
	{
		connection: {
			url: process.env.REDIS_URL || "redis://localhost:6379",
		},
		concurrency: 1,
	}
);

// Error handling
ocrWorker.on("error", (error) => {
	console.error("OCR Worker error:", error);
});

aiAnalysisWorker.on("error", (error) => {
	console.error("AI Analysis Worker error:", error);
});

imageGenerationWorker.on("error", (error) => {
	console.error("Image Generation Worker error:", error);
});

// Graceful shutdown
process.on("SIGTERM", async () => {
	console.log("Shutting down workers...");
	await ocrWorker.close();
	await aiAnalysisWorker.close();
	await imageGenerationWorker.close();
	await prisma.$disconnect();
	process.exit(0);
});

console.log("Background workers started");

export { ocrQueue, aiAnalysisQueue, imageGenerationQueue };
