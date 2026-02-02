module.exports = {
	apps: [
		{
			name: 'kchr-tourism-backend',
			script: './server.js',
			instances: 1,
			exec_mode: 'fork',
			autorestart: true,
			watch: false,
			max_memory_restart: '1G',
			env: {
				NODE_ENV: 'production'
			},
			error_file: './logs/err.log',
			out_file: './logs/out.log',
			log_file: './logs/combined.log',
			time: true,
			merge_logs: true,
			max_restarts: 10,
			min_uptime: '10s',
			restart_delay: 4000
		}
	]
}
