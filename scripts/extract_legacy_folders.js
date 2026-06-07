const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const rootPath = path.resolve(__dirname, '..');
const zipPath = path.join(rootPath, '.zip');
const extractTemp = path.join(rootPath, 'legacy_extract');

console.log('--- LEGACY FOLDERS EXTRACTION ---');
console.log('Zip file:', zipPath);

if (!fs.existsSync(zipPath)) {
  console.error('Error: .zip not found!');
  process.exit(1);
}

if (!fs.existsSync(extractTemp)) {
  fs.mkdirSync(extractTemp, { recursive: true });
}

exec('tar -tf "' + zipPath + '"', { maxBuffer: 1024 * 1024 * 10 }, (err, stdout, stderr) => {
  if (err) {
    console.error('Error listing zip:', err);
    return;
  }
  
  const files = stdout.split('\n').map(f => f.trim()).filter(Boolean);
  
  // Find folders
  const legacyDirs = ['frontend_updates', 'frontend_yeni', 'Proctor-Teslim'];
  const filesToExtract = [];
  
  legacyDirs.forEach(dir => {
    const matched = files.filter(f => f.includes(`/${dir}/`) || f.startsWith(`${dir}/`));
    console.log(`Folder ${dir}: found ${matched.length} files in zip.`);
    if (matched.length > 0) {
      // Find the prefix
      const firstFile = matched[0];
      let prefix = '';
      if (firstFile.includes(`/${dir}/`)) {
        prefix = firstFile.split(`/${dir}/`)[0] + `/${dir}`;
      } else {
        prefix = dir;
      }
      filesToExtract.push({ dir, prefix });
    }
  });
  
  if (filesToExtract.length === 0) {
    console.log('No legacy folders found in zip.');
    return;
  }
  
  // Extract each found folder
  let index = 0;
  function extractNext() {
    if (index >= filesToExtract.length) {
      console.log('\nExtraction complete!');
      inspectAndMove();
      return;
    }
    
    const item = filesToExtract[index];
    console.log(`Extracting: ${item.prefix} -> ${extractTemp}`);
    
    exec(`tar -xf "${zipPath}" "${item.prefix}" -C "${extractTemp}"`, (errEx) => {
      if (errEx) {
        console.error(`Failed to extract ${item.prefix}:`, errEx.message);
      } else {
        console.log(`Extracted ${item.dir}`);
      }
      index++;
      extractNext();
    });
  }
  
  extractNext();
});

function inspectAndMove() {
  console.log('\n--- Processing Extracted Folders ---');
  
  // Recursively find extracted folders and move them to rootPath/legacy_folders/ so we can inspect them
  const legacyDest = path.join(rootPath, 'legacy_folders');
  if (fs.existsSync(legacyDest)) {
    fs.rmSync(legacyDest, { recursive: true, force: true });
  }
  fs.mkdirSync(legacyDest, { recursive: true });
  
  function findAndMove(dir) {
    const items = fs.readdirSync(dir);
    items.forEach(item => {
      const p = path.join(dir, item);
      const stat = fs.statSync(p);
      if (stat.isDirectory()) {
        if (['frontend_updates', 'frontend_yeni', 'Proctor-Teslim'].includes(item)) {
          console.log(`Moving ${item} to ${path.join(legacyDest, item)}`);
          fs.renameSync(p, path.join(legacyDest, item));
        } else {
          findAndMove(p);
        }
      }
    });
  }
  
  findAndMove(extractTemp);
  
  // Clean up temporary extraction dir
  try {
    fs.rmSync(extractTemp, { recursive: true, force: true });
    console.log('Cleaned up temporary extraction folder.');
  } catch (e) {}
  
  console.log('\nLegacy folders are now in root/legacy_folders/ for inspection.');
}
