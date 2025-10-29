import fs from "fs";
import crossOriginIsolation from 'vite-plugin-cross-origin-isolation'
import { defineConfig, loadEnv } from "vite";

// vite.config.js
export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), "");
    const serverSettings =
        env.NODE_ENV === "development" // <-- Condition here
            ? {
                  server: {
                      https: {
                          key: fs.readFileSync("./localhost-key.pem"),
                          cert: fs.readFileSync("./localhost.pem"),
                      },
                  },
              }
            : {};

    return {
        ...serverSettings, // <-- Add here!
        optimizeDeps: {
            exclude: ["@ffmpeg/ffmpeg", "@ffmpeg/util"],
        },
        plugins: [
            crossOriginIsolation()
        ],
        base: "./"
    };
});
