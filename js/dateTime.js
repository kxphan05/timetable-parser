"use strict";

import { diag } from './diagnostics.js';
import { rowLabel } from './textUtils.js';

// Build at noon so a DST transition at midnight can't shift the calendar day.
export function weekMonday(weekNum, week1Monday, lastWeekBeforeRecess, recessWeeks) {
  let weekOffset = weekNum - 1;
  if (weekNum > lastWeekBeforeRecess) weekOffset += recessWeeks;
  return new Date(
    week1Monday.getFullYear(),
    week1Monday.getMonth(),
    week1Monday.getDate() + weekOffset * 7,
    12, 0, 0, 0
  );
}

export function formatDate(d) {
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${mm}/${dd}/${d.getFullYear()}`;
}

export function parseHHMM(hhmm) {
  const h = Number(hhmm.slice(0, 2));
  const m = Number(hhmm.slice(2, 4));
  if (!Number.isInteger(h) || !Number.isInteger(m) || h > 23 || m > 59) return null;
  return h * 60 + m;
}

export function formatTime(hhmm) {
  let h = Number(hhmm.slice(0, 2));
  const m = hhmm.slice(2, 4);
  const ampm = h >= 12 ? 'PM' : 'AM';
  let h12 = h % 12;
  if (h12 === 0) h12 = 12;
  return `${h12}:${m} ${ampm}`;
}

// Excel and Sheets treat a leading = + - @ (or tab/CR) as the start of a formula.
// Google Calendar does not, so the value is left intact and reported instead.
const FORMULA_LEAD_RE = /^[=+\-@\t\r]/;

export function checkFormulaInjection(row, subject) {
  for (const [label, value] of [['subject', subject], ['venue', row.venue]]) {
    if (value && FORMULA_LEAD_RE.test(value)) {
      diag('warn', `${rowLabel(row)}: the ${label} "${value}" starts with a character that Excel and Google Sheets read as a formula. Calendar import is unaffected, but do not open this CSV in a spreadsheet without checking it.`, row.lineNo);
    }
  }
}
