export default interface AttemptWithRelations {
	id: string;
	mode: string;
	storyText: string | null;
	ocrText: string | null;
	image: { storageKey: string };
	answerImage?: { storageKey: string } | null;
	user: { clerkId: string };
}