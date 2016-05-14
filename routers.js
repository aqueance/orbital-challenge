/*
 * Copyright © Tibor Adam Varga. All rights reserved.
 */

/* jshint node:true, esversion:6 */

'use strict';

const FAST = 'fast';
const FEWEST_HOPS = 'fewestHops';
const SHORTEST_PATH = 'shortestPath';

module.exports = Object.create(null, {
    factory: {
        value: Object.create(null, {
            [FAST]: {
                value: function(...relays) {
                    return new FastRouter(...relays);
                }
            },
            [FEWEST_HOPS]: {
                value: function(...relays) {
                    return new FewestHopsRouter(...relays);
                }
            },
            [SHORTEST_PATH]: {
                value: function(...relays) {
                    return new ShortestPathRouter(...relays);
                }
            }
        })
    },
    FAST: { value: FAST },
    FEWEST_HOPS: { value: FEWEST_HOPS },
    SHORTEST_PATH: { value: SHORTEST_PATH }
});

/*
 * Represents a node in a directed graph.
 *
 * The node has a Point and an list of other Nodes to represent edges.
 *
 * The Point object must have:
 *  - a .name property
 *  - a .visible(point: Point): boolean method
 *  - a .distance(point: Point): number method
 */
class Node {

    constructor(point, id) {
        this.point = point;
        this.edges = [];
        this.id = id;
        this.cache = [];
        this.seen = false;
    }

    visible(that) {
        var cached = this.cache[that.id];
        return cached !== undefined ? cached : (this.cache[that.id] = this.point.visible(that.point));
    }

    connect(that) {
        this.edges.push(that);
        return that;
    }

    encountered(flag) {
        var value = this.seen;
        this.seen = flag;
        return value;
    }
}

function sanitize(path) {
    var no_route = path.length === 1;

    return {
        path: no_route ? null : path.map(node => node.point),
        hops: path.length - 2,
        distance: no_route ? -1 : path.reduce(function(distance, node, index, nodes) {
            return !index ? distance : distance + node.point.distance(nodes[index - 1].point);
        }, 0)
    };
}

/*
 * Splits the contents of [list] into two lists based on what [predicate]
 * returns for each element of [list].
 */
function divide(list, predicate) {
    var truthy = [];
    var falsy = [];

    for (let i = 0, ii = list.length; i < ii; ++i) {
        var item = list[i];
        (predicate(item) ? truthy : falsy).push(item);
    }

    return [ truthy, falsy ];
}

/*
 * Exposes details that control the depth first descent through a graph.
 */
class DescentControl {

    /*
     * [source]:  the node to reach through the graph.
     * [relays]:  a function(node) that returns the next nodes to traverse
     *            from [node].
     * [descend]: a function(node, next) that returns whether the [next] node
     *            should be descended to from [node].
     * [ascend]:  a function(next) to call when ascending back from [next].
     */
    constructor(trace, source, relays, descend, ascend) {
        this.trace = trace;
        this.source = source;
        this.relays = relays;
        this.descend = descend;
        this.ascend = ascend;
    }
}

/*
 * Recursively traverses an acyclic directed graph in a depth first manner,
 * maintaining the current total distance and recording the shortest route
 * found with the fewest number of hops.
 *
 * [control]  controls the descent (see DescentControl)
 * [path]     maintains the current path of descent
 * [distance] is the length of path
 * [node]     is the node just encountered
 * [shortest] is a data structure that maintains the current shortest full
 *            path seen so far
 *
 * Returns the shortest path and its distance as
 * { path: Node[], distance: number }.
 */
function descend(control, path, length, node, shortest) {
    const trace = control.trace;
    var _node = node.point;

    if (trace) trace(`--- ${_node.name}`);

    const _source = control.source.point;
    if (_node.visible(_source)) {
        if (trace) trace(`${_node.name} > ${_source.name}`);
        var distance = length + _node.distance(_source);

        if ((!shortest || shortest.distance > distance || (path.length < shortest.path.length && Math.abs(shortest.distance - distance) < Number.EPSILON))) {
            if (trace) trace(`= ${distance} - ${path.slice().map(node => node.point.name).join(' > ')}`);
            shortest = { path: path.slice(), distance: distance };
        }
    }

    var relays = control.relays(node);
    for (let i = 0, ii = relays.length; i < ii; ++i) {
        let next = relays[i];

        if (control.descend(node, next)) {
            var _next = next.point;

            if (trace) trace(`${_node.name} > ${_next.name}`);

            path.unshift(next);
            shortest = descend(control, path, length + _node.distance(_next), next, shortest);
            path.shift();
            control.ascend(next);
        }
    }

    return shortest;
}

function shortest_path(source, target, trace, relays, forward, backward) {
    var control = new DescentControl(trace, source, relays, forward, backward);
    var route = descend(control, [], 0, target);

    return sanitize((!route ? [] : [ source ].concat(route.path)).concat(target));
}

/*
 * This function builds a visibility graph from [target] to [source] over
 * [relays] using the following algorithm:
 *  1. Set [frontier] to be a list with [source] as its only element.
 *  2. Set [outskirts] to be the relays.
 *  3. If [frontier] is not empty, repeat:
 *     a. Find all elements in [frontier] that can directly reach
 *        [target].
 *     b. Add each hit to the list of nodes that can directly reach
 *        [target].
 *     c. If any such element is found, exit the loop.
 *     d. Find all satellites in [outskirts] that are reachable from any
 *        element in [frontier].
 *     e. Add each hit to the list of nodes that can directly reach that
 *        element.
 *     f. Set [frontier] to the list of satellites thus found.
 *     g. Remove [frontier] from [outskirts].
 *     h. Go to step 3.
 */
function visibility_graph(source, target, relays, trace) {
    var frontier = [source];
    var outskirts = relays.map((point, index) => new Node(point, index));

    /*
     * This function finds all nodes in [frontier] that can directly reach
     * [node] and connects with [node] those found.
     *
     * Returns the number of hits.
     */
    function reachable(node) {
        var visible = frontier
            .filter(node.visible.bind(node))
            .map(node.connect.bind(node));

        if (trace && visible.length) trace(`${node.point.name} < ${visible.map(node => node.point.name)}`);
        return visible.length;
    }

    do {
        if (reachable(target)) break;

        [ frontier, outskirts ] = divide(outskirts, reachable);

        if (trace) trace();
    } while (frontier.length);
}

/*
 * Finds a route with the fewest number of hops between a source and a target
 * through a set of relays.
 */
class FastRouter {

    constructor(...relays) {
        this.relays = relays;
    }

    /*
     * This implementation finds a route from [_source] to [_target] with the
     * fewest number of hops over the relays.
     *
     * Returns { path: <route>, hops: <count>, distance: <km> } with
     * <route> set to null if no path found, else <route> is a list of names,
     * starting with that of [_source] and ending with that of [_target], and
     * a potentially empty list of names from the relays.
     *
     * All of [_source], [_target], and each relay must have a visible()
     * method that tests the commutative reachability between the method
     * target and its argument.
     *
     * Similarly, all of the above must have a distance() method that computes
     * the distance between the receiver and the method argument.
     *
     * The algorithm works in two phases:
     *  1. first moving forward from [_source] toward [_target] over the
     *     relays in steps and recording the ones reachable from the relays
     *     found in the last step,
     *  2. then moving backward from [_target] toward [_source] over the
     *     possible routes found and selecting the one with the shortest total
     *     distance.
     *
     * Phase 1: the possible routes are explored by building a visibility
     * graph using the algorithm described at [visibility_graph].
     *
     * Phase 2: compute a route by the following algorithm:
     *  1. Set [node] to be [_target].
     *  2. Set [path] to be a list with [node] as its only element.
     *  3. If [node] has elements added in step 3.b or 3.e in the Phase 1,
     *     repeat:
     *     a. Compute the distance from [node] to all elements visible
     *        therefrom.
     *     b. Find the shortest distance among them.
     *     c. Select the element with the shortest distance thereto.
     *     d. Set [node] to that element.
     *     e. Add [node] to the beginning of [path].
     */
    route(_source, _target, trace) {
        var source = new Node(_source);
        var target = new Node(_target);

        visibility_graph(source, target, this.relays, trace);

        var node = target;
        var path = [ node ];

        while (node.edges.length) {
            /* jshint -W083 */

            var distances = node.edges.map(last => last.point.distance(node.point));

            var shortest = Math.min.apply(null, distances);
            var selected = distances.indexOf(shortest);

            node = node.edges[selected];
            path.unshift(node);
        }

        return sanitize(path);
    }
}

/*
 * Finds the shortest route with the fewest number of hops between a source and
 * a target through a set of relays.
 */
class FewestHopsRouter {

    constructor(...relays) {
        this.relays = relays;
    }

    /*
     * This implementation finds a route from [_source] to [_target] with the
     * fewest number of hops over the relays.
     *
     * Returns { path: <route>, hops: <count>, distance: <km> } with
     * <route> set to null if no path found, else <route> is a list of names,
     * starting with that of [_source] and ending with that of [_target], and
     * a potentially empty list of names from the relays.
     *
     * All of [_source], [_target], and each relay must have a visible()
     * method that tests the commutative reachability between the method
     * target and its argument.
     *
     * Similarly, all of the above must have a distance() method that computes
     * the distance between the receiver and the method argument.
     *
     * The algorithm works in two phases:
     *  1. first moving forward from [_source] toward [_target] over the
     *     relays in steps and recording the ones reachable from the relays
     *     found in the last step,
     *  2. then moving backward from [_target] toward [_source] over the
     *     possible routes found and selecting the one with the shortest total
     *     distance.
     *
     * Phase 1: the possible routes are explored by building a visibility
     * graph using the algorithm described at [visibility_graph].
     *
     * Phase 2: traverse the visibility graph found in Phase 1 and return the
     * shortest one found.
     */
    route(_source, _target, trace) {
        var source = new Node(_source);
        var target = new Node(_target);

        visibility_graph(source, target, this.relays, trace);

        return shortest_path(source, target, trace, node => node.edges, (node, next) => true, () => {});
    }
}

/*
 * Finds a route with the shortest total distance and fewest number of hops
 * between a source and a target through a set of relays.
 */
class ShortestPathRouter {

    constructor(...relays) {
        this.relays = relays;
    }

    /*
     * This implementation finds a shortest route from [_source] to [_target].
     *
     * Returns { path: <route>, hops: <count>, distance: <km> } with
     * <route> set to null if no path found, else <route> is a list of names,
     * starting with that of [_source] and ending with that of [_target], and
     * a potentially empty list of names from the relays.
     *
     * All of [_source], [_target], and each relay must have a visible()
     * method that tests the commutative reachability between the method
     * target and its argument.
     *
     * Similarly, all of the above must have a distance() method that computes
     * the distance between the receiver and the method argument.
     *
     * This implementation traverses in a depth first manner the visibility
     * graph of the mesh of the source, target, and the relays, and returns
     * the shortest one found.
     *
     * The algorithm is a recursive one, advancing one hop at a time over hops
     * not yet seen on the current path, starting at [_target] and recording
     * the total distance when [_source] is reached.
     */
    route(_source, _target, trace) {
        var source = new Node(_source);
        var target = new Node(_target);

        var relays = this.relays.map((point, index) => new Node(point, index));
        return shortest_path(source, target, trace, node => relays, (node, next) => node.point.visible(next.point) && !next.encountered(true), next => next.encountered(false));
    }
}
