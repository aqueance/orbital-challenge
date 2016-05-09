#!/usr/bin/env node

/*
 * Copyright © Tibor Adam Varga. All rights reserved.
 */

/* See https://reaktor.com/orbital-challenge/ */

/* jshint node:true, esversion:6 */

'use strict';

if (process.argv.length < 3) {
    console.info('Please specify the challenge data file name');
    process.exit(-1);
}

const TRACE = false;

const fs = require('fs');
const content = fs.readFileSync(process.argv[2], { encoding: 'utf8' });

const parse = require('./parser').parse;
const route = require('./router');

const trace = (TRACE ? console.log : null);

const configuration = parse(content, trace);

console.info(configuration.comments.join('\n'));
if (trace) trace();

const path = route(configuration, trace);
if (trace) trace();

if (!path) {
    console.info('No route found');
} else {
    console.info(path.map(node => node.point.name).join(' > '));
}

