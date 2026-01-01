import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";

export const runtime = "nodejs";

const updateAttemptSchema = z.object({
	storyText: z.string().optional(),
	answerImageId: z.string().cuid().optional(),
	status: z
		.enum(["in_progress", "completed", "processing", "scored"])
		.optional(),
});

export async function GET(
	req: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const { userId } = await auth();
		if (!userId) {
			return new Response(JSON.stringify({ error: "Unauthorized" }), {
				status: 401,
			});
		}

		const { id } = await params;

		// Get user profile
		const userProfile = await prisma.userProfile.findUnique({
			where: { clerkId: userId },
		});

  // Return error if user is not present
		if (!userProfile) {
			return new Response(JSON.stringify({ error: "User profile not found" }), {
				status: 404,
			});
		}

		// Get attempt with all related data
		const attempt = await prisma.attempt.findFirst({
			where: {
				id,
				userId: userProfile.id, // Ensure user can only access their own attempts
			},
			include: {
				image: true,
				answerImage: true,
				user: true,
			},
		});

		if (!attempt) {
			return new Response(JSON.stringify({ error: "Attempt not found" }), {
				status: 404,
			});
		}

		return new Response(JSON.stringify({ attempt }), {
			status: 200,
			headers: { "content-type": "application/json" },
		});
	} catch (error) {
		console.error("GET /api/attempts/[id] error", error);
		return new Response(JSON.stringify({ error: "Internal server error" }), {
			status: 500,
		});
	}
}

export async function PATCH(
	req: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const { userId } = await auth();
		if (!userId) {
			return new Response(JSON.stringify({ error: "Unauthorized" }), {
				status: 401,
			});
		}

		const { id } = await params;
		const body = await req.json();
		const validation = updateAttemptSchema.safeParse(body);
		if (!validation.success) {
			return new Response(JSON.stringify({ error: "Invalid request body" }), {
				status: 400,
			});
		}

		// Get user profile
		const userProfile = await prisma.userProfile.findUnique({
			where: { clerkId: userId },
		});

		if (!userProfile) {
			return new Response(JSON.stringify({ error: "User profile not found" }), {
				status: 404,
			});
		}

		// Verify attempt belongs to user
		const existingAttempt = await prisma.attempt.findFirst({
			where: {
				id,
				userId: userProfile.id,
			},
		});

		if (!existingAttempt) {
			return new Response(JSON.stringify({ error: "Attempt not found" }), {
				status: 404,
			});
		}

		// Update attempt
		const attempt = await prisma.attempt.update({
			where: { id },
			data: validation.data,
			include: {
				image: true,
				answerImage: true,
				user: true,
			},
		});

		// Enqueue AI analysis if text response is provided
		if (validation.data.storyText && validation.data.storyText.trim()) {
			console.log(`Attempt ${id} updated with story text`);
			try {
				const { enqueueAIAnalysisJob } = await import("@/lib/worker");
				await enqueueAIAnalysisJob(id);
				console.log(`AI analysis job enqueued for attempt ${id}`);
			} catch (error) {
				console.error(
					`Failed to enqueue AI analysis for attempt ${id}:`,
					error
				);
			}
		}

		return new Response(JSON.stringify({ attempt }), {
			status: 200,
			headers: { "content-type": "application/json" },
		});
	} catch (error) {
		console.error("PATCH /api/attempts/[id] error", error);
		return new Response(JSON.stringify({ error: "Internal server error" }), {
			status: 500,
		});
	}
}
