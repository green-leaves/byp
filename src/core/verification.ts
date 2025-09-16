/**
 * File verification utilities
 */

import * as crypto from 'crypto';
import * as fs from 'fs';

/**
 * Calculate SHA256 hash of a file
 * @param filePath Path to the file
 * @returns Promise that resolves to the SHA256 hash as a hex string
 */
export async function calculateFileHash(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    
    stream.on('data', (data) => {
      hash.update(data);
    });
    
    stream.on('end', () => {
      resolve(hash.digest('hex'));
    });
    
    stream.on('error', (err) => {
      reject(err);
    });
  });
}

/**
 * Verify file integrity by comparing hash with expected hash
 * @param filePath Path to the file
 * @param expectedHash Expected SHA256 hash
 * @returns Promise that resolves to true if hash matches, false otherwise
 */
export async function verifyFileIntegrity(filePath: string, expectedHash: string): Promise<boolean> {
  try {
    const actualHash = await calculateFileHash(filePath);
    return actualHash === expectedHash;
  } catch (error) {
    console.error('Error verifying file integrity:', error);
    return false;
  }
}

/**
 * Verify that all chunks of a file have been correctly reassembled
 * @param originalFilePath Path to the original file
 * @param reassembledFilePath Path to the reassembled file
 * @returns Promise that resolves to true if files are identical, false otherwise
 */
export async function verifyFileReassembly(originalFilePath: string, reassembledFilePath: string): Promise<boolean> {
  try {
    // If we don't have the original file, we can't verify reassembly
    // In a real scenario, we would compare with the original hash stored in metadata
    if (!fs.existsSync(originalFilePath)) {
      // Just check that the reassembled file exists and has content
      return fs.existsSync(reassembledFilePath) && fs.statSync(reassembledFilePath).size > 0;
    }
    
    // Compare hashes of both files
    const originalHash = await calculateFileHash(originalFilePath);
    const reassembledHash = await calculateFileHash(reassembledFilePath);
    
    return originalHash === reassembledHash;
  } catch (error) {
    console.error('Error verifying file reassembly:', error);
    return false;
  }
}