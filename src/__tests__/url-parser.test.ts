import { parseUrl } from '../core/url-parser';

describe('URL Parser', () => {
  test('should parse GitHub release URL correctly', () => {
    const url = 'https://github.com/zed-industries/zed/releases/download/v0.203.5/Zed-x86_64.dmg';
    const result = parseUrl(url);
    
    expect(result.name).toBe('zed');
    expect(result.version).toBe('0.203.5');
  });
  
  test('should parse GitLab release URL correctly', () => {
    const url = 'https://gitlab.com/group/project/-/releases/v1.0.0/downloads/file.zip';
    const result = parseUrl(url);
    
    expect(result.name).toBe('project');
    expect(result.version).toBe('1.0.0');
  });
  
  test('should parse npm package URL correctly', () => {
    const url = 'https://registry.npmjs.org/package-name/-/package-name-1.0.0.tgz';
    const result = parseUrl(url);
    
    expect(result.name).toBe('package-name');
    expect(result.version).toBe('1.0.0');
  });
  
  test('should parse PyPI package URL correctly', () => {
    const url = 'https://files.pythonhosted.org/packages/source/p/package-name/package-name-1.0.0.tar.gz';
    const result = parseUrl(url);
    
    expect(result.name).toBe('package-name');
    expect(result.version).toBe('1.0.0');
  });
  
  test('should parse generic URL with version', () => {
    const url = 'https://example.com/path/v1.2.3/filename.ext';
    const result = parseUrl(url);
    
    expect(result.name).toBe('path');
    expect(result.version).toBe('1.2.3');
  });
  
  test('should parse URL with version in filename', () => {
    const url = 'https://example.com/downloads/app-v2.1.0-beta.zip';
    const result = parseUrl(url);
    
    expect(result.name).toBe('app');
    expect(result.version).toBe('2.1.0-beta');
  });
  
  test('should handle URL without recognizable pattern', () => {
    const url = 'https://example.com/downloads/file.zip';
    const result = parseUrl(url);
    
    expect(result.name).toBe('unknown');
    expect(result.version).toBe('0.0.0');
  });
});