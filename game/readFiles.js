import { readdir, readFile } from "node:fs/promises";
import { parse } from "yaml";
import path from "path";

// TODO: NOT COVERED, READING .YML FILES

async function readFiles(parentFolder) {
  const structure = await readdir(parentFolder);
  const result = { errors: [] };

  const readYaml = async paths => {
    const file = await readFile(path.join(parentFolder, ...paths), "utf8");
    return parse(file);
  };

  if (structure.includes("game.yaml")) {
    try {
      const game = await readYaml(["game.yaml"]);
      result.map = game.map;
      result.synonyms = game.synonyms || {};
      result.title = game.title || "Adventure";
    } catch (err) {
      result.errors.push(`'game.yaml' not parseable: ${err}`);
    }
  } else {
    result.errors.push("'game.yaml' not found");
  }

  // TODO: EXTRACT

  if (structure.includes("assets")) {
    const allAssetFiles = await readdir(path.join(parentFolder, "assets"));
    const assets = await Promise.all(
      allAssetFiles
        .filter(file => file.endsWith(".yaml"))
        .map(async file => {
          try {
            const definition = await readYaml(["assets", file]);
            if (typeof definition.description === "string") {
              definition.description = [].concat(definition.description);
            }
            definition.key = removeSuffix(file);
            definition.items = definition.items || [];
            normalizeActions(definition);
            definition.actions.forEach(action => {
              if (action.verb && !result.synonyms[action.verb]) {
                result.synonyms[action.verb] = [];
              }
            });

            return definition;
          } catch (err) {
            console.log(err);
            result.errors.push(`File '${file}' not parseable: ${err}`);
          }
        })
    );

    result.assets = assets
      .filter(asset => asset)
      .reduce((acc, asset) => {
        acc[asset.key] = asset;
        return acc;
      }, {});
  } else {
    result.errors.push("'assets' not found");
  }

  console.log(result);
  return result;
}

function normalizeActions(definition) {
  definition.actions = definition.actions || [];
  definition.actions.forEach(action => {
    if (action.when) {
      Object.values(action.when).forEach(value => {
        value.set = [].concat(value.set || []);
        value.add = [].concat(value.add || []);
        value.remove = [].concat(value.remove || []);
      });
    } else {
      action.set = [].concat(action.set || []);
      action.add = [].concat(action.add || []);
      action.remove = [].concat(action.remove || []);
    }
  });
}

function removeSuffix(file) {
  return file.replace(/.y[a]?ml$/, "");
}

export default readFiles;
