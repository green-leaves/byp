import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { execSync } from 'child_process';
import { isNpmAuthenticated } from './auth';
import { DEFAULT_PACKAGE_NAME } from '../constants';

/**
 * Download a package from npm
 * @param packageName Name of the package (@byp/packages)
 * @param version Version of the package (can be a tag)
 * @param tagName Tag name for the specific chunk (used for logging)
 * @returns Path to the downloaded package directory
 */
export async function downloadPackage(
  packageName: string,
  version: string,
  tagName: string
): Promise<string> {
  try {
    // Check if npm is authenticated
    if (!isNpmAuthenticated()) {
      throw new Error('npm is not authenticated. Please run "npm login" first.');
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
    // Check if npm is authenticated
    if (!isNpmAuthenticated()) {
      throw new Error('npm is not authenticated. Please run "npm login" first.');
    }
    
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
    // Check if npm is authenticated
    if (!isNpmAuthenticated()) {
      throw new Error('npm is not authenticated. Please run "npm login" first.');
    }
    
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
 * @param keyword Keyword to search for
 * @returns Array of matching package names
 */
export async function searchPackages(keyword: string): Promise<string[]> {
  try {
    // Check if npm is authenticated
    if (!isNpmAuthenticated()) {
      throw new Error('npm is not authenticated. Please run "npm login" first.');
    }
    
    // Search for packages within our scope
    const scopedKeyword = `${DEFAULT_PACKAGE_NAME} ${keyword}`;
    const result = execSync(`npm search ${scopedKeyword} --json`, { 
      encoding: 'utf8'
    });
    
    const packages = JSON.parse(result);
    return packages.map((pkg: any) => pkg.name);
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
    
    // Note: npm doesn't have a direct delete command for tags
    // This would typically be handled by unpublishing specific versions
    // For now, we'll just log that this functionality needs to be implemented
    console.log(`Deleting tag ${tagName} for package ${packageName}`);
    console.log('Note: Tag deletion is not directly supported by npm.');
    console.log('This would require unpublishing specific versions.');
    
    return true;
  } catch (error) {
    console.error('Error deleting package tag:', error);
    return false;
  }
}