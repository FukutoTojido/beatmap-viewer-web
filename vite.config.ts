import { defineConfig } from "vite";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

export default defineConfig({
	plugins: [tailwindcss(), nodePolyfills()],
	build: {
		target: "esnext", //browsers can handle the latest ES features
		rollupOptions: {
			output: {
				assetFileNames: "assets/style.css",
			},
		},
	},

	optimizeDeps: {
		esbuildOptions: {
			target: "esnext",
		},
		exclude: ["web-demuxer"],
	},
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
		},
	},
	preview: {
		allowedHosts: ["beatmap.try-z.net"],
	},
	base: "",
	server: {
		cors: true,
	},
});
