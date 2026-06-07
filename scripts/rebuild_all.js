const { exec } = require('child_process');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

function runCommand(command) {
  return new Promise((resolve, reject) => {
    console.log(`Running: ${command}`);
    exec(command, { cwd: rootDir }, (err, stdout, stderr) => {
      if (err) {
        console.error(`Error: ${command}`, err);
        console.error(stderr);
        return reject(err);
      }
      console.log(stdout);
      resolve();
    });
  });
}

async function main() {
  try {
    console.log('Stopping auth-service and reporting-service...');
    await runCommand('docker compose stop auth-service reporting-service');
    
    console.log('Rebuilding auth-service with NO CACHE...');
    await runCommand('docker compose build --no-cache auth-service');
    
    console.log('Rebuilding reporting-service with NO CACHE...');
    await runCommand('docker compose build --no-cache reporting-service');
    
    console.log('Starting containers...');
    await runCommand('docker compose up -d auth-service reporting-service');
    console.log('--- REBUILD ALL COMPLETE! ---');
  } catch (error) {
    console.error('Rebuild failed:', error);
  }
}

main();
