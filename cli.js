#!/usr/bin/env node

/*
 * Copyright © Tibor Adam Varga. All rights reserved.
 */

/* See https://reaktor.com/orbital-challenge/ */

/* jshint node:true, esversion:6 */

'use strict';

const TRACE = false;

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

const parameters = process.argv;
parameters.shift();

const name = parameters.shift().split('/');

const options = parameters.reduce((options, argument) => {
    switch (argument) {
    case '-h':
        /* fall through */
    case '-?':
        /* fall through */
    case '--help':
        usage();
        break;
    case SHORT:
        options.short = true;
        break;
    case FAST:
        options.fast = true;
        break;
    default:
        options.input = argument;
        break;
    }

    return options;
}, Object.create(null, {
    short: { value: false, writable: true },
    fast: { value: false, writable: true },
    input: { value: undefined, writable: true }
}));

if (options.fast && options.short) {
    console.info(`Only one of ${SHORT} and ${FAST} can be specified.`);
    process.exit();
}

const fs = require('fs');

const read = require('./reader');
const parse = require('./parser').parse;
const routers = require('./routers');
const factory = routers.factory;

function comments(configuration) {
    configuration.comments.forEach(comment => console.info(comment));
}

const trace = TRACE ? console.log : null;

read(options.input)
    .then(parse)
    .then(configuration => {
        const router = factory[options.short ? routers.SHORTEST_PATH : options.fast ? routers.FAST : routers.FEWEST_HOPS](...configuration.satellites);
        const route = router.route(configuration.source, configuration.target, trace);

        if (trace) trace();

        if (!route.path) {
            comments(configuration);
            console.info('#NO ROUTE');
        } else {
            console.info(`#ALGORITHM: ${options.short ? 'Shortest Path' : options.fast ? 'Fast' : 'Fewest Hops'}`);
            console.info(`#METRICS: ${route.distance.toFixed(3)} kms over ${route.hops} hops`);
            comments(configuration);
            console.info(route.path.slice(1, -1).map(item => item.name).join(','));
        }
    })
    .catch(console.error);
