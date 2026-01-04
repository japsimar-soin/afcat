import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SignedIn, SignedOut } from "@clerk/nextjs";

export default function LandingPage() {
	return (
		<main className="min-h-screen grid place-items-center">
			<div className="text-center space-y-6">
				<h1 className="text-4xl font-bold tracking-tight">SSB Prep</h1>
				<p className="text-muted-foreground max-w-prose">
					Practice PPDT and TAT with random images, timers, and quick draft
					saving.
				</p>
				<div className="flex items-center justify-center gap-3">
					<SignedOut>
						<Link href="/sign-in">
							<Button>Sign in</Button>
						</Link>
						<Link href="/sign-up">
							<Button variant="outline">Sign up</Button>
						</Link>
					</SignedOut>
					<SignedIn>
						<Link href="/dashboard">
							<Button>Go to Dashboard</Button>
						</Link>
					</SignedIn>
				</div>
			</div>
		</main>
	);
}
