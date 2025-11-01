import { writeFile, mkdir, unlink } from "node:fs/promises";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { StorageAdapter, StorageResult } from "./types";

export class LocalStorageAdapter implements StorageAdapter {
	private uploadDir: string;

	constructor() {
		this.uploadDir = join(process.cwd(), "public", "uploads");
	}

	async save(
		buffer: Buffer,
		filename: string,
		_options?: { contentType?: string }
	): Promise<StorageResult> {
		// _options parameter kept for interface compatibility
		try {
			// Ensure upload directory exists
			await mkdir(this.uploadDir, { recursive: true });

			// Generate checksum
			const checksum = createHash("md5").update(buffer).digest("hex");

			// Create unique filename
			const timestamp = Date.now();
			const uniqueFilename = `${timestamp}-${checksum}-${filename}`;
			const filePath = join(this.uploadDir, uniqueFilename);

			// Save file
			await writeFile(filePath, buffer);

			return {
				success: true,
				path: uniqueFilename,
				checksum,
			};
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : "Unknown error",
			};
		}
	}

	async delete(path: string): Promise<StorageResult> {
		try {
			const filePath = join(this.uploadDir, path);
			await unlink(filePath);
			return { success: true };
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : "Unknown error",
			};
		}
	}

	getUrl(path: string): string {
		return `/uploads/${path}`;
	}
}
