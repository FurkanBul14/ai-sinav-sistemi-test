const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const rootPath = path.resolve(__dirname, '..');
const scriptsPath = path.join(rootPath, 'scripts');
const zipPath = path.join(rootPath, '.zip');

console.log('--- SYSTEM REORGANIZATION AND RESTORATION ---');
console.log('Root Path:', rootPath);
console.log('Scripts Path:', scriptsPath);
console.log('Zip Path:', zipPath);

// Ensure scripts directory exists
if (!fs.existsSync(scriptsPath)) {
  fs.mkdirSync(scriptsPath, { recursive: true });
}

// ============================================================
// 1. Restore the panel/ directory from zip
// ============================================================
function restorePanel() {
  return new Promise((resolve) => {
    if (!fs.existsSync(zipPath)) {
      console.log('[Restore] Zip file not found. Skipping panel restore (it might already exist or need manual restore).');
      return resolve();
    }

    console.log('[Restore] Listing files in zip to find correct paths...');
    exec('tar -tf "' + zipPath + '"', { maxBuffer: 1024 * 1024 * 10 }, (err, stdout, stderr) => {
      if (err) {
        console.error('[Restore] Error running tar:', err.message);
        return resolve();
      }

      const files = stdout.split('\n').map(f => f.trim()).filter(Boolean);
      const panelFiles = files.filter(f => f.includes('/panel/') || f.startsWith('panel/'));

      if (panelFiles.length === 0) {
        console.log('[Restore] No panel directory found in zip.');
        return resolve();
      }

      console.log(`[Restore] Found ${panelFiles.length} panel files in zip. Extracting...`);

      // Find the unique prefix
      const firstPanelFile = panelFiles[0];
      let extractTarget = '';
      if (firstPanelFile.includes('/panel/')) {
        const parts = firstPanelFile.split('/panel/');
        extractTarget = parts[0] + '/panel';
      } else {
        extractTarget = 'panel';
      }

      console.log('[Restore] Running extraction for:', extractTarget);
      exec(`tar -xf "${zipPath}" "${extractTarget}" -C "${rootPath}"`, (extractErr, extStdout, extStderr) => {
        if (extractErr) {
          console.error('[Restore] Extraction error:', extractErr.message);
          resolve();
        } else {
          console.log('[Restore] Extraction complete!');
          postExtractionCleanup(extractTarget);
          resolve();
        }
      });
    });
  });
}

function postExtractionCleanup(extractTarget) {
  if (extractTarget && extractTarget.includes('/')) {
    const parts = extractTarget.split('/');
    const prefixDir = parts[0];
    const sourcePanel = path.join(rootPath, prefixDir, 'panel');
    const destPanel = path.join(rootPath, 'panel');

    if (fs.existsSync(sourcePanel)) {
      console.log(`[Restore] Moving extracted panel from ${sourcePanel} to ${destPanel}`);
      if (fs.existsSync(destPanel)) {
        fs.rmSync(destPanel, { recursive: true, force: true });
      }
      fs.renameSync(sourcePanel, destPanel);

      try {
        fs.rmdirSync(path.join(rootPath, prefixDir));
        console.log(`[Restore] Cleaned up temporary directory: ${prefixDir}`);
      } catch (e) {
        // Ignore
      }
    }
  }

  const indexHtml = path.join(rootPath, 'panel', 'index.html');
  if (fs.existsSync(indexHtml)) {
    console.log('[Restore] SUCCESS: panel/index.html is restored!');
  } else {
    console.log('[Restore] WARNING: panel/index.html was not found after extraction.');
  }
}

// ============================================================
// 2. Relocate and fix batch scripts
// ============================================================
const batchFiles = ['DEMO_BASLAT.bat', 'PANEL_AC.bat', 'install_all.bat'];

const parentFolderResolution = `:: Script'in bulundugu klasorun bir ust klasorunu ROOT olarak al (cunku scripts altindayiz)
set "SCRIPT_DIR=%~dp0"
if "%SCRIPT_DIR:~-1%"=="\\" set "SCRIPT_DIR=%SCRIPT_DIR:~0,-1%"
for %%I in ("%SCRIPT_DIR%") do set "ROOT=%%~dpI"
if "%ROOT:~-1%"=="\\" set "ROOT=%ROOT:~0,-1%"`;

function fixAndRelocateScripts() {
  console.log('[Scripts] Relocating and fixing scripts...');
  
  batchFiles.forEach((file) => {
    const srcFile = path.join(rootPath, file);
    const destFile = path.join(scriptsPath, file);

    // If it exists in root, read it, modify it, and write it to scripts/
    if (fs.existsSync(srcFile)) {
      console.log(`[Scripts] Processing ${file}...`);
      let content = fs.readFileSync(srcFile, 'utf8');

      if (file === 'DEMO_BASLAT.bat' || file === 'PANEL_AC.bat') {
        // Replace current ROOT directory logic
        const oldRootLogic = `:: Script'in bulundugu klasoru ROOT olarak al
set "ROOT=%~dp0"
if "%ROOT:~-1%"=="\\" set "ROOT=%ROOT:~0,-1%"`;

        const alternateOldLogic = `set "ROOT=%~dp0"
if "%ROOT:~-1%"=="\\" set "ROOT=%ROOT:~0,-1%"`;

        if (content.includes(oldRootLogic)) {
          content = content.replace(oldRootLogic, parentFolderResolution);
        } else if (content.includes(alternateOldLogic)) {
          content = content.replace(alternateOldLogic, parentFolderResolution);
        } else {
          // If not found, insert at the top after @echo off
          content = content.replace(/@echo off\r?\n/, `@echo off\r\n${parentFolderResolution}\r\n`);
        }
      } else if (file === 'install_all.bat') {
        // prepending root resolution + cd to root
        content = content.replace(/@echo off\r?\n/, `@echo off\r\n${parentFolderResolution}\r\ncd /d "%ROOT%"\r\n`);
      }

      fs.writeFileSync(destFile, content, 'utf8');
      fs.unlinkSync(srcFile);
      console.log(`[Scripts] Moved and fixed: ${file}`);
    } else {
      console.log(`[Scripts] File ${file} not found in root (might already be moved).`);
    }
  });

  // Also move reorganize.js and revert.js to scripts folder if they exist in root
  ['reorganize.js', 'revert.js', 'inspect_zip.js'].forEach(jsFile => {
    const src = path.join(rootPath, jsFile);
    const dest = path.join(scriptsPath, jsFile);
    if (fs.existsSync(src)) {
      fs.renameSync(src, dest);
      console.log(`[Scripts] Moved ${jsFile} to scripts/`);
    }
  });
}

// ============================================================
// 3. Create root batch delegation entry points
// ============================================================
function createRootDelegates() {
  console.log('[Root] Creating delegate scripts at root...');

  const demoBaslatDelegate = `@echo off
chcp 65001 >nul 2>&1
call "%~dp0scripts\\DEMO_BASLAT.bat"
`;

  const panelAcDelegate = `@echo off
chcp 65001 >nul 2>&1
call "%~dp0scripts\\PANEL_AC.bat"
`;

  fs.writeFileSync(path.join(rootPath, 'DEMO_BASLAT.bat'), demoBaslatDelegate, 'utf8');
  console.log('[Root] Created root delegate: DEMO_BASLAT.bat');

  fs.writeFileSync(path.join(rootPath, 'PANEL_AC.bat'), panelAcDelegate, 'utf8');
  console.log('[Root] Created root delegate: PANEL_AC.bat');
}

// Run flow
async function main() {
  await restorePanel();
  fixAndRelocateScripts();
  createRootDelegates();
  console.log('--- REORGANIZATION COMPLETED SUCCESSFULLY ---');
}

main().catch(err => {
  console.error('Error during execution:', err);
});
