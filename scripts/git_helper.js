const { exec } = require('child_process');
const path = require('path');

const authServicePath = path.resolve(__dirname, '..', 'services', 'auth-service');
console.log('Running git log in:', authServicePath);

exec('git log -p -n 3 src/services/userService.js', { cwd: authServicePath }, (err, stdout, stderr) => {
  if (err) {
    console.error('Git error:', err);
    console.error('Stderr:', stderr);
    return;
  }
  console.log('--- GIT LOG ---');
  console.log(stdout);
});
