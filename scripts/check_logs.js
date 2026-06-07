const { exec } = require('child_process');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

console.log('=== DOCKER CONTAINER STATUS ===');
exec('docker ps', { cwd: rootDir }, (err, stdout, stderr) => {
  if (err) {
    console.error('Error running docker ps:', err);
    console.error(stderr);
  } else {
    console.log(stdout);
  }
  
  console.log('\n=== DOCKER COMPOSE SERVICES ===');
  exec('docker compose -f docker-compose.b2b.yml ps', { cwd: rootDir }, (err2, stdout2, stderr2) => {
    if (err2) {
      console.error('Error running docker compose ps:', err2);
      console.error(stderr2);
    } else {
      console.log(stdout2);
    }
    
    console.log('\n=== AUTH SERVICE LOGS (Last 50 lines) ===');
    exec('docker compose -f docker-compose.b2b.yml logs --tail=50 auth-service', { cwd: rootDir }, (err3, stdout3, stderr3) => {
      if (err3) {
        console.error('Error running docker compose logs:', err3);
        console.error(stderr3);
      } else {
        console.log(stdout3);
      }
      
      console.log('\n=== GATEWAY SERVICE LOGS (Last 30 lines) ===');
      exec('docker compose -f docker-compose.b2b.yml logs --tail=30 gateway-service', { cwd: rootDir }, (err4, stdout4, stderr4) => {
        if (err4) {
          console.error('Error running docker compose logs:', err4);
          console.error(stderr4);
        } else {
          console.log(stdout4);
        }
      });
    });
  });
});
