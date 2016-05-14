/*
 * Copyright © Tibor Adam Varga. All rights reserved.
 */

/* jshint node:true, esversion:6 */

'use strict';

const Point = require('./geometry').Point;

/*
 * A named location in space.
 */
class Location extends Point {

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
    const comments = [];
    const satellites = [];

    var source = null;
    var target = null;

    contents.split('\n').forEach(function(line) {
        if (line.indexOf('#')) {
            let parts = line.split(/,\s*/);
            let type = parts.shift();

            if (type === 'ROUTE') {
                source = new Location('SOURCE', parts.slice(0, 2));
                target = new Location('TARGET', parts.slice(2, 4));
            } else {
                satellites.push(new Location(type, parts));
            }
        } else {
            comments.push(line);
        }
    });

    return new ChallengeDetails(source, target, satellites, comments);
}

module.exports = Object.create(null, {
    Location: { value: Location, enumerable: true },
    ChallengeDetails: { value: ChallengeDetails, enumerable: true },
    parse: { value: parse, enumerable: true }
});
