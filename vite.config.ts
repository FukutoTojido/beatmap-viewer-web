import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import path from 'node:path';

export default defineConfig({
	plugins: [tailwindcss()],
	build: {
		target: "esnext", //browsers can handle the latest ES features
	},
	optimizeDeps: {
		esbuildOptions: {
			target: "esnext",
		},
	},
	resolve: {
		alias: {
			'@': path.resolve(__dirname, './src'),
		}
	},
	preview: {
		allowedHosts: ["beatmap.try-z.net"]
	}
});
