"use strict";

import { DEFAULT_INPUT } from './sampleData.js';
import { resetDiagnostics, renderDiagnostics } from './diagnostics.js';
import { parseTimetable } from './tableParser.js';
import { buildEvents } from './eventBuilder.js';
import { toCSV } from './csvSerializer.js';
import { toICS } from './icsSerializer.js';
import { readConfig } from './config.js';

document.getElementById('rawInput').value = DEFAULT_INPUT;

let lastCSV = '';
let lastICS = '';
let previewFmt = 'csv';

function showPreview() {
  document.getElementById('csvOutput').value = previewFmt === 'ics' ? lastICS : lastCSV;
}

function setPills(items) {
  const row = document.getElementById('pillRow');
  row.textContent = '';
  for (const it of items) {
    const el = document.createElement('span');
    el.className = 'count-pill' + (it.tone ? ' ' + it.tone : '');
    el.textContent = it.text;
    row.appendChild(el);
  }
}

function runParse() {
  const statusEl = document.getElementById('status');
  const panel = document.getElementById('diagPanel');

  resetDiagnostics();
  lastCSV = '';
  lastICS = '';
  document.getElementById('dlCsvBtn').disabled = true;
  document.getElementById('dlIcsBtn').disabled = true;
  statusEl.className = 'status';
  document.getElementById('csvOutput').value = '';
  setPills([]);

  let cfg;
  try {
    cfg = readConfig();
  } catch (err) {
    statusEl.className = 'status error';
    statusEl.textContent = err.message;
    panel.className = '';
    panel.textContent = '';
    const counts = renderDiagnostics(panel);
    if (!counts.errors && !counts.warns) { panel.className = 'clean'; panel.textContent = 'Fix the setting above, then generate again.'; }
    return;
  }

  const raw = document.getElementById('rawInput').value;
  const rows = parseTimetable(raw);

  if (!rows.length) {
    statusEl.className = 'status error';
    statusEl.textContent = 'No class rows recognised. See the report below.';
    renderDiagnostics(panel);
    return;
  }

  const { events, rowCount, emptyRows } = buildEvents(
    rows, cfg.week1Monday, cfg.lastWeekBeforeRecess, cfg.recessWeeks
  );
  const eventCount = events.length;

  lastCSV = toCSV(events);
  lastICS = eventCount ? toICS(events) : '';
  showPreview();
  document.getElementById('dlCsvBtn').disabled = eventCount === 0;
  document.getElementById('dlIcsBtn').disabled = eventCount === 0;

  const counts = renderDiagnostics(panel);

  const pills = [{ text: `${rowCount} class rows → ${eventCount} events` }];
  if (emptyRows) pills.push({ text: `${emptyRows} rows made 0 events`, tone: 'warn' });
  if (counts.warns) pills.push({ text: `${counts.warns} warnings`, tone: 'warn' });
  if (counts.errors) pills.push({ text: `${counts.errors} errors`, tone: 'err' });
  setPills(pills);

  if (counts.errors) {
    statusEl.className = 'status error';
    statusEl.textContent = 'Generated, but with errors. Read the report before importing.';
  } else if (counts.warns) {
    statusEl.textContent = 'Generated with warnings. Read the report before importing.';
  } else {
    statusEl.textContent = 'Generated cleanly.';
  }
}

function download(text, filename, mime) {
  if (!text) return;
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

document.getElementById('genBtn').addEventListener('click', runParse);
// The BOM makes Excel open the CSV as UTF-8; .ics must not have one, as some
// calendar parsers choke on a BOM before BEGIN:VCALENDAR.
document.getElementById('dlCsvBtn').addEventListener('click',
  () => download('\uFEFF' + lastCSV, 'timetable.csv', 'text/csv;charset=utf-8;'));
document.getElementById('dlIcsBtn').addEventListener('click',
  () => download(lastICS, 'timetable.ics', 'text/calendar;charset=utf-8;'));

for (const btn of document.querySelectorAll('.fmt')) {
  btn.addEventListener('click', () => {
    previewFmt = btn.dataset.fmt;
    for (const b of document.querySelectorAll('.fmt')) {
      b.setAttribute('aria-pressed', String(b.dataset.fmt === previewFmt));
    }
    showPreview();
  });
}
