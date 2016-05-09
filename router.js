/*
 * Copyright © Tibor Adam Varga. All rights reserved.
 */

/* See https://reaktor.com/orbital-challenge/ */

/* jshint node:true, esversion:6 */

'use strict';

/*
 * This function finds the shortest route from [details.source] to [details.target]
 * with the least number of hops over [details.satellites].
 *
 * The algorithm works in two phases:
 *  1. finding the possible routes from [details.source] forward over [details.satellites]
 *     toward [details.target], and then
 *  2. moving backward from [details.target] toward [details.source] over the possible
 *     routes and selecting the one with the shortest physical distance.
 *
 * The possible routes are explored using the following algorithm:
 *  1. Set [frontier] to be [details.source].
 *  2. Set [outskirts] to be [details.satellites].
 *  3. Repeat the following steps:
 *     1. Find all elements in [frontier] that can reach [details.target].
 *     2. Add each hit to the list of positions that can directly reach [details.target].
 *     3. If any such element is found, go to second phase of the full algorithm.
 *     4. Find all satellites in [outskirts] that are reachable from any
 *        element in [frontier].
 *     4. Add each hit to the list of positions that can directly reach that element.
 *     5. Set [frontier] to the list of satellites thus found.
 *     6. Remove [frontier] from [outskirts].
 *     7. If [frontier] is not empty, go to step 3.
 *
 * If [details.target] has not been reached, conclude that there is no viable route.
 *
 * If [details.target] has been reached, compute the shortest route by the following
 * algorithm:
 *  1. Set [node] to be [details.target].
 *  2. Set [path] to be a list with [node] as its only element.
 *  3. If [node] has elements added in step 3.2 or 3.4 in the first phase, repeat
 *     the following steps:
 *     1. Compute the distance from [node] to all elements found.
 *     2. Find the smallest distance among them.
 *     3. Select the element with the shortest distance thereto.
 *     4. Set [node] to that element.
 *     5. Add [node] to the beginning of [path].
 */
module.exports = function route(trace, details) {
    var source = new Node(details.source);
    var target = new Node(details.target);

    var frontier = [ source ];
    var outskirts = details.satellites.map(point => new Node(point));

    /*
     * This function finds all nodes in [frontier] that can directly reach [node]
     * and connects those nodes with [node].
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

    return path.length === 1 ? null : path;
};

/*
 * Splits the contents of [list] into two lists based on
 * what [predicate] returns for each element of [list].
 */
function divide(list, predicate) {
    var truthy = [];
    var falsy = [];

    for (var i = 0, ii = list.length; i < ii; ++i) {
        var item = list[i];
        (predicate(item) ? truthy : falsy).push(item);
    }

    return [ truthy, falsy ];
}

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
