"use client";

import { Protect } from "@clerk/nextjs";
import { DashboardCard } from "@/components/dashboard-card";

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
					<DashboardCard
						title={"PPDT Practice"}
						content={
							"Practice Picture Perception and Discussion Test with random images"
						}
					/>
					<DashboardCard
						title={"PPDT Mock"}
						content={
							"Mock Picture Perception and Discussion Test with random images"
						}
					/>
					<DashboardCard
						title={"My Attempts"}
						content={"View and review all your practice attempts"}
					/>
				</div>
			</main>
		</Protect>
	);
}
