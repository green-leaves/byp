# Byp - NPM Package Publisher and Downloader with File Chunking

Byp is a powerful command-line tool that enables publishing and downloading large files to/from npm repositories by automatically chunking them into smaller pieces to comply with npm's size limitations.

## Features

- **File Chunking**: Automatically splits large files into 64MB chunks for npm compatibility
- **Progress Reporting**: Real-time progress bars with transfer speeds and ETA
- **Package Verification**: SHA256 hash verification for file integrity
- **Enhanced URL Parsing**: Support for GitHub, GitLab, npm, and PyPI URLs
- **Configurable Package Name**: Customize the package scope for publishing/downloading
- **Cross-Platform**: Works on Windows, macOS, and Linux

## Installation

```bash
npm install -g @byp/byp
```

## Usage

### Publishing a File

```bash
byp package publish --name my-app --version 1.0.0 --path ./my-large-file.zip
```

### Downloading a File

```bash
byp package download my-app-1.0.0
```

### Additional Commands

```bash
# List all published packages
byp package list

# Search for packages
byp package search keyword

# Delete a package
byp package delete my-app-1.0.0
```

## Options

The publish command supports the following options:
- `-n, --name <name>`: Name of the package to be published
- `-v, --version <version>`: Version of the package
- `-p, --path <path>`: Path to the file or URL to download

The download command supports the following options:
- `-o, --output <path>`: Output path for the downloaded file

The search command searches for packages by keyword within published packages.

## Configuration

The package name used for publishing and downloading chunked files can be configured by modifying the `DEFAULT_PACKAGE_NAME` constant in `src/constants.ts`.

## License

MIT