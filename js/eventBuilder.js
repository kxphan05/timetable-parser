"use strict";

import { ABSURD_WEEK, CLASS_TYPE_LABELS, DAY_JS, DAY_OFFSETS, MAX_TEACHING_WEEK } from './constants.js';
import { diag } from './diagnostics.js';
import { parseWeeks } from './weekParser.js';
import { checkFormulaInjection, formatDate, parseHHMM, weekMonday } from './dateTime.js';
import { rowLabel, toTitleCase } from './textUtils.js';

// Expands class rows into individual dated events. Both CSV and ICS are written
// from this one list, so the two files can never disagree.
export function buildEvents(rows, week1Monday, lastWeekBeforeRecess, recessWeeks) {
  const events = [];
  const seen = new Map();
  let emptyRows = 0;

  for (const row of rows) {
    const weeks = parseWeeks(row);
    if (!weeks.length) {
      emptyRows++;
      diag('warn', row.remark
        ? `${rowLabel(row)}: no teaching weeks found in "${row.remark}" — 0 events generated.`
        : `${rowLabel(row)}: no "Teaching Wk..." remark at all — 0 events generated. Check whether its venue continuation line is missing.`,
        row.lineNo, row.raw);
      continue;
    }

    const [startHHMM, endHHMM] = row.time.split('-');
    const startMin = parseHHMM(startHHMM);
    const endMin   = parseHHMM(endHHMM);
    if (startMin === null || endMin === null) {
      diag('warn', `${rowLabel(row)}: "${row.time}" is not a real clock time — row dropped, 0 events generated.`, row.lineNo, row.raw);
      emptyRows++;
      continue;
    }
    if (endMin <= startMin) {
      diag('warn', `${rowLabel(row)}: end time is not after start time. Events were still written, but they will look wrong in your calendar.`, row.lineNo, row.raw);
    }

    const dayOff = DAY_OFFSETS[row.day];
    const subject = `${row.course} ${toTitleCase(row.title)} (${CLASS_TYPE_LABELS[row.classType] || row.classType})`;
    checkFormulaInjection(row, subject);

    for (const wk of weeks) {
      if (wk < 1 || wk > ABSURD_WEEK) {
        diag('warn', `${rowLabel(row)}: week ${wk} is outside 1–${ABSURD_WEEK} and looks like a typo — no event written for it.`, row.lineNo);
        continue;
      }
      if (wk > MAX_TEACHING_WEEK) {
        diag('warn', `${rowLabel(row)}: week ${wk} is past teaching week ${MAX_TEACHING_WEEK} — event written, but confirm the date.`, row.lineNo);
      }

      const monday = weekMonday(wk, week1Monday, lastWeekBeforeRecess, recessWeeks);
      const d = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + dayOff, 12, 0, 0, 0);

      // Invariant: the date we computed must land on the day the table said.
      if (d.getDay() !== DAY_JS[row.day]) {
        diag('error', `${rowLabel(row)} week ${wk}: date arithmetic produced ${formatDate(d)}, which is not a ${row.day}. No event written — this is a bug, not a data problem.`, row.lineNo);
        continue;
      }

      const key = `${subject}|${formatDate(d)}|${startHHMM}`;
      if (seen.has(key)) {
        diag('warn', `${rowLabel(row)} on ${formatDate(d)}: identical event already written from line ${seen.get(key)}. Both were kept, so you will get a duplicate in your calendar.`, row.lineNo);
      } else {
        seen.set(key, row.lineNo);
      }

      events.push({
        subject, date: d, startHHMM, endHHMM, week: wk,
        venue: row.venue, course: row.course, classType: row.classType, group: row.group
      });
    }
  }

  return { events, rowCount: rows.length, emptyRows };
}
