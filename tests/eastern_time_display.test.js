const assert = require('assert/strict')
const {
  easternWallClockToUtcDateTime,
  formatEasternDate,
  formatEasternTime,
  formatEasternDateTime,
  formatEasternDateTimeParts,
  parseApiDateTime,
} = require('../src/utils/easternTime')

const winterUtc = '2026-01-15 15:30:00'
const summerUtc = '2026-07-15 15:30:00'

const winterDate = formatEasternDate(winterUtc)
const winterTime = formatEasternTime(winterUtc)
const winterDateTime = formatEasternDateTime(winterUtc)

assert.equal(winterDate, 'Jan 15, 2026')
assert.equal(winterTime, '10:30 AM EST')
assert.equal(winterDateTime, 'Thu, Jan 15, 2026, 10:30 AM EST')

const summerDate = formatEasternDate(summerUtc)
const summerTime = formatEasternTime(summerUtc)
const summerDateTime = formatEasternDateTime(summerUtc)

assert.equal(summerDate, 'Jul 15, 2026')
assert.equal(summerTime, '11:30 AM EDT')
assert.equal(summerDateTime, 'Wed, Jul 15, 2026, 11:30 AM EDT')

const parts = formatEasternDateTimeParts(summerUtc)
assert.deepEqual(parts, { date: '2026-07-15', time: '11:30' })

const parsedUtc = parseApiDateTime('2026-07-15 15:30:00')
assert.ok(parsedUtc instanceof Date)
assert.equal(parsedUtc?.toISOString(), '2026-07-15T15:30:00.000Z')

const parsedExplicitUtc = parseApiDateTime('2026-07-15T15:30:00Z')
assert.ok(parsedExplicitUtc instanceof Date)
assert.equal(parsedExplicitUtc?.toISOString(), '2026-07-15T15:30:00.000Z')

assert.equal(easternWallClockToUtcDateTime('2026-01-15', '10:30'), '2026-01-15 15:30:00')
assert.equal(easternWallClockToUtcDateTime('2026-07-15', '10:30'), '2026-07-15 14:30:00')

console.log('Eastern time formatting checks passed.')
