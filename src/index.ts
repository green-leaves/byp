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
  .description('Manage packages - publish, download, list, search, and delete large files')
  .helpOption('-h, --help', 'Display help for command')
  .addHelpText('after', `
Package Management Commands:
  publish [options]    Publish a file to npm by chunking it into smaller pieces
  download [options]   Download and reassemble a chunked file from npm
  list                 List all published packages
  search <keyword>     Search for packages by keyword
  delete <name-ver>    Delete a published package

Use byp package <command> --help for more information about a command.`)
  .addCommand(publish)
  .addCommand(download)
  .addCommand(list)
  .addCommand(search)
  .addCommand(del);

program.parse();