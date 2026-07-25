"use strict";

import { CLASS_TYPE_ALIASES, DAY_OFFSETS, MINOR_WORDS } from './constants.js';

export function canonClassType(tok) {
  return CLASS_TYPE_ALIASES[String(tok).trim().toUpperCase()] || null;
}

export function canonDay(tok) {
  const d = String(tok).trim().toUpperCase();
  return Object.prototype.hasOwnProperty.call(DAY_OFFSETS, d) ? d : null;
}

// Split on tabs when the line has any; only fall back to run-of-spaces
// otherwise, so a venue like "COLLAB  2" can't silently shift the columns.
export function splitCols(line) {
  const trimmed = line.trim();
  const parts = trimmed.includes('\t')
    ? trimmed.split('\t')
    : trimmed.split(/\s{2,}/);
  return parts.map(s => s.trim()).filter(s => s.length > 0);
}

function capitalizeWord(w) {
  return w.replace(/^([^a-zA-Z]*)([a-zA-Z])(.*)$/, (m, pre, first, rest) => pre + first.toUpperCase() + rest);
}

export function toTitleCase(str) {
  return str.toLowerCase().split(' ').map((w, i) => {
    const bare = w.replace(/^[^a-zA-Z]+/, '');
    if (i > 0 && MINOR_WORDS.has(bare)) return w;
    return capitalizeWord(w);
  }).join(' ');
}

export function rowLabel(row) {
  return `${row.course} ${row.classType} ${row.day} ${row.time}`;
}
