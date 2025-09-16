import { chunkFile } from '../core/chunker';
import * as fs from 'fs';
import * as path from 'path';

describe('File Chunker', () => {
  const testFilePath = path.join(process.cwd(), 'temp', 'chunker-test-file.txt');
  
  beforeAll(() => {
    // Create a test directory
    const tempDir = path.join(process.cwd(), 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }
    
    // Create a test file
    const content = 'A'.repeat(1000); // 1000 bytes
    fs.writeFileSync(testFilePath, content);
  });
  
  afterAll(() => {
    // Clean up test file
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath);
    }
    
    // Clean up temp directory only if it's empty
    const tempDir = path.join(process.cwd(), 'temp');
    if (fs.existsSync(tempDir)) {
      const files = fs.readdirSync(tempDir);
      if (files.length === 0) {
        fs.rmdirSync(tempDir);
      }
    }
  });
  
  test('should chunk file correctly with 500 byte chunks', async () => {
    const chunks = await chunkFile(testFilePath, 500, () => {});
    
    expect(chunks.length).toBe(2);
    expect(chunks[0].index).toBe(0);
    expect(chunks[1].index).toBe(1);
    
    // Check that chunk files exist
    expect(fs.existsSync(chunks[0].filePath)).toBe(true);
    expect(fs.existsSync(chunks[1].filePath)).toBe(true);
    
    // Check chunk sizes
    expect(chunks[0].size).toBe(500);
    expect(chunks[1].size).toBe(500);
  });
  
  test('should handle file smaller than chunk size', async () => {
    const chunks = await chunkFile(testFilePath, 2000, () => {});
    
    expect(chunks.length).toBe(1);
    expect(chunks[0].index).toBe(0);
    expect(chunks[0].size).toBe(1000);
  });
});