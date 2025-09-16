import { createPackage } from '../npm/publisher';
import * as fs from 'fs';
import * as path from 'path';

describe('Publisher', () => {
  const tempDir = path.join(process.cwd(), 'temp');
  
  beforeAll(() => {
    // Create temp directory if it doesn't exist
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    // Create a test chunk file
    const chunkContent = 'Test chunk content';
    fs.writeFileSync(path.join(tempDir, 'test-chunk.txt'), chunkContent);
    
    // Create a test metadata file
    const metadataContent = JSON.stringify({ test: 'metadata' });
    fs.writeFileSync(path.join(tempDir, 'test-metadata.json'), metadataContent);
  });
  
  afterAll(() => {
    // Clean up test files
    const testFiles = ['test-chunk.txt', 'test-metadata.json'];
    testFiles.forEach(file => {
      const filePath = path.join(tempDir, file);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    });
  });
  
  test('should create package with chunk file', () => {
    const packageDir = createPackage(
      '@byp/packages',
      '1.0.0',
      'test-tag',
      path.join(tempDir, 'test-chunk.txt'),
      path.join(tempDir, 'test-metadata.json')
    );
    
    expect(fs.existsSync(packageDir)).toBe(true);
    expect(fs.existsSync(path.join(packageDir, 'test-chunk.txt'))).toBe(true);
    expect(fs.existsSync(path.join(packageDir, 'test-metadata.json'))).toBe(true);
    expect(fs.existsSync(path.join(packageDir, 'package.json'))).toBe(true);
    
    // Check package.json content
    const packageJson = JSON.parse(fs.readFileSync(path.join(packageDir, 'package.json'), 'utf8'));
    expect(packageJson.name).toBe('@byp/packages');
    expect(packageJson.version).toBe('1.0.0');
    expect(packageJson.main).toBe('test-chunk.txt');
    expect(packageJson.files).toEqual(['test-chunk.txt', 'test-metadata.json']);
    
    // Clean up
    fs.rmSync(packageDir, { recursive: true, force: true });
  });
  
  test('should create package with metadata only', () => {
    const packageDir = createPackage(
      '@byp/packages',
      '1.0.0',
      'test-tag-main',
      null,
      path.join(tempDir, 'test-metadata.json')
    );
    
    expect(fs.existsSync(packageDir)).toBe(true);
    expect(fs.existsSync(path.join(packageDir, 'test-metadata.json'))).toBe(true);
    expect(fs.existsSync(path.join(packageDir, 'package.json'))).toBe(true);
    
    // Check that no chunk file was copied
    const files = fs.readdirSync(packageDir);
    expect(files).not.toContain('test-chunk.txt');
    
    // Check package.json content
    const packageJson = JSON.parse(fs.readFileSync(path.join(packageDir, 'package.json'), 'utf8'));
    expect(packageJson.name).toBe('@byp/packages');
    expect(packageJson.version).toBe('1.0.0');
    expect(packageJson.files).toEqual(['test-metadata.json']);
    expect(packageJson).not.toHaveProperty('main');
    
    // Clean up
    fs.rmSync(packageDir, { recursive: true, force: true });
  });
});