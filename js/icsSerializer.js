"use strict";

// Singapore has never observed DST since 1935 and sits at a flat +08, so the
// VTIMEZONE is a single STANDARD component with no transition rules.
const ICS_TZID = 'Asia/Singapore';
const ICS_VTIMEZONE = [
  'BEGIN:VTIMEZONE',
  `TZID:${ICS_TZID}`,
  'X-LIC-LOCATION:Asia/Singapore',
  'BEGIN:STANDARD',
  'DTSTART:19700101T000000',
  'TZOFFSETFROM:+0800',
  'TZOFFSETTO:+0800',
  'TZNAME:+08',
  'END:STANDARD',
  'END:VTIMEZONE'
];

// RFC 5545 §3.3.11: escape backslash first, then the delimiters.
function icsEscape(text) {
  return String(text)
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

// RFC 5545 §3.1: lines are limited to 75 *octets*, continued with CRLF + space.
// Fold by code point so a multi-byte character is never split across the break.
function icsFold(line) {
  const enc = new TextEncoder();
  if (enc.encode(line).length <= 75) return line;
  const parts = [];
  let cur = '', bytes = 0;
  for (const ch of line) {
    const n = enc.encode(ch).length;
    if (bytes + n > 75) {
      parts.push(cur);
      cur = ' ' + ch;
      bytes = 1 + n;
    } else {
      cur += ch;
      bytes += n;
    }
  }
  parts.push(cur);
  return parts.join('\r\n');
}

function icsLocalStamp(date, hhmm) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}${m}${d}T${hhmm}00`;
}

function icsUtcStamp(date) {
  const p = n => String(n).padStart(2, '0');
  return `${date.getUTCFullYear()}${p(date.getUTCMonth() + 1)}${p(date.getUTCDate())}`
       + `T${p(date.getUTCHours())}${p(date.getUTCMinutes())}${p(date.getUTCSeconds())}Z`;
}

// Deterministic UID: re-importing an updated file replaces the old events
// instead of duplicating them.
function icsUid(e) {
  const day = icsLocalStamp(e.date, e.startHHMM).slice(0, 8);
  const slug = `${e.course}-${e.classType}-${day}-${e.startHHMM}`.replace(/[^A-Za-z0-9-]/g, '');
  return `${slug}@ntu-timetable`;
}

export function toICS(events) {
  const stamp = icsUtcStamp(new Date());
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//NTU Timetable to CSV//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:NTU Timetable',
    `X-WR-TIMEZONE:${ICS_TZID}`,
    ...ICS_VTIMEZONE
  ];

  for (const e of events) {
    lines.push(
      'BEGIN:VEVENT',
      `UID:${icsUid(e)}`,
      `DTSTAMP:${stamp}`,
      `DTSTART;TZID=${ICS_TZID}:${icsLocalStamp(e.date, e.startHHMM)}`,
      `DTEND;TZID=${ICS_TZID}:${icsLocalStamp(e.date, e.endHHMM)}`,
      `SUMMARY:${icsEscape(e.subject)}`,
      `DESCRIPTION:${icsEscape(`Week ${e.week}${e.group ? ' · Group ' + e.group : ''}`)}`,
      `LOCATION:${icsEscape(e.venue)}`,
      'TRANSP:OPAQUE',
      'END:VEVENT'
    );
  }

  lines.push('END:VCALENDAR');
  return lines.map(icsFold).join('\r\n') + '\r\n';
}
