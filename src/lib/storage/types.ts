export interface StorageResult {
	success: boolean;
	path?: string;
	error?: string;
	checksum?: string;
}

export interface StorageAdapter {
	save(
		buffer: Buffer,
		filename: string,
		options?: { contentType?: string }
	): Promise<StorageResult>;

	delete(path: string): Promise<StorageResult>;

	getUrl(path: string): string;
}

