import { Queue } from 'bullmq';

// Create queues for job processing
export const ocrQueue = new Queue('ocr-run', {
	connection: {
		url: process.env.REDIS_URL || 'redis://localhost:6379'
	}
});

export const aiAnalysisQueue = new Queue('ai-analyze', {
	connection: {
		url: process.env.REDIS_URL || 'redis://localhost:6379'
	}
});

export const imageGenerationQueue = new Queue('image-generate', {
	connection: {
		url: process.env.REDIS_URL || 'redis://localhost:6379'
	}
});

// Helper functions to enqueue jobs
export async function enqueueOCRJob(attemptId: string) {
	await ocrQueue.add('ocr-run', { attemptId }, {
		attempts: 3,
		backoff: {
			type: 'exponential',
			delay: 2000
		}
	});
}

export async function enqueueAIAnalysisJob(attemptId: string) {
	await aiAnalysisQueue.add('ai-analyze', { attemptId }, {
		attempts: 3,
		backoff: {
			type: 'exponential',
			delay: 2000
		}
	});
}

export async function enqueueImageGenerationJob(prompt: string, seedImageId?: string, theme?: string) {
	await imageGenerationQueue.add('image-generate', { prompt, seedImageId, theme }, {
		attempts: 3,
		backoff: {
			type: 'exponential',
			delay: 2000
		}
	});
}
