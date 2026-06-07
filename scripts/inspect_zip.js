const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const zipPath = path.join(__dirname, '..', '.zip');
console.log('Zip file path:', zipPath);
console.log('Exists:', fs.existsSync(zipPath));

exec('tar -tf "' + zipPath + '"', { maxBuffer: 1024 * 1024 * 10 }, (err, stdout, stderr) => {
  if (err) {
    console.error('Error running tar:', err);
    console.error('Stderr:', stderr);
    return;
  }
  
  const files = stdout.split('\n');
  console.log('Total files in zip:', files.length);
  
  console.log('\n--- Searching for "panel/" ---');
  const panelFiles = files.filter(f => f.includes('panel/'));
  console.log('Found panel files:', panelFiles.length);
  panelFiles.slice(0, 50).forEach(f => console.log(f));
  if (panelFiles.length > 50) console.log('... and ' + (panelFiles.length - 50) + ' more');
  
  console.log('\n--- Searching for "sdk/" ---');
  const sdkFiles = files.filter(f => f.includes('sdk/'));
  console.log('Found sdk files:', sdkFiles.length);
  sdkFiles.slice(0, 20).forEach(f => console.log(f));
  
  console.log('\n--- Searching for "frontend/" ---');
  const frontendFiles = files.filter(f => f.includes('frontend/'));
  console.log('Found frontend files:', frontendFiles.length);
});
