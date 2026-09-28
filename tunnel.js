const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Starting localtunnel...');
const tunnel = exec('npx -y localtunnel --port 5000');

tunnel.stdout.on('data', (data) => {
  process.stdout.write(data);
  if (data.includes('your url is:')) {
    const match = data.match(/https:\/\/[^\s]+/);
    if (match) {
      const url = match[0];
      const envPath = path.join(__dirname, 'frontend', '.env.local');
      fs.writeFileSync(envPath, `VITE_TUNNEL_URL=${url}\n`);
      console.log(`[Success] Auto-propagated URL to frontend/.env.local!`);
    }
  }
});

tunnel.stderr.on('data', (data) => {
  process.stderr.write(data);
});
