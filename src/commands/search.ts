import { Command } from 'commander';
import { searchPackages } from '../npm/downloader';
import { isNpmAuthenticated } from '../npm/auth';
import { DEFAULT_PACKAGE_NAME } from '../constants';

export const search = new Command('search')
  .description('Search for packages by keyword')
  .argument('<keyword>', 'keyword to search for')
  .helpOption('-h, --help', 'Display help for command')
  .addHelpText('after', `
Examples:
  $ byp package search myapp
  $ byp package search "version 1.0"

Description:
  Searches for packages that have been published using the 'publish' command.
  Matches keywords in package names and descriptions.

Arguments:
  <keyword>  Keyword to search for in package names and descriptions

Options:
  -h, --help  Display help for command
`)
  .action(async (keyword) => {
    try {
      // Check if npm is authenticated
      if (!isNpmAuthenticated()) {
        console.error('Error: npm is not authenticated. Please run "npm login" first.');
        process.exit(1);
      }
      
      console.log(`Searching for packages with keyword: ${keyword}`);
      
      const packages = await searchPackages(keyword);
      
      if (packages.length === 0) {
        console.log('No packages found.');
        return;
      }
      
      console.log('Found packages:');
      packages.forEach(pkg => {
        console.log(`  ${pkg}`);
      });
    } catch (error) {
      console.error('Error:', error);
      process.exit(1);
    }
  });