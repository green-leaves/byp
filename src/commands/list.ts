import { Command } from 'commander';
import { listPackageTags } from '../npm/downloader';
import { isNpmAuthenticated } from '../npm/auth';
import { DEFAULT_PACKAGE_NAME } from '../constants';
import * as path from 'path';

export const list = new Command('list')
  .alias('ls')  // Add 'ls' as an alias for 'list'
  .description('List all published packages')
  .helpOption('-h, --help', 'Display help for command')
  .addHelpText('after', `
Examples:
  $ byp package list
  $ byp package ls

Description:
  Lists all packages that have been published using the 'publish' command.
  Only shows main packages (not individual chunks) that are available for download.
`)
  .action(async () => {
    try {

      
      console.log('Listing published packages...');
      
      // Get all tags for @byp/packages
      const packageName = DEFAULT_PACKAGE_NAME;
      const tags = await listPackageTags(packageName);
      
      if (tags.length === 0) {
        console.log('No packages found.');
        return;
      }
      
      // Filter out chunk tags and only show main package tags
      const mainTags = tags.filter(tag => !tag.includes('-chunk-') && tag !== 'latest');
      
      if (mainTags.length === 0) {
        console.log('No main packages found.');
        return;
      }
      
      // Sort mainTags alphabetically before displaying
      const sortedMainTags = mainTags.sort();

      console.log('Published packages:');
      sortedMainTags.forEach(tag => {
        // The tag already contains platform information from the publish command
        // Just display it as is
        console.log(`  ${tag}`);
      });
    } catch (error) {
      console.error('Error:', error);
      process.exit(1);
    }
  });