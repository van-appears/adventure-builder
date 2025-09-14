const { readdir, readFile } = require("node:fs/promises");
const { parse } = require("yaml");
const path = require("path");

// TODO: NOT COVERED, READING .YML FILES

async function readFiles(parentFolder) {
  const structure = await readdir(parentFolder);
  const result = { errors: [] };

  const readYaml = async paths => {
    const file = await readFile(path.join(parentFolder, ...paths), "utf8");
    return parse(file);
  };

  if (structure.includes("map.yaml")) {
    try {
      result.map = await readYaml(["map.yaml"]);
    } catch (err) {
      result.errors.push(`'map.yaml' not parseable: ${err}`);
    }
  } else {
    result.errors.push("'map.yaml' not found");
  }

  // TODO: EXTRACT

  if (structure.includes("locations")) {
    const allLocationFiles = await readdir(
      path.join(parentFolder, "locations")
    );
    const locations = await Promise.all(
      allLocationFiles
        .filter(file => file.endsWith(".yaml"))
        .map(async file => {
          try {
            const definition = await readYaml(["locations", file]);
            if (typeof definition.description === "string") {
              definition.description = definition.description.split("\\n");
            }
            definition.key = removeSuffix(file);
            definition.items = (definition.items || []);
            normalizeActions(definition);
            return definition;
          } catch (err) {
            console.log(err);
            result.errors.push(`locations '${file}' not parseable: ${err}`);
          }
        })
    );

    result.locations = locations
      .filter(location => location)
      .reduce((acc, location) => {
        acc[location.key] = location;
        return acc;
      }, {});
  } else {
    result.errors.push("'locations' not found");
  }

  if (structure.includes("things")) {
    const allThingFiles = await readdir(
      path.join(parentFolder, "things")
    );
    const things = await Promise.all(
      allThingFiles
        .filter(file => file.endsWith(".yaml"))
        .map(async file => {
          try {
            const definition = await readYaml(["things", file]);
            if (typeof definition.description === "string") {
              definition.description = definition.description.split("\\n");
            }
            definition.key = removeSuffix(file);
            normalizeActions(definition);
            return definition;
          } catch (err) {
            console.log(err);
            result.errors.push(`things '${file}' not parseable: ${err}`);
          }
        })
    );

    result.things = things
      .filter(thing => thing)
      .reduce((acc, thing) => {
        acc[thing.key] = thing;
        return acc;
      }, {});
  }

  console.log(result);
  return result;
}

function normalizeActions(definition) {
  definition.actions = (definition.actions || []);
  definition.actions.forEach(action => {
    action.set = [].concat(action.set || []);
  });
}

function removeSuffix(file) {
  return file.replace(/.y[a]?ml$/, "");
}

module.exports = readFiles;
