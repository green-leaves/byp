/**
 * Progress reporting utility functions
 */

/**
 * Format bytes to human readable format
 * @param bytes Number of bytes
 * @param decimals Number of decimal places
 * @returns Formatted string
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Progress bar renderer
 */
export class ProgressBar {
  private total: number;
  private current: number;
  private width: number;
  private message: string;
  private formatFunction: (value: number) => string;
  
  constructor(total: number, message: string = '', width: number = 40, formatFunction?: (value: number) => string) {
    this.total = total;
    this.current = 0;
    this.width = width;
    this.message = message;
    this.formatFunction = formatFunction || formatBytes;
  }
  
  /**
   * Update progress
   * @param current Current progress value
   */
  update(current: number): void {
    this.current = current;
    this.render();
  }
  
  /**
   * Render progress bar
   */
  private render(): void {
    const percentage = Math.min(100, Math.floor((this.current / this.total) * 100));
    const filledWidth = Math.min(this.width, Math.floor((this.current / this.total) * this.width));
    const emptyWidth = this.width - filledWidth;
    
    const filled = '='.repeat(filledWidth);
    const empty = ' '.repeat(emptyWidth);
    const bar = `[${filled}${empty}]`;
    
    // Clear the line and move cursor to beginning
    process.stdout.write('\r\x1b[K');
    process.stdout.write(`${this.message} ${bar} ${percentage}% (${this.formatFunction(this.current)}/${this.formatFunction(this.total)})`);
  }
  
  /**
   * Complete the progress bar
   */
  complete(): void {
    this.current = this.total;
    this.render();
    process.stdout.write('\n');
  }
}
