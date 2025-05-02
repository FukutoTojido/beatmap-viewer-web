import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
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
});
