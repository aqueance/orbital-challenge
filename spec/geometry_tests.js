/*
 * Copyright © Tibor Adam Varga. All rights reserved.
 */

/* jshint node:true, esversion:6, jasmine:true */

const Geometry = require('../geometry');
const internals = Geometry._internal;

const spherical2cartesian = internals.spherical2cartesian;
const difference = internals.difference;
const length_2 = internals.length_2;
const dot_product = internals.dot_product;
const cross_product = internals.cross_product;
const visible = internals.visible;

describe('Coordinate transformation', function() {
    it('handles the origin', function() {
        var origin = Geometry.ORIGIN;

        expect(origin[0]).toBe(0);
        expect(origin[1]).toBe(0);
        expect(origin[2]).toBe(0);
    });

    it('handles the axes', function() {
        var positive_X = spherical2cartesian([0, 0, 1], 0);
        var positive_Y = spherical2cartesian([0, 90, 1], 0);
        var positive_Z = spherical2cartesian([90, 0, 1], 0);

        expect(positive_X[0]).toBeCloseTo(1);
        expect(positive_X[1]).toBeCloseTo(0);
        expect(positive_X[2]).toBeCloseTo(0);

        expect(positive_Y[0]).toBeCloseTo(0);
        expect(positive_Y[1]).toBeCloseTo(1);
        expect(positive_Y[2]).toBeCloseTo(0);

        expect(positive_Z[0]).toBeCloseTo(0);
        expect(positive_Z[1]).toBeCloseTo(0);
        expect(positive_Z[2]).toBeCloseTo(1);

        var negative_X = spherical2cartesian([180, 0, 1], 0);
        var negative_Y = spherical2cartesian([0, -90, 1], 0);
        var negative_Z = spherical2cartesian([-90, 0, 1], 0);

        expect(negative_X[0]).toBeCloseTo(-1);
        expect(negative_X[1]).toBeCloseTo(0);
        expect(negative_X[2]).toBeCloseTo(0);

        expect(negative_Y[0]).toBeCloseTo(0);
        expect(negative_Y[1]).toBeCloseTo(-1);
        expect(negative_Y[2]).toBeCloseTo(0);

        expect(negative_Z[0]).toBeCloseTo(0);
        expect(negative_Z[1]).toBeCloseTo(0);
        expect(negative_Z[2]).toBeCloseTo(-1);
    });
});

describe('Vector arithmetic', function() {
    it('subtracts vectors', function() {
        var d1 = difference([0, 0, 0], [1, 1, 1]);
        var d2 = difference([1, 2, 3], [3, 2, 1]);

        expect(d1[0]).toBeCloseTo(-1);
        expect(d1[1]).toBeCloseTo(-1);
        expect(d1[2]).toBeCloseTo(-1);

        expect(d2[0]).toBeCloseTo(-2);
        expect(d2[1]).toBeCloseTo(0);
        expect(d2[2]).toBeCloseTo(2);
    });

    it('computes vector length squared', function() {
        expect(length_2([0, 0, 0])).toBeCloseTo(0);
        expect(length_2([1, 0, 0])).toBeCloseTo(1);
        expect(length_2([-1, 0, 0])).toBeCloseTo(1);
        expect(length_2([0, 1, 0])).toBeCloseTo(1);
        expect(length_2([0, -1, 0])).toBeCloseTo(1);
        expect(length_2([0, 0, 1])).toBeCloseTo(1);
        expect(length_2([0, 0, -1])).toBeCloseTo(1);
        expect(length_2([1, 1, 1])).toBeCloseTo(3);
        expect(length_2([-1, -1, -1])).toBeCloseTo(3);
    });

    it('computes dot product', function() {
        expect(dot_product([1, 1, 1], [0, 0, 0])).toBeCloseTo(0);
        expect(dot_product([1, 1, 1], [1, 0, 0])).toBeCloseTo(1);
        expect(dot_product([1, 1, 1], [0, 1, 0])).toBeCloseTo(1);
        expect(dot_product([1, 1, 1], [0, 0, 1])).toBeCloseTo(1);
        expect(dot_product([1, 1, 1], [1, 1, 1])).toBeCloseTo(3);
    });

    it('computes cross product', function() {
        var cp1 = cross_product([1, 0, 0], [0, 1, 0]);

        expect(cp1[0]).toBeCloseTo(0);
        expect(cp1[1]).toBeCloseTo(0);
        expect(cp1[2]).toBeCloseTo(1);

        var cp2 = cross_product([0, 0, 1], [1, 0, 0]);

        expect(cp2[0]).toBeCloseTo(0);
        expect(cp2[1]).toBeCloseTo(1);
        expect(cp2[2]).toBeCloseTo(0);
    });

    it('determines visibility', function() {
        expect(visible([1.2, 0, 0], [0, 1.2, 0], 1)).toBe(false);
        expect(visible([2, 0, 0], [0, 2, 0], 1)).toBe(true);
        expect(visible([2, 0, 0], [0, 2, 0], 2)).toBe(false);
        expect(visible([0, 1.2, 0], [-1.2, 2.4, 0], 1)).toBe(true);
        expect(visible([1.2, 0, 0], [0, 1.2, 0], 0.5)).toBe(true);
    });
});
