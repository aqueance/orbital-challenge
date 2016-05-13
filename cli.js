#!/usr/bin/env node

/*
 * Copyright © Tibor Adam Varga. All rights reserved.
 */

/* See https://reaktor.com/orbital-challenge/ */

/* jshint node:true, esversion:6 */

'use strict';

var shortest = false;
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
    console.info(' ', '--shortest: Selects the shortest path algorithm over');
    console.info(' ', '            the default least hops algorithm.');
    console.info();
    process.exit();
} else if (argument === '--shortest') {
    shortest = true;
    argument = process.argv[3];
}


const TRACE = false;

const fs = require('fs');

const trace = (TRACE ? console.log : null);

const read = require('./reader');
const parse = require('./parser').parse;
const Routers = require('./router');

read(argument)
    .then(parse)
    .then(configuration => {
        console.info(configuration.comments.join('\n'));

        const router = Routers[shortest ? 'shortestPath' : 'leastHops'](...configuration.satellites);

        if (trace) trace();
        const route = router.route(configuration.source, configuration.target, trace);

        if (trace) trace();
        console.info(!route ? 'No route found' : route.map(item => item.name).join(' > '));
    })
    .catch(console.error);
