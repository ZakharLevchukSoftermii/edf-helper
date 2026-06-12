/**
 * edf-core.js — framework-agnostic EDF / EDF+ reading and cutting.
 *
 * Pure JavaScript, zero dependencies, runs in any browser (and Node ≥18 with
 * a Buffer→ArrayBuffer). Ported 1:1 from the working "EDF Helper" prototype and
 * verified byte-exact against the reference Python scripts (info_edf.py / cut_edf.py).
 *
 * Two entry points:
 *   parseEdf(arrayBuffer, fileName?, fileSize?)  -> metadata object (mirrors info_edf.py)
 *   cutEdf(arrayBuffer, parsed, startSec, endSec) -> { bytes: Uint8Array, suggestedName }
 *
 * Both work entirely in-memory — nothing is uploaded. The cut reproduces
 * cut_edf.py's record math, header patching, and EDF+ annotation (TAL) onset rewrite.
 *
 * Usage:
 *   import { parseEdf, cutEdf } from './edf-core.js';
 *   const buf = await file.arrayBuffer();
 *   const meta = parseEdf(buf, file.name, file.size);
 *   const { bytes, suggestedName } = cutEdf(buf, meta, 7200, 14400); // seconds from file start
 *   const blob = new Blob([bytes], { type: 'application/octet-stream' });
 */

// ----------------------------------------------------------------------------
// low-level helpers
// ----------------------------------------------------------------------------

function bytesToStr(u8, off, len) {
  let s = '';
  for (let i = 0; i < len; i++) s += String.fromCharCode(u8[off + i]);
  return s.trim();
}

function gfmt(x) {
  // mimics Python's %.6g
  if (!isFinite(x)) return String(x);
  return Number(x.toPrecision(6)).toString();
}

export function fmtSize(n) {
  const units = [['GB', 1 << 30], ['MB', 1 << 20], ['KB', 1 << 10]];
  for (const [u, t] of units) if (n >= t) return (n / t).toFixed(1) + ' ' + u;
  return n + ' B';
}

export function fmtDuration(sec) {
  sec = Math.max(0, Math.floor(sec));
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
  const p = (x) => String(x).padStart(2, '0');
  return p(h) + ':' + p(m) + ':' + p(s);
}

function fmtLocal(d) {
  const p = (x) => String(x).padStart(2, '0');
  return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + ' ' +
    p(d.getHours()) + ':' + p(d.getMinutes()) + ':' + p(d.getSeconds());
}

// ----------------------------------------------------------------------------
// parseEdf — reads the global + per-signal headers (mirror of info_edf.py)
// ----------------------------------------------------------------------------

export function parseEdf(arrayBuffer, fileName = 'recording.edf', fileSize = null) {
  const u8 = new Uint8Array(arrayBuffer);
  if (u8.length < 256) throw new Error('File is too small to contain an EDF header.');
  const size = fileSize == null ? u8.length : fileSize;
  const S = (o, l) => bytesToStr(u8, o, l);

  // --- global header (256 bytes) ---
  const version      = S(0, 8);
  const patientId    = S(8, 80);
  const recording    = S(88, 80);
  const dateRaw      = S(168, 8);   // DD.MM.YY
  const timeRaw      = S(176, 8);   // HH.MM.SS
  const headerBytes  = parseInt(S(184, 8), 10);
  const reserved     = S(192, 44);
  const nRecords     = parseInt(S(236, 8), 10);
  const recDuration  = parseFloat(S(244, 8));
  const ns           = parseInt(S(252, 4), 10);

  if (!Number.isFinite(ns) || ns <= 0 || ns > 2048)
    throw new Error('Invalid signal count — this does not look like an EDF file.');
  if (!Number.isFinite(headerBytes) || headerBytes < 256)
    throw new Error('Invalid header size field.');

  // --- per-signal headers ---
  let o = 256;
  const read = (count, w) => { const a = []; for (let i = 0; i < count; i++) { a.push(bytesToStr(u8, o, w)); o += w; } return a; };
  const labels      = read(ns, 16);
  const transducers = read(ns, 80);
  const units       = read(ns, 8);
  const physMins    = read(ns, 8);
  const physMaxs    = read(ns, 8);
  const digMins     = read(ns, 8);
  const digMaxs     = read(ns, 8);
  const prefilters  = read(ns, 80);
  const spr         = read(ns, 8).map((x) => parseInt(x, 10) || 0); // samples per record
  // (followed by ns * 32 reserved bytes, ignored)

  const format = reserved.startsWith('EDF+C') ? 'EDF+C'
    : reserved.startsWith('EDF+D') ? 'EDF+D'
    : reserved.startsWith('EDF+') ? 'EDF+' : 'EDF';

  // --- start / end datetime ---
  let startDate = null;
  let startStr = (dateRaw + ' ' + timeRaw).trim();
  let endStr = '?';
  const dm = dateRaw.split('.'), tm = timeRaw.split('.');
  if (dm.length === 3 && tm.length === 3) {
    const yy = parseInt(dm[2], 10);
    const year = yy < 69 ? 2000 + yy : 1900 + yy; // EDF 2-digit year rule
    startDate = new Date(year, parseInt(dm[1], 10) - 1, parseInt(dm[0], 10),
      parseInt(tm[0], 10), parseInt(tm[1], 10), parseInt(tm[2], 10));
    if (!isNaN(startDate.getTime())) startStr = fmtLocal(startDate);
    else startDate = null;
  }
  const totalSec = nRecords >= 0 && recDuration > 0 ? nRecords * recDuration : 0;
  if (startDate && totalSec >= 0) endStr = fmtLocal(new Date(startDate.getTime() + totalSec * 1000));

  // --- per-signal table ---
  const signals = [];
  for (let i = 0; i < ns; i++) {
    const isAnnotation = labels[i].includes('EDF Annotations');
    const rate = recDuration > 0 ? spr[i] / recDuration : 0;
    signals.push({
      index: i + 1,
      label: labels[i],
      unit: units[i],
      physMin: physMins[i],
      physMax: physMaxs[i],
      digMin: digMins[i],
      digMax: digMaxs[i],
      rateHz: isAnnotation ? null : rate,
      samplesPerRecord: spr[i],
      transducer: transducers[i],
      prefilter: prefilters[i],
      isAnnotation,
    });
  }

  return {
    fileName, fileSize: size, sizeStr: fmtSize(size),
    version, patientId, recording, format,
    startStr, endStr,
    durationStr: totalSec >= 0 ? fmtDuration(totalSec) + '  (' + gfmt(totalSec) + ' s)' : 'unknown',
    nRecords, recDuration, ns,
    totalSec, startDate,
    headerBytes,
    spr,
    bytesPerRecord: spr.reduce((a, b) => a + b, 0) * 2,
    labels,
    signals,
  };
}

// ----------------------------------------------------------------------------
// cutEdf — extracts [startSec, endSec) and returns a valid EDF (mirror of cut_edf.py)
//   startSec / endSec are offsets in SECONDS from the file start.
//   (Convert a "Day N + HH:MM:SS" UI selection to an offset before calling — see README.)
// ----------------------------------------------------------------------------

export function cutEdf(arrayBuffer, parsed, startSec, endSec) {
  const p = parsed;
  const recDur = p.recDuration > 0 ? p.recDuration : 1;
  const startRecord = Math.floor(startSec / recDur);
  const endRecord = Math.floor(endSec / recDur);
  const nRec = endRecord - startRecord;
  if (nRec <= 0) throw new Error('End must be after start.');

  const u8 = new Uint8Array(arrayBuffer);
  const bpr = p.bytesPerRecord;
  const headerSize = p.headerBytes;

  // patched copy of the 256-byte global header
  const gh = u8.slice(0, 256);
  const baseStart = p.startDate ? p.startDate.getTime() : 0;
  const newStart = new Date(baseStart + startRecord * recDur * 1000);

  if (p.startDate) {
    writeField(gh, 168, fmtDateEdf(newStart), 8);  // DD.MM.YY
    writeField(gh, 176, fmtTimeEdf(newStart), 8);  // HH.MM.SS
    // rewrite "Startdate DD-MON-YYYY" inside the EDF+ recording field
    let rec = bytesToStr(u8, 88, 80);
    rec = rec.replace(/Startdate \d{2}-[A-Z]{3}-\d{4}/, 'Startdate ' + fmtDateRec(newStart));
    writeField(gh, 88, rec, 80);
  }
  writeField(gh, 236, String(nRec), 8);            // number of data records

  const signalHeaders = u8.slice(256, headerSize);
  const dataStart = headerSize + startRecord * bpr;
  const dataOff = 256 + signalHeaders.length;
  const out = new Uint8Array(256 + signalHeaders.length + nRec * bpr);
  out.set(gh, 0);
  out.set(signalHeaders, 256);

  const annIdx = p.labels.findIndex((l) => l.includes('EDF Annotations'));
  if (annIdx < 0) {
    // fast path: bulk-copy the data block
    out.set(u8.subarray(dataStart, dataStart + nRec * bpr), dataOff);
  } else {
    // EDF+ with annotations: rewrite TAL onsets per record
    let annOffset = 0;
    for (let k = 0; k < annIdx; k++) annOffset += p.spr[k];
    annOffset *= 2;
    const annBytes = p.spr[annIdx] * 2;
    for (let r = 0; r < nRec; r++) {
      const srcOff = dataStart + r * bpr;
      const recBytes = u8.slice(srcOff, srcOff + bpr);
      const annRec = recBytes.slice(annOffset, annOffset + annBytes);
      recBytes.set(updateTalOnsets(annRec, startRecord), annOffset);
      out.set(recBytes, dataOff + r * bpr);
    }
  }

  const base = p.fileName.replace(/\.(edf\+?|bdf|rec)$/i, '');
  const suggestedName = base + '_cut_' + fmtTag(newStart) + '.edf';
  return { bytes: out, suggestedName, nRecords: nRec, startRecord, endRecord };
}

// ----------------------------------------------------------------------------
// cut internals
// ----------------------------------------------------------------------------

function writeField(arr, off, str, width) {
  for (let i = 0; i < width; i++) arr[off + i] = i < str.length ? (str.charCodeAt(i) & 0xff) : 0x20;
}
function fmtDateEdf(d) { const p = (x) => String(x).padStart(2, '0'); return p(d.getDate()) + '.' + p(d.getMonth() + 1) + '.' + p(d.getFullYear() % 100); }
function fmtTimeEdf(d) { const p = (x) => String(x).padStart(2, '0'); return p(d.getHours()) + '.' + p(d.getMinutes()) + '.' + p(d.getSeconds()); }
function fmtDateRec(d) { const M = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC']; const p = (x) => String(x).padStart(2, '0'); return p(d.getDate()) + '-' + M[d.getMonth()] + '-' + d.getFullYear(); }
function fmtTag(d) { const p = (x) => String(x).padStart(2, '0'); return p(d.getDate()) + p(d.getMonth() + 1) + p(d.getFullYear() % 100) + '_' + p(d.getHours()) + p(d.getMinutes()) + p(d.getSeconds()); }

// port of cut_edf.py: update_tal_onsets — shifts EDF+ annotation onsets by `delta` records
function updateTalOnsets(buf, delta) {
  const out = [];
  let i = 0;
  while (i < buf.length) {
    if (buf[i] === 0) { out.push(0); i++; continue; }
    if (buf[i] !== 43 && buf[i] !== 45) { out.push(buf[i]); i++; continue; } // '+' / '-'
    i++;
    const onsetBytes = [];
    while (i < buf.length && buf[i] !== 0x14 && buf[i] !== 0x15 && buf[i] !== 0x00) { onsetBytes.push(buf[i]); i++; }
    let onsetStr;
    try {
      const onsetVal = parseFloat(String.fromCharCode.apply(null, onsetBytes));
      const newOnset = onsetVal - delta;
      onsetStr = (newOnset >= 0 ? '+' : '') + gfmt(newOnset);
    } catch (e) {
      onsetStr = '+' + String.fromCharCode.apply(null, onsetBytes);
    }
    for (let k = 0; k < onsetStr.length; k++) out.push(onsetStr.charCodeAt(k) & 0xff);
    while (i < buf.length && buf[i] !== 0x00) { out.push(buf[i]); i++; }
    if (i < buf.length) { out.push(0x00); i++; }
  }
  const origLen = buf.length;
  const res = out.slice(0, origLen);
  while (res.length < origLen) res.push(0x00);
  return Uint8Array.from(res);
}

// ----------------------------------------------------------------------------
// Day + wall-clock helpers (mirror cut_edf.py --start-day / --start-time)
//   Convert a "Day N (1-based) + HH:MM:SS wall clock" selection into a
//   seconds-from-file-start offset suitable for cutEdf().
// ----------------------------------------------------------------------------

export function offsetFromDayTime(parsed, day, h, m, s) {
  const fs = parsed.startDate;
  if (!fs) return h * 3600 + m * 60 + s; // no valid start date → treat as elapsed
  const d = new Date(fs.getFullYear(), fs.getMonth(), fs.getDate() + (day - 1), h, m, s, 0);
  return (d.getTime() - fs.getTime()) / 1000;
}

export function dayOfOffset(parsed, offsetSec) {
  const fs = parsed.startDate;
  if (!fs) return 1;
  const fsMid = new Date(fs.getFullYear(), fs.getMonth(), fs.getDate());
  const abs = new Date(fs.getTime() + offsetSec * 1000);
  const absMid = new Date(abs.getFullYear(), abs.getMonth(), abs.getDate());
  return Math.round((absMid - fsMid) / 86400000) + 1;
}

export function numDays(parsed) {
  const fs = parsed.startDate;
  if (!fs) return 1;
  const fsMid = new Date(fs.getFullYear(), fs.getMonth(), fs.getDate());
  const end = new Date(fs.getTime() + parsed.totalSec * 1000);
  const endMid = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  return Math.max(1, Math.round((endMid - fsMid) / 86400000) + 1);
}
