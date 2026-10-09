/* SYNTHETIC DEMO DATA (?demo=1). Every person, student, number and date here is made up.
   555-01xx numbers are reserved for fiction. Nothing in demo mode talks to any server. */
window.TTGR_DEMO = function () {
  function d(off, hm) { var x = new Date(); x.setDate(x.getDate() + off); var s = x.getFullYear() + '-' + ('0' + (x.getMonth() + 1)).slice(-2) + '-' + ('0' + x.getDate()).slice(-2); return hm ? s + 'T' + hm : s; }
  var musts = function (o) { return JSON.stringify(o); };
  return {
    line: '(555) 010-0199',
    needs: [
      { id: 'n1', code: 'Q12', role: 'RBT', student: 'Milo', borough: 'Queens', days: 'Mon\u2013Thu', from: '15:00', to: '19:00', start: d(10), hrs_week: 16, notes: '', status: 'posted', jd: '', posted: JSON.stringify({ indeed: d(-6, '10:00'), community: d(-5, '09:00') }), created: d(-19, '09:00') },
      { id: 'n2', code: 'K41', role: 'SETSS', student: 'Ava', borough: 'Brooklyn', days: 'Tue, Thu', from: '16:00', to: '18:00', start: d(14), hrs_week: 4, notes: 'SWD 1\u20136', status: 'open', jd: '', posted: '{}', created: d(-2, '09:00') },
      { id: 'n3', code: 'M27', role: 'BCBA', student: 'Leah', borough: 'Manhattan', days: 'Tue\u2013Thu', from: '14:00', to: '18:00', start: d(21), hrs_week: 4, notes: 'supervision', status: 'posted', jd: '', posted: JSON.stringify({ aba: d(-8, '10:00'), linkedin: d(-8, '10:05') }), created: d(-9, '09:00') },
      { id: 'n4', code: 'S18', role: 'OT', student: 'Eli', borough: 'Staten Island', days: 'Fri', from: '13:00', to: '15:00', start: d(7), hrs_week: 2, notes: '', status: 'posted', jd: '', posted: JSON.stringify({ indeed: d(-7, '10:00') }), created: d(-31, '09:00') }
    ],
    people: [
      { id: 'p1', name: 'Jordan Avery', phone: '(555) 010-0141', email: 'jordan@example.com', role: 'RBT', boroughs: 'Queens, Brooklyn', availability: 'Mon\u2013Thu 2\u20138pm', credential: 'RBT', cred_status: 'verified', cred_link: '', resume_url: 'https://example.com/resume-jordan.pdf', source: 'Phone screen \u00b7 flyer Q12', need_code: 'Q12', fit_summary: '3 yrs 1:1 ABA. Cut elopement from daily to weekly with a first/then board. Can start in 10 days.', musts: musts({ hours: true }), stage: 'applicant', created: d(-1, '20:42') },
      { id: 'p2', name: 'Priya Nandakumar', phone: '(555) 010-0152', email: 'priya@example.com', role: 'RBT', boroughs: 'Queens', availability: 'Mon\u2013Fri 3\u20137pm', credential: 'RBT', cred_status: 'verified', resume_url: 'https://example.com/resume-priya.pdf', source: 'Indeed', need_code: 'Q12', fit_summary: '2 yrs DTT/NET with preschoolers. Taught AAC break requests. Available all 4 days.', musts: musts({ hours: true }), stage: 'interview', created: d(-2, '21:15') },
      { id: 'p3', name: 'Marcus Lee', phone: '(555) 010-0163', email: 'marcus@example.com', role: 'Behavior tech', boroughs: 'Queens, Manhattan', availability: 'Mon\u2013Thu 4\u20138pm', credential: 'RBT in progress', cred_status: 'not_found', resume_url: '', source: 'Past applicant', need_code: 'Q12', fit_summary: '1:1 aide for a 7th grader. 40-hour training done, competency not yet.', musts: musts({ hours: false }), stage: 'applicant', created: d(-3, '18:00') },
      { id: 'p4', name: 'Dana Whitfield', phone: '(555) 010-0174', email: 'dana@example.com', role: 'BCBA', boroughs: 'Manhattan, Bronx', availability: 'Tue\u2013Thu 1\u20136pm', credential: 'BCBA + LBA', cred_status: 'unchecked', resume_url: 'https://example.com/resume-dana.pdf', source: 'ABA job board', need_code: 'M27', fit_summary: '6 yrs, school consults, supervises 4 RBTs. Says NY LBA active; not yet checked.', musts: musts({ hours: true }), stage: 'applicant', created: d(-1, '13:10') },
      { id: 'p5', name: 'Sofia Ramirez', phone: '(555) 010-0185', email: 'sofia@example.com', role: 'RBT', boroughs: 'Queens', availability: 'Mon\u2013Thu 3\u20137pm', credential: 'RBT', cred_status: 'verified', resume_url: 'https://example.com/resume-sofia.pdf', source: 'Referral', need_code: 'Q12', fit_summary: 'Bilingual (Spanish). 4 yrs home ABA. Strong data habits.', musts: musts({ hours: true }), stage: 'interview', created: d(-5, '10:00') },
      { id: 'p6', name: 'Sam Ortiz', phone: '(555) 010-0196', email: 'sam@example.com', role: 'OT', boroughs: 'Staten Island, Brooklyn', availability: 'Fri 12\u20135pm', credential: 'NYS OT license', cred_status: 'verified', resume_url: 'https://example.com/resume-sam.pdf', source: 'Indeed', need_code: 'S18', fit_summary: 'Pediatric OT, 5 yrs. Sensory integration certificate.', musts: musts({ hours: true }), stage: 'hired', created: d(-6, '10:00') },
      { id: 'p7', name: 'Kim Osei', phone: '(555) 010-0117', email: 'kim@example.com', role: 'RBT', boroughs: 'Bronx', availability: 'Weekends', credential: 'RBT', cred_status: 'verified', resume_url: '', source: 'Indeed', need_code: 'Q12', fit_summary: 'Bronx only, weekends only.', musts: musts({ hours: false }), stage: 'applicant', created: d(-4, '10:00') }
    ],
    interviews: [
      { id: 'i1', person_id: 'p2', need_code: 'Q12', when: '', status: 'to_schedule', consent: '', summary: '' },
      { id: 'i2', person_id: 'p5', need_code: 'Q12', when: d(0, '16:30'), status: 'done', consent: 'yes',
        summary: JSON.stringify({ summary: 'Warm, specific answers. Clear on data collection and on calling the BCBA when a plan isn\u2019t working.', credentials: 'RBT active (checked on BACB).', experience: '4 yrs home ABA, ages 4\u201312; manding, toileting, transitions.', availability: 'Mon\u2013Thu 3\u20137pm confirmed; can start in 10 days.', strengths: 'Bilingual; strong with families; tidy notes.', concerns: 'Has not worked in a school building yet.', follow_ups: 'Wants to meet the BCBA before starting.', recording: 'saved in Bland' }) }
    ],
    queue: [],
    freeTimes: [
      { start: d(3, '10:00'), end: d(3, '10:30'), label: '' },
      { start: d(4, '16:30'), end: d(4, '17:00'), label: '' },
      { start: d(5, '12:00'), end: d(5, '12:30'), label: '' }
    ],
    dismissed: []
  };
};
