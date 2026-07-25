"use strict";

// StudentLink exports differ between semesters and faculties. Class types come
// through as both TUT and Tut, LEC/STUDIO and Lec/Stu; times as 1430-1620 and
// 1430to1620. Everything is normalised to a canonical form on the way in.
export const CLASS_TYPE_ALIASES = {
  'TUT':'TUT', 'TUTORIAL':'TUT',
  'LEC':'LEC', 'LECTURE':'LEC', 'LEC/STU':'LEC', 'LEC/STUDIO':'LEC', 'STUDIO':'LEC',
  'LAB':'LAB', 'LABORATORY':'LAB',
  'SEM':'SEM', 'SEMINAR':'SEM',
  'PRJ':'PRJ', 'PROJECT':'PRJ',
  'DES':'DES', 'DESIGN':'DES'
};
export const CLASS_TYPE_LABELS = {
  'TUT':'Tutorial', 'LEC':'Lecture', 'LAB':'Lab',
  'SEM':'Seminar', 'PRJ':'Project', 'DES':'Design'
};
export const KNOWN_CLASS_TYPES = 'Tut / Lec/Stu / Lec/Studio / Lab / Sem / Prj / Des';

export const TIME_RE        = /^(\d{4})\s*(?:-|–|—|to)\s*(\d{4})$/i;
export const COURSE_CODE_RE = /^[A-Z]{2,3}\d{3,4}$/;
export const WEEK_LIST_RE   = /Teaching\s*Wk\s*(\d+(?:\s*[,-]\s*\d+)*)/i;
export const WEEK_LOOSE_RE  = /\bWk\s*(\d+(?:\s*[,-]\s*\d+)*)/i;
export const REMARK_RE      = /Teaching\s*Wk/i;

export const DAY_OFFSETS = { MON:0, TUE:1, WED:2, THU:3, FRI:4, SAT:5, SUN:6 };
export const DAY_JS      = { MON:1, TUE:2, WED:3, THU:4, FRI:5, SAT:6, SUN:0 };
export const MINOR_WORDS = new Set(['of','on','the','and','with','in','to','a','an','for','&']);

// The StudentLink header wraps across several physical lines when pasted
// ("Course\nType", "Index\nNumber", ...). Any leading line made up entirely of
// these tokens is part of that header block.
export const HEADER_TOKENS = new Set([
  'course','title','au','type','group','s/u grade option','index','number',
  'status','choice','class','day','time','venue','remark','ger','exam'
]);

export const MAX_TEACHING_WEEK = 13;   // beyond this: warn, still emit
export const ABSURD_WEEK       = 26;   // beyond this: refuse to emit
export const SRC_SNIPPET_LEN   = 110;
