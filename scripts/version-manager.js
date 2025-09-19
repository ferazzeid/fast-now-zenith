#!/usr/bin/env node

/**
 * Version Manager - Handles semantic versioning and changelog updates
 * Usage: node scripts/version-manager.js [patch|minor|major] [description]
 */

const fs = require('fs');
const path = require('path');

function getCurrentVersion() {
  const envPath = path.join(process.cwd(), 'src/env.ts');
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const versionMatch = envContent.match(/version: import\.meta\.env\.VITE_APP_VERSION \|\| "([^"]+)"/);
  
  if (!versionMatch) {
    throw new Error('Could not extract version from src/env.ts');
  }
  
  return versionMatch[1];
}

function parseVersion(version) {
  const parts = version.split('.');
  return {
    major: parseInt(parts[0]) || 0,
    minor: parseInt(parts[1]) || 0,
    patch: parseInt(parts[2]) || 0
  };
}

function incrementVersion(currentVersion, type) {
  const version = parseVersion(currentVersion);
  
  switch (type) {
    case 'major':
      version.major++;
      version.minor = 0;
      version.patch = 0;
      break;
    case 'minor':
      version.minor++;
      version.patch = 0;
      break;
    case 'patch':
    default:
      version.patch++;
      break;
  }
  
  return `${version.major}.${version.minor}.${version.patch}`;
}

function updateEnvFile(newVersion) {
  const envPath = path.join(process.cwd(), 'src/env.ts');
  let envContent = fs.readFileSync(envPath, 'utf-8');
  
  envContent = envContent.replace(
    /version: import\.meta\.env\.VITE_APP_VERSION \|\| "[^"]+"/,
    `version: import.meta.env.VITE_APP_VERSION || "${newVersion}"`
  );
  
  fs.writeFileSync(envPath, envContent);
}

function updateChangelog(newVersion, type, description) {
  const changelogPath = path.join(process.cwd(), 'CHANGELOG.md');
  const changelogContent = fs.readFileSync(changelogPath, 'utf-8');
  
  const today = new Date().toISOString().split('T')[0];
  const changeType = type === 'major' ? 'Breaking Changes' : 
                    type === 'minor' ? 'Added' : 'Fixed';
  
  const newEntry = `## [${newVersion}] - ${today}

### ${changeType}
- ${description}

---

`;

  // Insert after the first "# Changelog" line and any existing content before the first version
  const insertPoint = changelogContent.indexOf('\n## [');
  if (insertPoint === -1) {
    // If no versions exist yet, add after the header
    const headerEnd = changelogContent.indexOf('\n\n') + 2;
    const updatedContent = changelogContent.slice(0, headerEnd) + newEntry + changelogContent.slice(headerEnd);
    fs.writeFileSync(changelogPath, updatedContent);
  } else {
    const updatedContent = changelogContent.slice(0, insertPoint + 1) + newEntry + changelogContent.slice(insertPoint + 1);
    fs.writeFileSync(changelogPath, updatedContent);
  }
}

function main() {
  const args = process.argv.slice(2);
  const type = args[0] || 'patch';
  const description = args[1] || 'Version update';
  
  if (!['patch', 'minor', 'major'].includes(type)) {
    console.error('❌ Invalid version type. Use: patch, minor, or major');
    process.exit(1);
  }
  
  try {
    const currentVersion = getCurrentVersion();
    const newVersion = incrementVersion(currentVersion, type);
    
    console.log(`📦 Updating version: ${currentVersion} → ${newVersion}`);
    
    // Update files
    updateEnvFile(newVersion);
    updateChangelog(newVersion, type, description);
    
    console.log('✅ Version updated successfully!');
    console.log(`📝 Updated files:`);
    console.log(`  - src/env.ts`);
    console.log(`  - CHANGELOG.md`);
    console.log('');
    console.log(`🚀 Next steps:`);
    console.log(`  1. Review the changes`);
    console.log(`  2. Commit: git add . && git commit -m "chore: bump version to ${newVersion}"`);
    console.log(`  3. Tag: git tag v${newVersion}`);
    console.log(`  4. Push: git push && git push --tags`);
    
  } catch (error) {
    console.error('❌ Error updating version:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { getCurrentVersion, incrementVersion, updateEnvFile, updateChangelog };