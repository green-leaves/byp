import { chunkFile } from '../core/chunker';
import * as fs from 'fs';
import * as path from 'path';

describe('Manual Chunking Test', () => {
  const testFilePath = path.join(process.cwd(), 'manual-chunking-test.txt');
  
  test('should chunk file and create chunk files', async () => {
    // Create temp directory if it doesn't exist
    const tempDir = path.join(process.cwd(), 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }
    
    // Check if test file exists
    if (!fs.existsSync(testFilePath)) {
      // Create a test file for testing
      const testContent = 'A'.repeat(100); // 100 bytes
      fs.writeFileSync(testFilePath, testContent);
    }
    
    console.log(`Chunking file: ${testFilePath}`);
    const chunks = await chunkFile(testFilePath, 50, () => {}); // Small chunk size for testing
    
    console.log(`Created ${chunks.length} chunks`);
    
    // Verify chunks were created
    expect(chunks.length).toBeGreaterThan(0);
    
    // Check that chunk files exist
    for (const chunk of chunks) {
      expect(fs.existsSync(chunk.filePath)).toBe(true);
      console.log(`Chunk ${chunk.index}: ${chunk.size} bytes`);
    }
    
    // Clean up chunk files
    chunks.forEach(chunk => {
      if (fs.existsSync(chunk.filePath)) {
        fs.unlinkSync(chunk.filePath);
      }
    });
    
    // Clean up test file if we created it
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath);
    }
  }, 10000); // 10 second timeout
});