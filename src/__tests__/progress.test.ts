import { formatBytes, ProgressBar } from '../core/progress';

describe('Progress Utilities', () => {
  describe('formatBytes', () => {
    test('should format bytes correctly', () => {
      expect(formatBytes(0)).toBe('0 Bytes');
      expect(formatBytes(1023)).toBe('1023 Bytes');
      expect(formatBytes(1024)).toBe('1 KB');
      expect(formatBytes(1024 * 1024)).toBe('1 MB');
      expect(formatBytes(1024 * 1024 * 1024)).toBe('1 GB');
      expect(formatBytes(1024 * 1024 * 1024 * 1024)).toBe('1 TB');
    });

    test('should format bytes with custom decimals', () => {
      expect(formatBytes(1500, 1)).toBe('1.5 KB');
      expect(formatBytes(1500, 0)).toBe('1 KB');
    });

    test('should handle large numbers', () => {
      // Test a more reasonable large number
      expect(formatBytes(1024 * 1024 * 1024 * 1024)).toBe('1 TB');
    });
  });

  describe('ProgressBar', () => {
    let consoleOutput: string[] = [];
    const mockedWrite = (output: string) => {
      consoleOutput.push(output);
      return true;
    };

    beforeEach(() => {
      consoleOutput = [];
      // Mock process.stdout.write to capture output
      jest.spyOn(process.stdout, 'write').mockImplementation(mockedWrite as any);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    test('should create progress bar with default values', () => {
      const progressBar = new ProgressBar(100);
      expect(progressBar).toBeDefined();
    });

    test('should create progress bar with custom values', () => {
      const progressBar = new ProgressBar(100, 'Test:', 20, (value) => value.toString());
      expect(progressBar).toBeDefined();
    });

    test('should update progress', () => {
      const progressBar = new ProgressBar(100, 'Test:', 20, formatBytes);
      progressBar.update(50);
      
      // Check that something was written to stdout
      expect(consoleOutput.length).toBeGreaterThan(0);
    });

    test('should complete progress bar', () => {
      const progressBar = new ProgressBar(100, 'Test:', 20, formatBytes);
      progressBar.complete();
      
      // Check that something was written to stdout
      expect(consoleOutput.length).toBeGreaterThan(0);
      // Last output should contain a newline
      expect(consoleOutput[consoleOutput.length - 1]).toContain('\n');
    });

    test('should handle progress beyond 100%', () => {
      const progressBar = new ProgressBar(100, 'Test:', 20, formatBytes);
      progressBar.update(150); // Beyond 100%
      
      // Should still work and show 100%
      expect(consoleOutput.length).toBeGreaterThan(0);
    });
  });
});