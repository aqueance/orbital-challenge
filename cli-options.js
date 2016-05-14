/*
 * Copyright © Tibor Adam Varga. All rights reserved.
 */

/* jshint node:true, esversion:6 */

'use strict';

const SHORT = '--short';
const FAST = '--fast';

const deployment = require('./package');

function usage(name, output, terminate) {
    const command = name[name.length - 1];

    output(`${deployment.description} - v${deployment.version}`);
    output();
    output('Usage with a specific data file:');
    output();
    output(`  ${command} [options] <data file>`);
    output();
    output('Usage with a random data file:');
    output();
    output(`  curl -s \'https://space-fast-track.herokuapp.com/generate\' | ${command} [options]`);
    output(`  wget -q -O - \'https://space-fast-track.herokuapp.com/generate\' | ${command} [options]`);
    output();
    output('Options:');
    output();
    output(`  -h, -?, --help  Print this text and terminate.`);
    output(`  ${SHORT}         Selects the shortest path algorithm over the default fewest`);
    output('                  hops algorithm.');
    output(`  ${FAST}          Selects the fast algorithm over the default fewest hops.`);
    output('                  algorithm.');
    output();

    terminate();
}

/*
 * Processes command line arguments, and returns an object with the following
 * properties:
 *
 * .short: the Shortest Path algorithm has been selected [true/false].
 * .fast:  the Fast algorithm has been selected [true/false].
 * .input: the input file to process [string, may be undefined].
 */
class Options {

    /*
     * [output]    a function to call to emit a line of message.
     * [terminate] a function to call to terminate the process on error.
     * [args]      a list of strings, the first of which is the name of the
     *             executed script, and the rest are command line arguments.
     */
    constructor(output, terminate, args) {
        const name = args.shift().split('/');

        this.short = false;
        this.fast = false;
        this.input = undefined;

        args.reduce((options, argument) => {
            switch (argument) {
            case '-h':
                /* fall through */
            case '-?':
                /* fall through */
            case '--help':
                usage(name, output, terminate);
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
        }, this);

        if (this.fast && this.short) {
            output(`Only one of ${SHORT} and ${FAST} can be specified.`);
            terminate();
        }
    }
}

module.exports = Options;
