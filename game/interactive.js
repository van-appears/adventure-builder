import readline from "node:readline/promises";
import { stdin, stdout } from "node:process";
import readFiles from "./readFiles.js";
import Game from "./game.js";

const rl = readline.createInterface({ input: stdin, output: stdout });

async function start() {
  const configuration = await readFiles(process.argv[2]);
  if (configuration.errors.length) {
    configuration.errors.forEach(error => console.log(error));
    configuration.warnings.forEach(warning => console.log(warning));
    console.log("Please correct your game definition and try again.");
    return;
  }

  configuration.warnings.forEach(warning => console.log(warning));
  let terminated = false;
  try {
    const game = new Game(configuration);
    await interactive(game);
  } catch (err) {
    if (err.code === "ABORT_ERR") {
      console.log("\nGoodbye!");
      terminated = true;
    } else {
      console.log(err);
    }
  }
}

async function interactive(game) {
  (game.start() || []).forEach(line => console.log(line));
  while (!game.gameover) {
    const answer = await rl.question("> ");
    const output = game.next(answer);
    (output || []).forEach(line => console.log(line));
  }
  (game.gameoverMessages[game.gameoverStatus] || []).forEach(line =>
    console.log(line)
  );
}

(async function () {
  await start();
  rl.close();
})();
