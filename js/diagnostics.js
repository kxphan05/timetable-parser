"use strict";

import { SRC_SNIPPET_LEN } from './constants.js';

// Parsing and event-building diagnostics accumulate here for the current run.
// Reset at the start of each run via resetDiagnostics().
let DIAG = [];

export function resetDiagnostics() {
  DIAG = [];
}

export function diag(level, message, lineNo, src) {
  DIAG.push({ level, message, lineNo: lineNo ?? null, src: src ?? null });
}

export function renderDiagnostics(panel) {
  panel.textContent = '';

  const errors = DIAG.filter(d => d.level === 'error');
  const warns  = DIAG.filter(d => d.level === 'warn');

  if (!DIAG.length) {
    panel.className = 'clean';
    panel.textContent = 'Every line was recognised. No rows dropped, no remarks missing.';
    return { errors: errors.length, warns: warns.length };
  }

  panel.className = '';
  for (const d of [...errors, ...warns]) {
    const item = document.createElement('div');
    item.className = 'diag-item ' + (d.level === 'error' ? 'error' : 'warn');

    const tag = document.createElement('div');
    tag.className = 'diag-tag';
    tag.textContent = d.lineNo ? `${d.level} · L${d.lineNo}` : d.level;

    const body = document.createElement('div');
    const msg = document.createElement('p');
    msg.className = 'diag-msg';
    msg.textContent = d.message;          // textContent, never innerHTML
    body.appendChild(msg);

    if (d.src) {
      const src = document.createElement('span');
      src.className = 'diag-src';
      const snip = d.src.length > SRC_SNIPPET_LEN
        ? d.src.slice(0, SRC_SNIPPET_LEN) + '…'
        : d.src;
      src.textContent = snip.replace(/\t/g, '  ⇥  ');
      body.appendChild(src);
    }

    item.appendChild(tag);
    item.appendChild(body);
    panel.appendChild(item);
  }
  return { errors: errors.length, warns: warns.length };
}
