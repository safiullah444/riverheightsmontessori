/* River Heights Montessori: Book a Tour form logic. Rendered by dc-runtime.js into [data-mount]. */
window.__tfStart = Date.now();
class Component extends DCLogic {
async send(data) {
if (this.state.sending) return;
this.setState({ sending: true, sendErr: '' });
const hp = document.getElementById('tf-company');
try {
const res = await fetch('/api/tour-request', {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify({ ...data, company: hp ? hp.value : '', elapsed: Date.now() - (window.__tfStart || Date.now()) })
});
const out = await res.json().catch(() => ({}));
if (!res.ok || !out.ok) throw new Error(out.error || 'Something went wrong.');
this.setState({ sending: false, errs: {}, step: 5 });
const card = document.querySelector('.formcard');
if (card) card.scrollIntoView({ behavior: 'smooth', block: 'start' });
} catch (e) {
this.setState({ sending: false, sendErr: 'We could not send your request. Please try again, or call us at (204) 306-8778.' });
}
}
parseD(v) {
if (!v) return null;
const p = String(v).split('-');
if (p.length !== 3) return null;
const d = new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
return isNaN(d.getTime()) ? null : d;
}
monthsBetween(a, b) {
let m = (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());
if (b.getDate() < a.getDate()) m -= 1;
return m;
}
fmtLong(d) {
const M = ['January','February','March','April','May','June','July','August','September','October','November','December'];
return d ? M[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear() : '';
}
fmtShort(d) {
const M = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
return d ? M[d.getMonth()] + ' ' + d.getFullYear() : '';
}
renderVals() {
const s = this.state || {};
const g = (k, d) => (s[k] === undefined ? d : s[k]);
const step = g('step', 1);
const v = {
childName: g('childName', ''), dob: g('dob', ''), expecting: g('expecting', false), due: g('due', ''), current: g('current', ''),
start: g('start', ''), firm: g('firm', ''), schedule: g('schedule', ''),
parent: g('parent', ''), email: g('email', ''), phone: g('phone', ''), postal: g('postal', ''), sibling: g('sibling', ''), contact: g('contact', ''),
prevCentre: g('prevCentre', ''), leaveReason: g('leaveReason', ''), careOther: g('careOther', ''), progPick: g('progPick', ''),
p1Employer: g('p1Employer', ''), p1Job: g('p1Job', ''), p2On: g('p2On', false), p2Name: g('p2Name', ''), p2Employer: g('p2Employer', ''), p2Job: g('p2Job', ''), address: g('address', ''), siblingName: g('siblingName', ''),
pri: g('pri', []), tour: g('tour', ''), heard: g('heard', ''), notes: g('notes', ''), consent: g('consent', false), full: g('simFull', false)
};
const set = (k) => (ev) => this.setState({ [k]: ev.target.value });
const on = {
childName: set('childName'), dob: set('dob'), due: set('due'), current: set('current'), start: set('start'),
parent: set('parent'), email: set('email'), phone: set('phone'), postal: set('postal'), heard: set('heard'), notes: set('notes'),
prevCentre: set('prevCentre'), leaveReason: set('leaveReason'), careOther: set('careOther'), p1Employer: set('p1Employer'), p1Job: set('p1Job'),
p2Name: set('p2Name'), p2Employer: set('p2Employer'), p2Job: set('p2Job'), address: set('address'), siblingName: set('siblingName'),
addP2: () => this.setState({ p2On: true }), removeP2: () => this.setState({ p2On: false, p2Name: '', p2Employer: '', p2Job: '' }),
expecting: () => this.setState({ expecting: !v.expecting }),
consent: () => this.setState({ consent: !v.consent }),
simFull: () => this.setState({ simFull: !v.full })
};

const birth = this.parseD(v.expecting ? v.due : v.dob);
const startD = this.parseD(v.start);
let program = '';
let progNote = '';
let ageM = null;
if (birth && startD) {
ageM = this.monthsBetween(birth, startD);
if (ageM < 0) progNote = 'Your start date is before your due date.';
else if (ageM < 3) progNote = 'Nido welcomes babies from 3 months of age.';
else if (ageM < 24) program = 'nido';
else if (ageM < 72) program = 'pre';
else progNote = 'Our programs are for children up to age 6.';
}
const ageProgram = program;
if (v.progPick === 'nido' || v.progPick === 'pre') program = v.progPick;
const progOpts = [{ id: 'nido', label: 'Nido', sub: '3 months to 2 years' }, { id: 'pre', label: 'Preschool', sub: 'Ages 2 to 6' }, { id: 'unsure', label: 'Not sure yet', sub: 'We will help you choose' }].map((o) => {
const chk = v.progPick ? v.progPick === o.id : ageProgram === o.id;
return { ...o, sub: (!v.progPick && ageProgram === o.id) ? 'Recommended for ' + (v.childName.trim() || 'your child') : o.sub, checked: chk, cls: 'optcard' + (chk ? ' on' : ''), pick: () => this.setState({ progPick: o.id }) };
});
const progName = program === 'nido' ? 'Nido · Infants and toddlers' : program === 'pre' ? 'Preschool · Ages 2 to 6' : '';
const progShort = program === 'nido' ? 'Nido' : program === 'pre' ? 'Preschool' : '';
let ageText = '';
if (ageM !== null && ageM >= 0) {
if (ageM < 24) ageText = ageM + (ageM === 1 ? ' month' : ' months') + ' old';
else { const y = Math.floor(ageM / 12); const mo = ageM % 12; ageText = y + ' years' + (mo ? ', ' + mo + (mo === 1 ? ' month' : ' months') : '') + ' old'; }
}

const schedDefs = [
{ id: 'full', label: 'Full time', sub: 'Monday to Friday', short: 'Full time' },
{ id: 'mwf', label: 'Three days', sub: 'Mon, Wed, Fri · ages 2 to 5', short: 'Mon/Wed/Fri' },
{ id: 'tt', label: 'Two days', sub: 'Tue, Thu · ages 2 to 5', short: 'Tue/Thu' }
];
const schedules = schedDefs.map((o) => {
const off = (ageProgram === 'nido' || program === 'nido') && o.id !== 'full';
const chk = v.schedule === o.id && !off;
return { ...o, off, checked: chk, cls: 'optcard' + (chk ? ' on' : '') + (off ? ' off' : ''), sub2: off ? 'Part time starts at age 2' : o.sub, pick: () => { if (!off) this.setState({ schedule: o.id }); } };
});
const schedObj = schedDefs.find((o) => o.id === v.schedule);
const schedLabel = schedObj ? schedObj.short : 'Not chosen';

const pills = (key, opts) => opts.map((o) => ({ label: o, checked: v[key] === o, cls: 'opt' + (v[key] === o ? ' on' : ''), pick: () => this.setState({ [key]: o }) }));
const firmOpts = pills('firm', ['Fixed', 'Within a month', 'Flexible']);
const sibOpts = pills('sibling', ['Yes', 'No']);
const contactOpts = pills('contact', ['Phone', 'Email', 'Both']);
const tourOpts = pills('tour', ['Weekday morning', 'Weekday afternoon', 'Either works']);
const priList = ['Montessori approach', 'Reggio and creativity', 'Open 12 months', 'Intro French', 'Location', 'Hours'];
const priOpts = priList.map((o) => {
const has = v.pri.indexOf(o) > -1;
return { label: o, checked: has, cls: 'opt' + (has ? ' on' : ''), pick: () => this.setState({ pri: has ? v.pri.filter((x) => x !== o) : v.pri.concat([o]) }) };
});

const validate = (n) => {
const er = {};
if (n === 1) {
if (!v.childName.trim()) er.childName = 'Please enter your child’s first name.';
if (!v.expecting && !this.parseD(v.dob)) er.dob = 'Please enter a date of birth.';
if (v.expecting && !this.parseD(v.due)) er.due = 'Please enter a due date.';
}
if (n === 2) {
if (!startD) er.start = 'Please choose an ideal start date.';
if (!v.schedule || ((ageProgram === 'nido' || program === 'nido') && v.schedule !== 'full')) er.schedule = 'Please choose a schedule.';
}
if (n === 3) {
if (!v.parent.trim()) er.parent = 'Please enter your name.';
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email.trim())) er.email = 'Please enter a valid email.';
if (v.phone.replace(/\D/g, '').length < 10) er.phone = 'Please enter a 10-digit phone number.';
if (!/^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/.test(v.postal.trim())) er.postal = 'Please enter a postal code, like R3M 3B7.';
}
if (n === 4) {
if (!v.consent) er.consent = 'Please agree so we can contact you.';
}
return er;
};
const errs = g('errs', {});
const keys = ['childName', 'dob', 'due', 'start', 'schedule', 'parent', 'email', 'phone', 'postal', 'consent'];
const e = {};
const c = {};
keys.forEach((k) => { e[k] = errs[k] || ''; c[k] = errs[k] ? 'inp bad' : 'inp'; });
const go = (n) => {
const er = validate(step);
if (Object.keys(er).length) { this.setState({ errs: er }); return; }
this.setState({ errs: {}, step: n });
};

const today = new Date();
today.setHours(0, 0, 0, 0);
const reasons = [];
let score = 0;
if (startD) {
const mAway = this.monthsBetween(today, startD);
if (mAway <= 3) { score += 2; reasons.push({ pts: '+2', text: 'Starts within 3 months' }); }
else if (mAway <= 9) { score += 1; reasons.push({ pts: '+1', text: 'Starts in 3 to 9 months' }); }
}
if (v.tour && v.tour !== 'Not yet') { score += 2; reasons.push({ pts: '+2', text: 'Asked for a tour' }); }
if (v.firm === 'Fixed') { score += 1; reasons.push({ pts: '+1', text: 'Firm start date' }); }
if (v.schedule === 'full') { score += 1; reasons.push({ pts: '+1', text: 'Full-time space' }); }
const fsa = v.postal.trim().toUpperCase().slice(0, 3);
if (['R3M', 'R3N', 'R3L', 'R3P', 'R3T'].indexOf(fsa) > -1) { score += 1; reasons.push({ pts: '+1', text: 'Lives nearby (' + fsa + ')' }); }
if (v.sibling === 'Yes') { score += 1; reasons.push({ pts: '+1', text: 'Sibling already enrolled' }); }
if (!reasons.length) reasons.push({ pts: '0', text: 'Fill in the form to see the score build' });
const tagLabel = score >= 5 ? 'HOT' : score >= 3 ? 'WARM' : 'NURTURE';
const tagCls = 'tag ' + (score >= 5 ? 'hot' : score >= 3 ? 'warm' : 'nurt');
const subject = (v.full ? '[WAITLIST] ' : '') + '[' + tagLabel + '] ' + (progShort || 'Program TBD') + ' · ' + (schedObj ? schedObj.short : 'Schedule TBD') + ' · ' + (startD ? this.fmtShort(startD) : 'Start TBD') + (fsa.length === 3 ? ' · ' + fsa : '');

const childFirst = v.childName.trim() || 'Your child';
const parentFirst = (v.parent.trim().split(' ')[0]) || 'for reaching out';
const doneMsg = v.full
? 'Our ' + (progShort || 'program') + ' spaces are full for your start date, so ' + childFirst + ' is now on our wait list. We will be in touch as soon as a space opens.'
: 'We have received your tour request for ' + childFirst + ' and will get back to you within one business day to book your tour.';

const titles = ['Your child', 'Care you need', 'Your family', 'Book your tour'];
const stepItems = titles.map((t, i) => ({ label: t, cls: 'stp' + (i + 1 < step ? ' done' : i + 1 === step ? ' cur' : '') }));


return {
v, on, e, c, step,
is1: step === 1, is2: step === 2, is3: step === 3, is4: step === 4,
notDone: step < 5, isDone: step === 5, canBack: step > 1 && step < 5, notLast: step < 4,
hasErr: Object.keys(errs).length > 0,
notExpecting: !v.expecting,
isCentre: v.current === 'Another centre', isOtherCare: v.current === 'Other', noP2: !v.p2On, hasSib: v.sibling === 'Yes', progOpts,
stepTitle: titles[Math.min(step, 4) - 1],
stepItems,
next: () => go(step + 1),
back: () => this.setState({ errs: {}, step: step - 1 }),
submit: () => { const er = validate(4); if (Object.keys(er).length) { this.setState({ errs: er }); return; } this.send({ v, progShort, progName, schedLabel, startLong: startD ? this.fmtLong(startD) : '', ageText, score, tagLabel, reasons: reasons.map((r) => r.text), subject }); },
reset: () => this.setState({ step: 1, errs: {}, prevCentre: '', leaveReason: '', careOther: '', progPick: '', p1Employer: '', p1Job: '', p2On: false, p2Name: '', p2Employer: '', p2Job: '', address: '', siblingName: '', childName: '', dob: '', expecting: false, due: '', current: '', start: '', firm: '', schedule: '', parent: '', email: '', phone: '', postal: '', sibling: '', contact: '', pri: [], tour: '', heard: '', notes: '', consent: false }),
hasMatch: !!ageProgram, recName: ageProgram === 'nido' ? 'Nido · Infants and toddlers' : ageProgram === 'pre' ? 'Preschool · Ages 2 to 6' : '', hasNote: !!progNote, progName, progNote, ageText, childFirst, parentFirst,
startLong: startD ? this.fmtLong(startD) : 'your start date',
progShortOr: progShort || 'To discuss',
schedules, schedLabel, firmOpts, sibOpts, contactOpts, tourOpts, priOpts,
reasons, score, tagLabel, tagCls, subject, doneMsg,
sending: !!g('sending', false), sendErr: g('sendErr', ''), submitLabel: g('sending', false) ? 'Sending…' : 'Request my tour'
};
}
}

dcMount(document.getElementById("inquiry"), Component);
document.querySelectorAll("#inquiry [data-mount]").forEach(function (el) { el.setAttribute("data-ready", ""); });
