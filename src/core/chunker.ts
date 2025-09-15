import * as fs from 'fs';
import * as path from 'path';

export interface ChunkInfo {
  index: number;
  filePath: string;
  size: number;
}

/**
 * Chunk a file into smaller pieces of specified maximum size
 * @param filePath Path to the file to be chunked
 * @param maxSize Maximum size of each chunk in bytes
 * @returns Array of chunk information
 */
export async function chunkFile(filePath: string, maxSize: number): Promise<ChunkInfo[]> {
  const chunks: ChunkInfo[] = [];
  const fileStats = fs.statSync(filePath);
  const totalSize = fileStats.size;
  const buffer = Buffer.alloc(maxSize);
  
  const readStream = fs.createReadStream(filePath);
  let currentChunkIndex = 0;
  let currentChunkSize = 0;
  let currentChunkBuffer = Buffer.alloc(0);
  
  const tempDir = path.join(process.cwd(), 'temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
  }
  
  // Clean up any existing chunk files
  const existingChunks = fs.readdirSync(tempDir).filter(file => file.startsWith('chunk-'));
  existingChunks.forEach(file => {
    fs.unlinkSync(path.join(tempDir, file));
  });
  
  return new Promise((resolve, reject) => {
    readStream.on('data', (chunk: Buffer) => {
      let offset = 0;
      
      while (offset < chunk.length) {
        const remainingSpace = maxSize - currentChunkBuffer.length;
        const bytesToCopy = Math.min(remainingSpace, chunk.length - offset);
        
        // Add data to current chunk buffer
        const newBuffer = Buffer.alloc(currentChunkBuffer.length + bytesToCopy);
        currentChunkBuffer.copy(newBuffer, 0);
        chunk.copy(newBuffer, currentChunkBuffer.length, offset, offset + bytesToCopy);
        currentChunkBuffer = newBuffer;
        
        offset += bytesToCopy;
        
        // If chunk is full, write it to disk
        if (currentChunkBuffer.length >= maxSize) {
          const chunkFileName = `chunk-${currentChunkIndex}`;
          const chunkFilePath = path.join(tempDir, chunkFileName);
          
          fs.writeFileSync(chunkFilePath, currentChunkBuffer);
          
          chunks.push({
            index: currentChunkIndex,
            filePath: chunkFilePath,
            size: currentChunkBuffer.length
          });
          
          currentChunkIndex++;
          currentChunkBuffer = Buffer.alloc(0);
        }
      }
    });
    
    readStream.on('end', () => {
      // Write the last chunk if it has data
      if (currentChunkBuffer.length > 0) {
        const chunkFileName = `chunk-${currentChunkIndex}`;
        const chunkFilePath = path.join(tempDir, chunkFileName);
        
        fs.writeFileSync(chunkFilePath, currentChunkBuffer);
        
        chunks.push({
          index: currentChunkIndex,
          filePath: chunkFilePath,
          size: currentChunkBuffer.length
        });
      }
      
      resolve(chunks);
    });
    
    readStream.on('error', (error) => {
      reject(error);
    });
  });
}