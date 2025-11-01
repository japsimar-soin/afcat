import { createClient } from "@supabase/supabase-js";
import { StorageAdapter, StorageResult } from "./types";

export class SupabaseStorageAdapter implements StorageAdapter {
	private supabase;
	private bucketName: string;

	constructor() {
		const supabaseUrl = process.env.SUPABASE_URL!;
		const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

		if (!supabaseUrl || !supabaseServiceKey) {
			throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set");
		}

		this.supabase = createClient(supabaseUrl, supabaseServiceKey);
		this.bucketName = process.env.SUPABASE_BUCKET_NAME || "ssb-prep-images";
	}

	async save(
		buffer: Buffer,
		filename: string,
		options?: { contentType?: string }
	): Promise<StorageResult> {
		try {
			// Generate unique filename with timestamp and checksum
			const timestamp = Date.now();
			const checksum = await this.generateChecksum(buffer);
			const uniqueFilename = `${timestamp}-${checksum}-${filename}`;

			// Upload to Supabase Storage
			const { error } = await this.supabase.storage
				.from(this.bucketName)
				.upload(uniqueFilename, buffer, {
					contentType: options?.contentType || "image/webp",
					upsert: false,
				});

			if (error) {
				console.error("Supabase upload error:", error);
				return {
					success: false,
					error: error.message,
				};
			}

			return {
				success: true,
				path: uniqueFilename,
				checksum,
			};
		} catch (error) {
			console.error("Supabase storage save error:", error);
			return {
				success: false,
				error: error instanceof Error ? error.message : "Unknown error",
			};
		}
	}

	async delete(path: string): Promise<StorageResult> {
		try {
			const { error } = await this.supabase.storage
				.from(this.bucketName)
				.remove([path]);

			if (error) {
				return {
					success: false,
					error: error.message,
				};
			}

			return { success: true };
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : "Unknown error",
			};
		}
	}

	getPublicUrl(path: string): string {
		const { data } = this.supabase.storage
			.from(this.bucketName)
			.getPublicUrl(path);

		return data.publicUrl;
	}

	getUrl(path: string): string {
		return this.getPublicUrl(path);
	}

	private async generateChecksum(buffer: Buffer): Promise<string> {
		const { createHash } = await import("node:crypto");
		return createHash("md5").update(buffer).digest("hex");
	}
}
