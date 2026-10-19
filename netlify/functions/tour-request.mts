/**
 * Book a Tour form handler.
 *
 * Receives the form submission from /admissions/, validates it, and sends two emails via Resend:
 *   1. A lead email to the centre (reply-to = the parent), tagged HOT / WARM / NURTURE.
 *   2. A confirmation email to the parent.
 *
 * Required environment variables (Netlify UI > Site configuration > Environment variables, scope: Functions):
 *   RESEND_API_KEY   Resend API key
 *   TOUR_TO_EMAIL    Where leads go. Comma-separate for several, e.g. "safi@example.com,info@example.com"
 *   TOUR_FROM_EMAIL  Verified sender, e.g. "River Heights Montessori <hello@riverheightsmontessori.ca>"
 * Optional:
 *   TOUR_REPLY_TO    Reply-to address on the parent's confirmation (defaults to the first TOUR_TO_EMAIL)
 */
import type { Config } from '@netlify/functions';

type Dict = Record<string, unknown>;

const CENTRE = {
  name: 'River Heights Montessori',
  phone: '(204) 306-8778',
  address: '333 Wilton Street, Winnipeg, MB R3M 3B7',
};

const str = (v: unknown, max = 500) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const bool = (v: unknown) => v === true;
const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
const json = (body: Dict, status = 200) => Response.json(body, { status });

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const POSTAL_RE = /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/;

export default async (req: Request) => {
  if (req.method !== 'POST') return json({ ok: false, error: 'Method not allowed' }, 405);

  let body: Dict;
  try {
    body = (await req.json()) as Dict;
  } catch {
    return json({ ok: false, error: 'Invalid request' }, 400);
  }

  // Spam checks: hidden honeypot field filled in, or submitted impossibly fast. Pretend success.
  if (str(body.company) || Number(body.elapsed) < 4000) return json({ ok: true });

  const v = (body.v ?? {}) as Dict;
  const f = {
    childName: str(v.childName, 80),
    dob: str(v.dob, 10),
    expecting: bool(v.expecting),
    due: str(v.due, 10),
    current: str(v.current, 40),
    prevCentre: str(v.prevCentre, 120),
    leaveReason: str(v.leaveReason, 400),
    careOther: str(v.careOther, 400),
    start: str(v.start, 10),
    firm: str(v.firm, 30),
    parent: str(v.parent, 120),
    p1Employer: str(v.p1Employer, 120),
    p1Job: str(v.p1Job, 120),
    email: str(v.email, 160),
    phone: str(v.phone, 30),
    address: str(v.address, 200),
    postal: str(v.postal, 10).toUpperCase(),
    contact: str(v.contact, 20),
    p2On: bool(v.p2On),
    p2Name: str(v.p2Name, 120),
    p2Employer: str(v.p2Employer, 120),
    p2Job: str(v.p2Job, 120),
    sibling: str(v.sibling, 5),
    siblingName: str(v.siblingName, 120),
    tour: str(v.tour, 40),
    heard: str(v.heard, 40),
    notes: str(v.notes, 500),
    consent: bool(v.consent),
  };
  const meta = {
    program: str(body.progShort, 30) || 'To discuss',
    schedule: str(body.schedLabel, 40),
    startLong: str(body.startLong, 40),
    ageText: str(body.ageText, 40),
    tag: ['HOT', 'WARM', 'NURTURE'].includes(str(body.tagLabel)) ? str(body.tagLabel) : 'NURTURE',
    score: Math.max(0, Math.min(20, Number(body.score) || 0)),
    reasons: Array.isArray(body.reasons) ? (body.reasons as unknown[]).map((r) => str(r, 80)).filter(Boolean).slice(0, 8) : [],
  };

  // Server-side validation mirrors the form's required fields.
  const missing: string[] = [];
  if (!f.childName) missing.push('child name');
  if (!f.expecting && !f.dob) missing.push('date of birth');
  if (f.expecting && !f.due) missing.push('due date');
  if (!f.start) missing.push('start date');
  if (!f.parent) missing.push('parent name');
  if (!EMAIL_RE.test(f.email)) missing.push('email');
  if (f.phone.replace(/\D/g, '').length < 10) missing.push('phone');
  if (!POSTAL_RE.test(f.postal)) missing.push('postal code');
  if (!f.consent) missing.push('consent');
  if (missing.length) return json({ ok: false, error: `Missing or invalid: ${missing.join(', ')}` }, 422);

  const apiKey = Netlify.env.get('RESEND_API_KEY');
  const to = (Netlify.env.get('TOUR_TO_EMAIL') || '').split(',').map((s) => s.trim()).filter(Boolean);
  const from = Netlify.env.get('TOUR_FROM_EMAIL');
  if (!apiKey || !to.length || !from) {
    console.error('tour-request: missing RESEND_API_KEY, TOUR_TO_EMAIL or TOUR_FROM_EMAIL');
    return json({ ok: false, error: 'Email is not configured' }, 500);
  }
  const replyTo = Netlify.env.get('TOUR_REPLY_TO') || to[0];

  const fsa = f.postal.slice(0, 3);
  const childFirst = f.childName.split(' ')[0];
  const parentFirst = f.parent.split(' ')[0];
  const ownerSubject = `[${meta.tag}] ${meta.program} · ${meta.schedule || 'Schedule TBD'} · ${f.start || 'Start TBD'} · ${fsa}`;

  // ---------- Owner lead email ----------
  const rows: [string, string][] = [
    ['Child', `${f.childName}${meta.ageText ? ` · ${meta.ageText} at start` : ''}`],
    [f.expecting ? 'Due date' : 'Date of birth', f.expecting ? f.due : f.dob],
    ['Program', `${meta.program}${meta.schedule ? ` · ${meta.schedule}` : ''}`],
    ['Start date', `${meta.startLong || f.start}${f.firm ? ` · ${f.firm}` : ''}`],
    ['Current care', f.current === 'Another centre' && f.prevCentre ? `Another centre: ${f.prevCentre}` : f.current],
    ['Reason for leaving', f.leaveReason],
    ['About current care', f.careOther],
    ['Parent', [f.parent, [f.p1Job, f.p1Employer].filter(Boolean).join(', ')].filter(Boolean).join(' · ')],
    ['Second parent', f.p2On ? [f.p2Name, [f.p2Job, f.p2Employer].filter(Boolean).join(', ')].filter(Boolean).join(' · ') : ''],
    ['Email', f.email],
    ['Phone', f.phone],
    ['Prefers', f.contact],
    ['Address', [f.address, f.postal].filter(Boolean).join(', ')],
    ['Sibling enrolled', f.sibling === 'Yes' ? `Yes${f.siblingName ? ` · ${f.siblingName}` : ''}` : f.sibling],
    ['Tour time', f.tour],
    ['Heard via', f.heard],
    ['Notes', f.notes],
  ];
  const filled = rows.filter(([, val]) => val);
  const tagColor = meta.tag === 'HOT' ? '#B4442C' : meta.tag === 'WARM' ? '#8A6A1F' : '#2F4A3A';
  const ownerHtml = `<!doctype html><html><body style="margin:0;background:#F4EEE1;font-family:Arial,Helvetica,sans-serif;color:#2A2622">
<div style="max-width:600px;margin:0 auto;padding:24px">
<div style="background:#ffffff;border:1px solid #E8DFCB;border-radius:16px;padding:28px">
<p style="margin:0 0 12px"><span style="display:inline-block;background:${tagColor};color:#fff;font-size:12px;font-weight:bold;letter-spacing:.08em;padding:5px 10px;border-radius:999px">${esc(meta.tag)} · SCORE ${meta.score}</span></p>
${meta.reasons.length ? `<p style="margin:0 0 16px;font-size:13px;color:#5A534A">${esc(meta.reasons.join(' · '))}</p>` : ''}
<h1 style="margin:0 0 18px;font-family:Georgia,serif;font-size:26px;font-weight:normal">New tour request: ${esc(childFirst)}, ${esc(meta.program)}</h1>
<p style="margin:0 0 20px"><a href="mailto:${esc(f.email)}" style="display:inline-block;background:#2F4A3A;color:#fff;text-decoration:none;padding:10px 18px;border-radius:999px;font-size:14px;margin-right:6px">Reply to ${esc(parentFirst)}</a><a href="tel:${esc(f.phone.replace(/[^\d+]/g, ''))}" style="display:inline-block;border:1px solid #2F4A3A;color:#2F4A3A;text-decoration:none;padding:9px 18px;border-radius:999px;font-size:14px">Call ${esc(f.phone)}</a></p>
<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;font-size:14px">
${filled.map(([k, val]) => `<tr><td style="padding:9px 12px 9px 0;border-top:1px solid #F0E9DA;color:#8C847A;width:150px;vertical-align:top">${esc(k)}</td><td style="padding:9px 0;border-top:1px solid #F0E9DA;vertical-align:top">${esc(val)}</td></tr>`).join('\n')}
</table>
<p style="margin:20px 0 0;font-size:12px;color:#8C847A">Sent from the Book a Tour form on the website. Reply to this email to reach ${esc(parentFirst)} directly.</p>
</div></div></body></html>`;
  const ownerText = [`${meta.tag} · score ${meta.score}`, ...filled.map(([k, val]) => `${k}: ${val}`)].join('\n');

  // ---------- Parent confirmation ----------
  const parentHtml = `<!doctype html><html><body style="margin:0;background:#FBF8F1;font-family:Arial,Helvetica,sans-serif;color:#2A2622">
<div style="max-width:560px;margin:0 auto;padding:24px">
<div style="background:#ffffff;border:1px solid #E8DFCB;border-radius:16px;padding:32px;text-align:center">
<h1 style="margin:0 0 14px;font-family:Georgia,serif;font-size:30px;font-weight:normal">Thank you, ${esc(parentFirst)}.</h1>
<p style="margin:0 0 22px;font-size:16px;line-height:1.6;color:#4A443D">We have received your tour request for ${esc(childFirst)} and will get back to you within one business day to book your tour.</p>
<div style="text-align:left;background:#FBF8F1;border-radius:12px;padding:18px 20px;font-size:15px;line-height:1.6;color:#4A443D">
<p style="margin:0 0 8px;font-size:12px;font-weight:bold;letter-spacing:.14em;color:#8A6A1F">WHAT HAPPENS NEXT</p>
<p style="margin:0 0 6px"><b>1.</b> We review your request and check availability for ${esc(meta.startLong || 'your start date')}.</p>
<p style="margin:0 0 6px"><b>2.</b> We call or email to book your tour at a time that suits you.</p>
<p style="margin:0"><b>3.</b> At your tour, you receive this year's registration and fee information.</p>
</div>
<p style="margin:22px 0 0;font-size:14px;color:#5A534A">Questions? Call ${CENTRE.phone}, weekdays 7:30 am to 5:30 pm.</p>
<p style="margin:18px 0 0;padding-top:16px;border-top:1px solid #EFE7D6;font-size:12px;color:#8C847A">${CENTRE.name} · ${CENTRE.address}<br>You are receiving this because you submitted a tour request on our website.</p>
</div></div></body></html>`;
  const parentText = `Thank you, ${parentFirst}.\n\nWe have received your tour request for ${childFirst} and will get back to you within one business day to book your tour.\n\nQuestions? Call ${CENTRE.phone}, weekdays 7:30 am to 5:30 pm.\n\n${CENTRE.name}, ${CENTRE.address}`;

  const send = (payload: Dict) =>
    fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

  // The lead email is the one that matters; if it fails, tell the parent so they can call instead.
  const owner = await send({ from, to, reply_to: f.email, subject: ownerSubject, html: ownerHtml, text: ownerText });
  if (!owner.ok) {
    console.error('tour-request: owner email failed', owner.status, await owner.text().catch(() => ''));
    return json({ ok: false, error: 'Could not send' }, 502);
  }
  const parent = await send({
    from,
    to: [f.email],
    reply_to: replyTo,
    subject: `We received your tour request for ${childFirst}`,
    html: parentHtml,
    text: parentText,
  });
  if (!parent.ok) console.error('tour-request: parent confirmation failed', parent.status, await parent.text().catch(() => ''));

  return json({ ok: true });
};

export const config: Config = {
  path: '/api/tour-request',
  method: 'POST',
  rateLimit: { windowLimit: 5, windowSize: 60, aggregateBy: ['ip', 'domain'] },
};
