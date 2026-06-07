const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const rootDir = path.resolve(__dirname, '..');
const logFile = path.join(rootDir, 'rebuild_debug.log');

fs.writeFileSync(logFile, '=== REBUILD DEBUG LOG ===\n\n');

function log(msg) {
  console.log(msg);
  fs.appendFileSync(logFile, msg + '\n');
}

log('Stopping auth-service...');
exec('docker compose down auth-service', { cwd: rootDir }, (err, stdout, stderr) => {
  log('Down stdout: ' + stdout);
  log('Down stderr: ' + stderr);

  log('Building auth-service with no-cache...');
  exec('docker compose build --no-cache auth-service', { cwd: rootDir }, (err2, stdout2, stderr2) => {
    if (err2) {
      log('BUILD ERROR: ' + err2.message);
      log('BUILD STDERR: ' + stderr2);
      return;
    }
    log('Build stdout: ' + stdout2);
    log('Build stderr: ' + stderr2);

    log('Starting auth-service...');
    exec('docker compose up -d auth-service', { cwd: rootDir }, (err3, stdout3, stderr3) => {
      log('Up stdout: ' + stdout3);
      log('Up stderr: ' + stderr3);

      log('Checking status in 3 seconds...');
      setTimeout(() => {
        exec('docker compose ps auth-service', { cwd: rootDir }, (err4, stdout4, stderr4) => {
          log('Status stdout: ' + stdout4);
          log('Status stderr: ' + stderr4);
          
          exec('docker compose logs auth-service', { cwd: rootDir }, (err5, stdout5, stderr5) => {
            log('Logs stdout: ' + stdout5);
            log('Logs stderr: ' + stderr5);
            log('\n--- DEBUG RUN COMPLETED ---');
          });
        });
      }, 3000);
    });
  });
});
