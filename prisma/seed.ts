import { PrismaClient, Mode } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
	const seeds = [
		// PPDT webp images under public/images/ppdt
		{
			mode: Mode.PPDT,
			storageKey: "/images/ppdt/PPDT-1.webp",
			width: 1280,
			height: 720,
			format: "webp",
			bytes: 0,
			checksum: "ppdt_ppdt-1_webp",
		},
		{
			mode: Mode.PPDT,
			storageKey: "/images/ppdt/PPDT-2.jpeg",
			width: 1280,
			height: 720,
			format: "jpeg",
			bytes: 0,
			checksum: "ppdt_ppdt-2_jpeg",
		},
		{
			mode: Mode.PPDT,
			storageKey: "/images/ppdt/PPDT-3.jpg",
			width: 1280,
			height: 720,
			format: "jpg",
			bytes: 0,
			checksum: "ppdt_ppdt-3_jpg",
		},
		// TAT jpeg images under public/images/tat
		{
			mode: Mode.TAT,
			storageKey: "/images/tat/TAT-1.jpeg",
			width: 1280,
			height: 720,
			format: "jpeg",
			bytes: 0,
			checksum: "tat_tat-1_jpeg",
		},
		{
			mode: Mode.TAT,
			storageKey: "/images/tat/TAT-2.jpeg",
			width: 1280,
			height: 720,
			format: "jpeg",
			bytes: 0,
			checksum: "tat_tat-2_jpeg",
		},
		{
			mode: Mode.TAT,
			storageKey: "/images/tat/TAT-3.jpeg",
			width: 1280,
			height: 720,
			format: "jpeg",
			bytes: 0,
			checksum: "tat_tat-3_jpeg",
		},
	];

	for (const s of seeds) {
		await prisma.image.upsert({
			where: { checksum: s.checksum },
			update: {},
			create: {
				mode: s.mode,
				source: "seed",
				isPublic: true,
				storageKey: s.storageKey,
				width: s.width,
				height: s.height,
				format: s.format,
				bytes: s.bytes,
				checksum: s.checksum,
			},
		});
	}

	console.log("Seed images upserted");
}

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
