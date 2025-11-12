import { searchPackages } from '../npm/downloader';
import { listPackageTags } from '../npm/downloader';

// Mock the child_process module
jest.mock('child_process', () => ({
  execSync: jest.fn()
}));

// Mock the auth function
jest.mock('../npm/auth', () => ({
  isNpmAuthenticated: jest.fn()
}));

describe('Search Functionality', () => {
  const { execSync } = require('child_process');
  const { isNpmAuthenticated } = require('../npm/auth');
  const { listPackageTags } = require('../npm/downloader');

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    // Mock successful authentication by default
    (isNpmAuthenticated as jest.Mock).mockReturnValue(true);

    // Mock execSync to avoid actual npm calls
    (execSync as jest.Mock).mockImplementation((command) => {
      if (command.includes('view') && command.includes('dist-tags')) {
        // Return mock dist-tags data
        return JSON.stringify({
          "myapp-1.0.0": "1.0.0",
          "myapp-1.0.0-chunk-001": "1.0.1",
          "myapp-1.0.0-chunk-002": "1.0.2",
          "anotherapp-2.0.0": "2.0.0",
          "latest": "2.0.0"
        });
      }
      return '{}';
    });
  });

  test('should still work if not authenticated', async () => {
    // Mock unauthenticated state
    (isNpmAuthenticated as jest.Mock).mockReturnValue(false);

    // Mock execSync to return mock dist-tags data when isNpmAuthenticated returns false
    (execSync as jest.Mock).mockImplementation((command) => {
      if (command.includes('view') && command.includes('dist-tags')) {
        return JSON.stringify({
          "myapp-1.0.0": "1.0.0",
          "myapp-1.0.0-chunk-001": "1.0.1",
          "myapp-1.0.0-chunk-002": "1.0.2",
          "anotherapp-2.0.0": "2.0.0",
          "latest": "2.0.0"
        });
      }
      return '{}';
    });

    const result = await searchPackages('@byp/packages', 'myapp');

    // Should still work and only return main packages (not chunk tags or latest)
    expect(result).toEqual(['myapp-1.0.0']);
  });

  test('should return matching packages', async () => {
    const result = await searchPackages('@byp/packages', 'myapp');

    // Should only return main packages (not chunk tags or latest)
    expect(result).toEqual(['myapp-1.0.0']);
  });

  test('should handle case insensitive search', async () => {
    // Mock execSync to return mixed case tags
    (execSync as jest.Mock).mockImplementation((command) => {
      if (command.includes('view') && command.includes('dist-tags')) {
        return JSON.stringify({
          "MyApp-1.0.0": "1.0.0",
          "myapp-1.0.0-chunk-001": "1.0.1",
          "ANOTHERAPP-2.0.0": "2.0.0",
          "latest": "2.0.0"
        });
      }
      return '{}';
    });

    const result = await searchPackages('@byp/packages', 'myapp');

    // Should match case insensitively
    expect(result).toEqual(['MyApp-1.0.0']);
  });

  test('should return empty array when no matches found', async () => {
    const result = await searchPackages('@byp/packages', 'nonexistent');

    expect(result).toEqual([]);
  });

  test('should handle errors gracefully', async () => {
    // Mock execSync to throw an error
    (execSync as jest.Mock).mockImplementation(() => {
      throw new Error('Network error');
    });

    const result = await searchPackages('@byp/packages', 'test');

    expect(result).toEqual([]);
  });
});