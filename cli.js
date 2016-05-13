#!/usr/bin/env node

/*
 * Copyright © Tibor Adam Varga. All rights reserved.
 */

/* See https://reaktor.com/orbital-challenge/ */

/* jshint node:true, esversion:6 */

'use strict';

const SHORT_PARAM = '--short';
const FAST_PARAM = '--fast';

function usage() {
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
    console.info(' ', `-h, -?, --help  Print this text and terminates.`);
    console.info();
    console.info(' ', `${SHORT_PARAM}         Selects the shortest path algorithm over the default least`);
    console.info(' ', `                hops algorithm.`);
    console.info();
    console.info(' ', `${FAST_PARAM}:         Selects the fast algorithm over the default least hops.`);
    console.info(' ', `                algorithm.`);
    console.info();
    process.exit();
}

var short = false;
var fast = false;

const parameters = process.argv;
parameters.shift();

const name = parameters.shift().split('/');
for (var argument = parameters.shift(); argument && !argument.indexOf('-'); argument = parameters.shift()) {

    if (argument === '-h' || argument === '-?' || argument === '--help') {
        usage();
    } else if (argument === SHORT_PARAM) {
        short = true;
    } else if (argument === FAST_PARAM) {
        fast = true;
    }
}

if (fast && short) {
    console.info(`Only one of ${SHORT_PARAM} and ${FAST_PARAM} can be specified.`);
    process.exit();
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

        const router = factory[short ? routers.SHORTEST_PATH : fast ? routers.FAST : routers.LEAST_HOPS](...configuration.satellites);

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
