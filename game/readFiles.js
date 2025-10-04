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
      result.introduction = game.introduction || [];
    } catch (err) {
      result.errors.push(`'game.yaml' not parseable: ${err}`);
    }
  } else {
    result.errors.push("'game.yaml' not found");
  }

  if (structure.includes("assets")) {
    const allAssetFiles = await readdir(path.join(parentFolder, "assets"));
    const assets = await Promise.all(
      allAssetFiles
        .filter(file => file.endsWith(".yaml"))
        .map(async file => {
          try {
            const asset = await readYaml(["assets", file]);
            asset.file = file;
            asset.key = removeSuffix(file);
            normalizeAsset(asset, result);
            collectVerbs(asset, result);
            return asset;
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

function normalizeAsset(asset, result) {
  asset.description = normalizeDescription(asset.description, result);
  normalizeItems(asset, result);
  normalizeActions(asset, result);
}

function normalizeDescription(description) {
  // TODO what if description is null?
  if (Array.isArray(description)) {
    return description;
  }
  if (typeof description === "object") {
    return description;
  }
  // TODO force to string?
  return [].concat(description);
}

function normalizeItems(asset, result) {
  asset.items = asset.items || [];
  if (!Array.isArray(asset.items) || asset.items.some(item => typeof item !== 'string')) {
    result.errors.push(`File: ${asset.file} - 'items' should be an array of strings.`);
  }
}

function normalizeActions(asset) {
  if (!asset.actions) {
    asset.actions = [];
  }
  // TODO validation?
  asset.actions.forEach(action => {
    if (action.when) {
      Object.values(action.when).forEach(normalizeAction);
    } else {
      normalizeAction(action);
    }
  });
}

function normalizeAction(action) {
  action.set = [].concat(action.set || []);
  action.add = [].concat(action.add || []);
  action.remove = [].concat(action.remove || []);
}

function collectVerbs(asset, result) {
  asset.actions.forEach(action => {
    if (action.verb && !result.synonyms[action.verb]) {
      result.synonyms[action.verb] = [];
    }
  });
}

function removeSuffix(file) {
  return file.replace(/.y[a]?ml$/, "");
}

export default readFiles;
