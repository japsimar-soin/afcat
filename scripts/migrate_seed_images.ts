import { PrismaClient } from '@prisma/client';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { storage } from '../src/lib/storage';

const prisma = new PrismaClient();

async function migrateSeedImages() {
	console.log('Starting seed image migration to Supabase...');

	try {
		// Check if Supabase is configured
		if (!process.env.SUPABASE_URL) {
			throw new Error('SUPABASE_URL not configured. Cannot migrate to cloud storage.');
		}

		// Get all seed images from database
		const seedImages = await prisma.image.findMany({
			where: {
				source: 'seed'
			}
		});

		console.log(`Found ${seedImages.length} seed images to migrate`);

		for (const image of seedImages) {
			try {
				console.log(`Migrating: ${image.storageKey}`);

				// Read local file
				const localPath = join(process.cwd(), 'public', image.storageKey);
				const buffer = await readFile(localPath);

				// Upload to Supabase
				const result = await storage.save(
					buffer,
					image.storageKey.split('/').pop() || 'image.webp',
					{ contentType: `image/${image.format}` }
				);

				if (!result.success) {
					console.error(`Failed to upload ${image.storageKey}:`, result.error);
					continue;
				}

				// Update database with new storage key
				await prisma.image.update({
					where: { id: image.id },
					data: {
						storageKey: result.path!,
						// Update other fields if needed
						bytes: buffer.length
					}
				});

				console.log(`✅ Migrated: ${image.storageKey} -> ${result.path}`);
			} catch (error) {
				console.error(`❌ Failed to migrate ${image.storageKey}:`, error);
			}
		}

		console.log('Migration completed!');
	} catch (error) {
		console.error('Migration failed:', error);
		process.exit(1);
	} finally {
		await prisma.$disconnect();
	}
}

// Run migration if called directly
if (require.main === module) {
	migrateSeedImages();
}

export { migrateSeedImages };


