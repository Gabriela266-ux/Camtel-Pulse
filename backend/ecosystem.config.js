module.exports = {
  apps: [{
    name: 'camtel-pulse-api',
    script: 'src/server.js',
    instances: process.env.WEB_CONCURRENCY || 'max',
    exec_mode: 'cluster',
    autorestart: true,
    max_memory_restart: '512M',
    kill_timeout: 10000,
    listen_timeout: 10000,
    env: {
      NODE_ENV: 'production'
    }
  }]
};
