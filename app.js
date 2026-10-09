/* TTG Recruiting app. Real mode: talks to the private Apps Script API with the owner's link token.
   Demo mode (?demo=1): synthetic data, in this browser only. Nothing here sends email, texts or calls:
   it prepares text the owner posts or sends personally, or queues a request the assistant turns into a Gmail DRAFT. */
(function () {
  var T = window.TTGR_TEXT, C = window.TTGR_CONFIG || {};
  var KEY = 'ttgr.k', DKEY = 'ttgr.demo';
  var q = new URLSearchParams(location.search), DEMO = q.get('demo') === '1';
  var token = null;
  try {
    var u = new URL(location.href), k = u.searchParams.get('k');
    if (k) { localStorage.setItem(KEY, k); u.searchParams.delete('k'); history.replaceState(null, '', u.pathname + u.search + u.hash); }
    token = localStorage.getItem(KEY);
  } catch (e) {}
  var S = null, app = document.getElementById('app'), openMore = false, showUnfit = {};

  /* ---------- helpers ---------- */
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function first(n) { return String(n || '').split(' ')[0]; }
  function J(s, d) { try { return s ? (typeof s === 'string' ? JSON.parse(s) : s) : d; } catch (e) { return d; } }
  function pd(s) { if (!s) return null; var x = new Date(String(s).length <= 10 ? s + 'T12:00' : s); return isNaN(x) ? null : x; }
  function when(s) { var x = pd(s); if (!x) return ''; var t = new Date(), y = new Date(t); y.setDate(t.getDate() + 1);
    var day = x.toDateString() === t.toDateString() ? 'Today' : x.toDateString() === y.toDateString() ? 'Tomorrow' : x.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    return day + ' ' + x.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }).replace(':00', '').replace(' ', '').toLowerCase(); }
  function daysSince(s) { var x = pd(s); return x ? Math.floor((Date.now() - x) / 864e5) : 0; }
  function needBy(code) { return S.needs.filter(function (n) { return n.code === code; })[0]; }
  function personBy(id) { return S.people.filter(function (p) { return p.id === id; })[0]; }
  function ivFor(pid) { var a = S.interviews.filter(function (i) { return i.person_id === pid; }); return a[a.length - 1]; }
  function queued(kind, pid) { return S.queue.filter(function (x) { return x.kind === kind && x.person_id === pid && x.status !== 'done'; })[0]; }
  function line() { return S.line || '[TTG line]'; }
  function toast(m) { var t = document.getElementById('toast'); t.textContent = m; t.className = 'show'; clearTimeout(toast.t); toast.t = setTimeout(function () { t.className = ''; }, 2600); }
  function copy(text) {
    (navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject()).then(function () { toast('Copied'); }, function () {
      var a = document.createElement('textarea'); a.value = text; document.body.appendChild(a); a.select(); try { document.execCommand('copy'); toast('Copied'); } catch (e) {} a.remove(); });
  }
  function qrSvg(text, cell) { var qr = qrcode(0, 'M'); qr.addData(text); qr.make(); return qr.createSvgTag(cell || 4, 8); }
  function qrText(n) { var d = String(S.line || '').replace(/[^\d+]/g, ''); return d ? 'SMSTO:' + d + ':' + n.code : n.code; }

  /* ---------- data layer ---------- */
  function call(action, args) {
    if (DEMO) return Promise.resolve(demoAct(action, args || []));
    return fetch(C.API_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, redirect: 'follow',
      body: JSON.stringify({ k: token, action: action, args: args || [] }) })
      .then(function (r) { if (!r.ok) { var e = new Error('HTTP ' + r.status); e.status = r.status; throw e; } return r.json(); })
      .then(function (j) { if (!j.ok) { var e = new Error(j.error || 'Error'); e.status = j.status; throw e; } return j.result; });
  }
  function act(action, args, msg) {
    return call(action, args).then(function (r) { return load(true).then(function () { if (msg) toast(msg); return r; }); })
      .catch(function (e) { toast(e.message || 'Something went wrong'); throw e; });
  }
  function load(quiet) {
    if (!quiet) app.innerHTML = '<p class="muted pad">Loading\u2026</p>';
    return call('getAll').then(function (d) { S = d; render(); }).catch(function (e) { gate(e); });
  }
  /* demo store (this browser only) */
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
    out.push(p.role === n.role ? { s: 'ok', t: p.role } : { s: 'no', t: (p.role || '?') + ' (need ' + (n.role || '?') + ')' });
    out.push(p.cred_status === 'verified' ? { s: 'ok', t: (p.credential || 'Credential') + ' checked' } : p.cred_status === 'not_found' ? { s: 'no', t: (p.credential || 'Credential') + ' not found' } : { s: 'q', t: (p.credential || 'Credential') + ' not checked yet' });
    out.push(String(p.boroughs || '').indexOf(n.borough) >= 0 ? { s: 'ok', t: n.borough } : { s: 'no', t: 'Not ' + (n.borough || '?') + ' (' + (p.boroughs || '?') + ')' });
    out.push(m.hours === true ? { s: 'ok', t: 'Hours fit' } : m.hours === false ? { s: 'no', t: 'Hours don\u2019t fit (' + (p.availability || '?') + ')' } : { s: 'q', t: 'Hours: ' + (p.availability || '?') });
    return out;
  }
  function fits(p) { return !checks(p).some(function (c) { return c.s === 'no'; }); }
  function unknowns(p) { return checks(p).filter(function (c) { return c.s === 'q'; }).length; }
  function ranked(list) { return list.slice().sort(function (a, b) { return unknowns(a) - unknowns(b) || String(a.created).localeCompare(String(b.created)); }); }
  function chk(c) { return '<li class="c-' + c.s + '"><span>' + (c.s === 'ok' ? '\u2713' : c.s === 'no' ? '\u2715' : '?') + '</span>' + esc(c.t) + '</li>'; }

  /* ---------- "Needs you" ---------- */
  function needsYou() {
    var items = [], now = Date.now();
    S.interviews.forEach(function (iv) {
      var p = personBy(iv.person_id); if (!p || p.stage !== 'interview') return;
      var t = pd(iv.when);
      if (iv.status === 'scheduled' && t && t - now < 864e5 && t - now > -36e5) items.push({ r: 1, key: 'iv:' + iv.id, sig: iv.when, title: 'Interview ' + when(iv.when) + ' \u00b7 ' + p.name, sub: 'I\u2019ll call them, then bring you in.', btn: 'Open', go: '#/person/' + p.id });
      else if (iv.status === 'call_now') items.push({ r: 0, key: 'now:' + iv.id, sig: 'x', title: 'Call ' + p.name + ' now', sub: 'They asked not to record. Call them yourself.', btn: 'Call', go: 'tel:' + String(p.phone || '').replace(/[^\d+]/g, '') });
      else if (iv.status === 'done') items.push({ r: 2, key: 'dec:' + p.id, sig: 'done', title: 'Decide on ' + p.name, sub: 'Interview notes are ready.', btn: 'Open', go: '#/person/' + p.id });
      else if (iv.status === 'to_schedule' && !queued('call_schedule', p.id) && !queued('draft_invite', p.id)) items.push({ r: 5, key: 'sch:' + p.id, sig: 'x', title: 'Set up interview \u00b7 ' + p.name, sub: 'I\u2019ll call to set it up with your free times.', btn: 'Open', go: '#/person/' + p.id });
    });
    S.people.forEach(function (p) { if (p.stage === 'hired' && !queued('draft_welcome', p.id)) items.push({ r: 3, key: 'wel:' + p.id, sig: 'x', title: 'Welcome ' + p.name, sub: 'Packet is ready to draft.', btn: 'Open', go: '#/person/' + p.id }); });
    S.needs.forEach(function (n) {
      if (n.status === 'filled' || n.status === 'closed') return;
      var app = S.people.filter(function (p) { return p.need_code === n.code && p.stage === 'applicant'; }), fit = app.filter(fits);
      var label = n.code + ' \u00b7 ' + n.role + (n.student ? ' for ' + n.student : '');
      if (fit.length) items.push({ r: 4, key: 'fit:' + n.code, sig: String(fit.length), title: fit.length + ' new fit' + (fit.length > 1 ? 's' : '') + ' \u00b7 ' + label, sub: n.borough + ' \u00b7 ' + T.sched(n), btn: 'Review', go: '#/need/' + n.id });
      if (n.status === 'open') items.push({ r: 6, key: 'post:' + n.code, sig: n.jd ? 'jd' : 'new', title: (n.jd ? 'Post ' : 'Write the post \u00b7 ') + label, sub: n.jd ? '5 versions ready to copy.' : 'I drafted it; check and save.', btn: n.jd ? 'Post' : 'Start', go: '#/need/' + n.id });
      var posted = Object.values(J(n.posted, {})).sort()[0];
      if (n.status === 'posted' && posted && daysSince(posted) >= 5 && !S.people.some(function (p) { return p.need_code === n.code; })) items.push({ r: 7, key: 'dry:' + n.code, sig: String(Math.floor(daysSince(posted) / 5)), title: 'No one yet \u00b7 ' + label, sub: daysSince(posted) + ' days since posting. Try another site?', btn: 'Post more', go: '#/need/' + n.id });
    });
    var dis = {}; (S.dismissed || []).forEach(function (d) { dis[d.key + '|' + d.sig] = 1; });
    return items.filter(function (i) { return !dis[i.key + '|' + i.sig]; }).sort(function (a, b) { return a.r - b.r; });
  }
  function counts() {
    var c = { need: 0, posting: 0, applicants: 0, interviews: 0, welcome: 0 };
    S.needs.forEach(function (n) { if (n.status === 'open') c.need++; else if (n.status === 'posted') c.posting++; });
    S.people.forEach(function (p) { if (p.stage === 'applicant' || p.stage === 'maybe') c.applicants++; else if (p.stage === 'interview') c.interviews++; else if (p.stage === 'hired') c.welcome++; });
    return c;
  }
  var STAGES = [['need', 'Need'], ['posting', 'Posting'], ['applicants', 'Applicants'], ['interviews', 'Interviews'], ['welcome', 'Welcome']];
  function strip(active) {
    var c = counts();
    return '<nav class="strip">' + STAGES.map(function (s) { return '<a href="#/stage/' + s[0] + '" class="' + (active === s[0] ? 'on' : '') + '"><b>' + c[s[0]] + '</b><span>' + s[1] + '</span></a>'; }).join('<i>\u203a</i>') + '</nav>';
  }
  function top(title, back) {
    return '<header class="top">' + (back ? '<a class="back" href="' + back + '" aria-label="Back">\u2039</a>' : '') + '<h1>' + esc(title) + '</h1>' + (DEMO ? '<span class="tag">Demo</span>' : '') + '</header>';
  }

  /* ---------- views ---------- */
  function home() {
    var it = needsYou(), shown = openMore ? it : it.slice(0, 5);
    return top('Recruiting') + strip() +
      '<section><h2>Needs you</h2>' + (it.length ? '<ol class="ny">' + shown.map(function (i) {
        return '<li><a href="' + i.go + '"><b>' + esc(i.title) + '</b><small>' + esc(i.sub) + '</small></a><a class="btn sm" href="' + i.go + '">' + esc(i.btn) + '</a><button class="x" data-dismiss="' + esc(i.key) + '" data-sig="' + esc(i.sig) + '" aria-label="Hide">\u00d7</button></li>';
      }).join('') + '</ol>' + (it.length > 5 && !openMore ? '<button class="link" data-act="more">' + (it.length - 5) + ' more</button>' : '') : '<p class="muted">All clear. Nothing needs you right now.</p>') +
      '</section><a class="btn wide" href="#/new">+ New need</a>' + foot();
  }
  function foot() { return '<footer>' + (DEMO ? 'Demo data is made up. <button class="link" data-act="reset">Reset demo</button>' : 'Private \u00b7 Together They Grow') + '</footer>'; }
  function needRow(n) {
    var ap = S.people.filter(function (p) { return p.need_code === n.code && p.stage !== 'pass'; }), posted = Object.keys(J(n.posted, {}));
    return '<li><a href="#/need/' + n.id + '"><b>' + esc(n.code + ' \u00b7 ' + n.role + (n.student ? ' for ' + n.student : '')) + '</b><small>' + esc(n.borough + ' \u00b7 ' + T.sched(n)) + '</small><small>' +
      (n.status === 'open' ? (n.jd ? 'Post ready' : 'Post not written') : 'On ' + posted.length + ' site' + (posted.length === 1 ? '' : 's') + ' \u00b7 ' + ap.length + ' applicant' + (ap.length === 1 ? '' : 's')) + '</small></a></li>';
  }
  function personRow(p) {
    var c = checks(p), iv = ivFor(p.id), sub = p.stage === 'interview' && iv ? (iv.status === 'scheduled' ? 'Interview ' + when(iv.when) : iv.status === 'done' ? 'Interviewed \u00b7 decide' : iv.status === 'call_now' ? 'Call them now (no recording)' : queued('call_schedule', p.id) ? 'Set-up call queued' : 'Interview not set up yet') : p.stage === 'hired' ? (queued('draft_welcome', p.id) ? 'Welcome draft requested' : 'Welcome packet to draft') : (p.fit_summary || '');
    return '<li><a href="#/person/' + p.id + '"><b>' + esc(p.name) + (p.stage === 'maybe' ? ' <em class="maybe">maybe</em>' : '') + '</b><small>' + esc(p.role + ' \u00b7 ' + p.need_code + ' \u00b7 ' + p.source) + '</small><small>' + esc(sub) + '</small><ul class="facts mini">' + c.map(chk).join('') + '</ul></a></li>';
  }
  function stage(s) {
    var h = top(STAGES.filter(function (x) { return x[0] === s; })[0][1], '#/') + strip(s), list;
    if (s === 'need' || s === 'posting') {
      list = S.needs.filter(function (n) { return n.status === (s === 'need' ? 'open' : 'posted'); });
      h += '<ul class="rows">' + list.map(needRow).join('') + '</ul>' + (list.length ? '' : '<p class="muted pad">None right now.</p>') + (s === 'need' ? '<a class="btn wide" href="#/new">+ New need</a>' : '');
    } else if (s === 'applicants') {
      var groups = S.needs.filter(function (n) { return S.people.some(function (p) { return p.need_code === n.code && (p.stage === 'applicant' || p.stage === 'maybe'); }); });
      h += groups.map(function (n) { return applicantsBlock(n); }).join('') || '<p class="muted pad">No applicants waiting.</p>';
    } else {
      list = S.people.filter(function (p) { return p.stage === (s === 'interviews' ? 'interview' : 'hired'); });
      h += '<ul class="rows">' + list.map(personRow).join('') + '</ul>' + (list.length ? '' : '<p class="muted pad">None right now.</p>');
      if (s === 'interviews' && S.queue.some(function (x) { return x.status === 'waiting_approval'; })) h += '<p class="note">Calls are queued but off. They start once you approve calling in Bland.</p>';
    }
    return h + foot();
  }
  function applicantsBlock(n) {
    var all = S.people.filter(function (p) { return p.need_code === n.code && (p.stage === 'applicant' || p.stage === 'maybe'); });
    var fit = ranked(all.filter(fits)), no = all.filter(function (p) { return !fits(p); });
    return '<section><h2>' + esc(n.code + ' \u00b7 ' + n.role + ' \u00b7 ' + n.borough) + '</h2><ul class="rows">' + fit.map(personRow).join('') + '</ul>' + (fit.length ? '' : '<p class="muted">No fits yet.</p>') +
      (no.length ? (showUnfit[n.code] ? '<p class="muted small">Didn\u2019t fit a must-have:</p><ul class="rows dim">' + no.map(personRow).join('') + '</ul>' : '<button class="link" data-unfit="' + esc(n.code) + '">' + no.length + ' didn\u2019t fit \u00b7 show</button>') : '') +
      '<p class="muted small">Sorted by must-haves met. Facts only; you decide.</p></section>';
  }
  function needPage(id) {
    var n = S.needs.filter(function (x) { return x.id === id; })[0]; if (!n) return top('Not found', '#/');
    var text = n.jd || T.jd(n, line()), v = T.versions(n, text, line()), posted = J(n.posted, {}), r = T.R[n.role] || T.R.RBT;
    var order = r.boards;
    var h = top(n.code + ' \u00b7 ' + n.role, '#/') +
      '<section class="head"><div><p class="big">' + esc((n.student ? n.student + ' \u00b7 ' : '') + n.borough) + '</p><p>' + esc(T.sched(n)) + (n.hrs_week ? ' \u00b7 ' + esc(n.hrs_week) + ' hrs/wk' : '') + '</p><p>Start ' + esc(T.fmtDate(n.start)) + '</p></div><div class="qr" title="Scan to text ' + esc(n.code) + '">' + qrSvg(qrText(n), 3) + '<small>' + esc(n.code) + '</small></div></section>' +
      '<section><h2>1 \u00b7 Job post</h2><textarea id="jd" rows="14">' + esc(text) + '</textarea>' +
      (v.pay ? '' : '<p class="warn">Type the pay range on the \u201cPay:\u201d line before posting. NYC law requires a pay range in job ads.</p>') +
      '<div class="row"><button class="btn" data-act="savejd" data-id="' + n.id + '">Save</button><button class="btn ghost" data-act="resetjd" data-id="' + n.id + '">Start over</button></div></section>' +
      '<section><h2>2 \u00b7 Post it</h2><ul class="chan">' + order.map(function (k) {
        var c = T.CHANNELS[k], url = k === 'community' ? 'https://wa.me/?text=' + encodeURIComponent(v.text[k]) : c.url;
        return '<li><details><summary><b>' + esc(c.name) + '</b>' + (posted[k] ? '<span class="ok">\u2713 ' + esc(when(posted[k])) + '</span>' : '') + '</summary><pre>' + esc(v.text[k]) + '</pre></details><div class="row"><button class="btn sm" data-copy="' + k + '">Copy</button><a class="btn sm ghost" target="_blank" rel="noopener" href="' + esc(url) + '">' + (k === 'community' ? 'WhatsApp' : 'Open site') + '</a>' + (k === 'community' ? '<a class="btn sm ghost" href="#/flyer/' + n.id + '">Flyer</a>' : '') + (posted[k] ? '' : '<button class="btn sm ghost" data-posted="' + k + '" data-id="' + n.id + '">Posted</button>') + '</div></li>';
      }).join('') + '</ul><div class="row"><a class="btn ghost" href="sms:?&body=' + encodeURIComponent(T.referralAsk(n, line())) + '">Text a referral ask</a><button class="btn ghost" data-act="outreach" data-code="' + esc(n.code) + '">Email past applicants</button></div>' +
      '<p class="muted small">Posting is by you: copy, open the site, paste. Emails become Gmail drafts you send.</p></section>';
    h += applicantsBlock(n).replace('<h2>', '<h2>3 \u00b7 Applicants \u00b7 ');
    return h + (n.status !== 'filled' ? '<button class="link" data-act="fill" data-id="' + n.id + '">Mark this need filled</button>' : '<p class="muted">Filled.</p>') + foot();
  }
  function verifyLinks(p) {
    var r = T.R[p.role] || {}, out = [];
    if (r.verify === 'bacb' || r.verify === 'both') out.push(T.VERIFY.bacb);
    if (r.verify === 'nysed' || r.verify === 'both') out.push(T.VERIFY.nysed);
    return out.map(function (x) { return '<a class="btn sm ghost" target="_blank" rel="noopener" href="' + x.url + '">' + x.name + '</a>'; }).join('');
  }
  function freeTimes() { var now = Date.now(); return (S.freeTimes || []).filter(function (f) { var t = pd(f.start); return t && t > now; }).slice(0, 3).map(function (f) { return when(f.start); }); }
  function personPage(id) {
    var p = personBy(id); if (!p) return top('Not found', '#/');
    var n = needBy(p.need_code) || {}, iv = ivFor(p.id);
    var h = top(p.name, n.id ? '#/need/' + n.id : '#/') +
      '<section class="head"><div><p class="big">' + esc(p.role + ' \u00b7 ' + (n.code || p.need_code) + (n.student ? ' for ' + n.student : '')) + '</p><p>' + esc(p.source) + '</p><p>' + (p.phone ? '<a href="tel:' + esc(p.phone) + '">' + esc(p.phone) + '</a>' : '') + (p.email ? ' \u00b7 <a href="mailto:' + esc(p.email) + '">' + esc(p.email) + '</a>' : '') + '</p></div></section>' +
      '<section><h2>Must-haves</h2><ul class="facts">' + checks(p).map(chk).join('') + '</ul>' +
      '<div class="row">' + verifyLinks(p) + (p.cred_status !== 'verified' ? '<button class="btn sm ghost" data-cred="verified" data-id="' + p.id + '">I checked: valid</button>' : '') + (p.cred_status !== 'not_found' ? '<button class="btn sm ghost" data-cred="not_found" data-id="' + p.id + '">Not found</button>' : '') + '</div></section>' +
      '<section><h2>Fit</h2><p>' + esc(p.fit_summary || 'No summary yet.') + '</p><p class="muted small">Available: ' + esc(p.availability || '?') + ' \u00b7 ' + esc(p.boroughs || '') + '</p>' + (p.resume_url ? '<a class="btn sm ghost" target="_blank" rel="noopener" href="' + esc(p.resume_url) + '">Resume</a>' : '<p class="muted small">No resume yet.</p>') + '</section>';
    if (p.stage === 'applicant' || p.stage === 'maybe') {
      h += '<div class="decide"><button class="btn" data-decide="interview" data-id="' + p.id + '">Interview</button><button class="btn ghost" data-decide="maybe" data-id="' + p.id + '">Maybe</button><button class="btn red" data-decide="pass" data-id="' + p.id + '">Pass</button></div>';
    } else if (p.stage === 'interview' && iv) {
      h += '<section><h2>Interview</h2>' + interviewBlock(p, iv) + '</section>';
    } else if (p.stage === 'hired') {
      h += welcomeBlock(p);
    } else if (p.stage === 'welcome') {
      h += '<p class="muted pad">Welcomed.</p>';
    } else if (p.stage === 'pass') {
      h += '<p class="muted pad">Passed. <button class="link" data-decide="applicant" data-id="' + p.id + '">Undo</button></p>';
    }
    return h + foot();
  }
  function interviewBlock(p, iv) {
    var times = freeTimes(), qs = queued('call_schedule', p.id), qi = queued('call_interview', p.id), di = queued('draft_invite', p.id);
    if (iv.status === 'done') {
      var s = J(iv.summary, {}), rows = [['Summary', s.summary], ['Credentials', s.credentials], ['Experience', s.experience], ['Availability', s.availability], ['Strengths', s.strengths], ['Concerns', s.concerns], ['Follow-ups', s.follow_ups]];
      return '<p class="muted small">' + esc(when(iv.when)) + ' \u00b7 Recording ' + (iv.consent === 'yes' ? 'agreed' : 'not agreed, not recorded') + '</p><dl class="sum">' + rows.filter(function (r) { return r[1]; }).map(function (r) { return '<dt>' + r[0] + '</dt><dd>' + esc(r[1]) + '</dd>'; }).join('') + '</dl>' +
        '<div class="decide"><button class="btn" data-decide="hire" data-id="' + p.id + '">Hire</button><button class="btn red" data-decide="pass" data-id="' + p.id + '">Pass</button></div>';
    }
    if (iv.status === 'call_now') return '<p class="big">Call ' + esc(first(p.name)) + ' now</p><p>They asked not to record, so I hung up. Nothing was saved.</p><a class="btn wide" href="tel:' + esc(p.phone) + '">Call ' + esc(p.phone) + '</a><div class="decide"><button class="btn" data-decide="hire" data-id="' + p.id + '">Hire</button><button class="btn red" data-decide="pass" data-id="' + p.id + '">Pass</button></div>';
    if (iv.status === 'scheduled') {
      return '<p class="big">' + esc(when(iv.when)) + '</p><p>At that time I\u2019ll call ' + esc(first(p.name)) + ', confirm they agree to recording, then connect you. If they say no, I hang up and you call them.</p>' +
        (qi ? '<p class="note">Interview call queued. It waits until you approve calling.</p>' : '<button class="btn" data-act="ivcall" data-id="' + p.id + '" data-iv="' + iv.id + '">Use the assistant for this call</button>') +
        '<p class="muted small">Or just call them yourself: <a href="tel:' + esc(p.phone) + '">' + esc(p.phone) + '</a></p>' + setTime(iv);
    }
    return '<p>Your free times: ' + (times.length ? esc(times.join(' \u00b7 ')) : '<span class="muted">none loaded yet</span>') + '</p>' +
      (qs ? '<p class="note">I\u2019ll call ' + esc(first(p.name)) + ' to set it up once you approve calling.</p>' : '<button class="btn wide" data-act="schedcall" data-id="' + p.id + '" data-iv="' + iv.id + '">I\u2019ll call to set it up</button>') +
      '<div class="row"><a class="btn sm ghost" href="sms:' + esc(String(p.phone || '').replace(/[^\d+]/g, '')) + '?&body=' + encodeURIComponent(T.timesText(first(p.name), times.length ? times : ['[time 1]', '[time 2]'], S.me)) + '">Text times</a>' + (di ? '<span class="ok">Email draft requested</span>' : '<button class="btn sm ghost" data-act="invite" data-id="' + p.id + '">Email times (draft)</button>') + '</div>' + setTime(iv);
  }
  function setTime(iv) { return '<details class="set"><summary>Set the time myself</summary><div class="row"><input type="datetime-local" id="ivt" value="' + esc(iv.when || '') + '"><button class="btn sm" data-act="settime" data-iv="' + iv.id + '">Save</button></div></details>'; }
  function welcomeBlock(p) {
    var P = T.PACKET, contract = P.contract[p.role], extra = P.extra[p.role], qd = queued('draft_welcome', p.id);
    var att = [contract || 'Contract: you pick (no clean template for ' + p.role + ' yet)'].concat(P.common).concat(extra ? [extra] : []);
    return '<section><h2>Welcome packet</h2><p class="muted small">Attachments in the draft</p><ul class="facts">' + att.map(function (a, i) { return chk({ s: i === 0 && !contract ? 'q' : 'ok', t: a }); }).join('') + '</ul>' +
      '<p class="muted small">They send back</p><ul class="facts">' + P.askBack(p.role).map(function (a) { return chk({ s: 'q', t: a }); }).join('') + '</ul>' +
      '<p class="note">You type the rate in the draft. Bank and direct-deposit forms go straight to billing, never here.</p>' +
      (qd ? '<p class="ok big">\u2713 Draft requested. It\u2019ll be in your Gmail drafts; nothing is sent.</p><button class="btn ghost wide" data-decide="welcome" data-id="' + p.id + '">I sent it: mark welcomed</button>' : '<button class="btn wide" data-act="welcome" data-id="' + p.id + '">Make welcome draft</button>') + '</section>';
  }
  function newNeed() {
    var roles = Object.keys(T.R), boros = ['Queens', 'Brooklyn', 'Manhattan', 'Bronx', 'Staten Island'], days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    function chips(name, arr, multi) { return '<div class="chips" data-name="' + name + '"' + (multi ? ' data-multi="1"' : '') + '>' + arr.map(function (x) { return '<button type="button" data-v="' + esc(x) + '">' + esc(x) + '</button>'; }).join('') + '</div>'; }
    return top('New need', '#/') + '<form id="nf" class="form"><label>Role</label>' + chips('role', roles) + '<label>Borough</label>' + chips('borough', boros) +
      '<label>Days</label>' + chips('days', days, true) + '<div class="two"><div><label for="from">From</label><input id="from" type="time" value="15:00"></div><div><label for="to">To</label><input id="to" type="time" value="18:00"></div></div>' +
      '<div class="two"><div><label for="start">Start</label><input id="start" type="date"></div><div><label for="hrs">Hours / week</label><input id="hrs" type="number" min="1" max="40"></div></div>' +
      '<label for="stu">Student (first name or initials)</label><input id="stu" maxlength="20" autocomplete="off"><label for="notes">Notes (optional)</label><input id="notes" maxlength="120" autocomplete="off">' +
      '<button class="btn wide" type="submit">Save and write the post</button></form>';
  }
  function flyer(id) {
    var n = S.needs.filter(function (x) { return x.id === id; })[0]; if (!n) return top('Not found', '#/');
    var v = T.versions(n, n.jd || T.jd(n, line()), line()), r = T.R[n.role] || T.R.RBT;
    return '<div class="flyer"><a class="back noprint" href="#/need/' + n.id + '">\u2039 Back</a><p class="org">Together They Grow</p><h1>' + esc(r.short) + ' wanted</h1><p class="big">' + esc(n.borough + ' \u00b7 ' + T.sched(n)) + '</p><ul>' + r.musts.map(function (m) { return '<li>' + esc(m) + '</li>'; }).join('') + '</ul>' +
      '<p class="big">' + (v.pay ? 'Pay: ' + esc(v.pay) : '<span class="warn">Pay: type it on the job post first</span>') + '</p><div class="qr big">' + qrSvg(qrText(n), 7) + '</div><p class="big">Scan, or text <b>' + esc(n.code) + '</b> to ' + esc(line()) + '</p><button class="btn noprint" onclick="print()">Print</button></div>';
  }
  function gate(e) {
    var msg = !token ? 'This is a private app. Open it from your personal link.' : e && (e.status === 401 || e.status === 403) && /HTTP/.test(e.message) ? 'The server isn\u2019t switched on yet (one-time setup), or this link was replaced.' : e && e.status === 401 ? 'This link isn\u2019t valid anymore.' : 'Can\u2019t reach the server. Check your connection. (If this is the first time, the one-time setup isn\u2019t finished yet.)';
    app.innerHTML = top('Recruiting') + '<section class="pad"><p>' + esc(msg) + '</p><div class="row"><button class="btn" data-act="retry">Try again</button><a class="btn ghost" href="?demo=1">See the demo</a></div></section>';
  }

  /* ---------- router ---------- */
  function render() {
    if (!S) return;
    var h = location.hash.replace(/^#\/?/, '').split('/'), v;
    if (h[0] === 'stage') v = stage(h[1]);
    else if (h[0] === 'need') v = needPage(h[1]);
    else if (h[0] === 'person') v = personPage(h[1]);
    else if (h[0] === 'new') v = newNeed();
    else if (h[0] === 'flyer') v = flyer(h[1]);
    else v = home();
    app.innerHTML = v; document.body.classList.toggle('print', h[0] === 'flyer');
  }
  window.addEventListener('hashchange', function () { document.getElementById('toast').className = ''; render(); window.scrollTo(0, 0); });

  /* ---------- events ---------- */
  document.addEventListener('click', function (ev) {
    var b = ev.target.closest('button, [data-v]'); if (!b) return;
    var d = b.dataset, id = d.id;
    if (b.closest('.chips') && d.v) { var box = b.closest('.chips'); if (!box.dataset.multi) box.querySelectorAll('button').forEach(function (x) { x.classList.remove('on'); }); b.classList.toggle('on'); return; }
    if (d.dismiss) { b.closest('li').remove(); act('dismiss', [d.dismiss, d.sig], 'Hidden'); return; }
    if (d.unfit) { showUnfit[d.unfit] = 1; render(); return; }
    if (d.copy) { var n = S.needs.filter(function (x) { return x.id === location.hash.split('/')[2]; })[0]; var txt = document.getElementById('jd').value; copy(T.versions(n, txt, line()).text[d.copy]); return; }
    if (d.posted) { act('markPosted', [id, d.posted], 'Marked posted'); return; }
    if (d.decide) { var p = personBy(id); act('decide', [id, d.decide], { interview: 'Moved to interviews', maybe: 'Saved as maybe', pass: 'Passed', hire: 'Hired. Welcome packet is next.', welcome: 'Marked welcomed', applicant: 'Back in applicants' }[d.decide]).then(function () { if (d.decide === 'pass' || d.decide === 'maybe') location.hash = '#/need/' + ((needBy(p.need_code) || {}).id || ''); }); return; }
    if (d.cred) { act('setCred', [id, d.cred], 'Saved'); return; }
    var a = d.act; if (!a) return;
    if (a === 'more') { openMore = true; render(); }
    else if (a === 'reset') { localStorage.removeItem(DKEY); D = null; load(); }
    else if (a === 'retry') load();
    else if (a === 'savejd') act('updateNeed', [id, { jd: document.getElementById('jd').value }], 'Saved');
    else if (a === 'resetjd') { var nn = S.needs.filter(function (x) { return x.id === id; })[0]; document.getElementById('jd').value = T.jd(nn, line()); toast('Fresh draft. Save to keep it.'); }
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
    function pick(n) { return Array.prototype.map.call(document.querySelectorAll('.chips[data-name="' + n + '"] .on'), function (b) { return b.dataset.v; }); }
    var role = pick('role')[0], boro = pick('borough')[0], days = pick('days');
    if (!role || !boro || !days.length) return toast('Pick role, borough and days');
    var g = function (i) { return document.getElementById(i).value; };
    var need = { role: role, borough: boro, days: days.join(', '), from: g('from'), to: g('to'), start: g('start'), hrs_week: g('hrs'), student: g('stu'), notes: g('notes') };
    act('addNeed', [need]).then(function (r) { var jd = T.jd(r, line()); return act('updateNeed', [r.id, { jd: jd }], 'Saved. Check the post.').then(function () { location.hash = '#/need/' + r.id; }); });
  });

  if (!DEMO && !token) gate(); else load();
})();
