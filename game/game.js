import cloneDeep from "clone-deep";
import parser from "./parser.js";

class Game {
  constructor(config) {
    const cloneConfig = cloneDeep(config);
    this.map = cloneConfig.map;
    this.assets = cloneConfig.assets;
    this.inventory = {};
    this.state = {};
    this.gameover = false;
  }

  start() {
    this.currentLocationKey = this.map.start;
    const description = this.describeCurrentLocation();
    this.currentLocation().visited = true;
    return description;
  }

  next(command) {
    const parsed = parser(command);
    if (parsed.type === "MOVE") {
      return this.doMove(parsed.direction);
    }
    if (parsed.type === "CONTROL") {
      return this.doControlAction(parsed.action);
    }
    if (parsed.type === "DESCRIBE") {
      return this.doDescribeItem(parsed.noun);
    }
    if (parsed.type === "TAKE") {
      return this.doTakeItem(parsed.noun);
    }
    if (parsed.type === "ACTION") {
      return this.doPerformAction(parsed);
    }
    return [ "I don't understand that." ];
  }

  currentLocation() {
    return this.assets[this.currentLocationKey];
  }

  describeCurrentLocation() {
    return []
      .concat(this.describeLocation())
      .concat(this.describeItems())
      .concat(this.describeExits());
  }

  doControlAction(action) {
    if (action === "quit") {
      this.gameover = true;
      return [ "Goodbye!" ];
    }
    if (action === "look") {
      return this.describeCurrentLocation();
    }
    if (action === "inventory") {
      return this.listInventory();
    }
  }

  doMove(direction) {
    const nextLocationKey = this.map[this.currentLocationKey][direction];
    if (nextLocationKey) {
      this.currentLocationKey = nextLocationKey;
      const currentLocation = this.currentLocation();
      if (currentLocation.visited) {
        return [ "You are in: " + currentLocation.key ];
      }

      currentLocation.visited = true;
      return this.describeCurrentLocation();
    }

    this.lastLocationKey = this.currentLocationKey;
    return [ "There is no exit in that direction." ];
  }

  doDescribeItem(noun) {
    const currentLocation = this.currentLocation();
    if (currentLocation.items.includes(noun) || this.inventory[noun]) {
      const { description } = this.assets[noun];
      if (typeof description === "object" && description.when) {
        return getPassingObjects(description.when);
      }
      return description;
    }
    return [ "There isn't one of those here." ];
  }

  doTakeItem(noun) {
    const currentLocation = this.currentLocation();
    if (currentLocation.items.includes(noun)) {
      this.inventory[noun] = true;
      currentLocation.items = currentLocation.items.filter(item => item !== noun);
      return [ "You have taken: " + noun ];
    }
    if (inventory[noun]) {
      return [ "You already have: " + noun ];
    }
    return [ "There isn't one of those here." ];
  }

  doPerformAction(command) {
    const currentLocation = this.currentLocation();
    const locationAction = currentLocation.actions.find(
      a => a.verb === command.verb && a.noun === command.noun
    );
    if (locationAction) {
      return this.processActions(locationAction);
    }

    const item =
      currentLocation.items.find(i => i === command.noun) ||
      inventory[command.noun];
    if (item && this.assets[command.noun]) {
      const itemAction = this.assets[command.noun].actions.find(
        a => a.verb === command.verb
      );
      if (itemAction) {
        return this.processActions(itemAction);
      }
    }

    return [ "I don't understand that." ];
  }

  processActions( action) {
    const currentLocation = this.currentLocation();
    const actions = action.when
      ? this.getPassingObjects(action.when)
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
          delete this.inventory[key];
        });
        if (actionItem.finish) {
          this.gameover = true;
        }
        return actionItem.message;
      })
      .filter(x => x);
  }

  getPassingObjects(when) {
    return Object.keys(when)
      .map(check => {
        if (check === "") {
          return when[check];
        }
        if (check.startsWith("not has ")) {
          const key = check.substring(8);
          if (!this.inventory[key]) {
            return when[check];
          }
        } else if (check.startsWith("has ")) {
          const key = check.substring(4);
          if (this.inventory[key]) {
            return when[check];
          }
        } else if (check.startsWith("not ")) {
          const key = check.substring(4);
          if (!this.state[key]) {
            return when[check];
          }
        } else if (!!this.state[check]) {
          return dewhen[check];
        } else if (stateCheck === this.currentLocationKey) {
          return when[check];
        }
      })
      .filter(x => x);
  }

  describeLocation() {
    const { description } = this.assets[this.currentLocationKey];
    if (Array.isArray(description)) {
      return description;
    }
    if (typeof description === "object" && description.when) {
      return getPassingObjects(description.when);
    }
    return [ "You are in: " + this.currentLocationKey ];
  }

  describeExits() {
    const known = [];
    const unknown = [];

    Object.entries(this.map[this.currentLocationKey]).forEach(
      ([direction, nextLocationKey]) => {
        const nextLocation = this.assets[nextLocationKey];
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

  describeItems() {
    const { items } = this.assets[this.currentLocationKey];
    if (!items.length) {
      return [];
    }
    return [ "Here there is: " + items.join(", ") ];
  }

  listInventory() {
    if (!Object.keys(this.inventory).length) {
      return [ "You are not carrying anything" ];
    }
    return [ "You are carrying: " + Object.keys(this.inventory).join(", ") ];
  }
}

export default Game;
