import { Command } from 'commander';
import { listPackageTags } from '../npm/downloader';
import { isNpmAuthenticated } from '../npm/auth';
import * as path from 'path';

export const list = new Command('list')
  .description('List all published packages')
  .action(async () => {
    try {
      // Check if npm is authenticated
      if (!isNpmAuthenticated()) {
        console.error('Error: npm is not authenticated. Please run "npm login" first.');
        process.exit(1);
      }
      
      console.log('Listing published packages...');
      
      // Get all tags for @byp/packages
      const packageName = '@byp/packages';
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
      
      console.log('Published packages:');
      mainTags.forEach(tag => {
        // The tag already contains platform information from the publish command
        // Just display it as is
        console.log(`  ${tag}`);
      });
    } catch (error) {
      console.error('Error:', error);
      process.exit(1);
    }
  });