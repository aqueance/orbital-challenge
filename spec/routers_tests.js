/*
 * Copyright © Tibor Adam Varga. All rights reserved.
 */

/* jshint node:true, esversion:6, jasmine:true */

const routers = require('../routers');
const factory = routers.factory;

/*
 * A dummy relay with a simple visibility rule:
 * if their X coordinates are not farther than 1 then two relays can see one
 * another.
 */
class DummyRelay {

    constructor(name, x, y, ...reachable) {
        this.name = name;
        this.x = x;
        this.y = y;
        this.reachable = !reachable.length ? null : reachable.reduce(function(map, index) { map[index] = true; return map; }, Object.create(null));
    }

    visible(that) {
        if (this.reachable) {
            return !!this.reachable[that.x];
        } else if (that.reachable) {
            return that.visible(this);
        } else {
            var d = this.x - that.x;
            return d < 2 && d > -2;
        }
    }

    distance(that) {
        var dx = this.x - that.x;
        var dy = this.y - that.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
}

function relay(name, x, y, ...reachable) {
    return new DummyRelay(name, x, y, ...reachable);
}

function names(route) {
    return !route.path ? null : route.path.map(relay => relay.name);
}

describe('least hops router', function() {
    const variant = routers.LEAST_HOPS;

    common_router_checks(variant);

    it('finds the path with fewer hops out of two routes', function() {
        var router = factory[variant](relay('relay1', 1, 10), relay('relay2', 1, 0), relay('relay3', 2, 10, 1, 3, 4), relay('relay4', 2, 0), relay('relay5', 3, 0));
        expect(names(router.route(relay('source', 0, 0), relay('target', 4, 0)))).toEqual(['source', 'relay1', 'relay3', 'target']);
    });

    it('finds the path with fewer hops out of three routes', function() {
        var router = factory[variant](relay('relay0', 1, 0, 0, 2, 3), relay('relay1', 3, 10), relay('relay2', 2, 5, 1, 3, 4), relay('relay3', 4, 5), relay('relay4', 2, 0), relay('relay5', 3, 0), relay('relay6', 4, 0));
        expect(names(router.route(relay('source', 0, 0), relay('target', 5, 0)))).toEqual(['source', 'relay0', 'relay5', 'relay6', 'target']);
    });
});

describe('shortest path router', function() {
    const variant = routers.SHORTEST_PATH;

    common_router_checks(variant);

    it('finds the shorter path out of two routes', function() {
        var router = factory[variant](relay('relay1', 1, 10), relay('relay2', 1, 0), relay('relay3', 2, 10, 1, 3, 4), relay('relay4', 2, 0), relay('relay5', 3, 0));
        expect(names(router.route(relay('source', 0, 0), relay('target', 4, 0)))).toEqual(['source', 'relay2', 'relay4', 'relay5', 'target']);
    });

    it('finds the shorter path out of three routes', function() {
        var router = factory[variant](relay('relay0', 1, 0, 0, 2, 3), relay('relay1', 3, 10), relay('relay2', 2, 5, 1, 3, 4), relay('relay3', 4, 5), relay('relay4', 2, 0), relay('relay5', 3, 0), relay('relay6', 4, 0));
        expect(names(router.route(relay('source', 0, 0), relay('target', 5, 0)))).toEqual(['source', 'relay0', 'relay5', 'relay6', 'target']);
    });
});

function common_router_checks(variant, trace) {
    it('works with no relays and no route', function() {
        var router = factory[variant]();
        expect(names(router.route(relay('source', 0, 0), relay('target', 2, 0), trace))).toBeNull();
    });

    it('works with no relays and a route', function() {
        var router = factory[variant]();
        expect(names(router.route(relay('source', 0, 0), relay('target', 1, 0), trace))).toEqual(['source', 'target']);
    });

    it('works with a single relay and no route', function() {
        var router = factory[variant](relay('relay1', 4, 0));
        expect(names(router.route(relay('source', 0, 0), relay('target', 2, 0), trace))).toBeNull();
    });

    it('works with a single relay and a route', function() {
        var router = factory[variant](relay('relay', 1, 0));
        expect(names(router.route(relay('source', 0, 0), relay('target', 2, 0), trace))).toEqual(['source', 'relay', 'target']);
    });

    it('finds a single longer route', function() {
        var router = factory[variant](relay('relay1', 1, 0), relay('relay2', 2, 0), relay('relay3', 3, 0), relay('relay4', 4, 0), relay('relay5', 5, 0));
        expect(names(router.route(relay('source', 0, 0), relay('target', 6, 0), trace))).toEqual(['source', 'relay1', 'relay2', 'relay3', 'relay4', 'relay5', 'target']);
    });

    it('finds no route when the first hop is impossible', function() {
        var router = factory[variant](relay('relay1', 2, 0), relay('relay2', 3, 0), relay('relay3', 4, 0), relay('relay4', 5, 0), relay('relay5', 6, 0));
        expect(names(router.route(relay('source', 0, 0), relay('target', 7, 0), trace))).toBeNull();
    });

    it('finds no route when the last hop is impossible', function() {
        var router = factory[variant](relay('relay1', 1, 0), relay('relay2', 2, 0), relay('relay3', 3, 0), relay('relay4', 4, 0), relay('relay5', 5, 0));
        expect(names(router.route(relay('source', 0, 0), relay('target', 7, 0), trace))).toBeNull();
    });

    it('finds route early', function() {
        var router = factory[variant](relay('relay1', 1, 0), relay('relay2', 2, 0), relay('relay3', 3, 0), relay('relay4', 4, 0), relay('relay5', 5, 0));
        expect(names(router.route(relay('source', 0, 0), relay('target', 2, 0), trace))).toEqual(['source', 'relay1', 'target']);
    });

    it('finds shorter hops', function() {
        var router = factory[variant](relay('relay1', 1, 1), relay('relay2', 1, 0), relay('relay3', 2, 1), relay('relay4', 2, 0));
        expect(names(router.route(relay('source', 0, 0), relay('target', 3, 0), trace))).toEqual(['source', 'relay2', 'relay4', 'target']);
    });
}
