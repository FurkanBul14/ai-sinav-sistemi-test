const { exec } = require('child_process');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

console.log('Stopping auth-service container...');
exec('docker compose stop auth-service', { cwd: rootDir }, (err, stdout, stderr) => {
  if (err) console.error(err);
  console.log(stdout);

  console.log('Rebuilding auth-service with NO CACHE to ensure updated files are loaded...');
  exec('docker compose build --no-cache auth-service', { cwd: rootDir }, (err2, stdout2, stderr2) => {
    if (err2) {
      console.error('Build error:', err2);
      console.error(stderr2);
      return;
    }
    console.log(stdout2);

    console.log('Starting auth-service container...');
    exec('docker compose up -d auth-service', { cwd: rootDir }, (err3, stdout3, stderr3) => {
      if (err3) console.error(err3);
      console.log(stdout3);
      console.log('--- REBUILD COMPLETE! ---');
    });
  });
});
