/**
 * @file CRX and ZIP Build Script
 * @description
 * This script generates a Chrome extension package (CRX) and a ZIP archive
 * from the built extension files. It also manages the private key
 * (discolors.pem) to ensure a reproducible build process.
 */

// --- Module Imports ---
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import CRX from 'crx';
import archiver from 'archiver';

// --- Configuration Paths ---
const EXTENSION_BUILD_DIR = path.resolve('./build/discolors'); // Directory containing built extension files
const PRIVATE_KEY_PATH = path.resolve('discolors.pem'); // Path to the private key file
const OUTPUT_CRX_PATH = path.resolve('./build/discolors.crx'); // Output path for the CRX package
const OUTPUT_ZIP_PATH = path.resolve('./build/discolors.zip'); // Output path for the ZIP archive
const MANIFEST_PATH = path.join(EXTENSION_BUILD_DIR, 'manifest.json'); // Path to the manifest.json file

/**
 * Builds the Chrome extension in both CRX and ZIP formats.
 * Checks and generates a private key if missing, packs the extension,
 * and outputs both CRX and ZIP files.
 */
async function buildCrxAndZip() {
  console.log(`Starting packaging from: ${EXTENSION_BUILD_DIR}`);

  // --- Validate Manifest ---
  if (!fs.existsSync(MANIFEST_PATH)) {
    console.error(
      `Error: manifest.json not found at ${MANIFEST_PATH}. Please run 'npm run build' first.`
    );
    process.exit(1);
  }

  // --- Check or Generate Private Key ---
  if (!fs.existsSync(PRIVATE_KEY_PATH)) {
    console.log(
      "Private key 'discolors.pem' not found. Generating a new 2048-bit RSA key using OpenSSL..."
    );
    try {
      execSync(`openssl genrsa -out ${PRIVATE_KEY_PATH} 2048`);
      console.log(`New private key generated at: ${PRIVATE_KEY_PATH}`);
    } catch (err) {
      console.error(
        '❌ Failed to generate private key. Ensure OpenSSL is installed and accessible.'
      );
      console.error(err.message || err);
      process.exit(1);
    }
  } else {
    console.log(`Reusing existing private key: ${PRIVATE_KEY_PATH}`);
  }

  // --- Configure CRX Packaging ---
  const crxConfig = {
    manifest: MANIFEST_PATH,
    privateKey: fs.readFileSync(PRIVATE_KEY_PATH),
  };

  // --- Instantiate CRX Object ---
  const crx = new CRX(crxConfig);

  try {
    // --- Load Extension Files ---
    await crx.load(EXTENSION_BUILD_DIR);

    // --- Pack CRX File ---
    const crxBuffer = await crx.pack();
    fs.writeFileSync(OUTPUT_CRX_PATH, crxBuffer);
    console.log(`✅ Successfully generated CRX: ${OUTPUT_CRX_PATH}`);
  } catch (err) {
    const errorMessage = err.message || JSON.stringify(err);
    console.error('❌ CRX build failed. Full error details:', errorMessage);

    // Handle corrupted private key scenario
    if (
      errorMessage.includes('Key format must be specified') &&
      fs.existsSync(PRIVATE_KEY_PATH)
    ) {
      console.error(
        "🔑 Detected corrupted 'discolors.pem'. Deleting the file to regenerate..."
      );
      fs.unlinkSync(PRIVATE_KEY_PATH);
      console.error(
        "Please run 'npm run build-crx' again immediately to generate a valid key."
      );
    }
    process.exit(1);
  }

  // --- Generate ZIP Archive ---
  console.log(`📦 Generating ZIP archive at: ${OUTPUT_ZIP_PATH}`);
  const output = fs.createWriteStream(OUTPUT_ZIP_PATH);
  const archive = archiver('zip', { zlib: { level: 9 } });

  archive.pipe(output);
  archive.directory(EXTENSION_BUILD_DIR, false); // Pack files into the root of the ZIP
  await archive.finalize();

  console.log('✅ ZIP archive generated successfully!');
}

// --- Execute Build Script ---
buildCrxAndZip();
