const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

function walk(dir, done) {
  let results = [];
  fs.readdir(dir, (err, list) => {
    if (err) return done(err);
    let pending = list.length;
    if (!pending) return done(null, results);
    list.forEach((file) => {
      const filePath = path.join(dir, file);
      if (file === 'node_modules' || file === '.git' || file === 'dist') {
        if (!--pending) done(null, results);
        return;
      }
      fs.stat(filePath, (err, stat) => {
        if (stat && stat.isDirectory()) {
          walk(filePath, (err, res) => {
            results = results.concat(res);
            if (!--pending) done(null, results);
          });
        } else {
          results.push(filePath);
          if (!--pending) done(null, results);
        }
      });
    });
  });
}

console.log('Searching for "authenticateUser" in the workspace...');
walk(rootDir, (err, files) => {
  if (err) {
    console.error('Error walking directory:', err);
    return;
  }

  const matches = [];
  files.forEach((file) => {
    if (file.endsWith('.js') || file.endsWith('.jsx')) {
      const content = fs.readFileSync(file, 'utf8');
      if (content.includes('authenticateUser')) {
        matches.push(file);
      }
    }
  });

  console.log(`\nFound matches in ${matches.length} files:`);
  matches.forEach(m => console.log('- ' + path.relative(rootDir, m)));
});
