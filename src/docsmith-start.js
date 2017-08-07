#!/usr/bin/env node

/**
 * Module dependencies.
 */

const debug = require('debug')('docsmith:start');
const program = require('commander');
const start = require('./docsmith/start');
const config = require('./docsmith/utils/settings').config;

let workspace;

program
  .arguments('[workspace]')
  .option('-s, --source [path]', '[migrate] Source folder path]')
  .option('--baseurl [baseurl]', 'Set site.baseurl metadata value.')
  .option('-n, --no-watch', 'Do not watch content folder and serve on local server. Watches by default.')
  .option('-d, --debug', 'Enable /debug-ui url for debugging pipeline.')
  .option('-f, --force', 'Initialise whether the current directory is empty or not.')
  .option('-l, --link', 'For development purposes. Link local packages.')
  .action(function(wksp) {
    workspace = wksp;
  });

program.parse(process.argv);

const { link, source, baseurl, watch, debug: dbg } = program;

if (typeof workspace === 'undefined') workspace = 'toolkit';

// check if we could resolve the config.
if (config) {
  debug('config', config);
  // called from a content as code instance, initialise from the instance configuration
  start.run({ workspace, config, link, source, watch, dbg, baseurl });
} else {
  console.warn('Could not find config. Aborting start. Please contact the developer');
}
