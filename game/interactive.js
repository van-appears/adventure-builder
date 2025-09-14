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
      get currentLocation () { return this.locations[this.currentLocationKey]; }
    };
    await game(gameData);
    console.log("Goodbye!");
  } catch (err) {
    if (err.code === "ABORT_ERR") {
      console.log("Goodbye!");
      terminated = true;
    } else {
      console.log(err);
    }
  }
}

async function game(gameData) {
  const { map, locations, inventory, state } = gameData;
  let gameover = false;
  let lastLocation = null;

  while (!gameover) {
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

    // TODO inventory
    // TODO actions

    lastLocation = currentLocation.key;
    if (command.type === "CONTROL") {
      if (command.action === "quit") {
        gameover = true;
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
        currentLocation.items = currentLocation.items
          .filter(item => item !== command.noun);
        console.log("You have taken: ", command.noun);
      } else if (inventory[command.noun]) {
        console.log("You already have: ", command.noun);
      } else {
        console.log("There isn't one of those here.")
      }
    } else if (command.type === "ACTION") {
      const action = currentLocation.actions
        .find(a => a.verb === command.verb && a.noun === command.noun);
      if (action) {
        action.set.forEach(flag => {
          state[flag] = true;
        });
      } else {
        console.log("I don't understand that.")
      }
    } else if (command.type === "UNKNOWN") {
      console.log("I don't understand that.")
    }
  }
}

function describeLocation(gameData) {
  const { locations, currentLocationKey, state } = gameData;
  const { description } = locations[currentLocationKey];
  if (Array.isArray(description)) {
    return description;
  }
  return Object.keys(description)
    .map(stateCheck => {
      if (stateCheck === '' ) {
        return description[stateCheck];
      }
      if (stateCheck.startsWith("not ")) {
        const key = stateCheck.substring(4);
        if (!state[key]) {
          return description[stateCheck];
        }
      } else if (!!state[stateCheck]) {
        return description[stateCheck];
      }
    })
    .filter(x => x);
}

function describeExits(gameData) {
  const { map, locations, currentLocationKey } = gameData;
  const known = [];
  const unknown = [];

  Object.entries(map[currentLocationKey])
    .forEach(([direction, nextLocationKey]) => {
      const nextLocation = locations[nextLocationKey];
      if (nextLocation.visited) {
        known.push(`To the ${direction} is: ${nextLocation.key}`);
      } else {
        unknown.push(direction);
      }
    });
  if (unknown.length) {
    return known.concat(`There are exits to the: ${unknown.join(", ")}`);
  }
  return known;
}

function describeItems(gameData) {
  const { locations, currentLocationKey } = gameData;
  const { items } = locations[currentLocationKey];
  if (!items.length) {
    return [];
  }
  return [ "Here there is: " + items.join(", ") ];
}

function listInventory(gameData) {
  const { inventory } = gameData;
  if (!Object.keys(inventory).length) {
    return [ "You are not carrying anything" ];
  }
  return [ "You are carrying: " + Object.keys(inventory).join(", ") ];
}

(async function () {
  await start();
  rl.close();
})();
