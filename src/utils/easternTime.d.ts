export declare const EASTERN_TIME_ZONE: 'America/New_York'

export declare function parseApiDateTime(value?: string | null): Date | null

export declare function formatEasternDate(value?: string | null): string

export declare function formatEasternTime(value?: string | null): string

export declare function formatEasternDateTime(value?: string | null): string

export declare function formatEasternDateTimeParts(value?: string | null): { date: string; time: string }

export declare function easternWallClockToUtcDateTime(dateValue?: string | null, timeValue?: string | null): string | null
