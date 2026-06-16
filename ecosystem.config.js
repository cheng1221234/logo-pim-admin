module.exports = {
  apps: [{
    name: 'logo-pim-admin',
    script: 'server.js',
    cwd: __dirname,
    env: {
      NODE_ENV: 'production',
      PORT: 3005
    },
    instances: 1,
    exec_mode: 'fork',
    max_memory_restart: '300M',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    error_file: './logs/error.log',
    out_file: './logs/out.log',
    merge_logs: true,
    autorestart: true,
    watch: false,
    max_restarts: 10,
    restart_delay: 3000
  }]
};
