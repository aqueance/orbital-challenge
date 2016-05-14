#!/usr/bin/env node

/*
 * Copyright © Tibor Adam Varga. All rights reserved.
 */

/* See https://reaktor.com/orbital-challenge/ */

/* jshint node:true, esversion:6 */

'use strict';

const SHORT = '--short';
const FAST = '--fast';

function usage() {
    const deployment = require('./package');
    const command = name[name.length - 1];

    console.info(`${deployment.description} - v${deployment.version}`);
    console.info();
    console.info('Usage with a specific data file:');
    console.info();
    console.info(`  ${command} [options] <data file>`);
    console.info();
    console.info('Usage with a random data file:');
    console.info();
    console.info(`  curl -s \'https://space-fast-track.herokuapp.com/generate\' | ${command} [options]`);
    console.info();
    console.info('Options:');
    console.info();
    console.info(`  -h, -?, --help  Print this text and terminates.`);
    console.info(`  ${SHORT}         Selects the shortest path algorithm over the default fewest`);
    console.info('                  hops algorithm.');
    console.info(`  ${FAST}          Selects the fast algorithm over the default fewest hops.`);
    console.info('                  algorithm.');
    console.info();
    process.exit();
}

var short = false;
var fast = false;
var input;

const parameters = process.argv;
parameters.shift();

const name = parameters.shift().split('/');
for (let argument = parameters.shift(); argument; argument = parameters.shift()) {
    switch (argument) {
        case '-h':
            /* fall through */
        case '-?':
            /* fall through */
        case '--help':
            usage();
            break;
        case SHORT:
            short = true;
            break;
        case FAST:
            fast = true;
            break;
        default:
            input = argument;
            break;
    }
}

if (fast && short) {
    console.info(`Only one of ${SHORT} and ${FAST} can be specified.`);
    process.exit();
}

const TRACE = false;

const fs = require('fs');

const trace = (TRACE ? console.log : null);

const read = require('./reader');
const parse = require('./parser').parse;
const routers = require('./routers');
const factory = routers.factory;

function comments(configuration) {
    configuration.comments.forEach(comment => console.info(comment));
}

read(input)
    .then(parse)
    .then(configuration => {
        const router = factory[short ? routers.SHORTEST_PATH : fast ? routers.FAST : routers.FEWEST_HOPS](...configuration.satellites);
        const route = router.route(configuration.source, configuration.target, trace);

        if (trace) trace();

        if (!route.path) {
            comments(configuration);
            console.info('#NO ROUTE');
        } else {
            console.info(`#ALGORITHM: ${short ? 'Shortest Path' : fast ? 'Fast' : 'Fewest Hops'}`);
            console.info(`#METRICS: ${route.distance.toFixed(3)} km over ${route.hops} hops`);
            comments(configuration);
            console.info(route.path.slice(1, -1).map(item => item.name).join(','));
        }
    })
    .catch(console.error);
