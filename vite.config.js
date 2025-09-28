import readFiles from "./game/readFiles";
import { defineConfig } from "vite";

// TODO allow fallback
const adventure = process.env.npm_config_adventure;

// vite.config.js
export default defineConfig(async ({ mode }) => {
  const config = readFiles(adventure);
  const { title } = await config;

  process.env = {
    ...process.env,
    VITE_GAME_TITLE: title
  };

  return {
    root: "web",
    publicDar: "web",
    plugins: [
      {
        name: "merge-adventure-yaml",
        buildStart() {
          this.addWatchFile(adventure);
        },
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
