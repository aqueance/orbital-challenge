/*
 * Copyright © Tibor Adam Varga. All rights reserved.
 */

/* See https://reaktor.com/orbital-challenge/ */

/* jshint node:true, esversion:6 */

'use strict';

class Routers {

    static leastHops(...relays) {
        return new LeastHopsRouter(...relays);
    }

    static shortestPath(...relays) {
        return new ShortestPathRouter(...relays);
    }
}

module.exports = Routers;

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
    return path.length === 1 ? null : path.map(node => node.point);
}

/*
 * Finds a route with the least number of hops between a source and a target
 * through a set of relays.
 */
class LeastHopsRouter {

    constructor(...relays) {
        this.relays = relays;
    }

    /*
     * This implementation finds route from [_source] to [_target] with the
     * least number of hops over the relays.
     *
     * Returns [null] if no path found, else return the path as a list of
     * names, starting with that of [_source] and ending with that of
     * [_target], and a potentially empty list of names from the relays.
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
     *     possible routes found and selecting the one with the shortest
     *     distance at each hop.
     *
     * Phase 1: the possible routes are explored using the following
     * algorithm:
     *  1. Set [frontier] to be a list with [_source] as its only element.
     *  2. Set [outskirts] to be the relays.
     *  3. If [frontier] is not empty, repeat:
     *     a. Find all elements in [frontier] that can directly reach
     *        [_target].
     *     b. Add each hit to the list of nodes that can directly reach
     *        [_target].
     *     c. If any such element is found, skip to Phase 2.
     *     d. Find all satellites in [outskirts] that are reachable from any
     *        element in [frontier].
     *     e. Add each hit to the list of nodes that can directly reach that
     *        element.
     *     f. Set [frontier] to the list of satellites thus found.
     *     g. Remove [frontier] from [outskirts].
     *     h. Go to step 3.
     *  4. Conclude that there is no viable route.
     *
     * Phase 2: compute a route by the following algorithm:
     *  1. Set [node] to be [_target].
     *  2. Set [path] to be a list with [node] as its only element.
     *  3. If [node] has elements added in step 3.b or 3.e in the Phase 1,
     *     repeat:
     *     a. Compute the distance from [node] to all elements added to that
     *        node.
     *     b. Find the shortest distance among them.
     *     c. Select the element with the shortest distance thereto.
     *     d. Set [node] to that element.
     *     e. Add [node] to the beginning of [path].
     */
    route(_source, _target, trace) {
        var source = new Node(_source);
        var target = new Node(_target);

        var frontier = [ source ];
        var outskirts = this.relays.map((point, index) => new Node(point, index));

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

            if (trace && visible.length) trace(node.point.name, '<', visible.map(node => node.point.name));
            return visible.length;
        }

        do {
            if (reachable(target)) break;

            [ frontier, outskirts ] = divide(outskirts, reachable);

            if (trace) trace();
        } while (frontier.length);

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
 * Finds a route with the shortest total distance and least number of hops
 * between a source and a target through a set of relays.
 */
class ShortestPathRouter {

    constructor(...relays) {
        this.relays = relays;
    }

    /*
     * This implementation finds a shortest route from [_source] to [_target].
     *
     * Returns [null] if no path found, else return the path as a list of
     * names, starting with that of [_source] and ending with that of
     * [_target], and a potentially empty list of names from the relays.
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

        /*
         * Recursively traverses an acyclic directed graph depth first.
         *
         * [path]     maintains the current path of descent
         * [distance] is the length of path
         * [node]     is the node just encountered
         * [shortest] is a data structure that maintains the current shortest full
         *            path seen so far
         *
         * Returns the shortest path and its distance as
         * { path: Node[], distance: number }.
         */
        function descend(path, length, node, shortest) {
            if (trace) trace('---', node.point.name);

            if (node.point.visible(source.point)) {
                if (trace) trace(node.point.name, '>', source.point.name);
                var distance = length + node.point.distance(source.point);

                if ((!shortest || shortest.distance > distance || (shortest.distance === distance && path.length < shortest.path.length))) {
                    if (trace) trace('=', distance, path.slice().reverse().map(node => node.point.name));
                    shortest = { path: path.slice(), distance: distance };
                }
            }

            for (let i = 0; i < relays.length; ++i) {
                let next = relays[i];

                if (node.point.visible(next.point) && !next.encountered(true)) {
                    if (trace) trace(node.point.name, '>', next.point.name);

                    path.unshift(next);
                    shortest = descend(path, length + node.point.distance(next.point), next, shortest);
                    path.shift();
                    next.encountered(false);
                }
            }

            return shortest;
        }

        var route = descend([], 0, target);
        return sanitize((!route ? [] : [source].concat(route.path)).concat(target));
    }
}
