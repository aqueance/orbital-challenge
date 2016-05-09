/*
 * Copyright © Tibor Adam Varga. All rights reserved.
 */

/* jshint node:true, esversion:6 */

'use strict';

const RADIUS = 6371;
const RADIUS_2 = RADIUS * RADIUS;
const ACCURACY = 0.001;

const RADIANS = Math.PI / 180;

function angle2radians(angle) {
    return angle * RADIANS;
}

/*
 * Converts geo-coordinates to right-handed Cartesian coordinates with:
 *   Earth's center as origin
 *   X pointing at you. Yes, you.
 *   Y pointing East
 *   Z pointing North
 *
 *   See http://keisan.casio.com/exec/system/1359534351
 */
function spherical2cartesian(coordinates, surface, accuracy) {
    var latitude = +coordinates[0];
    var longitude = +coordinates[1];
    var altitude = (+coordinates[2] || 0) + (accuracy || 0);   // elevate things off the surface to make sure lines (of sight) don't touch it

    var θ = angle2radians(longitude);
    var φ = angle2radians(90 - latitude);
    var r = surface + altitude;

    var cos_θ = Math.cos(θ);
    var sin_θ = Math.sin(θ);
    var cos_φ = Math.cos(φ);
    var sin_φ = Math.sin(φ);

    return [
        r * sin_φ * cos_θ,
        r * sin_φ * sin_θ,
        r * cos_φ
    ];
}

const ORIGIN = spherical2cartesian([0, 0], 0);

function difference(u, v) {
    return [
        u[0] - v[0],
        u[1] - v[1],
        u[2] - v[2]
    ];
}

function cross_product(u, v) {
    return [
        u[1] * v[2] - u[2] * v[1],
        u[2] * v[0] - u[0] * v[2],
        u[0] * v[1] - u[1] * v[0]
    ];
}

function dot_product(u, v) {
    return u[0] * v[0] + u[1] * v[1] + u[2] * v[2];
}

function length_2(u) {
    return dot_product(u, u);
}

/*
 * Tells if there is a line segment between points [u] and [v]
 * that does not touch or cross a sphere with [radius2]^0.5 radius
 * centered at the origin.
 *
 * Degenerate cases when [u] or [v] is at or within [radius2]^0.5
 * distance from the origin are not accounted for.
 *
 * See http://mathworld.wolfram.com/Point-LineDistance3-Dimensional.html
 * with [x0] chosen as the origin of the coordinate system,
 * and using [t] without negation or division.
 */
function visible(u, v, radius2) {
    var d = difference(v, u);
    var l2d = length_2(d);
    var t = dot_product(d, u);
    return t > 0 || t < -l2d || length_2(cross_product(u, v)) > l2d * radius2;
}

function Point(coordinates) {
    Object.defineProperties(this, {
        coordinates: { value: spherical2cartesian(coordinates, RADIUS, ACCURACY) }
    });
}

Point.prototype = Object.create(Object.prototype, {
    visible: {
        value: function(point) {
            return visible(this.coordinates, point.coordinates, RADIUS_2);
        }
    },
    distance: {
        value: function(that) {
            return Math.sqrt(length_2(difference(this.coordinates, that.coordinates)));
        }
    }
});

module.exports = Object.create(null, {
    ORIGIN: { value: ORIGIN, enumerable: true },
    RADIUS: { value: RADIUS, enumerable: true },
    Point: { value: Point, enumerable: true },
    _internal: {
        enumerable: false,
        value: Object.create(null, {
            spherical2cartesian: { value: spherical2cartesian, enumerable: true },
            difference: { value: difference, enumerable: true },
            cross_product: { value: cross_product, enumerable: true },
            dot_product: { value: dot_product, enumerable: true },
            length_2: { value: length_2, enumerable: true },
            visible: { value: visible, enumerable: true }
        })
    }
});
