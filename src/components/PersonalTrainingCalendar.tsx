import { useState } from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { AppColors } from '../styles/colors'
import {
  WEEKDAY_NAMES,
  buildMonthGrid,
  compareMonths,
  formatMonthLabel,
  parseDateKey,
  shiftMonth,
} from '../utils/personalTrainingCalendar'

type Props = {
  selectedDateKey: string
  todayDateKey: string
  markedDateKeys: Set<string>
  onSelectDate: (dateKey: string) => void
}

const monthOf = (dateKey: string) => {
  const parts = parseDateKey(dateKey)
  return parts ? { year: parts.year, month: parts.month } : { year: 1970, month: 1 }
}

const PersonalTrainingCalendar = ({ selectedDateKey, todayDateKey, markedDateKeys, onSelectDate }: Props) => {
  const [visibleMonth, setVisibleMonth] = useState(() => monthOf(selectedDateKey))
  const currentMonth = monthOf(todayDateKey)
  const canGoBack = compareMonths(visibleMonth, currentMonth) > 0
  const weeks = buildMonthGrid(visibleMonth)

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => canGoBack && setVisibleMonth(shiftMonth(visibleMonth, -1))}
          disabled={!canGoBack}
          style={styles.navButton}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityLabel="Previous month"
        >
          <Feather name="chevron-left" size={26} color={canGoBack ? AppColors.blue : AppColors.grey2} />
        </TouchableOpacity>
        <Text style={styles.monthLabel}>{formatMonthLabel(visibleMonth)}</Text>
        <TouchableOpacity
          onPress={() => setVisibleMonth(shiftMonth(visibleMonth, 1))}
          style={styles.navButton}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityLabel="Next month"
        >
          <Feather name="chevron-right" size={26} color={AppColors.blue} />
        </TouchableOpacity>
      </View>

      <View style={styles.weekRow}>
        {WEEKDAY_NAMES.map((name) => (
          <Text key={name} style={styles.weekdayText}>
            {name.charAt(0)}
          </Text>
        ))}
      </View>

      {weeks.map((week, weekIndex) => (
        <View key={`${visibleMonth.year}-${visibleMonth.month}-${weekIndex}`} style={styles.weekRow}>
          {week.map((cell, cellIndex) => {
            if (!cell) {
              return <View key={`blank-${cellIndex}`} style={styles.dayCell} />
            }

            const isPast = cell.key < todayDateKey
            const isSelected = cell.key === selectedDateKey
            const isToday = cell.key === todayDateKey
            const hasSessions = markedDateKeys.has(cell.key)

            return (
              <TouchableOpacity
                key={cell.key}
                style={styles.dayCell}
                disabled={isPast}
                activeOpacity={0.7}
                onPress={() => onSelectDate(cell.key)}
                accessibilityLabel={`${cell.key}${hasSessions ? ', sessions available' : ''}`}
                accessibilityState={{ selected: isSelected, disabled: isPast }}
              >
                <View style={[styles.dayCircle, isSelected && styles.dayCircleSelected, !isSelected && isToday && styles.dayCircleToday]}>
                  <Text
                    style={[
                      styles.dayText,
                      isPast && styles.dayTextPast,
                      isSelected && styles.dayTextSelected,
                    ]}
                  >
                    {cell.day}
                  </Text>
                </View>
                <View style={[styles.dot, hasSessions && styles.dotActive]} />
              </TouchableOpacity>
            )
          })}
        </View>
      ))}
    </View>
  )
}

export default PersonalTrainingCalendar

const styles = StyleSheet.create({
  container: {
    backgroundColor: AppColors.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: AppColors.grey,
    padding: 14,
    marginTop: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  navButton: {
    padding: 4,
  },
  monthLabel: {
    fontSize: 18,
    color: AppColors.blue,
    fontFamily: 'Montserrat',
  },
  weekRow: {
    flexDirection: 'row',
  },
  weekdayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    color: AppColors.grey3,
    paddingBottom: 6,
    fontFamily: 'Montserrat',
  },
  dayCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 3,
  },
  dayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircleSelected: {
    backgroundColor: AppColors.blue,
  },
  dayCircleToday: {
    borderWidth: 1,
    borderColor: AppColors.blue,
  },
  dayText: {
    fontSize: 14,
    color: AppColors.primary,
    fontFamily: 'Montserrat',
  },
  dayTextPast: {
    color: AppColors.grey2,
  },
  dayTextSelected: {
    color: AppColors.white,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginTop: 2,
    backgroundColor: 'transparent',
  },
  dotActive: {
    backgroundColor: AppColors.blue,
  },
})
