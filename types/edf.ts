export type Phase = 'upload' | 'loading' | 'loaded' | 'error'
export type ActiveTab = 'info' | 'cut'

export interface EdfSignal {
  index: number
  label: string
  unit: string
  physMin: string
  physMax: string
  digMin: string
  digMax: string
  rateHz: number | null
  samplesPerRecord: number
  transducer: string
  prefilter: string
  isAnnotation: boolean
}

export interface ParsedEdf {
  fileName: string
  fileSize: number
  sizeStr: string
  version: string
  patientId: string
  recording: string
  format: string
  startStr: string
  endStr: string
  durationStr: string
  nRecords: number
  recDuration: number
  ns: number
  totalSec: number
  startDate: Date | null
  headerBytes: number
  spr: number[]
  bytesPerRecord: number
  labels: string[]
  signals: EdfSignal[]
}

export interface CutRangeUI {
  startSec: number
  endSec: number
  startStr: string
  endStr: string
  startDay: number
  endDay: number
}

export interface SummaryRow {
  label: string
  value: string
}

export interface DayOption {
  value: string
  label: string
}
