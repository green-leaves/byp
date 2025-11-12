import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { execSync } from 'child_process';
import { isNpmAuthenticated } from './auth';
import { DEFAULT_PACKAGE_NAME } from '../constants';
import { formatBytes } from '../core/progress';

/**
 * Download a package from npm
 * @param packageName Name of the package (@byp/packages)
 * @param version Version of the package (can be a tag)
 * @param tagName Tag name for the specific chunk (used for logging)
 * @param onProgress Optional progress callback
 * @returns Path to the downloaded package directory
 */
export async function downloadPackage(
  packageName: string,
  version: string,
  tagName: string,
  onProgress?: (message: string) => void
): Promise<string> {
  try {
    if (onProgress) {
      onProgress(`Downloading package ${packageName}@${version}...`);
    }

    // Create a temporary directory for the downloaded package
    const tempDir = path.join(os.tmpdir(), `byp-download-${Date.now()}`);
    fs.mkdirSync(tempDir, { recursive: true });

    // Change to the temp directory
    const originalDir = process.cwd();
    process.chdir(tempDir);

    try {
      // Install the specific package with the version/tag
      execSync(`npm install ${packageName}@${version}`, {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe']
      });

      if (onProgress) {
        onProgress(`Downloaded package ${packageName}@${version}`);
      }

      // Return the path to the installed package
      const packageDir = path.join(tempDir, 'node_modules', packageName);
      return packageDir;
    } finally {
      // Change back to the original directory
      process.chdir(originalDir);
    }
  } catch (error) {
    console.error('Error downloading package:', error);
    throw error;
  }
}

/**
 * Get the actual version associated with a tag
 * @param packageName Name of the package (@byp/packages)
 * @param tagName Tag name
 * @returns Actual version string
 */
export async function getVersionFromTag(packageName: string, tagName: string): Promise<string> {
  try {
    // Get package info from npm registry
    const result = execSync(`npm view ${packageName} dist-tags --json`, {
      encoding: 'utf8'
    });

    const distTags = JSON.parse(result);
    if (distTags[tagName]) {
      return distTags[tagName];
    }

    throw new Error(`Tag ${tagName} not found in dist-tags`);
  } catch (error) {
    console.error('Error getting version from tag:', error);
    throw error;
  }
}

/**
 * List all tags for a package
 * @param packageName Name of the package (@byp/packages)
 * @returns Array of tag names
 */
export async function listPackageTags(packageName: string): Promise<string[]> {
  try {
    // Get package info from npm registry
    const result = execSync(`npm view ${packageName} dist-tags --json`, {
      encoding: 'utf8'
    });

    const tags = JSON.parse(result);
    return Object.keys(tags);
  } catch (error) {
    console.error('Error listing package tags:', error);
    return [];
  }
}

/**
 * Search for packages by keyword
 * @param packageName Name of the package (@byp/packages)
 * @param keyword Keyword to search for
 * @returns Array of matching tag names
 */
export async function searchPackages(packageName: string, keyword: string): Promise<string[]> {
  try {
    // Get all tags for our package
    const allTags = await listPackageTags(packageName);

    // Filter out chunk tags and latest tag, and search for keyword in tag names
    const mainTags = allTags.filter(tag => !tag.includes('-chunk-') && tag !== 'latest');

    // Filter tags that match the keyword
    const matchingTags = mainTags.filter(tag =>
      tag.toLowerCase().includes(keyword.toLowerCase())
    );

    return matchingTags;
  } catch (error) {
    console.error('Error searching packages:', error);
    return [];
  }
}

/**
 * Delete a package tag from npm
 * @param packageName Name of the package (@byp/packages)
 * @param tagName Tag name to delete
 * @returns boolean indicating success
 */
export async function deletePackageTag(
  packageName: string,
  tagName: string
): Promise<boolean> {
  try {
    // Check if npm is authenticated
    if (!isNpmAuthenticated()) {
      throw new Error('npm is not authenticated. Please run "npm login" first.');
    }

    // Get the version associated with this tag
    const result = execSync(`npm view ${packageName} dist-tags --json`, {
      encoding: 'utf8'
    });

    const distTags = JSON.parse(result);
    const version = distTags[tagName];

    if (!version) {
      console.error(`Tag ${tagName} not found in dist-tags`);
      return false;
    }

    console.log(`Unpublishing package ${packageName}@${version} (tag: ${tagName})...`);

    // Unpublish the specific version
    execSync(`npm unpublish ${packageName}@${version}`, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe']
    });

    console.log(`Successfully deleted package ${packageName}@${version} (tag: ${tagName})`);
    return true;
  } catch (error) {
    console.error('Error deleting package tag:', error);
    return false;
  }
}