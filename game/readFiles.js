import { readdir, readFile } from "node:fs/promises";
import { parse } from "yaml";
import path from "path";

const expectedGameKeys = [
  "file",
  "map",
  "synonyms",
  "title",
  "introduction",
  "gameover"
];
const expectedAssetKeys = [
  "file",
  "key",
  "name",
  "description",
  "items",
  "immovable",
  "actions"
];

async function readFiles(parentFolder) {
  const fileStructure = await readdir(parentFolder);
  const result = { errors: [], warnings: [] };
  const files = {
    gameFile: null,
    assetKeys: [],
    assetFiles: [],
    readYaml: async paths => {
      const file = await readFile(path.join(parentFolder, ...paths), "utf8");
      return parse(file);
    }
  };

  if (fileStructure.includes("assets")) {
    const allFiles = await readdir(path.join(parentFolder, "assets"));
    files.assetFiles = allFiles.filter(
      file => file.endsWith(".yaml") || file.endsWith(".yml")
    );
    files.assetKeys = files.assetFiles.map(removeSuffix);
  } else {
    result.errors.push({
      from: { file: "." },
      message: "'assets' folder not found"
    });
  }

  if (fileStructure.includes("game.yaml")) {
    files.gameFile = "game.yaml";
  }
  if (fileStructure.includes("game.yml")) {
    if (files.gameFile == null) {
      files.gameFile = "game.yml";
    } else {
      result.warnings.push({
        from: { file: "/" },
        message:
          "Files 'game.yaml' and 'game.yml' both found - using 'game.yaml'"
      });
    }
  }

  await buildGame(files, result);
  await buildAssets(files, result);
  groupErrors(result);
  return result;
}

async function buildGame(files, result) {
  const { gameFile } = files;
  if (gameFile == null) {
    result.errors.push("File 'game.yaml' or 'game.yml' not found");
  } else {
    try {
      const game = await files.readYaml([gameFile]);
      game.file = result.file = gameFile;
      normalizeMap(game, result, files);
      normalizeSynonyms(game, result, files);
      normalizeTitle(game, result, files);
      normalizeIntroduction(game, result, files);
      normalizeGameoverMessages(game, result, files);
      validateUnexpectedKeys(game, result, expectedGameKeys);
    } catch (err) {
      console.log(err);
      result.errors.push(`File '${gameFile}' - not parseable: ${err}`);
    }
  }
}

function normalizeMap(game, result) {
  //todo object type validation
  //todo validate against assets
  result.map = game.map;
}

function normalizeSynonyms(game, result) {
  //todo object type validation
  result.synonyms = game.synonyms || {};
}

function normalizeTitle(game, result, files) {
  const { title, file } = game;
  if (title === undefined || title === null || typeof title === "string") {
    result.title = title || "Adventure";
  } else {
    result.errors.push({
      from: game,
      message: `(Optional) 'title' should be a string.`
    });
  }
}

function normalizeIntroduction(game, result, files) {
  const { introduction, file } = game;
  if (
    introduction === undefined ||
    introduction === null ||
    typeof introduction === "string" ||
    validateStringArray(introduction)
  ) {
    result.introduction = asStringArray(introduction);
  } else {
    result.errors.push({
      from: game,
      message: `(Optional) 'introduction' should be a string or an array of strings.`
    });
  }
}

function normalizeGameoverMessages(game, result) {
  //todo object type validation
  result.gameoverMessages = game.gameover || {};
}

async function buildAssets(files, result) {
  const assets = await Promise.all(
    files.assetFiles.map(async file => {
      try {
        const asset = await files.readYaml(["assets", file]);
        if (typeof asset !== "object") {
          throw new Error("expected an object but got " + typeof asset);
        }
        asset.file = `assets/${file}`;
        asset.key = removeSuffix(file);
        normalizeName(asset, result);
        normalizeDescription(asset, result);
        normalizeItems(asset, result, files);
        normalizeActions(asset, result);
        validateUnexpectedKeys(asset, result, expectedAssetKeys);
        collectVerbs(asset, result);
        return asset;
      } catch (err) {
        console.log(err);
        result.errors.push({
          from: { file },
          message: `File is not parseable: ${err.message}`
        });
      }
    })
  );

  result.assets = assets
    .filter(asset => asset)
    .reduce((acc, asset) => {
      acc[asset.key] = asset;
      return acc;
    }, {});
}

function normalizeName(asset, result) {
  asset.name = asset.name || asset.key;
  if (typeof asset.name !== "string") {
    result.errors.push({
      from: asset,
      message: `(Optional) 'name' should be a string`
    });
  }
}

function normalizeDescription(asset, result) {
  const { description } = asset;
  if (description === null || description === undefined) {
    asset.description = [`This is: ${asset.key}`];
    result.warnings.push({
      from: asset,
      message: `No description, using fallback.`
    });
  } else if (
    typeof description === "string" ||
    validateStringArray(description)
  ) {
    asset.description = asStringArray(description);
  } else if (typeof description === "object") {
    // TODO validate when
  } else {
    result.errors.push({
      from: asset,
      message: `'description' should be a string or an array of strings`
    });
  }
}

function normalizeItems(asset, result, files) {
  const { items } = asset;
  if (items && !validateStringArray(items)) {
    result.errors.push({
      from: asset,
      message: `'items' should be an array of strings.`
    });
    return;
  }
  asset.items = asStringArray(items);
  const unknownItems = asset.items.filter(
    item => !files.assetKeys.includes(item)
  );
  if (unknownItems.length) {
    result.errors.push({
      from: asset,
      message: `'items' has entries that do not exist: ${unknownItems.join(", ")}.`
    });
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

function validateUnexpectedKeys(item, result, expectedKeys) {
  const unexpectedKeys = Object.keys(item).filter(
    key => !expectedKeys.includes(key)
  );
  if (unexpectedKeys.length) {
    result.warnings.push({
      from: item,
      message: `Unexpected keys: ${unexpectedKeys.join(", ")}`
    });
  }
}

function validateStringArray(maybeArray) {
  return (
    Array.isArray(maybeArray) &&
    maybeArray.every(item => typeof item === "string")
  );
}

function asStringArray(maybeArray) {
  return [].concat(maybeArray || []);
}

function removeSuffix(file) {
  return file.replace(/.y[a]?ml$/, "");
}

function groupErrors(result) {
  const sortAndMap = arr =>
    arr
      .sort((a, b) => a.from.file.localeCompare(b.from.file))
      .map(err => `${err.from.file} - ${err.message}`);
  result.errors = sortAndMap(result.errors);
  result.warnings = sortAndMap(result.warnings);
}

export default readFiles;
