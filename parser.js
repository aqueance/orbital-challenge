/*
 * Copyright © Tibor Adam Varga. All rights reserved.
 */

/* See https://reaktor.com/orbital-challenge/ */

/* jshint node:true, esversion:6 */

'use strict';

const Geometry = require('./geometry');

/*
 * A named location in space.
 */
class Location extends Geometry.Point {

    constructor(name, coordinates) {
        super(coordinates);
        this.name = name;
    }
}

/*
 * Details of the random challenge data.
 */
class ChallengeDetails {

    constructor(source, target, satellites, comments) {
        this.source = source;
        this.target = target;
        this.satellites = satellites;
        this.comments = comments;
    }
}

/*
 * Parses the challenge data file from https://space-fast-track.herokuapp.com/generate
 */
function parse(contents) {
    var satellites = [];
    var source = null;
    var target = null;
    var comments = [];

    contents.split('\n').forEach(function(line) {
        if (~line.indexOf('#')) {
            comments.push(line);
        } else {
            var parts = line.split(/,\s*/);
            var type = parts.shift();

            if (type === 'ROUTE') {
                source = new Location('SOURCE', parts.slice(0, 2));
                target = new Location('TARGET', parts.slice(2, 4));
            } else {
                satellites.push(new Location(type, parts));
            }
        }
    });

    return new ChallengeDetails(source, target, satellites, comments);
}

module.exports = Object.create(null, {
    Location: { value: Location, enumerable: true },
    ChallengeDetails: { value: ChallengeDetails, enumerable: true },
    parse: { value: parse, enumerable: true }
});
