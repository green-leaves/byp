import { Command } from 'commander';
import { chunkFile } from '../core/chunker';
import { generateMetadata } from '../core/metadata';
import { parseUrl } from '../core/url-parser';
import { formatBytes, ProgressBar } from '../core/progress';
import { MAX_CHUNK_SIZE, DEFAULT_PACKAGE_NAME } from '../constants';
import { publishPackage, createPackage } from '../npm/publisher';
import { isNpmAuthenticated } from '../npm/auth';
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';

export const publish = new Command('publish')
  .description('Publish a file to npm by chunking it into smaller pieces')
  .option('-n, --name <name>', 'name of the package to be published')
  .option('-v, --version <version>', 'version of the package')
  .option('-p, --path <path>', 'path to the file or URL to download')
  .helpOption('-h, --help', 'Display help for command')
  .addHelpText('after', `
Examples:
  $ byp package publish --name myapp --version 1.0.0 --path ./my-large-file.zip
  $ byp package publish --name myapp --version 1.0.0 --path https://example.com/file.zip

Description:
  Publishes a large file to npm by automatically chunking it into smaller pieces (max 64MB each).
  Files larger than 64MB will be split into multiple chunks, each published as a separate package.
  A main package with metadata is also published to allow for proper reassembly during download.

Options:
  -n, --name <name>          Name of the package to be published
  -v, --version <version>    Version of the package
  -p, --path <path>          Path to the local file or URL to download
  -h, --help                 Display help for command
`)
  .action(async (options) => {
    try {
      console.log('🚀 Starting publish command...');
      let { name, version, path: filePath } = options;
      
      // Check if npm is authenticated
      if (!isNpmAuthenticated()) {
        console.error('Error: npm is not authenticated. Please run "npm login" first.');
        process.exit(1);
      }
      
      console.log(`📦 Package: ${name}-${version}`);
      console.log(`📁 File path: ${filePath}`);
      
      // Check if path is a URL
      if (filePath && filePath.startsWith('http')) {
        console.log('🌐 Detected URL, downloading file...');
        // Parse URL to extract name and version if not provided
        const urlInfo = parseUrl(filePath);
        if (!name) name = urlInfo.name;
        if (!version) version = urlInfo.version;
        console.log(`🔗 Parsed from URL: ${name}-${version}`);
        
        // Download file from URL to temporary location
        console.log(`📥 Downloading file from ${filePath}`);
        const response = await axios({
          method: 'GET',
          url: filePath,
          responseType: 'stream'
        });
        
        // Create temporary file path
        const tempDir = path.join(process.cwd(), 'temp');
        if (!fs.existsSync(tempDir)) {
          fs.mkdirSync(tempDir);
        }
        
        const fileName = path.basename(filePath);
        filePath = path.join(tempDir, fileName);
        
        const writer = fs.createWriteStream(filePath);
        response.data.pipe(writer);
        
        // Wait for download to complete
        await new Promise((resolve, reject) => {
          writer.on('finish', resolve);
          writer.on('error', reject);
        });
        
        console.log(`✅ File downloaded to ${filePath}`);
      }
      
      // Validate required parameters
      if (!name || !version || !filePath) {
        console.error('Error: name, version, and path are required');
        process.exit(1);
      }
      
      console.log(`✅ Validated parameters: ${name}-${version}`);
      
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        console.error(`Error: File ${filePath} does not exist`);
        process.exit(1);
      }
      
      // Detect platform from file extension and filename
      const fileExtension = path.extname(filePath).toLowerCase();
      const fileName = path.basename(filePath).toLowerCase();
      let platformSuffix = '';
      
      // Check extension first
      if (fileExtension === '.dmg') {
        platformSuffix = '-macos';
      } else if (fileExtension === '.exe') {
        platformSuffix = '-windows';
      } else if (fileExtension === '.deb' || fileExtension === '.rpm' || fileExtension === '.appimage') {
        platformSuffix = '-linux';
      }
      
      // If no platform detected from extension, check filename
      if (!platformSuffix) {
        if (fileName.includes('macos') || fileName.includes('darwin')) {
          platformSuffix = '-macos';
        } else if (fileName.includes('win') && !fileName.includes('window')) { // Avoid matching "window" in other words
          platformSuffix = '-windows';
        } else if (fileName.includes('linux') || fileName.includes('unix') || 
                   fileName.includes('ubuntu') || fileName.includes('debian') || 
                   fileName.includes('fedora') || fileName.includes('centos') ||
                   fileName.includes('redhat') || fileName.includes('suse') ||
                   fileName.includes('arch') || fileName.includes('manjaro') ||
                   (fileName.includes('linux') && fileName.includes('x86')) ||
                   (fileName.includes('linux') && fileName.includes('arm'))) {
          platformSuffix = '-linux';
        }
      }
      
      // Modify name and version to include platform suffix
      const platformName = name + platformSuffix;
      const platformVersion = version;
      
      console.log(`🖥️  Detected platform: ${platformSuffix || 'generic'}`);
      console.log(`🏷️  Package name will be: ${platformName}-${platformVersion}`);
      
      // Get file size for display
      const fileStats = fs.statSync(filePath);
      console.log(`📊 File size: ${formatBytes(fileStats.size)}`);
      
      // Chunk the file
      console.log(`🔧 Chunking file ${filePath}`);
      const chunks = await chunkFile(filePath, MAX_CHUNK_SIZE, (current, total) => {
        const percentage = Math.floor((current / total) * 100);
        process.stdout.write(`\r🔧 Chunking: ${percentage}% (${formatBytes(current)}/${formatBytes(total)})`);
      });
      console.log(); // New line after progress
      
      console.log(`✅ File chunked into ${chunks.length} pieces`);
      
      // Generate metadata for the file
      console.log('📝 Generating metadata');
      const metadata = await generateMetadata(filePath, chunks.length);
      
      console.log(`🏷️  Package name: ${platformName}, version: ${platformVersion}`);
      
      // If file is smaller than chunk size, upload directly without chunking
      if (chunks.length <= 1) {
        console.log('📦 File is smaller than chunk size, uploading directly...');
        
        // For small files, we still create chunks but there will be only one
        // We'll use the main package to store the file directly
        const mainTagName = `${platformName}-${platformVersion}`;
        const packageName = DEFAULT_PACKAGE_NAME;
        console.log(`📤 Creating package with version ${platformVersion}-${platformName}-${Date.now()} and tag ${mainTagName}`);
        
        // Generate metadata for the single chunk/file
        if (chunks.length === 1) {
          await generateMetadata(filePath, chunks.length, 0, chunks[0].filePath);
        }
        
        const mainPackageDir = createPackage(
          packageName,
          `${platformVersion}-${platformName}-${Date.now()}`, // Main package version with package info and timestamp
          mainTagName,
          filePath, // Use the original file directly
          path.join(process.cwd(), 'temp', chunks.length === 1 ? 'metadata-chunk-0.json' : 'metadata.json')
        );
        
        console.log('📤 Publishing package...');
        const success = await publishPackage(mainPackageDir, mainTagName, (message) => {
          console.log(`  ${message}`);
        });
        
        if (!success) {
          console.error('❌ Failed to publish main package');
          process.exit(1);
        }
        
        // Clean up temporary package directory
        fs.rmSync(mainPackageDir, { recursive: true, force: true });
        
        console.log(`🎉 Successfully published ${platformName}-${platformVersion} (single file, no chunking)`);
        return;
      }
      
      // For large files, use the chunking approach
      // Publish each chunk to npm
      console.log('📤 Publishing chunks to npm...');
      const packageName = DEFAULT_PACKAGE_NAME;
      
      // Create progress bar for chunk publishing
      const chunkProgressBar = new ProgressBar(chunks.length, 'Chunks:', 30, (value) => value.toString());
      let publishedChunks = 0;
      
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const chunkTagName = `${platformName}-${platformVersion}-chunk-${String(i + 1).padStart(3, '0')}`;
        
        // Generate metadata for this specific chunk
        const chunkMetadata = await generateMetadata(filePath, chunks.length, i, chunk.filePath);
        
        // Create package for this chunk with a unique version number
        // Using format: <package_version>-<package_name>-<timestamp>
        const chunkVersion = `${platformVersion}-${platformName}-${Date.now()}`;
        console.log(`📤 Creating package with version ${chunkVersion} and tag ${chunkTagName}`);
        
        const packageDir = createPackage(
          packageName,
          chunkVersion,
          chunkTagName,
          chunk.filePath,
          path.join(process.cwd(), 'temp', `metadata-chunk-${i}.json`)
        );
        
        // Publish the package
        const success = await publishPackage(packageDir, chunkTagName, (message) => {
          // Don't print individual publish messages to keep the progress bar clean
        });
        
        if (!success) {
          console.error(`❌ Failed to publish chunk ${i + 1}`);
          process.exit(1);
        }
        
        // Clean up temporary package directory
        fs.rmSync(packageDir, { recursive: true, force: true });
        
        // Update progress bar
        publishedChunks++;
        chunkProgressBar.update(publishedChunks);
      }
      
      console.log(); // New line after progress bar
      
      // Publish main package with metadata
      console.log('📤 Publishing main package...');
      const mainTagName = `${platformName}-${platformVersion}`;
      console.log(`📤 Creating main package with version ${platformVersion}-${platformName}-${Date.now()} and tag ${mainTagName}`);
      
      const mainPackageDir = createPackage(
        packageName,
        `${platformVersion}-${platformName}-${Date.now()}`, // Main package version with package info and timestamp
        mainTagName,
        null, // For main package of large files, only include metadata
        path.join(process.cwd(), 'temp', 'metadata.json')
      );
      
      console.log('📤 Publishing main package...');
      const success = await publishPackage(mainPackageDir, mainTagName, (message) => {
        console.log(`  ${message}`);
      });
      
      if (!success) {
        console.error('❌ Failed to publish main package');
        process.exit(1);
      }
      
      // Clean up temporary package directory
      fs.rmSync(mainPackageDir, { recursive: true, force: true });
      
      console.log(`🎉 Successfully published ${platformName}-${platformVersion} with ${chunks.length} chunks`);
    } catch (error) {
      console.error('Error:', error);
      process.exit(1);
    }
  });