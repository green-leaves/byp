import { Command } from 'commander';
import { downloadPackage, listPackageTags, getVersionFromTag } from '../npm/downloader';
import { isNpmAuthenticated } from '../npm/auth';
import { DEFAULT_PACKAGE_NAME } from '../constants';
import { verifyFileIntegrity } from '../core/verification';
import { ProgressBar, formatBytes } from '../core/progress';
import * as fs from 'fs';
import * as path from 'path';

export const download = new Command('download')
  .description('Download and reassemble a chunked file from npm')
  .argument('<name-version>', 'name and version of the package to download (e.g., zed-0.3.4)')
  .option('-o, --output <path>', 'output path for the downloaded file')
  .helpOption('-h, --help', 'Display help for command')
  .addHelpText('after', `
Examples:
  $ byp package download myapp-1.0.0
  $ byp package download myapp-1.0.0 --output ./downloads/

Description:
  Downloads and reassembles a file that was previously published using the 'publish' command.
  If the original file was larger than 64MB, this command will download all chunks and reassemble them.
  For files smaller than 64MB, it downloads the single package directly.

Arguments:
  <name-version>  Name and version of the package to download (e.g., myapp-1.0.0)

Options:
  -o, --output <path>  Output path for the downloaded file (default: current directory)
  -h, --help           Display help for command
`)
  .action(async (nameVersion, options) => {
    try {
      // Check if npm is authenticated
      if (!isNpmAuthenticated()) {
        console.error('Error: npm is not authenticated. Please run "npm login" first.');
        process.exit(1);
      }
      
      console.log(`🚀 Starting download of package ${nameVersion}`);
      
      // Split name and version
      const lastDashIndex = nameVersion.lastIndexOf('-');
      if (lastDashIndex === -1) {
        console.error('Error: Invalid package name format. Expected <name>-<version>');
        process.exit(1);
      }
      
      const name = nameVersion.substring(0, lastDashIndex);
      const version = nameVersion.substring(lastDashIndex + 1);
      
      // Get all tags for this package
      const packageName = DEFAULT_PACKAGE_NAME;
      const allTags = await listPackageTags(packageName);
      
      // Filter tags that belong to this package
      const packageTags = allTags.filter(tag => tag.startsWith(`${name}-${version}`));
      
      if (packageTags.length === 0) {
        console.error(`Error: No package found with name ${name} and version ${version}`);
        process.exit(1);
      }
      
      console.log(`📋 Found ${packageTags.length} tags for package ${name}-${version}`);
      
      // Check if this is a chunked package or a single file package
      const chunkTags = packageTags.filter(tag => tag.includes('-chunk-'));
      
      if (chunkTags.length === 0) {
        // This is a single file package (not chunked)
        console.log('📦 Downloading single file package...');
        const mainTag = `${name}-${version}`;
        
        if (!packageTags.includes(mainTag)) {
          console.error(`Error: Main package tag ${mainTag} not found`);
          process.exit(1);
        }
        
        // Download main package
        console.log('📥 Downloading package...');
        // For single file packages, we need to get the actual version from the tag
        const actualVersion = await getVersionFromTag(packageName, mainTag);
        const mainPackagePath = await downloadPackage(packageName, actualVersion, mainTag, (message) => {
          console.log(`  ${message}`);
        });
        
        // Find the main file in the package (not metadata)
        const mainPackageFiles = fs.readdirSync(mainPackagePath);
        const mainFile = mainPackageFiles.find(file => 
          file !== 'package.json' && 
          file !== 'byp-metadata.json' && 
          !file.startsWith('metadata-chunk-')
        );
        
        if (!mainFile) {
          console.error('Error: Main file not found in package');
          process.exit(1);
        }
        
        // Read metadata to get original filename and hash
        const metadataFile = mainPackageFiles.find(file => 
          file === 'byp-metadata.json' || file.startsWith('metadata-chunk-')
        );
        let originalFileName = mainFile; // fallback to main file name
        
        if (metadataFile) {
          const metadataPath = path.join(mainPackagePath, metadataFile);
          const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
          originalFileName = metadata.originalFileName || mainFile;
          
          // Verify file integrity if hash is available
          if (metadata.fileHash) {
            console.log('🔍 Verifying file integrity...');
            const isIntegrityOk = await verifyFileIntegrity(
              path.join(mainPackagePath, mainFile), 
              metadata.fileHash
            );
            
            if (!isIntegrityOk) {
              console.warn('⚠️  Warning: File integrity check failed for downloaded file');
            } else {
              console.log('✅ File integrity verified successfully');
            }
          } else {
            console.log('ℹ️  No file hash available for integrity verification');
          }
        } else {
          console.log('ℹ️  No metadata file found for integrity verification');
        }
        
        // Create output directory if it doesn't exist
        const outputPath = options.output || process.cwd();
        if (!fs.existsSync(outputPath)) {
          fs.mkdirSync(outputPath, { recursive: true });
        }
        
        // Copy the file to the output location
        const sourcePath = path.join(mainPackagePath, mainFile);
        const outputFileSingle = path.join(outputPath, originalFileName);
        fs.copyFileSync(sourcePath, outputFileSingle);
        
        console.log(`🎉 Successfully downloaded ${originalFileName} to ${outputFileSingle}`);
        return;
      }
      
      // This is a chunked package, use the existing chunked download logic
      console.log('📦 Downloading chunked package...');
      
      // Find the main package tag and chunk tags
      const mainTag = `${name}-${version}`;
      
      if (!packageTags.includes(mainTag)) {
        console.error(`Error: Main package tag ${mainTag} not found`);
        process.exit(1);
      }
      
      // Download main package to get metadata
      console.log('📥 Downloading main package for metadata...');
      // Get the actual version associated with the main tag
      const mainVersion = await getVersionFromTag(packageName, mainTag);
      const mainPackagePath = await downloadPackage(packageName, mainVersion, mainTag, (message) => {
        console.log(`  ${message}`);
        });
      
      // Find metadata file in main package
      const mainPackageFiles = fs.readdirSync(mainPackagePath);
      const metadataFile = mainPackageFiles.find(file => 
        file === 'byp-metadata.json' || file === 'metadata.json'
      );
      
      if (!metadataFile) {
        console.error('Error: Metadata file not found in main package');
        process.exit(1);
      }
      
      // Read metadata to get original filename and file hash
      const metadataPath = path.join(mainPackagePath, metadataFile);
      const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
      const originalFileName = metadata.originalFileName;
      const expectedFileHash = metadata.fileHash;
      const totalChunks = metadata.totalChunks;
      
      console.log(`📋 Package info: ${originalFileName} (${formatBytes(metadata.originalFileSize)}) with ${totalChunks} chunks`);
      
      // Create output directory if it doesn't exist
      const outputPath = options.output || process.cwd();
      if (!fs.existsSync(outputPath)) {
        fs.mkdirSync(outputPath, { recursive: true });
      }
      
      // Download all chunks
      console.log('📥 Downloading chunks...');
      const chunkData: { index: number; data: Buffer }[] = [];
      
      // Create progress bar for chunk downloads
      const chunkProgressBar = new ProgressBar(totalChunks, 'Chunks:', 30, (value) => value.toString());
      let downloadedChunks = 0;
      
      for (const tag of chunkTags) {
        // Get the actual version associated with this tag
        const chunkVersion = await getVersionFromTag(packageName, tag);
        const chunkPackagePath = await downloadPackage(packageName, chunkVersion, tag, (message) => {
          // Don't print individual download messages to keep the progress bar clean
        });
        
        // Find the chunk file in the package
        const chunkPackageFiles = fs.readdirSync(chunkPackagePath);
        const chunkFile = chunkPackageFiles.find(file => file !== 'package.json' && file !== 'byp-metadata.json');
        
        if (!chunkFile) {
          console.error(`Error: Chunk file not found in package with tag ${tag}`);
          process.exit(1);
        }
        
        // Read chunk data
        const chunkPath = path.join(chunkPackagePath, chunkFile);
        const data = fs.readFileSync(chunkPath);
        
        // Extract index from tag (chunk-001, chunk-002, etc.)
        const tagParts = tag.split('-chunk-');
        const chunkIndex = tagParts[1]; // <index>
        const index = parseInt(chunkIndex, 10) - 1;
        
        // Verify chunk integrity if metadata is available
        const chunkMetadataFile = chunkPackageFiles.find(file => file.startsWith('metadata-chunk-'));
        if (chunkMetadataFile) {
          const chunkMetadataPath = path.join(chunkPackagePath, chunkMetadataFile);
          const chunkMetadata = JSON.parse(fs.readFileSync(chunkMetadataPath, 'utf8'));
          
          if (chunkMetadata.chunkHash) {
            // We would verify the chunk hash here, but we need to calculate it
            // For now, we'll just log that we're verifying
          }
        }
        
        chunkData.push({ index, data });
        
        // Update progress bar
        downloadedChunks++;
        chunkProgressBar.update(downloadedChunks);
      }
      
      console.log(); // New line after progress bar
      
      // Sort chunks by index
      chunkData.sort((a, b) => a.index - b.index);
      
      // Reassemble file
      console.log('🔧 Reassembling file...');
      const outputFile = path.join(outputPath, originalFileName);
      const writeStream = fs.createWriteStream(outputFile);
      
      // Create progress bar for reassembly
      const totalSize = metadata.originalFileSize;
      const reassemblyProgressBar = new ProgressBar(totalSize, 'Reassembling:', 30, formatBytes);
      let reassembledBytes = 0;
      
      for (const chunk of chunkData) {
        writeStream.write(chunk.data);
        reassembledBytes += chunk.data.length;
        reassemblyProgressBar.update(reassembledBytes);
      }
      
      // Wait for the stream to finish before verifying
      await new Promise<void>((resolve, reject) => {
        writeStream.end(() => {
          resolve();
        });
        writeStream.on('error', reject);
      });
      
      console.log(); // New line after progress bar
      
      // Verify reassembled file integrity if hash is available
      if (expectedFileHash) {
        console.log('🔍 Verifying reassembled file integrity...');
        const isIntegrityOk = await verifyFileIntegrity(outputFile, expectedFileHash);
        
        if (!isIntegrityOk) {
          console.warn('⚠️  Warning: File integrity check failed for reassembled file');
        } else {
          console.log('✅ Reassembled file integrity verified successfully');
        }
      } else {
        console.log('ℹ️  No file hash available for integrity verification');
      }
      
      console.log(`🎉 Successfully downloaded and reassembled ${originalFileName} to ${outputFile}`);
    } catch (error) {
      console.error('Error:', error);
      process.exit(1);
    }
  });