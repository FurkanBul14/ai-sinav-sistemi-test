const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const rootPath = path.resolve(__dirname, '..');
const legacyBase = path.join(rootPath, 'legacy_folders');
const activeFrontend = path.join(rootPath, 'frontend');
const activeAuth = path.join(rootPath, 'services', 'auth-service');

console.log('--- COMPARING AND INTEGRATING LEGACY FILES ---');

if (!fs.existsSync(legacyBase)) {
  console.error('Error: legacy_folders directory not found. Run node scripts/extract_legacy_folders.js first.');
  process.exit(1);
}

const report = {
  copied: [],
  modified: [],
  identical: [],
};

// Helper: Get MD5 of file
function getMD5(filePath) {
  const content = fs.readFileSync(filePath);
  return crypto.createHash('md5').update(content).digest('hex');
}

// Helper: Recursively walk a directory and return a list of files
function getFiles(dir, baseDir = dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getFiles(filePath, baseDir));
    } else {
      results.push(path.relative(baseDir, filePath));
    }
  });
  return results;
}

// Process a legacy folder
function processLegacyFolder(folderName, targetActivePath) {
  const sourcePath = path.join(legacyBase, folderName);
  if (!fs.existsSync(sourcePath)) {
    console.log(`Folder ${folderName} does not exist, skipping.`);
    return;
  }

  console.log(`\nAnalyzing ${folderName} -> Target: ${path.basename(targetActivePath)}...`);
  const files = getFiles(sourcePath);
  console.log(`Found ${files.length} files in ${folderName}`);

  files.forEach(relPath => {
    const srcFile = path.join(sourcePath, relPath);
    const destFile = path.join(targetActivePath, relPath);

    // Skip node_modules and package-lock.json
    if (relPath.includes('node_modules') || relPath.includes('package-lock.json') || relPath.includes('.git')) {
      return;
    }

    if (!fs.existsSync(destFile)) {
      // File does not exist in active workspace, copy it over!
      fs.mkdirSync(path.dirname(destFile), { recursive: true });
      fs.copyFileSync(srcFile, destFile);
      report.copied.push({ folder: folderName, file: relPath });
      console.log(`[COPY] New file: ${relPath}`);
    } else {
      // File exists, compare hashes
      const srcHash = getMD5(srcFile);
      const destHash = getMD5(destFile);

      if (srcHash !== destHash) {
        report.modified.push({ folder: folderName, file: relPath, srcFile, destFile });
        console.log(`[DIFF] Modified file: ${relPath}`);
      } else {
        report.identical.push({ folder: folderName, file: relPath });
      }
    }
  });
}

// Run comparisons
// 1. frontend_yeni -> frontend
processLegacyFolder('frontend_yeni', activeFrontend);

// 2. frontend_updates -> frontend
processLegacyFolder('frontend_updates', activeFrontend);

// 3. Proctor-Teslim -> check if it maps to frontend or auth-service
const proctorTeslimPath = path.join(legacyBase, 'Proctor-Teslim');
if (fs.existsSync(proctorTeslimPath)) {
  // Proctor-Teslim might contain a frontend folder or a backend folder
  const items = fs.readdirSync(proctorTeslimPath);
  items.forEach(item => {
    const itemPath = path.join(proctorTeslimPath, item);
    const stat = fs.statSync(itemPath);
    if (stat.isDirectory()) {
      if (item === 'frontend') {
        processLegacyFolder('Proctor-Teslim/frontend', activeFrontend);
      } else if (item === 'backend' || item.includes('service')) {
        processLegacyFolder(`Proctor-Teslim/${item}`, activeAuth);
      }
    }
  });
}

console.log('\n=== INTEGRATION REPORT ===');
console.log(`Copied (New Files): ${report.copied.length}`);
console.log(`Modified (Different Content): ${report.modified.length}`);
console.log(`Identical: ${report.identical.length}`);

if (report.modified.length > 0) {
  console.log('\nThe following files have differences. Please inspect them to merge if needed:');
  report.modified.forEach(m => {
    console.log(`- [${m.folder}] ${m.file}`);
  });
}
