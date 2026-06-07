const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const zipPath = path.join(__dirname, '..', '.zip');
const rootPath = path.join(__dirname, '..');

console.log('Zip path:', zipPath);
console.log('Root path:', rootPath);

if (!fs.existsSync(zipPath)) {
  console.error('Error: .zip file not found!');
  process.exit(1);
}

console.log('Listing files in zip to find correct paths...');
exec('tar -tf "' + zipPath + '"', { maxBuffer: 1024 * 1024 * 10 }, (err, stdout, stderr) => {
  if (err) {
    console.error('Error running tar:', err);
    console.error('Stderr:', stderr);
    return;
  }
  
  const files = stdout.split('\n').map(f => f.trim()).filter(Boolean);
  
  // Find all files belonging to panel/
  // The zip might have a prefix like "AI_Mulakat_Sistemi-main-yeni/"
  const panelFiles = files.filter(f => f.includes('/panel/') || f.startsWith('panel/'));
  
  if (panelFiles.length === 0) {
    console.log('No panel directory found in zip.');
    return;
  }
  
  console.log(`Found ${panelFiles.length} panel files in zip.`);
  
  // Extract panel files
  console.log('Extracting panel files...');
  
  // We can extract all panel files by running tar -xf with each file, 
  // or by running tar -xf zipPath "prefix/panel"
  // Let's find the unique prefix
  const firstPanelFile = panelFiles[0];
  let extractTarget = '';
  if (firstPanelFile.includes('/panel/')) {
    const parts = firstPanelFile.split('/panel/');
    extractTarget = parts[0] + '/panel';
  } else {
    extractTarget = 'panel';
  }
  
  console.log('Running extraction for:', extractTarget);
  exec(`tar -xf "${zipPath}" "${extractTarget}" -C "${rootPath}"`, (extractErr, extStdout, extStderr) => {
    if (extractErr) {
      console.error('Extraction error:', extractErr);
      console.error('Stderr:', extStderr);
      
      // Fallback: extract individual files
      console.log('Attempting fallback: extracting files one by one...');
      extractIndividualFiles(panelFiles);
    } else {
      console.log('Extraction complete!');
      postExtractionCleanup(extractTarget);
    }
  });
});

function extractIndividualFiles(fileList) {
  let index = 0;
  function next() {
    if (index >= fileList.length) {
      console.log('Individual extraction complete!');
      postExtractionCleanup();
      return;
    }
    const file = fileList[index];
    exec(`tar -xf "${zipPath}" "${file}" -C "${rootPath}"`, (err) => {
      if (err) console.error(`Failed to extract ${file}:`, err);
      index++;
      next();
    });
  }
  next();
}

function postExtractionCleanup(extractTarget) {
  // If the extracted folder is nested inside a subfolder, move it to the root
  if (extractTarget && extractTarget.includes('/')) {
    const parts = extractTarget.split('/');
    const prefixDir = parts[0];
    const sourcePanel = path.join(rootPath, prefixDir, 'panel');
    const destPanel = path.join(rootPath, 'panel');
    
    if (fs.existsSync(sourcePanel)) {
      console.log(`Moving extracted panel from ${sourcePanel} to ${destPanel}`);
      if (fs.existsSync(destPanel)) {
        fs.rmSync(destPanel, { recursive: true, force: true });
      }
      fs.renameSync(sourcePanel, destPanel);
      
      // Clean up the temporary prefix dir if it's empty
      try {
        fs.rmdirSync(path.join(rootPath, prefixDir));
        console.log(`Cleaned up temporary directory: ${prefixDir}`);
      } catch (e) {
        // Not empty or couldn't delete, ignore
      }
    }
  }
  
  // Verify
  const indexHtml = path.join(rootPath, 'panel', 'index.html');
  if (fs.existsSync(indexHtml)) {
    console.log('SUCCESS: panel/index.html is restored!');
  } else {
    console.log('WARNING: panel/index.html was not found after extraction.');
  }
}
