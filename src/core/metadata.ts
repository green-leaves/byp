import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { calculateFileHash } from './verification';

export interface Metadata {
  originalFileName: string;
  totalChunks: number;
  chunkIndex?: number;
  chunkHash?: string;
  originalFileSize: number;
  fileHash?: string; // Hash of the entire original file for verification
}

/**
 * Generate metadata for a file
 * @param filePath Path to the original file
 * @param totalChunks Total number of chunks
 * @param chunkIndex Index of current chunk (optional)
 * @param chunkPath Path to chunk file (optional)
 * @returns Metadata object
 */
export async function generateMetadata(
  filePath: string, 
  totalChunks: number, 
  chunkIndex?: number, 
  chunkPath?: string
): Promise<Metadata> {
  const fileStats = fs.statSync(filePath);
  const originalFileName = path.basename(filePath);
  const originalFileSize = fileStats.size;
  
  const metadata: Metadata = {
    originalFileName,
    totalChunks,
    originalFileSize
  };
  
  // If chunk info is provided, add chunk-specific metadata
  if (chunkIndex !== undefined && chunkPath) {
    metadata.chunkIndex = chunkIndex;
    
    // Generate hash for chunk
    const chunkData = fs.readFileSync(chunkPath);
    const hash = crypto.createHash('sha256');
    hash.update(chunkData);
    metadata.chunkHash = hash.digest('hex');
  }
  
  // For the main file (when chunkIndex is undefined), add file hash for verification
  if (chunkIndex === undefined) {
    try {
      metadata.fileHash = await calculateFileHash(filePath);
    } catch (error) {
      console.error('Error calculating file hash:', error);
    }
  }
  
  // Write metadata to file
  const tempDir = path.join(process.cwd(), 'temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
  }
  
  const metadataFileName = chunkIndex !== undefined 
    ? `metadata-chunk-${chunkIndex}.json` 
    : 'metadata.json';
  const metadataFilePath = path.join(tempDir, metadataFileName);
  
  fs.writeFileSync(metadataFilePath, JSON.stringify(metadata, null, 2));
  
  return metadata;
}