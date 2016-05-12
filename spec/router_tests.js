/*
 * Copyright © Tibor Adam Varga. All rights reserved.
 */

/* jshint node:true, esversion:6, jasmine:true */

const Router = require('../router');

/*
 * A dummy relay with a simple visibility rule:
 * if their X coordinates are not farther than 1 then two relays can see one
 * another.
 */
class DummyRelay {

    constructor(name, x, y) {
        this.name = name;
        this.x = x;
        this.y = y;
    }

    visible(that) {
        var d = this.x - that.x;
        return d < 2 && d > -2;
    }

    distance(that) {
        var dx = this.x - that.x;
        var dy = this.y - that.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
}

function relay(name, x, y) {
    return new DummyRelay(name, x, y);
}

function names(path) {
    return !path ? null : path.map(relay => relay.name);
}

describe('relay router', function() {
    it('works with no relays and no route', function() {
        var router = new Router();
        expect(names(router.route(relay('source', 0, 0), relay('target', 2, 0)))).toBeNull();
    });

    it('works with no relays and a route', function() {
        var router = new Router();
        expect(names(router.route(relay('source', 0, 0), relay('target', 0, 0)))).toEqual(['source', 'target']);
    });

    it('works with a single relay and no route', function() {
        var router = new Router(relay('relay1', 4, 0));
        expect(names(router.route(relay('source', 0, 0), relay('target', 2, 0)))).toBeNull();
    });

    it('works with a single relay and a route', function() {
        var router = new Router(relay('relay', 1, 0));
        expect(names(router.route(relay('source', 0, 0), relay('target', 2, 0)))).toEqual(['source', 'relay', 'target']);
    });

    it('finds a single longer route', function() {
        var router = new Router(relay('relay1', 1, 0), relay('relay2', 2, 0), relay('relay3', 3, 0), relay('relay4', 4, 0), relay('relay5', 5, 0));
        expect(names(router.route(relay('source', 0, 0), relay('target', 6, 0)))).toEqual(['source', 'relay1', 'relay2', 'relay3', 'relay4', 'relay5', 'target']);
    });

    it('finds no route when the first hop is impossible', function() {
        var router = new Router(relay('relay1', 2, 0), relay('relay2', 3, 0), relay('relay3', 4, 0), relay('relay4', 5, 0), relay('relay5', 6, 0));
        expect(names(router.route(relay('source', 0, 0), relay('target', 7, 0)))).toBeNull();
    });

    it('finds no route when the last hop is impossible', function() {
        var router = new Router(relay('relay1', 1, 0), relay('relay2', 2, 0), relay('relay3', 3, 0), relay('relay4', 4, 0), relay('relay5', 5, 0));
        expect(names(router.route(relay('source', 0, 0), relay('target', 7, 0)))).toBeNull();
    });

    it('finds route early', function() {
        var router = new Router(relay('relay1', 1, 0), relay('relay2', 2, 0), relay('relay3', 3, 0), relay('relay4', 4, 0), relay('relay5', 5, 0));
        expect(names(router.route(relay('source', 0, 0), relay('target', 2, 0)))).toEqual(['source', 'relay1', 'target']);
    });

    it('finds shorter hops', function() {
        var router = new Router(relay('relay1', 1, 1), relay('relay2', 1, 0), relay('relay3', 2, 1), relay('relay4', 2, 0));
        expect(names(router.route(relay('source', 0, 0), relay('target', 3, 0)))).toEqual(['source', 'relay2', 'relay4', 'target']);
    });
});
