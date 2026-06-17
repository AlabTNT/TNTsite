import re

with open("/etc/nginx/nginx.conf", "r") as f:
    content = f.read()

old_loc = """		location / {
			root /var/www/alabtnt_site;
			index index.html;
		}"""

new_loc = """		location /api/ {
			proxy_pass http://127.0.0.1:8765/api/;
			proxy_set_header Host $host;
			proxy_set_header X-Real-IP $remote_addr;
			proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
			proxy_set_header X-Forwarded-Proto $scheme;
		}
		location / {
			proxy_pass http://127.0.0.1:3000;
			proxy_set_header Host $host;
			proxy_set_header X-Real-IP $remote_addr;
			proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
			proxy_set_header X-Forwarded-Proto $scheme;
		}"""

if old_loc in content:
    content = content.replace(old_loc, new_loc)
    with open("/etc/nginx/nginx.conf", "w") as f:
        f.write(content)
    print("Patched successfully")
else:
    print("Could not find the block. Here is what exists around location /:")
    print(content[content.find("location / {")-50:content.find("location / {")+200])
