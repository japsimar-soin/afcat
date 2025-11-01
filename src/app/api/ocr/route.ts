import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { ImageAnnotatorClient } from "@google-cloud/vision";
import sharp from "sharp";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";

const ocrSchema = z.object({
	imageId: z.string(),
});

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

export async function POST(req: NextRequest) {
	try {
		const { userId } = await auth();
		if (!userId) {
			return new Response(JSON.stringify({ error: "Unauthorized" }), {
				status: 401,
			});
		}

		const body = await req.json();
		const validation = ocrSchema.safeParse(body);
		if (!validation.success) {
			return new Response(JSON.stringify({ error: "Invalid request body" }), {
				status: 400,
			});
		}

		const { imageId } = validation.data;

		// Get the image from database
		const image = await prisma.image.findUnique({
			where: { id: imageId },
		});

		if (!image) {
			return new Response(JSON.stringify({ error: "Image not found" }), {
				status: 404,
			});
		}

		// Construct the image path
		// For user uploaded images, storageKey doesn't include /uploads/ prefix
		const imagePath = image.storageKey.startsWith("/")
			? path.join(process.cwd(), "public", image.storageKey)
			: path.join(process.cwd(), "public", "uploads", image.storageKey);

		console.log(`OCR: Processing image ${imageId}, path: ${imagePath}`);

		if (!fs.existsSync(imagePath)) {
			console.error(`OCR: Image file not found at ${imagePath}`);
			return new Response(JSON.stringify({ error: "Image file not found" }), {
				status: 404,
			});
		}

		let extractedText = "";

		if (visionClient) {
			try {
				// Read and preprocess the image
				const imageBuffer = fs.readFileSync(imagePath);
				const processedBuffer = await sharp(imageBuffer)
					.grayscale()
					.normalize()
					.resize(1200, null, { withoutEnlargement: true })
					.png()
					.toBuffer();

				// Perform OCR using Google Cloud Vision
				const [result] = await visionClient.documentTextDetection({
					image: { content: processedBuffer },
				});

				const detections = result.textAnnotations;
				if (detections && detections.length > 0) {
					extractedText = detections[0].description || "";
				}
			} catch (error) {
				console.error("Google Cloud Vision OCR failed:", error);
				// Fall back to mock OCR
				extractedText =
					"OCR processing failed. Please type your response manually.";
			}
		} else {
			// Fallback when Google Cloud Vision is not configured
			extractedText = "OCR not configured. Please type your response manually.";
		}

		return new Response(JSON.stringify({ text: extractedText }), {
			status: 200,
			headers: { "content-type": "application/json" },
		});
	} catch (error) {
		console.error("POST /api/ocr error", error);
		return new Response(JSON.stringify({ error: "Internal server error" }), {
			status: 500,
		});
	}
}
