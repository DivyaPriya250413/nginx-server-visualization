# Nginx Server visual  ·  #Buildwithvinit

An animated, beginner-friendly guide that shows **how NGINX serves a website from an AWS EC2 instance**. A visitor opens a Netflix-inspired landing page ("Streamflix"), and you watch the request travel from the browser, through the internet, the Internet Gateway and the Security Group, to NGINX, and back with the HTML, CSS, JavaScript and image files.

> Streamflix is an **original demo**. It is not affiliated with or endorsed by Netflix, uses no Netflix code, and all artwork (SVG posters and hero) is original.

No build step, no dependencies.

## The moving objects

| Packet | Meaning |
|---|---|
| ✉️ | HTTP request from the visitor |
| 📄 | Page files (HTML, CSS, JS) |
| 🖼️ | Images |
| 🔑 | SSH login |
| 📦 | Package install (dnf) |
| ✅ | Allowed / OK |
| 🚫 | Blocked port |

## The 9 steps

1. **AWS EC2** - launch an Amazon Linux 2023 instance
2. **Security Group** - allow HTTP 80 and SSH 22 from a trusted IP
3. **Connect to EC2** - SSH from your terminal
4. **Install NGINX** - `sudo dnf install nginx -y`
5. **Start NGINX** - `sudo systemctl enable --now nginx`
6. **Website files** - copy the site to `/usr/share/nginx/html/`
7. **Browser request** - visitor enters the public IP
8. **NGINX response** - files come back, the page works
9. **Troubleshooting** - port 80, Security Group, service status, public IP, `curl http://localhost`

## Run locally

```bash
cd nginx-server-visual
python3 -m http.server 8000
# open http://localhost:8000
```

## Deploy the Streamflix site on AWS EC2

1. **Launch**: EC2 > Launch instance > Amazon Linux 2023, t3.micro, create a key pair, auto-assign public IP **enabled**.
2. **Security Group inbound rules**: HTTP, TCP 80, `0.0.0.0/0`; SSH, TCP 22, `<YOUR_IP>/32` (not 0.0.0.0/0).
3. **Connect**:
   ```bash
   chmod 400 key.pem
   ssh -i key.pem ec2-user@<PUBLIC_IP>
   ```
4. **Install and start NGINX** (on the EC2 instance):
   ```bash
   sudo dnf update -y
   sudo dnf install nginx -y
   sudo systemctl enable --now nginx
   sudo systemctl status nginx
   ```
5. **Upload the site** (from your laptop, inside this project folder):
   ```bash
   scp -i key.pem -r assets/site ec2-user@<PUBLIC_IP>:/tmp/
   ```
6. **Publish it** (on the EC2 instance):
   ```bash
   sudo cp -r /tmp/site/* /usr/share/nginx/html/
   sudo chmod -R 755 /usr/share/nginx/html
   sudo nginx -t && sudo systemctl reload nginx
   ```
7. **Test**: `curl -I http://localhost` on the server, then open `http://<PUBLIC_IP>` in a browser (use **http**, not https).

### Troubleshooting checklist

| # | Check | Command / place |
|---|---|---|
| 1 | Port 80 allowed in the Security Group | EC2 > Security > Inbound rules |
| 2 | NGINX is running | `sudo systemctl status nginx` |
| 3 | Using the current public IP (it changes after stop/start) | EC2 console, or an Elastic IP |
| 4 | Server answers itself | `curl -I http://localhost` (expect 200) |
| 5 | Files are in place | `ls -l /usr/share/nginx/html` |

Also useful: `sudo ss -tlnp | grep :80`, `sudo nginx -t`, `sudo tail /var/log/nginx/error.log`. A 403 usually means wrong file permissions or no `index.html`.

## Interview-prep Q&A

- **What does NGINX do?** A web server and reverse proxy; it serves static files and forwards requests to apps.
- **Why can't I reach my site?** Walk the checklist above: Security Group, service, IP, localhost, files. (A route to the Internet Gateway and a public IP are also required.)
- **Security Group vs NACL?** Security Group: per instance, stateful. NACL: per subnet, stateless.
- **Where is the web root on Amazon Linux?** `/usr/share/nginx/html`.
- **Why restrict SSH to your IP?** Port 22 open to the world invites brute-force attacks.
- **Does the public IP stay the same?** Not after a stop/start, unless you attach an Elastic IP.

## Host the visual on GitHub Pages

1. Create a new GitHub repository and upload the contents of this folder (including the hidden `.nojekyll`).
2. Go to **Settings > Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**.
4. Select branch **main** and folder **/ (root)**, then **Save**.
5. After about a minute the site is live at `https://<username>.github.io/<repo>/`.

## Project structure

```
nginx-server-visual/
  index.html          page structure
  css/style.css       page + diagram styling (light/dark, responsive)
  js/app.js           SVG helpers, step data, caption text
  assets/site/        the Streamflix demo site you deploy to EC2
    index.html  style.css  script.js  img/*.svg
  .nojekyll
  LICENSE
  README.md
```

## Customise

- **Text:** edit the `STEPS` array and `LEGEND` at the top of `js/app.js`.
- **Diagram:** the `add('n'|'w'|'p', step, ...)` calls place nodes, wires and packets.
- **Colours:** variables at the top of `css/style.css`; diagram classes (`.n-red`, `.sg`, `.pub`, ...) in the SVG section.
- **Your own site:** replace the files in `assets/site/`.
- Respects `prefers-reduced-motion`.

#Buildwithvinit
