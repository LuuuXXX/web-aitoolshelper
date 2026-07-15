module.exports = {
  apps: [
    {
      name: 'aitoolshelper',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3000',
      cwd: '/root/luuux',
      env: {
        NODE_ENV: 'production',
      },
      instances: 1,
      autorestart: true,
      max_memory_restart: '512M',
      error_file: '/root/luuux/pm2-logs/error.log',
      out_file: '/root/luuux/pm2-logs/out.log',
      log_file: '/root/luuux/pm2-logs/combined.log',
      time: true,
    },
  ],
}
