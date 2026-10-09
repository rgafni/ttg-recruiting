/* TTG Recruiting app (v2). Real mode: talks to the private Apps Script API with the owner's link token
   (boot.js already moved ?k= into localStorage and stripped it from the URL).
   Demo mode (?demo=1): synthetic data, this browser only. Nothing here sends email, texts or calls:
   it prepares text the owner posts or sends personally, or queues a request the assistant turns into a Gmail DRAFT. */
(function () {
  var T = window.TTGR_TEXT, C = window.TTGR_CONFIG || {};
  var KEY = 'ttgr.k', DKEY = 'ttgr.demo';
  var DEMO = new URLSearchParams(location.search).get('demo') === '1';
  var token = null; try { token = localStorage.getItem(KEY); } catch (e) {}
  var S = null, app = document.getElementById('app'), openMore = false, showUnfit = {}, prefill = null, installEvt = null;

  /* ---------- icons (inline SVG, no external assets) ---------- */
  var P = {
    plus: 'M12 5v14M5 12h14', chev: 'M9 6l6 6-6 6', back: 'M15 6l-6 6 6 6', check: 'M20 6L9 17l-5-5', x: 'M18 6L6 18M6 6l12 12', q: 'M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01',
    phone: 'M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z',
    msg: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z', mail: 'M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM22 6l-10 7L2 6',
    cal: 'M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z',
    users: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8',
    send: 'M22 2L11 13M22 2l-7 20-4-9-9-4z', gift: 'M20 12v10H4V12M2 7h20v5H2zM12 22V7M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z',
    pen: 'M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z', copy: 'M20 9h-9a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2zM5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1',
    ext: 'M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3', dl: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3',
    clock: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2', alert: 'M12 9v4M12 17h.01M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z',
    file: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6', shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
    print: 'M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z', share: 'M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13'
  };
  function ic(n, cls) { return '<svg class="i' + (cls ? ' ' + cls : '') + '" viewBox="0 0 24 24" aria-hidden="true"><path d="' + P[n] + '"/></svg>'; }

  /* ---------- helpers ---------- */
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function first(n) { return String(n || '').split(' ')[0]; }
  function initials(n) { var p = String(n || '?').trim().split(/\s+/); return ((p[0] || '')[0] || '') + ((p[1] || '')[0] || ''); }
  function J(s, d) { try { return s ? (typeof s === 'string' ? JSON.parse(s) : s) : d; } catch (e) { return d; } }
  function pd(s) { if (!s) return null; var x = new Date(String(s).length <= 10 ? s + 'T12:00' : s); return isNaN(x) ? null : x; }
  function when(s) { var x = pd(s); if (!x) return ''; var t = new Date(), y = new Date(t); y.setDate(t.getDate() + 1);
    var day = x.toDateString() === t.toDateString() ? 'Today' : x.toDateString() === y.toDateString() ? 'Tomorrow' : x.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    return day + ' ' + x.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }).replace(':00', '').replace(' ', '').toLowerCase(); }
  function daysSince(s) { var x = pd(s); return x ? Math.floor((Date.now() - x) / 864e5) : 0; }
  function needBy(code) { return S.needs.filter(function (n) { return n.code === code; })[0]; }
  function needId(id) { return S.needs.filter(function (n) { return n.id === id; })[0]; }
  function personBy(id) { return S.people.filter(function (p) { return p.id === id; })[0]; }
  function ivFor(pid) { var a = S.interviews.filter(function (i) { return i.person_id === pid; }); return a[a.length - 1]; }
  function queued(kind, pid) { return S.queue.filter(function (x) { return x.kind === kind && x.person_id === pid && x.status !== 'done'; })[0]; }
  function line() { return S.line || '[TTG line]'; }
  function digits(s) { return String(s || '').replace(/[^\d+]/g, ''); }
  function toast(m) { var t = document.getElementById('toast'); t.textContent = m; t.className = 'toast show'; clearTimeout(toast.t); toast.t = setTimeout(function () { t.className = 'toast'; }, 2600); }
  function copy(text) {
    (navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject()).then(function () { toast('Copied. Paste it on the site.'); }, function () {
      var a = document.createElement('textarea'); a.value = text; document.body.appendChild(a); a.select(); try { document.execCommand('copy'); toast('Copied'); } catch (e) {} a.remove(); });
  }
  function qrSvg(text, cell) { var qr = qrcode(0, 'M'); qr.addData(text); qr.make(); return qr.createSvgTag(cell || 4, 8); }
  function qrText(n) { var d = digits(S.line); return d ? 'SMSTO:' + d + ':' + n.code : n.code; }
  function needLabel(n) { return n.role + (n.student ? ' for ' + n.student : ''); }
  var ROLE_CHIPS = [['RBT', 'RBT'], ['BCBA', 'BCBA'], ['SETSS', 'SETSS'], ['Speech', 'SLP'], ['OT/PT', 'OT'], ['Para', 'Para']];

  /* ---------- data layer ---------- */
  function call(action, args) {
    if (DEMO) return Promise.resolve(demoAct(action, args || []));
    return fetch(C.API_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, redirect: 'follow', referrerPolicy: 'no-referrer', cache: 'no-store', credentials: 'omit',
      body: JSON.stringify({ k: token, action: action, args: args || [] }) })
      .then(function (r) { if (!r.ok) { var e = new Error('HTTP ' + r.status); e.status = r.status; throw e; } return r.json(); })
      .then(function (j) { if (!j.ok) { var e = new Error(j.error || 'Error'); e.status = j.status; throw e; } return j.result; });
  }
  function act(action, args, msg) {
    return call(action, args).then(function (r) { return load(true).then(function () { if (msg) toast(msg); return r; }); })
      .catch(function (e) { toast(e.message || 'Something went wrong'); throw e; });
  }
  function load(quiet) {
    if (!quiet) app.innerHTML = skeleton();
    return call('getAll').then(function (d) { S = d; render(); }).catch(function (e) { gate(e); });
  }
  var D = null;
  function dsave() { try { localStorage.setItem(DKEY, JSON.stringify(D)); } catch (e) {} }
  function dnow() { var x = new Date(); return x.getFullYear() + '-' + ('0' + (x.getMonth() + 1)).slice(-2) + '-' + ('0' + x.getDate()).slice(-2) + 'T' + ('0' + x.getHours()).slice(-2) + ':' + ('0' + x.getMinutes()).slice(-2); }
  function demoAct(a, g) {
    if (!D) { D = J(localStorage.getItem(DKEY), null) || window.TTGR_DEMO(); }
    var r = true, id = function (p) { return p + Math.random().toString(36).slice(2, 8); };
    if (a === 'getAll') r = JSON.parse(JSON.stringify(D));
    else if (a === 'addNeed') { var n = g[0], code; do { code = n.borough.charAt(0) + (n.borough === 'Brooklyn' ? 'K' : '') + Math.floor(10 + Math.random() * 89); } while (D.needs.some(function (x) { return x.code === code; }));
      r = { id: id('n'), code: code, role: n.role, student: n.student, borough: n.borough, days: n.days, from: n.from, to: n.to, start: n.start, hrs_week: n.hrs_week, notes: n.notes || '', status: 'open', jd: '', posted: '{}', created: dnow() }; D.needs.push(r); }
    else if (a === 'updateNeed') { var x = D.needs.filter(function (n) { return n.id === g[0]; })[0]; Object.keys(g[1]).forEach(function (k) { x[k] = g[1][k]; }); }
    else if (a === 'markPosted') { var y = D.needs.filter(function (n) { return n.id === g[0]; })[0], p = J(y.posted, {}); p[g[1]] = dnow(); y.posted = JSON.stringify(p); if (y.status === 'open') y.status = 'posted'; }
    else if (a === 'decide') { var m = { interview: 'interview', maybe: 'maybe', pass: 'pass', hire: 'hired', welcome: 'welcome', applicant: 'applicant' }, pp = D.people.filter(function (z) { return z.id === g[0]; })[0];
      pp.stage = m[g[1]]; if (g[1] === 'interview') D.interviews.push({ id: id('i'), person_id: pp.id, need_code: pp.need_code, when: '', status: 'to_schedule', consent: '', summary: '' });
      if (g[1] === 'hire') { var nn = D.needs.filter(function (n) { return n.code === pp.need_code; })[0]; if (nn) nn.status = 'filled'; } }
    else if (a === 'queue') D.queue.push({ id: id('q'), at: dnow(), kind: g[0], person_id: g[1], need_code: g[2], payload: JSON.stringify(g[3] || {}), status: /^call_/.test(g[0]) ? 'waiting_approval' : 'queued' });
    else if (a === 'dismiss') D.dismissed.push({ key: g[0], sig: g[1], at: dnow() });
    else if (a === 'setInterview') { var iv = D.interviews.filter(function (i) { return i.id === g[0]; })[0]; Object.keys(g[1]).forEach(function (k) { iv[k] = g[1][k]; }); }
    else if (a === 'setCred') { var pc = D.people.filter(function (z) { return z.id === g[0]; })[0]; pc.cred_status = g[1]; }
    if (a !== 'getAll') dsave();
    return r;
  }

  /* ---------- facts, not scores (NYC Local Law 144) ---------- */
  function checks(p) {
    var n = needBy(p.need_code) || {}, m = J(p.musts, {}), out = [];
    out.push(p.role === n.role ? { s: 'ok', t: p.role } : { s: 'no', t: (p.role || '?') + ', need ' + (n.role || '?') });
    out.push(p.cred_status === 'verified' ? { s: 'ok', t: (p.credential || 'Credential') + ' checked' } : p.cred_status === 'not_found' ? { s: 'no', t: (p.credential || 'Credential') + ' not found' } : { s: 'q', t: (p.credential || 'Credential') + ' not checked' });
    out.push(String(p.boroughs || '').indexOf(n.borough) >= 0 ? { s: 'ok', t: n.borough } : { s: 'no', t: 'Not ' + (n.borough || '?') });
    out.push(m.hours === true ? { s: 'ok', t: 'Hours fit' } : m.hours === false ? { s: 'no', t: 'Hours don\u2019t fit' } : { s: 'q', t: 'Hours unclear' });
    return out;
  }
  function fits(p) { return !checks(p).some(function (c) { return c.s === 'no'; }); }
  function unknowns(p) { return checks(p).filter(function (c) { return c.s === 'q'; }).length; }
  function ranked(list) { return list.slice().sort(function (a, b) { return unknowns(a) - unknowns(b) || String(a.created).localeCompare(String(b.created)); }); }
  var SI = { ok: 'check', no: 'x', q: 'q' };
  function fact(c) { return '<li class="fact fact--' + c.s + '">' + ic(SI[c.s]) + esc(c.t) + '</li>'; }
  function checkRow(c) { return '<li><span class="dot dot--' + c.s + '">' + ic(SI[c.s]) + '</span>' + esc(c.t) + '</li>'; }

  /* ---------- "Needs you" ---------- */
  function needsYou() {
    var items = [], now = Date.now();
    S.interviews.forEach(function (iv) {
      var p = personBy(iv.person_id); if (!p || p.stage !== 'interview') return;
      var t = pd(iv.when), go = '#/person/' + p.id;
      if (iv.status === 'call_now') items.push({ r: 0, icon: 'phone', tone: 'red', title: 'Call ' + first(p.name) + ' now', sub: 'They asked not to record. Call them yourself.', go: go, cta: 'Open' });
      else if (iv.status === 'scheduled' && t && t - now < 864e5 && t - now > -36e5) items.push({ r: 1, icon: 'clock', tone: 'red', title: 'Interview ' + when(iv.when), sub: p.name + ' \u00b7 I\u2019ll call, then bring you in', go: go, cta: 'Open' });
      else if (iv.status === 'done') items.push({ r: 2, icon: 'check', tone: 'blue', title: 'Decide on ' + p.name, sub: 'Interview notes are ready', go: go, cta: 'Decide' });
      else if (iv.status === 'to_schedule' && !queued('call_schedule', p.id) && !queued('draft_invite', p.id)) items.push({ r: 5, icon: 'cal', tone: 'blue', title: 'Set up interview with ' + first(p.name), sub: 'I\u2019ll call with your free times', go: go, cta: 'Set up' });
    });
    S.people.forEach(function (p) { if (p.stage === 'hired' && !queued('draft_welcome', p.id)) items.push({ r: 3, icon: 'gift', tone: 'green', title: 'Welcome ' + p.name, sub: 'Packet ready for a Gmail draft', go: '#/person/' + p.id, cta: 'Open' }); });
    S.needs.forEach(function (n) {
      if (n.status === 'filled' || n.status === 'closed') return;
      var ap = S.people.filter(function (p) { return p.need_code === n.code && p.stage === 'applicant'; }), fit = ap.filter(fits), go = '#/need/' + n.id;
      if (fit.length) items.push({ r: 4, icon: 'users', tone: 'blue', title: fit.length + ' new fit' + (fit.length > 1 ? 's' : '') + ' \u00b7 ' + needLabel(n), sub: n.borough + ' \u00b7 ' + T.sched(n), go: go + '/applicants', cta: 'Review' });
      if (n.status === 'open') items.push({ r: 6, icon: n.jd ? 'send' : 'pen', tone: 'blue', title: (n.jd ? 'Post ' : 'Check the post \u00b7 ') + needLabel(n), sub: n.jd ? 'Ready for 5 sites. Copy and paste.' : 'I drafted it. Read it, add pay, save.', go: go, cta: n.jd ? 'Post' : 'Check' });
      var posted = Object.values(J(n.posted, {})).sort()[0];
      if (n.status === 'posted' && posted && daysSince(posted) >= 5 && !S.people.some(function (p) { return p.need_code === n.code; })) items.push({ r: 7, icon: 'alert', tone: 'amber', title: 'No one yet \u00b7 ' + needLabel(n), sub: daysSince(posted) + ' days. Try another site?', go: go, cta: 'Post more' });
    });
    return items.sort(function (a, b) { return a.r - b.r; });
  }
  function counts() {
    var c = { need: 0, posting: 0, applicants: 0, interviews: 0, welcome: 0 };
    S.needs.forEach(function (n) { if (n.status === 'open') c.need++; else if (n.status === 'posted') c.posting++; });
    S.people.forEach(function (p) { if (p.stage === 'applicant' || p.stage === 'maybe') c.applicants++; else if (p.stage === 'interview') c.interviews++; else if (p.stage === 'hired') c.welcome++; });
    return c;
  }
  var STAGES = [['need', 'Need', 'Needs'], ['posting', 'Posted', 'Posted'], ['applicants', 'Applied', 'Applicants'], ['interviews', 'Interview', 'Interviews'], ['welcome', 'Welcome', 'Welcome']];
  function stages(active) {
    var c = counts();
    return '<nav class="stages" aria-label="Hiring stages">' + STAGES.map(function (s) {
      return '<a href="#/stage/' + s[0] + '" class="stage' + (c[s[0]] ? ' has' : '') + (active === s[0] ? ' on' : '') + '"><b>' + c[s[0]] + '</b><span>' + s[1] + '</span></a>'; }).join('') + '</nav>';
  }
  function today() { return new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }); }
  function headActs() {
    var standalone = (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone;
    var ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    var b = '';
    if (!standalone && (installEvt || ios)) b += '<button class="pill pill--install" data-act="install">' + ic('dl') + 'Install</button>';
    if (DEMO) b += '<span class="pill pill--demo">Demo</span>';
    return b ? '<div class="hdr__acts">' + b + '</div>' : '';
  }
  function hdr(title, sub) { return '<header class="hdr"><div class="hdr__txt"><div class="hdr__date">' + esc(today()) + '</div><h1>' + esc(title) + '</h1>' + (sub ? '<p class="hdr__sub">' + esc(sub) + '</p>' : '') + '</div>' + headActs() + '</header>'; }
  function top(title, back, right) { return '<header class="top"><a class="iconbtn" href="' + (back || '#/') + '" aria-label="Back">' + ic('back') + '</a><h1>' + esc(title) + '</h1>' + (right || '') + (DEMO ? '<span class="pill pill--demo">Demo</span>' : '') + '</header>'; }
  function roleChips() { return '<div class="chips">' + ROLE_CHIPS.map(function (r) { return '<a href="#/new/' + encodeURIComponent(r[1]) + '">' + esc(r[0]) + '</a>'; }).join('') + '</div>'; }
  function startCard(big) {
    return '<section class="hero' + (big ? '' : ' hero--sm') + '"><h2>Start a new hire</h2><p>' + (big ? 'Tell me the role, borough and hours. I\u2019ll write the job post and get it ready for 5 sites in one tap.' : 'Pick a role. I\u2019ll write the post.') + '</p>' + roleChips() +
      (big ? '<a class="btn btn--white btn--lg btn--block" href="#/new">' + ic('plus') + 'New need</a>' : '') + '</section>';
  }
  function foot() { return '<footer>' + (DEMO ? 'Demo data is made up. <button class="linkbtn" data-act="reset">Reset demo</button>' : 'Private \u00b7 Together They Grow') + '</footer>'; }
  function skeleton() { return '<div class="view"><header class="hdr"><div class="hdr__txt"><div class="sk sk--date"></div><div class="sk sk--title"></div></div></header><div class="sk sk--stages"></div><div class="sk sk--card"></div><div class="sk sk--card"></div><div class="sk sk--card"></div></div>'; }

  /* ---------- views ---------- */
  function home() {
    var it = needsYou(), c = counts(), empty = !S.needs.length && !S.people.length;
    if (empty) {
      return '<div class="view narrow">' + hdr('Recruiting', 'Let\u2019s find your next great provider.') + startCard(true) +
        '<section class="sec"><div class="sec__h"><h2>How it works</h2></div><div class="card"><ol class="steps">' +
        '<li><b>1</b><span>You add a need. I write the job post with the right must-haves.</span></li>' +
        '<li><b>2</b><span>You copy it to LinkedIn, Indeed, college and ABA boards, or WhatsApp. Each has a QR code.</span></li>' +
        '<li><b>3</b><span>Applicants text the code. I screen them and show only the ones who fit.</span></li>' +
        '<li><b>4</b><span>I set up interviews, and when you hire I draft the welcome packet in Gmail.</span></li></ol></div></section>' + foot() + '</div>';
    }
    var shown = openMore ? it : it.slice(0, 5);
    var left = '<section class="sec"><div class="sec__h"><h2>Needs you</h2></div>' +
      (it.length ? '<ul class="todo">' + shown.map(function (i) {
        return '<li><a href="' + i.go + '"><span class="tile tile--' + i.tone + '">' + ic(i.icon) + '</span><span class="todo__txt"><span class="todo__t">' + esc(i.title) + '</span><span class="todo__s">' + esc(i.sub) + '</span></span><span class="todo__go">' + esc(i.cta) + ic('chev') + '</span></a></li>';
      }).join('') + '</ul>' + (it.length > 5 && !openMore ? '<button class="more" data-act="more">Show ' + (it.length - 5) + ' more</button>' : '')
        : '<div class="card center"><span class="tile tile--green">' + ic('check') + '</span><p class="todo__t">You\u2019re all caught up</p><p class="muted small">New applicants show up here the moment they fit.</p></div>') + '</section>';
    var sub = it.length ? (it.length === 1 ? '1 thing needs you' : it.length + ' things need you') : 'You\u2019re all caught up';
    return '<div class="view">' + hdr('Recruiting', sub) + '<div class="home"><div>' + stages() + left + '</div><aside><section class="sec">' + startCard(false) + '</section>' + openNeeds() + '</aside></div>' + foot() + '</div>';
  }
  function openNeeds() {
    var l = S.needs.filter(function (n) { return n.status === 'open' || n.status === 'posted'; });
    return l.length ? '<section class="sec"><div class="sec__h"><h2>Open needs</h2><small>' + l.length + '</small></div><ul class="list">' + l.map(needRow).join('') + '</ul></section>' : '';
  }
  function needRow(n) {
    var ap = S.people.filter(function (p) { return p.need_code === n.code && p.stage !== 'pass'; }), posted = Object.keys(J(n.posted, {}));
    var st = n.status === 'open' ? (n.jd ? '<span class="tag">Ready to post</span>' : '<span class="tag tag--grey">Post to check</span>') : '<span class="tag tag--green">' + posted.length + ' site' + (posted.length === 1 ? '' : 's') + ' \u00b7 ' + ap.length + ' applied</span>';
    return '<li><a class="row" href="#/need/' + n.id + '"><span class="tile">' + esc(n.code) + '</span><span class="grow"><span class="row__t">' + esc(needLabel(n)) + '</span><span class="row__s">' + esc(n.borough + ' \u00b7 ' + T.sched(n)) + '</span>' + st + '</span>' + ic('chev') + '</a></li>';
  }
  function personSub(p) {
    var iv = ivFor(p.id);
    if (p.stage === 'interview' && iv) return iv.status === 'scheduled' ? 'Interview ' + when(iv.when) : iv.status === 'done' ? 'Interviewed \u00b7 ready to decide' : iv.status === 'call_now' ? 'Call them now (no recording)' : queued('call_schedule', p.id) ? 'Set-up call queued' : 'Interview not set up yet';
    if (p.stage === 'hired') return queued('draft_welcome', p.id) ? 'Welcome draft requested' : 'Welcome packet to draft';
    return p.fit_summary || '';
  }
  function personRow(p, withFacts) {
    return '<li><a class="row" href="#/person/' + p.id + '"><span class="avatar">' + esc(initials(p.name)) + '</span><span class="grow"><span class="row__t">' + esc(p.name) + (p.stage === 'maybe' ? ' <span class="tag tag--grey">Maybe</span>' : '') + '</span><span class="row__s">' + esc(p.role + ' \u00b7 ' + p.source) + '</span>' +
      '<span class="row__s">' + esc(personSub(p)) + '</span>' + (withFacts ? '<ul class="facts">' + checks(p).map(fact).join('') + '</ul>' : '') + '</span>' + ic('chev') + '</a></li>';
  }
  function stage(s) {
    var meta = STAGES.filter(function (x) { return x[0] === s; })[0] || STAGES[0], h = '<div class="view narrow">' + top(meta[2], '#/') + stages(s), list;
    if (s === 'need' || s === 'posting') {
      list = S.needs.filter(function (n) { return n.status === (s === 'need' ? 'open' : 'posted'); });
      h += '<section class="sec">' + (list.length ? '<ul class="list">' + list.map(needRow).join('') + '</ul>' : empty(s === 'need' ? 'No open needs.' : 'Nothing posted yet.')) + '</section>' + (s === 'need' ? '<section class="sec">' + startCard(false) + '</section>' : '');
    } else if (s === 'applicants') {
      var groups = S.needs.filter(function (n) { return S.people.some(function (p) { return p.need_code === n.code && (p.stage === 'applicant' || p.stage === 'maybe'); }); });
      h += groups.map(applicantsBlock).join('') || '<section class="sec">' + empty('No applicants waiting. They appear here as soon as they text a code.') + '</section>';
    } else {
      list = S.people.filter(function (p) { return p.stage === (s === 'interviews' ? 'interview' : 'hired'); });
      h += '<section class="sec">' + (list.length ? '<ul class="list">' + list.map(function (p) { return personRow(p); }).join('') + '</ul>' : empty(s === 'interviews' ? 'No interviews right now.' : 'No one to welcome yet.')) + '</section>';
      if (s === 'interviews' && S.queue.some(function (x) { return x.status === 'waiting_approval'; })) h += '<div class="callout callout--blue">' + ic('shield') + '<span>Calls are queued but switched off until you approve calling.</span></div>';
    }
    return h + foot() + '</div>';
  }
  function empty(t) { return '<div class="card center muted">' + esc(t) + '</div>'; }
  function applicantsBlock(n) {
    var all = S.people.filter(function (p) { return p.need_code === n.code && (p.stage === 'applicant' || p.stage === 'maybe'); });
    var fit = ranked(all.filter(fits)), no = all.filter(function (p) { return !fits(p); });
    return '<section class="sec" id="applicants"><div class="sec__h"><h2>' + esc(n.code + ' \u00b7 ' + needLabel(n)) + '</h2><small>' + fit.length + ' fit</small></div>' +
      (fit.length ? '<ul class="list">' + fit.map(function (p) { return personRow(p, true); }).join('') + '</ul>' : empty('No one who fits yet.')) +
      (no.length ? (showUnfit[n.code] ? '<p class="muted small">Missed a must-have</p><ul class="list dim">' + no.map(function (p) { return personRow(p, true); }).join('') + '</ul>' : '<button class="more" data-unfit="' + esc(n.code) + '">' + no.length + ' didn\u2019t fit \u00b7 show</button>') : '') +
      '<p class="muted small center">Sorted by must-haves met. Facts only. You decide.</p></section>';
  }
  var LOGO = { linkedin: ['in', '#0A66C2'], indeed: ['ind', '#2557A7'], college: ['edu', '#5B6478'], aba: ['ABA', '#B41E44'], community: ['WA', '#128C4B'] };
  function needPage(id, sub) {
    var n = needId(id); if (!n) return '<div class="view">' + top('Not found') + '</div>';
    var text = n.jd || T.jd(n, line()), v = T.versions(n, text, line()), posted = J(n.posted, {}), r = T.R[n.role] || T.R.RBT;
    var h = '<div class="view narrow">' + top(n.role + ' \u00b7 ' + n.borough, '#/') +
      '<section class="card need-hero"><div class="grow"><p class="big">' + esc(n.student ? 'For ' + n.student : n.role) + '</p><p class="muted">' + esc(T.sched(n)) + (n.hrs_week ? ' \u00b7 ' + esc(n.hrs_week) + ' hrs/wk' : '') + '</p><p class="muted">Start ' + esc(T.fmtDate(n.start)) + '</p></div>' +
      '<div class="qr" title="Scan to text the code">' + qrSvg(qrText(n), 3) + '<b>' + esc(n.code) + '</b></div></section>';
    h += '<section class="sec"><div class="sec__h"><h2>1 \u00b7 Job post</h2><small>' + (n.jd ? 'Saved' : 'Draft') + '</small></div><div class="card"><textarea id="jd" aria-label="Job post">' + esc(text) + '</textarea>' +
      (v.pay ? '' : '<div class="callout callout--red">' + ic('alert') + '<span>Type the pay range on the \u201cPay:\u201d line. NYC law requires it in job ads.</span></div>') +
      '<div class="btns"><button class="btn" data-act="savejd" data-id="' + n.id + '">' + ic('check') + 'Save</button><button class="btn btn--soft" data-act="resetjd" data-id="' + n.id + '">Start over</button></div></div></section>';
    h += '<section class="sec"><div class="sec__h"><h2>2 \u00b7 Post it</h2><small>' + Object.keys(posted).length + ' of 5</small></div><div class="card card--flush">' + r.boards.map(function (k) {
        var c = T.CHANNELS[k], url = k === 'community' ? 'https://wa.me/?text=' + encodeURIComponent(v.text[k]) : c.url, lg = LOGO[k];
        return '<div class="chan"><div class="chan__head"><span class="chan__logo chan--' + k + '">' + lg[0] + '</span><span class="grow"><span class="row__t">' + esc(c.name) + '</span><span class="row__s">' + (posted[k] ? 'Posted ' + esc(when(posted[k])) : 'Not posted yet') + '</span></span>' + (posted[k] ? '<span class="tag tag--green">' + ic('check') + '</span>' : '') + '</div>' +
          '<details class="prev"><summary>Preview ' + ic('chev') + '</summary><pre>' + esc(v.text[k]) + '</pre></details>' +
          '<div class="chan__actions"><button class="btn" data-copy="' + k + '">' + ic('copy') + 'Copy</button><a class="btn btn--ghost" target="_blank" rel="noopener noreferrer" href="' + esc(url) + '">' + ic('ext') + (k === 'community' ? 'WhatsApp' : 'Open') + '</a>' +
          (k === 'community' ? '<a class="btn btn--ghost" href="#/flyer/' + n.id + '">' + ic('print') + 'Flyer</a>' : posted[k] ? '<span></span>' : '<button class="btn btn--soft" data-posted="' + k + '" data-id="' + n.id + '">' + ic('check') + 'Posted</button>') + '</div></div>';
      }).join('') + '</div>' +
      '<div class="btns"><a class="btn btn--ghost" href="sms:?&body=' + encodeURIComponent(T.referralAsk(n, line())) + '">' + ic('msg') + 'Text a referral ask</a><button class="btn btn--ghost" data-act="outreach" data-code="' + esc(n.code) + '">' + ic('mail') + 'Email past applicants</button></div>' +
      '<p class="muted small center">You post: copy, open the site, paste. Emails become Gmail drafts you send.</p></section>';
    h += applicantsBlock(n).replace('<h2>', '<h2>3 \u00b7 ');
    h += (n.status !== 'filled' ? '<button class="more" data-act="fill" data-id="' + n.id + '">Mark this need filled</button>' : '<p class="muted center">Filled.</p>') + foot() + '</div>';
    return h;
  }
  function verifyLinks(p) {
    var r = T.R[p.role] || {}, out = [];
    if (r.verify === 'bacb' || r.verify === 'both') out.push(T.VERIFY.bacb);
    if (r.verify === 'nysed' || r.verify === 'both') out.push(T.VERIFY.nysed);
    return out.map(function (x) { return '<a class="btn btn--ghost" target="_blank" rel="noopener noreferrer" href="' + x.url + '">' + ic('shield') + x.name + '</a>'; }).join('');
  }
  function freeTimes() { var now = Date.now(); return (S.freeTimes || []).filter(function (f) { var t = pd(f.start); return t && t > now; }).slice(0, 3).map(function (f) { return when(f.start); }); }
  function personPage(id) {
    var p = personBy(id); if (!p) return '<div class="view">' + top('Not found') + '</div>';
    var n = needBy(p.need_code) || {}, iv = ivFor(p.id), bar = '';
    var h = '<div class="view narrow">' + top(p.name, n.id ? '#/need/' + n.id : '#/') +
      '<section class="card"><div class="need-hero"><span class="avatar avatar--lg">' + esc(initials(p.name)) + '</span><div class="grow"><p class="big">' + esc(p.role + ' \u00b7 ' + (n.code || p.need_code)) + '</p><p class="muted">' + esc((n.student ? 'For ' + n.student + ' \u00b7 ' : '') + p.source) + '</p></div></div>' +
      '<div class="contact">' + (p.phone ? '<a href="tel:' + esc(digits(p.phone)) + '">' + ic('phone') + 'Call</a><a href="sms:' + esc(digits(p.phone)) + '">' + ic('msg') + 'Text</a>' : '') + (p.email ? '<a href="mailto:' + esc(p.email) + '">' + ic('mail') + 'Email</a>' : '') + (p.resume_url ? '<a target="_blank" rel="noopener noreferrer" href="' + esc(p.resume_url) + '">' + ic('file') + 'Resume</a>' : '') + '</div></section>' +
      '<section class="sec"><div class="sec__h"><h2>Must-haves</h2><small>' + checks(p).filter(function (c) { return c.s === 'ok'; }).length + ' of 4 met</small></div><div class="card"><ul class="checks">' + checks(p).map(checkRow).join('') + '</ul>' +
      '<div class="btns">' + verifyLinks(p) + (p.cred_status !== 'verified' ? '<button class="btn btn--soft" data-cred="verified" data-id="' + p.id + '">I checked: valid</button>' : '') + (p.cred_status === 'unchecked' ? '<button class="btn btn--soft" data-cred="not_found" data-id="' + p.id + '">Not found</button>' : '') + '</div></div></section>' +
      '<section class="sec"><div class="sec__h"><h2>Fit</h2></div><div class="card"><p>' + esc(p.fit_summary || 'No summary yet.') + '</p><p class="muted small">Available ' + esc(p.availability || '?') + ' \u00b7 ' + esc(p.boroughs || '') + '</p></div></section>';
    if (p.stage === 'applicant' || p.stage === 'maybe') {
      bar = '<div class="decide"><button class="btn btn--lg" data-decide="interview" data-id="' + p.id + '">Interview</button>' + (p.stage === 'maybe' ? '' : '<button class="btn btn--lg btn--ghost" data-decide="maybe" data-id="' + p.id + '">Maybe</button>') + '<button class="btn btn--lg btn--red" data-decide="pass" data-id="' + p.id + '">Pass</button></div>';
    } else if (p.stage === 'interview' && iv) {
      var ib = interviewBlock(p, iv); h += '<section class="sec"><div class="sec__h"><h2>Interview</h2></div><div class="card">' + ib.html + '</div></section>'; bar = ib.bar || '';
    } else if (p.stage === 'hired') {
      h += welcomeBlock(p);
    } else if (p.stage === 'welcome') {
      h += '<div class="callout callout--green">' + ic('check') + '<span>Welcomed.</span></div>';
    } else if (p.stage === 'pass') {
      h += '<div class="card center muted">Passed. <button class="linkbtn" data-decide="applicant" data-id="' + p.id + '">Undo</button></div>';
    }
    return h + bar + foot() + '</div>';
  }
  function interviewBlock(p, iv) {
    var times = freeTimes(), qs = queued('call_schedule', p.id), qi = queued('call_interview', p.id), di = queued('draft_invite', p.id);
    var hireBar = '<div class="decide"><button class="btn btn--lg" data-decide="hire" data-id="' + p.id + '">Hire</button><button class="btn btn--lg btn--red" data-decide="pass" data-id="' + p.id + '">Pass</button></div>';
    if (iv.status === 'done') {
      var s = J(iv.summary, {}), rows = [['Summary', s.summary], ['Credentials', s.credentials], ['Experience', s.experience], ['Availability', s.availability], ['Strengths', s.strengths], ['Concerns', s.concerns], ['Follow-ups', s.follow_ups]];
      return { html: '<p class="muted small">' + esc(when(iv.when)) + ' \u00b7 Recording ' + (iv.consent === 'yes' ? 'agreed' : 'not agreed, not recorded') + '</p><dl class="sumlist">' + rows.filter(function (r) { return r[1]; }).map(function (r) { return '<dt>' + r[0] + '</dt><dd>' + esc(r[1]) + '</dd>'; }).join('') + '</dl>', bar: hireBar };
    }
    if (iv.status === 'call_now') return { html: '<p class="big">Call ' + esc(first(p.name)) + ' now</p><p class="muted">They asked not to record, so I hung up. Nothing was saved.</p><a class="btn btn--lg btn--block" href="tel:' + esc(digits(p.phone)) + '">' + ic('phone') + 'Call ' + esc(p.phone) + '</a>', bar: hireBar };
    if (iv.status === 'scheduled') {
      return { html: '<p class="big">' + esc(when(iv.when)) + '</p><p class="muted">At that time I\u2019ll call ' + esc(first(p.name)) + ', confirm they agree to recording, then connect you. If they say no, I hang up and you call them.</p>' +
        (qi ? '<div class="callout callout--blue">' + ic('shield') + '<span>Interview call queued. It waits until you approve calling.</span></div>' : '<button class="btn btn--lg btn--block" data-act="ivcall" data-id="' + p.id + '" data-iv="' + iv.id + '">' + ic('phone') + 'Have the assistant call</button>') + setTime(iv) };
    }
    return { html: '<p class="muted">Your free times</p><div class="chips">' + (times.length ? times.map(function (t) { return '<span class="tag">' + esc(t) + '</span>'; }).join('') : '<span class="muted">None loaded yet</span>') + '</div>' +
      (qs ? '<div class="callout callout--blue">' + ic('shield') + '<span>I\u2019ll call ' + esc(first(p.name)) + ' to set it up once you approve calling.</span></div>' : '<button class="btn btn--lg btn--block" data-act="schedcall" data-id="' + p.id + '" data-iv="' + iv.id + '">' + ic('phone') + 'I\u2019ll call to set it up</button>') +
      '<div class="btns"><a class="btn btn--ghost" href="sms:' + esc(digits(p.phone)) + '?&body=' + encodeURIComponent(T.timesText(first(p.name), times.length ? times : ['[time 1]', '[time 2]'], S.me)) + '">' + ic('msg') + 'Text times</a>' + (di ? '<span class="tag tag--green">Email draft requested</span>' : '<button class="btn btn--ghost" data-act="invite" data-id="' + p.id + '">' + ic('mail') + 'Email draft</button>') + '</div>' + setTime(iv) };
  }
  function setTime(iv) { return '<details class="prev"><summary>Set the time myself ' + ic('chev') + '</summary><div class="btns"><input type="datetime-local" id="ivt" step="900" value="' + esc(iv.when || '') + '" aria-label="Interview time"><button class="btn" data-act="settime" data-iv="' + iv.id + '">Save</button></div></details>'; }
  function welcomeBlock(p) {
    var PK = T.PACKET, contract = PK.contract[p.role], extra = PK.extra[p.role], qd = queued('draft_welcome', p.id);
    var att = [{ s: contract ? 'ok' : 'q', t: contract || 'Contract: you pick (no template yet)' }].concat(PK.common.map(function (a) { return { s: 'ok', t: a }; })).concat(extra ? [{ s: 'ok', t: extra }] : []);
    return '<section class="sec"><div class="sec__h"><h2>Welcome packet</h2></div><div class="card"><p class="muted small">In the Gmail draft</p><ul class="checks">' + att.map(checkRow).join('') + '</ul>' +
      '<p class="muted small">They send back</p><div class="facts">' + PK.askBack(p.role).map(function (a) { return '<span class="fact fact--q">' + esc(a) + '</span>'; }).join('') + '</div>' +
      '<div class="callout callout--blue">' + ic('shield') + '<span>You type the rate in the draft. Bank and direct-deposit forms go straight to billing, never here.</span></div></div></section>' +
      (qd ? '<div class="callout callout--green">' + ic('check') + '<span>Draft requested. It will be in your Gmail drafts. Nothing is sent.</span></div><div class="dock"><button class="btn btn--lg btn--block btn--ghost" data-decide="welcome" data-id="' + p.id + '">I sent it \u00b7 mark welcomed</button></div>'
        : '<div class="dock"><button class="btn btn--lg btn--block" data-act="welcome" data-id="' + p.id + '">' + ic('gift') + 'Make welcome draft</button></div>');
  }
  /* New need: chips, day toggles, 15-minute time selects */
  var ROLE_LIST = ['RBT', 'Behavior tech', 'BCBA', 'BCaBA', 'SETSS', 'SLP', 'OT', 'PT', 'Para'], BOROS = ['Queens', 'Brooklyn', 'Manhattan', 'Bronx', 'Staten Island'], DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  function timeOpts(sel) { var o = ''; for (var m = 7 * 60; m <= 21 * 60; m += 15) { var v = ('0' + Math.floor(m / 60)).slice(-2) + ':' + ('0' + m % 60).slice(-2); o += '<option value="' + v + '"' + (v === sel ? ' selected' : '') + '>' + T.fmtT(v) + '</option>'; } return o; }
  function nextMonday() { var d = new Date(); d.setDate(d.getDate() + ((8 - d.getDay()) % 7 || 7)); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
  function newNeed(pre) {
    var role = pre === 'SLP' ? 'SLP' : pre || '', defaults = { Para: ['08:00', '14:30', ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']] }[role] || ['15:00', '18:00', ['Mon', 'Tue', 'Wed', 'Thu']];
    function chips(name, arr, on) { return '<div class="chips" data-name="' + name + '">' + arr.map(function (x) { return '<button type="button" data-v="' + esc(x) + '"' + (x === on ? ' class="on" aria-pressed="true"' : ' aria-pressed="false"') + '>' + esc(x) + '</button>'; }).join('') + '</div>'; }
    return '<div class="view narrow">' + top('New need', '#/') + '<form id="nf" class="form" novalidate>' +
      '<section class="card"><div class="field"><span class="lbl">Role</span>' + chips('role', ROLE_LIST, role) + '</div>' +
      '<div class="field"><span class="lbl">Borough</span>' + chips('borough', BOROS) + '</div></section>' +
      '<section class="card"><div class="field"><span class="lbl">Days</span><div class="days" data-name="days">' + DAYS.map(function (d) { return '<button type="button" data-day="' + d + '"' + (defaults[2].indexOf(d) >= 0 ? ' class="on"' : '') + '>' + d + '</button>'; }).join('') + '</div>' +
      '<div class="presets"><button type="button" data-preset="Mon,Tue,Wed,Thu">Mon\u2013Thu</button><button type="button" data-preset="Mon,Tue,Wed,Thu,Fri">Mon\u2013Fri</button><button type="button" data-preset="Tue,Thu">Tue + Thu</button><button type="button" data-preset="Mon,Wed">Mon + Wed</button></div></div>' +
      '<div class="field two"><div><label class="lbl" for="from">From</label><select id="from">' + timeOpts(defaults[0]) + '</select></div><div><label class="lbl" for="to">To</label><select id="to">' + timeOpts(defaults[1]) + '</select></div></div>' +
      '<div class="sum-line" id="hrsline">' + ic('clock') + '<span id="hrstxt"></span></div></section>' +
      '<section class="card"><div class="field two"><div><label class="lbl" for="start">Start</label><input id="start" type="date" value="' + nextMonday() + '"></div><div><label class="lbl" for="stu">Student <small>initials</small></label><input id="stu" maxlength="20" autocomplete="off" placeholder="e.g. M.R."></div></div>' +
      '<div class="field"><label class="lbl" for="notes">Notes <small>optional</small></label><input id="notes" maxlength="120" autocomplete="off" placeholder="e.g. SWD 1\u20136, Yiddish a plus"></div></section>' +
      '<div class="dock"><button class="btn btn--lg btn--block" type="submit">' + ic('pen') + 'Save and write the post</button></div></form>' + '</div>';
  }
  function hrsCalc() {
    var f = document.getElementById('from'), t = document.getElementById('to'); if (!f) return 0;
    var mins = function (v) { var p = v.split(':'); return +p[0] * 60 + +p[1]; }, per = Math.max(0, mins(t.value) - mins(f.value)) / 60;
    var n = document.querySelectorAll('.days button.on').length, tot = Math.round(per * n * 4) / 4;
    var el = document.getElementById('hrstxt'); if (el) el.textContent = n ? (n + ' day' + (n > 1 ? 's' : '') + ' \u00d7 ' + per + ' hrs = ' + tot + ' hrs/week') : 'Pick the days';
    return tot;
  }
  function compactDays(list) {
    var idx = list.map(function (d) { return DAYS.indexOf(d); }).sort(), out = [], i = 0;
    while (i < idx.length) { var j = i; while (j + 1 < idx.length && idx[j + 1] === idx[j] + 1) j++; out.push(j - i >= 2 ? DAYS[idx[i]] + '\u2013' + DAYS[idx[j]] : idx.slice(i, j + 1).map(function (k) { return DAYS[k]; }).join(', ')); i = j + 1; }
    return out.join(', ');
  }
  function flyer(id) {
    var n = needId(id); if (!n) return '<div class="view">' + top('Not found') + '</div>';
    var v = T.versions(n, n.jd || T.jd(n, line()), line()), r = T.R[n.role] || T.R.RBT;
    return '<div class="view narrow"><div class="noprint">' + top('Flyer', '#/need/' + n.id, '<button class="pill" data-act="print">' + ic('print') + 'Print</button>') + '</div><div class="flyer card"><p class="org">Together They Grow</p><h1>' + esc(r.short) + ' wanted</h1><p class="big">' + esc(n.borough + ' \u00b7 ' + T.sched(n)) + '</p><ul>' + r.musts.map(function (m) { return '<li>' + esc(m) + '</li>'; }).join('') + '</ul>' +
      '<p class="big">' + (v.pay ? 'Pay: ' + esc(v.pay) : '<span class="callout callout--red">Add the pay range on the job post first</span>') + '</p><div class="qrbig">' + qrSvg(qrText(n), 7) + '</div><p class="big">Scan, or text <b>' + esc(n.code) + '</b> to ' + esc(line()) + '</p></div></div>';
  }
  function gate(e) {
    var msg = !token ? 'This is a private app. Open it from your personal link.' : e && e.status === 401 ? 'This link isn\u2019t valid anymore. Ask for a new one.' : 'Can\u2019t reach the server. Check your connection and try again.';
    app.innerHTML = '<div class="view gate"><img src="icons/icon-192.png" alt=""><h1>TTG Recruiting</h1><p>' + esc(msg) + '</p><div class="btns">' + (token ? '<button class="btn btn--lg" data-act="retry">Try again</button>' : '') + '<a class="btn btn--lg btn--ghost" href="?demo=1">See the demo</a></div></div>';
  }
  function sheet(html) {
    closeSheet(); var b = document.createElement('div'); b.className = 'backdrop'; b.dataset.act = 'closesheet';
    var s = document.createElement('div'); s.className = 'sheet'; s.setAttribute('role', 'dialog'); s.innerHTML = '<div class="sheet__grab"></div>' + html;
    document.body.appendChild(b); document.body.appendChild(s);
  }
  function closeSheet() { document.querySelectorAll('.backdrop,.sheet').forEach(function (x) { x.remove(); }); }

  /* ---------- router ---------- */
  function render() {
    if (!S) return;
    var h = location.hash.replace(/^#\/?/, '').split('/'), v;
    if (h[0] === 'stage') v = stage(h[1]);
    else if (h[0] === 'need') v = needPage(h[1], h[2]);
    else if (h[0] === 'person') v = personPage(h[1]);
    else if (h[0] === 'new') v = newNeed(decodeURIComponent(h[1] || ''));
    else if (h[0] === 'flyer') v = flyer(h[1]);
    else v = home();
    app.innerHTML = v;
    if (h[0] === 'new') hrsCalc();
    if (h[0] === 'need' && h[2] === 'applicants') { var a = document.getElementById('applicants'); if (a) a.scrollIntoView(); }
  }
  window.addEventListener('hashchange', function () { document.getElementById('toast').className = 'toast'; closeSheet(); render(); if (!/applicants$/.test(location.hash)) window.scrollTo(0, 0); });

  /* ---------- events ---------- */
  document.addEventListener('change', function (ev) { if (ev.target.id === 'from' || ev.target.id === 'to') hrsCalc(); });
  document.addEventListener('click', function (ev) {
    var b = ev.target.closest('button, [data-act]'); if (!b) return;
    var d = b.dataset, id = d.id;
    if (b.closest('.chips') && d.v) { b.parentNode.querySelectorAll('button').forEach(function (x) { x.classList.remove('on'); x.setAttribute('aria-pressed', 'false'); }); b.classList.add('on'); b.setAttribute('aria-pressed', 'true'); return; }
    if (d.day) { b.classList.toggle('on'); hrsCalc(); return; }
    if (d.preset) { var ds = d.preset.split(','); document.querySelectorAll('.days button').forEach(function (x) { x.classList.toggle('on', ds.indexOf(x.dataset.day) >= 0); }); hrsCalc(); return; }
    if (d.unfit) { showUnfit[d.unfit] = 1; render(); return; }
    if (d.copy) { var n = needId(location.hash.split('/')[2]); copy(T.versions(n, document.getElementById('jd').value, line()).text[d.copy]); return; }
    if (d.posted) { act('markPosted', [id, d.posted], 'Marked posted'); return; }
    if (d.decide) { var p = personBy(id); act('decide', [id, d.decide], { interview: 'Moved to interviews', maybe: 'Saved as maybe', pass: 'Passed', hire: 'Hired. Welcome packet is next.', welcome: 'Marked welcomed', applicant: 'Back in applicants' }[d.decide]).then(function () { if (d.decide === 'pass' || d.decide === 'maybe') location.hash = '#/need/' + ((needBy(p.need_code) || {}).id || ''); }); return; }
    if (d.cred) { act('setCred', [id, d.cred], 'Saved'); return; }
    var a = d.act; if (!a) return;
    if (a === 'more') { openMore = true; render(); }
    else if (a === 'closesheet') closeSheet();
    else if (a === 'print') window.print();
    else if (a === 'install') {
      if (installEvt) { installEvt.prompt(); installEvt.userChoice.then(function () { installEvt = null; render(); }); }
      else sheet('<h2>Add to your Home Screen</h2><ol><li>Tap the <b>Share</b> button ' + ic('share') + ' in Safari.</li><li>Scroll and tap <b>Add to Home Screen</b>.</li><li>Tap <b>Add</b>. Open Recruiting from your Home Screen.</li></ol><button class="btn btn--lg btn--block" data-act="closesheet">Got it</button>');
    }
    else if (a === 'reset') { localStorage.removeItem(DKEY); D = null; load(); }
    else if (a === 'retry') load();
    else if (a === 'savejd') act('updateNeed', [id, { jd: document.getElementById('jd').value }], 'Saved');
    else if (a === 'resetjd') { document.getElementById('jd').value = T.jd(needId(id), line()); toast('Fresh draft. Save to keep it.'); }
    else if (a === 'fill') act('updateNeed', [id, { status: 'filled' }], 'Marked filled').then(function () { location.hash = '#/'; });
    else if (a === 'outreach') act('queue', ['draft_outreach', '', d.code, {}], 'I\u2019ll put the emails in your Gmail drafts.');
    else if (a === 'schedcall') act('queue', ['call_schedule', id, (personBy(id) || {}).need_code, { interview_id: d.iv, times: freeTimes() }], 'Queued. I\u2019ll call once calling is approved.');
    else if (a === 'invite') act('queue', ['draft_invite', id, (personBy(id) || {}).need_code, { times: freeTimes() }], 'I\u2019ll put an email draft in Gmail.');
    else if (a === 'ivcall') act('queue', ['call_interview', id, (personBy(id) || {}).need_code, { interview_id: d.iv }], 'Queued. It waits for your approval.');
    else if (a === 'settime') { var t = document.getElementById('ivt').value; if (!t) return toast('Pick a time'); act('setInterview', [d.iv, { when: t, status: 'scheduled' }], 'Interview set'); }
    else if (a === 'welcome') { var pw = personBy(id); act('queue', ['draft_welcome', id, pw.need_code, { role: pw.role }], 'I\u2019ll put the welcome draft in Gmail.'); }
  });
  document.addEventListener('submit', function (ev) {
    if (ev.target.id !== 'nf') return; ev.preventDefault();
    function pick(n) { var x = document.querySelector('.chips[data-name="' + n + '"] .on'); return x ? x.dataset.v : ''; }
    var role = pick('role'), boro = pick('borough'), days = Array.prototype.map.call(document.querySelectorAll('.days button.on'), function (b) { return b.dataset.day; });
    if (!role) return toast('Pick a role'); if (!boro) return toast('Pick a borough'); if (!days.length) return toast('Pick the days');
    var g = function (i) { return document.getElementById(i).value; };
    if (g('to') <= g('from')) return toast('End time must be after start time');
    var need = { role: role, borough: boro, days: compactDays(days), from: g('from'), to: g('to'), start: g('start'), hrs_week: hrsCalc(), student: g('stu'), notes: g('notes') };
    act('addNeed', [need]).then(function (r) { return act('updateNeed', [r.id, { jd: T.jd(r, line()) }], 'Saved. Read the post and add pay.').then(function () { location.hash = '#/need/' + r.id; }); });
  });

  /* ---------- install + service worker ---------- */
  window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); installEvt = e; if (S && !/^#\/(new|need|person|flyer)/.test(location.hash)) render(); });
  window.addEventListener('appinstalled', function () { installEvt = null; toast('Installed'); });
  if ('serviceWorker' in navigator && window.isSecureContext) navigator.serviceWorker.register('sw.js', { scope: './' }).catch(function () {});

  if (!DEMO && !token) gate(); else load();
})();
