"use client";
import Image from "next/image";
import { useState } from "react";

type ApiImage = { id: string; storageKey: string };

export function PracticeImage() {
	const [selectedImage, setSelectedImage] = useState<ApiImage | null>(null);

	return (
		<div>
			{selectedImage && (
				<Image
					src={
						selectedImage.storageKey.startsWith("/")
							? selectedImage.storageKey
							: `/uploads/${selectedImage.storageKey}`
					}
					alt="Practice Image"
					fill
					className="object-contain"
					onError={(e) => {
						console.error("Image load error:", selectedImage.storageKey);
						console.error("Error details:", e);
					}}
					onLoad={() => {
						console.log("Image loaded successfully:", selectedImage.storageKey);
					}}
					unoptimized
				/>
			)}
		</div>
	);
}
