import { readdir, readFile } from "node:fs/promises";
import { parse } from "yaml";
import path from "path";
import readFiles from "./readFiles.js";
import Game from "./game.js";

async function start() {
  const parentFolder = process.argv[2];
  const configuration = await readFiles(parentFolder);
  if (configuration.errors.length) {
    configuration.errors.forEach(error => console.log(error));
    configuration.warnings.forEach(warning => console.log(warning));
    console.log("Please correct your game definition and try again.");
    return;
  }
  configuration.warnings.forEach(warning => console.log(warning));

  const fileStructure = await readdir(parentFolder);
  const testFileName = [
    "tests.yaml",
    "tests.yml",
    "test.yaml",
    "test.yml"
  ].find(file => fileStructure.includes(file));
  if (!testFileName) {
    console.log("No tests found");
    return;
  }

  const testFile = await readFile(
    path.join(parentFolder, testFileName),
    "utf8"
  );
  const tests = parse(testFile);
  const results = {};
  Object.keys(tests).forEach(testKey => {
    const game = new Game(configuration);
    console.log(`STARTING TEST: ${testKey}`);
    const outcome = runTest(game, tests[testKey]);
    results[testKey] = outcome;
    console.log();
  });

  if (Object.keys(results).length === 0) {
    console.log("No tests");
  } else {
    let hasFailures = false;
    Object.keys(results).forEach(resultKey => {
      if (Object.keys(results[resultKey]).length) {
        hasFailures = true;
        console.log("Failed test:", resultKey, results[resultKey]);
      }
    });
    if (!hasFailures) {
      console.log("All tests passed");
    }
  }
}

function runTest(game, test) {
  const steps = Array.isArray(test.steps)
    ? test.steps
    : typeof test.steps === "string"
      ? test.steps.split("\n")
      : [];

  let stepCount = 0;
  let output = game.start();
  (output || []).forEach(line => console.log(line));
  while (!game.gameover && stepCount < steps.length) {
    if (game.currentQuestion) {
      console.log(`"${game.currentQuestion.text}"`);
      console.log(">> " + steps[stepCount]);
    } else {
      console.log("> " + steps[stepCount]);
    }
    output = game.next(steps[stepCount]);
    (output || []).forEach(line => console.log(line));
    stepCount++;
  }
  (game.gameoverMessages[game.gameoverStatus] || []).forEach(line =>
    console.log(line)
  );

  const summary = {};
  console.log("PERFORMING CHECKS");
  if (test.state) {
    console.log("STATE:", game.state);
    if (!test.state.every(key => game.state[key])) {
      console.log(`FAILED: Expected state keys: ${test.state}`);
      summary.stateTest = false;
    }
  }
  if (test.inventory) {
    console.log("INVENTORY:", game.inventory);
    if (!test.inventory.every(key => game.inventory[key])) {
      console.log(`FAILED: Expected inventory keys: ${test.inventory}`);
      summary.inventoryTest = false;
    }
  }
  if (test.gameover) {
    console.log("GAMEOVER:", game.gameoverStatus);
    if (test.gameover !== game.gameoverStatus) {
      console.log(`FAILED: Expected gameoverStatus: ${test.gameover}`);
      summary.gameoverTest = false;
    }
  }

  return summary;
}

(async function () {
  await start();
})();
