const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const zipPath = path.join(__dirname, '..', '.zip');
const tempDir = path.join(__dirname, '..', 'temp_extract');

console.log('Zip file path:', zipPath);

if (!fs.existsSync(zipPath)) {
  console.error('Error: .zip file not found!');
  process.exit(1);
}

if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir);
}

console.log('Searching for "authenticateUser" in zip by extracting files...');

exec(`tar -xf "${zipPath}" -C "${tempDir}"`, (err) => {
  if (err) {
    console.error('Failed to extract zip:', err);
    return;
  }
  
  console.log('Zip extracted to temp_extract. Searching files...');
  
  function walk(dir, callback) {
    fs.readdir(dir, (err, files) => {
      if (err) return callback(err);
      let pending = files.length;
      if (!pending) return callback(null, []);
      let results = [];
      files.forEach((file) => {
        file = path.join(dir, file);
        fs.stat(file, (err, stat) => {
          if (stat && stat.isDirectory()) {
            walk(file, (err, res) => {
              results = results.concat(res);
              if (!--pending) callback(null, results);
            });
          } else {
            results.push(file);
            if (!--pending) callback(null, results);
          }
        });
      });
    });
  }
  
  walk(tempDir, (err, results) => {
    if (err) {
      console.error(err);
      return;
    }
    
    console.log(`Searching in ${results.length} files...`);
    const matches = [];
    results.forEach((file) => {
      if (file.endsWith('.js') || file.endsWith('.jsx')) {
        const content = fs.readFileSync(file, 'utf8');
        if (content.includes('authenticateUser')) {
          matches.push({ file: path.relative(tempDir, file), length: content.length });
        }
      }
    });
    
    console.log('Found matches in:', matches);
    
    if (matches.length > 0) {
      matches.forEach(m => {
        console.log(`\n--- File: ${m.file} ---`);
        const content = fs.readFileSync(path.join(tempDir, m.file), 'utf8');
        console.log(content.slice(0, 1000));
        console.log('...');
      });
    }
    
    console.log('Cleaning up temp_extract...');
    fs.rmSync(tempDir, { recursive: true, force: true });
  });
});
