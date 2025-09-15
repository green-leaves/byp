# Byp - NPM Package Publisher and Downloader with File Chunking

## Overview

Byp is a command-line tool written in TypeScript that allows publishing and downloading large files to/from npm repositories by automatically chunking them into smaller pieces (maximum 64MB per chunk) to comply with npm's size limitations.

## Features

- Publish large files to npm by automatically chunking them
- Download and reassemble chunked files from npm
- List all published packages
- Search for packages by keyword
- Delete published packages
- Auto-extract filename and version from URLs
- Maximum chunk size of 64MB per file
- CLI interface with intuitive commands
- Support for custom package names and versions
- Path specification for source files (local or remote)

## Command Line Interface

### Publish Command

```bash
byp package publish --name <name> --version <version> --path <file-path|url>
```

### Download Command

```bash
byp package download <name-version>
```

### List Command

```bash
byp package list
```

### Search Command

```bash
byp package search <keyword>
```

### Delete Command

```bash
byp package delete <name-version>
```

### Parameters

#### Publish
- `--name` or `-n`: Name of the package to be published (optional if path is a URL with recognizable pattern)
- `--version` or `-v`: Version of the package (must follow semver format, optional if path is a URL with recognizable pattern)
- `--path` or `-p`: Path to the file that needs to be published or URL to download the file from

#### Download
- `<name-version>`: Combined package name and version (e.g., `zed-0.3.4`)

#### List
- No parameters required

#### Search
- `<keyword>`: Keyword to search for in package names

#### Delete
- `<name-version>`: Combined package name and version to delete (e.g., `zed-0.3.4`)

### Example Usage

```bash
# Publish a local file
byp package publish --name zed --version 0.3.4 --path path/to/file

# Publish a file from URL (auto-extracts name and version)
byp package publish --path https://github.com/zed-industries/zed/releases/download/v0.203.5/Zed-x86_64.dmg

# Download a file
byp package download zed-0.3.4

# List all packages
byp package list

# Search for packages
byp package search zed

# Delete a package
byp package delete zed-0.3.4
```

## Technical Specifications

### File Chunking

- Maximum chunk size: 64MB (67,108,864 bytes)
- Files larger than 64MB will be automatically split into multiple chunks
- Each chunk will be published as a separate package with a naming convention:
  - Package name: `@byp/packages`
  - Package version: `1.0.<index>` for chunks, `1.0.0` for main package
  - Package tag: `<name>-<version>-chunk-<index>` for chunks, `<name>-<version>` for main package
- Metadata will be included to indicate chunk order and total chunks

### Package Naming Convention

For chunked packages:
- Main package: `@byp/packages` with tag `<name>-<version>` and version `1.0.0`
- Chunked packages: `@byp/packages` with tags `<name>-<version>-chunk-<index>` and versions `1.0.<index>`

Example:
- Main package: `@byp/packages` with tag `zed-0.3.4` and version `1.0.0`
- Chunks: `@byp/packages` with tags `zed-0.3.4-chunk-001`, `zed-0.3.4-chunk-002`, etc. and versions `1.0.1`, `1.0.2`, etc.

Users can install specific chunks using tags:
```bash
npm install @byp/packages@zed-0.3.4-chunk-001
```

### URL Path Handling

When a URL is provided as the path, Byp will attempt to automatically extract the package name and version from the URL pattern:

1. **Name Extraction**: The tool will identify the project name from the URL structure
2. **Version Extraction**: The tool will parse the version from the URL path or filename
3. **File Download**: The file will be downloaded to a temporary location before chunking and publishing

Example:
- URL: `https://github.com/zed-industries/zed/releases/download/v0.203.5/Zed-x86_64.dmg`
- Extracted Name: `zed`
- Extracted Version: `0.203.5`
- File: `Zed-x86_64.dmg` (downloaded temporarily)

### Metadata Structure

Each package will include a metadata file (`byp-metadata.json`) with:
- Original file name
- Total number of chunks
- Current chunk index
- Chunk hash for integrity verification
- Original file size

### npm Integration

- Uses standard npm publish/download mechanisms
- Authenticates using existing npm credentials
- Handles package.json generation automatically for `@byp/packages`
- Supports all standard npm configuration options

## Implementation Plan

### Phase 1: Core Functionality
1. File chunking algorithm implementation
2. Package metadata generation for `@byp/packages`
3. Package.json creation for each chunk under `@byp/packages`
4. Basic CLI argument parsing in TypeScript
5. URL pattern recognition and parsing

### Phase 2: npm Integration
1. npm authentication handling
2. Package publishing workflow to `@byp/packages`
3. Package downloading and reassembly workflow
4. Package listing functionality
5. Package search functionality
6. Package deletion functionality
7. URL downloading and temporary file handling
8. Error handling and retries

### Phase 3: Advanced Features
1. Progress reporting for uploads and downloads
2. Resume capability for failed uploads/downloads
3. Verification of published packages
4. Verification of downloaded and reassembled files
5. Support for additional URL patterns

## Dependencies

- `commander`: For CLI argument parsing
- `npm`: For publishing packages
- `axios` or similar HTTP client: For downloading files from URLs
- TypeScript and related tooling
- Standard Node.js libraries for file operations

## Error Handling

- File not found errors
- npm authentication errors
- Network errors during publishing/downloading
- Size limit exceeded errors
- Invalid version format errors
- Package not found errors during download or delete
- No packages found errors during list/search operations
- URL parsing errors
- Download failures
- Deletion failures

## Security Considerations

- Validate file paths to prevent directory traversal
- Verify npm authentication before publishing/downloading
- Confirm package name availability under `@byp/packages`
- Check for sufficient disk space for chunking operations
- Verify integrity of downloaded chunks before reassembly

## Future Enhancements

- Support for other package registries
- Parallel chunk uploading/downloading
- Compression of chunks before uploading
- Progress bars for long operations
- Configuration file support for default options
- Bulk delete operations
- Delete confirmation prompts