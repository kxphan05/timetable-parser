"use strict";

import { formatDate, formatTime } from './dateTime.js';

function csvEscape(field) {
  field = String(field);
  if (/[",\r\n]/.test(field)) field = '"' + field.replace(/"/g, '""') + '"';
  return field;
}

export function toCSV(events) {
  const out = [['Subject', 'Start Date', 'Start Time', 'End Date', 'End Time', 'All Day Event', 'Description', 'Location', 'Private']];
  for (const e of events) {
    const ds = formatDate(e.date);
    out.push([
      e.subject, ds, formatTime(e.startHHMM), ds, formatTime(e.endHHMM),
      'False', `Week ${e.week}`, e.venue, 'False'
    ]);
  }
  return out.map(r => r.map(csvEscape).join(',')).join('\r\n');
}
