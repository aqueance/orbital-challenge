/*
 * Copyright © Tibor Adam Varga. All rights reserved.
 */

/* See https://reaktor.com/orbital-challenge/ */

/* jshint node:true, esversion:6 */

'use strict';

/*
 * Routes between a source and a target through a set of relays.
 */
class Router {

    constructor(relays) {
        this.relays = relays;
    }

    route(source, target, trace) {
        return _route(trace, source, target, this.relays);
    }
}

module.exports = Router;

/*
 * Represents a node in a directed graph.
 *
 * The node has a Point and an list of other Nodes to represent edges.
 */
class Node {

    constructor(point) {
        this.point = point;
        this.edges = [];
    }

    visible(that) {
        return this.point.visible(that.point);
    }

    connect(that) {
        this.edges.push(that);
        return that;
    }
}

/*
 * This function finds the shortest route from [_source] to [_target]
 * with the least number of hops over [_relays].
 *
 * Returns [null] if no path found, else return the path as a list of names,
 * starting with that of [_source] and ending with that of [_target], and a
 * potentially empty list of names from [_relays].
 *
 * All of [_source], [_target], and each element of [_relays] have a visible()
 * method that tests the commutative reachability between the method target
 * and its argument.
 *
 * Similarly, all of the above must have a connect() method to record the fact
 * that the method target and the method argument are directly reachable from
 * one another.
 *
 * The algorithm works in two phases:
 *  1. first moving forward from [_source] toward [_target] over [_relays]
 *     in steps and recording the ones reachable from the relays found in the
 *     last step,
 *  2. the moving backward from [_target] toward [_source] over the possible
 *     routes found and selecting the one with the shortest distance at each
 *     hop.
 *
 * Phase 1: the possible routes are explored using the following algorithm:
 *  1. Set [frontier] to be a list with [_source] as its only element.
 *  2. Set [outskirts] to be [_relays].
 *  3. If [frontier] is not empty, repeat:
 *     a. Find all elements in [frontier] that can directly reach [_target].
 *     b. Add each hit to the list of nodes that can directly reach [_target].
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
 *     a. Compute the distance from [node] to all elements added to that node.
 *     b. Find the shortest distance among them.
 *     c. Select the element with the shortest distance thereto.
 *     d. Set [node] to that element.
 *     e. Add [node] to the beginning of [path].
 */
function _route(trace, _source, _target, _relays) {
    var source = new Node(_source);
    var target = new Node(_target);

    var frontier = [ source ];
    var outskirts = _relays.map(point => new Node(point));

    /*
     * This function finds all nodes in [frontier] that can directly reach [node]
     * and connects with [node] those found.
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

    return path.length === 1 ? null : path.map(node => node.point);
}

/*
 * Splits the contents of [list] into two lists based on
 * what [predicate] returns for each element of [list].
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
