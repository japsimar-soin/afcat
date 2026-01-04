import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
	try {
		const { searchParams } = new URL(req.url);
		const modeParam = searchParams.get("mode");
		const publicOnly = searchParams.get("public") === "true";

		const where: {
			mode?: "PPDT" | "TAT";
			source?: "seed" | "user" | "ai";
		} = {};

		if (modeParam && (modeParam === "PPDT" || modeParam === "TAT")) {
			where.mode = modeParam;
		}

		if (publicOnly) {
			where.source = "seed";
		}

		const images = await prisma.image.findMany({
			where,
			orderBy: { createdAt: "desc" },
		});

		return new Response(JSON.stringify(images), {
			status: 200,
			headers: { "content-type": "application/json" },
		});
	} catch (error) {
		console.error("GET /api/images error", error);
		return new Response(JSON.stringify({ error: "Internal server error" }), {
			status: 500,
		});
	}
}
