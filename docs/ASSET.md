# Asset

All locations or items used in a game should be held in a folder called 'assets' with a `.yaml` or `.yml` extension (either extension is acceptable). The name of the file (they 'key') can then be used within the game to tie assets together.

## Standard attributes

| Field | Purpose     | Description | Type | Sample |
| ----- | ----------- | ----------- | ---- | ------ |
| `key` | Unique ID for an asset | The key for an asset does not need defined; it is the file name without the extension. For example a file called 'hall.yml' has a key of 'hall' - so 'hall' can be used to connect locations in a map. | N/A | N/A |
| `name`        | Alternative to `key` for an asset | When checking what items are in a room, or in your inventory the `key` will be used by default. However you may wish an item or location to be given a richer of more readable name, so you could have a file called 'bananas.yml' with a `name` 'bunch of bananas'. The game allows both the `name` and the `key` to be used in commands e.g. "take bananas" or "take bunch of bananas" will both work. | String | `sample5-game/assets/front_door_key.yaml` |
| `description` | In the game more information about an item can be obtained by using the "describe" command; or for a location the "look" command or by visiting a location for the first time. In both situations the `description` is what will be shown to the user | String, Array of String, or Object | `sample5-game/assets/earthsea.yaml`, `sample5-items/assets/bathroom.yaml`,  `sample5-items/assets/bottle.yaml` |
| `items`       | List of assets in a location | For any items that you want to link to the location, use its `key` (_not_ the `name`). These will be listed against the location when it is described | String, or Array of Strings | `sample5-items/assets/kitchen.yaml` |
| `takeable`    | Whether an item can be taken | By default, any item in a room can be taken. However, to prevent an item being taken the `takeable` property can be set. If this is set to `false` then a standard message will be used if a player tries to take it; if it is a String then that message will be shown instead | Boolean, or String | `sample5-items/assets/kitchen_fridge.yaml` , `sample5-game/assets/photograph.yaml`  |
| `actions`     | Actions that can be done to an item or location | These are complex objects described in a separate section below | Array of `action` objects | `sample5-game/assets/bottle.yaml` |

## `action` items


## `when` clauses

Conditional logic can be included in actions or descriptions by using a `when` clause.