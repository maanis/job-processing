module.exports = {
  apps: [
    {
      name: "job-api",
      script: "./src/index.js",
      instances: 1, // or 'max' for cluster mode
      exec_mode: "fork", // or 'cluster'
      env: {
        NODE_ENV: "production",
      },
      error_file: "./logs/api-error.log",
      out_file: "./logs/api-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      // Graceful shutdown
      kill_timeout: 5000,
      listen_timeout: 10000,
      // Wait for app to be ready before considering it online
      wait_ready: true,
      // Advanced features
      min_uptime: "10s",
      max_restarts: 10,
      restart_delay: 4000,
    },
    {
      name: "job-worker",
      script: "./workers/worker.js",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
      },
      error_file: "./logs/worker-error.log",
      out_file: "./logs/worker-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      // Graceful shutdown
      kill_timeout: 5000,
      // Advanced features
      min_uptime: "10s",
      max_restarts: 10,
      restart_delay: 4000,
    },
  ],
};
