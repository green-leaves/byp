/**
 * Parse URL to extract package name and version
 * @param url URL to parse
 * @returns Object containing name and version
 */
export function parseUrl(url: string): { name: string; version: string } {
  // Handle GitHub release URLs
  // Example: https://github.com/zed-industries/zed/releases/download/v0.203.5/Zed-x86_64.dmg
  const githubRegex = /github\.com\/([^\/]+)\/([^\/]+)\/releases\/download\/v?([^\/]+)\//;
  const githubMatch = url.match(githubRegex);
  
  if (githubMatch) {
    return {
      name: githubMatch[2],
      version: githubMatch[3]
    };
  }
  
  // Handle generic URLs with version patterns
  // Example: https://example.com/path/v1.2.3/filename.ext
  const versionRegex = /\/v?(\d+\.\d+\.\d+(-[^\s\/]*)?)\//;
  const versionMatch = url.match(versionRegex);
  
  if (versionMatch) {
    // Try to extract name from URL
    const pathParts = url.split('/');
    let name = 'unknown';
    
    // Look for a reasonable name in the path
    for (let i = pathParts.length - 1; i >= 0; i--) {
      const part = pathParts[i];
      if (part && !part.startsWith('v') && !part.includes('.') && part.length > 1) {
        name = part;
        break;
      }
    }
    
    return {
      name,
      version: versionMatch[1]
    };
  }
  
  // Fallback: try to extract from filename
  const fileName = url.split('/').pop() || '';
  const fileVersionRegex = /[vV]?(\d+\.\d+\.\d+(-[^\s.]*)?)/;
  const fileVersionMatch = fileName.match(fileVersionRegex);
  
  if (fileVersionMatch) {
    // Extract name from filename (remove version and extension)
    let name = fileName.replace(fileVersionMatch[0], '').replace(/\.[^/.]+$/, '');
    // Remove special characters and extra dots/dashes
    name = name.replace(/[-_.]+$/, '').replace(/^[-_.]+/, '');
    
    return {
      name: name || 'unknown',
      version: fileVersionMatch[1]
    };
  }
  
  // Last resort: return unknown values
  return {
    name: 'unknown',
    version: '0.0.0'
  };
}