# Byp Development Workflow

This document describes the development workflow for the Byp project, a command-line tool for publishing and downloading large files to/from npm repositories by automatically chunking them into smaller pieces.

## Project Structure

```
byp/
├── src/
│   ├── commands/       # CLI command implementations
│   │   ├── publish.ts   # File publishing functionality
│   │   ├── download.ts  # File downloading functionality
│   │   ├── list.ts      # Package listing functionality
│   │   ├── search.ts    # Package search functionality
│   │   └── delete.ts    # Package deletion functionality
│   ├── core/           # Core functionality
│   │   ├── chunker.ts   # File chunking logic
│   │   ├── metadata.ts  # Metadata generation
│   │   └── url-parser.ts # URL parsing logic
│   ├── npm/            # NPM integration
│   │   ├── auth.ts      # Authentication handling
│   │   ├── publisher.ts # Package publishing
│   │   └── downloader.ts # Package downloading
│   ├── constants.ts     # Project constants
│   └── index.ts         # CLI entry point
├── dist/               # Compiled output
├── __tests__/          # Test files
├── package.json        # Project configuration
└── README.md           # Project documentation
```

## Development Workflow

### 1. Setting Up the Environment

1. Clone the repository:
   ```bash
   git clone https://github.com/green-leaves/byp.git
   cd byp
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Ensure you're logged into npm:
   ```bash
   npm login
   ```

### 2. Development Cycle

#### Making Changes

1. Create a new branch for your feature or bug fix:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes to the source files in the `src/` directory.

3. Build the project to compile TypeScript to JavaScript:
   ```bash
   npm run build
   ```

4. Test your changes:
   ```bash
   npm test
   ```

#### Code Quality

1. Ensure your code follows the existing style and conventions.
2. Add or update tests as needed in the `__tests__` directory.
3. Update documentation (README.md, this file, etc.) as needed.

#### Committing Changes

1. Stage your changes:
   ```bash
   git add .
   ```

2. Commit with a descriptive message:
   ```bash
   git commit -m "Description of your changes"
   ```

3. Push to the remote repository:
   ```bash
   git push origin feature/your-feature-name
   ```

4. Create a pull request on GitHub.

### 3. Testing

The project uses Jest for testing. Run tests with:

```bash
npm test
```

Tests are located in the `src/__tests__` directory and cover:
- CLI integration
- File chunking functionality
- URL parsing
- Manual chunking scenarios
- Metadata generation

### 4. Building

To build the project for distribution:

```bash
npm run build
```

This will:
1. Clean the `dist/` directory
2. Compile TypeScript files to JavaScript
3. Output the compiled files to `dist/`

### 5. Running the CLI

After building, you can run the CLI directly:

```bash
node dist/index.js [command] [options]
```

Or if you've installed the package globally:

```bash
byp [command] [options]
```

## CLI Commands Workflow

### Publish Workflow

1. User runs `byp package publish` with name, version, and path
2. If path is a URL, download the file
3. Check if file exists locally
4. Detect platform from file extension/filename
5. Chunk file if larger than 64MB
6. Generate metadata for file/chunks
7. Create package.json for each chunk
8. Publish chunks to npm with unique tags
9. Publish main package with metadata

### Download Workflow

1. User runs `byp package download` with package name-version
2. List all tags for the package
3. Filter tags that belong to the requested package
4. Check if it's a chunked package or single file
5. Download main package to get metadata
6. If chunked, download all chunks
7. Reassemble file from chunks
8. Save reassembled file to output location

### List Workflow

1. User runs `byp package list`
2. Get all tags for the package scope
3. Filter out chunk tags and only show main packages
4. Display list of available packages

### Search Workflow

1. User runs `byp package search` with keyword
2. Search npm for packages matching the keyword
3. Display matching packages

### Delete Workflow

1. User runs `byp package delete` with package name-version
2. List all tags for the package
3. Filter tags that belong to the requested package
4. Delete each tag associated with the package

## Release Workflow

1. Ensure all tests pass:
   ```bash
   npm test
   ```

2. Build the project:
   ```bash
   npm run build
   ```

3. Update version in `package.json`:
   ```bash
   npm version [major|minor|patch]
   ```

4. Publish to npm:
   ```bash
   npm publish
   ```

5. Push changes to GitHub:
   ```bash
   git push origin master
   git push --tags
   ```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Update documentation
6. Submit a pull request