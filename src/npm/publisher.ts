import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { execSync } from 'child_process';
import { isNpmAuthenticated } from './auth';
import { DEFAULT_PACKAGE_NAME } from '../constants';
import { formatBytes } from '../core/progress';

/**
 * Publish a package to npm
 * @param packagePath Path to the package directory
 * @param tagName Tag name for the package
 * @param onProgress Optional progress callback
 * @returns boolean indicating success
 */
export async function publishPackage(packagePath: string, tagName: string, onProgress?: (message: string) => void): Promise<boolean> {
  try {
    // Check if npm is authenticated
    if (!isNpmAuthenticated()) {
      throw new Error('npm is not authenticated. Please run "npm login" first.');
    }
    
    // Verify the package directory exists
    if (!fs.existsSync(packagePath)) {
      throw new Error(`Package directory does not exist: ${packagePath}`);
    }
    
    // Verify package.json exists
    const packageJsonPath = path.join(packagePath, 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      throw new Error(`package.json not found in: ${packagePath}`);
    }
    
    // Read and validate package.json
    const packageJsonContent = fs.readFileSync(packageJsonPath, 'utf8');
    let packageJson;
    try {
      packageJson = JSON.parse(packageJsonContent);
    } catch (parseError) {
      throw new Error(`Invalid package.json: ${parseError}`);
    }
    
    // Get file size for progress reporting
    const files = fs.readdirSync(packagePath);
    let totalSize = 0;
    files.forEach(file => {
      const filePath = path.join(packagePath, file);
      if (fs.statSync(filePath).isFile()) {
        totalSize += fs.statSync(filePath).size;
      }
    });
    
    if (onProgress) {
      onProgress(`Publishing ${tagName} (${formatBytes(totalSize)})...`);
    }
    
    // Change to the package directory
    const originalDir = process.cwd();
    process.chdir(packagePath);
    
    try {
      // Publish the package with the specified tag and public access
      const result = execSync(`npm publish --tag ${tagName} --access public`, { 
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe']
      });
      
      if (onProgress) {
        onProgress(`Published package with tag ${tagName}`);
      }
      
      return true;
    } finally {
      // Change back to the original directory
      process.chdir(originalDir);
    }
  } catch (error) {
    console.error('Error publishing package:', error);
    return false;
  }
}

/**
 * Create a package.json file for a chunk
 * @param packageName Name of the package (e.g., @byp/packages)
 * @param version Version of the package (must be valid semver)
 * @param tagName Tag name for this specific chunk
 * @param chunkPath Path to the chunk file
 * @param metadataPath Path to the metadata file
 * @returns Path to the created package directory
 */
export function createPackage(
  packageName: string,
  version: string,
  tagName: string,
  chunkPath: string,
  metadataPath: string
): string {
  // Create a temporary directory for the package
  const tempDir = path.join(os.tmpdir(), `byp-package-${Date.now()}`);
  fs.mkdirSync(tempDir, { recursive: true });
  
  // Copy chunk file to package directory
  const chunkFileName = path.basename(chunkPath);
  fs.copyFileSync(chunkPath, path.join(tempDir, chunkFileName));
  
  // Copy metadata file to package directory
  const metadataFileName = path.basename(metadataPath);
  fs.copyFileSync(metadataPath, path.join(tempDir, metadataFileName));
  
  // Create package.json
  const packageJson = {
    name: packageName,
    version: version,
    description: `Chunk ${tagName} of a large file published with byp`,
    main: chunkFileName,
    files: [
      chunkFileName,
      metadataFileName
    ],
    keywords: [
      "byp",
      "chunk",
      "file"
    ],
    author: "byp tool",
    license: "MIT",
    publishConfig: {
      access: "public"
    }
  };
  
  fs.writeFileSync(
    path.join(tempDir, 'package.json'),
    JSON.stringify(packageJson, null, 2)
  );
  
  return tempDir;
}