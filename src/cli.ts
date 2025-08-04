#!/usr/bin/env node

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { init } from './commands/init.js';
import { exportCommand } from './commands/export.js';
import { applyCommand } from './commands/apply.js';
import { createCommand } from './commands/create.js';

yargs(hideBin(process.argv))
  .command(
    'init',
    'Initialize kintone-as-code project',
    (yargs) => {
      return yargs.option('force', {
        alias: 'f',
        type: 'boolean',
        description: 'Force overwrite existing files',
      });
    },
    (argv) => {
      init({ force: argv.force });
    }
  )
  .command(
    'export',
    'Export kintone app settings',
    (yargs) => {
      return yargs
        .option('app-id', {
          type: 'string',
          demandOption: true,
          description: 'App ID to export',
        })
        .option('name', {
          type: 'string',
          demandOption: true,
          description: 'Schema file name',
        })
        .option('env', {
          type: 'string',
          description: 'Environment name',
        })
        .option('output', {
          type: 'string',
          description: 'Output directory',
        });
    },
    (argv) => {
      exportCommand({
        appId: argv['app-id'],
        name: argv.name,
        env: argv.env,
        output: argv.output,
      });
    }
  )
  .command(
    'apply',
    'Apply schema to kintone app',
    (yargs) => {
      return yargs
        .option('app-id', {
          type: 'string',
          demandOption: true,
          description: 'App ID to apply to',
        })
        .option('schema', {
          type: 'string',
          demandOption: true,
          description: 'Schema file path',
        })
        .option('env', {
          type: 'string',
          description: 'Environment name',
        });
    },
    (argv) => {
      applyCommand({
        appId: argv['app-id'],
        schema: argv.schema,
        env: argv.env,
      });
    }
  )
  .command(
    'create',
    'Create a new kintone app from schema',
    (yargs) => {
      return yargs
        .option('schema', {
          type: 'string',
          demandOption: true,
          description: 'Schema file path',
        })
        .option('name', {
          type: 'string',
          description: 'App name (overrides schema name)',
        })
        .option('env', {
          type: 'string',
          description: 'Environment name',
        })
        .option('space', {
          type: 'string',
          description: 'Space ID to create app in',
        })
        .option('thread', {
          type: 'string',
          description: 'Thread ID in the space',
        });
    },
    (argv) => {
      createCommand({
        schema: argv.schema,
        name: argv.name,
        env: argv.env,
        space: argv.space,
        thread: argv.thread,
      });
    }
  )
  .demandCommand(1, 'You need at least one command before moving on')
  .help().argv;