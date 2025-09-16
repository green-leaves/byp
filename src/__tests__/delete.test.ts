import { deletePackageTag, listPackageTags } from '../npm/downloader';
import { isNpmAuthenticated } from '../npm/auth';
import { DEFAULT_PACKAGE_NAME } from '../constants';

// Mock the execSync function to avoid actually calling npm commands
jest.mock('child_process', () => ({
  execSync: jest.fn()
}));

// Mock the auth function
jest.mock('../npm/auth', () => ({
  isNpmAuthenticated: jest.fn()
}));

describe('Delete Functionality', () => {
  const { execSync } = require('child_process');
  
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Mock successful authentication by default
    (isNpmAuthenticated as jest.Mock).mockReturnValue(true);
  });
  
  test('should fail if not authenticated', async () => {
    // Mock unauthenticated state
    (isNpmAuthenticated as jest.Mock).mockReturnValue(false);
    
    const result = await deletePackageTag('@byp/packages', 'test-tag');
    
    expect(result).toBe(false);
  });
  
  test('should handle tag not found', async () => {
    // Mock execSync to return empty dist-tags
    (execSync as jest.Mock).mockImplementation((command) => {
      if (command.includes('dist-tags')) {
        return '{}'; // No tags found
      }
      return '';
    });
    
    const result = await deletePackageTag('@byp/packages', 'nonexistent-tag');
    
    expect(result).toBe(false);
  });
  
  test('should attempt to delete a package tag', async () => {
    // Mock execSync to simulate a tag existing and then being deleted
    (execSync as jest.Mock).mockImplementation((command) => {
      if (command.includes('dist-tags')) {
        return '{"test-tag":"1.0.0"}'; // Tag exists with version 1.0.0
      }
      // For unpublish command, just return empty
      return '';
    });
    
    const result = await deletePackageTag('@byp/packages', 'test-tag');
    
    expect(result).toBe(true);
    expect(execSync).toHaveBeenCalledWith(
      'npm unpublish @byp/packages@1.0.0',
      expect.objectContaining({
        encoding: 'utf8'
      })
    );
  });
  
  test('should handle errors during deletion', async () => {
    // Mock execSync to throw an error
    (execSync as jest.Mock).mockImplementation((command) => {
      if (command.includes('dist-tags')) {
        return '{"test-tag":"1.0.0"}';
      }
      // Throw an error for the unpublish command
      throw new Error('Network error');
    });
    
    const result = await deletePackageTag('@byp/packages', 'test-tag');
    
    expect(result).toBe(false);
  });
});