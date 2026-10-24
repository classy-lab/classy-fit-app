const assert = require('assert/strict')
const {
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
} = require('../src/utils/personalTrainingCalendar')

// Sessions near midnight UTC belong to the previous Eastern calendar day (EDT = UTC-4, EST = UTC-5).
assert.equal(getEasternDateKey('2026-10-07 00:00:00'), '2026-10-06') // 8 PM EDT
assert.equal(getEasternDateKey('2026-10-07 01:00:00'), '2026-10-06') // 9 PM EDT
assert.equal(getEasternDateKey('2026-10-07 03:59:59'), '2026-10-06') // 11:59 PM EDT
assert.equal(getEasternDateKey('2026-10-07 04:00:00'), '2026-10-07') // 12:00 AM EDT
assert.equal(getEasternDateKey('2026-12-15 04:59:59'), '2026-12-14') // 11:59 PM EST
assert.equal(getEasternDateKey('2026-12-15 05:00:00'), '2026-12-15') // 12:00 AM EST
assert.equal(getEasternDateKey('2026-10-06T23:30:00Z'), '2026-10-06')
assert.equal(getEasternDateKey('not a date'), null)
assert.equal(getEasternDateKey(null), null)

// Daylight-saving transition days (2026-03-08 spring forward, 2026-11-01 fall back).
assert.equal(getEasternDateKey('2026-03-08 04:59:59'), '2026-03-07') // 11:59 PM EST
assert.equal(getEasternDateKey('2026-03-08 05:00:00'), '2026-03-08') // 12:00 AM EST
assert.equal(getEasternDateKey('2026-03-09 03:59:59'), '2026-03-08') // 11:59 PM EDT
assert.equal(getEasternDateKey('2026-03-09 04:00:00'), '2026-03-09')
assert.equal(getEasternDateKey('2026-11-01 03:59:59'), '2026-10-31') // 11:59 PM EDT
assert.equal(getEasternDateKey('2026-11-01 04:00:00'), '2026-11-01') // 12:00 AM EDT
assert.equal(getEasternDateKey('2026-11-02 04:59:59'), '2026-11-01') // 11:59 PM EST
assert.equal(getEasternDateKey('2026-11-02 05:00:00'), '2026-11-02')

// "Today" is the Eastern date, not the UTC date.
assert.equal(getTodayEasternDateKey(new Date('2026-10-07T01:30:00Z')), '2026-10-06')
assert.equal(getTodayEasternDateKey(new Date('2026-10-07T04:00:00Z')), '2026-10-07')

// Filtering uses the Eastern date of start_at only.
const sessions = [
  { session_uid: 1, start_at: '2026-10-06 00:00:00', is_available: true }, // Oct 5, 8 PM EDT
  { session_uid: 2, start_at: '2026-10-06 14:00:00', is_available: true }, // Oct 6, 10 AM EDT
  { session_uid: 3, start_at: '2026-10-07 01:00:00', is_available: false, booked_count: 1 }, // Oct 6, 9 PM EDT
  { session_uid: 4, start_at: '2026-10-07 04:00:00', is_available: true }, // Oct 7, 12 AM EDT
  { session_uid: 5, start_at: null },
]
assert.deepEqual(filterSessionsByEasternDate(sessions, '2026-10-05').map((s) => s.session_uid), [1])
assert.deepEqual(filterSessionsByEasternDate(sessions, '2026-10-06').map((s) => s.session_uid), [2, 3])
assert.deepEqual(filterSessionsByEasternDate(sessions, '2026-10-07').map((s) => s.session_uid), [4])
assert.deepEqual(filterSessionsByEasternDate(sessions, '2026-10-08'), [])
assert.deepEqual(filterSessionsByEasternDate(sessions, null), [])
assert.deepEqual(filterSessionsByEasternDate(undefined, '2026-10-06'), [])

// Selecting a different date never leaks sessions from the previous one.
const first = filterSessionsByEasternDate(sessions, '2026-10-06')
const second = filterSessionsByEasternDate(sessions, '2026-10-07')
assert.ok(first.every((s) => !second.includes(s)))

// Availability markers come only from sessions the API reports as available.
const marked = getEasternDateKeysWithAvailableSessions([
  ...sessions,
  { start_at: '2026-10-08 14:00:00', status: 'cancelled', is_available: false },
  { start_at: '2026-10-09 14:00:00', status: 'scheduled' }, // is_available omitted: existing responses stay compatible
])
assert.deepEqual([...marked].sort(), ['2026-10-05', '2026-10-06', '2026-10-07', '2026-10-09'])
assert.equal(marked.has('2026-10-08'), false)
assert.equal(getEasternDateKeysWithAvailableSessions(undefined).size, 0)

// Multi-day sessions occupy every Eastern date they span (the end instant is exclusive).
const spanned = (start, end) => getEasternDateKeysSpanned({ start_at: start, end_at: end })
assert.deepEqual(spanned('2026-10-06 14:00:00', '2026-10-06 15:00:00'), ['2026-10-06'])
assert.deepEqual(spanned('2026-10-07 01:00:00', '2026-10-07 02:00:00'), ['2026-10-06']) // 9-10 PM EDT
assert.deepEqual(spanned('2026-10-07 03:00:00', '2026-10-07 05:00:00'), ['2026-10-06', '2026-10-07']) // 11 PM -> 1 AM EDT
assert.deepEqual(spanned('2026-10-06 14:00:00', '2026-10-07 04:00:00'), ['2026-10-06']) // ends exactly at Eastern midnight
assert.deepEqual(spanned('2026-10-06 14:00:00', '2026-10-09 14:00:00'), ['2026-10-06', '2026-10-07', '2026-10-08', '2026-10-09'])
assert.deepEqual(spanned('2026-10-06 14:00:00', null), ['2026-10-06'])
assert.deepEqual(spanned('2026-10-06 14:00:00', '2026-10-06 13:00:00'), ['2026-10-06']) // end before start is ignored
assert.deepEqual(spanned(null, '2026-10-06 13:00:00'), [])
// Across the 2026-11-01 fall-back day (25 hours) and a month boundary.
assert.deepEqual(spanned('2026-10-31 14:00:00', '2026-11-02 14:00:00'), ['2026-10-31', '2026-11-01', '2026-11-02'])
assert.deepEqual(spanned('2026-10-30 14:00:00', '2026-11-01 14:00:00').length, 3)
// A session like uid 249 (Oct 24 12:00 UTC to Nov 24 18:00 UTC) appears on every day, not only its start date.
const month = spanned('2026-10-24 12:00:00', '2026-11-24 18:00:00')
assert.equal(month.length, 32)
assert.equal(month[0], '2026-10-24')
assert.equal(month[month.length - 1], '2026-11-24')
assert.ok(month.includes('2026-11-01') && month.includes('2026-10-31'))

const spanSessions = [
  { session_uid: 1, start_at: '2026-10-24 12:00:00', end_at: '2026-11-24 18:00:00', booked_count: 0 },
  { session_uid: 2, start_at: '2026-10-31 13:00:00', end_at: '2026-10-31 14:00:00', booked_count: 1 },
  { session_uid: 3, start_at: '2026-11-07 14:00:00', end_at: '2026-11-07 15:00:00', booked_count: 0 },
]
assert.deepEqual(filterSessionsBySpannedEasternDate(spanSessions, '2026-10-31').map((s) => s.session_uid), [1, 2])
assert.deepEqual(filterSessionsBySpannedEasternDate(spanSessions, '2026-11-07').map((s) => s.session_uid), [1, 3])
assert.deepEqual(filterSessionsBySpannedEasternDate(spanSessions, '2026-11-25'), [])
assert.deepEqual(filterSessionsBySpannedEasternDate(spanSessions, '2026-10-23'), [])
assert.deepEqual(filterSessionsBySpannedEasternDate(spanSessions, null), [])
const bookedDays = getSpannedEasternDateKeys(spanSessions, (s) => Number(s.booked_count) > 0)
assert.deepEqual([...bookedDays], ['2026-10-31'])
assert.equal(getSpannedEasternDateKeys(spanSessions).has('2026-11-07'), true)
assert.equal(getSpannedEasternDateKeys(undefined).size, 0)

// Month navigation, including year boundaries.
assert.deepEqual(shiftMonth({ year: 2026, month: 10 }, 1), { year: 2026, month: 11 })
assert.deepEqual(shiftMonth({ year: 2026, month: 12 }, 1), { year: 2027, month: 1 })
assert.deepEqual(shiftMonth({ year: 2026, month: 1 }, -1), { year: 2025, month: 12 })
assert.deepEqual(shiftMonth({ year: 2026, month: 3 }, -3), { year: 2025, month: 12 })
assert.deepEqual(shiftMonth({ year: 2026, month: 1 }, 25), { year: 2028, month: 2 })
assert.ok(compareMonths({ year: 2026, month: 10 }, { year: 2026, month: 11 }) < 0)
assert.equal(compareMonths({ year: 2026, month: 10 }, { year: 2026, month: 10 }), 0)
assert.ok(compareMonths({ year: 2027, month: 1 }, { year: 2026, month: 12 }) > 0)

// Month grid: October 2026 starts on Thursday and has 31 days.
const october = buildMonthGrid({ year: 2026, month: 10 })
assert.ok(october.every((week) => week.length === 7))
assert.deepEqual(october[0].map((c) => c && c.day), [null, null, null, null, 1, 2, 3])
assert.equal(october[0][4].key, '2026-10-01')
const octoberDays = october.flat().filter(Boolean)
assert.equal(octoberDays.length, 31)
assert.equal(octoberDays[30].key, '2026-10-31')
assert.equal(october.length, 5)

// Leap year February and a six-row month.
assert.equal(buildMonthGrid({ year: 2028, month: 2 }).flat().filter(Boolean).length, 29)
assert.equal(buildMonthGrid({ year: 2027, month: 2 }).flat().filter(Boolean).length, 28)
assert.equal(buildMonthGrid({ year: 2026, month: 8 }).length, 6) // Aug 2026 starts Saturday

// Cells in DST-transition months keep consecutive days.
const march = buildMonthGrid({ year: 2026, month: 3 }).flat().filter(Boolean)
assert.deepEqual(march.slice(6, 9).map((c) => c.key), ['2026-03-07', '2026-03-08', '2026-03-09'])
const november = buildMonthGrid({ year: 2026, month: 11 }).flat().filter(Boolean)
assert.deepEqual(november.slice(0, 3).map((c) => c.key), ['2026-11-01', '2026-11-02', '2026-11-03'])

assert.equal(formatMonthLabel({ year: 2026, month: 10 }), 'October 2026')
assert.equal(formatDateKeyLabel('2026-10-06'), 'Tue, Oct 6, 2026')
assert.equal(formatDateKeyLabel('2026-03-08'), 'Sun, Mar 8, 2026')
assert.equal(formatDateKeyLabel('bad'), '')

console.log('Personal training calendar checks passed.')
