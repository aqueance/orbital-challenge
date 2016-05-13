#!/usr/bin/env node

/*
 * Copyright © Tibor Adam Varga. All rights reserved.
 */

/* See https://reaktor.com/orbital-challenge/ */

/* jshint node:true, esversion:6 */

'use strict';

var short = false;
var argument = process.argv[2];

if (argument === '-h' || argument === '-?' || argument === '--help') {
    const name = process.argv[1].split('/');
    const deployment = require('./package');

    console.info(deployment.description, '- v' + deployment.version);
    console.info();
    console.info('Usage with a specific data file:');
    console.info();
    console.info(' ', name[name.length - 1], '[options]', '<data file>');
    console.info();
    console.info('Usage with a random data file:');
    console.info();
    console.info(' ', 'curl -s \'https://space-fast-track.herokuapp.com/generate\' |', name[name.length - 1], '[options]');
    console.info();
    console.info('Options:');
    console.info();
    console.info(' ', '--short: Selects the shortest path algorithm over the default least hops');
    console.info(' ', '         algorithm.');
    console.info();
    process.exit();
} else if (argument === '--short') {
    short = true;
    argument = process.argv[3];
}


const TRACE = false;

const fs = require('fs');

const trace = (TRACE ? console.log : null);

const read = require('./reader');
const parse = require('./parser').parse;
const routers = require('./routers');
const factory = routers.factory;

read(argument)
    .then(parse)
    .then(configuration => {
        console.info(configuration.comments.join('\n'));

        const router = factory[short ? routers.SHORTEST_PATH : routers.LEAST_HOPS](...configuration.satellites);

        if (trace) trace();
        const route = router.route(configuration.source, configuration.target, trace);

        if (trace) trace();
        if (!route.path) {
            console.info('# No route found');
        } else {
            console.info(`#METRICS: ${route.distance.toFixed(3)} km over ${route.hops} hops`);
            console.info(route.path.map(item => item.name).join(' > '));
        }
    })
    .catch(console.error);
