const readline = require("node:readline/promises");
const cloneDeep = require("clone-deep");
const { stdin: input, stdout: output } = require("node:process");
const readFiles = require("./readFiles");
const parser = require("./parser");
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
    const gameData = {
      ...cloneDeep(configuration),
      state: {},
      inventory: {},
      currentLocationKey: configuration.map.start,
      gameover: false,
      get currentLocation() {
        return this.assets[this.currentLocationKey];
      }
    };
    await game(gameData);
    console.log("\nGoodbye!");
  } catch (err) {
    if (err.code === "ABORT_ERR") {
      console.log("\nGoodbye!");
      terminated = true;
    } else {
      console.log(err);
    }
  }
}

async function game(gameData) {
  const { map, assets, inventory, state } = gameData;
  let lastLocation = null;

  while (!gameData.gameover) {
    const currentLocation = gameData.currentLocation;
    if (gameData.currentLocationKey !== lastLocation) {
      if (currentLocation.visited) {
        console.log("You are in:", currentLocation.key);
      } else {
        console.log(describeLocation(gameData));
        console.log(describeItems(gameData));
        console.log(describeExits(gameData));
        currentLocation.visited = true;
      }
    }

    const answer = await rl.question("> ");
    const command = parser(answer);
    console.log(command);

    lastLocation = currentLocation.key;
    if (command.type === "CONTROL") {
      if (command.action === "quit") {
        gameData.gameover = true;
      } else if (command.action === "look") {
        console.log(describeLocation(gameData));
        console.log(describeItems(gameData));
        console.log(describeExits(gameData));
      } else if (command.action === "inventory") {
        console.log(listInventory(gameData));
      }
    } else if (command.type === "MOVE") {
      const nextLocation = map[gameData.currentLocationKey][command.direction];
      if (nextLocation) {
        gameData.currentLocationKey = nextLocation;
      } else {
        console.log("There is no exit in that direction.");
        lastLocation = currentLocation.key;
      }
    } else if (command.type === "TAKE") {
      if (currentLocation.items.includes(command.noun)) {
        inventory[command.noun] = true;
        currentLocation.items = currentLocation.items.filter(
          item => item !== command.noun
        );
        console.log("You have taken: ", command.noun);
      } else if (inventory[command.noun]) {
        console.log("You already have: ", command.noun);
      } else {
        console.log("There isn't one of those here.");
      }
    } else if (command.type === "ACTION") {
      const locationAction = currentLocation.actions.find(
        a => a.verb === command.verb && a.noun === command.noun
      );
      let done = false;
      if (locationAction) {
        console.log(processActions(gameData, locationAction));
        done = true;
      }

      const locationItem = currentLocation.items.find(i => i === command.noun);
      if (!done && locationItem && gameData.assets[command.noun]) {
        const itemAction = gameData.assets[command.noun].actions.find(
          a => a.verb === command.verb
        );
        if (itemAction) {
          console.log(processActions(gameData, itemAction));
          done = true;
        }
      }

      const inventoryItem = inventory[command.noun];
      if (!done && inventoryItem && gameData.assets[command.noun]) {
        console.log(
          "gameData.assets[command.noun].actions",
          gameData.assets[command.noun].actions
        );
        const itemAction = gameData.assets[command.noun].actions.find(
          a => a.verb === command.verb
        );
        if (itemAction) {
          console.log(processActions(gameData, itemAction));
          done = true;
        }
      }

      if (!done) {
        console.log("I don't understand that.");
      }
    } else if (command.type === "UNKNOWN") {
      console.log("I don't understand that.");
    }
  }
}

function processActions(gameData, action) {
  const actions = action.when
    ? getPassingObjects(gameData, action.when)
    : [].concat(action);
  return actions
    .map(actionItem => {
      console.log("MATCH", actionItem);
      actionItem.set.forEach(flag => {
        state[flag] = true;
      });
      actionItem.add.forEach(key => {
        gameData.currentLocation.items.push(key);
      });
      if (actionItem.finish) {
        gameData.gameover = true;
      }
      return actionItem.message;
    })
    .filter(x => x);
}

function describeLocation(gameData) {
  const { assets, currentLocationKey, inventory, state } = gameData;
  const { description } = assets[currentLocationKey];
  if (Array.isArray(description)) {
    return description;
  }
  if (typeof description === "object" && description.when) {
    return getPassingObjects(gameData, description.when);
  }
  return "You are in: " + currentLocationKey;
}

function getPassingObjects(gameData, when) {
  const { currentLocationKey, inventory, state } = gameData;
  return Object.keys(when)
    .map(check => {
      if (check === "") {
        return when[check];
      }
      if (check.startsWith("not has ")) {
        const key = check.substring(8);
        if (!inventory[key]) {
          return when[check];
        }
      } else if (check.startsWith("has ")) {
        const key = check.substring(4);
        if (inventory[key]) {
          return when[check];
        }
      } else if (check.startsWith("not ")) {
        const key = check.substring(4);
        if (!state[key]) {
          return when[check];
        }
      } else if (!!state[check]) {
        return dewhen[check];
      } else if (stateCheck === currentLocationKey) {
        return when[check];
      }
    })
    .filter(x => x);
}

function describeExits(gameData) {
  const { map, assets, currentLocationKey } = gameData;
  const known = [];
  const unknown = [];

  Object.entries(map[currentLocationKey]).forEach(
    ([direction, nextLocationKey]) => {
      const nextLocation = assets[nextLocationKey];
      if (nextLocation.visited) {
        known.push(`To the ${direction} is: ${nextLocation.key}`);
      } else {
        unknown.push(direction);
      }
    }
  );
  if (unknown.length) {
    return known.concat(`There are exits to the: ${unknown.join(", ")}`);
  }
  return known;
}

function describeItems(gameData) {
  const { assets, currentLocationKey } = gameData;
  const { items } = assets[currentLocationKey];
  if (!items.length) {
    return [];
  }
  return ["Here there is: " + items.join(", ")];
}

function listInventory(gameData) {
  const { inventory } = gameData;
  if (!Object.keys(inventory).length) {
    return ["You are not carrying anything"];
  }
  return ["You are carrying: " + Object.keys(inventory).join(", ")];
}

(async function () {
  await start();
  rl.close();
})();
