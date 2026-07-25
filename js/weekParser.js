"use strict";

import { WEEK_LIST_RE, WEEK_LOOSE_RE } from './constants.js';
import { diag } from './diagnostics.js';
import { rowLabel } from './textUtils.js';

export function parseWeeks(row) {
  const remark = row.remark || '';
  if (!remark) return [];

  // Anchor on "Teaching Wk" so a venue name containing "Wk" can't match.
  let m = remark.match(WEEK_LIST_RE);
  if (!m) {
    m = remark.match(WEEK_LOOSE_RE);
    if (m) {
      diag('warn', `${rowLabel(row)}: week list "${remark}" is not prefixed with "Teaching" — reading it anyway, confirm it isn't part of a venue name.`, row.lineNo);
    }
  }
  if (!m) return [];

  const weeks = new Set();
  for (const rawPart of m[1].split(',')) {
    const part = rawPart.trim();
    if (!part) continue;
    if (part.includes('-')) {
      const bits = part.split('-').map(s => s.trim());
      if (bits.length !== 2 || bits.some(b => !/^\d+$/.test(b))) {
        diag('warn', `${rowLabel(row)}: could not read week range "${part}" — skipped.`, row.lineNo);
        continue;
      }
      const a = Number(bits[0]), b = Number(bits[1]);
      if (b < a) {
        diag('warn', `${rowLabel(row)}: week range "${part}" runs backwards — skipped.`, row.lineNo);
        continue;
      }
      for (let w = a; w <= b; w++) weeks.add(w);
    } else if (/^\d+$/.test(part)) {
      weeks.add(Number(part));
    } else {
      diag('warn', `${rowLabel(row)}: "${part}" is not a week number — skipped.`, row.lineNo);
    }
  }
  return Array.from(weeks).sort((a, b) => a - b);
}
