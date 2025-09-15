import { Command } from 'commander';
import { deletePackageTag, listPackageTags } from '../npm/downloader';
import { isNpmAuthenticated } from '../npm/auth';

export const del = new Command('delete')
  .description('Delete a published package')
  .argument('<name-version>', 'name and version of the package to delete (e.g., zed-0.3.4)')
  .action(async (nameVersion) => {
    try {
      // Check if npm is authenticated
      if (!isNpmAuthenticated()) {
        console.error('Error: npm is not authenticated. Please run "npm login" first.');
        process.exit(1);
      }
      
      console.log(`Deleting package ${nameVersion}`);
      
      // Split name and version
      const lastDashIndex = nameVersion.lastIndexOf('-');
      if (lastDashIndex === -1) {
        console.error('Error: Invalid package name format. Expected <name>-<version>');
        process.exit(1);
      }
      
      const name = nameVersion.substring(0, lastDashIndex);
      const version = nameVersion.substring(lastDashIndex + 1);
      
      // Get all tags for this package
      const packageName = '@byp/packages';
      const allTags = await listPackageTags(packageName);
      
      // Filter tags that belong to this package
      const packageTags = allTags.filter(tag => tag.startsWith(`${name}-${version}`));
      
      if (packageTags.length === 0) {
        console.error(`Error: No package found with name ${name} and version ${version}`);
        process.exit(1);
      }
      
      console.log(`Found ${packageTags.length} tags to delete`);
      
      // Delete each tag
      let successCount = 0;
      for (const tag of packageTags) {
        console.log(`Deleting tag ${tag}...`);
        const success = await deletePackageTag(packageName, tag);
        
        if (success) {
          successCount++;
        } else {
          console.error(`Failed to delete tag ${tag}`);
        }
      }
      
      console.log(`Successfully deleted ${successCount}/${packageTags.length} tags`);
      
      if (successCount !== packageTags.length) {
        console.error('Some tags failed to delete');
        process.exit(1);
      }
    } catch (error) {
      console.error('Error:', error);
      process.exit(1);
    }
  });