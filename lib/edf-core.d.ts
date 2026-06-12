import type { ParsedEdf } from '../types/edf'

export function parseEdf(
  buf: ArrayBuffer,
  fileName?: string,
  fileSize?: number | null
): ParsedEdf

export function cutEdf(
  buf: ArrayBuffer,
  parsed: ParsedEdf,
  startSec: number,
  endSec: number
): { bytes: Uint8Array<ArrayBuffer>; suggestedName: string; nRecords: number; startRecord: number; endRecord: number }

export function offsetFromDayTime(
  parsed: ParsedEdf,
  day: number,
  h: number,
  m: number,
  s: number
): number

export function dayOfOffset(parsed: ParsedEdf, offsetSec: number): number

export function numDays(parsed: ParsedEdf): number

export function fmtDuration(sec: number): string

export function fmtSize(n: number): string
