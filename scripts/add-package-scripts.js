#!/usr/bin/env node

/**
 * Add Capacitor convenience scripts to package.json
 * Run this once after migration to add helpful npm scripts
 */

const fs = require('fs');
const path = require('path');

function addCapacitorScripts() {
  const packagePath = path.join(process.cwd(), 'package.json');
  
  if (!fs.existsSync(packagePath)) {
    console.error('❌ package.json not found!');
    process.exit(1);
  }
  
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  
  // Add Capacitor scripts
  const newScripts = {
    "cap:add:android": "npx cap add android",
    "cap:sync": "npx cap sync android",
    "cap:build": "npm run build && npx cap sync android",
    "cap:open": "npx cap open android",
    "cap:dev": "node scripts/build-capacitor.js --dev",
    "cap:build:apk": "node scripts/build-capacitor.js --prod android",
    "cap:build:aab": "node scripts/build-capacitor.js --prod --aab",
    "cap:doctor": "npx cap doctor"
  };
  
  // Merge with existing scripts
  packageJson.scripts = {
    ...packageJson.scripts,
    ...newScripts
  };
  
  // Write back to file
  fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + '\n');
  
  console.log('✅ Added Capacitor scripts to package.json:');
  Object.entries(newScripts).forEach(([key, value]) => {
    console.log(`  ${key}: ${value}`);
  });
  
  console.log('\n🚀 You can now run:');
  console.log('  npm run cap:add:android    # Initialize Android project');
  console.log('  npm run cap:build         # Build and sync');
  console.log('  npm run cap:dev           # Development with live reload');
  console.log('  npm run cap:build:aab     # Production AAB build');
}

if (require.main === module) {
  addCapacitorScripts();
}

module.exports = { addCapacitorScripts };