export type CalendarMonth = { year: number; month: number }

export type CalendarCell = { day: number; key: string } | null

type SessionLike = {
  start_at?: string | null
  status?: string | null
  is_available?: boolean | null
}

export declare const WEEKDAY_NAMES: string[]

export declare function parseDateKey(key?: string | null): { year: number; month: number; day: number } | null

export declare function getEasternDateKey(value?: string | null): string | null

export declare function getTodayEasternDateKey(now?: Date): string | null

export declare function filterSessionsByEasternDate<T extends SessionLike>(sessions: T[], dateKey?: string | null): T[]

export declare function getEasternDateKeysWithAvailableSessions(sessions: SessionLike[]): Set<string>

export declare function shiftMonth(month: CalendarMonth, delta: number): CalendarMonth

export declare function compareMonths(a: CalendarMonth, b: CalendarMonth): number

export declare function buildMonthGrid(month: CalendarMonth): CalendarCell[][]

export declare function formatMonthLabel(month: CalendarMonth): string

export declare function formatDateKeyLabel(key?: string | null): string
