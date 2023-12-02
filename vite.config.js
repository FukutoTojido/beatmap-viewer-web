import fs from "fs";

// vite.config.js
export default {
    // config options
    server: {
        https: {
            key: fs.readFileSync("./localhost-key.pem"),
            cert: fs.readFileSync("./localhost.pem"),
        }
    }
  }