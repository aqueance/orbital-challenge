#!/usr/bin/env node

/*
 * Copyright © Tibor Adam Varga. All rights reserved.
 */

/* See https://reaktor.com/orbital-challenge/ */

/* jshint node:true, esversion:6 */

'use strict';

var argument = process.argv[2];

if (argument === '-h' || argument === '-?' || argument === '--help') {
    const deployment = require('./package');

    const name = process.argv[1].split('/');
    console.info(deployment.description);
    console.info();
    console.info('Usage with a specific data file:');
    console.info();
    console.info('  ', name[name.length - 1], '<data file>');
    console.info();
    console.info('Usage with a random data file:');
    console.info();
    console.info('  ', 'curl -s \'https://space-fast-track.herokuapp.com/generate\' |', name[name.length - 1]);
    console.info();
    process.exit();
}

const TRACE = false;

const fs = require('fs');

const trace = (TRACE ? console.log : null);

const read = require('./reader');
const parse = require('./parser').parse;
const Router = require('./router');

read(argument)
    .then(parse)
    .then(configuration => {
        console.info(configuration.comments.join('\n'));

        const router = new Router(configuration.satellites);

        if (trace) trace();
        const route = router.route(configuration.source, configuration.target, trace);

        if (trace) trace();
        console.info(!route ? 'No route found' : route.map(item => item.name).join(' > '));
    })
    .catch(console.error);
