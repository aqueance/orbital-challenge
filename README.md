# Orbital Challenge

This is a solution to the [Reaktor](https://reaktor.com/) [Orbital Challenge](https://reaktor.com/orbital-challenge/), implemented in JavaScript/ES6. Running this application requires [Node.js][Node] v6.

The console commands in the following sections assume you have unpacked the sources into a directory referred henceforth to as `<source path>`.

## Running the Tests

You will need `jasmine` and `jshint` to run the tests:

```console
$ (cd <source path>; npm install)
```

To then run the tests, do:

```console
$ (cd <source path>; npm test)
```

## Installation

Designate a directory, `<install path>`,  to install this application to, and then:

```console
$ npm -g -C <install path> install --production <source path>
```

## Usage

To get usage instructions, do:

```console
$ <install path>/bin/comsat -h
```

## Solution

Three algorithms have been implemented:

  1. *Fast*: finds the route with the fewest number of hops with some total distance,
  1. *Fewest Hops*: finds the shortest route with the fewest number of hops, and
  1. *Shortest Path*: finds the fewest number of hops with the shortest route.

The *Fast* algorithm finds all routes with the fewest number of hops, and returns one of the routes found. The algorithm generally completes in fewer steps than the other algorithms but may give suboptimal results in terms of total distance along the route.

The *Fewest Hops* algorithm first finds all routes with the fewest number of hops, and then performs an exhaustive depth first search over those routes to return the shortest one. The algorithm completes in more steps than the *Fast* algorithm but in fewer steps than the *Shortest Path* algorithm, but may return a longer route.

The *Shortest Path* algorithm performs an exhaustive search over all possible paths, thus it returns an optimal route, albeit at the expense of much more computation.

As to which algorithm to use in practice, that depends on the cost of processing a signal vs. that of sending it over a distance:

  * If signal processing is the only factor to optimize for, use the *Fast* algorithm.
  * If signal processing is the dominant factor to optimize for while the total distance is also important, use the *Fewest Hops* algorithm.
  * If total distance is the dominant factor to optimize for, use the *Shortest Path* algorithm.

The algorithms are fully described in `routers.js` at the `route` method of the `*Route` classes.

The algorithms are rather trivial, and properly implementing the coordinate geometry formulae, beautifying the code, and polishing the design took much longer than implementing the algorithms themselves – much less coming up with them.

## Performance

To have a feel for the difference in the performance of the various algorithms, turn on tracing by editing `cli.js` and setting the value of the `TRACE` constant to `true`, the run the algorithms through the included sample challenge, described in the next section, and pipe their output to `wc -l`.

## Samples

The longest route any of the algorithms have found so far is for seed `0.8811217630282044`, where the *Shortest Path* algorithm also found a shorter route than the other algorithms.

The challenge data file for that seed is included as `sample-challenge.txt`.

### *Fast* algorithm

```console
$ comsat --fast sample-challenge.txt
#ALGORITHM: Fast
#METRICS: 41511.800 kms over 10 hops
#SEED: 0.8811217630282044
SAT1,SAT2,SAT16,SAT6,SAT12,SAT19,SAT18,SAT13,SAT14,SAT4
```

### *Fewest Hops* algorithm

```console
$ comsat sample-challenge.txt
#ALGORITHM: Fewest Hops
#METRICS: 41511.800 kms over 10 hops
#SEED: 0.8811217630282044
SAT1,SAT2,SAT16,SAT6,SAT12,SAT19,SAT18,SAT13,SAT14,SAT4
```

### *Shortest Path* algorithm

```console
$ comsat --short sample-challenge.txt
#ALGORITHM: Shortest Path
#METRICS: 41506.176 kms over 10 hops
#SEED: 0.8811217630282044
SAT11,SAT8,SAT16,SAT6,SAT12,SAT19,SAT18,SAT13,SAT14,SAT4
```

  [Node]: <https://nodejs.org/en/>
