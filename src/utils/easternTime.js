const EASTERN_TIME_ZONE = 'America/New_York'
const EASTERN_TIME_ZONE_OFFSETS_MINUTES = [-300, -240]

const apiDateTimePattern =
  /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d+))?)?)?(?:Z|([+-]\d{2}):?(\d{2}))?$/

const dateOnlyPattern = /^(\d{4})-(\d{2})-(\d{2})$/
const timeOnlyPattern = /^(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d+))?)?$/

const isDateValid = (date) => date instanceof Date && !Number.isNaN(date.getTime())

const parseApiDateTime = (value) => {
  if (value === undefined || value === null) {
    return null
  }

  const raw = String(value).trim()
  if (!raw) {
    return null
  }

  const normalized = raw.includes('T') ? raw : raw.replace(' ', 'T')
  const hasTimezoneSuffix = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(normalized)

  if (hasTimezoneSuffix) {
    const parsed = new Date(normalized)
    return isDateValid(parsed) ? parsed : null
  }

  const match = apiDateTimePattern.exec(raw)
  if (!match) {
    const parsed = new Date(normalized)
    return isDateValid(parsed) ? parsed : null
  }

  const [
    ,
    year,
    month,
    day,
    hour = '00',
    minute = '00',
    second = '00',
    fraction = '0',
  ] = match

  const milliseconds = Number(String(fraction).padEnd(3, '0').slice(0, 3))
  const parsed = new Date(
    Date.UTC(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(minute),
      Number(second),
      milliseconds
    )
  )

  return isDateValid(parsed) ? parsed : null
}

const formatDateParts = (date, options) => {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: EASTERN_TIME_ZONE,
    ...options,
  }).format(date)
}

const easternPartsFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: EASTERN_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
})

const getEasternDateParts = (date) => {
  const parts = easternPartsFormatter.formatToParts(date)
  const getPart = (type) => parts.find((part) => part.type === type)?.value ?? ''

  return {
    year: getPart('year'),
    month: getPart('month'),
    day: getPart('day'),
    hour: getPart('hour'),
    minute: getPart('minute'),
    second: getPart('second'),
  }
}

const parseEasternWallClock = (dateValue, timeValue) => {
  const dateMatch = dateOnlyPattern.exec(String(dateValue ?? '').trim())
  const timeMatch = timeOnlyPattern.exec(String(timeValue ?? '').trim())
  if (!dateMatch || !timeMatch) {
    return null
  }

  const year = Number(dateMatch[1])
  const month = Number(dateMatch[2])
  const day = Number(dateMatch[3])
  const hour = Number(timeMatch[1])
  const minute = Number(timeMatch[2])
  const second = Number(timeMatch[3] ?? '0')
  const fraction = timeMatch[4] ?? '0'

  if (
    month < 1 || month > 12 ||
    day < 1 || day > 31 ||
    hour > 23 ||
    minute > 59 ||
    second > 59
  ) {
    return null
  }

  const milliseconds = Number(String(fraction).padEnd(3, '0').slice(0, 3))
  return {
    year,
    month,
    day,
    hour,
    minute,
    second,
    milliseconds,
  }
}

const formatUtcDateTime = (date) => {
  return date.toISOString().replace('T', ' ').slice(0, 19)
}

const formatEasternDate = (value) => {
  const date = parseApiDateTime(value)
  if (!date) {
    return 'Unknown date'
  }

  return formatDateParts(date, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

const formatEasternTime = (value) => {
  const date = parseApiDateTime(value)
  if (!date) {
    return 'Unknown time'
  }

  return formatDateParts(date, {
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  })
}

const formatEasternDateTime = (value) => {
  const date = parseApiDateTime(value)
  if (!date) {
    return 'Unknown'
  }

  return formatDateParts(date, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  })
}

const formatEasternDateTimeParts = (value) => {
  const date = parseApiDateTime(value)
  if (!date) {
    return { date: '', time: '' }
  }

  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: EASTERN_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date)

  const getPart = (type) => parts.find((part) => part.type === type)?.value ?? ''
  const hour = String(Number(getPart('hour') || '0') % 24).padStart(2, '0')

  return {
    date: `${getPart('year')}-${getPart('month')}-${getPart('day')}`,
    time: `${hour}:${getPart('minute')}`,
  }
}

const easternWallClockToUtcDateTime = (dateValue, timeValue) => {
  const parsed = parseEasternWallClock(dateValue, timeValue)
  if (!parsed) {
    return null
  }

  const targetMs = Date.UTC(
    parsed.year,
    parsed.month - 1,
    parsed.day,
    parsed.hour,
    parsed.minute,
    parsed.second,
    parsed.milliseconds
  )

  for (const offsetMinutes of EASTERN_TIME_ZONE_OFFSETS_MINUTES) {
    const candidate = new Date(targetMs - offsetMinutes * 60_000)
    const parts = getEasternDateParts(candidate)
    if (
      Number(parts.year) === parsed.year &&
      Number(parts.month) === parsed.month &&
      Number(parts.day) === parsed.day &&
      Number(parts.hour) === parsed.hour &&
      Number(parts.minute) === parsed.minute &&
      Number(parts.second) === parsed.second
    ) {
      return formatUtcDateTime(candidate)
    }
  }

  return null
}

module.exports = {
  EASTERN_TIME_ZONE,
  parseApiDateTime,
  formatEasternDate,
  formatEasternTime,
  formatEasternDateTime,
  formatEasternDateTimeParts,
  easternWallClockToUtcDateTime,
}
