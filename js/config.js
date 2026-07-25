"use strict";

import { MAX_TEACHING_WEEK } from './constants.js';
import { diag } from './diagnostics.js';

export function readConfig() {
  const dateStr = document.getElementById('week1Monday').value;
  const lastRaw = document.getElementById('lastWeekBeforeRecess').value.trim();
  const recessRaw = document.getElementById('recessWeeks').value.trim();

  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
  if (!m) throw new Error('Set Week 1 Monday before generating.');
  const y = +m[1], mo = +m[2], da = +m[3];
  const week1Monday = new Date(y, mo - 1, da, 12, 0, 0, 0);
  if (week1Monday.getFullYear() !== y || week1Monday.getMonth() !== mo - 1 || week1Monday.getDate() !== da) {
    throw new Error(`${dateStr} is not a real date.`);
  }
  if (week1Monday.getDay() !== 1) {
    diag('warn', `Week 1 Monday (${dateStr}) falls on a ${['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][week1Monday.getDay()]}. Every date below is shifted by the same amount.`);
  }

  if (!/^\d+$/.test(lastRaw)) throw new Error('Last teaching week before recess must be a whole number — every date after recess depends on it.');
  if (!/^\d+$/.test(recessRaw)) throw new Error('Recess length must be a whole number (0 if there is no recess) — every date after recess depends on it.');

  let lastWeekBeforeRecess = Number(lastRaw);
  let recessWeeks = Number(recessRaw);

  if (lastWeekBeforeRecess < 1 || lastWeekBeforeRecess > MAX_TEACHING_WEEK) {
    const clamped = Math.min(Math.max(lastWeekBeforeRecess, 1), MAX_TEACHING_WEEK);
    diag('warn', `Last teaching week before recess was ${lastWeekBeforeRecess}; using ${clamped} instead.`);
    lastWeekBeforeRecess = clamped;
  }
  if (recessWeeks > 4) {
    diag('warn', `Recess length of ${recessWeeks} weeks is unusual — dates after recess are shifted by that much.`);
  }

  return { week1Monday, lastWeekBeforeRecess, recessWeeks };
}
