#!/usr/bin/env node
/**
 * Run: node scripts/bridge-bluecarbon.mjs exported-bluecarbon.json > receipt.json
 * Read-only, offline; emits no original evidence bytes or source project metadata.
 */
import {readFile} from 'node:fs/promises';
import {importBlueCarbonBundle} from '../src/edition-bridge.mjs';

const path = process.argv[2];
if (!path || process.argv.length !== 3) {
  console.error('Usage: node scripts/bridge-bluecarbon.mjs exported-bluecarbon.json');
  process.exitCode = 2;
} else {
  try {
    const bytes = await readFile(path);
    if (bytes.length > 8 * 1024 * 1024) throw new Error('BLUECARBON_BRIDGE_BUNDLE_TOO_LARGE');
    const bundle = JSON.parse(bytes.toString('utf8'));
    process.stdout.write(JSON.stringify(importBlueCarbonBundle(bundle), null, 2) + '\n');
  } catch (error) {
    // Avoid emitting input bytes or sensitive error payloads to stderr.
    const message = String(error.message || 'IMPORT_ERROR');
    console.error(/^BLUECARBON_BRIDGE_[A-Z_]+$/.test(message) ? message : 'BLUECARBON_BRIDGE_IMPORT_FAILED');
    process.exitCode = 1;
  }
}
