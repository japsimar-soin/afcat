import { prisma } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";

export const runtime = "nodejs";

export async function GET() {
	try {
		const { userId } = await auth();
		if (!userId) {
			return new Response(JSON.stringify({ error: "Unauthorized" }), {
				status: 401,
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

		// Get user's attempts with related data
		const attempts = await prisma.attempt.findMany({
			where: { userId: userProfile.id },
			include: {
				image: true,
				answerImage: true,
			},
			orderBy: { createdAt: "desc" },
		});

		return new Response(JSON.stringify({ attempts }), {
			status: 200,
			headers: { "content-type": "application/json" },
		});
	} catch (error) {
		console.error("GET /api/my-attempts error", error);
		return new Response(JSON.stringify({ error: "Internal server error" }), {
			status: 500,
		});
	}
}
