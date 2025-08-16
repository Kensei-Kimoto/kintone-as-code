#!/usr/bin/env node

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { init } from './commands/init.js';
import { exportCommand } from './commands/export.js';
import { applyCommand } from './commands/apply.js';
import { createCommand } from './commands/create.js';
import { setupEnvLoading } from './core/env-utils.js';

type ExportArgs = {
  'app-id': string;
  name: string;
  env?: string;
  output?: string;
  'with-record-schema': boolean;
  'with-query': boolean;
  'include-related'?: boolean;
  'include-subtable'?: boolean;
};
type ApplyArgs = {
  'app-id'?: string;
  schema: string;
  env?: string;
};
type CreateArgs = {
  schema: string;
  name?: string;
  env?: string;
  space?: string;
  thread?: string;
};

yargs(hideBin(process.argv))
  .command(
    'init',
    'Initialize kintone-as-code project',
    {
      force: {
        alias: 'f',
        type: 'boolean',
        description: 'Force overwrite existing files',
      },
      'no-esm-rewrite': {
        type: 'boolean',
        default: false,
        description:
          "Do not rewrite existing package.json to ESM (suppress 'type: module' update)",
      },
    },
    (argv: any) => {
      const opts: any = { force: argv.force as boolean | undefined };
      if ((argv as any)['no-esm-rewrite']) {
        opts.noEsmRewrite = true;
      }
      init(opts);
    }
  )
  .command(
    'export',
    'Export kintone app settings',
    {
      'app-id': {
        type: 'string',
        demandOption: true,
        description: 'App ID to export',
      },
      name: {
        type: 'string',
        demandOption: true,
        description: 'Schema file name',
      },
      env: {
        type: 'string',
        description: 'Environment name',
      },
      'env-file': {
        type: 'string',
        description: 'Path to .env file to load (optional, enables explicit env loading)',
      },
      output: {
        type: 'string',
        description: 'Output directory',
      },
      // Back-compat and negation-friendly flags
      'record-schema': {
        type: 'boolean',
        description:
          'Alias of --with-record-schema (supports --no-record-schema)',
      },
      'with-record-schema': {
        type: 'boolean',
        default: true,
        description: 'Generate record schema file (default: true)',
      },
      query: {
        type: 'boolean',
        description: 'Alias of --with-query (supports --no-query)',
      },
      'with-query': {
        type: 'boolean',
        default: true,
        description: 'Generate query builder file (default: true)',
      },
      'include-related': {
        type: 'boolean',
        default: false,
        description:
          'Include related record fields using dot-notation (default: false)',
      },
      'include-subtable': {
        type: 'boolean',
        default: false,
        description:
          'Include subtable child fields (only supports in/not in operators) (default: false)',
      },
    },
    async (argv: any) => {
      // Set up env loading first
      await setupEnvLoading(argv);
      
      const a = argv as ExportArgs;
      // Normalize negation-friendly aliases first
      const normalizedWithRecordSchema =
        (a as any)['record-schema'] !== undefined
          ? (a as any)['record-schema']
          : a['with-record-schema'];
      const normalizedWithQuery =
        (a as any)['query'] !== undefined
          ? (a as any)['query']
          : a['with-query'];
      await exportCommand({
        appId: a['app-id'],
        name: a.name,
        env: a.env,
        output: a.output,
        withRecordSchema: normalizedWithRecordSchema,
        withQuery: normalizedWithQuery,
        includeRelated: a['include-related'] ?? false,
        includeSubtable: a['include-subtable'] ?? false,
      });
    }
  )
  .command(
    'apply',
    'Apply schema to kintone app',
    {
      'app-id': {
        type: 'string',
        demandOption: false,
        description:
          'App ID to apply to (optional, uses schema appId if not provided)',
      },
      schema: {
        type: 'string',
        demandOption: true,
        description: 'Schema file path',
      },
      env: {
        type: 'string',
        description: 'Environment name',
      },
      'env-file': {
        type: 'string',
        description: 'Path to .env file to load (optional, enables explicit env loading)',
      },
      'add-subtable-child': {
        type: 'boolean',
        default: false,
        description:
          'Experimental: add missing subtable child fields automatically',
      },
    },
    async (argv: any) => {
      // Set up env loading first
      await setupEnvLoading(argv);
      
      const a = argv as ApplyArgs;
      const options: any = {
        schema: a.schema,
        env: a.env,
        addSubtableChild: ((a as any)['add-subtable-child']
          ? true
          : false) as boolean,
      };
      if (a['app-id']) {
        options.appId = a['app-id'];
      }
      await applyCommand(options);
    }
  )
  .command(
    'create',
    'Create a new kintone app from schema',
    {
      schema: {
        type: 'string',
        demandOption: true,
        description: 'Schema file path',
      },
      name: {
        type: 'string',
        description: 'App name (overrides schema name)',
      },
      env: {
        type: 'string',
        description: 'Environment name',
      },
      space: {
        type: 'string',
        description: 'Space ID to create app in',
      },
      thread: {
        type: 'string',
        description: 'Thread ID in the space',
      },
    },
    async (argv: any) => {
      const a = argv as CreateArgs;
      await createCommand({
        schema: a.schema,
        name: a.name,
        env: a.env,
        space: a.space,
        thread: a.thread,
      });
    }
  )
  .demandCommand(1, 'You need at least one command before moving on')
  .help().argv;
