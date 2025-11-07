// Quick script to check if Imagen access is granted
require("dotenv").config({ path: ".env.local" });

async function checkImagenAccess() {
	console.log("🔍 Checking Imagen Access Status...");
	console.log("=".repeat(40));

	try {
		const { PredictionServiceClient } = require("@google-cloud/aiplatform");

		const client = new PredictionServiceClient({
			projectId: process.env.GCP_PROJECT_ID,
			location: process.env.GCP_LOCATION || "us-central1",
			apiKey: process.env.VERTEX_AI_API_KEY,
		});

		const endpoint = `projects/${process.env.GCP_PROJECT_ID}/locations/${
			process.env.GCP_LOCATION || "us-central1"
		}/publishers/google/models/imagegeneration@006`;

		console.log("🚀 Testing Imagen API...");

		const request = {
			endpoint,
			instances: [
				{
					prompt: "A professional military officer in uniform",
					parameters: {
						sampleCount: 1,
						aspectRatio: "1:1",
					},
				},
			],
		};

		const [response] = await client.predict(request);

		if (response.predictions && response.predictions.length > 0) {
			console.log("🎉 SUCCESS! Imagen access is GRANTED!");
			console.log(`📊 Got ${response.predictions.length} predictions`);

			const prediction = response.predictions[0];
			if (prediction.bytesBase64Encoded) {
				console.log("✅ Real image data received!");
				console.log(
					`📏 Image size: ${prediction.bytesBase64Encoded.length} characters`
				);
				console.log("\n🚀 You can now generate real AI images!");
				return true;
			}
		}
	} catch (error) {
		if (error.message.includes("INVALID_ARGUMENT")) {
			console.log("⏳ Imagen access is still pending approval");
			console.log("💡 Continue waiting or submit support request");
		} else if (error.message.includes("PERMISSION_DENIED")) {
			console.log("🔒 Permission issue - check API key");
		} else {
			console.log(`❌ Error: ${error.message}`);
		}
	}

	return false;
}

async function main() {
	const hasAccess = await checkImagenAccess();

	if (!hasAccess) {
		console.log("\n📋 NEXT STEPS:");
		console.log("1. Submit support request if not done already");
		console.log("2. Wait for Google's approval");
		console.log("3. Use enhanced placeholders in the meantime");
		console.log("4. Run this script periodically to check");

		console.log("\n🔗 Submit request at:");
		console.log("https://console.cloud.google.com/support");
	}
}

main();









