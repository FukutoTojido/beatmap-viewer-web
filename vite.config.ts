import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import { nodePolyfills } from "vite-plugin-node-polyfills";

export default defineConfig({
	plugins: [tailwindcss(), nodePolyfills()],
	build: {
		target: "esnext", //browsers can handle the latest ES features
	},
	optimizeDeps: {
		esbuildOptions: {
			target: "esnext",
		},
		exclude: ["web-demuxer", "wavesurfer.js"],
	},
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src/app"),
		},
	},
	preview: {
		allowedHosts: ["beatmap.try-z.net", "previe.tryz.id.vn"],
	},
	base: "",
	server: {
		cors: true,
	},
});
