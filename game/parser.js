export const DIRECTIONS = {
  n: "north",
  e: "east",
  w: "west",
  s: "south",
  ne: "northeast",
  nw: "northwest",
  se: "southeast",
  sw: "southwest"
};

function parser(action, synonyms) {
  action = action.trim().toLowerCase();
  const direction = Object.entries(DIRECTIONS).find(
    d => d[0] === action || d[1] === action
  );
  if (direction) {
    return { type: "MOVE", direction };
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
  for (let [key, alternatives] of Object.entries(synonyms)) {
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

export default parser;
