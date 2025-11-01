"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Protect } from "@clerk/nextjs";
import Image from "next/image";

interface AIFeedback {
	score_overall: number;
	strengths: string[];
	weaknesses: string[];
	personality_traits: {
		leadership: number;
		creativity: number;
		analytical_thinking: number;
		emotional_intelligence: number;
		communication: number;
	};
	
	suggested_rewrite: string;
	explanation: string;
	metadata: {
		model: string;
		prompt_version: string;
		timestamp: string;
	};
}

type Attempt = {
	id: string;
	mode: string;
	status: string;
	storyText?: string;
	ocrText?: string;
	score?: number;
	feedbackJson?: AIFeedback;
	timerSeconds: number;
	createdAt: string;
	image: {
		storageKey: string;
		mode: string;
		source: string;
	};
	answerImage?: {
		storageKey: string;
		format: string;
	};
};

export default function MyAttemptsPage() {
	const [attempts, setAttempts] = useState<Attempt[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		async function fetchAttempts() {
			try {
				const res = await fetch("/api/my-attempts");
				if (res.ok) {
					const data = await res.json();
					setAttempts(data.attempts || []);
				}
			} catch (error) {
				console.error("Failed to fetch attempts:", error);
			} finally {
				setLoading(false);
			}
		}

		fetchAttempts();
	}, []);

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString("en-US", {
			year: "numeric",
			month: "short",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	const getStatusColor = (status: string) => {
		switch (status) {
			case "draft":
				return "text-yellow-600 bg-yellow-100";
			case "in_progress":
				return "text-blue-600 bg-blue-100";
			case "completed":
				return "text-purple-600 bg-purple-100";
			case "processing":
				return "text-orange-600 bg-orange-100";
			case "scored":
				return "text-green-600 bg-green-100";
			default:
				return "text-gray-600 bg-gray-100";
		}
	};

	if (loading) {
		return (
			<Protect>
				<div className="min-h-screen">
					<main className="container mx-auto px-4 py-6">
						<div className="text-center">Loading...</div>
					</main>
				</div>
			</Protect>
		);
	}

	return (
		<Protect>
			<div className="min-h-screen">
				<main className="container mx-auto px-4 py-6">
					<div className="mb-6">
						<h1 className="text-3xl font-bold">My Attempts</h1>
						<p className="text-muted-foreground">
							View all your PPDT and TAT practice attempts
						</p>
					</div>

					{attempts.length === 0 ? (
						<Card>
							<CardContent className="py-8 text-center text-muted-foreground">
								No attempts found. Start practicing to see your attempts here!
							</CardContent>
						</Card>
					) : (
						<div className="grid gap-4">
							{attempts.map((attempt) => (
								<Card key={attempt.id}>
									<CardHeader>
										<div className="flex items-center justify-between">
											<div>
												<CardTitle className="capitalize">
													{attempt.mode} Practice
												</CardTitle>
												<p className="text-sm text-muted-foreground">
													{formatDate(attempt.createdAt)}
												</p>
											</div>
											<span
												className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
													attempt.status
												)}`}
											>
												{attempt.status}
											</span>
										</div>
									</CardHeader>
									<CardContent>
										<div className="grid gap-4 md:grid-cols-2">
											<div>
												<h4 className="font-medium mb-2">Stimulus Image</h4>
												<div className="relative w-full h-48 bg-gray-100 rounded-md overflow-hidden">
													<Image
														src={
															attempt.image.storageKey.startsWith("/")
																? attempt.image.storageKey
																: `/uploads/${attempt.image.storageKey}`
														}
														alt={`${attempt.mode} stimulus`}
														fill
														className="object-contain"
														sizes="(max-width: 768px) 100vw, 50vw"
													/>
												</div>
												<p className="text-xs text-muted-foreground mt-1">
													Source: {attempt.image.source}
												</p>
											</div>

											{attempt.answerImage && (
												<div>
													<h4 className="font-medium mb-2">
														Your Answer Image
													</h4>
													<div className="relative w-full h-48 bg-gray-100 rounded-md overflow-hidden">
														<Image
															src={
																attempt.answerImage.storageKey.startsWith("/")
																	? attempt.answerImage.storageKey
																	: `/uploads/${attempt.answerImage.storageKey}`
															}
															alt="Your answer"
															fill
															className="object-contain"
															sizes="(max-width: 768px) 100vw, 50vw"
														/>
													</div>
												</div>
											)}

											{attempt.storyText && (
												<div>
													<h4 className="font-medium mb-2">Your Story</h4>
													<p className="text-sm bg-gray-50 p-3 rounded-md">
														{attempt.storyText}
													</p>
												</div>
											)}

											{attempt.ocrText && (
												<div>
													<h4 className="font-medium mb-2">OCR Text</h4>
													<p className="text-sm bg-gray-50 p-3 rounded-md">
														{attempt.ocrText}
													</p>
												</div>
											)}

											{/* AI Analysis Results */}
											{attempt.feedbackJson && (
												<div className="md:col-span-2">
													<h4 className="font-medium mb-2">AI Analysis</h4>
													<div className="bg-green-50 border border-green-200 rounded-lg p-4">
														<div className="flex items-center justify-between mb-3">
															<span className="text-sm font-medium text-green-700">
																Overall Score: {attempt.score}/100
															</span>
														</div>

														{attempt.feedbackJson.strengths &&
															attempt.feedbackJson.strengths.length > 0 && (
																<div className="mb-3">
																	<h5 className="text-sm font-medium text-green-700 mb-1">
																		Strengths:
																	</h5>
																	<ul className="text-xs text-green-600 space-y-1">
																		{attempt.feedbackJson.strengths.map(
																			(strength: string, index: number) => (
																				<li
																					key={index}
																					className="flex items-start gap-2"
																				>
																					<span className="text-green-500">
																						•
																					</span>
																					<span>{strength}</span>
																				</li>
																			)
																		)}
																	</ul>
																</div>
															)}

														{attempt.feedbackJson.weaknesses &&
															attempt.feedbackJson.weaknesses.length > 0 && (
																<div className="mb-3">
																	<h5 className="text-sm font-medium text-orange-700 mb-1">
																		Areas for Improvement:
																	</h5>
																	<ul className="text-xs text-orange-600 space-y-1">
																		{attempt.feedbackJson.weaknesses.map(
																			(weakness: string, index: number) => (
																				<li
																					key={index}
																					className="flex items-start gap-2"
																				>
																					<span className="text-orange-500">
																						•
																					</span>
																					<span>{weakness}</span>
																				</li>
																			)
																		)}
																	</ul>
																</div>
															)}

														{attempt.feedbackJson.explanation && (
															<div>
																<h5 className="text-sm font-medium text-gray-700 mb-1">
																	Analysis:
																</h5>
																<p className="text-xs text-gray-600 leading-relaxed">
																	{attempt.feedbackJson.explanation}
																</p>
															</div>
														)}
													</div>
												</div>
											)}

											<div className="text-sm text-muted-foreground">
												<p>Timer: {attempt.timerSeconds}s</p>
												<p>Mode: {attempt.mode}</p>
											</div>
										</div>
									</CardContent>
								</Card>
							))}
						</div>
					)}
				</main>
			</div>
		</Protect>
	);
}
