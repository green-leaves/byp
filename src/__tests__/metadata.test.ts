import { generateMetadata } from '../core/metadata';
import * as fs from 'fs';
import * as path from 'path';

describe('Metadata Generator', () => {
  const testFilePath = path.join(process.cwd(), 'temp', 'test-file.txt');
  
  beforeAll(() => {
    // Create a test directory
    const tempDir = path.join(process.cwd(), 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }
    
    // Create a test file
    const content = 'Test file content';
    fs.writeFileSync(testFilePath, content);
  });
  
  afterAll(() => {
    // Clean up test file
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath);
    }
    
    // Clean up temp directory
    const tempDir = path.join(process.cwd(), 'temp');
    if (fs.existsSync(tempDir)) {
      // Remove all files in the directory first
      const files = fs.readdirSync(tempDir);
      files.forEach(file => {
        fs.unlinkSync(path.join(tempDir, file));
      });
      fs.rmdirSync(tempDir);
    }
  });
  
  test('should generate basic metadata', () => {
    const metadata = generateMetadata(testFilePath, 5);
    
    expect(metadata.originalFileName).toBe('test-file.txt');
    expect(metadata.totalChunks).toBe(5);
    expect(metadata.originalFileSize).toBe(17); // "Test file content".length
    expect(metadata.chunkIndex).toBeUndefined();
    expect(metadata.chunkHash).toBeUndefined();
  });
  
  test('should generate chunk metadata with hash', () => {
    const metadata = generateMetadata(testFilePath, 3, 1, testFilePath);
    
    expect(metadata.originalFileName).toBe('test-file.txt');
    expect(metadata.totalChunks).toBe(3);
    expect(metadata.chunkIndex).toBe(1);
    expect(metadata.chunkHash).toBeDefined();
    expect(typeof metadata.chunkHash).toBe('string');
  });
});