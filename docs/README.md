# Introduction

This project aims to be a simple text-based adventure generator, with configuration based on yaml files.
The structure of the files is covered in this documentation.

## Assets

Assets are either _locations_ or _things_ (like items). For a given game these should be held in a folder called 'assets'. Descriptions of the fields allowed are in the [ASSET.md](./ASSET.md) file.

## Game

The 'game' file contains metadata about the game, like the map and title. Descriptions of the fields allowed are in the [GAME.md](./GAME.md) file.

## Tests


## Note on YAML

YAML (Yet Another Markup Language) is a file format for linking keys to values. The key is the value before the colon `:`; after that is the value which in its simplest form is a string:
```
key: value
```
Long strings can be spread over multiple lines using a chevron `>` (considers the output as a single string) or a bar `|` (keeps the separate lines)
```
key: >
  1
  2
  3
```
```
key: |
  1
  2
  3
```
Arrays use an indent with a hyphen `-` to list multiple items under a key e.g. multiple strings:
```
key:
  - value1
  - value2
```
or multiple objects:
```
key:
  - value: 1
    key: 1
  - value: 2
    key: 2
```
