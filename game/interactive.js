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

  while (!gameData.gameover) {
    const currentLocation = gameData.currentLocation;
    if (gameData.currentLocationKey !== gameData.lastLocationKey) {
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

    if (command.type === "CONTROL") {
      doControlAction(gameData, command.action);
    } else if (command.type === "MOVE") {
      doMove(gameData, command.direction);
    } else if (command.type === "DESCRIBE") {
      doDescribeItem(gameData, command.noun);
      gameData.lastLocationKey = gameData.currentLocationKey;
    } else if (command.type === "TAKE") {
      doTakeItem(gameData, command.noun);
      gameData.lastLocationKey = gameData.currentLocationKey;
    } else if (command.type === "ACTION") {
      doPerformAction(gameData, command);
      gameData.lastLocationKey = gameData.currentLocationKey;
    } else if (command.type === "UNKNOWN") {
      console.log("I don't understand that.");
      gameData.lastLocationKey = gameData.currentLocationKey;
    }
  }
}

function doControlAction(gameData, action) {
  if (action === "quit") {
    gameData.gameover = true;
  } else if (action === "look") {
    console.log(describeLocation(gameData));
    console.log(describeItems(gameData));
    console.log(describeExits(gameData));
  } else if (action === "inventory") {
    console.log(listInventory(gameData));
  }
}

function doMove(gameData, direction) {
  const { currentLocationKey, map } = gameData;
  const nextLocation = map[currentLocationKey][direction];
  if (nextLocation) {
    gameData.currentLocationKey = nextLocation;
  } else {
    console.log("There is no exit in that direction.");
    gameData.lastLocationKey = currentLocationKey;
  }
}

function doDescribeItem(gameData, noun) {
  const { currentLocation, inventory, assets } = gameData;
  if (currentLocation.items.includes(noun) || inventory[noun]) {
    const { description } = assets[noun];
    if (Array.isArray(description)) {
      console.log(description);
    } else if (typeof description === "object" && description.when) {
      console.log(getPassingObjects(gameData, description.when));
    }
  } else {
    console.log("There isn't one of those here.");
  }
}

function doTakeItem(gameData, noun) {
  const { currentLocation, inventory } = gameData;
  if (currentLocation.items.includes(noun)) {
    inventory[noun] = true;
    currentLocation.items = currentLocation.items.filter(item => item !== noun);
    console.log("You have taken:", noun);
  } else if (inventory[noun]) {
    console.log("You already have:", noun);
  } else {
    console.log("There isn't one of those here.");
  }
}

function doPerformAction(gameData, command) {
  const { currentLocation, inventory, assets } = gameData;
  const locationAction = currentLocation.actions.find(
    a => a.verb === command.verb && a.noun === command.noun
  );
  if (locationAction) {
    console.log(processActions(gameData, locationAction));
    return;
  }

  const item =
    currentLocation.items.find(i => i === command.noun) ||
    inventory[command.noun];
  if (item && assets[command.noun]) {
    const itemAction = assets[command.noun].actions.find(
      a => a.verb === command.verb
    );
    if (itemAction) {
      console.log(processActions(gameData, itemAction));
      return;
    }
  }

  console.log("I don't understand that.");
}

function processActions(gameData, action) {
  const { currentLocation, inventory } = gameData;
  const actions = action.when
    ? getPassingObjects(gameData, action.when)
    : [].concat(action);
  return actions
    .map(actionItem => {
      actionItem.set.forEach(flag => {
        state[flag] = true;
      });
      actionItem.add.forEach(key => {
        currentLocation.items.push(key);
      });
      actionItem.remove.forEach(key => {
        currentLocation.items = currentLocation.items.filter(
          item => item !== key
        );
        delete inventory[key];
      });
      if (actionItem.finish) {
        gameData.gameover = true;
      }
      return actionItem.message;
    })
    .filter(x => x);
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
