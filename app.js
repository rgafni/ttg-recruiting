/* TTG Recruiting app (v3). Real mode: talks to the private Apps Script API with the owner's link token
   (boot.js already moved ?k= into localStorage and stripped it from the URL).
   Demo mode (?demo=1): synthetic data, this browser only. Nothing here sends email, texts or calls:
   it prepares text the owner posts or sends personally, or queues a request the assistant turns into a Gmail DRAFT. */
(function () {
  var T = window.TTGR_TEXT, C = window.TTGR_CONFIG || {};
  var KEY = 'ttgr.k', DKEY = 'ttgr.demo4';
  var DEMO = new URLSearchParams(location.search).get('demo') === '1';
  var token = null; try { token = localStorage.getItem(KEY); } catch (e) {}
  var S = null, app = document.getElementById('app'), openMore = false, showUnfit = {}, installEvt = null, offline = false, loadErr = null, pending = 0;

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
    gear: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z', inbox: 'M22 12h-6l-2 3h-4l-2-3H2M5.5 5.1L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.5-6.9A2 2 0 0 0 16.8 4H7.2a2 2 0 0 0-1.7 1.1z', undo: 'M3 7v6h6M3 13a9 9 0 1 0 3-7.7L3 8', refresh: 'M23 4v6h-6M1 20v-6h6M3.5 9a9 9 0 0 1 14.9-3.4L23 10M1 14l4.6 4.4A9 9 0 0 0 20.5 15', wifi: 'M1 1l22 22M16.7 11.1A11 11 0 0 1 19 12.6M5 12.6a11 11 0 0 1 5.2-2.5M10.7 5.1A16 16 0 0 1 22.6 9M1.4 9a16 16 0 0 1 4.7-2.9M8.5 16.1a6 6 0 0 1 7 0M12 20h.01',
    print: 'M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z', share: 'M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13',
    home: 'M3 10.5L12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z', brief: 'M3 7h18v13H3zM8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 13h18',
    search: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3', pause: 'M8 5v14M16 5v14', play: 'M7 4l13 8-13 8z',
    star: 'M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z', mic: 'M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3zM19 10v2a7 7 0 0 1-14 0v-2M12 19v3',
    pulse: 'M22 12h-4l-3 9L9 3l-3 9H2', move: 'M5 12h14M13 6l6 6-6 6', list: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01'
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
  function ivFor(pid) { var a = S.interviews.filter(function (i) { return i.person_id === pid && i.status !== 'cancelled'; }); return a[a.length - 1]; }
  /* Latest request of this kind for this person (any status except cancelled). */
  function queued(kind, pid, code) { var a = S.queue.filter(function (x) { return x.kind === kind && (pid ? x.person_id === pid : x.need_code === code) && x.status !== 'cancelled'; }); return a[a.length - 1]; }
  function line() { return S.line || '[TTG line]'; }
  function settings() { return S.settings || {}; }
  function calling() { return settings().calling === 'on'; }
  /* How applicants apply: by email until phone screening is approved and switched on. */
  function ap() { return calling() ? { mode: 'text', line: line() } : { mode: 'email', email: settings().apply_email || '' }; }
  function digits(s) { return String(s || '').replace(/[^\d+]/g, ''); }
  var undoFn = null;
  function toast(m, undo, err) {
    var t = document.getElementById('toast'); undoFn = undo || null;
    t.innerHTML = '<span>' + esc(m) + '</span>' + (undo ? '<button class="toast__btn" data-act="undo">' + ic('undo') + 'Undo</button>' : '') + (err ? '<button class="toast__btn" data-act="retry">Retry</button>' : '');
    t.className = 'toast show' + (err ? ' toast--err' : ''); toast.at = Date.now(); clearTimeout(toast.t);
    toast.t = setTimeout(function () { t.className = 'toast'; undoFn = null; }, undo ? 6000 : err ? 7000 : 2800);
  }
  function copy(text) {
    (navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject()).then(function () { toast('Copied. Paste it on the site.'); }, function () {
      var a = document.createElement('textarea'); a.value = text; document.body.appendChild(a); a.select(); try { document.execCommand('copy'); toast('Copied'); } catch (e) {} a.remove(); });
  }
  function qrSvg(text, cell) { var qr = qrcode(0, 'M'); qr.addData(text); qr.make(); return qr.createSvgTag(cell || 4, 8); }
  function qrText(n) { var a = ap(); if (a.mode === 'text') { var d = digits(a.line); return d ? 'SMSTO:' + d + ':' + n.code : n.code; } return a.email ? 'mailto:' + a.email + '?subject=' + encodeURIComponent(n.code + ' application') : n.code; }
  function needLabel(n) { return n.role + (n.area ? ' \u00b7 ' + n.area : n.student ? ' for ' + n.student : ''); }
  var ROLE_CHIPS = [['RBT', 'RBT'], ['BCBA', 'BCBA'], ['SETSS', 'SETSS'], ['Speech', 'SLP'], ['OT/PT', 'OT'], ['Para', 'Para']];

  /* ---------- data layer ---------- */
  var FAIL = { fail: true };
  function netErr(e) { var x = new Error(navigator.onLine === false ? 'You\u2019re offline' : 'Can\u2019t reach the server'); x.net = true; x.cause = e; return x; }
  /* Writes carry a request id (rid). If an answer is slow or lost, Retry sends the same rid and the server
     returns the first result instead of saving twice. */
  function rid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 10); }
  /* Google sometimes answers with a short-lived error page. A fast failure while online is retried twice; reads are safe
     and writes are safe because the rid makes the server return the first answer. A timeout is not retried. */
  function call(action, args, id) {
    if (DEMO) return new Promise(function (res, rej) { setTimeout(function () { try { res(demoAct(action, args || [])); } catch (e) { rej(e); } }, 60); });
    var tries = 0;
    function once() {
      return call1(action, args, id).catch(function (e) {
        if (tries++ < 2 && e.net && !e.timeout && navigator.onLine !== false) return new Promise(function (r) { setTimeout(r, 1200 * tries); }).then(once);
        throw e;
      });
    }
    return once();
  }
  function call1(action, args, id) {
    var ctl = window.AbortController ? new AbortController() : null, tm = setTimeout(function () { if (ctl) ctl.abort(); }, id ? 75000 : 45000);
    return fetch(C.API_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, redirect: 'follow', referrerPolicy: 'no-referrer', cache: 'no-store', credentials: 'omit',
      signal: ctl ? ctl.signal : undefined, body: JSON.stringify({ k: token, action: action, args: args || [], rid: id || undefined }) })
      .then(function (r) { if (!r.ok) { var e = new Error('Server error ' + r.status); e.status = r.status; throw e; } return r.json(); }, function (e) { var x = netErr(e); x.timeout = !!(ctl && ctl.signal.aborted); throw x; })
      .then(function (j) { clearTimeout(tm); if (!j.ok) { var e = new Error(j.error || 'Something went wrong'); e.status = j.status; throw e; } return j.result; },
            function (e) { clearTimeout(tm); throw e; });
  }
  function errMsg(e) { return e.timeout ? 'The server is slow to answer. Tap Retry. It never saves twice.' : e.net ? e.message + '. Nothing was saved.' : e.status === 401 ? 'Your link isn\u2019t valid anymore.' : e.status === 429 ? 'Too many taps at once. Wait a moment.' : (e.message || 'Something went wrong'); }
  var lastFail = null;
  /* Optimistic: apply the change on screen first, save, then refresh from the sheet. On failure: put it back and offer Retry.
     opt: { local(S), msg, undo: [action, args, localFn] } */
  function act(action, args, opt) {
    opt = opt || {}; opt.rid = opt.rid || rid(); var snap = JSON.stringify(S);
    if (opt.local) { try { opt.local(S); render(true); } catch (e) {} }
    busy(+1);
    return call(action, args, opt.rid).then(function (r) {
      busy(-1); offline = false;
      if (opt.msg) toast(opt.msg, opt.undo ? function () { act(opt.undo[0], opt.undo[1], { local: opt.undo[2], msg: 'Undone' }); } : null);
      return load(true).then(function () { return r; });
    }, function (e) {
      busy(-1); if (opt.local) { S = JSON.parse(snap); render(true); }
      if (e.net) offline = true;
      lastFail = function () { act(action, args, opt); }; toast(errMsg(e), null, true); return FAIL;
    });
  }
  function ok(fn) { return function (r) { if (r !== FAIL) return fn(r); }; }
  function busy(d) { pending = Math.max(0, pending + d); document.documentElement.classList.toggle('busy', pending > 0); }
  var seq = 0;
  /* Every load asks the sheet fresh; only the newest answer is used (an older, slower answer never overwrites a newer one). */
  function load(quiet) {
    if (!quiet || !S) app.innerHTML = skeleton();
    var my = ++seq; busy(+1);
    return call('getAll').then(function (d) { busy(-1); if (my !== seq) return; S = d; offline = false; loadErr = null; render(true); },
      function (e) { busy(-1); if (my !== seq) return; if (S && e.net) { offline = true; render(true); if (quiet) { lastFail = null; toast(navigator.onLine === false ? 'You\u2019re offline. Showing what was loaded before.' : 'Couldn\u2019t refresh from the sheet. Tap Retry.', null, true); } } else gate(e); });
  }
  var D = null;
  function dsave() { try { localStorage.setItem(DKEY, JSON.stringify(D)); } catch (e) {} }
  function dnow() { var x = new Date(); return x.getFullYear() + '-' + ('0' + (x.getMonth() + 1)).slice(-2) + '-' + ('0' + x.getDate()).slice(-2) + 'T' + ('0' + x.getHours()).slice(-2) + ':' + ('0' + x.getMinutes()).slice(-2); }
  function demoAct(a, g) {
    if (!D) { D = J(localStorage.getItem(DKEY), null) || window.TTGR_DEMO(); }
    D.settings = D.settings || { apply_email: 'jobs@example.org', calling: 'off' }; D.dismissed = D.dismissed || []; D.queue = D.queue || [];
    var r = true, id = function (p) { return p + Math.random().toString(36).slice(2, 8); };
    var find = function (t, i) { var x = D[t].filter(function (z) { return z.id === i; })[0]; if (!x) { var e = new Error('Not found'); e.status = 404; throw e; } return x; };
    var assign = function (x, p) { Object.keys(p || {}).forEach(function (k) { x[k] = p[k]; }); x.updated = dnow(); return x; };
    if (a === 'getAll') r = JSON.parse(JSON.stringify(D));
    else if (a === 'addNeed') { var n = g[0], code; do { code = n.borough.charAt(0) + (n.borough === 'Brooklyn' ? 'K' : '') + Math.floor(10 + Math.random() * 89); } while (D.needs.some(function (x) { return x.code === code; }));
      r = assign({ id: id('n'), code: code, status: 'open', jd: '', posted: '{}', created: dnow() }, n); D.needs.push(r); }
    else if (a === 'updateNeed') r = assign(find('needs', g[0]), g[1]);
    else if (a === 'markPosted' || a === 'unmarkPosted') { var y = find('needs', g[0]), p = J(y.posted, {}); if (a === 'markPosted') p[g[1]] = dnow(); else delete p[g[1]]; y.posted = JSON.stringify(p);
      if (y.status === 'open' && a === 'markPosted') y.status = 'posted'; if (y.status === 'posted' && !Object.keys(p).length) y.status = 'open'; }
    else if (a === 'addPerson') { r = assign({ id: id('p'), cred_status: 'unchecked', stage: 'applicant', source: g[0].source || 'Added by hand', created: dnow() }, g[0]);
      if ('hours_fit' in g[0]) r.musts = JSON.stringify({ hours: g[0].hours_fit }); delete r.hours_fit; D.people.push(r); }
    else if (a === 'updatePerson') { var up = find('people', g[0]); if ('timesheet' in g[1]) { g[1].timesheet_at = g[1].timesheet ? dnow() : ''; delete g[1].timesheet; } assign(up, g[1]); if ('hours_fit' in g[1]) up.musts = JSON.stringify({ hours: g[1].hours_fit }); delete up.hours_fit; }
    else if (a === 'decide') { var m = { interview: 'interview', maybe: 'maybe', offer: 'offer', pass: 'pass', hire: 'hired', welcome: 'welcome', applicant: 'applicant' }, pp = find('people', g[0]);
      pp.prev_stage = pp.stage; pp.stage = m[g[1]]; pp.decided_at = dnow();
      if (g[1] === 'interview' && !D.interviews.some(function (i) { return i.person_id === pp.id && i.status !== 'cancelled'; })) D.interviews.push({ id: id('i'), person_id: pp.id, need_code: pp.need_code, when: '', status: 'to_schedule', consent: '', summary: '' });
      if (g[1] === 'hire') { var nn = D.needs.filter(function (n) { return n.code === pp.need_code; })[0]; if (nn) nn.status = 'filled'; } }
    else if (a === 'undoDecide') { var pu = find('people', g[0]), back = pu.prev_stage || 'applicant';
      if (pu.stage === 'hired') { var nh = D.needs.filter(function (n) { return n.code === pu.need_code; })[0]; if (nh && nh.status === 'filled') nh.status = Object.keys(J(nh.posted, {})).length ? 'posted' : 'open'; }
      if (pu.stage === 'interview' && back !== 'interview') D.interviews.forEach(function (i) { if (i.person_id === pu.id && i.status === 'to_schedule') i.status = 'cancelled'; });
      pu.stage = back; pu.prev_stage = ''; }
    else if (a === 'queue') { r = D.queue.filter(function (q) { return q.kind === g[0] && q.person_id === (g[1] || '') && q.need_code === (g[2] || '') && ['done', 'cancelled', 'failed'].indexOf(q.status) < 0; })[0];
      if (!r) { r = { id: id('q'), at: dnow(), kind: g[0], person_id: g[1] || '', need_code: g[2] || '', payload: JSON.stringify(g[3] || {}), status: /^call_/.test(g[0]) ? 'waiting_approval' : 'queued', result: '' }; D.queue.push(r); } }
    else if (a === 'cancelQueue') assign(find('queue', g[0]), { status: 'cancelled' });
    else if (a === 'dismiss') D.dismissed.push({ key: g[0], sig: g[1], at: dnow() });
    else if (a === 'undismiss') D.dismissed = D.dismissed.filter(function (d) { return d.key !== g[0]; });
    else if (a === 'setInterview') { var iv = find('interviews', g[0]), pt = g[1];
      if ('notes' in pt) { var sm = J(iv.summary, {}); sm.summary = pt.notes; sm.by = 'you'; iv.summary = JSON.stringify(sm); }
      ['when', 'status'].forEach(function (k) { if (k in pt) iv[k] = pt[k]; }); r = iv; }
    else if (a === 'setCred') assign(find('people', g[0]), { cred_status: g[1], cred_checked: dnow() });
    else if (a === 'setSettings') { Object.keys(g[0]).forEach(function (k) { D.settings[k] = k === 'windows' ? JSON.stringify(g[0][k]) : g[0][k]; }); r = D.settings; }
    if (a !== 'getAll') dsave();
    return r;
  }

  /* ---------- facts, not scores (NYC Local Law 144) ---------- */
  function checks(p) {
    var n = needBy(p.need_code) || {}, m = J(p.musts, {}), out = [];
    out.push(!n.role ? { s: 'q', t: 'Not matched to a job' } : p.role === n.role ? { s: 'ok', t: p.role } : { s: 'no', t: (p.role || '?') + ', job is ' + n.role });
    out.push(p.cred_status === 'verified' ? { s: 'ok', t: (p.credential || 'Credential') + ' checked' } : p.cred_status === 'not_found' ? { s: 'no', t: (p.credential || 'Credential') + ' not found' } : { s: 'q', t: (p.credential || 'Credential') + ' not checked' });
    out.push(!n.borough || !p.boroughs ? { s: 'q', t: (n.borough || 'Borough') + ' unclear' } : String(p.boroughs).indexOf(n.borough) >= 0 ? { s: 'ok', t: n.borough } : { s: 'no', t: 'Not ' + n.borough });
    out.push(m.hours === true ? { s: 'ok', t: 'Hours fit' } : m.hours === false ? { s: 'no', t: 'Hours don\u2019t fit' } : { s: 'q', t: 'Hours unclear' });
    return out;
  }
  function fits(p) { return !checks(p).some(function (c) { return c.s === 'no'; }); }
  function unknowns(p) { return checks(p).filter(function (c) { return c.s === 'q'; }).length; }
  function ranked(list) { return list.slice().sort(function (a, b) { return unknowns(a) - unknowns(b) || String(a.created).localeCompare(String(b.created)); }); }
  var SI = { ok: 'check', no: 'x', q: 'q' };
  function fact(c) { return '<li class="fact fact--' + c.s + '">' + ic(SI[c.s]) + esc(c.t) + '</li>'; }
  function checkRow(c) { return '<li><span class="dot dot--' + c.s + '">' + ic(SI[c.s]) + '</span><span>' + esc(c.t) + '</span></li>'; }
  var ACTIVE = { review: 1, applicant: 1, maybe: 1 };

  /* ---------- assistant requests: real status from the Queue tab ---------- */
  var KIND = { draft_invite: 'Interview email draft', draft_outreach: 'Emails to past applicants', draft_welcome: 'Welcome packet draft', call_schedule: 'Set-up call', call_interview: 'Interview call' };
  function isGmail(u) { return /^https:\/\/mail\.google\.com\//.test(u || ''); }
  function qstatus(q) {
    if (!q) return '';
    var s = q.status, link = isGmail(q.result) ? '<a class="btn btn--ghost btn--sm" target="_blank" rel="noopener noreferrer" href="' + esc(q.result) + '">' + ic('ext') + 'Open in Gmail</a>' : '';
    var cancel = (s === 'queued' || s === 'waiting_approval') ? '<button class="linkbtn" data-cancelq="' + esc(q.id) + '">Cancel request</button>' : '';
    if (s === 'waiting_approval') return '<div class="qs qs--wait">' + ic('shield') + '<div class="grow"><b>Waiting for your OK to turn on calling</b><span>Nobody is called until you approve calling. You can call them yourself any time.</span>' + cancel + '</div></div>';
    if (s === 'queued' || s === 'working') return '<div class="qs qs--queued">' + ic('clock') + '<div class="grow"><b>Queued</b><span>The assistant makes this Gmail draft on its next run. Nothing is sent.</span>' + cancel + '</div></div>';
    if (s === 'done') return '<div class="qs qs--done">' + ic('check') + '<div class="grow"><b>' + (link ? 'Draft ready' : 'Done') + '</b><span>' + (link ? 'It\u2019s in your Gmail drafts. Check it, then send it yourself.' : esc(q.result || 'Finished.')) + '</span>' + link + '</div></div>';
    if (s === 'failed') return '<div class="qs qs--fail">' + ic('alert') + '<div class="grow"><b>Couldn\u2019t make it</b><span>' + esc(q.result || 'Ask again, or do it by hand.') + '</span></div></div>';
    return '';
  }
  function requests() {
    var l = S.queue.filter(function (q) { return q.status !== 'cancelled'; }).slice(-8).reverse();
    if (!l.length) return '';
    return '<section class="sec"><div class="sec__h"><h2>Assistant requests</h2><small>' + l.length + '</small></div><ul class="list">' + l.map(function (q) {
      var p = personBy(q.person_id), n = needBy(q.need_code), go = p ? '#/person/' + p.id : n ? '#/job/' + n.id : '';
      return '<li class="req"><div class="req__h"><span class="row__t">' + esc(KIND[q.kind] || q.kind) + '</span><span class="row__s">' + esc((p ? p.name : n ? n.code + ' \u00b7 ' + n.role : '') + ' \u00b7 ' + when(q.at)) + '</span>' + (go ? '<a class="linkbtn" href="' + go + '">Open</a>' : '') + '</div>' + qstatus(q) + '</li>';
    }).join('') + '</ul></section>';
  }

  /* ---------- derived state (v4) ---------- */
  var SEGS = [['new', 'New'], ['reviewing', 'Reviewing'], ['interview', 'Interview'], ['offer', 'Offer'], ['hired', 'Hired'], ['passed', 'Passed']];
  var SEG_OF = { review: 'new', applicant: 'new', maybe: 'reviewing', interview: 'interview', offer: 'offer', hired: 'hired', welcome: 'hired', pass: 'passed' };
  var SEG_DECIDE = { new: 'applicant', reviewing: 'maybe', interview: 'interview', offer: 'offer', hired: 'hire', passed: 'pass' };
  function segOf(p) { return SEG_OF[p.stage] || 'new'; }
  function segName(k) { return (SEGS.filter(function (x) { return x[0] === k; })[0] || ['', ''])[1]; }
  function liveJob(n) { return n.status === 'open' || n.status === 'posted'; }
  function jobStatus(n) {
    if (n.status === 'filled') return ['filled', 'Filled', 'green'];
    if (n.status === 'closed') return ['closed', 'Closed', 'grey'];
    if (n.status === 'paused') return ['paused', 'Paused', 'amber'];
    if (S.people.some(function (p) { return p.need_code === n.code && (p.stage === 'interview' || p.stage === 'offer'); })) return ['interviewing', 'Interviewing', 'blue'];
    if (Object.keys(J(n.posted, {})).length) return ['posted', 'Posted', 'green'];
    return ['draft', 'Draft', 'grey'];
  }
  function stChip(st) { return '<span class="st st--' + st[2] + '">' + esc(st[1]) + '</span>'; }
  function ivList() { return S.interviews.filter(function (i) { return i.status !== 'cancelled' && personBy(i.person_id); }); }
  function ivUpcoming(i) { var t = pd(i.when), p = personBy(i.person_id); if (!p || p.stage !== 'interview') return false; return i.status === 'to_schedule' || i.status === 'call_now' || (i.status === 'scheduled' && t && t.getTime() > Date.now() - 36e5); }
  function ivState(i) {
    var t = pd(i.when);
    if (i.status === 'done') return ['done', 'Done', 'blue'];
    if (i.status === 'call_now') return ['callnow', 'Call them now', 'red'];
    if (i.status === 'scheduled') return t && t.getTime() < Date.now() - 36e5 ? ['notes', 'Add notes', 'amber'] : ['confirmed', 'Confirmed', 'green'];
    var inv = queued('draft_invite', i.person_id), cs = queued('call_schedule', i.person_id);
    return inv || cs ? ['proposed', 'Times proposed', 'amber'] : ['toset', 'To set up', 'grey'];
  }
  function pipe() {
    var c = { jobs: 0, fresh: 0, review: 0, ivs: 0, offers: 0, hired: 0 }, m = new Date().toISOString().slice(0, 7);
    S.needs.forEach(function (n) { if (liveJob(n)) c.jobs++; });
    S.people.forEach(function (p) { var g = segOf(p); if (g === 'new') c.fresh++; else if (g === 'reviewing') c.review++; else if (g === 'offer') c.offers++;
      else if (g === 'hired' && String(p.decided_at || p.updated || p.created || '').slice(0, 7) === m) c.hired++; });
    ivList().forEach(function (i) { if (i.status === 'scheduled' && ivUpcoming(i)) c.ivs++; });
    return c;
  }

  /* ---------- "Needs you" ---------- */
  function needsYou() {
    var items = [], now = Date.now();
    S.interviews.forEach(function (iv) {
      var p = personBy(iv.person_id); if (!p || p.stage !== 'interview' || iv.status === 'cancelled') return;
      var t = pd(iv.when), go = '#/person/' + p.id;
      if (iv.status === 'call_now') items.push({ r: 0, icon: 'phone', tone: 'red', title: 'Call ' + first(p.name) + ' now', sub: 'They asked not to record. Call them yourself.', go: go, cta: 'Open', key: 'cn:' + iv.id, sig: iv.updated });
      else if (iv.status === 'scheduled' && t && t - now < 864e5 && t - now > -36e5) items.push({ r: 1, icon: 'clock', tone: 'red', title: 'Interview ' + when(iv.when), sub: p.name + (calling() ? ' \u00b7 I\u2019ll call, then bring you in' : ' \u00b7 you call them'), go: go, cta: 'Open', key: 'iv:' + iv.id, sig: iv.when });
      else if (iv.status === 'scheduled' && t && t - now <= -36e5) items.push({ r: 2, icon: 'pen', tone: 'blue', title: 'How did ' + first(p.name) + '\u2019s interview go?', sub: 'Add notes, then decide', go: go, cta: 'Notes', key: 'nt:' + iv.id, sig: iv.when });
      else if (iv.status === 'done') items.push({ r: 2, icon: 'check', tone: 'blue', title: 'Decide on ' + p.name, sub: 'Interview notes are in', go: go, cta: 'Decide', key: 'dc:' + iv.id, sig: iv.updated });
      else if (iv.status === 'to_schedule' && !queued('call_schedule', p.id) && !queued('draft_invite', p.id)) items.push({ r: 5, icon: 'cal', tone: 'blue', title: 'Set up interview with ' + first(p.name), sub: 'Send them your free times', go: go, cta: 'Set up', key: 'su:' + iv.id, sig: iv.status });
    });
    S.people.forEach(function (p) {
      var q = queued('draft_welcome', p.id);
      if (p.stage === 'offer') items.push({ r: 3, icon: 'star', tone: 'green', title: first(p.name) + ' has your offer', sub: 'Tap Hire when they say yes', go: '#/person/' + p.id, cta: 'Open', key: 'of:' + p.id, sig: p.decided_at });
      if (p.stage === 'hired' && !q) items.push({ r: 3, icon: 'gift', tone: 'green', title: 'Welcome ' + p.name, sub: 'Get the welcome packet drafted in Gmail', go: '#/person/' + p.id, cta: 'Open', key: 'wl:' + p.id, sig: p.stage });
      if (p.stage === 'hired' && q && q.status === 'done' && isGmail(q.result)) items.push({ r: 3, icon: 'mail', tone: 'green', title: 'Welcome draft ready \u00b7 ' + p.name, sub: 'Open it in Gmail, add the rate, send it', go: '#/person/' + p.id, cta: 'Open', key: 'wd:' + q.id, sig: q.status });
      if (ACTIVE[p.stage] && !needBy(p.need_code)) items.push({ r: 4, icon: 'inbox', tone: 'amber', title: 'Match ' + p.name + ' to a job', sub: 'From ' + (p.source || 'email') + ' \u00b7 no job picked', go: '#/person/' + p.id + '/edit', cta: 'Match', key: 'mt:' + p.id, sig: p.need_code });
    });
    S.needs.forEach(function (n) {
      if (!liveJob(n)) return;
      var go = '#/job/' + n.id, rv = S.people.filter(function (p) { return p.need_code === n.code && p.stage === 'review'; });
      var apl = S.people.filter(function (p) { return p.need_code === n.code && p.stage === 'applicant'; }), fit = apl.filter(fits);
      if (rv.length) items.push({ r: 4, icon: 'inbox', tone: 'blue', title: rv.length + ' new from email \u00b7 ' + needLabel(n), sub: 'Resumes to review. No one has been contacted.', go: go + '/applicants', cta: 'Review', key: 'rv:' + n.id, sig: rv.map(function (p) { return p.id; }).join(',') });
      if (fit.length) items.push({ r: 4, icon: 'users', tone: 'blue', title: (fit.length > 1 ? fit.length + ' applicants fit' : '1 applicant fits') + ' \u00b7 ' + needLabel(n), sub: n.borough + ' \u00b7 ' + T.sched(n), go: go + '/applicants', cta: 'Review', key: 'ft:' + n.id, sig: fit.map(function (p) { return p.id; }).join(',') });
      if (n.status === 'open') items.push({ r: 6, icon: n.jd ? 'send' : 'pen', tone: 'blue', title: (n.jd ? 'Post ' : 'Check the post \u00b7 ') + needLabel(n), sub: n.jd ? (T.payOf(n.jd) ? 'Ready for 5 sites. Copy and paste.' : 'Add the pay range, then post.') : 'Read it, add pay, save.', go: go + '/post', cta: n.jd ? 'Post' : 'Check', key: 'po:' + n.id, sig: n.status });
      var posted = Object.values(J(n.posted, {})).sort()[0];
      if (n.status === 'posted' && posted && daysSince(posted) >= 5 && !S.people.some(function (p) { return p.need_code === n.code; })) items.push({ r: 7, icon: 'alert', tone: 'amber', title: 'No one yet \u00b7 ' + needLabel(n), sub: daysSince(posted) + ' days. Try another site?', go: go + '/post', cta: 'Post more', key: 'ny:' + n.id, sig: String(Math.floor(daysSince(posted) / 7)) });
    });
    var dis = {}; (S.dismissed || []).forEach(function (d) { dis[d.key + '|' + d.sig] = 1; });
    return items.filter(function (i) { return !dis[i.key + '|' + i.sig]; }).sort(function (a, b) { return a.r - b.r; });
  }

  /* ---------- shell: header, tab bar, install ---------- */
  function today() { return new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }); }
  function standalone() { return (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true; }
    var AI = window.AppInstall;
  function installBtn(cls) { return !(AI && AI.visible()) ? '' : '<button class="' + (cls || 'pill pill--install') + '" data-act="install">' + ic('dl') + (cls ? 'Install app' : 'Install') + '</button>'; }
  function headActs(extra) {
    var b = (extra || '') + (DEMO ? '<span class="pill pill--demo">Demo</span>' : '');
    b += '<button class="iconbtn iconbtn--r" data-act="refresh" aria-label="Refresh">' + ic('refresh') + '</button><a class="iconbtn iconbtn--r" href="#/settings" aria-label="Settings">' + ic('gear') + '</a>';
    return '<div class="hdr__acts">' + b + '</div>';
  }
  function banner() {
    return offline ? '<div class="banner" role="alert">' + ic('wifi') + '<span class="grow">You\u2019re offline or the server didn\u2019t answer. What you see may be out of date, and changes won\u2019t save.</span><button class="btn btn--sm btn--white" data-act="reload">Retry</button></div>' : '';
  }
  function hdr(title, sub, extra, kicker) { return banner() + '<header class="hdr"><div class="hdr__txt"><div class="hdr__date">' + esc(kicker || today()) + '</div><h1>' + esc(title) + '</h1>' + (sub ? '<p class="hdr__sub">' + esc(sub) + '</p>' : '') + '</div>' + headActs(extra) + '</header>'; }
  function top(title, parent, right) { return banner() + '<header class="top"><button class="iconbtn" data-act="back" data-parent="' + esc(parent || '#/') + '" aria-label="Back">' + ic('back') + '</button><h1>' + esc(title) + '</h1>' + (right || '') + (DEMO ? '<span class="pill pill--demo">Demo</span>' : '') + '</header>'; }
  var TABS = [['home', '#/', 'Home', 'home'], ['jobs', '#/jobs', 'Jobs', 'brief'], ['applicants', '#/applicants', 'Applicants', 'users'], ['interviews', '#/interviews', 'Interviews', 'cal'], ['hires', '#/hires', 'Hires', 'gift']];
  function tabOf(h) {
    var r = h[0];
    if (!r) return 'home';
    if (r === 'jobs' || r === 'job' || r === 'need' || r === 'flyer') return 'jobs';
    if (r === 'applicants' || r === 'interviews' || r === 'hires') return r;
    if (r === 'person' && h[2] !== 'edit') { var p = personBy(h[1]), g = p ? segOf(p) : 'new'; return g === 'interview' ? 'interviews' : g === 'hired' ? 'hires' : 'applicants'; }
    return null;   // forms and settings: full screen, no tab bar
  }
  function tabBadges() {
    var b = { applicants: 0, interviews: 0, hires: 0 };
    S.people.forEach(function (p) { if (p.stage === 'review' || p.stage === 'applicant') b.applicants++; if (p.stage === 'hired' && !queued('draft_welcome', p.id)) b.hires++; });
    ivList().forEach(function (i) { if (ivUpcoming(i) && (i.status === 'to_schedule' || i.status === 'call_now')) b.interviews++; });
    return b;
  }
  function tabbar(active) {
    var b = tabBadges();
    return TABS.map(function (t) {
      var n = b[t[0]] || 0;
      return '<a href="' + t[1] + '" class="tab' + (active === t[0] ? ' on" aria-current="page' : '') + '" data-tab="' + t[0] + '"><span class="tab__i">' + ic(t[3]) + (n ? '<b class="badge" aria-hidden="true">' + (n > 9 ? '9+' : n) + '</b>' : '') + '</span><span class="tab__l">' + t[2] + (n ? '<span class="sr"> (' + n + ' to do)</span>' : '') + '</span></a>';
    }).join('');
  }
  var TB = document.createElement('nav'); TB.className = 'tabbar'; TB.id = 'tabbar'; TB.setAttribute('aria-label', 'Main');
  function setTabs(active) {
    if (!TB.parentNode) document.body.appendChild(TB);
    document.documentElement.classList.toggle('has-tabs', !!active);
    TB.hidden = !active; if (active) TB.innerHTML = tabbar(active);
  }
  function roleChips() { return '<div class="chips">' + ROLE_CHIPS.map(function (r) { return '<a href="#/new/' + encodeURIComponent(r[1]) + '">' + esc(r[0]) + '</a>'; }).join('') + '</div>'; }
  function startCard() {
    return '<section class="hero"><h2>Start your first job</h2><p>Pick the role. I\u2019ll write the post with the right must-haves and get it ready for 5 sites.</p>' + roleChips() +
      '<a class="btn btn--white btn--lg btn--block" href="#/new">' + ic('plus') + 'New job</a></section>';
  }
  function addCard() { return '<a class="card addcard" href="#/add">' + '<span class="tile">' + ic('inbox') + '</span><span class="grow"><span class="row__t">Add someone from an email</span><span class="row__s">Got a resume by email? Add them in a minute.</span></span>' + ic('chev') + '</a>'; }
  function foot() { return '<footer>' + (DEMO ? 'Demo data is made up. <button class="linkbtn" data-act="reset">Reset demo</button>' : 'Private \u00b7 Together They Grow') + '</footer>'; }
  function fab() { return '<a class="fab" href="#/new">' + ic('plus') + 'New job</a>'; }
  function skeleton() {
    return '<div class="view" aria-busy="true" aria-label="Loading"><header class="hdr"><div class="hdr__txt"><div class="sk sk--date"></div><div class="sk sk--title"></div></div></header><div class="sk sk--stages"></div><div class="sk sk--card"></div><div class="sk sk--card"></div><div class="sk sk--card"></div></div>';
  }
  function empty(t, extra, icon) { return '<div class="card center emptycard">' + (icon ? '<span class="tile tile--lg">' + ic(icon) + '</span>' : '') + '<p class="emptycard__t">' + esc(t) + '</p>' + (extra || '') + '</div>'; }
  function segs(items, active, hrefFn, fit) {
    return '<nav class="seg' + (fit ? ' seg--fit' : '') + '" aria-label="' + (fit ? 'Sections' : 'Filter') + '">' + items.map(function (s) {
      return '<a href="' + hrefFn(s[0]) + '" class="seg__b' + (s[0] === active ? ' on" aria-current="true' : '') + '" data-replace="1">' + esc(s[1]) + (s[2] != null ? ' <b>' + s[2] + '</b>' : '') + '</a>'; }).join('') + '</nav>';
  }

  /* ---------- activity (derived from the sheet's own timestamps) ---------- */
  function events(filter) {
    var ev = [], f = filter || {};
    S.needs.forEach(function (n) {
      if (f.code && n.code !== f.code) return; if (f.pid) return;
      if (n.created) ev.push({ at: n.created, icon: 'brief', t: 'New job ' + n.code + ' \u00b7 ' + needLabel(n), go: '#/job/' + n.id });
      var po = J(n.posted, {}); Object.keys(po).forEach(function (k) { ev.push({ at: po[k], icon: 'send', t: n.code + ' posted on ' + ((T.CHANNELS[k] || {}).name || k), go: '#/job/' + n.id + '/post' }); });
    });
    S.people.forEach(function (p) {
      if (f.code && p.need_code !== f.code) return; if (f.pid && p.id !== f.pid) return;
      if (p.created) ev.push({ at: p.created, icon: 'inbox', t: (f.pid ? 'Applied' : p.name + ' applied') + (p.need_code ? ' for ' + p.need_code : '') + (p.source ? ' \u00b7 ' + p.source : ''), go: '#/person/' + p.id });
      if (p.decided_at && SEG_OF[p.stage] !== 'new') ev.push({ at: p.decided_at, icon: { interview: 'cal', offer: 'star', hired: 'gift', welcome: 'check', pass: 'x', maybe: 'clock' }[p.stage] || 'move', t: (f.pid ? '' : p.name + ': ') + ({ interview: 'moved to interview', offer: 'offer made', hired: 'hired', welcome: 'welcome email sent', pass: 'passed', maybe: 'saved as maybe' }[p.stage] || p.stage), go: '#/person/' + p.id });
      if (p.cred_checked && p.cred_status !== 'unchecked') ev.push({ at: p.cred_checked, icon: 'shield', t: (f.pid ? 'Credential ' : p.name + ': credential ') + (p.cred_status === 'verified' ? 'checked, valid' : 'not found'), go: '#/person/' + p.id });
      if (p.timesheet_at) ev.push({ at: p.timesheet_at, icon: 'file', t: (f.pid ? '' : p.name + ': ') + 'timesheet received', go: '#/person/' + p.id });
    });
    S.interviews.forEach(function (i) {
      var p = personBy(i.person_id); if (!p || i.status === 'cancelled') return;
      if (f.code && i.need_code !== f.code) return; if (f.pid && p.id !== f.pid) return;
      if (i.status === 'scheduled' && i.when) ev.push({ at: i.updated || i.created || i.when, icon: 'cal', t: 'Interview' + (f.pid ? '' : ' with ' + p.name) + ' set for ' + when(i.when), go: '#/person/' + p.id });
      if (i.status === 'done') ev.push({ at: i.updated || i.when, icon: 'check', t: 'Interview notes' + (f.pid ? '' : ' for ' + p.name) + ' saved', go: '#/person/' + p.id });
    });
    S.queue.forEach(function (q) {
      var p = personBy(q.person_id); if (q.status === 'cancelled') return;
      if (f.code && q.need_code !== f.code) return; if (f.pid && q.person_id !== f.pid) return;
      ev.push({ at: q.at, icon: /^call/.test(q.kind) ? 'phone' : 'mail', t: 'Asked the assistant: ' + (KIND[q.kind] || q.kind).toLowerCase() + (p && !f.pid ? ' \u00b7 ' + p.name : ''), go: p ? '#/person/' + p.id : '' });
      if (q.status === 'done' && q.done_at) ev.push({ at: q.done_at, icon: 'check', t: (KIND[q.kind] || q.kind) + ' ready' + (p && !f.pid ? ' \u00b7 ' + p.name : ''), go: p ? '#/person/' + p.id : '' });
    });
    return ev.filter(function (e) { return pd(e.at); }).sort(function (a, b) { return String(b.at).localeCompare(String(a.at)); });
  }
  function activityList(ev, limit) {
    var l = limit ? ev.slice(0, limit) : ev;
    return '<ul class="feed">' + l.map(function (e) {
      var inner = '<span class="feed__i">' + ic(e.icon) + '</span><span class="grow"><span class="feed__t">' + esc(e.t) + '</span><span class="feed__s">' + esc(when(e.at)) + '</span></span>';
      var here = e.go && (location.hash === e.go || location.hash.indexOf(e.go + '/') === 0);   // no link back to the screen you are on
      return '<li>' + (e.go && !here ? '<a href="' + e.go + '">' + inner + '</a>' : '<div>' + inner + '</div>') + '</li>';
    }).join('') + '</ul>';
  }

  /* ---------- Home: dashboard ---------- */
  function ptile(n, label, go, tone) { return '<a class="ptile' + (n ? ' has' : '') + (tone ? ' ptile--' + tone : '') + '" href="' + go + '"><b>' + n + '</b><span>' + esc(label) + '</span></a>'; }
  function ivRow(i) {
    var p = personBy(i.person_id), n = needBy(i.need_code) || needBy(p.need_code) || {}, t = pd(i.when), st = ivState(i);
    var date = t ? '<b>' + esc(t.toLocaleDateString('en-US', { weekday: 'short' })) + '</b><span>' + esc(t.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })) + '</span><span>' + esc(t.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }).replace(':00', '').replace(' ', '').toLowerCase()) + '</span>' : '<b>\u2014</b><span>No time</span>';
    return '<li><a class="row ivrow" href="#/person/' + p.id + '"><span class="datebox' + (t ? '' : ' datebox--none') + '">' + date + '</span><span class="grow"><span class="row__t">' + esc(p.name) + '</span><span class="row__s">' + esc([p.role, n.code, n.borough].filter(Boolean).join(' \u00b7 ')) + '</span>' + stChip(st) + '</span>' + ic('chev') + '</a></li>';
  }
  function upcomingList() {
    return ivList().filter(ivUpcoming).sort(function (a, b) { return (a.when ? 0 : 1) - (b.when ? 0 : 1) || String(a.when).localeCompare(String(b.when)); });
  }
  function home() {
    var it = needsYou(), c = pipe(), none = !S.needs.length && !S.people.length;
    var sub = none ? 'Let\u2019s find your next great provider.' : it.length ? (it.length === 1 ? '1 thing needs you' : it.length + ' things need you') : 'You\u2019re all caught up';
    var tiles = '<section class="sec sec--first"><div class="sec__h"><h2>Pipeline</h2><a class="linkbtn" href="#/applicants">All applicants</a></div><div class="ptiles">' +
      ptile(c.jobs, 'Open jobs', '#/jobs') + ptile(c.fresh, 'New applicants', '#/applicants/new') + ptile(c.review, 'In review', '#/applicants/reviewing') +
      ptile(c.ivs, 'Interviews booked', '#/interviews/upcoming') + ptile(c.offers, 'Offers out', '#/applicants/offer') + ptile(c.hired, 'Hired this month', '#/hires', 'green') + '</div></section>';
    var strip = '<section class="sec"><div class="sec__h"><h2>Needs you</h2>' + (it.length ? '<small>' + it.length + '</small>' : '') + '</div>' +
      (it.length ? '<ul class="strip">' + it.slice(0, 12).map(function (i) {
        return '<li><a href="' + i.go + '"><span class="tile tile--' + i.tone + '">' + ic(i.icon) + '</span><span class="todo__t">' + esc(i.title) + '</span><span class="todo__s">' + esc(i.sub) + '</span><span class="todo__go">' + esc(i.cta) + ic('chev') + '</span></a>' +
          '<button class="todo__x" data-dismiss="' + esc(i.key) + '" data-sig="' + esc(i.sig || '') + '" aria-label="Hide: ' + esc(i.title) + '">' + ic('x') + '</button></li>';
      }).join('') + '</ul>'
        : none ? startCard() : '<div class="card center caught"><span class="tile tile--green">' + ic('check') + '</span><p class="todo__t">You\u2019re all caught up</p><p class="muted small">New applicants show up here as soon as they come in.</p></div>') + '</section>';
    var up = upcomingList();
    var ivs = '<section class="sec"><div class="sec__h"><h2>Upcoming interviews</h2><a class="linkbtn" href="#/interviews">See all</a></div>' +
      (up.length ? '<ul class="list">' + up.slice(0, 4).map(ivRow).join('') + '</ul>' : empty('No interviews booked yet.', '<p class="muted small">Tap \u201cInterview\u201d on an applicant and they show up here.</p><a class="btn btn--ghost" href="#/applicants">' + ic('users') + 'Review applicants</a>', 'cal')) + '</section>';
    var ev = events();
    var act = '<section class="sec"><div class="sec__h"><h2>Recent activity</h2>' + (ev.length ? '<small>' + Math.min(ev.length, 8) + ' latest</small>' : '') + '</div>' +
      (ev.length ? '<div class="card card--flush">' + activityList(ev, 8) + '</div>' : empty('Nothing has happened yet.', '<p class="muted small">Jobs you post, people who apply and interviews you set show up here.</p>', 'pulse')) + '</section>';
    var quick = '<section class="sec"><div class="quick"><a class="qbtn" href="#/new">' + ic('brief') + '<span>New job</span></a><a class="qbtn" href="#/add">' + ic('inbox') + '<span>Add from email</span></a><a class="qbtn" href="#/interviews">' + ic('cal') + '<span>Interviews</span></a><a class="qbtn" href="#/hires">' + ic('gift') + '<span>Welcome packets</span></a></div></section>';
    return '<div class="view">' + hdr('Recruiting', sub, installBtn()) + '<div class="home"><div>' + tiles + strip + ivs + '</div><aside>' + quick + act + requests() + '</aside></div>' + foot() + fab() + '</div>';
  }

  /* ---------- Jobs ---------- */
  function jobCounts(n) {
    var all = S.people.filter(function (p) { return p.need_code === n.code; });
    return { all: all.filter(function (p) { return p.stage !== 'pass'; }).length, fresh: all.filter(function (p) { return segOf(p) === 'new'; }).length, iv: all.filter(function (p) { return p.stage === 'interview'; }).length };
  }
  function jobRow(n) {
    var st = jobStatus(n), k = jobCounts(n), po = Object.keys(J(n.posted, {})).length;
    return '<li><a class="row jobrow" href="#/job/' + n.id + '"><span class="tile tile--code">' + esc(n.code) + '</span><span class="grow"><span class="jobrow__h"><span class="row__t">' + esc(needLabel(n)) + '</span>' + stChip(st) + '</span><span class="row__s">' + esc(T.where(n) + ' \u00b7 ' + T.sched(n)) + '</span>' +
      '<span class="meta"><span>' + ic('users') + k.all + ' applicant' + (k.all === 1 ? '' : 's') + '</span>' + (k.fresh ? '<span class="meta--hot">' + k.fresh + ' new</span>' : '') + (k.iv ? '<span>' + k.iv + ' interviewing</span>' : '') + '<span>' + ic('send') + po + ' of 5 sites</span></span></span>' + ic('chev') + '</a></li>';
  }
  function needRow(n) { return jobRow(n); }
  function jobsPage(seg) {
    seg = seg || 'active';
    var g = { active: S.needs.filter(liveJob), paused: S.needs.filter(function (n) { return n.status === 'paused'; }), closed: S.needs.filter(function (n) { return n.status === 'filled' || n.status === 'closed'; }) };
    var list = (g[seg] || g.active).slice().sort(function (a, b) { return String(b.created).localeCompare(String(a.created)); });
    var h = '<div class="view">' + hdr('Jobs', g.active.length ? g.active.length + ' open' : 'No open jobs', '', 'Hiring') +
      '<div class="toolbar"><a class="btn" href="#/new">' + ic('plus') + 'New job</a><a class="btn btn--ghost" href="#/add">' + ic('inbox') + 'Add applicant</a></div>' +
      segs([['active', 'Open', g.active.length], ['paused', 'Paused', g.paused.length], ['closed', 'Filled & closed', g.closed.length]], seg, function (k) { return '#/jobs/' + k; });
    if (list.length) h += '<ul class="list">' + list.map(jobRow).join('') + '</ul>';
    else if (seg === 'active') h += S.needs.length ? empty('No open jobs right now.', '<p class="muted small">Start a new one when a student needs a provider.</p><a class="btn" href="#/new">' + ic('plus') + 'New job</a>', 'brief') : '<div class="sec--first">' + startCard() + '</div>';
    else h += empty(seg === 'paused' ? 'No paused jobs.' : 'Nothing filled or closed yet.', '<p class="muted small">' + (seg === 'paused' ? 'Pause a job from its page when you want to stop posting for a while.' : 'When you hire someone, their job moves here.') + '</p>', seg === 'paused' ? 'pause' : 'check');
    return h + foot() + '</div>';
  }
  var LOGO = { linkedin: 'in', indeed: 'ind', college: 'edu', aba: 'ABA', community: 'WA' };
  function jobPage(id, tab) {
    var n = needId(id); if (!n) return notFound();
    tab = tab || 'details';
    var st = jobStatus(n), k = jobCounts(n), r = T.R[n.role] || T.R.RBT, closed = n.status === 'closed' || n.status === 'filled';
    var h = '<div class="view narrow">' + top(n.role + ' \u00b7 ' + n.code, '#/jobs', '<a class="iconbtn iconbtn--r" href="#/job/' + n.id + '/edit" aria-label="Edit job">' + ic('pen') + '</a>') +
      '<section class="card need-hero"><div class="grow"><p class="big">' + esc(n.student ? 'For ' + n.student : r.short) + ' \u00b7 ' + esc(T.where(n)) + '</p><p class="muted">' + esc(T.sched(n)) + (n.hrs_week ? ' \u00b7 ' + esc(n.hrs_week) + ' hrs/wk' : '') + '</p><p class="muted">Start ' + esc(T.fmtDate(n.start)) + '</p><p class="hero-chips">' + stChip(st) + '<span class="st st--grey">' + k.all + ' applicant' + (k.all === 1 ? '' : 's') + '</span></p></div>' +
      '<div class="qr" role="img" aria-label="QR code to apply for ' + esc(n.code) + '">' + qrSvg(qrText(n), 3) + '<b>' + esc(n.code) + '</b></div></section>' +
      (closed ? '<div class="callout callout--blue">' + ic('check') + '<span class="grow">This job is ' + (n.status === 'filled' ? 'filled' : 'closed') + '.</span><button class="btn btn--sm btn--ghost" data-reopen="' + n.id + '">Reopen</button></div>' : '') +
      (n.status === 'paused' ? '<div class="callout callout--amber">' + ic('pause') + '<span class="grow">Paused. It stays off your to-do list until you resume.</span><button class="btn btn--sm btn--ghost" data-resume="' + n.id + '">Resume</button></div>' : '') +
      segs([['details', 'Details'], ['post', 'Post'], ['applicants', 'Applicants', k.all], ['activity', 'Activity']], tab, function (t) { return '#/job/' + n.id + '/' + t; }, true);
    if (tab === 'post') h += jobPost(n);
    else if (tab === 'applicants') h += applicantsBlock(n);
    else if (tab === 'activity') { var ev = events({ code: n.code }); h += '<section class="sec">' + (ev.length ? '<div class="card card--flush">' + activityList(ev) + '</div>' : empty('No activity yet.', '', 'pulse')) + '</section>'; }
    else h += jobDetails(n, closed);
    return h + foot() + '</div>';
  }
  function jobDetails(n, closed) {
    var r = T.R[n.role] || T.R.RBT, rows = [['Role', r.title], ['Where', T.where(n)], ['Schedule', T.sched(n)], ['Hours', n.hrs_week ? n.hrs_week + ' hrs/week' : ''], ['Start', T.fmtDate(n.start)], ['Student', n.student], ['Preferences', n.notes], ['Must-haves', r.musts.join(' \u00b7 ')], ['Created', n.created ? when(n.created) : '']];
    return '<section class="sec"><div class="card"><dl class="sumlist">' + rows.filter(function (x) { return x[1]; }).map(function (x) { return '<dt>' + x[0] + '</dt><dd>' + esc(x[1]) + '</dd>'; }).join('') + '</dl></div></section>' +
      '<section class="sec"><div class="sec__h"><h2>Actions</h2></div><div class="card actions">' +
      '<a class="arow" href="#/job/' + n.id + '/edit">' + ic('pen') + '<span class="grow">Edit details</span>' + ic('chev') + '</a>' +
      '<a class="arow" href="#/job/' + n.id + '/post">' + ic('send') + '<span class="grow">Write and post the job</span>' + ic('chev') + '</a>' +
      '<a class="arow" href="#/flyer/' + n.id + '">' + ic('print') + '<span class="grow">Print a flyer with QR code</span>' + ic('chev') + '</a>' +
      '<a class="arow" href="#/add/' + encodeURIComponent(n.code) + '">' + ic('inbox') + '<span class="grow">Add an applicant from email</span>' + ic('chev') + '</a>' +
      (closed ? '<button class="arow" data-reopen="' + n.id + '">' + ic('undo') + '<span class="grow">Reopen this job</span></button>' :
        (n.status === 'paused' ? '<button class="arow" data-resume="' + n.id + '">' + ic('play') + '<span class="grow">Resume this job</span></button>' : '<button class="arow" data-pause="' + n.id + '">' + ic('pause') + '<span class="grow">Pause this job</span></button>') +
        '<button class="arow" data-close="filled" data-id="' + n.id + '">' + ic('check') + '<span class="grow">Mark filled</span></button>' +
        '<button class="arow arow--red" data-close="closed" data-id="' + n.id + '">' + ic('x') + '<span class="grow">Close this job</span></button>') +
      '</div></section>';
  }
  function jobPost(n) {
    var text = n.jd || T.jd(n, ap(), settings().pay_default), v = T.versions(n, text, ap()), posted = J(n.posted, {}), r = T.R[n.role] || T.R.RBT, a = ap();
    var h = '<section class="sec"><div class="sec__h"><h2>Job post</h2><small>' + (n.jd ? 'Saved' : 'Not saved yet') + '</small></div><div class="card"><label class="sr" for="jd">Job post text</label><textarea id="jd">' + esc(text) + '</textarea>' +
      (v.pay ? '' : '<div class="callout callout--red">' + ic('alert') + '<span>Type the pay range on the \u201cPay:\u201d line (or set a default in <a href="#/settings">Settings</a>). NYC law requires it in job ads.</span></div>') +
      '<div class="btns"><button class="btn" data-act="savejd" data-id="' + n.id + '">' + ic('check') + 'Save</button><button class="btn btn--soft" data-act="resetjd" data-id="' + n.id + '">Rewrite from details</button></div></div></section>';
    h += '<section class="sec"><div class="sec__h"><h2>Post it</h2><small>' + Object.keys(posted).length + ' of 5 posted</small></div>' +
      (a.mode === 'email' ? (a.email ? '<div class="callout callout--blue">' + ic('mail') + '<span>Applicants email their resume to ' + esc(a.email) + ' with \u201c' + esc(n.code) + '\u201d in the subject. They show up under Applicants for you to review.</span></div>' : '<div class="callout callout--red">' + ic('alert') + '<span>Add the email applicants should write to in <a href="#/settings">Settings</a>.</span></div>') : '') +
      '<div class="card card--flush">' + r.boards.map(function (k) {
        var c = T.CHANNELS[k], url = k === 'community' ? 'https://wa.me/?text=' + encodeURIComponent(v.text[k]) : c.url;
        return '<div class="chan"><div class="chan__head"><span class="chan__logo chan--' + k + '" aria-hidden="true">' + LOGO[k] + '</span><span class="grow"><span class="row__t">' + esc(c.name) + '</span><span class="row__s">' + (posted[k] ? 'Posted ' + esc(when(posted[k])) + ' \u00b7 <button class="linkbtn linkbtn--in" data-unposted="' + k + '" data-id="' + n.id + '">Undo</button>' : 'Not posted yet') + '</span></span>' + (posted[k] ? '<span class="tag tag--green" role="img" aria-label="Posted">' + ic('check') + '</span>' : '') + '</div>' +
          '<details class="prev"><summary>Preview ' + ic('chev') + '</summary><pre>' + esc(v.text[k]) + '</pre></details>' +
          '<div class="chan__actions"><button class="btn" data-copy="' + k + '">' + ic('copy') + 'Copy</button><a class="btn btn--ghost" target="_blank" rel="noopener noreferrer" href="' + esc(url) + '">' + ic('ext') + (k === 'community' ? 'WhatsApp' : 'Open') + '</a>' +
          (posted[k] ? '<span></span>' : '<button class="btn btn--soft" data-posted="' + k + '" data-id="' + n.id + '">' + ic('check') + 'Posted</button>') + '</div></div>';
      }).join('') + '</div>' +
      '<div class="btns"><a class="btn btn--ghost" href="#/flyer/' + n.id + '">' + ic('print') + 'Print a flyer</a><a class="btn btn--ghost" href="sms:?&body=' + encodeURIComponent(T.referralAsk(n, a)) + '">' + ic('msg') + 'Text a referral ask</a></div>' + outreachBlock(n) +
      '<p class="muted small center">You post: copy, open the site, paste, then tap Posted.</p></section>';
    return h;
  }
  function applicantsBlock(n) {
    var all = S.people.filter(function (p) { return p.need_code === n.code && ACTIVE[p.stage]; }), later = S.people.filter(function (p) { return p.need_code === n.code && !ACTIVE[p.stage]; });
    var fit = ranked(all.filter(fits)), no = all.filter(function (p) { return !fits(p); });
    return '<section class="sec" id="applicants"><div class="sec__h"><h2>Waiting for you</h2><small>' + all.length + '</small></div>' +
      (fit.length ? '<ul class="list">' + fit.map(applicantCard).join('') + '</ul>' : empty(all.length ? 'No one meets every must-have yet.' : 'No applicants yet.', all.length ? '' : '<p class="muted small">Post the job, then add resumes that come in by email.</p>', 'users')) +
      (no.length ? (showUnfit[n.code] ? '<p class="muted small">Missed a must-have</p><ul class="list dim">' + no.map(applicantCard).join('') + '</ul>' : '<button class="more" data-unfit="' + esc(n.code) + '">' + no.length + ' didn\u2019t meet a must-have \u00b7 show</button>') : '') +
      (later.length ? '<div class="sec__h sec__h--sub"><h2>Further along</h2><small>' + later.length + '</small></div><ul class="list">' + later.map(applicantCard).join('') + '</ul>' : '') +
      '<div class="btns"><a class="btn btn--ghost" href="#/add/' + encodeURIComponent(n.code) + '">' + ic('inbox') + 'Add from email</a></div>' +
      '<p class="muted small center">Sorted by must-haves met. Facts only. You decide.</p></section>';
  }
  function outreachBlock(n) {
    var q = queued('draft_outreach', '', n.code), past = S.people.filter(function (p) { return p.email && p.need_code !== n.code && p.role === n.role && (p.stage === 'pass' || p.stage === 'maybe' || p.stage === 'welcome'); });
    if (q && q.status !== 'failed') return qstatus(q);
    if (!past.length) return '<p class="muted small">Email past applicants: no past ' + esc(n.role) + ' applicants with an email yet.</p>';
    return '<div class="btns"><button class="btn btn--ghost" data-act="outreach" data-code="' + esc(n.code) + '">' + ic('mail') + 'Draft emails to ' + past.length + ' past applicant' + (past.length > 1 ? 's' : '') + '</button></div>';
  }

  /* ---------- Applicants ---------- */
  var AF = { q: '', job: '', cred: '' };
  function credBadge(p) { return p.cred_status === 'verified' ? '<span class="st st--green">' + ic('shield') + esc(p.credential || 'Credential') + ' \u2713</span>' : p.cred_status === 'not_found' ? '<span class="st st--red">' + esc(p.credential || 'Credential') + ' not found</span>' : '<span class="st st--amber">' + esc(p.credential || 'Credential') + ' \u00b7 not checked</span>'; }
  function applicantCard(p) {
    var met = checks(p).filter(function (c) { return c.s === 'ok'; }).length;
    return '<li><a class="row acard" href="#/person/' + p.id + '"><span class="avatar" aria-hidden="true">' + esc(initials(p.name)) + '</span><span class="grow"><span class="acard__h"><span class="row__t">' + esc(p.name) + '</span>' + (p.stage === 'review' ? '<span class="st st--blue">New</span>' : '') + '</span>' +
      '<span class="row__s">' + esc([p.role, p.boroughs].filter(Boolean).join(' \u00b7 ')) + '</span><span class="badges">' + credBadge(p) + (p.need_code ? '<span class="st st--grey">' + esc(p.need_code) + '</span>' : '') + (p.source ? '<span class="st st--grey">' + esc(p.source) + '</span>' : '') + '<span class="st st--grey">' + met + '/4 must-haves</span></span>' +
      (personSub(p) ? '<span class="acard__fit">' + esc(personSub(p)) + '</span>' : '') + '</span>' + ic('chev') + '</a></li>';
  }
  function afMatch(p) {
    var q = AF.q.toLowerCase();
    if (AF.job && p.need_code !== AF.job) return false;
    if (AF.cred && (p.cred_status || 'unchecked') !== AF.cred) return false;
    return !q || [p.name, p.role, p.credential, p.boroughs, p.fit_summary, p.source, p.need_code, p.email].join(' ').toLowerCase().indexOf(q) >= 0;
  }
  function applicantList(seg) {
    var list = S.people.filter(function (p) { return segOf(p) === seg && afMatch(p); });
    list = seg === 'new' ? ranked(list) : list.sort(function (a, b) { return String(b.updated || b.created).localeCompare(String(a.updated || a.created)); });
    if (list.length) return '<ul class="list">' + list.map(applicantCard).join('') + '</ul>';
    if (AF.q || AF.job || AF.cred) return empty('No one matches these filters.', '<button class="btn btn--ghost" data-act="clearf">Clear filters</button>', 'search');
    var msg = { new: ['No new applicants.', 'Post a job, or add a resume that came in by email.', '<a class="btn" href="#/add">' + ic('inbox') + 'Add from email</a>'],
      reviewing: ['No one saved as maybe.', 'Tap \u201cMaybe\u201d on an applicant to keep them here.', ''], interview: ['No one in interviews.', 'Tap \u201cInterview\u201d on an applicant to set one up.', '<a class="btn btn--ghost" href="#/applicants/new">See new applicants</a>'],
      offer: ['No offers out.', 'After an interview, tap \u201cOffer\u201d.', ''], hired: ['No hires yet.', 'When you hire someone, their welcome packet is set up under Hires.', ''], passed: ['No one passed.', 'People you pass on stay here, so you can undo.', ''] }[seg];
    return empty(msg[0], '<p class="muted small">' + msg[1] + '</p>' + msg[2], 'users');
  }
  function applicantsPage(seg) {
    seg = SEG_OF[seg] ? SEG_OF[seg] : (SEGS.some(function (s) { return s[0] === seg; }) ? seg : 'new');
    var cnt = {}; SEGS.forEach(function (s) { cnt[s[0]] = 0; }); S.people.forEach(function (p) { if (afMatch(p)) cnt[segOf(p)]++; });
    var jobs = S.needs.filter(function (n) { return S.people.some(function (p) { return p.need_code === n.code; }); });
    return '<div class="view">' + hdr('Applicants', S.people.length ? S.people.length + ' people' : 'No one yet', '', 'People') +
      '<div class="toolbar"><a class="btn" href="#/add">' + ic('inbox') + 'Add from email</a></div>' +
      '<div class="filters"><label class="search">' + ic('search') + '<span class="sr">Search applicants</span><input id="aq" type="search" autocomplete="off" placeholder="Search name, credential, notes" value="' + esc(AF.q) + '"></label>' +
      '<div class="two"><div><label class="sr" for="afjob">Job</label><select id="afjob"><option value="">All jobs</option>' + jobs.map(function (n) { return '<option value="' + esc(n.code) + '"' + (AF.job === n.code ? ' selected' : '') + '>' + esc(n.code + ' \u00b7 ' + n.role) + '</option>'; }).join('') + '</select></div>' +
      '<div><label class="sr" for="afcred">Credential</label><select id="afcred">' + [['', 'Any credential'], ['verified', 'Checked, valid'], ['unchecked', 'Not checked'], ['not_found', 'Not found']].map(function (o) { return '<option value="' + o[0] + '"' + (AF.cred === o[0] ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select></div></div></div>' +
      segs(SEGS.map(function (s) { return [s[0], s[1], cnt[s[0]]]; }), seg, function (k) { return '#/applicants/' + k; }) +
      '<div id="alist" data-seg="' + seg + '">' + applicantList(seg) + '</div>' + foot() + '</div>';
  }

  /* ---------- Interviews ---------- */
  function callingCard() {
    return calling() ? '<div class="callout callout--green">' + ic('phone') + '<span>Assistant calls are on. Ask it to call from an applicant\u2019s interview card.</span></div>'
      : '<div class="callout callout--soft">' + ic('shield') + '<span class="grow"><b>Assistant calls are waiting for your OK.</b> Until you approve them, you text or email times and call people yourself. Everything else works now.</span><a class="btn btn--sm btn--ghost" href="#/settings/calls">What\u2019s needed</a></div>';
  }
  function ivCard(i) {
    var p = personBy(i.person_id), st = ivState(i), s = J(i.summary, {});
    var extra = '';
    if (i.status === 'done') extra = '<div class="ivcard__sum"><p class="wrap">' + esc(s.summary || 'Notes saved.') + '</p><p class="muted small">' + ic('mic') + (i.consent === 'yes' && s.recording && s.recording !== 'none' ? 'Recorded with their OK \u00b7 ' + esc(s.recording) : 'Not recorded \u00b7 your notes') + '</p></div>';
    var btn = st[0] === 'toset' || st[0] === 'proposed' ? '<a class="btn btn--sm" href="#/person/' + p.id + '">' + ic('cal') + (st[0] === 'toset' ? 'Propose times' : 'Set the time') + '</a>'
      : st[0] === 'confirmed' ? (p.phone ? '<a class="btn btn--sm btn--ghost" href="tel:' + esc(digits(p.phone)) + '">' + ic('phone') + 'Call</a>' : '') + '<a class="btn btn--sm btn--ghost" href="#/person/' + p.id + '">' + ic('pen') + 'Notes</a>'
      : st[0] === 'notes' ? '<a class="btn btn--sm" href="#/person/' + p.id + '">' + ic('pen') + 'Add notes</a>'
      : st[0] === 'callnow' ? '<a class="btn btn--sm" href="tel:' + esc(digits(p.phone)) + '">' + ic('phone') + 'Call now</a>'
      : '<a class="btn btn--sm btn--ghost" href="#/person/' + p.id + '">' + (segOf(p) === 'interview' ? 'Decide' : 'Open') + '</a>';
    return '<li class="ivcard"><ul class="list">' + ivRow(i) + '</ul>' + extra + '<div class="ivcard__acts">' + btn + '</div></li>';
  }
  function interviewsPage(seg) {
    seg = seg === 'past' ? 'past' : 'upcoming';
    var all = ivList(), up = upcomingList(), past = all.filter(function (i) { return !ivUpcoming(i); }).sort(function (a, b) { return String(b.when || b.updated).localeCompare(String(a.when || a.updated)); });
    var list = seg === 'past' ? past : up;
    var h = '<div class="view">' + hdr('Interviews', up.length ? up.length + ' upcoming' : 'Nothing booked', '', 'Schedule') + callingCard() +
      segs([['upcoming', 'Upcoming', up.length], ['past', 'Past', past.length]], seg, function (k) { return '#/interviews/' + k; });
    h += list.length ? '<ul class="ivcards">' + list.map(ivCard).join('') + '</ul>' : empty(seg === 'past' ? 'No past interviews yet.' : 'No interviews coming up.', '<p class="muted small">' + (seg === 'past' ? 'Interviews with notes land here.' : 'Open an applicant and tap \u201cInterview\u201d. You\u2019ll get times to offer, from your interview windows.') + '</p><a class="btn btn--ghost" href="#/applicants/new">' + ic('users') + 'Review applicants</a>', 'cal');
    return h + foot() + '</div>';
  }

  /* ---------- Hires (welcome + onboarding) ---------- */
  function onboard(p) {
    var q = queued('draft_welcome', p.id), n = needBy(p.need_code) || {}, start = p.start_date || n.start;
    return [
      { k: 'draft', s: q && q.status === 'done' ? 'ok' : 'q', t: q && q.status === 'done' ? 'Welcome packet drafted in Gmail' : q && q.status === 'failed' ? 'Draft failed: ' + (q.result || 'try again') : q ? 'Welcome draft queued' : 'Welcome packet not drafted yet' },
      { k: 'sent', s: p.stage === 'welcome' ? 'ok' : 'q', t: p.stage === 'welcome' ? 'Welcome email sent' + (p.decided_at ? ' ' + when(p.decided_at) : '') : 'Not sent yet' },
      { k: 'timesheet', s: p.timesheet_at ? 'ok' : 'q', t: p.timesheet_at ? 'Timesheet received ' + when(p.timesheet_at) : 'Timesheet not received' },
      { k: 'start', s: start ? 'ok' : 'q', t: start ? 'Starts ' + T.fmtDate(start) : 'Start date not set' }
    ];
  }
  function nextStep(p) {
    var q = queued('draft_welcome', p.id);
    if (!p.email) return '<a class="btn btn--sm" href="#/person/' + p.id + '/edit">' + ic('mail') + 'Add their email</a>';
    if (!q || q.status === 'failed') return '<button class="btn btn--sm" data-act="welcome" data-id="' + p.id + '">' + ic('gift') + 'Draft welcome email</button>';
    if (q.status === 'done' && p.stage !== 'welcome') return (isGmail(q.result) ? '<a class="btn btn--sm btn--ghost" target="_blank" rel="noopener noreferrer" href="' + esc(q.result) + '">' + ic('ext') + 'Open draft</a>' : '') + '<button class="btn btn--sm" data-decide="welcome" data-id="' + p.id + '">' + ic('check') + 'I sent it</button>';
    if (p.stage === 'welcome' && !p.timesheet_at) return '<button class="btn btn--sm btn--ghost" data-ts="1" data-id="' + p.id + '">' + ic('file') + 'Timesheet received</button>';
    if (q.status !== 'done') return '<span class="muted small">The assistant makes the draft on its next run.</span>';
    return '<span class="muted small">All set.</span>';
  }
  function hireCard(p) {
    var ob = onboard(p), done = ob.filter(function (x) { return x.s === 'ok'; }).length, n = needBy(p.need_code) || {};
    return '<li class="hcard card"><a class="hcard__h" href="#/person/' + p.id + '"><span class="avatar" aria-hidden="true">' + esc(initials(p.name)) + '</span><span class="grow"><span class="row__t">' + esc(p.name) + '</span><span class="row__s">' + esc([p.role, n.code, n.borough].filter(Boolean).join(' \u00b7 ')) + '</span></span>' + ic('chev') + '</a>' +
      '<div class="progress p' + done + '" role="img" aria-label="' + done + ' of 4 onboarding steps done"><span></span></div><p class="muted small">' + done + ' of 4 done</p>' +
      '<ul class="checks checks--sm">' + ob.map(checkRow).join('') + '</ul><div class="hcard__acts">' + nextStep(p) + '</div></li>';
  }
  function hiresPage() {
    var l = S.people.filter(function (p) { return p.stage === 'hired' || p.stage === 'welcome'; }).sort(function (a, b) { return (a.stage === 'hired' ? 0 : 1) - (b.stage === 'hired' ? 0 : 1) || String(b.decided_at).localeCompare(String(a.decided_at)); });
    var h = '<div class="view">' + hdr('Hires', l.length ? l.length + ' onboarding' : 'No one yet', '', 'Welcome') +
      '<div class="callout callout--soft">' + ic('shield') + '<span>Welcome emails are Gmail drafts. You add the rate and send them yourself. Nothing is ever sent for you.</span></div>';
    h += l.length ? '<ul class="hcards">' + l.map(hireCard).join('') + '</ul>' : '<div class="sec">' + empty('No new hires yet.', '<p class="muted small">When you tap \u201cHire\u201d on someone, their welcome packet checklist starts here.</p><a class="btn btn--ghost" href="#/interviews">' + ic('cal') + 'See interviews</a>', 'gift') + '</div>';
    return h + foot() + '</div>';
  }

  function personSub(p) {
    var iv = ivFor(p.id);
    if (p.stage === 'interview' && iv) return iv.status === 'scheduled' ? 'Interview ' + when(iv.when) : iv.status === 'done' ? 'Interviewed \u00b7 ready to decide' : iv.status === 'call_now' ? 'Call them now (no recording)' : 'Interview not set up yet';
    if (p.stage === 'offer') return 'Offer made' + (p.decided_at ? ' ' + when(p.decided_at) : '') + ' \u00b7 waiting on their answer';
    if (p.stage === 'hired') { var q = queued('draft_welcome', p.id); return !q ? 'Welcome packet to draft' : q.status === 'done' ? 'Welcome draft ready in Gmail' : 'Welcome draft queued'; }
    if (p.stage === 'welcome') return 'Welcomed' + (p.start_date ? ' \u00b7 starts ' + T.fmtDate(p.start_date) : '');
    if (p.stage === 'review') return 'New from ' + (p.source || 'email') + ' \u00b7 not contacted. ' + (p.fit_summary || '');
    return p.fit_summary || '';
  }
  function notFound() { return '<div class="view narrow">' + top('Not found', '#/') + empty('This item isn\u2019t here anymore. It may have been removed.', '<a class="btn btn--ghost" href="#/">Go home</a>') + '</div>'; }
  function verifyLinks(p) {
    var r = T.R[p.role] || {}, out = [];
    if (r.verify === 'bacb' || r.verify === 'both') out.push(T.VERIFY.bacb);
    if (r.verify === 'nysed' || r.verify === 'both') out.push(T.VERIFY.nysed);
    return out.map(function (x) { return '<a class="btn btn--ghost" target="_blank" rel="noopener noreferrer" href="' + x.url + '">' + ic('shield') + x.name + '</a>'; }).join('');
  }
  /* Interview times: from the calendar (when the assistant has loaded it), else from your interview windows. */
  function freeSlots() {
    var now = Date.now(), cal = (S.freeTimes || []).map(function (f) { return pd(f.start); }).filter(function (t) { return t && t > now && T.slotOk(t, settings().friday_cutoff); }).slice(0, 3);
    if (cal.length) return { from: 'calendar', times: cal };
    var taken = S.interviews.filter(function (i) { return i.status === 'scheduled' && i.when; }).map(function (i) { var s = pd(i.when); return { start: s, end: new Date(s.getTime() + 30 * 6e4) }; });
    return { from: 'windows', times: T.slots(settings(), taken, 3) };
  }
  function slotLabel(d) { return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) + ', ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }).replace(':00', '').replace(' ', '').toLowerCase(); }
  function personPage(id) {
    var p = personBy(id); if (!p) return notFound();
    var n = needBy(p.need_code) || {}, iv = ivFor(p.id), bar = '', cc = checks(p), g = segOf(p);
    var parent = g === 'interview' ? '#/interviews' : g === 'hired' ? '#/hires' : '#/applicants/' + g;
    var h = '<div class="view narrow">' + top(p.name, parent, '<a class="iconbtn iconbtn--r" href="#/person/' + p.id + '/edit" aria-label="Edit ' + esc(p.name) + '">' + ic('pen') + '</a>') +
      '<section class="card"><div class="need-hero"><span class="avatar avatar--lg" aria-hidden="true">' + esc(initials(p.name)) + '</span><div class="grow"><p class="big">' + esc([p.role || 'Role?', n.code || 'No job picked'].join(' \u00b7 ')) + '</p><p class="muted">' + esc([n.role ? needLabel(n) : '', p.source].filter(Boolean).join(' \u00b7 ')) + '</p>' +
      '<p class="hero-chips"><span class="st st--blue">' + esc(segName(g)) + '</span>' + credBadge(p) + '</p></div></div>' +
      '<div class="contact">' + (p.phone ? '<a href="tel:' + esc(digits(p.phone)) + '">' + ic('phone') + 'Call</a><a href="sms:' + esc(digits(p.phone)) + '">' + ic('msg') + 'Text</a>' : '') + (p.email ? '<a href="mailto:' + esc(p.email) + '">' + ic('mail') + 'Email</a>' : '') + (p.resume_url ? '<a target="_blank" rel="noopener noreferrer" href="' + esc(p.resume_url) + '">' + ic('file') + 'Resume</a>' : '') + '</div>' +
      '<p class="muted small wrap">' + esc([p.phone, p.email].filter(Boolean).join(' \u00b7 ')) + '</p>' +
      '<div class="btns">' + (n.id ? '<a class="btn btn--soft btn--sm" href="#/job/' + n.id + '">' + ic('brief') + 'Job ' + esc(n.code) + '</a>' : '') + '<button class="btn btn--soft btn--sm" data-act="movestage" data-id="' + p.id + '">' + ic('move') + 'Move to\u2026</button></div></section>';
    if (p.stage === 'review') h += '<div class="callout callout--blue">' + ic('inbox') + '<span>New from ' + esc(p.source || 'email') + '. Nothing has been sent to them. Check the facts, then decide.</span></div>';
    if (!n.id) h += '<div class="callout callout--red">' + ic('alert') + '<span class="grow">Not matched to a job yet.</span><a class="btn btn--sm btn--ghost" href="#/person/' + p.id + '/edit">Pick a job</a></div>';
    if (p.stage === 'interview' && iv) {
      var ib = interviewBlock(p, iv); h += '<section class="sec"><div class="sec__h"><h2>Interview</h2><button class="linkbtn" data-undo="' + p.id + '">Not interviewing</button></div><div class="card">' + ib.html + '</div></section>'; bar = ib.bar || '';
    }
    if (p.stage === 'offer') {
      h += '<div class="callout callout--green">' + ic('star') + '<span class="grow">Offer made' + (p.decided_at ? ' ' + esc(when(p.decided_at)) : '') + '. Tap Hire when they say yes.</span><button class="btn btn--sm btn--ghost" data-undo="' + p.id + '">Undo</button></div>';
      bar = '<div class="decide"><button class="btn btn--lg" data-decide="hire" data-id="' + p.id + '">' + ic('gift') + 'Hire</button><button class="btn btn--lg btn--red" data-decide="pass" data-id="' + p.id + '">Pass</button></div>';
    }
    if (p.stage === 'hired' || p.stage === 'welcome') h += onboardBlock(p) + welcomeBlock(p);
    h += '<section class="sec"><div class="sec__h"><h2>Must-haves</h2><small>' + cc.filter(function (c) { return c.s === 'ok'; }).length + ' of 4 met</small></div><div class="card"><ul class="checks">' + cc.map(checkRow).join('') + '</ul>' +
      '<div class="btns">' + verifyLinks(p) + '</div><div class="btns">' + (p.cred_status !== 'verified' ? '<button class="btn btn--soft" data-cred="verified" data-id="' + p.id + '">' + ic('check') + 'I checked: valid</button>' : '') + (p.cred_status !== 'not_found' ? '<button class="btn btn--soft" data-cred="not_found" data-id="' + p.id + '">' + ic('x') + 'Not found</button>' : '') + (p.cred_status !== 'unchecked' ? '<button class="btn btn--soft" data-cred="unchecked" data-id="' + p.id + '">' + ic('undo') + 'Clear check</button>' : '') + '</div>' +
      (p.cred_checked ? '<p class="muted small">Last checked ' + esc(when(p.cred_checked)) + '</p>' : '') + '</div></section>';
    h += '<section class="sec"><div class="sec__h"><h2>Fit notes</h2></div><div class="card"><p class="muted small wrap">' + esc(['Available ' + (p.availability || '?'), p.boroughs, p.credential].filter(Boolean).join(' \u00b7 ')) + '</p>' +
      '<label class="sr" for="fitn">Fit notes</label><textarea id="fitn" class="short" maxlength="800" placeholder="Experience, languages, anything that stood out">' + esc(p.fit_summary || '') + '</textarea><div class="btns"><button class="btn btn--soft" data-act="savefit" data-id="' + p.id + '">' + ic('check') + 'Save notes</button></div></div></section>';
    if (p.stage !== 'interview' && iv && iv.status === 'done') { var ib2 = interviewBlock(p, iv); h += '<section class="sec"><div class="sec__h"><h2>Interview</h2></div><div class="card">' + ib2.html + '</div></section>'; }
    var ev = events({ pid: p.id });
    h += '<section class="sec"><div class="sec__h"><h2>Timeline</h2></div>' + (ev.length ? '<div class="card card--flush">' + activityList(ev) + '</div>' : empty('Nothing yet.')) + '</section>';
    if (ACTIVE[p.stage]) bar = '<div class="decide"><button class="btn btn--lg" data-decide="interview" data-id="' + p.id + '">Interview</button>' + (p.stage === 'maybe' ? '' : '<button class="btn btn--lg btn--ghost" data-decide="maybe" data-id="' + p.id + '">Maybe</button>') + '<button class="btn btn--lg btn--red" data-decide="pass" data-id="' + p.id + '">Pass</button></div>';
    else if (p.stage === 'pass') h += '<div class="card center"><p class="muted">You passed on ' + esc(first(p.name)) + '.</p><button class="btn btn--ghost" data-undo="' + p.id + '">' + ic('undo') + 'Undo pass</button></div>';
    return h + bar + foot() + '</div>';
  }
  function onboardBlock(p) {
    var ob = onboard(p), n = needBy(p.need_code) || {}, done = ob.filter(function (x) { return x.s === 'ok'; }).length;
    return '<section class="sec"><div class="sec__h"><h2>Onboarding</h2><small>' + done + ' of 4 done</small></div><div class="card"><div class="progress p' + done + '" role="img" aria-label="' + done + ' of 4 done"><span></span></div><ul class="checks">' + ob.map(checkRow).join('') + '</ul>' +
      '<div class="btns">' + (p.stage === 'welcome' ? '<button class="btn btn--soft" data-undo="' + p.id + '">' + ic('undo') + 'Not sent yet</button>' : '<button class="btn btn--soft" data-decide="welcome" data-id="' + p.id + '">' + ic('check') + 'I sent the welcome email</button>') +
      '<button class="btn btn--soft" data-ts="' + (p.timesheet_at ? '0' : '1') + '" data-id="' + p.id + '">' + ic(p.timesheet_at ? 'undo' : 'file') + (p.timesheet_at ? 'Timesheet not received' : 'Timesheet received') + '</button></div>' +
      '<div class="field"><label class="lbl" for="sdate">Start date</label><div class="inrow"><input id="sdate" type="date" value="' + esc(p.start_date || n.start || '') + '"><button class="btn" data-act="setstart" data-id="' + p.id + '">Save</button></div></div></div></section>';
  }
  function notesBox(iv, label) {
    var s = J(iv.summary, {});
    return '<div class="field"><label class="lbl" for="ivn">' + esc(label || 'Interview notes') + '</label><textarea id="ivn" class="short" maxlength="4000" placeholder="What stood out, experience, availability, follow-ups">' + esc(s.summary || '') + '</textarea></div><div class="btns"><button class="btn" data-act="ivnotes" data-iv="' + iv.id + '">' + ic('check') + 'Save notes</button></div>';
  }
  function interviewBlock(p, iv) {
    var fs = freeSlots(), times = fs.times.map(slotLabel), qs = queued('call_schedule', p.id), qi = queued('call_interview', p.id), di = queued('draft_invite', p.id);
    var hireBar = p.stage !== 'interview' ? '' : '<div class="decide"><button class="btn btn--lg" data-decide="offer" data-id="' + p.id + '">' + ic('star') + 'Offer</button><button class="btn btn--lg btn--ghost" data-decide="hire" data-id="' + p.id + '">Hire</button><button class="btn btn--lg btn--red" data-decide="pass" data-id="' + p.id + '">Pass</button></div>';
    if (iv.status === 'done') {
      var s = J(iv.summary, {}), rows = [['Notes', s.summary], ['Credentials', s.credentials], ['Experience', s.experience], ['Availability', s.availability], ['Strengths', s.strengths], ['Concerns', s.concerns], ['Follow-ups', s.follow_ups]];
      return { html: '<p class="muted small">' + esc(iv.when ? when(iv.when) : 'Interviewed') + (iv.call_id ? ' \u00b7 Recording ' + (iv.consent === 'yes' ? 'agreed' : 'not agreed, not recorded') : '') + '</p><dl class="sumlist">' + rows.filter(function (r) { return r[1]; }).map(function (r) { return '<dt>' + r[0] + '</dt><dd>' + esc(r[1]) + '</dd>'; }).join('') + '</dl>' +
        '<details class="prev"><summary>Edit notes ' + ic('chev') + '</summary>' + notesBox(iv) + '</details>', bar: hireBar };
    }
    if (iv.status === 'call_now') return { html: '<p class="big">Call ' + esc(first(p.name)) + ' now</p><p class="muted">They asked not to record, so the assistant hung up. Nothing was saved.</p><a class="btn btn--lg btn--block" href="tel:' + esc(digits(p.phone)) + '">' + ic('phone') + 'Call ' + esc(p.phone) + '</a>' + notesBox(iv, 'Notes from your call'), bar: hireBar };
    if (iv.status === 'scheduled') {
      return { html: '<p class="big">' + esc(when(iv.when)) + '</p><p class="muted">' + (p.phone ? 'Call ' + esc(first(p.name)) + ' at ' + esc(p.phone) + '.' : 'Reach ' + esc(first(p.name)) + ' at ' + esc(p.email) + '.') + '</p>' +
        '<div class="btns">' + (p.phone ? '<a class="btn" href="tel:' + esc(digits(p.phone)) + '">' + ic('phone') + 'Call now</a>' : '') + '<button class="btn btn--ghost" data-act="ivreset" data-iv="' + iv.id + '">' + ic('cal') + 'Reschedule</button></div>' +
        notesBox(iv) + (qi ? qstatus(qi) : '<details class="prev"><summary>Have the assistant call and bring you in ' + ic('chev') + '</summary><p class="muted small">It asks for consent to record first. This waits until you approve calling.</p><button class="btn btn--ghost btn--block" data-act="ivcall" data-id="' + p.id + '" data-iv="' + iv.id + '">' + ic('phone') + 'Ask the assistant to call</button></details>') + setTime(iv, 'Change the time') };
    }
    var txt = T.timesText(first(p.name), times, S.me), em = T.timesEmail(first(p.name), times, S.me, p.role);
    return { html: '<p class="lbl">Times to offer</p><div class="chips chips--static">' + (times.length ? times.map(function (t) { return '<span class="tag">' + esc(t) + '</span>'; }).join('') : '<span class="muted">No open times in the next 3 weeks. Widen your windows in Settings.</span>') + '</div>' +
      '<p class="muted small">' + (fs.from === 'calendar' ? 'From your calendar.' : 'From your interview windows in <a href="#/settings">Settings</a>. Never Shabbat, Yom Tov, or Friday after ' + esc(T.fmtT(settings().friday_cutoff || '12:00')) + '.') + '</p>' +
      '<div class="btns">' + (p.phone ? '<a class="btn" href="sms:' + esc(digits(p.phone)) + '?&body=' + encodeURIComponent(txt) + '">' + ic('msg') + 'Text times</a>' : '') +
      (p.email ? '<a class="btn btn--ghost" href="mailto:' + esc(p.email) + '?subject=' + encodeURIComponent(em.subject) + '&body=' + encodeURIComponent(em.body) + '">' + ic('mail') + 'Email times</a>' : '') + '</div>' +
      (p.email ? (di && di.status !== 'failed' ? qstatus(di) : '<button class="linkbtn" data-act="invite" data-id="' + p.id + '">Or have the assistant put it in your Gmail drafts</button>') : '') +
      (qs ? qstatus(qs) : '<details class="prev"><summary>Have the assistant call to set it up ' + ic('chev') + '</summary><p class="muted small">This waits until you approve calling.</p><button class="btn btn--ghost btn--block" data-act="schedcall" data-id="' + p.id + '" data-iv="' + iv.id + '">' + ic('phone') + 'Ask the assistant to call</button></details>') +
      setTime(iv, 'They picked a time? Set it') + '<details class="prev"><summary>Already talked? Add notes ' + ic('chev') + '</summary>' + notesBox(iv) + '</details>' };
  }
  function setTime(iv, label) { return '<details class="prev"' + (label && /Set it/.test(label) ? ' open' : '') + '><summary>' + esc(label || 'Set the time') + ' ' + ic('chev') + '</summary><div class="field"><label class="lbl" for="ivt">Date and time</label><input type="datetime-local" id="ivt" step="900" value="' + esc(iv.when || '') + '" aria-describedby="ivt-err"><p class="err" id="ivt-err"></p></div><div class="btns"><button class="btn" data-act="settime" data-iv="' + iv.id + '">' + ic('cal') + 'Save time</button></div></details>'; }
  function welcomeBlock(p) {
    var PK = T.PACKET, contract = PK.contract[p.role], extra = PK.extra[p.role], qd = queued('draft_welcome', p.id);
    var att = [{ s: contract ? 'ok' : 'q', t: contract || 'Contract: you attach it (no template for this role yet)' }].concat(PK.common.map(function (a) { return { s: 'ok', t: a }; })).concat(extra ? [{ s: 'ok', t: extra }] : []);
    var h = '<section class="sec"><div class="sec__h"><h2>Welcome packet</h2>' + (p.stage === 'hired' ? '<button class="linkbtn" data-undo="' + p.id + '">Undo hire</button>' : '') + '</div><div class="card"><p class="muted small">In the Gmail draft</p><ul class="checks">' + att.map(checkRow).join('') + '</ul>' +
      '<p class="muted small">They send back</p><div class="facts">' + PK.askBack(p.role).map(function (a) { return '<span class="fact fact--q">' + esc(a) + '</span>'; }).join('') + '</div>' +
      '<div class="callout callout--blue">' + ic('shield') + '<span>You type the rate in the draft. Bank and direct-deposit forms go straight to billing, never here.</span></div></div></section>';
    if (!p.email) return h + '<div class="callout callout--red">' + ic('alert') + '<span class="grow">Add their email to make the draft.</span><a class="btn btn--sm btn--ghost" href="#/person/' + p.id + '/edit">Add email</a></div>';
    if (qd && qd.status !== 'failed') return h + qstatus(qd);
    return h + (qd ? qstatus(qd) : '') + '<div class="dock"><button class="btn btn--lg btn--block" data-act="welcome" data-id="' + p.id + '">' + ic('gift') + 'Draft welcome email</button></div>';
  }

  /* ---------- forms ---------- */
  var ROLE_LIST = ['RBT', 'Behavior tech', 'BCBA', 'BCaBA', 'SETSS', 'SLP', 'OT', 'PT', 'Para'], BOROS = ['Queens', 'Brooklyn', 'Manhattan', 'Bronx', 'Staten Island'], DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  function timeOpts(sel, from, to) { var o = ''; for (var m = (from || 7) * 60; m <= (to || 21) * 60; m += 15) { var v = ('0' + Math.floor(m / 60)).slice(-2) + ':' + ('0' + m % 60).slice(-2); o += '<option value="' + v + '"' + (v === sel ? ' selected' : '') + '>' + T.fmtT(v) + '</option>'; } return o; }
  function ymdLocal(d) { return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
  function nextMonday() { var d = new Date(); d.setDate(d.getDate() + ((8 - d.getDay()) % 7 || 7)); return ymdLocal(d); }
  function chips(name, arr, on, label, multi) {
    on = [].concat(on || []);
    return '<div class="chips" role="group" aria-label="' + esc(label) + '" data-name="' + name + '"' + (multi ? ' data-multi="1"' : '') + '>' + arr.map(function (x) { var v = Array.isArray(x) ? x[0] : x, t = Array.isArray(x) ? x[1] : x, o = on.indexOf(v) >= 0;
      return '<button type="button" data-v="' + esc(v) + '" aria-pressed="' + o + '"' + (o ? ' class="on"' : '') + '>' + esc(t) + '</button>'; }).join('') + '</div>';
  }
  function errP(id) { return '<p class="err" id="' + id + '-err"></p>'; }
  function expandDays(s) {
    var out = []; String(s || '').split(/,\s*/).forEach(function (part) { var m = part.split('\u2013'); if (m.length === 2) { for (var i = DAYS.indexOf(m[0]); i >= 0 && i <= DAYS.indexOf(m[1]); i++) out.push(DAYS[i]); } else if (part) out.push(part.trim()); });
    return out;
  }
  function needForm(n, pre) {
    var edit = !!n; n = n || {};
    var role = n.role || (pre === 'SLP' ? 'SLP' : pre || ''), defaults = { Para: ['08:00', '14:30', ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']] }[role] || ['15:00', '18:00', ['Mon', 'Tue', 'Wed', 'Thu']];
    var days = edit ? expandDays(n.days) : defaults[2];
    return '<div class="view narrow">' + top(edit ? 'Edit job ' + n.code : 'New job', edit ? '#/job/' + n.id : '#/') + '<form id="nf" class="form" novalidate' + (edit ? ' data-id="' + n.id + '"' : '') + '>' +
      '<section class="card"><div class="field"><span class="lbl" id="role-l">Role</span>' + chips('role', ROLE_LIST, role, 'Role') + errP('role') + '</div>' +
      '<div class="field"><span class="lbl">Borough</span>' + chips('borough', BOROS, n.borough, 'Borough') + errP('borough') + '</div>' +
      '<div class="field"><label class="lbl" for="area">Neighborhood <small>optional</small></label><input id="area" maxlength="40" autocomplete="off" placeholder="e.g. Hollis" value="' + esc(n.area || '') + '"></div></section>' +
      '<section class="card"><div class="field"><span class="lbl">Days</span><div class="days" role="group" aria-label="Days">' + DAYS.map(function (d) { var o = days.indexOf(d) >= 0; return '<button type="button" data-day="' + d + '" aria-pressed="' + o + '"' + (o ? ' class="on"' : '') + '>' + d + '</button>'; }).join('') + '</div>' +
      '<div class="presets"><button type="button" data-preset="Mon,Tue,Wed,Thu">Mon\u2013Thu</button><button type="button" data-preset="Mon,Tue,Wed,Thu,Fri">Mon\u2013Fri</button><button type="button" data-preset="Sun,Mon,Tue,Wed,Thu">Sun\u2013Thu</button><button type="button" data-preset="Tue,Thu">Tue + Thu</button></div>' + errP('days') + '</div>' +
      '<div class="field two"><div><label class="lbl" for="from">From</label><select id="from">' + timeOpts(n.from || defaults[0]) + '</select></div><div><label class="lbl" for="to">To</label><select id="to" aria-describedby="to-err">' + timeOpts(n.to || defaults[1]) + '</select></div></div>' + errP('to') +
      '<div class="sum-line" id="hrsline" aria-live="polite">' + ic('clock') + '<span id="hrstxt"></span></div></section>' +
      '<section class="card"><div class="field two"><div><label class="lbl" for="start">Start</label><input id="start" type="date" value="' + esc(n.start || nextMonday()) + '"></div><div><label class="lbl" for="stu">Student initials</label><input id="stu" maxlength="20" autocomplete="off" placeholder="e.g. M.R." value="' + esc(n.student || '') + '"></div></div>' +
      '<div class="field"><label class="lbl" for="notes">Preferences <small>optional, goes in the post</small></label><textarea id="notes" class="short" maxlength="300" placeholder="e.g. Very experienced. BCBA or BCBA-in-training preferred.">' + esc(n.notes || '') + '</textarea></div></section>' +
      '<div class="dock"><button class="btn btn--lg btn--block" type="submit">' + ic(edit ? 'check' : 'pen') + (edit ? 'Save changes' : 'Save and write the post') + '</button></div></form></div>';
  }
  function hrsCalc() {
    var f = document.getElementById('from'), t = document.getElementById('to'); if (!f || !t) return 0;
    var mins = function (v) { var p = v.split(':'); return +p[0] * 60 + +p[1]; }, per = Math.max(0, mins(t.value) - mins(f.value)) / 60;
    var n = document.querySelectorAll('.days button.on').length, tot = Math.round(per * n * 4) / 4;
    var el = document.getElementById('hrstxt'); if (el) el.textContent = !n ? 'Pick the days' : per <= 0 ? 'End time must be after start time' : (n + ' day' + (n > 1 ? 's' : '') + ' \u00d7 ' + per + ' hrs = ' + tot + ' hrs/week');
    return tot;
  }
  function compactDays(list) {
    var idx = list.map(function (d) { return DAYS.indexOf(d); }).sort(), out = [], i = 0;
    while (i < idx.length) { var j = i; while (j + 1 < idx.length && idx[j + 1] === idx[j] + 1) j++; out.push(j - i >= 2 ? DAYS[idx[i]] + '\u2013' + DAYS[idx[j]] : idx.slice(i, j + 1).map(function (k) { return DAYS[k]; }).join(', ')); i = j + 1; }
    return out.join(', ');
  }
  function personForm(p, code) {
    var edit = !!p; p = p || {}; var m = J(p.musts, {}), open = S.needs.filter(function (n) { return n.status === 'open' || n.status === 'posted' || n.code === p.need_code; });
    var nc = p.need_code || code || (open.length === 1 ? open[0].code : ''), nn = needBy(nc);
    var hrs = m.hours === true ? 'yes' : m.hours === false ? 'no' : 'unsure';
    return '<div class="view narrow">' + top(edit ? 'Edit ' + p.name : 'Add from email', edit ? '#/person/' + p.id : nn ? '#/job/' + nn.id : '#/') + '<form id="pf" class="form" novalidate' + (edit ? ' data-id="' + p.id + '"' : '') + '>' +
      (edit ? '' : '<div class="callout callout--blue">' + ic('inbox') + '<span>Got a resume by email? Add the person here. Nothing is sent to them.</span></div>') +
      '<section class="card"><div class="field"><label class="lbl" for="pname">Name</label><input id="pname" maxlength="80" autocomplete="off" required aria-describedby="pname-err" value="' + esc(p.name || '') + '">' + errP('pname') + '</div>' +
      '<div class="field two"><div><label class="lbl" for="pphone">Phone</label><input id="pphone" type="tel" inputmode="tel" maxlength="30" autocomplete="off" aria-describedby="pphone-err" value="' + esc(p.phone || '') + '"></div><div><label class="lbl" for="pemail">Email</label><input id="pemail" type="email" inputmode="email" maxlength="120" autocomplete="off" aria-describedby="pphone-err" value="' + esc(p.email || '') + '"></div></div>' + errP('pphone') +
      '<div class="field"><label class="lbl" for="presume">Resume link <small>Gmail or Drive link</small></label><input id="presume" type="url" inputmode="url" maxlength="400" autocomplete="off" placeholder="https://mail.google.com/\u2026" aria-describedby="presume-err presume-help" value="' + esc(p.resume_url || '') + '"><p class="help" id="presume-help">In Gmail on a computer, open the email and copy the address bar. Or share the resume from Drive and paste the link.</p>' + errP('presume') + '</div></section>' +
      '<section class="card"><div class="field"><label class="lbl" for="pneed">For which job</label><select id="pneed"><option value="">Not sure yet</option>' + open.map(function (n) { return '<option value="' + esc(n.code) + '"' + (n.code === nc ? ' selected' : '') + '>' + esc(n.code + ' \u00b7 ' + needLabel(n) + ' \u00b7 ' + n.borough) + '</option>'; }).join('') + '</select></div>' +
      '<div class="field"><span class="lbl">Their role</span>' + chips('prole', ROLE_LIST, p.role || (nn ? nn.role : ''), 'Their role') + errP('prole') + '</div>' +
      '<div class="field"><label class="lbl" for="pcred">Credential <small>as written on the resume</small></label><input id="pcred" maxlength="80" autocomplete="off" placeholder="e.g. RBT, BCBA in training" value="' + esc(p.credential || '') + '"></div>' +
      '<div class="field"><span class="lbl">Boroughs they cover</span>' + chips('pboro', BOROS, String(p.boroughs || '').split(/,\s*/), 'Boroughs they cover', true) + '</div>' +
      '<div class="field"><label class="lbl" for="pavail">Availability</label><input id="pavail" maxlength="200" autocomplete="off" placeholder="e.g. Weekdays after 2pm" value="' + esc(p.availability || '') + '"></div>' +
      '<div class="field"><span class="lbl">Do their hours fit the job?</span>' + chips('phours', [['yes', 'Yes'], ['no', 'No'], ['unsure', 'Not sure']], hrs, 'Do their hours fit') + '</div>' +
      '<div class="field"><label class="lbl" for="pnotes">Notes</label><textarea id="pnotes" class="short" maxlength="800" placeholder="Experience, languages, anything that stood out">' + esc(p.fit_summary || '') + '</textarea><p class="help">No SSNs, pay or bank numbers here.</p></div></section>' +
      '<div class="dock"><button class="btn btn--lg btn--block" type="submit">' + ic('check') + (edit ? 'Save changes' : 'Add applicant') + '</button></div></form></div>';
  }
  function settingsPage() {
    var st = settings(), w = J(st.windows, null) || T.DEFAULT_WINDOWS, cut = st.friday_cutoff || '12:00';
    return '<div class="view narrow">' + top('Settings', '#/') + '<form id="sf" class="form" novalidate>' +
      '<section class="sec"><div class="sec__h"><h2>Interview times</h2></div><div class="card"><p class="muted small">Times you can take interview calls. Suggested times come from here' + (S.freeTimes && S.freeTimes.length ? ' and your calendar' : '') + '.</p>' +
      DAYS.map(function (d) { var on = w[d] && w[d][0]; return '<div class="win"><button type="button" class="win__day' + (on ? ' on' : '') + '" data-win="' + d + '" aria-pressed="' + !!on + '">' + d + '</button>' +
        '<label class="sr" for="wf-' + d + '">' + d + ' from</label><select id="wf-' + d + '"' + (on ? '' : ' disabled') + '>' + timeOpts(on ? w[d][0] : '10:00', 7, 21) + '</select><span class="win__to" aria-hidden="true">to</span><label class="sr" for="wt-' + d + '">' + d + ' to</label><select id="wt-' + d + '"' + (on ? '' : ' disabled') + '>' + timeOpts(on ? w[d][1] : '13:00', 7, 21) + '</select></div>'; }).join('') + errP('win') +
      '<div class="field"><label class="lbl" for="cut">Friday: no interviews after</label><select id="cut">' + timeOpts(cut, 9, 15) + '</select></div>' +
      '<div class="callout callout--blue">' + ic('shield') + '<span>Never on Shabbat or Yom Tov, and never in the afternoon before Yom Tov (same cutoff as Friday).</span></div></div></section>' +
      '<section class="sec"><div class="sec__h"><h2>Job posts</h2></div><div class="card"><div class="field"><label class="lbl" for="pay">Default pay range <small>optional</small></label><input id="pay" maxlength="60" autocomplete="off" placeholder="Type a range, e.g. per hour" value="' + esc(st.pay_default || '') + '"><p class="help">Fills the \u201cPay:\u201d line in new job posts. NYC law requires a pay range in job ads.</p></div>' +
      '<div class="field"><label class="lbl" for="aemail">Applicants email resumes to</label><input id="aemail" type="email" inputmode="email" maxlength="120" autocomplete="off" aria-describedby="aemail-err" value="' + esc(st.apply_email || '') + '">' + errP('aemail') + '</div></div></section>' +
      '<div class="dock"><button class="btn btn--lg btn--block" type="submit">' + ic('check') + 'Save settings</button></div></form>' +
      '<section class="sec" id="calls"><div class="sec__h"><h2>Phone screening and calls</h2></div><div class="card"><div class="statusline"><span class="tag ' + (calling() ? 'tag--green">On' : 'tag--grey">Off') + '</span><b>' + (calling() ? 'Calling is on' : 'Off \u2014 needs your approval') + '</b></div>' +
      '<p class="muted small">When you approve it, the assistant can answer applicants who text a job code, call to set up interviews at your free times, and bring you into interview calls (it asks for consent to record first). Until then no one is called, and job posts ask for resumes by email.</p>' +
      (calling() ? '' : '<p class="muted small">To turn calls on, you approve: outbound calls (billed per minute), recording only with the candidate\u2019s OK, and the number calls come from. Your live inbound line stays as it is. Until then, call requests wait as \u201cWaiting for your OK\u201d and you can cancel them.</p>') + '</div></section>' +
      '<section class="sec"><div class="sec__h"><h2>How it works</h2></div><div class="card"><ol class="steps">' +
      '<li><b>1</b><span><b>Jobs:</b> add a job. I write the post; you copy it to each site and tap Posted.</span></li>' +
      '<li><b>2</b><span><b>Applicants:</b> resumes come in by email. Add them, check the must-haves, then Interview, Maybe or Pass.</span></li>' +
      '<li><b>3</b><span><b>Interviews:</b> send your free times, set the time, add notes, then make an offer or hire.</span></li>' +
      '<li><b>4</b><span><b>Hires:</b> the welcome email becomes a Gmail draft. You add the rate and send it. Nothing is ever sent for you.</span></li></ol></div></section>' +
      '<section class="sec"><div class="sec__h"><h2>This device</h2></div><div class="card"><div class="btns">' + installBtn('btn btn--ghost') + (DEMO ? '<button class="btn btn--ghost" data-act="reset">Reset demo</button>' : '<button class="btn btn--red" data-act="signout">Sign out on this device</button>') + '</div><p class="muted small">Signing out removes your private link from this phone. You\u2019ll need the link again to get back in.</p></div></section>' + foot() + '</div>';
  }
  function flyer(id) {
    var n = needId(id); if (!n) return notFound();
    var v = T.versions(n, n.jd || T.jd(n, ap(), settings().pay_default), ap()), r = T.R[n.role] || T.R.RBT, a = ap();
    return '<div class="view narrow"><div class="noprint">' + top('Flyer', '#/job/' + n.id, '<button class="pill" data-act="print">' + ic('print') + 'Print</button>') + '</div><div class="flyer card"><p class="org">Together They Grow</p><h1>' + esc(r.short) + ' wanted</h1><p class="big">' + esc(T.where(n) + ' \u00b7 ' + T.sched(n)) + '</p><ul>' + r.musts.map(function (m) { return '<li>' + esc(m) + '</li>'; }).join('') + '</ul>' +
      (v.pay ? '<p class="big">Pay: ' + esc(v.pay) + '</p>' : '<div class="callout callout--red noprint">' + ic('alert') + '<span>Add the pay range on the job post first.</span></div>') + '<div class="qrbig">' + qrSvg(qrText(n), 7) + '</div><p class="big">Scan, or ' + (a.mode === 'text' ? 'text <b>' + esc(n.code) + '</b> to ' + esc(a.line) : 'email your resume to <b>' + esc(a.email || '') + '</b> with \u201c' + esc(n.code) + '\u201d in the subject') + '</p></div></div>';
  }
  function gate(e) {
    var msg = !token ? 'This is a private app. Open it from your personal link.' : e && e.status === 401 ? 'This link isn\u2019t valid anymore. Ask for a new one.' : e && e.net ? errMsg(e).replace(' Nothing was saved.', '') + '. Check your connection and try again.' : 'Something went wrong loading your data. Try again.';
    app.innerHTML = '<div class="view gate" role="alert"><img src="icons/icon-192.png" alt="" width="96" height="96"><h1>TTG Recruiting</h1><p>' + esc(msg) + '</p><div class="btns">' + (token && !(e && e.status === 401) ? '<button class="btn btn--lg" data-act="reload">' + ic('refresh') + 'Try again</button>' : '') + '<a class="btn btn--lg btn--ghost" href="?demo=1">See the demo</a></div></div>';
  }
  function sheet(html) {
    closeSheet(true); var b = document.createElement('div'); b.className = 'backdrop'; b.dataset.act = 'closesheet';
    var s = document.createElement('div'); s.className = 'sheet'; s.setAttribute('role', 'dialog'); s.setAttribute('aria-modal', 'true'); s.innerHTML = '<div class="sheet__grab"></div>' + html;
    document.body.appendChild(b); document.body.appendChild(s);
    try { history.pushState({ sheet: 1 }, '', location.href); } catch (e) {}
    var f = s.querySelector('button, a'); if (f) f.focus();
  }
  function closeSheet(silent) {
    var had = document.querySelector('.sheet'); document.querySelectorAll('.backdrop,.sheet').forEach(function (x) { x.remove(); });
    if (had && !silent && history.state && history.state.sheet) history.back();
  }

  /* ---------- router + back stack ----------
     The in-app back arrow behaves like Android's back button: it goes back one screen in this app.
     A deep link opened cold gets home inserted underneath, so back never exits on the first tap. */
  var NAV = J(sessionStorage.getItem('ttgr.nav'), []), replacing = false;
  function navSave() { try { sessionStorage.setItem('ttgr.nav', JSON.stringify(NAV.slice(-60))); } catch (e) {} }
  function cur() { return location.hash && location.hash !== '#' ? location.hash : '#/'; }
  function track() {
    var h = cur();
    if (replacing) { NAV[NAV.length - 1] = h; replacing = false; }
    else if (NAV.length > 1 && NAV[NAV.length - 2] === h) NAV.pop();
    else if (NAV[NAV.length - 1] !== h) NAV.push(h);
    navSave();
  }
  function go(h, replace) { if (cur() === h) { render(); return; } if (replace) { replacing = true; location.replace(h); } else location.hash = h; }
  function back(parent) { if (NAV.length > 1) history.back(); else { NAV = [parent || '#/']; navSave(); replacing = true; location.replace(parent || '#/'); } }
  (function seed() {
    var h = cur();
    var r0 = h.split('/')[1] || '', root = /^(job|need|flyer)$/.test(r0) ? '#/jobs' : r0 === 'person' ? '#/applicants' : '#/';   // a cold deep link backs out to its tab
    if (h !== '#/' && h !== root && NAV[NAV.length - 1] !== h) { try { history.replaceState(null, '', root); history.pushState(null, '', h); } catch (e) {} NAV = [root, h]; navSave(); }
    else if (!NAV.length) { NAV = [h]; navSave(); }
  })();
  function route() { return cur().replace(/^#\/?/, '').split('/').map(function (x) { return decodeURIComponent(x); }); }
  function render(keep) {
    if (!S) return;
    var h = route(), v, y = window.scrollY, ae = document.activeElement && document.activeElement.id;
    if (keep && /^(nf|pf|sf)$/.test((document.querySelector('form') || {}).id || '')) return;   // never wipe a form someone is typing in
    if (h[0] === 'need') h[0] = 'job';   // v3 links
    if (h[0] === 'stage') v = h[1] === 'interviews' ? interviewsPage() : h[1] === 'welcome' ? hiresPage() : h[1] === 'applicants' ? applicantsPage() : jobsPage();
    else if (h[0] === 'jobs') v = jobsPage(h[1]);
    else if (h[0] === 'job' && h[2] === 'edit') v = needId(h[1]) ? needForm(needId(h[1])) : notFound();
    else if (h[0] === 'job') v = jobPage(h[1], h[2]);
    else if (h[0] === 'applicants') v = applicantsPage(h[1]);
    else if (h[0] === 'interviews') v = interviewsPage(h[1]);
    else if (h[0] === 'hires') v = hiresPage();
    else if (h[0] === 'person' && h[2] === 'edit') v = personBy(h[1]) ? personForm(personBy(h[1])) : notFound();
    else if (h[0] === 'person') v = personPage(h[1]);
    else if (h[0] === 'new') v = needForm(null, h[1] || '');
    else if (h[0] === 'add') v = personForm(null, h[1] || '');
    else if (h[0] === 'settings') v = settingsPage();
    else if (h[0] === 'flyer') v = flyer(h[1]);
    else v = home();
    setTabs(tabOf(h));
    var jd = document.getElementById('jd'), jdv = keep && jd && jd.dataset.dirty ? jd.value : null;
    app.innerHTML = v;
    if (jdv !== null && document.getElementById('jd')) { document.getElementById('jd').value = jdv; document.getElementById('jd').dataset.dirty = '1'; }
    if (h[0] === 'new' || (h[0] === 'job' && h[2] === 'edit')) hrsCalc();
    if (keep) { window.scrollTo(0, y); if (ae && document.getElementById(ae)) document.getElementById(ae).focus({ preventScroll: true }); }
    else if (h[0] === 'settings' && h[1] === 'calls') { var c = document.getElementById('calls'); if (c) setTimeout(function () { c.scrollIntoView(); }, 0); }
  }
  var segY = null;
  window.addEventListener('hashchange', function () {
    track(); closeSheet(true); render();
    if (segY !== null) { window.scrollTo(0, segY); segY = null; } else if (!/settings\/calls$/.test(location.hash)) window.scrollTo(0, 0);
    var h1 = app.querySelector('h1'); if (h1) { h1.setAttribute('tabindex', '-1'); h1.focus({ preventScroll: true }); }
  });
  window.addEventListener('popstate', function () { if (document.querySelector('.sheet')) closeSheet(true); });

  /* ---------- validation helpers ---------- */
  function fieldErr(id, msg) {
    var p = document.getElementById(id + '-err'), el = document.getElementById(id) || document.querySelector('[data-name="' + id + '"]');
    if (p) p.textContent = msg || '';
    if (el) { if (msg) el.setAttribute('aria-invalid', 'true'); else el.removeAttribute('aria-invalid'); }
    return !msg;
  }
  function firstErr() { var e = Array.prototype.filter.call(document.querySelectorAll('.err'), function (x) { return x.textContent; })[0]; if (e) { e.scrollIntoView({ block: 'center' }); var f = e.parentNode.querySelector('input,select,textarea,button'); if (f) f.focus({ preventScroll: true }); } return !e; }
  function pick(n) { var x = document.querySelectorAll('.chips[data-name="' + n + '"] .on'); return Array.prototype.map.call(x, function (b) { return b.dataset.v; }); }
  function val(i) { var e = document.getElementById(i); return e ? e.value.trim() : ''; }
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  function secretish(s) { return /\b\d{3}-\d{2}-\d{4}\b/.test(s) || /\d{9,}/.test(String(s).replace(/[\s-]/g, '')) && !/^[\s()+\d.-]*$/.test(s); }

  /* ---------- events ---------- */
  document.addEventListener('input', function (ev) { if (ev.target.id === 'jd') ev.target.dataset.dirty = '1'; if (ev.target.getAttribute('aria-invalid')) fieldErr(ev.target.id, ''); });
  document.addEventListener('change', function (ev) {
    if (ev.target.id === 'from' || ev.target.id === 'to') { hrsCalc(); fieldErr('to', ''); }
    if (ev.target.id === 'pneed') { var nn = needBy(ev.target.value); if (nn && !pick('prole').length) { var b = document.querySelector('.chips[data-name="prole"] [data-v="' + nn.role + '"]'); if (b) { b.classList.add('on'); b.setAttribute('aria-pressed', 'true'); } } }
  });
  function stamp() { return new Date().toISOString().slice(0, 16); }
  function installApp() { if (AI) AI.install(); }
  document.addEventListener('click', function (ev) {
    var l = ev.target.closest('a[href^="#/"]'); if (!l || ev.defaultPrevented || ev.metaKey || ev.ctrlKey) return;
    var href = l.getAttribute('href');
    if (l.dataset.replace) { ev.preventDefault(); segY = window.scrollY; go(href, true); return; }
    if (l.classList.contains('tab')) {
      ev.preventDefault(); if (cur() === href) { window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
      if (href === '#/') { if (NAV.length > 1 && NAV[NAV.length - 2] === '#/') history.back(); else { NAV = ['#/']; navSave(); replacing = true; location.replace('#/'); } return; }
      var root = tabOf(route()) && /^#\/(jobs|applicants|interviews|hires)?(\/[a-z]+)?$/.test(cur()) && cur() !== '#/';
      go(href, root);
    }
  });
  document.addEventListener('input', function (ev) {
    if (ev.target.id === 'aq') { AF.q = ev.target.value; var L = document.getElementById('alist'); if (L) L.innerHTML = applicantList(L.dataset.seg); }
  });
  document.addEventListener('change', function (ev) {
    if (ev.target.id === 'afjob' || ev.target.id === 'afcred') { AF[ev.target.id === 'afjob' ? 'job' : 'cred'] = ev.target.value; render(true); }
  });
  document.addEventListener('click', function (ev) {
    var b = ev.target.closest('button, [data-act]'); if (!b) return;
    var d = b.dataset, id = d.id;
    var grp = b.closest('.chips');
    if (grp && d.v) {
      if (grp.dataset.multi) { var on = !b.classList.contains('on'); b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on)); }
      else { grp.querySelectorAll('button').forEach(function (x) { x.classList.remove('on'); x.setAttribute('aria-pressed', 'false'); }); b.classList.add('on'); b.setAttribute('aria-pressed', 'true'); }
      fieldErr(grp.dataset.name, ''); return;
    }
    if (d.day) { var o = b.classList.toggle('on'); b.setAttribute('aria-pressed', String(o)); hrsCalc(); fieldErr('days', ''); return; }
    if (d.preset) { var ds = d.preset.split(','); document.querySelectorAll('.days button').forEach(function (x) { var o2 = ds.indexOf(x.dataset.day) >= 0; x.classList.toggle('on', o2); x.setAttribute('aria-pressed', String(o2)); }); hrsCalc(); fieldErr('days', ''); return; }
    if (d.win) { var w = b.classList.toggle('on'); b.setAttribute('aria-pressed', String(w)); document.getElementById('wf-' + d.win).disabled = !w; document.getElementById('wt-' + d.win).disabled = !w; return; }
    if (d.unfit) { showUnfit[d.unfit] = 1; render(true); return; }
    if (d.copy) { var n = needId(route()[1]); copy(T.versions(n, document.getElementById('jd').value, ap()).text[d.copy]); return; }
    if (d.posted) { act('markPosted', [id, d.posted], { msg: 'Marked posted on ' + T.CHANNELS[d.posted].name, undo: ['unmarkPosted', [id, d.posted]],
      local: function () { var x = needId(id), p = J(x.posted, {}); p[d.posted] = stamp(); x.posted = JSON.stringify(p); if (x.status === 'open') x.status = 'posted'; } }); return; }
    if (d.unposted) { act('unmarkPosted', [id, d.unposted], { msg: 'Unmarked', local: function () { var x = needId(id), p = J(x.posted, {}); delete p[d.unposted]; x.posted = JSON.stringify(p); } }); return; }
    if (d.decide) {
      var p = personBy(id), dec = d.decide, newStage = { interview: 'interview', maybe: 'maybe', offer: 'offer', pass: 'pass', hire: 'hired', welcome: 'welcome', applicant: 'applicant' }[dec]; closeSheet(true);
      var msg = { interview: 'Moved to interviews', maybe: 'Saved as maybe', offer: 'Offer noted for ' + first(p.name) + '. Nothing was sent.', pass: 'Passed on ' + first(p.name), hire: 'Hired ' + first(p.name) + '. Welcome packet is next.', welcome: 'Marked sent', applicant: 'Back in new applicants' }[dec];
      act('decide', [id, dec], { msg: msg, undo: ['undoDecide', [id]], local: function () { p.prev_stage = p.stage; p.stage = newStage; if (dec === 'interview' && !ivFor(id)) S.interviews.push({ id: 'tmp', person_id: id, need_code: p.need_code, status: 'to_schedule' }); } })
        .then(ok(function () { if ((dec === 'pass' || dec === 'maybe') && needBy(p.need_code)) go('#/job/' + needBy(p.need_code).id + '/applicants', true); }));
      return;
    }
    if (d.undo) { act('undoDecide', [d.undo], { msg: 'Undone' }); return; }
    if (d.cred) { act('setCred', [id, d.cred], { msg: d.cred === 'verified' ? 'Marked valid' : d.cred === 'not_found' ? 'Marked not found' : 'Check cleared', local: function () { personBy(id).cred_status = d.cred; } }); return; }
    if (d.cancelq) { act('cancelQueue', [d.cancelq], { msg: 'Request cancelled', local: function () { S.queue.forEach(function (q) { if (q.id === d.cancelq) q.status = 'cancelled'; }); } }); return; }
    if (d.dismiss) { var key = d.dismiss, sig = d.sig; act('dismiss', [key, sig], { msg: 'Hidden', undo: ['undismiss', [key], function () { S.dismissed = S.dismissed.filter(function (x) { return x.key !== key; }); }], local: function () { S.dismissed.push({ key: key, sig: sig }); } }); return; }
    if (d.close) { var cn = needId(id), prev = cn.status; go('#/jobs', true); act('updateNeed', [id, { status: d.close }], { msg: d.close === 'filled' ? 'Marked filled' : 'Job closed', undo: ['updateNeed', [id, { status: prev }]], local: function () { cn.status = d.close; } }); return; }
    if (d.reopen) { var rn = needId(d.reopen); act('updateNeed', [d.reopen, { status: Object.keys(J(rn.posted, {})).length ? 'posted' : 'open' }], { msg: 'Reopened', local: function () { rn.status = Object.keys(J(rn.posted, {})).length ? 'posted' : 'open'; } }); return; }
    if (d.pause) { var pn = needId(d.pause); act('updateNeed', [d.pause, { status: 'paused' }], { msg: 'Job paused', undo: ['updateNeed', [d.pause, { status: pn.status }]], local: function () { pn.status = 'paused'; } }); return; }
    if (d.resume) { var rs = needId(d.resume), to = Object.keys(J(rs.posted, {})).length ? 'posted' : 'open'; act('updateNeed', [d.resume, { status: to }], { msg: 'Job resumed', local: function () { rs.status = to; } }); return; }
    if (d.ts) { var tp = personBy(id), on1 = d.ts === '1'; act('updatePerson', [id, { timesheet: on1 }], { msg: on1 ? 'Timesheet marked received' : 'Timesheet unmarked', local: function () { tp.timesheet_at = on1 ? stamp() : ''; } }); return; }
    var a = d.act; if (!a) return;
    if (a === 'movestage') { var mp = personBy(id), cg = segOf(mp);
      sheet('<h2>Move ' + esc(first(mp.name)) + ' to\u2026</h2><p class="muted small">Now: ' + esc(segName(cg)) + '. Nothing is sent to them.</p><div class="sheetlist">' + SEGS.filter(function (x) { return x[0] !== cg; }).map(function (x) { return '<button class="btn btn--ghost btn--lg btn--block" data-decide="' + SEG_DECIDE[x[0]] + '" data-id="' + mp.id + '">' + esc(x[1]) + '</button>'; }).join('') + '<button class="btn btn--soft btn--lg btn--block" data-act="closesheet">Cancel</button></div>'); return; }
    if (a === 'savefit') { var fv = val('fitn'); if (secretish(fv)) return toast('That looks like an ID or bank number. Leave it out.'); act('updatePerson', [id, { fit_summary: fv }], { msg: 'Notes saved', local: function () { personBy(id).fit_summary = fv; } }); return; }
    if (a === 'setstart') { var sd = val('sdate'); if (!/^\d{4}-\d{2}-\d{2}$/.test(sd)) return toast('Pick a start date'); act('updatePerson', [id, { start_date: sd }], { msg: 'Start date saved', local: function () { personBy(id).start_date = sd; } }); return; }
    if (a === 'clearf') { AF = { q: '', job: '', cred: '' }; render(true); return; }
    if (a === 'more') { openMore = true; render(true); }
    else if (a === 'back') back(d.parent);
    else if (a === 'closesheet') closeSheet();
    else if (a === 'print') window.print();
    else if (a === 'undo') { var f = undoFn; undoFn = null; document.getElementById('toast').className = 'toast'; if (f) f(); }
    else if (a === 'install') installApp();
    else if (a === 'reset') { localStorage.removeItem(DKEY); D = null; S = null; load().then(function () { toast('Demo data reset'); }); }
    else if (a === 'reload' || a === 'refresh') load(true).then(function () { if (a === 'refresh' && !offline) toast('Up to date'); });
    else if (a === 'retry') { document.getElementById('toast').className = 'toast'; if (lastFail) { var lf = lastFail; lastFail = null; lf(); } else load(true); }
    else if (a === 'signout') sheet('<h2>Sign out on this device?</h2><p class="muted">Your private link is removed from this phone. Nothing in the sheet changes.</p><div class="btns"><button class="btn btn--lg btn--red" data-act="signout2">Sign out</button><button class="btn btn--lg btn--ghost" data-act="closesheet">Cancel</button></div>');
    else if (a === 'signout2') { try { localStorage.removeItem(KEY); sessionStorage.clear(); } catch (e) {} token = null; S = null; closeSheet(true); gate(); }
    else if (a === 'savejd') { var jd = document.getElementById('jd'); act('updateNeed', [id, { jd: jd.value }], { msg: T.payOf(jd.value) ? 'Saved' : 'Saved. Add the pay range before posting.', local: function () { needId(id).jd = jd.value; } }).then(ok(function () { var j = document.getElementById('jd'); if (j) delete j.dataset.dirty; })); }
    else if (a === 'resetjd') { var j2 = document.getElementById('jd'); j2.value = T.jd(needId(id), ap(), settings().pay_default); j2.dataset.dirty = '1'; toast('Rewritten from the need details. Tap Save to keep it.'); }
    else if (a === 'outreach') act('queue', ['draft_outreach', '', d.code, {}], { msg: 'Queued. The drafts will be in your Gmail drafts.' });
    else if (a === 'schedcall') act('queue', ['call_schedule', id, (personBy(id) || {}).need_code, { interview_id: d.iv, times: freeSlots().times.map(function (t) { return t.toISOString(); }) }], { msg: 'Saved. It waits for your OK to turn on calling.' });
    else if (a === 'invite') act('queue', ['draft_invite', id, (personBy(id) || {}).need_code, { times: freeSlots().times.map(slotLabel) }], { msg: 'Queued. The email will be in your Gmail drafts.' });
    else if (a === 'ivcall') act('queue', ['call_interview', id, (personBy(id) || {}).need_code, { interview_id: d.iv }], { msg: 'Saved. It waits for your OK to turn on calling.' });
    else if (a === 'settime') {
      var t = val('ivt'), dt = pd(t);
      if (!dt) return fieldErr('ivt', 'Pick a date and time');
      if (!T.slotOk(dt, settings().friday_cutoff)) return fieldErr('ivt', 'That\u2019s Shabbat, Yom Tov, or after your Friday cutoff. Pick another time.');
      if (dt < Date.now() - 36e5) return fieldErr('ivt', 'That time has passed');
      fieldErr('ivt', ''); act('setInterview', [d.iv, { when: t, status: 'scheduled' }], { msg: 'Interview set for ' + when(t) });
    }
    else if (a === 'ivreset') act('setInterview', [d.iv, { when: '', status: 'to_schedule' }], { msg: 'Pick a new time' });
    else if (a === 'ivnotes') { var nt = val('ivn'); if (!nt) return toast('Write a few notes first'); if (secretish(nt)) return toast('That looks like an ID or bank number. Leave it out.'); act('setInterview', [d.iv, { notes: nt, status: 'done' }], { msg: 'Notes saved. Hire or pass when ready.' }); }
    else if (a === 'welcome') { var pw = personBy(id); act('queue', ['draft_welcome', id, pw.need_code, { role: pw.role }], { msg: 'Queued. The welcome draft will be in your Gmail drafts.' }); }
  });
  document.addEventListener('submit', function (ev) {
    var f = ev.target; ev.preventDefault();
    if (f.id === 'nf') {
      var role = pick('role')[0], boro = pick('borough')[0], days = Array.prototype.map.call(document.querySelectorAll('.days button.on'), function (b) { return b.dataset.day; });
      fieldErr('role', role ? '' : 'Pick a role'); fieldErr('borough', boro ? '' : 'Pick a borough'); fieldErr('days', days.length ? '' : 'Pick at least one day');
      fieldErr('to', val('to') > val('from') ? '' : 'End time must be after start time');
      if (secretish(val('notes'))) fieldErr('notes', 'That looks like an ID or bank number.');
      if (!firstErr()) return;
      var need = { role: role, borough: boro, area: val('area'), days: compactDays(days), from: val('from'), to: val('to'), start: val('start'), hrs_week: hrsCalc(), student: val('stu'), notes: val('notes') };
      var eid = f.dataset.id;
      if (eid) {
        var old = needId(eid), autoText = old.jd && old.jd === T.jd(old, ap(), settings().pay_default), patch = JSON.parse(JSON.stringify(need));
        if (autoText) patch.jd = T.jd(Object.assign({}, old, need), ap(), settings().pay_default);
        act('updateNeed', [eid, patch], { msg: old.jd && !autoText ? 'Saved. Your edited post wasn\u2019t changed. Tap \u201cRewrite from details\u201d to update it.' : 'Saved' }).then(ok(function () { go('#/job/' + eid, true); }));
      } else {
        f.querySelector('[type=submit]').disabled = true;
        act('addNeed', [need]).then(function (r) {
          if (r === FAIL) { f.querySelector('[type=submit]').disabled = false; return; }
          return act('updateNeed', [r.id, { jd: T.jd(r, ap(), settings().pay_default) }], { msg: settings().pay_default ? 'Saved. Read the post, then post it.' : 'Saved. Read the post and add the pay range.' }).then(function () { go('#/job/' + r.id + '/post', true); });
        });
      }
    } else if (f.id === 'pf') {
      var name = val('pname'), phone = val('pphone'), email = val('pemail'), url = val('presume'), prole = pick('prole')[0];
      fieldErr('pname', name ? (secretish(name) ? 'Check the name' : '') : 'Add their name');
      fieldErr('pphone', !phone && !email ? 'Add a phone or an email' : phone && phone.replace(/\D/g, '').length < 10 ? 'Check the phone number' : email && !EMAIL_RE.test(email) ? 'Check the email address' : '');
      fieldErr('presume', url && !/^https:\/\//i.test(url) ? 'Paste a link that starts with https://' : '');
      fieldErr('prole', prole ? '' : 'Pick their role');
      if (secretish(val('pnotes')) || secretish(val('pcred')) || secretish(val('pavail'))) { toast('Notes look like they contain an ID or bank number. Leave it out.'); return; }
      if (!firstErr()) return;
      var hrs = pick('phours')[0];
      var pp = { name: name, phone: phone, email: email, resume_url: url, need_code: val('pneed'), role: prole, credential: val('pcred'), boroughs: pick('pboro').join(', '), availability: val('pavail'), fit_summary: val('pnotes'), hours_fit: hrs === 'yes' ? true : hrs === 'no' ? false : null };
      var pid = f.dataset.id;
      if (pid) act('updatePerson', [pid, pp], { msg: 'Saved' }).then(ok(function () { go('#/person/' + pid, true); }));
      else { pp.source = 'Email'; f.querySelector('[type=submit]').disabled = true;
        act('addPerson', [pp], { msg: 'Added ' + first(name) + '. Nothing was sent to them.' }).then(function (r) { if (r === FAIL || !r.id) { f.querySelector('[type=submit]').disabled = false; return; } go('#/person/' + r.id, true); }); }
    } else if (f.id === 'sf') {
      var wins = {}, bad = '';
      DAYS.forEach(function (dd) { var on = document.querySelector('[data-win="' + dd + '"]').classList.contains('on'); if (on) { var a1 = val('wf-' + dd), b1 = val('wt-' + dd); if (b1 <= a1) bad = dd + ': end time must be after start time'; wins[dd] = [a1, b1]; } });
      if (!Object.keys(wins).length) bad = 'Turn on at least one day';
      fieldErr('win', bad); var ae = val('aemail'); fieldErr('aemail', ae && !EMAIL_RE.test(ae) ? 'Check the email address' : '');
      if (!firstErr()) return;
      act('setSettings', [{ windows: wins, friday_cutoff: val('cut'), pay_default: val('pay'), apply_email: ae }], { msg: 'Settings saved', local: function () { S.settings = Object.assign({}, S.settings, { windows: JSON.stringify(wins), friday_cutoff: val('cut'), pay_default: val('pay'), apply_email: ae }); } });
    }
  });

  /* ---------- pull to refresh (phones) ---------- */
  var ptr = document.createElement('div'); ptr.className = 'ptr'; ptr.setAttribute('aria-hidden', 'true'); ptr.innerHTML = ic('refresh'); document.body.appendChild(ptr);
  var y0 = null, dy = 0;
  document.addEventListener('touchstart', function (e) { y0 = (window.scrollY <= 0 && S && !document.querySelector('.sheet') && !e.target.closest('textarea,select,input,.days,.chips')) ? e.touches[0].clientY : null; dy = 0; }, { passive: true });
  document.addEventListener('touchmove', function (e) {
    if (y0 === null) return; dy = e.touches[0].clientY - y0;
    if (dy > 10 && window.scrollY <= 0) { var k = Math.min(dy / 2, 80); ptr.style.transform = 'translate(-50%,' + k + 'px) rotate(' + (dy * 2) + 'deg)'; ptr.classList.add('on'); ptr.classList.toggle('ready', dy > 130); }
  }, { passive: true });
  document.addEventListener('touchend', function () {
    if (y0 === null) return; var go2 = dy > 130; y0 = null; dy = 0;
    if (go2) { ptr.classList.add('spin'); load(true).then(function () { ptr.className = 'ptr'; ptr.style.transform = ''; if (!offline) toast('Up to date'); }); }
    else { ptr.className = 'ptr'; ptr.style.transform = ''; }
  }, { passive: true });

  /* ---------- online / offline ---------- */
  window.addEventListener('offline', function () { offline = true; render(true); });
  window.addEventListener('online', function () { if (S) load(true); else if (token || DEMO) load(); });
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible' && S && !pending && !document.querySelector('form')) load(true); });

  /* ---------- install + service worker ---------- */
  /* Install button: shared kit (install.js) handles the prompt, Chrome hand-off from in-app browsers, help sheets, standalone. */
  if (AI) AI.onChange(function () { if (S && !document.querySelector('form')) render(true); });
  if ('serviceWorker' in navigator && window.isSecureContext) navigator.serviceWorker.register('sw.js', { scope: './' }).catch(function () {});

  if (!DEMO && !token) gate(); else load();
})();
