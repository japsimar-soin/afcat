"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Protect } from "@clerk/nextjs";

export default function DashboardPage() {
	return (
		<Protect>
			<main className="container mx-auto px-4 py-6">
				<div className="mb-8">
					<h1 className="text-3xl font-bold">SSB Practice Dashboard</h1>
					<p className="text-muted-foreground">
						Choose your practice mode to get started
					</p>
				</div>

				<div className="grid gap-6 md:grid-cols-3 auto-rows-fr items-stretch">
					<Link href="/practice/ppdt" className="block h-full">
						<Card className="h-full min-h-[160px] hover:shadow-lg transition-shadow cursor-pointer">
							<CardHeader>
								<CardTitle>PPDT Practice</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="text-muted-foreground">
									Practice Picture Perception and Discussion Test with random
									images
								</p>
							</CardContent>
						</Card>
					</Link>

					<Link href="/practice/tat" className="block h-full">
						<Card className="h-full min-h-[160px] hover:shadow-lg transition-shadow cursor-pointer">
							<CardHeader>
								<CardTitle>TAT Practice</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="text-muted-foreground">
									Practice Thematic Apperception Test with random images
								</p>
							</CardContent>
						</Card>
					</Link>

					<Link href="/my-attempts" className="block h-full">
						<Card className="h-full min-h-[160px] hover:shadow-lg transition-shadow cursor-pointer">
							<CardHeader>
								<CardTitle>My Attempts</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="text-muted-foreground">
									View and review all your practice attempts
								</p>
							</CardContent>
						</Card>
					</Link>
				</div>
			</main>
		</Protect>
	);
}
