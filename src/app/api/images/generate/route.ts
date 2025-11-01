import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { storage } from "@/lib/storage";
import { generateImage } from "@/lib/image-generation/replicate";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

const generateImageSchema = z.object({
  mode: z.enum(["PPDT", "TAT"]),
  prompt: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const validation = generateImageSchema.safeParse(body);
    if (!validation.success) {
      return new Response(
        JSON.stringify({ error: "Invalid request body", issues: validation.error.format() }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { mode, prompt } = validation.data;

    // Generate AI image
    const imageBuffer = await generateImage(
      prompt || `Professional ${mode} test image for military selection assessment`
    );

    // Upload to storage
    const result = await storage.save(
      imageBuffer,
      `ai-generated-${Date.now()}.webp`,
      { contentType: "image/webp" }
    );

    if (!result.success) {
      throw new Error(`Failed to save generated image: ${result.error}`);
    }

    // Create image record in database (safe upsert)
    const image = await prisma.image.upsert({
      where: { checksum: result.checksum! },
      update: {}, // return existing if duplicate
      create: {
        storageKey: result.path!,
        mode,
        source: "ai",
        isPublic: true,
        width: 800,
        height: 600,
        format: "webp",
        bytes: imageBuffer.length,
        checksum: result.checksum!,
      },
    });

    return new Response(
      JSON.stringify({ image }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("POST /api/images/generate error", error);

    return new Response(
      JSON.stringify({
        error: error?.message || "Internal server error",
        details: error?.response?.data || error?.stack || null,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}


// import { NextRequest } from "next/server";
// import { auth } from "@clerk/nextjs/server";
// import { z } from "zod";
// import { storage } from "@/lib/storage";
// import { generateImage } from "@/lib/image-generation/replicate";
// import { prisma } from "@/lib/db";

// export const runtime = "nodejs";

// const generateImageSchema = z.object({
// 	mode: z.enum(["PPDT", "TAT"]),
// 	prompt: z.string().optional(),
// });

// export async function POST(req: NextRequest) {
// 	try {
// 		const { userId } = await auth();
// 		if (!userId) {
// 			return new Response(JSON.stringify({ error: "Unauthorized" }), {
// 				status: 401,
// 			});
// 		}

// 		const body = await req.json();
// 		const validation = generateImageSchema.safeParse(body);
// 		if (!validation.success) {
// 			return new Response(JSON.stringify({ error: "Invalid request body" }), {
// 				status: 400,
// 			});
// 		}

// 		const { mode, prompt } = validation.data;

// 		// Generate AI image
// 		const imageBuffer = await generateImage(
// 			prompt ||
// 				`Professional ${mode} test image for military selection assessment`
// 		);

// 		// Upload to storage
// 		const result = await storage.save(
// 			imageBuffer,
// 			`ai-generated-${Date.now()}.webp`,
// 			{ contentType: "image/webp" }
// 		);

// 		if (!result.success) {
// 			throw new Error(`Failed to save generated image: ${result.error}`);
// 		}

// 		// Create image record in database
// 		// Handle potential duplicate checksum by using upsert
// 		const image = await prisma.image.upsert({
// 			where: {
// 				checksum: result.checksum!,
// 			},
// 			update: {
// 				// If image exists, just return the existing one
// 			},
// 			create: {
// 				storageKey: result.path!,
// 				mode,
// 				source: "ai",
// 				isPublic: true,
// 				width: 800,
// 				height: 600,
// 				format: "webp",
// 				bytes: imageBuffer.length,
// 				checksum: result.checksum!,
// 			},
// 		});

// 		return new Response(JSON.stringify({ image }), {
// 			status: 200,
// 			headers: { "content-type": "application/json" },
// 		});
// 	} catch (error) {
// 		console.error("POST /api/images/generate error", error);
// 		return new Response(JSON.stringify({ error: "Internal server error" }), {
// 			status: 500,
// 		});
// 	}
// }
