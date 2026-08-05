"use strict";

import { splitCols } from './textUtils.js';

// NTU PINES facility directory (spine, facility code, capacity, location
// code, bookable-by-staff, bookable-by-student), tab-separated so parsing
// doesn't depend on the source alignment being preserved. Static snapshot —
// there is no API to fetch this from.
const PINES_TABLE = `
NORTH SPINE\tLT1 (Von Lee Yong Miang Lecture Theatre)\t502\tNS3-02-09 (LEVEL 2, NEAR N1)\tYES\tYES
NORTH SPINE\tTCT-LT Tan Chin Tuan Lecture Theatre (LT2)\t306\tNS4-02-36 (LEVEL 2, OPP ADMIN BLDG)\tYES\tYES
NORTH SPINE\tLT3\t240\tNS4-02-32 (LEVEL 2, NEAR TCT-LT)\tYES\tYES
NORTH SPINE\tLT4\t240\tNS4-02-34 (LEVEL 2, BESIDE TCT-LT)\tYES\tYES
NORTH SPINE\tLT5\t240\tNS2-02-07 (LEVEL 2, NEAR CEE)\tYES\tNO
NORTH SPINE\tLT6\t240\tNS2-02-05 (LEVEL 2, BESIDE CEE)\tYES\tNO
NORTH SPINE\tLT7\t240\tNS1-02-03 (LEVEL 2, BESIDE CEE)\tYES\tYES
NORTH SPINE\tLT8\t240\tNS1-02-01 (LEVEL 2, NEAR TCT-LT)\tYES\tYES
NORTH SPINE\tLT9\t122\tNS4-04-39 (LEVEL 4, NEAR SCSE)\tYES\tYES
NORTH SPINE\tLT10\t122\tNS4-04-41 (LEVEL 4, NEAR SCSE)\tYES\tYES
NORTH SPINE\tLT11\t122\tNS2-04-15 (LEVEL 4, IN BET N1 & CEE)\tYES\tNO
NORTH SPINE\tLT12\t122\tNS2-04-13 (LEVEL 4, IN BET N1 & CEE)\tYES\tNO
NORTH SPINE\tLT13\t122\tNS2-04-11 (LEVEL 4, IN BET N1 & CEE)\tYES\tNO
NORTH SPINE\tLT14\t122\tNS2-04-09 (LEVEL 4, IN BET N1 & CEE)\tYES\tNO
NORTH SPINE\tLT15\t122\tNS1-04-07 (LEVEL 4, BESIDE CEE)\tYES\tYES
NORTH SPINE\tLT16\t122\tNS1-04-05 (LEVEL 4, NEAR CEE)\tYES\tYES
NORTH SPINE\tLT17\t122\tNS1-04-03 (LEVEL 4, NEAR CEE)\tYES\tYES
NORTH SPINE\tLT18\t122\tNS1-04-01 (LEVEL 4, NEAR CEE)\tYES\tYES
NORTH SPINE\tLT19\t343\tN2-B2A-01 (BASEMENT 2, N2)\tYES\tNO
NORTH SPINE\tLT19A\t577\tLT19A-01-01 (LEVEL 1, NEAR CEE)\tYES\tYES
NORTH SPINE\tLT1A\t694\tLT1A-01-01 (LEVEL 1, OPP MCDONALD'S)\tYES\tYES
NORTH SPINE\tLT20\t343\tN2-B2A-01 (BASEMENT 2, N2)\tYES\tYES
NORTH SPINE\tLT2A\t602\tLT2A-01-01 (LEVEL 1, NEAR MAE)\tYES\tYES
NORTH SPINE\tTR+1\t36\tNS4-05-79\tYES\tYES
NORTH SPINE\tTR+2\t36\tNS4-05-80\tYES\tYES
NORTH SPINE\tTR+3\t36\tNS4-05-81\tYES\tYES
NORTH SPINE\tTR+4\t36\tNS4-05-82\tYES\tYES
NORTH SPINE\tTR+5\t36\tNS4-05-83\tYES\tYES
NORTH SPINE\tTR+6\t36\tNS4-05-84\tYES\tYES
NORTH SPINE\tTR+7\t36\tNS4-05-85\tYES\tYES
NORTH SPINE\tTR+8\t36\tNS4-05-86\tYES\tYES
NORTH SPINE\tTR+9\t36\tNS4-05-87\tYES\tYES
NORTH SPINE\tTR+15\t36\tNS4-05-93\tYES\tNO
NORTH SPINE\tTR+16\t36\tNS4-05-94\tYES\tNO
NORTH SPINE\tTR+17\t36\tNS4-05-95\tYES\tNO
NORTH SPINE\tTR+18\t36\tNS4-05-96\tYES\tNO
NORTH SPINE\tTR+19\t36\tNS4-05-97\tYES\tNO
NORTH SPINE\tTR+20\t36\tNS4-05-98\tYES\tNO
NORTH SPINE\tTR+21\t36\tNS4-05-99\tYES\tNO
NORTH SPINE\tTR+22\t36\tNS4-05-100\tYES\tNO
NORTH SPINE\tTR+23\t36\tNS4-05-101\tYES\tNO
NORTH SPINE\tTR+29\t36\tNS2-05-22\tYES\tNO
NORTH SPINE\tTR+30\t36\tNS2-05-23\tYES\tNO
NORTH SPINE\tTR+31\t36\tNS2-05-24\tYES\tNO
NORTH SPINE\tTR+32\t36\tNS2-05-25\tYES\tNO
NORTH SPINE\tTR+33\t36\tNS2-05-26\tYES\tNO
NORTH SPINE\tTR+34\t36\tNS2-05-27\tYES\tNO
NORTH SPINE\tTR+35\t36\tNS2-05-28\tYES\tNO
NORTH SPINE\tTR+36\t36\tNS2-05-29\tYES\tNO
NORTH SPINE\tTR+37\t36\tNS2-05-30\tYES\tNO
NORTH SPINE\tTRX43\t36\tN2-B2A-05 (BASEMENT 2, N2)\tYES\tNO
NORTH SPINE\tTRX44\t36\tN2-B2A-06 (BASEMENT 2, N2)\tYES\tNO
SCI BUILDING\tLF-LT Lee Foundation Lecture Theatre (CS-LT1)\t219\tWKWSCI-01-LT1, WKWSCI (BET S1 & S2)\tYES\tNO
SCI BUILDING\tCS-TR+7\t30\tCS-02-18, WKWSCI (BETWEEN S1 & S2)\tYES\tNO
SCI BUILDING\tCS-TR+8\t36\tCS-02-21, WKWSCI (BETWEEN S1 & S2)\tYES\tNO
SCI BUILDING\tCS-TR+9\t24\tCS-03-31, WKWSCI (BETWEEN S1 & S2)\tYES\tNO
SOUTH SPINE\tLHS-LT\t111\tLHS-01-04, THE HIVE\tYES\tYES
SOUTH SPINE\tLT22\t350\tSS2-B2-07 (BASEMENT 2, NEAR LKC-LT)\tYES\tNO
SOUTH SPINE\tLT23\t350\tSS2-B2-05 (BASEMENT 2, NEAR LKC-LT)\tYES\tNO
SOUTH SPINE\tLT24\t350\tSS1-B2-03 (BASEMENT 2, BESIDE S2)\tYES\tNO
SOUTH SPINE\tLT25\t350\tSS1-B2-01 (BASEMENT 2, BESIDE S1)\tYES\tNO
SOUTH SPINE\tLT26\t406\tSS4-B2-33 (BASEMENT 2, BESIDE S4)\tYES\tYES
SOUTH SPINE\tLT27\t406\tSS4-B2-31 (BASEMENT 2, BESIDE S3)\tYES\tYES
SOUTH SPINE\tLT28\t254\tSS2-B1-17 (BASEMENT 1, NEAR S2)\tYES\tNO
SOUTH SPINE\tLT29\t254\tSS2-B1-16 (BASEMENT 1, BESIDE S2)\tYES\tNO
SOUTH SPINE\tLKC-LT Lee Kong Chian Lecture Theatre\t1010\tSS3-B2-10 (B2, ABOVE CANTEEN)\tYES\tYES
SOUTH SPINE\tRECEP RM\t10\tSS3-B2-09 (B2, NEXT TO LKC-LT FOYER)\tYES\tYES
SOUTH SPINE\tFOYER\t200\tSS3-B2 (B2, IN FRONT OF LKC-LT)\tYES\tNO
SOUTH SPINE\tEXHIB GALY\t200\tSS3-B1-19 (B1, ABOVE LKC-LT FOYER)\tYES\tYES
SOUTH SPINE\tFN RM\t200\tSS3-B1-22 (B1, BESIDE EXHIB GALLERY)\tYES\tYES
SOUTH SPINE\tS3.2 ESR4\t49\tS3.2-B3-07\tNO\tNO
SOUTH SPINE\tS3.2 ESR3\t49\tS3.2-B3-08\tNO\tNO
SOUTH SPINE\tTRX122\t30\tSS4-01-24\tYES\tNO
SOUTH SPINE\tICC-LAB1 ICC ColLAB 1\t210\tEMB-05-19\tNO\tNO
SOUTH SPINE\tICC-LAB2 ICC ColLAB 2\t174\tEMB-05-21\tNO\tNO
SOUTH SPINE\tLHS-TR+1 \t30\tLHS-B5-03, THE HIVE\tNO\tNO
SOUTH SPINE\tLHS-TR+10 Repurposed for I&E Use\t30\tLHS-B4-09, THE HIVE\tNO\tNO
SOUTH SPINE\tLHS-TR+11 Repurposed for I&E Use\t30\tLHS-B4-10, THE HIVE\tNO\tNO
SOUTH SPINE\tLHS-TR+12 Repurposed for I&E Use\t24\tLHS-B4-11, THE HIVE\tNO\tNO
SOUTH SPINE\tLHS-TR+13 Repurposed for I&E Use\t30\tLHS-B3-01, THE HIVE\tNO\tNO
SOUTH SPINE\tLHS-TR+14 Repurposed for I&E Use\t30\tLHS-B3-02, THE HIVE\tNO\tNO
SOUTH SPINE\tLHS-TR+15 Repurposed for I&E Use\t30\tLHS-B3-03, THE HIVE\tNO\tNO
SOUTH SPINE\tLHS-TR+16 Repurposed for I&E Use\t30\tLHS-B3-04, THE HIVE\tNO\tNO
SOUTH SPINE\tLHS-TR+17 Repurposed for I&E Use\t30\tLHS-B3-05, THE HIVE\tNO\tNO
SOUTH SPINE\tLHS-TR+18 Repurposed for I&E Use\t30\tLHS-B3-06, THE HIVE\tNO\tNO
SOUTH SPINE\tLHS-TR+19 Repurposed for I&E Use\t30\tLHS-B3-07, THE HIVE\tNO\tNO
SOUTH SPINE\tLHS-TR+2 Repurposed for I&E Use\t30\tLHS-B4-01, THE HIVE\tNO\tNO
SOUTH SPINE\tLHS-TR+20 \t30\tLHS-B3-08, THE HIVE\tNO\tNO
SOUTH SPINE\tLHS-TR+21 \t30\tLHS-B3-09, THE HIVE\tNO\tNO
SOUTH SPINE\tLHS-TR+22 \t30\tLHS-B3-10, THE HIVE\tNO\tNO
SOUTH SPINE\tLHS-TR+23 \t24\tLHS-B3-11, THE HIVE\tNO\tNO
SOUTH SPINE\tLHS-TR+24\t36\tLHS-B2-01, THE HIVE\tYES\tYES
SOUTH SPINE\tLHS-TR+25\t30\tLHS-B2-02, THE HIVE\tYES\tYES
SOUTH SPINE\tLHS-TR+26\t30\tLHS-B2-03, THE HIVE\tYES\tYES
SOUTH SPINE\tLHS-TR+27\t36\tLHS-B2-04, THE HIVE\tYES\tYES
SOUTH SPINE\tLHS-TR+28\t36\tLHS-B2-05, THE HIVE\tYES\tYES
SOUTH SPINE\tLHS-TR+29\t36\tLHS-B2-06, THE HIVE\tYES\tYES
SOUTH SPINE\tLHS-TR+3 Repurposed for I&E Use\t30\tLHS-B4-02, THE HIVE\tNO\tNO
SOUTH SPINE\tLHS-TR+30\t36\tLHS-B2-07, THE HIVE\tYES\tYES
SOUTH SPINE\tLHS-TR+31\t36\tLHS-B2-08, THE HIVE\tYES\tYES
SOUTH SPINE\tLHS-TR+32\t36\tLHS-B2-09, THE HIVE\tYES\tYES
SOUTH SPINE\tLHS-TR+33\t36\tLHS-B2-10, THE HIVE\tYES\tYES
SOUTH SPINE\tLHS-TR+34\t30\tLHS-B2-11, THE HIVE\tYES\tYES
SOUTH SPINE\tLHS-TR+35\t36\tLHS-B1-01, THE HIVE\tYES\tNO
SOUTH SPINE\tLHS-TR+36\t36\tLHS-B1-02, THE HIVE\tYES\tYES
SOUTH SPINE\tLHS-TR+37\t36\tLHS-B1-03, THE HIVE\tYES\tYES
SOUTH SPINE\tLHS-TR+38\t36\tLHS-B1-04, THE HIVE\tYES\tYES
SOUTH SPINE\tLHS-TR+39\t36\tLHS-B1-05, THE HIVE\tYES\tYES
SOUTH SPINE\tLHS-TR+4 Repurposed for I&E Use\t36\tLHS-B4-03, THE HIVE\tNO\tNO
SOUTH SPINE\tLHS-TR+40\t36\tLHS-B1-06, THE HIVE\tYES\tYES
SOUTH SPINE\tLHS-TR+41\t36\tLHS-B1-07, THE HIVE\tYES\tYES
SOUTH SPINE\tLHS-TR+42\t36\tLHS-B1-08, THE HIVE\tYES\tYES
SOUTH SPINE\tLHS-TR+43\t36\tLHS-B1-09, THE HIVE\tYES\tYES
SOUTH SPINE\tLHS-TR+44\t36\tLHS-B1-10, THE HIVE\tYES\tYES
SOUTH SPINE\tLHS-TR+45\t30\tLHS-B1-11, THE HIVE\tYES\tYES
SOUTH SPINE\tLHS-TR+46\t30\tLHS-01-05, THE HIVE\tYES\tNO
SOUTH SPINE\tLHS-TR+47\t60\tLHS-02-01, THE HIVE\tYES\tNO
SOUTH SPINE\tLHS-TR+48\t36\tLHS-02-02, THE HIVE\tYES\tNO
SOUTH SPINE\tLHS-TR+49\t60\tLHS-02-03, THE HIVE\tYES\tNO
SOUTH SPINE\tLHS-TR+5 Repurposed for I&E Use\t30\tLHS-B4-04, THE HIVE\tNO\tNO
SOUTH SPINE\tLHS-TR+50\t36\tLHS-02-04, THE HIVE\tYES\tNO
SOUTH SPINE\tLHS-TR+51\t36\tLHS-02-05, THE HIVE\tYES\tNO
SOUTH SPINE\tLHS-TR+52\t60\tLHS-02-06, THE HIVE\tYES\tNO
SOUTH SPINE\tLHS-TR+53\t60\tLHS-02-07, THE HIVE\tYES\tNO
SOUTH SPINE\tLHS-TR+54\t30\tLHS-02-08, THE HIVE\tYES\tNO
SOUTH SPINE\tLHS-TR+55\t36\tLHS-03-01, THE HIVE\tYES\tNO
SOUTH SPINE\tLHS-TR+56 Derek Goh Bak Heng Tutorial Room\t60\tLHS-03-02, THE HIVE\tYES\tNO
SOUTH SPINE\tLHS-TR+6 to be repurposed\t30\tLHS-B4-05, THE HIVE\tNO\tNO
SOUTH SPINE\tLHS-TR+7 to be repurposed\t36\tLHS-B4-06, THE HIVE\tNO\tNO
SOUTH SPINE\tLHS-TR+8 to be repurposed\t30\tLHS-B4-07, THE HIVE\tNO\tNO
SOUTH SPINE\tLHS-TR+9 to be repurposed\t30\tLHS-B4-08, THE HIVE\tNO\tNO
SOUTH SPINE\tTR+61\t36\tSS1-B1-07\tYES\tNO
SOUTH SPINE\tTR+62\t36\tSS1-B1-06\tYES\tNO
SOUTH SPINE\tTR+63\t36\tSS1-B1-05\tYES\tNO
SOUTH SPINE\tTR+64\t36\tSS1-B1-04\tYES\tNO
SOUTH SPINE\tTR+65\t36\tSS1-B1-03\tYES\tNO
SOUTH SPINE\tTR+66\t36\tSS1-B1-02\tYES\tNO
SOUTH SPINE\tTR+67\t36\tSS1-B1-01\tYES\tNO
SOUTH SPINE\tTR+68\t36\tSS1-B1-14\tYES\tNO
SOUTH SPINE\tTR+69\t36\tSS1-B1-13\tYES\tNO
SOUTH SPINE\tTR+77 Dr Elsie Yu Chen Chee (1999)\t36\tSS4-B1-34\tYES\tNO
SOUTH SPINE\tTR+78\t36\tSS4-B1-33\tYES\tNO
SOUTH SPINE\tTR+79\t36\tSS4-B1-32\tYES\tNO
SOUTH SPINE\tTR+80\t36\tSS4-B1-31\tYES\tNO
SOUTH SPINE\tTR+87\t30\tSS4-B1-30\tYES\tNO
SOUTH SPINE\tTR+88\t36\tSS2-01-09\tYES\tNO
SOUTH SPINE\tTR+89\t36\tSS2-01-10\tYES\tNO
SOUTH SPINE\tTR+90\t36\tSS2-01-11\tYES\tNO
SOUTH SPINE\tTR+91\t36\tSS2-01-12\tYES\tNO
SOUTH SPINE\tTR+92\t36\tSS2-01-13\tYES\tNO
SOUTH SPINE\tTR+93\t36\tSS2-01-14\tYES\tNO
SOUTH SPINE\tTR+94\t36\tSS2-01-15\tYES\tNO
SOUTH SPINE\tTR+95\t36\tSS2-01-16\tYES\tNO
SOUTH SPINE\tTR+96\t36\tSS2-01-17\tYES\tNO
SOUTH SPINE\tTR102\t75\tSS1-01-02\tYES\tNO
SOUTH SPINE\tTR103\t75\tSS1-01-01\tNO\tNO
SOUTH SPINE\tTR+106\t36\tSS4-01-40\tNO\tNO
SOUTH SPINE\tTR+107\t36\tSS4-01-39\tYES\tNO
SOUTH SPINE\tTR+108\t36\tSS4-01-38\tYES\tNO
SOUTH SPINE\tTR+109\t36\tSS4-01-37\tNO\tNO
SOUTH SPINE\tTR+110\t36\tSS4-01-36\tNO\tNO
SOUTH SPINE\tTR+111\t36\tSS4-01-35\tNO\tNO
SOUTH SPINE\tTR+112\t36\tSS4-01-34\tNO\tNO
SOUTH SPINE\tTR+113\t36\tSS4-01-33\tNO\tNO
SOUTH SPINE\tTR+114\t36\tSS4-01-32\tNO\tNO
SOUTH SPINE\tTR120\t48\tSS4-01-26\tNO\tNO
SOUTH SPINE\tTR121\t40\tSS4-01-25\tNO\tNO
SOUTH SPINE\tTR+151\t30\tS4-B2C-36\tYES\tNO
SOUTH SPINE\tTR+152\t30\tS4-B2C-38\tYES\tNO
SOUTH SPINE\tTR+153\t30\tS4-B2C-39\tYES\tNO
SOUTH SPINE\tTR+154\t30\tS4-B2C-41\tYES\tNO
SOUTH SPINE\tTR+159\t30\tS4-B2C-46\tYES\tNO
SOUTH SPINE\tTR+160\t30\tS4-B2C-48\tYES\tNO
SOUTH SPINE\tTR+165\t30\tS4-B2C-53\tYES\tNO
SOUTH SPINE\tTR+166\t30\tS4-B2C-55\tYES\tNO
THE ARC (NORTH SPINE)\tLHN-LT\t108\tLHN-B1-15\tYES\tNO
THE ARC (NORTH SPINE)\tLHN-TR+01\t36\tLHN-B2-01\tYES\tYES
THE ARC (NORTH SPINE)\tLHN-TR+02\t36\tLHN-B2-02\tYES\tYES
THE ARC (NORTH SPINE)\tLHN-TR+03\t36\tLHN-B2-03\tYES\tYES
THE ARC (NORTH SPINE)\tLHN-TR+04\t60\tLHN-B2-04\tYES\tYES
THE ARC (NORTH SPINE)\tLHN-TR+05\t36\tLHN-B2-05\tYES\tYES
THE ARC (NORTH SPINE)\tLHN-TR+06\t36\tLHN-B2-06\tYES\tYES
THE ARC (NORTH SPINE)\tLHN-TR+07\t36\tLHN-B2-07\tYES\tYES
THE ARC (NORTH SPINE)\tLHN-TR+08\t36\tLHN-B2-08\tYES\tYES
THE ARC (NORTH SPINE)\tLHN-TR+09\t36\tLHN-B2-09\tYES\tYES
THE ARC (NORTH SPINE)\tLHN-TR+10\t36\tLHN-B2-10\tYES\tYES
THE ARC (NORTH SPINE)\tLHN-TR+11\t36\tLHN-B2-11\tYES\tYES
THE ARC (NORTH SPINE)\tLHN-TR+12\t66\tLHN-B2-12\tYES\tYES
THE ARC (NORTH SPINE)\tLHN-TR+13\t36\tLHN-L1-01\tYES\tYES
THE ARC (NORTH SPINE)\tLHN-TR+14\t72\tLHN-L1-02\tYES\tYES
THE ARC (NORTH SPINE)\tLHN-TR+15\t72\tLHN-L1-03\tYES\tYES
THE ARC (NORTH SPINE)\tLHN-TR+16\t36\tLHN-L1-04\tYES\tYES
THE ARC (NORTH SPINE)\tLHN-TR+17\t36\tLHN-L1-05\tYES\tYES
THE ARC (NORTH SPINE)\tLHN-TR+18\t36\tLHN-L1-06\tYES\tYES
THE ARC (NORTH SPINE)\tLHN-TR+19\t36\tLHN-L1-07\tYES\tYES
THE ARC (NORTH SPINE)\tLHN-TR+20\t36\tLHN-L1-08\tYES\tYES
THE ARC (NORTH SPINE)\tLHN-TR+21\t36\tLHN-L1-09\tYES\tNO
THE ARC (NORTH SPINE)\tLHN-TR+22\t30\tLHN-L1-10\tYES\tYES
THE ARC (NORTH SPINE)\tLHN-TR+23\t30\tLHN-L1-11\tYES\tYES
THE ARC (NORTH SPINE)\tLHN-TR+24\t30\tLHN-L1-12\tYES\tNO
THE ARC (NORTH SPINE)\tLHN-TR+25\t30\tLHN-L1-13\tYES\tNO
THE ARC (NORTH SPINE)\tLHN-TR+26\t30\tLHN-L1-14\tYES\tYES
THE ARC (NORTH SPINE)\tLHN-TR+27\t30\tLHN-L1-15\tYES\tYES
THE ARC (NORTH SPINE)\tLHN-TR+28\t30\tLHN-L1-16\tYES\tYES
THE ARC (NORTH SPINE)\tLHN-TR+29\t30\tLHN-L1-17\tYES\tNO
THE ARC (NORTH SPINE)\tLHN-TR+30\t60\tLHN-L1-18\tYES\tYES
THE ARC (NORTH SPINE)\tLHN-TR+31\t36\tLHN-L1-19\tYES\tNO
THE ARC (NORTH SPINE)\tLHN-TR+32\t30\tLHN-L1-20\tYES\tNO
THE ARC (NORTH SPINE)\tLHN-TR+33\t30\tLHN-L1-21\tYES\tNO
THE ARC (NORTH SPINE)\tLHN-TR+34\t30\tLHN-L1-22\tYES\tNO
THE ARC (NORTH SPINE)\tLHN-TR+35\t36\tLHN-L2-01\tNO\tNO
THE ARC (NORTH SPINE)\tLHN-TR+36\t72\tLHN-L2-02\tYES\tYES
THE ARC (NORTH SPINE)\tLHN-TR+37\t72\tLHN-L2-03\tYES\tYES
THE ARC (NORTH SPINE)\tLHN-TR+38\t36\tLHN-L2-04\tNO\tYES
THE ARC (NORTH SPINE)\tLHN-TR+39\t36\tLHN-L2-05\tNO\tNO
THE ARC (NORTH SPINE)\tLHN-TR+40\t36\tLHN-L2-06\tNO\tNO
THE ARC (NORTH SPINE)\tLHN-TR+41\t36\tLHN-L2-07\tNO\tNO
THE ARC (NORTH SPINE)\tLHN-TR+42\t36\tLHN-L2-08\tNO\tNO
THE ARC (NORTH SPINE)\tLHN-TR+43\t36\tLHN-L2-09\tNO\tNO
THE ARC (NORTH SPINE)\tLHN-TR+44 dedicated to students' use\t30\tLHN-L2-10\tNO\tNO
THE ARC (NORTH SPINE)\tLHN-TR+45 dedicated to students' use\t30\tLHN-L2-11\tNO\tNO
THE ARC (NORTH SPINE)\tLHN-TR+46 dedicated to students' use\t30\tLHN-L2-12\tNO\tNO
THE ARC (NORTH SPINE)\tLHN-TR+47 dedicated to students' use\t30\tLHN-L2-13\tNO\tNO
THE ARC (NORTH SPINE)\tLHN-TR+48 dedicated to students' use\t30\tLHN-L2-14\tNO\tNO
THE ARC (NORTH SPINE)\tLHN-TR+49 dedicated to students' use\t30\tLHN-L2-15\tNO\tNO
THE ARC (NORTH SPINE)\tLHN-TR+50\t30\tLHN-L2-16\tNO\tNO
THE ARC (NORTH SPINE)\tLHN-TR+51 dedicated to students' use\t30\tLHN-L2-17\tNO\tNO
THE ARC (NORTH SPINE)\tLHN-TR+52\t60\tLHN-L2-18\tNO\tYES
THE ARC (NORTH SPINE)\tLHN-TR+53\t36\tLHN-L2-19\tNO\tNO
THE ARC (NORTH SPINE)\tLHN-TR+54 dedicated to students' use\t30\tLHN-L2-20\tNO\tNO
THE ARC (NORTH SPINE)\tLHN-TR+55\t30\tLHN-L2-21\tNO\tNO
THE ARC (NORTH SPINE)\tLHN-TR+56\t30\tLHN-L2-22\tNO\tNO
`.trim();

// Splits "CODE rest of the text" into { code, rest }. `rest` is '' when the
// column is just a bare code.
function splitLeadingToken(text) {
  const m = /^(\S+)\s*(.*)$/.exec(text.trim());
  return m ? { code: m[1], rest: m[2] } : { code: text.trim(), rest: '' };
}

// A LOCATION cell is either "CODE", "CODE, tag text" or "CODE (tag text)".
// Split on the comma/paren directly rather than on whitespace, since a
// comma-separated code has no space before the comma ("LHS-02-07, THE HIVE").
function parseLocationCell(text) {
  const trimmed = text.trim();
  const commaIdx = trimmed.indexOf(',');
  const parenIdx = trimmed.indexOf('(');
  const cut = commaIdx !== -1 && (parenIdx === -1 || commaIdx < parenIdx) ? commaIdx : parenIdx;
  if (cut === -1) return { locCode: trimmed, tag: null };
  const locCode = trimmed.slice(0, cut).trim();
  const tag = trimmed.slice(cut + 1).replace(/^,\s*/, '').replace(/\)\s*$/, '').trim();
  return { locCode, tag: tag || null };
}

// Some facility names are wrapped in their own parens, e.g. "(Von Lee Yong
// Miang Lecture Theatre)" — strip that outer pair so it isn't double-nested
// once formatEntry wraps the spine in parens too.
function cleanFacilityDesc(desc) {
  if (!desc) return null;
  const m = /^\((.*)\)$/.exec(desc);
  return m ? m[1] : desc;
}

function buildDirectory() {
  const map = new Map();
  for (const line of PINES_TABLE.split('\n')) {
    const cols = splitCols(line);
    if (cols.length !== 6) continue; // defensive; every embedded row is 6 cols
    const [spine, facilityRaw, , locationRaw] = cols;
    const { code: facilityCode, rest: facilityDesc } = splitLeadingToken(facilityRaw);
    const { locCode, tag } = parseLocationCell(locationRaw);
    map.set(facilityCode.toUpperCase(), {
      facilityCode, facilityDesc: facilityDesc || null, spine, locCode, tag
    });
  }
  return map;
}

const DIRECTORY = buildDirectory();

// Venues that use the campus's colloquial name rather than the PINES
// facility code, and aren't in the directory at all — supplied by hand.
const MANUAL_OVERRIDES = [
  { test: v => v.startsWith('RPR'), code: v => v, tag: 'RENAISSANCE ENGINEERING ROOM', paren: 'BINJAI HALL 19B', room: null },
  { test: v => v === 'TAISPSPACE', code: () => 'TAISPSPACE', tag: null, paren: 'NORTH SPINE', room: 'N4-01B-04' },
  { test: v => v === 'HPL', code: () => 'HARDWARE PROJECT LAB', tag: null, paren: 'NORTH SPINE', room: 'N4-01C-09A' }
];

// Splits both codes on their first hyphen; if the prefixes match, both codes
// are shown with that shared prefix dropped (e.g. LHS-TR+53 / LHS-02-07 ->
// TR+53 / 02-07). Otherwise both are shown in full.
function stripSharedPrefix(facilityCode, locCode) {
  const f = facilityCode.split('-');
  const l = locCode.split('-');
  if (f.length > 1 && l.length > 1 && f[0].toUpperCase() === l[0].toUpperCase()) {
    return { code: f.slice(1).join('-'), room: l.slice(1).join('-') };
  }
  return { code: facilityCode, room: locCode };
}

function formatEntry({ code, tag, paren, room }) {
  let out = code;
  if (tag) out += `, ${tag}`;
  if (paren) out += ` (${paren})`;
  if (room) out += `, ${room}`;
  return out;
}

export function resolveVenueLocation(rawVenue) {
  const norm = String(rawVenue).trim().toUpperCase();
  if (!norm) return null;

  const direct = DIRECTORY.get(norm);
  if (direct) {
    const { code, room } = stripSharedPrefix(direct.facilityCode, direct.locCode);
    const tag = cleanFacilityDesc(direct.facilityDesc) || direct.tag;
    return formatEntry({ code, tag, paren: direct.spine, room });
  }

  // Match by description text (e.g. venue "COLLAB 1" against directory
  // facility "ICC-LAB1 ICC ColLAB 1"). Show the venue text as printed on the
  // timetable, not the internal facility code, since that's what's on the
  // door; the description that found the match would be redundant as a tag.
  for (const entry of DIRECTORY.values()) {
    if (entry.facilityDesc && entry.facilityDesc.toUpperCase().includes(norm)) {
      return formatEntry({ code: rawVenue.trim(), tag: entry.tag, paren: entry.spine, room: entry.locCode });
    }
  }

  for (const override of MANUAL_OVERRIDES) {
    if (override.test(norm)) {
      return formatEntry({
        code: override.code(rawVenue.trim()), tag: override.tag,
        paren: override.paren, room: override.room
      });
    }
  }

  return null;
}
