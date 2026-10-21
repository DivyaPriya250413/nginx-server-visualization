(function () {
  'use strict';
  var REDUCE = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  /* ---------- step text (edit me) ---------- */
  var STEPS = [
    { t: 'AWS EC2', sub: 'Launch Amazon Linux 2023',
      plain: 'You rent a small computer from Amazon, like renting a shop in a big mall. It sits in a public lobby so customers can find it, and it gets a street address (a public IP).',
      tech: 'Amazon EC2 instance (t3.micro, Amazon Linux 2023) in a public subnet of a VPC, with a public IPv4 address and a key pair.',
      watch: 'The orange box is your EC2 server. The green pulse means it is running.',
      cmd: 'Console > EC2 > Launch instance\nAMI: Amazon Linux 2023 | Type: t3.micro\nKey pair: create or pick one | Auto-assign public IP: Enable' },
    { t: 'Security Group', sub: 'Open port 80 and 22',
      plain: 'A door guard stands at your shop. Customers may come in through the shop door (port 80). Only you may use the staff door (port 22), and only from your own address. Every other door stays locked.',
      tech: 'Security Group inbound rules: HTTP TCP 80 from 0.0.0.0/0, SSH TCP 22 from your IP /32. Traffic enters the VPC through the Internet Gateway.',
      watch: 'A check mark passes on port 80, a key passes on port 22, and the no-entry sign is stopped at the red line.',
      cmd: 'Inbound rules\nHTTP | TCP | 80 | 0.0.0.0/0\nSSH  | TCP | 22 | <YOUR_IP>/32' },
    { t: 'Connect to EC2', sub: 'SSH from your terminal',
      plain: 'You walk in through the staff door with your private key, like a key card. Now you can give the shop computer instructions from your own laptop.',
      tech: 'SSH (Secure Shell) on TCP 22 using the .pem private key, user ec2-user on Amazon Linux.',
      watch: 'A key travels from your laptop, over the internet and through the main gate into the terminal window.',
      cmd: 'chmod 400 key.pem\nssh -i key.pem ec2-user@<PUBLIC_IP>' },
    { t: 'Install NGINX', sub: 'sudo dnf install nginx -y',
      plain: 'NGINX is a helpful shop assistant who hands customers whatever page they ask for. dnf is the app store of the server, and it delivers the assistant to the shop.',
      tech: 'dnf is the package manager of Amazon Linux 2023. It downloads and installs the nginx package and its config in /etc/nginx.',
      watch: 'A package slides from the terminal into the NGINX box. The box says installed, but not running yet.',
      cmd: 'sudo dnf install nginx -y' },
    { t: 'Start NGINX', sub: 'systemctl enable --now',
      plain: 'The assistant clocks in. "enable" means they come back to work every time the shop reopens (reboot). "now" means start working right away.',
      tech: 'systemd service nginx.service, listening on TCP port 80. The status should read active (running).',
      watch: 'The NGINX box turns green and says active (running), listening on port 80.',
      cmd: 'sudo systemctl enable --now nginx\nsudo systemctl status nginx' },
    { t: 'Website files', sub: '/usr/share/nginx/html',
      plain: 'The shop shelf is a folder. NGINX hands out only what is on this shelf. We put the front page (HTML), the paint and style (CSS), the little tricks (JavaScript) and the pictures there.',
      tech: 'Default document root on Amazon Linux: /usr/share/nginx/html. NGINX serves index.html as the default page.',
      watch: 'Files slide from the terminal into the html folder. The preview below is still blank.',
      cmd: 'scp -i key.pem -r assets/site ec2-user@<PUBLIC_IP>:/tmp/\nsudo cp -r /tmp/site/* /usr/share/nginx/html/\nsudo chmod -R 755 /usr/share/nginx/html' },
    { t: 'Browser request', sub: 'Visitor types the IP',
      plain: 'A visitor types your shop address into the browser. The browser writes a short note, "please give me the front page", and sends it down the road to your shop.',
      tech: 'HTTP GET / over TCP port 80. Path: browser, Internet, Internet Gateway, Security Group (allows 80), EC2, NGINX.',
      watch: 'An envelope leaves the visitor, crosses the internet and the main gate, passes the door guard and reaches NGINX.',
      cmd: 'Browser: http://<PUBLIC_IP>\nGET / HTTP/1.1\nHost: <PUBLIC_IP>' },
    { t: 'NGINX response', sub: 'The page appears',
      plain: 'The assistant looks on the shelf, grabs index.html, the styles, the scripts and the pictures, and hands them back. The browser puts them together into the page you see.',
      tech: 'HTTP/1.1 200 OK with index.html. The browser then requests style.css, script.js and images, and NGINX serves each from the document root.',
      watch: 'Files travel from the shelf to NGINX, then back the same road to the visitor. The preview below comes alive.',
      cmd: 'curl -I http://<PUBLIC_IP>\nHTTP/1.1 200 OK\nServer: nginx' },
    { t: 'Troubleshooting', sub: 'Five quick checks',
      plain: 'If the page does not open, check the shop like a detective: 1) Is the shop door open? 2) Is the assistant at work? 3) Did the visitor use the right address? 4) Does the shop answer from inside? 5) Is the page on the shelf?',
      tech: '1) Security Group allows 80. 2) systemctl status nginx is active. 3) Current public IP (it changes if the instance is stopped and started). 4) curl http://localhost returns 200. 5) index.html exists in the document root.',
      watch: 'Numbered red badges mark the five places to check: the port 80 rule, the service, the public IP, the curl test and the files.',
      cmd: 'sudo ss -tlnp | grep :80\nsudo systemctl status nginx\ncurl -I http://localhost\nsudo nginx -t\nls -l /usr/share/nginx/html' }
  ];
  var LEGEND = [['\u2709\uFE0F', 'HTTP request'], ['\uD83D\uDCC4', 'Page files'], ['\uD83D\uDDBC\uFE0F', 'Images'], ['\uD83D\uDD11', 'SSH login'], ['\uD83D\uDCE6', 'Package install'], ['\u2705', 'Allowed / OK'], ['\uD83D\uDEAB', 'Blocked port']];
  var VEIL = ['Nothing to show yet. There is no website on the server.', 'Nothing to show yet. The door guard rules are set, but no website exists.', 'You are inside the server, but there is no website yet.', 'NGINX is installed, but it is not running yet.', 'NGINX is running and showing its default page. Our files are not there yet.', 'The files are on the shelf, but nobody has asked for them yet.', 'Loading... the request is travelling to NGINX.'];

  /* ---------- SVG helpers ---------- */
  var L = { w: {}, n: {}, p: {} };
  function add(layer, s, h) { L[layer][s] = (L[layer][s] || '') + h; }
  function R(x, y, w, h, c, rx) { return '<rect class="' + c + '" x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="' + (rx || 10) + '"/>'; }
  function T(x, y, s, c, a) { return '<text class="' + (c || 't1') + '" x="' + x + '" y="' + y + '" text-anchor="' + (a || 'middle') + '">' + s + '</text>'; }
  function M(x, y, s, c) { return T(x, y, s, 'mono ' + (c || ''), 'start'); }
  function W(id, d, c) { return '<path id="' + id + '" class="wire ' + c + '" d="' + d + '"/>'; }
  function box(x, y, w, h, title, sub, c) { return R(x, y, w, h, 'node ' + c) + T(x + w / 2, y + 18, title, 't1') + (sub ? T(x + w / 2, y + 33, sub, 't2') : ''); }
  function tag(x, y, w, label) { return R(x, y, w, 16, 'tag', 4) + T(x + w / 2, y + 12, label, 'tg'); }
  function badge(x, y, n) { return '<circle cx="' + x + '" cy="' + y + '" r="9" fill="#e50914" stroke="#fff" stroke-width="1"/>' + T(x, y + 4, n, 'bdg'); }
  function pulse(x, y, col) {
    var ring = REDUCE ? '' : '<animate attributeName="r" values="4;11;4" dur="1.8s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.9;0;0.9" dur="1.8s" repeatCount="indefinite"/>';
    return '<circle cx="' + x + '" cy="' + y + '" r="4" fill="' + col + '"/><circle cx="' + x + '" cy="' + y + '" r="4" fill="none" stroke="' + col + '" stroke-width="1.5">' + ring + '</circle>';
  }
  function pkt(path, emoji, dur, a, b, begin) {
    a = a || 0; if (b === undefined) b = 1; begin = begin || 0;
    var win = !REDUCE && (a > 0 || b < 1), e = 0.03;
    var o = '<g><text class="emo" text-anchor="middle" dominant-baseline="central">' + emoji + '</text>';
    o += '<animateMotion dur="' + dur + 's" begin="' + begin + 's" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;' + a + ';' + b + ';1"><mpath href="#' + path + '"/></animateMotion>';
    if (win) o += '<animate attributeName="opacity" dur="' + dur + 's" begin="' + begin + 's" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;' + a + ';' + (a + e) + ';' + (b - e) + ';' + b + ';1"/>';
    return o + '</g>';
  }

  /* ---------- build the diagram ---------- */
  var EMAIL = '\u2709\uFE0F', DOC = '\uD83D\uDCC4', IMG = '\uD83D\uDDBC\uFE0F', KEY = '\uD83D\uDD11', PKG = '\uD83D\uDCE6', OK = '\u2705', NO = '\uD83D\uDEAB';
  // 1 EC2
  add('n', 1, R(360, 15, 725, 400, 'cloud', 14) + T(376, 36, 'AWS Cloud \u00B7 Region', 'lbl', 'start'));
  add('n', 1, R(380, 45, 690, 355, 'vpc', 14) + T(396, 62, 'VPC \u00B7 10.0.0.0/16', 'lbl', 'start'));
  add('n', 1, R(395, 70, 665, 315, 'pub', 12) + T(410, 90, 'Public subnet', 'lbl', 'start'));
  add('n', 1, R(560, 118, 475, 245, 'ec2', 12) + T(575, 138, 'EC2 instance \u00B7 Amazon Linux 2023', 'lbl', 'start') + T(1000, 138, 't3.micro', 't2', 'end') + T(575, 154, 'Public IPv4: 54.210.x.x', 't2', 'start') + pulse(1020, 134, '#4ade80'));
  // 2 security group + gate
  add('n', 2, R(545, 92, 505, 285, 'sg', 12) + T(560, 108, 'Security Group (door guard)', 'lbl red', 'start') + tag(750, 97, 150, 'Allow 80 \u00B7 HTTP \u00B7 anywhere') + tag(905, 97, 140, 'Allow 22 \u00B7 SSH \u00B7 my IP'));
  add('n', 2, R(345, 150, 60, 120, 'node n-blue') + T(375, 168, 'Internet', 't1') + T(375, 181, 'Gateway', 't1') + T(375, 194, '(main gate)', 't3'));
  add('w', 2, W('w_p22', 'M425,218 H545', 'w-o') + W('w_p80', 'M425,312 H545', 'w-n') + W('w_pbad', 'M425,265 H535', 'w-r'));
  add('n', 2, T(485, 284, 'other ports: blocked', 't3 red'));
  add('p', 2, pkt('w_p22', KEY, 3) + pkt('w_p80', OK, 3, 0, 1, 1) + pkt('w_pbad', NO, 3, 0, 0.7));
  // 3 SSH
  add('n', 3, box(20, 30, 150, 100, 'Your laptop', 'terminal (SSH)', 'n-grey') + T(95, 108, '$ ssh -i key.pem', 'mono t3'.replace('t3', '')));
  add('n', 3, box(200, 170, 120, 80, 'The Internet', 'public roads', 'n-blue'));
  add('n', 3, R(575, 165, 245, 88, 'term', 6) + M(585, 184, '$ ssh -i key.pem ec2-user@EC2-IP'));
  add('w', 3, W('w_s1', 'M95,130 V218 H200', 'w-n') + W('w_s1b', 'M320,218 H345', 'w-n') + W('w_s2', 'M405,218 H575', 'w-n'));
  add('p', 3, pkt('w_s1', KEY, 5, 0, 0.3) + pkt('w_s2', KEY, 5, 0.45, 0.95));
  // 4 install
  add('w', 4, W('w_inst', 'M645,253 V290', 'w-o'));
  add('n', 4, box(575, 290, 140, 58, 'NGINX', 'installed', 'n-grey') + M(585, 199, '$ sudo dnf install nginx -y'));
  add('p', 4, pkt('w_inst', PKG, 2.5));
  // 5 start
  add('n', 5, box(575, 290, 140, 58, 'NGINX', 'active (running)', 'n-green') + T(645, 340, 'listening on :80', 't3') + pulse(703, 302, '#4ade80'));
  add('n', 5, M(585, 214, '$ sudo systemctl enable --now nginx') + M(585, 229, 'Active: active (running)', 'grn'));
  // 6 files
  add('n', 6, R(905, 165, 120, 185, 'node n-teal') + T(965, 182, '/usr/share/nginx/html', 't3'));
  [['index.html', 195], ['style.css', 225], ['script.js', 255], ['images/', 285]].forEach(function (f) {
    add('n', 6, R(915, f[1], 100, 24, 'node n-gold', 6) + T(965, f[1] + 16, f[0], 't1'));
  });
  add('w', 6, W('w_cp', 'M820,205 H905', 'w-o') + W('w_rd', 'M905,319 H715', 'w-o'));
  add('p', 6, pkt('w_cp', DOC, 2.4) + pkt('w_cp', DOC, 2.4, 0, 1, 0.8) + pkt('w_cp', IMG, 2.4, 0, 1, 1.6));
  // 7 browser request
  add('n', 7, R(20, 285, 150, 110, 'node n-blue') + T(95, 303, 'Visitor browser', 't1') + R(30, 316, 130, 22, 'node n-grey', 6) + T(95, 331, 'http://54.210.x.x', 'mono') + T(95, 360, 'presses Enter', 't2') + T(95, 376, 'GET / HTTP/1.1', 't3'));
  add('w', 7, W('w_hA', 'M170,340 H260 V250', 'w-b') + W('w_hB', 'M385,270 V312 H575', 'w-b'));
  add('p', 7, pkt('w_hA', EMAIL, 5, 0, 0.28) + pkt('w_hB', EMAIL, 5, 0.45, 0.9));
  // 8 response
  add('w', 8, W('w_rB', 'M575,334 H290 V250', 'w-n') + W('w_rA', 'M230,250 V300 H170', 'w-n'));
  add('n', 8, T(430, 352, '200 OK', 't3 grn'));
  add('p', 8, pkt('w_rd', DOC, 6, 0, 0.25) + pkt('w_rB', DOC, 6, 0.3, 0.7) + pkt('w_rA', DOC, 6, 0.72, 0.98) + pkt('w_rd', IMG, 6, 0, 0.25, 3) + pkt('w_rB', IMG, 6, 0.3, 0.7, 3) + pkt('w_rA', IMG, 6, 0.72, 0.98, 3));
  // 9 troubleshooting
  add('n', 9, M(585, 244, '$ curl -I http://localhost'));
  add('n', 9, badge(545, 100, 1) + badge(718, 292, 2) + badge(700, 150, 3) + badge(832, 244, 4) + badge(1024, 168, 5));
  add('p', 9, pkt('w_inst', OK, 3));

  function layer(k) {
    var o = '';
    for (var s = 1; s <= 9; s++) o += '<g class="st" data-s="' + s + '">' + (L[k][s] || '') + '</g>';
    return o;
  }
  var defs = '<defs><pattern id="dots" width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1" fill="#5a2a30" opacity=".5"/></pattern>' +
    '<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0a0a10"/><stop offset="1" stop-color="#1a0a10"/></linearGradient></defs>';
  var stage = document.getElementById('stage');
  stage.innerHTML = defs + '<rect width="1100" height="430" fill="url(#sky)"/><rect width="1100" height="430" fill="url(#dots)"/>' + layer('w') + layer('n') + layer('p');
  if (REDUCE && stage.pauseAnimations) stage.pauseAnimations();

  /* ---------- UI ---------- */
  var nav = document.getElementById('steps'), btns = [], cur = 0, timer = null;
  var veil = document.getElementById('veil'), veilMsg = document.getElementById('veil-msg'), frame = document.getElementById('site');
  STEPS.forEach(function (s, i) {
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'step-btn';
    b.innerHTML = '<span class="num">' + (i + 1) + '</span><span><b>' + s.t + '</b><small>' + s.sub + '</small></span>';
    b.addEventListener('click', function () { stopAuto(); go(i + 1); });
    nav.appendChild(b); btns.push(b);
  });
  document.getElementById('legend').innerHTML = LEGEND.map(function (l) { return '<span><i>' + l[0] + '</i>' + l[1] + '</span>'; }).join('');

  function go(n) {
    var prev = cur; cur = n;
    stage.querySelectorAll('.st').forEach(function (g) {
      var s = +g.getAttribute('data-s');
      g.classList.toggle('on', s <= n);
      g.classList.remove('new');
      if (s === n && n > prev) { void g.getBoundingClientRect(); g.classList.add('new'); }
    });
    btns.forEach(function (b, i) { b.classList.toggle('active', i === n - 1); if (i === n - 1) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current'); });
    var s = STEPS[n - 1];
    document.getElementById('c-title').textContent = n + '. ' + s.t;
    document.getElementById('c-plain').textContent = s.plain;
    document.getElementById('c-tech').textContent = s.tech;
    document.getElementById('c-watch').textContent = s.watch;
    document.getElementById('c-cmd').textContent = s.cmd;
    if (n >= 8) {
      if (!frame.getAttribute('src')) frame.setAttribute('src', 'assets/site/index.html');
      veil.classList.add('gone');
    } else {
      veil.classList.remove('gone');
      veil.classList.toggle('load', n === 7);
      veilMsg.textContent = VEIL[n - 1];
    }
  }
  var autoBtn = document.getElementById('auto');
  function stopAuto() { if (timer) { clearInterval(timer); timer = null; } autoBtn.textContent = 'Auto-play'; }
  autoBtn.addEventListener('click', function () {
    if (timer) { stopAuto(); return; }
    autoBtn.textContent = 'Pause';
    if (cur >= 9) go(1);
    timer = setInterval(function () { if (cur >= 9) stopAuto(); else go(cur + 1); }, 5000);
  });
  document.getElementById('reset').addEventListener('click', function () { stopAuto(); go(1); });

  var themeBtn = document.getElementById('theme'), root = document.documentElement;
  function setTheme(t) { root.setAttribute('data-theme', t); themeBtn.textContent = t === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'; }
  var saved = null;
  try { saved = localStorage.getItem('nsv-theme'); } catch (e) { saved = null; }
  setTheme(saved || ((window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) ? 'light' : 'dark'));
  themeBtn.addEventListener('click', function () {
    var t = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    setTheme(t);
    try { localStorage.setItem('nsv-theme', t); } catch (e) { /* ignore */ }
  });
  go(1);
})();
