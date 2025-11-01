"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
// import { Navbar } from "@/components/navbar";
import { Timer } from "@/components/timer";
// import { cn } from "@/lib/utils";
import { Protect } from "@clerk/nextjs";
import {
	Upload,
	FileText,
	Image as ImageIcon,
	Wand2,
	Database,
	Clock,
	Play,
	CheckCircle,
	Edit3,
	X,
} from "lucide-react";

type Mode = "ppdt" | "tat";

type ApiImage = { id: string; storageKey: string };

interface AIAnalysis {
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

type PracticeStep =
	| "selection"
	| "instructions"
	| "test"
	| "submit"
	| "analysis";

export default function PracticeModePage() {
	const params = useParams<{ mode: Mode }>();
	const router = useRouter();
	const mode = params?.mode as Mode;

	// State management
	const [currentStep, setCurrentStep] = useState<PracticeStep>("selection");
	const [selectedImage, setSelectedImage] = useState<ApiImage | null>(null);
	const [isImageGenerated, setIsImageGenerated] = useState<boolean>(false);
	const [allowUsedImages, setAllowUsedImages] = useState<boolean>(false);
	const [attemptedImages, setAttemptedImages] = useState<Set<string>>(
		new Set()
	);
	const [attemptId, setAttemptId] = useState<string | null>(null);
	const [answerImage, setAnswerImage] = useState<File | null>(null);
	const [storyText, setStoryText] = useState<string>("");
	const [ocrText, setOcrText] = useState<string>("");
	const [isOcrLoading, setIsOcrLoading] = useState<boolean>(false);
	const [showOcrDialog, setShowOcrDialog] = useState<boolean>(false);
	const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
	const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
	const [isAiProcessing, setIsAiProcessing] = useState<boolean>(false);
	const [attemptStatus, setAttemptStatus] = useState<string>("in_progress");

	// Timer states
	const [showImageTimer, setShowImageTimer] = useState<boolean>(false);
	const [imageDisplayTime, setImageDisplayTime] = useState<number>(3);
	const [isImageTimerRunning, setIsImageTimerRunning] =
		useState<boolean>(false);
	const [isTestTimerRunning, setIsTestTimerRunning] = useState<boolean>(false);

	useEffect(() => {
		if (mode !== "ppdt" && mode !== "tat") {
			router.replace("/dashboard");
		}
	}, [mode, router]);

	// Load attempted images
	useEffect(() => {
		async function loadAttemptedImages() {
			try {
				const res = await fetch("/api/my-attempts");
				if (res.ok) {
					const data = await res.json();
					// The API returns { attempts: [...] }, so we need to access data.attempts
					const attempts = data.attempts || [];
					const attempted = new Set<string>(
						attempts.map((attempt: { imageId: string }) => attempt.imageId)
					);
					setAttemptedImages(attempted);
				}
			} catch (error) {
				console.error("Failed to load attempted images:", error);
			}
		}
		loadAttemptedImages();
	}, []);

	// Screen 1: Image Selection
	const handleSelectExistingImage = async () => {
		try {
			const upperMode = mode.toUpperCase() as "PPDT" | "TAT";
			const res = await fetch(`/api/images?mode=${upperMode}&public=true`);
			if (!res.ok) return;

			const data = await res.json();
			const availableImages = await data.filter(
				(img: ApiImage) => allowUsedImages || !attemptedImages.has(img.id)
			);
			//BUG - shows the alert even if I have selected the 'allow used images' option
			if (availableImages.length === 0) {
				alert(
					"No available images. Try enabling 'Allow used images' or generate a new AI image."
				);
				return;
			}

			const randomImage =
				availableImages[Math.floor(Math.random() * availableImages.length)];
			console.log("Selected image:", randomImage);
			setSelectedImage(randomImage);
			setIsImageGenerated(false);
			setCurrentStep("instructions");
		} catch (error) {
			console.error("Failed to load images:", error);
		}
	};

	const handleGenerateAIImage = async () => {
		try {
			setIsAiProcessing(true);
			const upperMode = mode.toUpperCase() as "PPDT" | "TAT";

			// Generate AI image
			const res = await fetch("/api/images/generate", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({
					mode: upperMode,
					//BUG - CHANGE THE PROMPT
					prompt: `Professional ${mode.toUpperCase()} test image for military selection`,
				}),
			});

			if (res.ok) {
				const data = await res.json();
				setSelectedImage(data.image);
				setIsImageGenerated(true);
				setCurrentStep("instructions");
			} else {
				const errorData = await res.json();
				console.error("AI image generation failed:", errorData);

				const errorMessage = errorData.error || "Unknown error";
				if (
					errorMessage.includes("Imagen API access") ||
					errorMessage.includes("INVALID_ARGUMENT")
				) {
					alert(
						`AI Image Generation Failed: ${errorMessage}\n\n` +
							`This is because Google's Imagen API requires special access approval.\n` +
							`Please select an existing image for now, or request Imagen access from Google Cloud Support.`
					);
				} else {
					alert(
						`Failed to generate AI image: ${errorMessage}\n\n` +
							`Please try again or select an existing image.`
					);
				}
			}
		} catch (error) {
			console.error("Failed to generate AI image:", error);
			alert(
				"Failed to generate AI image. This might be due to Imagen API access restrictions.\n\n" +
					"Please select an existing image for now."
			);
		} finally {
			setIsAiProcessing(false);
		}
	};

	// Screen 2: Instructions
	const handleStartTest = () => {
		setCurrentStep("test");
		setShowImageTimer(true);
		setIsImageTimerRunning(true);
	};

	// Screen 3: Test Page
	useEffect(() => {
		if (currentStep === "test" && showImageTimer && isImageTimerRunning) {
			const timer = setInterval(() => {
				setImageDisplayTime((prev) => {
					if (prev <= 1) {
						setIsImageTimerRunning(false);
						setShowImageTimer(false);
						setIsTestTimerRunning(true);
						clearInterval(timer);
						return 0;
					}
					return prev - 1;
				});
			}, 1000);

			return () => clearInterval(timer);
		}
	}, [currentStep, showImageTimer, isImageTimerRunning]);

	// Screen 4: Submit Answer
	const handleImageUpload = async (file: File) => {
		setAnswerImage(file);
		setIsOcrLoading(true);

		// First create an attempt if we don't have one
		let currentAttemptId = attemptId;
		if (!currentAttemptId) {
			try {
				const upperMode = mode.toUpperCase() as "PPDT" | "TAT";
				const res = await fetch(`/api/attempts`, {
					method: "POST",
					headers: { "content-type": "application/json" },
					body: JSON.stringify({
						mode: upperMode,
						imageId: selectedImage!.id,
						timerSeconds: 240,
					}),
				});

				if (res.ok) {
					const data = await res.json();
					currentAttemptId = data.attempt.id;
					setAttemptId(currentAttemptId);
				} else {
					throw new Error("Failed to create attempt");
				}
			} catch (error) {
				console.error("Failed to create attempt:", error);
				setIsOcrLoading(false);
				return;
			}
		}

		// Convert to base64 and upload
		const reader = new FileReader();
		reader.onload = async (e) => {
			const base64Data = e.target?.result as string;
			const upperMode = mode.toUpperCase() as "PPDT" | "TAT";

			try {
				const res = await fetch("/api/images/upload", {
					method: "POST",
					headers: { "content-type": "application/json" },
					body: JSON.stringify({
						mode: upperMode,
						imageData: base64Data,
						filename: file.name,
						attemptId: currentAttemptId,
					}),
				});

				if (res.ok) {
					const data = await res.json();
					// Image uploaded successfully, now run OCR directly
					await runOCRDirect(data.image.id);
				}
			} catch (error) {
				console.error("Failed to upload image:", error);
				setIsOcrLoading(false);
			}
		};
		reader.readAsDataURL(file);
	};

	const runOCRDirect = async (imageId: string) => {
		console.log("OCR: Starting OCR for image ID:", imageId);
		try {
			const res = await fetch("/api/ocr", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({ imageId }),
			});

			console.log("OCR: Response status:", res.status);

			if (res.ok) {
				const data = await res.json();
				console.log("OCR: Success, extracted text:", data.text);
				setOcrText(data.text || "");
				setShowOcrDialog(true);
			} else {
				const errorData = await res.json();
				console.error("OCR failed:", errorData);
				setOcrText(
					"OCR processing failed. Please type your response manually."
				);
				setShowOcrDialog(true);
			}
		} catch (error) {
			console.error("OCR error:", error);
			setOcrText("OCR processing failed. Please type your response manually.");
			setShowOcrDialog(true);
		} finally {
			setIsOcrLoading(false);
		}
	};

	const handleSubmitAnswer = async () => {
		if (!selectedImage) return;

		// Check if we have either text input or OCR text
		const finalText = storyText.trim() || ocrText.trim();
		if (!finalText) return;

		setIsSubmitting(true);

		try {
			let currentAttemptId = attemptId;

			// If we don't have an attempt yet, create one
			if (!currentAttemptId) {
				const upperMode = mode.toUpperCase() as "PPDT" | "TAT";
				const res = await fetch(`/api/attempts`, {
					method: "POST",
					headers: { "content-type": "application/json" },
					body: JSON.stringify({
						mode: upperMode,
						imageId: selectedImage.id,
						timerSeconds: 240,
						storyText: finalText,
					}),
				});

				if (res.ok) {
					const data = await res.json();
					currentAttemptId = data.attempt.id;
					setAttemptId(currentAttemptId);
				} else {
					throw new Error("Failed to create attempt");
				}
			} else {
				// Update existing attempt with storyText
				const res = await fetch(`/api/attempts/${currentAttemptId}`, {
					method: "PATCH",
					headers: { "content-type": "application/json" },
					body: JSON.stringify({
						storyText: finalText,
					}),
				});

				if (!res.ok) {
					throw new Error("Failed to update attempt");
				}
			}

			setCurrentStep("analysis");
			// Start polling for AI analysis
			if (currentAttemptId) {
				pollForAnalysis(currentAttemptId);
			}
		} catch (error) {
			console.error("Failed to submit answer:", error);
		} finally {
			setIsSubmitting(false);
		}
	};

	// Screen 5: AI Analysis
	const pollForAnalysis = async (attemptId: string) => {
		setIsAiProcessing(true);
		const pollInterval = setInterval(async () => {
			try {
				const res = await fetch(`/api/attempts/${attemptId}`);
				if (res.ok) {
					const data = await res.json();
					const attempt = data.attempt;
					setAttemptStatus(attempt.status);

					if (attempt.status === "scored" && attempt.feedbackJson) {
						setAiAnalysis(attempt.feedbackJson);
						setIsAiProcessing(false);
						clearInterval(pollInterval);
					}
				}
			} catch (error) {
				console.error("Error polling for analysis:", error);
			}
		}, 2000);

		setTimeout(() => {
			clearInterval(pollInterval);
			setIsAiProcessing(false);
		}, 5 * 60 * 1000);
	};

	const resetFlow = () => {
		setCurrentStep("selection");
		setSelectedImage(null);
		setIsImageGenerated(false);
		setAttemptId(null);
		setAnswerImage(null);
		setStoryText("");
		setOcrText("");
		setIsOcrLoading(false);
		setShowOcrDialog(false);
		setIsSubmitting(false);
		setAiAnalysis(null);
		setIsAiProcessing(false);
		setAttemptStatus("in_progress");
		setShowImageTimer(false);
		setImageDisplayTime(30);
		setIsImageTimerRunning(false);
		setIsTestTimerRunning(false);
	};

	// Render different screens
	const renderImageSelection = () => (
		<div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
			<div className="container mx-auto px-4 py-8">
				<div className="text-center mb-8">
					<h1 className="text-4xl font-bold text-gray-900 mb-4">
						{mode.toUpperCase()} Practice
					</h1>
					<p className="text-lg text-gray-600">
						Choose your practice mode to begin
					</p>
				</div>

				<div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
					{/* Existing Pictures Card */}
					<Card
						className="hover:shadow-lg transition-shadow cursor-pointer"
						onClick={handleSelectExistingImage}
					>
						<CardHeader className="text-center">
							<Database className="h-16 w-16 mx-auto text-blue-600 mb-4" />
							<CardTitle className="text-2xl">Existing Pictures</CardTitle>
						</CardHeader>
						<CardContent className="text-center">
							<p className="text-gray-600 mb-6">
								Practice with curated images from our database
							</p>
							<div className="space-y-4">
								<label className="flex items-center justify-center space-x-2">
									<input
										type="checkbox"
										checked={allowUsedImages}
										onChange={(e) => setAllowUsedImages(e.target.checked)}
										className="rounded"
									/>
									<span className="text-sm">Allow already used images</span>
								</label>
								<Button className="w-full" size="lg">
									Select Random Image
								</Button>
							</div>
						</CardContent>
					</Card>

					{/* AI Pictures Card */}
					<Card
						className="hover:shadow-lg transition-shadow cursor-pointer"
						onClick={handleGenerateAIImage}
					>
						<CardHeader className="text-center">
							<Wand2 className="h-16 w-16 mx-auto text-purple-600 mb-4" />
							<CardTitle className="text-2xl">AI Generated Pictures</CardTitle>
						</CardHeader>
						<CardContent className="text-center">
							<p className="text-gray-600 mb-6">
								Generate a unique image using AI for practice
							</p>
							<Button className="w-full" size="lg" disabled={isAiProcessing}>
								{isAiProcessing ? "Generating..." : "Generate New Image"}
							</Button>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);

	const renderInstructions = () => (
		<div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
			<div className="container mx-auto px-4 py-8">
				<div className="max-w-3xl mx-auto">
					<div className="text-center mb-8">
						<h1 className="text-4xl font-bold text-gray-900 mb-4">
							{mode.toUpperCase()} Instructions
						</h1>
						<div className="bg-white rounded-lg p-6 shadow-lg">
							<h2 className="text-2xl font-semibold mb-4">Test Overview</h2>
							<div className="text-left space-y-4">
								<p className="text-gray-700">
									<strong>{mode.toUpperCase()}</strong> (Picture Perception and
									Description Test / Thematic Apperception Test) is designed to
									assess your:
								</p>
								<ul className="list-disc list-inside space-y-2 text-gray-700">
									<li>Perception and observation skills</li>
									<li>Communication abilities</li>
									<li>Leadership potential</li>
									<li>Analytical thinking</li>
									<li>Emotional intelligence</li>
								</ul>
								<div className="bg-blue-50 p-4 rounded-lg">
									<h3 className="font-semibold text-blue-900 mb-2">
										Test Process:
									</h3>
									<ol className="list-decimal list-inside space-y-1 text-blue-800">
										<li>You will see an image for exactly 30 seconds</li>
										<li>
											After 30 seconds, you'll have 4 minutes to write your
											response
										</li>
										<li>Upload a picture of your written answer</li>
										<li>Receive detailed AI analysis of your performance</li>
									</ol>
								</div>
								<div className="bg-yellow-50 p-4 rounded-lg">
									<h3 className="font-semibold text-yellow-900 mb-2">
										What to Include:
									</h3>
									<ul className="list-disc list-inside space-y-1 text-yellow-800">
										<li>What you see in the image</li>
										<li>The story or situation depicted</li>
										<li>Characters and their emotions</li>
										<li>Your interpretation of the scene</li>
									</ul>
								</div>
							</div>
						</div>
					</div>
					<div className="text-center">
						<Button
							onClick={handleStartTest}
							size="lg"
							className="px-8 py-4 text-lg"
						>
							<Play className="mr-2 h-5 w-5" />
							Start Test
						</Button>
					</div>
				</div>
			</div>
		</div>
	);

	const renderTestPage = () => (
		<div className="min-h-screen bg-black flex items-center justify-center">
			{showImageTimer ? (
				<div className="text-center">
					{selectedImage && (
						<div className="relative w-full h-screen">
							<img
								src={
									selectedImage.storageKey.startsWith("/")
										? selectedImage.storageKey
										: `/uploads/${selectedImage.storageKey}`
								}
								alt={`${mode} test image`}
								className="w-full h-full object-contain"
								onError={(e) => {
									console.error("Image load error:", selectedImage.storageKey);
									console.error("Error details:", e);
								}}
								onLoad={() => {
									console.log(
										"Image loaded successfully:",
										selectedImage.storageKey
									);
								}}
							/>
							{/* Debug info */}
							<div className="absolute bottom-4 left-4 text-white text-sm bg-black bg-opacity-50 p-2 rounded">
								Image: {selectedImage.storageKey}
							</div>
						</div>
					)}
					<div className="absolute top-8 right-8 bg-red-600 text-white px-6 py-3 rounded-full text-2xl font-bold">
						{imageDisplayTime}s
					</div>
				</div>
			) : (
				<div className="text-center text-white">
					<Clock className="h-32 w-32 mx-auto mb-8 text-white" />
					<h1 className="text-6xl font-bold mb-4">Time to Write!</h1>
					<p className="text-2xl mb-8">
						You have 4 minutes to complete your response
					</p>
					<Timer initialSeconds={240} isRunning={isTestTimerRunning} />
					<div className="mt-8">
						<Button
							onClick={() => setCurrentStep("submit")}
							size="lg"
							className="bg-white text-black hover:bg-gray-100"
						>
							Submit Answer
						</Button>
					</div>
				</div>
			)}
		</div>
	);

	const renderSubmitAnswer = () => (
		<div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-100 flex items-center justify-center">
			<div className="bg-white rounded-lg shadow-xl p-8 max-w-2xl w-full mx-4">
				<div className="text-center mb-6">
					<CheckCircle className="h-16 w-16 mx-auto text-green-600 mb-4" />
					<h2 className="text-2xl font-bold text-gray-900 mb-2">
						Submit Your Answer
					</h2>
					<p className="text-gray-600">
						Write your response and upload a picture of it
					</p>
				</div>

				<div className="space-y-6">
					{/* Text Response Input */}
					<div>
						<label
							htmlFor="story-text"
							className="block text-sm font-medium text-gray-700 mb-2"
						>
							Your Written Response
						</label>
						<Textarea
							id="story-text"
							placeholder="Write your story here... Describe what you see in the image, the characters, their emotions, and the situation..."
							value={storyText}
							onChange={(e) => setStoryText(e.target.value)}
							className="min-h-[200px] resize-none"
							maxLength={1000}
						/>
						<div className="text-right text-sm text-gray-500 mt-1">
							{storyText.length}/1000 characters
						</div>
					</div>

					{/* Image Upload */}
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">
							Upload Picture of Your Answer
						</label>
						<div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
							<input
								type="file"
								accept="image/*"
								onChange={(e) => {
									const file = e.target.files?.[0];
									if (file) handleImageUpload(file);
								}}
								className="hidden"
								id="answer-upload"
							/>
							<label htmlFor="answer-upload" className="cursor-pointer">
								<Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
								<p className="text-gray-600">
									Click to upload your written answer
								</p>
							</label>
						</div>
					</div>

					{answerImage && (
						<div className="flex items-center justify-center space-x-2 text-green-600">
							<ImageIcon className="h-5 w-5" />
							<span>{answerImage.name} uploaded</span>
							{isOcrLoading && (
								<span className="text-blue-600">(Processing OCR...)</span>
							)}
						</div>
					)}

					{ocrText && !showOcrDialog && (
						<div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
							<div className="flex items-center space-x-2">
								<FileText className="h-5 w-5 text-blue-600" />
								<span className="text-blue-800">OCR text extracted</span>
							</div>
							<Button
								variant="outline"
								size="sm"
								onClick={() => setShowOcrDialog(true)}
							>
								<Edit3 className="h-4 w-4 mr-1" />
								Edit
							</Button>
						</div>
					)}

					<Button
						onClick={handleSubmitAnswer}
						disabled={isSubmitting || (!storyText.trim() && !ocrText.trim())}
						className="w-full"
						size="lg"
					>
						{isSubmitting ? "Submitting..." : "Submit for Analysis"}
					</Button>
				</div>
			</div>
		</div>
	);

	const renderOcrDialog = () => (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
			<div className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
				<div className="flex justify-between items-center mb-4">
					<h3 className="text-xl font-semibold text-gray-900">
						OCR Extracted Text
					</h3>
					<div className="flex space-x-2">
						<Button
							variant="outline"
							size="sm"
							onClick={() => setShowOcrDialog(false)}
						>
							<X className="h-4 w-4" />
						</Button>
					</div>
				</div>

				<div className="space-y-4">
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">
							Extracted Text (You can edit this)
						</label>
						<Textarea
							value={ocrText}
							onChange={(e) => setOcrText(e.target.value)}
							className="min-h-[200px] resize-none"
							placeholder="OCR text will appear here..."
						/>
					</div>

					<div className="flex justify-end space-x-2">
						<Button variant="outline" onClick={() => setShowOcrDialog(false)}>
							Cancel
						</Button>
						<Button
							onClick={() => {
								setShowOcrDialog(false);
								// Clear manual text input since we're using OCR text
								setStoryText("");
							}}
						>
							Use This Text
						</Button>
					</div>
				</div>
			</div>
		</div>
	);

	const renderAnalysis = () => (
		<div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100">
			<div className="container mx-auto px-4 py-8">
				<div className="max-w-4xl mx-auto">
					<div className="text-center mb-8">
						<h1 className="text-4xl font-bold text-gray-900 mb-4">
							AI Analysis Results
						</h1>
						<p className="text-lg text-gray-600">
							Detailed feedback on your {mode.toUpperCase()} performance
						</p>
					</div>

					{isAiProcessing ? (
						<div className="bg-white rounded-lg shadow-lg p-8 text-center">
							<div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
							<h3 className="text-xl font-semibold text-gray-900 mb-2">
								Analyzing Your Response
							</h3>
							<p className="text-gray-600">This may take a few moments...</p>
						</div>
					) : aiAnalysis ? (
						<div className="space-y-6">
							{/* Overall Score */}
							<Card>
								<CardHeader>
									<CardTitle className="text-center text-2xl">
										Overall Score
									</CardTitle>
								</CardHeader>
								<CardContent className="text-center">
									<div className="text-6xl font-bold text-green-600 mb-2">
										{aiAnalysis.score_overall}/100
									</div>
									<p className="text-gray-600">Performance Rating</p>
								</CardContent>
							</Card>

							{/* Strengths */}
							{aiAnalysis.strengths.length > 0 && (
								<Card>
									<CardHeader>
										<CardTitle className="text-green-700">Strengths</CardTitle>
									</CardHeader>
									<CardContent>
										<ul className="space-y-2">
											{aiAnalysis.strengths.map((strength, index) => (
												<li key={index} className="flex items-start space-x-2">
													<span className="text-green-500 mt-1">•</span>
													<span>{strength}</span>
												</li>
											))}
										</ul>
									</CardContent>
								</Card>
							)}

							{/* Areas for Improvement */}
							{aiAnalysis.weaknesses.length > 0 && (
								<Card>
									<CardHeader>
										<CardTitle className="text-orange-700">
											Areas for Improvement
										</CardTitle>
									</CardHeader>
									<CardContent>
										<ul className="space-y-2">
											{aiAnalysis.weaknesses.map((weakness, index) => (
												<li key={index} className="flex items-start space-x-2">
													<span className="text-orange-500 mt-1">•</span>
													<span>{weakness}</span>
												</li>
											))}
										</ul>
									</CardContent>
								</Card>
							)}

							{/* Personality Assessment */}
							<Card>
								<CardHeader>
									<CardTitle>Personality Assessment</CardTitle>
								</CardHeader>
								<CardContent>
									<div className="grid grid-cols-2 gap-4">
										{Object.entries(aiAnalysis.personality_traits).map(
											([trait, score]) => (
												<div
													key={trait}
													className="flex justify-between items-center"
												>
													<span className="capitalize text-gray-700">
														{trait.replace("_", " ")}
													</span>
													<div className="flex items-center space-x-2">
														<div className="w-20 bg-gray-200 rounded-full h-2">
															<div
																className={`bg-blue-600 h-2 rounded-full transition-all duration-300`}
																style={{ width: `${(score / 10) * 100}%` }}
															></div>
														</div>
														<span className="text-sm font-medium">
															{score}/10
														</span>
													</div>
												</div>
											)
										)}
									</div>
								</CardContent>
							</Card>

							{/* Detailed Analysis */}
							{aiAnalysis.explanation && (
								<Card>
									<CardHeader>
										<CardTitle>Detailed Analysis</CardTitle>
									</CardHeader>
									<CardContent>
										<p className="text-gray-700 leading-relaxed">
											{aiAnalysis.explanation}
										</p>
									</CardContent>
								</Card>
							)}

							{/* Suggested Improvement */}
							{aiAnalysis.suggested_rewrite && (
								<Card>
									<CardHeader>
										<CardTitle>Suggested Improvement</CardTitle>
									</CardHeader>
									<CardContent>
										<div className="bg-gray-50 p-4 rounded-lg">
											<p className="text-gray-700 leading-relaxed">
												{aiAnalysis.suggested_rewrite}
											</p>
										</div>
									</CardContent>
								</Card>
							)}

							{/* Action Buttons */}
							<div className="flex justify-center space-x-4">
								<Button onClick={resetFlow} variant="outline" size="lg">
									Practice Again
								</Button>
								<Button onClick={() => router.push("/dashboard")} size="lg">
									Back to Dashboard
								</Button>
							</div>
						</div>
					) : (
						<div className="bg-white rounded-lg shadow-lg p-8 text-center">
							<h3 className="text-xl font-semibold text-gray-900 mb-2">
								Analysis Complete
							</h3>
							<p className="text-gray-600">
								Your analysis will appear here shortly.
							</p>
						</div>
					)}
				</div>
			</div>
		</div>
	);

	return (
		<Protect>
			{currentStep === "selection" && renderImageSelection()}
			{currentStep === "instructions" && renderInstructions()}
			{currentStep === "test" && renderTestPage()}
			{currentStep === "submit" && renderSubmitAnswer()}
			{currentStep === "analysis" && renderAnalysis()}
			{showOcrDialog && renderOcrDialog()}
		</Protect>
	);
}
