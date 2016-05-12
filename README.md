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
$ npm install -g -C <install path> <source path>
```

To get further instructions, do:

```console
$ <install path>/bin/comsat -h
```

## Solution

The algorithm is fully described in [`router.js`](https://github.com/aqueance/fluid-tools/blob/master/router.js) at the `_route` function.

Assuming the geometry formulae are correct, the algorithm finds the route with the least number of hops, and although the algorithm is biased toward shorter hops, the route returned is not necessarily the shortest possible one.

The algorithm is rather trivial, and properly implementing the coordinate geometry formulae, beautifying the code, and polishing the design took much longer than implementing the algorithm itself – much less coming up with it.

  [Node]: <https://nodejs.org/en/>

