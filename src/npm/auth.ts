import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

/**
 * Check if npm is authenticated
 * @returns boolean indicating if npm is authenticated
 */
export function isNpmAuthenticated(): boolean {
  try {
    const npmrcPath = path.join(os.homedir(), '.npmrc');
    if (!fs.existsSync(npmrcPath)) {
      return false;
    }
    
    const npmrcContent = fs.readFileSync(npmrcPath, 'utf8');
    return npmrcContent.includes('_authToken=') || npmrcContent.includes('_password=');
  } catch (error) {
    console.error('Error checking npm authentication:', error);
    return false;
  }
}

/**
 * Get npm registry URL
 * @returns registry URL
 */
export function getNpmRegistry(): string {
  try {
    const npmrcPath = path.join(os.homedir(), '.npmrc');
    if (!fs.existsSync(npmrcPath)) {
      return 'https://registry.npmjs.org/';
    }
    
    const npmrcContent = fs.readFileSync(npmrcPath, 'utf8');
    const registryMatch = npmrcContent.match(/registry=(.*)/);
    return registryMatch ? registryMatch[1].trim() : 'https://registry.npmjs.org/';
  } catch (error) {
    console.error('Error getting npm registry:', error);
    return 'https://registry.npmjs.org/';
  }
}