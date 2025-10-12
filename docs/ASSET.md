# Asset

All locations or items used in a game should be held in a folder called 'assets' with a `.yaml` or `.yml` extension (either extension is acceptable). The name of the file can then be used within the game to tie assets together.

## Standard attributes

| Field | Description | Type and Sample |
| ----- | ----------- | --------------- |
| `key` | The key for an asset is the file name minus the extension. For example a file called 'hall.yml' has a key of 'hall' - so 'hall' can be used to connect locations in a map. | N/A |
| `name`  | When checking what items are in a room, or in your inventory the `key` will be used by default. However you may wish an item or location to be given a richer of more readable name, so you could have a file called 'bananas.yml' with a `name` 'bunch of bananas'. The game allows both the `name` and the `key` to be used in commands e.g. "take bananas" or "take bunch of bananas" will both work. | Optional string - `sample3-items/assets/wrong_key.yaml` |
| `description` | In the game more information about an item can be obtained by using the "describe" command; or for a location the "look" command or by visiting a location for the first time. In both situations the `description` is what will be shown to the user | String - `sample3-items/assets/fridge.yaml`, Array of String - `sample3-items/assets/hall.yaml`, `when` Object - TBD |
| `items`       | For any items that you want to link to the location, use its `key` (_not_ the `name`). These will be listed against the location when it is described | String, or array of Strings - `sample3-items/assets/kitchen.yaml` |
| `immovable`   | If there is an item in a room that can't be moved, then the `immovable` property can be set. If this is a simple boolean `true` then a standard message will be shown. If it is a String then that message will be shown instead | Boolean or String - `sample3-items/assets/kitchen.yaml` |
| `actions`     | Actions are things a player can do either in a location or to an item. These are complex objects described in a separate section below | Array of `actions` - `sample3-items/assets/bottle.yaml` |

## `when` clauses

## `action` items
