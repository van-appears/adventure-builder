# adventure-builder

Engine for creating simple text-based adventure games, using YAML files for configuration.

## Building

To see instructions on creating a game, see the `docs` folder.

To run a game at the command line use:
```
node game/interactive.js <game folder>
```
For example, to run the sample game use:
```
node game/interactive.js samples/sample5-game
```

When designing games it is a good idea to create tests (again, see the docs). Tests can be run with
```
node game/tester.js <game folder>
```

To check a game in the browser use:
```
npm run dev --adventure=<game folder>
```
or to create build files
```
npm run build --adventure=<game folder>
```