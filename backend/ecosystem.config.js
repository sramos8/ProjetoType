// ecosystem.config.js — Configuração do PM2
// Uso: pm2 start ecosystem.config.js
//      pm2 reload ecosystem.config.js   (zero-downtime)
//      pm2 stop ecosystem.config.js

module.exports = {
  apps: [
    {
      name: 'padaria-api',
      script: './dist/server.js',
      cwd: '/home/ubuntu/app/backend',

      // Instâncias — 1 para t2.micro (1 vCPU)
      instances: 1,
      exec_mode: 'fork',

      // Variáveis de ambiente (fallback — prefira o .env)
      env: {
        NODE_ENV: 'production',
        PORT: 3333,
      },

      // Reiniciar se usar mais de 400MB RAM
      max_memory_restart: '400M',

      // Logs
      out_file:   '/home/ubuntu/logs/padaria-out.log',
      error_file: '/home/ubuntu/logs/padaria-err.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',

      // Reiniciar em crashes, mas não em loop
      autorestart: true,
      max_restarts: 10,
      restart_delay: 4000,

      // Aguardar app ficar pronto antes de considerar online
      wait_ready: true,
      listen_timeout: 10000,
    },
  ],
};
