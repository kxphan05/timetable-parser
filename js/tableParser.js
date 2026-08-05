"use strict";

import { COURSE_CODE_RE, HEADER_TOKENS, KNOWN_CLASS_TYPES, REMARK_RE, TIME_RE, WEEK_LOOSE_RE } from './constants.js';
import { diag } from './diagnostics.js';
import { canonClassType, canonDay, rowLabel, splitCols } from './textUtils.js';

export function parseTimetable(text) {
  const lines = text.split(/\r?\n/);
  const rows = [];
  let currentCourse = null;
  let inHeader = true;

  function pushRow(cols, ctIdx, course, lineNo, raw) {
    const rawType = cols[ctIdx];
    const classType = canonClassType(rawType);
    const group   = cols[ctIdx + 1] || '';
    const rawDay  = cols[ctIdx + 2] || '';
    const rawTime = cols[ctIdx + 3] || '';
    const venue   = cols[ctIdx + 4] || '';

    // Some exports carry a trailing Exam column, so the remark isn't always at a
    // fixed offset. Find it by content instead of counting columns.
    const remark = cols.slice(ctIdx + 5).find(c => REMARK_RE.test(c)) || '';

    const day = canonDay(rawDay);
    if (!day) {
      diag('warn', `${course.code} ${rawType}: expected a day (Mon–Sun) but found "${rawDay || '(nothing)'}" — this class row was dropped and produces no events.`, lineNo, raw);
      return;
    }
    const tm = TIME_RE.exec(rawTime);
    if (!tm) {
      diag('warn', `${course.code} ${rawType} ${day}: expected a time like 0830-0920 or 0830to0920 but found "${rawTime || '(nothing)'}" — this class row was dropped and produces no events.`, lineNo, raw);
      return;
    }
    const time = `${tm[1]}-${tm[2]}`;
    if (!venue) {
      diag('warn', `${course.code} ${rawType} ${day} ${time}: no venue — the calendar Location will be blank.`, lineNo, raw);
    }
    rows.push({
      course: course.code, title: course.title,
      classType, group, day, time, venue, remark, lineNo, raw
    });
  }

  lines.forEach((rawLine, idx) => {
    const lineNo = idx + 1;
    const trimmed = rawLine.trim();
    if (!trimmed) return;

    const cols = splitCols(trimmed);
    if (!cols.length) return;

    // Consume the header block, however many lines it wrapped onto. The first
    // line that isn't pure header vocabulary ends it and falls through below.
    if (inHeader) {
      if (cols.every(c => HEADER_TOKENS.has(c.toLowerCase()))) return;
      inHeader = false;
    }

    // Wrapped venue line: "[Tutorial Room + 53 (The Hive)]\tTeaching Wk2-13"
    if (trimmed.startsWith('[')) {
      const tail = cols.slice(1);
      const remark = tail.find(c => REMARK_RE.test(c)) || tail.find(c => WEEK_LOOSE_RE.test(c)) || '';
      // cols[0] is the bracketed segment itself ("[Tutorial Room + 53 (The Hive)]"),
      // but since splitCols also breaks on runs of 2+ spaces, a long venue can
      // spill across several columns before the remark/week-list column starts.
      // Take everything up to (but not including) that column as the venue.
      const remarkIdx = remark ? cols.indexOf(remark) : cols.length;
      const fullVenue = cols.slice(0, remarkIdx).join(' ').replace(/^\[|\]$/g, '').trim();
      if (!rows.length) {
        diag('warn', 'Venue continuation line appears before any class row — its teaching weeks were discarded.', lineNo, trimmed);
        return;
      }
      const target = rows[rows.length - 1];
      if (!remark) {
        diag('warn', `Venue continuation line carries no teaching weeks, so ${rowLabel(target)} still has none.`, lineNo, trimmed);
        return;
      }
      if (target.remark) {
        // A row's remark is only ever set once in a well-formed table, so a
        // second one means this line belongs to a row that was dropped above.
        // Keep the existing remark rather than clobbering a good week list.
        diag('warn', `${rowLabel(target)} already has the remark "${target.remark}", so "${remark}" was discarded. It most likely belongs to a class row that was dropped just above.`, lineNo, trimmed);
        return;
      }
      target.remark = remark;
      // Keep this alongside the original short code (row.venue) rather than
      // replacing it — the facility directory lookup in eventBuilder.js
      // matches on the short code, and only falls back to this name when
      // the directory doesn't have it.
      if (fullVenue) target.venueName = fullVenue;
      return;
    }

    // New course block.
    if (COURSE_CODE_RE.test(cols[0])) {
      const title = cols[1] || '';
      // Set the current course *before* validating, so that a malformed course
      // line can't cause following rows to be filed under the previous course.
      currentCourse = { code: cols[0], title };
      if (!title) {
        diag('warn', `Course ${cols[0]} has no title — the calendar subject will just be the code.`, lineNo, trimmed);
      }
      const ctIdx = cols.findIndex((c, i) => i > 1 && canonClassType(c) !== null);
      if (ctIdx === -1) {
        diag('warn', `Course ${cols[0]}: no class type (${KNOWN_CLASS_TYPES}) on this line — the row was dropped.`, lineNo, trimmed);
        return;
      }
      pushRow(cols, ctIdx, currentCourse, lineNo, trimmed);
      return;
    }

    // Continuation row for the course above.
    if (canonClassType(cols[0]) !== null) {
      if (!currentCourse) {
        diag('warn', `A ${cols[0]} row appears before any course code — dropped, because there is nothing to attach it to.`, lineNo, trimmed);
        return;
      }
      pushRow(cols, 0, currentCourse, lineNo, trimmed);
      return;
    }

    diag('warn', 'Line not recognised as a header, course, class, or venue continuation — ignored.', lineNo, trimmed);
  });

  return rows;
}
