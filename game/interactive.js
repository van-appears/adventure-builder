const readline = require("node:readline/promises");
const { stdin: input, stdout: output } = require("node:process");
const readFiles = require("./readFiles");
const Game = require("./game");
const rl = readline.createInterface({ input, output });

async function start() {
  const configuration = await readFiles(process.argv[2]);
  if (configuration.errors.length) {
    configuration.errors.forEach(error => console.log(error));
    console.log("Please correct your game definition and try again.");
    return;
  }

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
}

(async function () {
  await start();
  rl.close();
})();
