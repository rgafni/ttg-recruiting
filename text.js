/* Text generators: job descriptions, channel versions, messages. No pay is ever generated:
   the pay line is a placeholder until the director types it (NYC & NYS law require a pay range in job ads). */
(function () {
  var ORG = 'Together They Grow';
  var ABOUT = ORG + ' is a NYC special-education agency. We match caring, skilled providers with autistic students and their teams, and we back you with real clinical supervision.';
  var PAY_PH = '[type the pay range]';

  var R = {
    'RBT': { title: 'Registered Behavior Technician (RBT)', short: 'RBT',
      does: ['Run 1:1 ABA sessions from the student\u2019s behavior plan', 'Take session data and write short, clear notes', 'Work closely with the supervising BCBA and the student\u2019s team', 'Keep sessions safe, warm and engaging'],
      musts: ['Active RBT certification (BACB)', 'Experience with autistic children or teens', 'Reliable for the full schedule'],
      nice: ['School or home-based ABA experience', 'A second language (Spanish, Yiddish, Russian, Mandarin\u2026)'],
      cred: 'RBT', verify: 'bacb', boards: ['linkedin', 'indeed', 'college', 'aba', 'community'] },
    'Behavior tech': { title: 'Behavior Technician (RBT training supported)', short: 'Behavior tech',
      does: ['Support a student 1:1 using ABA strategies from the plan', 'Take simple session data', 'Learn from a BCBA supervisor every week'],
      musts: ['High-school diploma or equivalent', 'Experience with children (camp, classroom, aide, sibling care counts)', 'Reliable for the full schedule', 'Willing to complete the 40-hour RBT training'],
      nice: ['Psychology or education student', 'Experience with autism'],
      cred: 'High-school diploma', verify: '', boards: ['indeed', 'college', 'community', 'linkedin', 'aba'] },
    'BCBA': { title: 'Board Certified Behavior Analyst (BCBA / NY LBA)', short: 'BCBA',
      does: ['Write and update FBAs and behavior plans', 'Supervise and coach RBTs in the field', 'Run family and team training', 'Track progress and keep documentation audit-ready'],
      musts: ['Active BCBA certification', 'New York LBA license', 'Experience with autistic school-age students'],
      nice: ['School-based consultation experience', 'Experience supervising RBTs'],
      cred: 'BCBA + NY LBA', verify: 'both', boards: ['aba', 'linkedin', 'indeed', 'community', 'college'] },
    'BCaBA': { title: 'Board Certified Assistant Behavior Analyst (BCaBA / NY CBAA)', short: 'BCaBA',
      does: ['Support behavior plans under an LBA', 'Coach RBTs on plan fidelity', 'Collect and graph data'],
      musts: ['Active BCaBA certification', 'New York CBAA certification', 'Experience with autistic students'],
      nice: ['Working toward BCBA'],
      cred: 'BCaBA + NY CBAA', verify: 'both', boards: ['aba', 'linkedin', 'indeed', 'college', 'community'] },
    'SETSS': { title: 'SETSS Provider (Special Education Teacher Support Services)', short: 'SETSS',
      does: ['Deliver SETSS to the student\u2019s IEP/IESP goals', 'Plan sessions and track progress on goals', 'Coordinate with the school and the student\u2019s team', 'Keep session logs accurate and on time'],
      musts: ['NYS Students with Disabilities certificate (matching grade band)', 'NYC DOE clearance, or ready to complete it', 'Reliable for the full schedule'],
      nice: ['Experience with autistic learners', 'Orton-Gillingham or structured literacy training'],
      cred: 'NYS SWD certificate', verify: 'nysed', boards: ['linkedin', 'indeed', 'college', 'community', 'aba'] },
    'SLP': { title: 'Speech-Language Pathologist (SLP)', short: 'Speech',
      does: ['Provide speech-language therapy to IEP goals', 'Support AAC and functional communication', 'Coordinate with the student\u2019s team'],
      musts: ['NYS SLP license', 'TSSLD certification (for school-based services)', 'NYC DOE clearance, or ready to complete it'],
      nice: ['AAC experience', 'Bilingual'],
      cred: 'NYS SLP + TSSLD', verify: 'nysed', boards: ['linkedin', 'indeed', 'community', 'college', 'aba'] },
    'OT': { title: 'Occupational Therapist (OT)', short: 'OT',
      does: ['Provide OT to IEP goals (fine motor, sensory, self-care)', 'Coordinate with the student\u2019s team'],
      musts: ['NYS OT license', 'NYC DOE clearance, or ready to complete it'], nice: ['Sensory integration training'],
      cred: 'NYS OT license', verify: 'nysed', boards: ['linkedin', 'indeed', 'community', 'college', 'aba'] },
    'PT': { title: 'Physical Therapist (PT)', short: 'PT',
      does: ['Provide PT to IEP goals', 'Coordinate with the student\u2019s team'],
      musts: ['NYS PT license', 'NYC DOE clearance, or ready to complete it'], nice: ['School-based pediatric experience'],
      cred: 'NYS PT license', verify: 'nysed', boards: ['linkedin', 'indeed', 'community', 'college', 'aba'] },
    'Para': { title: 'Special Education Paraprofessional (1:1)', short: 'Para',
      does: ['Support one student through the school day', 'Follow the student\u2019s IEP and behavior plan', 'Help with transitions, routines and safety'],
      musts: ['NYS Teaching Assistant certificate, or able to get one', 'Fingerprint clearance, or ready to complete it', 'Reliable for the full school day'],
      nice: ['Experience with autistic students', 'Psychology or education student'],
      cred: 'TA certificate', verify: 'nysed', boards: ['indeed', 'college', 'community', 'linkedin', 'aba'] }
  };
  var CHANNELS = {
    linkedin: { name: 'LinkedIn', url: 'https://www.linkedin.com/talent/post-a-job' },
    indeed: { name: 'Indeed', url: 'https://employers.indeed.com/p/post-job' },
    college: { name: 'Handshake / college boards', url: 'https://app.joinhandshake.com/employers' },
    aba: { name: 'ABA job boards', url: 'https://careers.abainternational.org/' },
    community: { name: 'WhatsApp / flyer', url: '' }
  };
  var VERIFY = { bacb: { name: 'BACB lookup', url: 'https://www.bacb.com/verify-certification/' },
                 nysed: { name: 'NYSED license lookup', url: 'https://eservices.nysed.gov/professions/verification-search' } };

  function fmtT(t) { if (!t) return ''; var p = String(t).split(':'), h = +p[0], m = p[1] || '00'; var ap = h >= 12 ? 'pm' : 'am'; h = h % 12 || 12; return h + (m === '00' ? '' : ':' + m) + ap; }
  function sched(n) { return (n.days || '') + (n.from ? ' \u00b7 ' + fmtT(n.from) + '\u2013' + fmtT(n.to) : ''); }
  function fmtDate(d) { if (!d) return 'as soon as possible'; var x = new Date(String(d).slice(0, 10) + 'T12:00'); return isNaN(x) ? d : x.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }); }
  function role(n) { return R[n.role] || R.RBT; }
  function howApply(n, line) {
    return 'How to apply: text ' + n.code + ' to ' + line + ' (or call). A friendly assistant will ask a few quick questions; it takes about 5 minutes, any time of day. A person on our team reviews every applicant.';
  }
  function jd(n, line) {
    var r = role(n);
    return [
      r.title + ' \u2014 ' + n.borough + ' (' + sched(n) + ')',
      '',
      ABOUT,
      '',
      'The role',
      'A ' + (n.hrs_week ? n.hrs_week + '-hour/week ' : '') + 'position supporting one student in ' + n.borough + '. Schedule: ' + sched(n) + '. Start: ' + fmtDate(n.start) + '.',
      '',
      'What you\u2019ll do',
      r.does.map(function (x) { return '\u2022 ' + x; }).join('\n'),
      '',
      'Must have',
      r.musts.map(function (x) { return '\u2022 ' + x; }).join('\n'),
      '',
      'Nice to have',
      r.nice.map(function (x) { return '\u2022 ' + x; }).join('\n'),
      '',
      'What you get',
      '\u2022 Real clinical support: a supervisor you can reach, not just a schedule',
      '\u2022 A steady caseload close to home',
      '\u2022 Simple monthly paperwork (one log per student per month)',
      '',
      'Pay: ' + PAY_PH,
      '',
      howApply(n, line),
      '',
      ORG + ' is an equal-opportunity employer. We welcome applicants of every background, and we provide reasonable accommodations in hiring; just ask.'
    ].join('\n');
  }
  function payOf(text) { var m = /^Pay:\s*(.+)$/m.exec(text || ''); var v = m ? m[1].trim() : ''; return v && v !== PAY_PH ? v : ''; }
  function versions(n, text, line) {
    var r = role(n), pay = payOf(text), payLine = pay ? 'Pay: ' + pay : 'Pay: ' + PAY_PH;
    var short = r.short + ' needed \u00b7 ' + n.borough + ' \u00b7 ' + sched(n) + ' \u00b7 start ' + fmtDate(n.start);
    var out = {};
    out.linkedin = text + '\n\n#ABA #autism #specialeducation #NYCjobs #' + n.borough.replace(/\s/g, '') + 'jobs';
    out.indeed = text;
    out.college = 'Students & new grads: ' + short + '.\n' + (n.role === 'Behavior tech' || n.role === 'RBT' || n.role === 'Para' ? 'Great fit for psychology, education and pre-health students. We support RBT training.\n' : '') + r.musts.map(function (x) { return '\u2022 ' + x; }).join('\n') + '\n' + payLine + '\n' + howApply(n, line);
    out.aba = r.title + ' \u2014 ' + n.borough + '\n' + sched(n) + ' \u00b7 start ' + fmtDate(n.start) + '\n\n' + r.musts.map(function (x) { return '\u2022 ' + x; }).join('\n') + '\n\n' + payLine + '\n\n' + howApply(n, line);
    out.community = '\ud83d\udccc ' + short + '\n' + payLine + '\nText ' + n.code + ' to ' + line + ' \u2014 5-minute call, any time.\nPlease share \ud83d\ude4f';
    return { text: out, pay: pay };
  }
  function referralAsk(n, line) {
    return 'Hi! We\u2019re looking for a ' + role(n).short + ' in ' + n.borough + ' (' + sched(n) + '). Know someone great? They can text ' + n.code + ' to ' + line + '. Thank you!';
  }
  function timesText(first, times, me) {
    return 'Hi ' + first + ', this is ' + (me ? me + ' from ' : 'the recruiting team at ') + ORG + '. Thanks for applying! Could you do a short interview call at one of these times?\n' + times.map(function (t, i) { return (i + 1) + ') ' + t; }).join('\n') + '\nJust reply with the number.';
  }
  var PACKET = {
    common: ['W-9 (blank IRS form)', 'Session Verification Log (new monthly timesheet)', 'Provider Billing Manual link'],
    contract: { 'RBT': 'ABA Contract', 'Behavior tech': 'ABA Contract', 'BCBA': 'ABA Contract', 'BCaBA': 'ABA Contract', 'Para': 'Consulting Agreement (Para)' },
    extra: { 'RBT': 'Introduction deck for new techs', 'Behavior tech': 'Introduction deck for new techs', 'BCBA': 'Intake packet (blank)', 'BCaBA': 'Intake packet (blank)' },
    askBack: function (roleName) { return ['Signed contract', 'W-9', (R[roleName] || R.RBT).cred + ' copy', 'Photo ID']; }
  };
  window.TTGR_TEXT = { R: R, CHANNELS: CHANNELS, VERIFY: VERIFY, jd: jd, versions: versions, payOf: payOf, referralAsk: referralAsk, timesText: timesText, sched: sched, fmtT: fmtT, fmtDate: fmtDate, PACKET: PACKET, PAY_PH: PAY_PH };
})();
