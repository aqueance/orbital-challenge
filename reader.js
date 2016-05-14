#!/usr/bin/env node

/*
 * Copyright © Tibor Adam Varga. All rights reserved.
 */

/* jshint node:true, esversion:6 */

'use strict';

const fs = require('fs');

module.exports = function read(path) {
    return new Promise(function(resolve, reject) {
        const input = !path || path === '-' ? process.stdin : fs.createReadStream(path, { autoClose: true });

        input.setEncoding('utf8');

        input.on('error', reject);

        var data = '';

        input.on('readable', function() {
            var chunk;
            while ((chunk = input.read())) {
                data += chunk;
            }
        });

        input.on('end', function() {
            resolve(data.trim());
        });
    });
};


