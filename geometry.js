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
 * See http://keisan.casio.com/exec/system/1359534351
 *
 * [latitude], [longitude], [altitude]: spherical polar coordinates
 * [surface]                          : what is [altitude] relative to
 * [accuracy]                         : used to adjust a 0 altitude to elevate
 *                                      things off the surface so that lines of
 *                                      sight don't touch the surface on
 *                                      account of its end points
 */
function spherical2cartesian([ latitude, longitude, altitude ], surface = 0, accuracy = 0) {
    const θ = angle2radians(+longitude);
    const φ = angle2radians(90 - +latitude);
    const r = surface + (+altitude || accuracy);

    const [ sin_θ, cos_θ ] = [ Math.sin(θ), Math.cos(θ) ];
    const [ sin_φ, cos_φ ] = [ Math.sin(φ), Math.cos(φ) ];

    return [
        r * sin_φ * cos_θ,
        r * sin_φ * sin_θ,
        r * cos_φ
    ];
}

const ORIGIN = spherical2cartesian([0, 0, 0]);

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
 * centered at the origin, which is assumed to be at (0, 0, 0).
 *
 * Degenerate cases when [u] or [v] is at or within [radius2]^0.5
 * distance from the origin are not accounted for.
 *
 * See http://mathworld.wolfram.com/Point-LineDistance3-Dimensional.html
 * with [x0] chosen as the origin of the coordinate system,
 * and using [t] without negation or division.
 */
function _visible(u, v, radius2) {
    const d = difference(v, u);
    const l2d = length_2(d);
    const t = dot_product(d, u);
    return t > 0 || t < -l2d || length_2(cross_product(u, v)) > l2d * radius2;
}

class Point {

    constructor(coordinates) {
        this.coordinates = spherical2cartesian(coordinates, RADIUS, ACCURACY);
    }

    visible(point) {
        return _visible(this.coordinates, point.coordinates, RADIUS_2);
    }

    distance(that) {
        return Math.sqrt(length_2(difference(this.coordinates, that.coordinates)));
    }
}

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
            visible: { value: _visible, enumerable: true }
        })
    }
});
