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