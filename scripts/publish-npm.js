#!/usr/bin/env node

/**
 * Script to publish to npmjs.org with unscoped package name 'gittable'
 * Temporarily modifies package.json to change name from @gg-santos/gittable to gittable
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const packageJsonPath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// Store original name
const originalName = packageJson.name;

try {
  // Change name to unscoped 'gittable' for npmjs
  packageJson.name = 'gittable';
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
  
  console.log(`Publishing to npmjs.org as 'gittable'...`);
  
  // Publish to npmjs
  execSync('npm publish --registry=https://registry.npmjs.org/', {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
  });
  
  console.log('✓ Successfully published to npmjs.org');
} catch (error) {
  console.error('✗ Failed to publish to npmjs.org:', error.message);
  process.exit(1);
} finally {
  // Always restore original name
  packageJson.name = originalName;
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
  console.log(`✓ Restored package name to '${originalName}'`);
}

