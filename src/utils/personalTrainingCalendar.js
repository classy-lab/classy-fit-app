const { formatEasternDateTimeParts, parseApiDateTime } = require('./easternTime')

const MAX_SESSION_SPAN_DAYS = 366

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
const WEEKDAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const dateKeyPattern = /^(\d{4})-(\d{2})-(\d{2})$/

const pad = (value) => String(value).padStart(2, '0')

const toDateKey = (year, month, day) => `${year}-${pad(month)}-${pad(day)}`

const parseDateKey = (key) => {
  const match = dateKeyPattern.exec(String(key ?? ''))
  if (!match) {
    return null
  }

  return { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) }
}

// The calendar date (YYYY-MM-DD) of an API timestamp in the PT display timezone (America/New_York).
const getEasternDateKey = (value) => {
  const { date } = formatEasternDateTimeParts(value)
  return dateKeyPattern.test(date) ? date : null
}

const getTodayEasternDateKey = (now = new Date()) => getEasternDateKey(now.toISOString())

// Session timestamps are UTC; only the Eastern calendar date decides which day a session belongs to.
const filterSessionsByEasternDate = (sessions, dateKey) => {
  if (!Array.isArray(sessions) || !dateKey) {
    return []
  }

  return sessions.filter((session) => getEasternDateKey(session?.start_at) === dateKey)
}

// Pure Gregorian arithmetic on a YYYY-MM-DD key: no timezone or DST is involved, so it cannot shift a day.
const addDaysToDateKey = (key, days) => {
  const parts = parseDateKey(key)
  if (!parts) {
    return null
  }

  const next = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + days))
  return toDateKey(next.getUTCFullYear(), next.getUTCMonth() + 1, next.getUTCDate())
}

// Every Eastern calendar date a session occupies, so a manual multi-day session shows on each day it spans.
// The end instant is exclusive: a session ending exactly at Eastern midnight does not occupy the next day.
const getEasternDateKeysSpanned = (session) => {
  const first = getEasternDateKey(session?.start_at)
  if (!first) {
    return []
  }

  let last = first
  const start = parseApiDateTime(session?.start_at)
  const end = parseApiDateTime(session?.end_at)
  if (start && end && end.getTime() > start.getTime()) {
    const lastKey = getEasternDateKey(new Date(end.getTime() - 1000).toISOString())
    if (lastKey && lastKey > first) {
      last = lastKey
    }
  }

  const keys = [first]
  for (let key = first; key < last && keys.length < MAX_SESSION_SPAN_DAYS; ) {
    key = addDaysToDateKey(key, 1)
    keys.push(key)
  }

  return keys
}

const filterSessionsBySpannedEasternDate = (sessions, dateKey) => {
  if (!Array.isArray(sessions) || !dateKey) {
    return []
  }

  return sessions.filter((session) => getEasternDateKeysSpanned(session).includes(dateKey))
}

// The set of Eastern dates occupied by the sessions that satisfy the predicate (all sessions by default).
const getSpannedEasternDateKeys = (sessions, predicate = () => true) => {
  const keys = new Set()
  for (const session of Array.isArray(sessions) ? sessions : []) {
    if (predicate(session)) {
      for (const key of getEasternDateKeysSpanned(session)) {
        keys.add(key)
      }
    }
  }

  return keys
}

// Only dates that actually have a session the API reports as available (never inferred from availability rules).
const getEasternDateKeysWithAvailableSessions = (sessions) => {
  const keys = new Set()
  for (const session of Array.isArray(sessions) ? sessions : []) {
    const status = String(session?.status ?? 'scheduled').toLowerCase()
    if (status !== 'scheduled' || session?.is_available === false) {
      continue
    }

    const key = getEasternDateKey(session?.start_at)
    if (key) {
      keys.add(key)
    }
  }

  return keys
}

// Pure Gregorian arithmetic: no timezone or DST is involved, so it cannot shift a day.
const shiftMonth = ({ year, month }, delta) => {
  const index = year * 12 + (month - 1) + delta
  return { year: Math.floor(index / 12), month: (index % 12) + 1 }
}

const compareMonths = (a, b) => (a.year * 12 + a.month) - (b.year * 12 + b.month)

// Weeks (Sunday first) of cells; cells outside the month are null.
const buildMonthGrid = ({ year, month }) => {
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate()
  const leadingBlanks = new Date(Date.UTC(year, month - 1, 1)).getUTCDay()
  const cells = []

  for (let i = 0; i < leadingBlanks; i += 1) cells.push(null)
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push({ day, key: toDateKey(year, month, day) })
  }
  while (cells.length % 7 !== 0) cells.push(null)

  const weeks = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))

  return weeks
}

const formatMonthLabel = ({ year, month }) => `${MONTH_NAMES[month - 1]} ${year}`

const formatDateKeyLabel = (key) => {
  const parts = parseDateKey(key)
  if (!parts) {
    return ''
  }

  const weekday = new Date(Date.UTC(parts.year, parts.month - 1, parts.day)).getUTCDay()
  return `${WEEKDAY_NAMES[weekday]}, ${MONTH_NAMES[parts.month - 1].slice(0, 3)} ${parts.day}, ${parts.year}`
}

module.exports = {
  WEEKDAY_NAMES,
  parseDateKey,
  getEasternDateKey,
  getTodayEasternDateKey,
  filterSessionsByEasternDate,
  getEasternDateKeysSpanned,
  filterSessionsBySpannedEasternDate,
  getSpannedEasternDateKeys,
  getEasternDateKeysWithAvailableSessions,
  shiftMonth,
  compareMonths,
  buildMonthGrid,
  formatMonthLabel,
  formatDateKeyLabel,
}
