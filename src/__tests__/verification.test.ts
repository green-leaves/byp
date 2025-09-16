import { calculateFileHash, verifyFileIntegrity, verifyFileReassembly } from '../core/verification';
import * as fs from 'fs';
import * as path from 'path';

describe('File Verification', () => {
  const testFilePath = path.join(process.cwd(), 'temp', 'verification-test-file.txt');
  
  beforeAll(() => {
    // Create a test directory
    const tempDir = path.join(process.cwd(), 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }
    
    // Create a test file
    const content = 'Test content for verification';
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
        try {
          fs.rmdirSync(tempDir);
        } catch (e) {
          // Ignore errors when directory is not empty
        }
      }
    }
  });
  
  test('should calculate file hash correctly', async () => {
    const hash = await calculateFileHash(testFilePath);
    
    expect(hash).toBeDefined();
    expect(typeof hash).toBe('string');
    expect(hash.length).toBe(64); // SHA256 hash length
  });
  
  test('should verify file integrity correctly', async () => {
    const hash = await calculateFileHash(testFilePath);
    const isIntegrityOk = await verifyFileIntegrity(testFilePath, hash);
    
    expect(isIntegrityOk).toBe(true);
  });
  
  test('should fail verification with wrong hash', async () => {
    const isIntegrityOk = await verifyFileIntegrity(testFilePath, 'wrong_hash');
    
    expect(isIntegrityOk).toBe(false);
  });
  
  test('should verify file reassembly', async () => {
    // For this test, we'll just check that it works with the same file
    const isReassemblyOk = await verifyFileReassembly(testFilePath, testFilePath);
    
    expect(isReassemblyOk).toBe(true);
  });
});