const COMMANDS = {
  "turn on": ["press", "enable", "switch on"],
  open: ["unlock"],
  break: ["smash"]
};

function parser(action) {
  action = action.trim().toLowerCase();
  if (action.startsWith("go ")) {
    return { type: "MOVE", direction: action.substring(3).trim() };
  }
  if (action.startsWith("take ")) {
    return { type: "TAKE", noun: action.substring(5).trim() };
  }
  if (action.startsWith("describe ")) {
    return { type: "DESCRIBE", noun: action.substring(9).trim() };
  }
  if (["look", "quit", "inventory"].includes(action)) {
    return { type: "CONTROL", action };
  }
  for (let [key, alternatives] of Object.entries(COMMANDS)) {
    if (action.startsWith(key + " ")) {
      return {
        type: "ACTION",
        verb: key,
        noun: action.substring(key.length + 1).trim()
      };
    }
    for (let alternative of alternatives) {
      if (action.startsWith(alternative + " ")) {
        return {
          type: "ACTION",
          verb: key,
          noun: action.substring(alternative.length + 1).trim()
        };
      }
    }
  }
  return { type: "UNKNOWN" };
}

module.exports = parser;
