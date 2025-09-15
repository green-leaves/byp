#!/usr/bin/env node

import { Command } from 'commander';
import { publish } from './commands/publish';
import { download } from './commands/download';
import { list } from './commands/list';
import { search } from './commands/search';
import { del } from './commands/delete';

const program = new Command();

program
  .name('byp')
  .description('CLI tool for publishing and downloading large files to/from npm repositories')
  .version('1.0.0');

program
  .command('package')
  .description('Package management commands')
  .addCommand(publish)
  .addCommand(download)
  .addCommand(list)
  .addCommand(search)
  .addCommand(del);

program.parse();