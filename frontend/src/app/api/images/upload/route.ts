import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { storage } from "@/lib/storage";
import sharp from "sharp";
import { fileTypeFromBuffer } from "file-type";
import { z } from "zod";
import { createHash } from "node:crypto";

export const runtime = "nodejs";

const uploadSchema = z.object({
	mode: z.enum(["PPDT", "TAT"]),
	imageData: z.string(), // base64 encoded image
	filename: z.string(),
	attemptId: z.string().optional(), // Optional attempt ID for answer images
});

export async function POST(req: NextRequest) {
	try {
		const { userId } = await auth();
		if (!userId) {
			return new Response(JSON.stringify({ error: "Unauthorized" }), {
				status: 401,
			});
		}

		const body = await req.json();
		const validation = uploadSchema.safeParse(body);
		if (!validation.success) {
			return new Response(JSON.stringify({ error: "Invalid request body" }), {
				status: 400,
			});
		}

		const { mode, imageData } = validation.data;

		// Decode base64 image
		const base64Data = imageData.replace(/^data:image\/\w+;base64,/, "");
		const buffer = Buffer.from(base64Data, "base64");

		// Detect file type
		const fileType = await fileTypeFromBuffer(buffer);
		if (!fileType || !fileType.mime.startsWith("image/")) {
			return new Response(JSON.stringify({ error: "Invalid image format" }), {
				status: 400,
			});
		}

		// Process image with Sharp: resize, convert to WebP, and add white background
		const processedBuffer = await sharp(buffer)
			.resize(800, 600, { fit: "inside", withoutEnlargement: true })
			.flatten({ background: { r: 255, g: 255, b: 255 } }) // Ensure white background
			.webp({ quality: 85 })
			.toBuffer();

		// Generate checksum for deduplication
		const checksum = createHash("md5").update(processedBuffer).digest("hex");

		// Check if image already exists
		const existingImage = await prisma.image.findFirst({
			where: { checksum },
		});

		if (existingImage) {
			return new Response(
				JSON.stringify({
					image: existingImage,
					message: "Image already exists",
				}),
				{
					status: 200,
					headers: { "content-type": "application/json" },
				}
			);
		}

		// Save to storage
		const storageResult = await storage.save(
			processedBuffer,
			`${mode.toLowerCase()}_${Date.now()}.webp`
		);

		if (!storageResult.success) {
			return new Response(JSON.stringify({ error: "Failed to save image" }), {
				status: 500,
			});
		}

		// Upsert user profile
		const userProfile = await prisma.userProfile.upsert({
			where: { clerkId: userId },
			update: {},
			create: { clerkId: userId },
		});

		// Save to database
		const image = await prisma.image.create({
			data: {
				storageKey: storageResult.path!,
				mode,
				source: "user",
				checksum,
				createdBy: { connect: { id: userProfile.id } },
				// Add required fields with default values
				isPublic: false,
				width: 800,
				height: 600,
				format: "webp",
				bytes: processedBuffer.length,
			},
		});

		// If this is an answer image and attemptId is provided, update attempt
		const attemptId = body.attemptId;
		if (attemptId) {
			try {
				// Update attempt with answer image
				await prisma.attempt.update({
					where: { id: attemptId },
					data: { answerImageId: image.id },
				});

				console.log(
					`Updated attempt ${attemptId} with answer image ${image.id}`
				);
			} catch (error) {
				console.error("Failed to update attempt with answer image:", error);
			}
		}

		return new Response(JSON.stringify({ image }), {
			status: 201,
			headers: { "content-type": "application/json" },
		});
	} catch (error) {
		console.error("POST /api/images/upload error", error);
		return new Response(JSON.stringify({ error: "Internal server error" }), {
			status: 500,
		});
	}
}
