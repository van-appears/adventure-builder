import readFiles from "./game/readFiles";
import { defineConfig } from "vite";

// TODO allow fallback
const adventure = process.env.npm_config_adventure;
const config = readFiles(adventure);

// vite.config.js
export default defineConfig(({ mode }) => {
  console.log("DEFINED MODE", mode);
  return {
    root: "web",
    publicDar: "web",
    plugins: [
      {
        name: "merge-adventure-yaml",
        load(id) {
          if (id.endsWith("/adventure-builder/web/config.json")) {
            this.info("Transforming adventure configuration");
            return config.then(resolved => JSON.stringify(resolved));
          }
        }
      }
    ],
    server: {
      port: 8080,
      open: true
    }
  };
});
