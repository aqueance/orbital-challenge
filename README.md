# Orbital Challenge

This is a solution to the [Reaktor](https://reaktor.com/) [Orbital Challenge](https://reaktor.com/orbital-challenge/), implemented in JavaScript/ES6. Running this application requires [Node.js][Node] v6+.

## Getting the Sources

Designate a directory, `<source path>`, to hold the sources, and then:

```console
$ git clone https://github.com/aqueance/orbital-challenge.git <source path>
```

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

To get further instructions, do:

```console
$ <install path>/bin/comsat -h
```

## Solution

Two algorithms have been implemented:

  1. *Least Hops*: finds the route with the least number of hops with some total distance, and
  1. *Shortest Path*: finds the shortest route and the least number of hops.

The Least Hops algorithm completes in much fewer steps in general but may give suboptimal results in terms of total distance along the route, while the Shortest Path algorithm performs an exhaustive search over all possible paths and so it returns an optimal route, albeit at the expense of much more computation.

Every satellite is listed at most once in the returned path in both cases.

The algorithms are fully described in [`routers.js`](https://github.com/aqueance/fluid-tools/blob/master/routers.js) at the `route` method of the two `*Route` classes.

Both algorithms are rather trivial, and properly implementing the coordinate geometry formulae, beautifying the code, and polishing the design took much longer than implementing the algorithms themselves – much less coming up with them.

  [Node]: <https://nodejs.org/en/>
