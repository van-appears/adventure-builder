# Locations

Location objects should be held in a folder 'locations'.
These are tied together using the `map.yaml` file, discussed later in this file.

## Creating a 'location'

In a folder 'locations' create a file called `<location_key>.yaml` where `<location_key>` is a key that you will use to tie locations together in the `map.yaml` file. This key can be anything, but needs to be unique for each location, given you cannot have two files with the same name. Inside each file you can set the following keys:

### description
When a player enters a location for the first time, the value of the `decription` property will be diplayed to them.
Example: `samples\sample1-navigation\hall.yaml`
```yaml
description: You are standing in the hall of a house.\nThe windows are barred, so it looks like the door is the only way out.
```

Multi-line descriptions can either be provided by using a newline separator `\n` between lines like in the example above, or using yaml `array` format like below. Example: `samples\sample1-navigation\kitchen.yaml`
```yaml
description:
  - You are in a smallish kitchen, it looks quite bare.
  - There is a fridge, a set of locked cupboards, and some drawers.
  - There is also a very large glass bottle beside the sink.
```
Both ways provide equivalent output

### actions

## Creating a 'map'

Outside the 'locations' folder create a file called `map.yaml`. For each location you must then list the directions you can move from one location to another, using `<location_key>`
Example: `samples\sample1-navigation\hall.yaml`
```yaml
hall:
  north: kitchen
kitchen:
  south: hall
```

You must define all the directions, including the reverse directions (e.g. you move north from the hall to the kitchen, then south from the kitchen to the hall) - the generator does not at present automatically determine reversals.

