const { exec } = require('child_process');
const path = require('path');

console.log('=== RUNNING CODEBASE SEARCH ===');
exec('node scripts/search_codebase.js', (err, stdout, stderr) => {
  if (err) console.error(err);
  console.log(stdout);
  
  console.log('\n=== RUNNING ZIP SEARCH ===');
  exec('node scripts/search_zip.js', (err2, stdout2, stderr2) => {
    if (err2) console.error(err2);
    console.log(stdout2);
  });
});
