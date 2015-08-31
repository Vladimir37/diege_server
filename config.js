function config(domain, port) {
	return "server {\n	listen 80;\n\n	server_name " + domain + ".diege.ru;\n	client_max_body_size 512m;\n\n	location / {\n		proxy_pass http://localhost:" + port + ";\n		proxy_http_version 1.1;\n		proxy_set_header Upgrade $http_upgrade;\n		proxy_set_header Connection 'upgrade';\n		proxy_set_header Host $host;\n		proxy_cache_bypass $http_upgrade;\n	}\n}"
};

exports.generate = config;