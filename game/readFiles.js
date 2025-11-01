import { readdir, readFile } from "node:fs/promises";
import { parse } from "yaml";
import assetSchema from "../schemas/asset-schema.json" with { type: "json" };
import gameSchema from "../schemas/game-schema.json" with { type: "json" };
import Ajv2020 from "ajv/dist/2020.js";
import path from "path";

const reservedWords = ["and", "not"];
const ajv = new Ajv2020();

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
  validateAll(files, result);
  groupErrors(result);
  return result;
}

async function buildGame(files, result) {
  const { gameFile } = files;
  if (gameFile == null) {
    result.errors.push({
      from: { file: "/" },
      message: "File 'game.yaml' or 'game.yml' not found"
    });
  } else {
    let game = null;
    try {
      game = await files.readYaml([gameFile]);
    } catch (err) {
      result.errors.push({
        from: { file },
        message: `File '${gameFile}' is not parseable: ${err.message}`
      });
      return null;
    }

    game.file = result.file = gameFile;
    const valid = ajv.validate(gameSchema, game);
    if (!valid) {
      ajv.errors.forEach(error => {
        result.errors.push({
          from: game,
          message: `${error.instancePath} - ${error.message}`,
          error
        });
      });
    }

    normalizeMap(game, result);
    normalizeSynonyms(game, result);
    normalizeTitle(game, result);
    normalizeIntroduction(game, result);
    normalizeGameoverMessages(game, result);
  }
}

function normalizeMap(game, result) {
  result.map = game.map;
}

function normalizeSynonyms(game, result) {
  result.synonyms = game.synonyms || {};
  Object.keys(result.synonyms).forEach(key => {
    result.synonyms[key] = asStringArray(result.synonyms[key]);
  });
}

function normalizeTitle(game, result) {
  const { title } = game;
  if (title === undefined || title === null) {
    result.title = "Adventure";
    result.warnings.push({
      from: asset,
      message: `No title, using fallback.`
    });
  } else {
    result.title = title;
  }
}

function normalizeIntroduction(game, result) {
  const { introduction } = game;
  result.introduction = asStringArray(introduction);
}

function normalizeGameoverMessages(game, result) {
  result.gameoverMessages = game.gameover || {};
}

async function buildAssets(files, result) {
  const assets = await Promise.all(
    files.assetFiles.map(async file => {
      let asset = null;
      try {
        asset = await files.readYaml(["assets", file]);
      } catch (err) {
        result.errors.push({
          from: { file },
          message: `File 'assets/${file}' is not parseable: ${err.message}`
        });
        return null;
      }

      asset.file = `assets/${file}`;
      asset.key = removeSuffix(file);
      const valid = ajv.validate(assetSchema, asset);
      if (!valid) {
        ajv.errors.forEach(error => {
          result.errors.push({
            from: asset,
            message: `${error.instancePath} - ${error.message}`,
            error
          });
        });
      }

      normalizeName(asset);
      normalizeDescription(asset, result);
      normalizeActions(asset);
      normalizeTakeable(asset);
      collectVerbs(asset, result);
      return asset;
    })
  );

  result.assets = assets
    .filter(asset => asset)
    .reduce((acc, asset) => {
      acc[asset.key] = asset;
      return acc;
    }, {});
}

function normalizeName(asset) {
  asset.name = asset.name || asset.key;
}

function normalizeDescription(asset, result) {
  const { description } = asset;
  if (description === null || description === undefined) {
    asset.description = [`This is: ${asset.key}`];
    result.warnings.push({
      from: asset,
      message: `No description, using fallback.`
    });
  } else if (typeof description === "string" || Array.isArray(description)) {
    asset.description = asStringArray(description);
  }
}

function normalizeTakeable(asset) {
  const { takeable } = asset;
  if (takeable === null || takeable === undefined) {
    asset.takeable = true;
  }
}

function normalizeActions(asset) {
  if (!asset.actions) {
    asset.actions = [];
  }
  asset.actions.forEach(action => {
    if (action.when) {
      Object.values(action.when).forEach(normalizeAction);
    } else {
      normalizeAction(action);
    }
  });
}

function normalizeAction(action) {
  action.set = asStringArray(action.set);
  action.add = asStringArray(action.add);
  action.remove = asStringArray(action.remove);
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

function asStringArray(maybeArray) {
  return [].concat(maybeArray || []);
}

function validateAll(files, result) {}

function groupErrors(result) {
  const sortAndMap = arr =>
    arr
      .sort((a, b) => a.from.file.localeCompare(b.from.file))
      .map(err => `${err.from.file} - ${err.message}`);
  result.errors = sortAndMap(result.errors);
  result.warnings = sortAndMap(result.warnings);
}

export default readFiles;
