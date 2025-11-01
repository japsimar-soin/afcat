"use client";

import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { UserButton, SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";

export function Navbar() {
	return (
		<header className="w-full border-b">
			<div className="container mx-auto px-4 h-14 flex items-center justify-between">
				<Link href="/" className="font-semibold">
					SSB Prep
				</Link>
				<nav className="flex items-center gap-2">
					<Link href="/dashboard">
						<Button variant="ghost">Dashboard</Button>
					</Link>
					<ThemeToggle />
					<SignedIn>
						<UserButton afterSignOutUrl="/" />
					</SignedIn>
					<SignedOut>
						<SignInButton>
							<Button>Sign in</Button>
						</SignInButton>
					</SignedOut>
				</nav>
			</div>
		</header>
	);
}
