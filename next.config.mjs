/** @type {import('next').NextConfig} */
const nextConfig = {
	// Allow both localhost and 127.0.0.1 for dev HMR/assets to avoid cross-origin warnings.
	allowedDevOrigins: ["http://localhost:5001", "http://127.0.0.1:5001"],

	// Verhindert Browser-Caching von Dev-Chunks (potsdamer_platz_1k.hdr-Cache-Problem)
	async headers() {
		return process.env.NODE_ENV === "development"
			? [
					{
						source: "/_next/static/chunks/:path*",
						headers: [
							{ key: "Cache-Control", value: "no-store, no-cache, must-revalidate" },
							{ key: "Pragma", value: "no-cache" },
						],
					},
			  ]
			: [];
	},
};

export default nextConfig;
