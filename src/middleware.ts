import { clerkMiddleware } from "@clerk/nextjs/server";

export const runtime = "nodejs";

export default clerkMiddleware(() => {
	// No-op: protection handled at component level with <Protect />
});

export const config = {
	matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
