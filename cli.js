#!/usr/bin/env node

/*
 * Copyright © Tibor Adam Varga. All rights reserved.
 */

/* jshint node:true, esversion:6 */

'use strict';

const TRACE = false;

const parameters = process.argv;
parameters.shift();

const Options = require('./cli-options');
const options = new Options(console.info, process.exit, parameters);

const fs = require('fs');

const read = require('./reader');
const parse = require('./parser').parse;
const routers = require('./routers');
const factory = routers.factory;

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

function comments(configuration) {
    configuration.comments.forEach(comment => console.info(comment));
}
