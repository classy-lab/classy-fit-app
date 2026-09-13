// @ts-nocheck
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Feather } from '@expo/vector-icons'
import { AppColors } from '../../styles/colors'

const parseDate = (value) => {
  if (!value) return null
  const normalized = String(value).includes('T') ? String(value) : String(value).replace(' ', 'T')
  const date = new Date(normalized)
  return Number.isNaN(date.getTime()) ? null : date
}

const formatDate = (value) => {
  const date = parseDate(value)
  if (!date) return 'Unknown date'
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

const formatTime = (value) => {
  const date = parseDate(value)
  if (!date) return 'Unknown time'
  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

const ClassSessionScreen = ({ navigation, route }) => {
  const session = route?.params?.session
  const price = Number(session?.price ?? 0)
  const capacity = Number(session?.capacity ?? 0)
  const bookedCount = Number(session?.booked_count ?? 0)
  const availableCapacity =
    session?.available_capacity !== null && session?.available_capacity !== undefined
      ? Number(session.available_capacity)
      : Math.max(capacity - bookedCount, 0)

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.navs}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="arrow-left" color={AppColors.blue} size={36} />
        </TouchableOpacity>
        <Text style={styles.title}>Class Session</Text>
        <View style={styles.spacer} />
      </View>

      <View style={styles.body}>
        <View style={styles.card}>
          <Text style={styles.className}>{session?.class_name || 'Class session'}</Text>
          <Text style={styles.summary}>
            {price <= 0 ? 'Free' : `${price.toFixed(2)} ${String(session?.currency_code ?? '').toUpperCase()}`}
          </Text>
          <Text style={styles.detail}>Date: {formatDate(session?.start_at)}</Text>
          <Text style={styles.detail}>Time: {formatTime(session?.start_at)} - {formatTime(session?.end_at)}</Text>
          <Text style={styles.detail}>Trainer: {session?.trainer_display_name || 'TBA'}</Text>
          <Text style={styles.detail}>Capacity: {availableCapacity}/{capacity || 0} available</Text>
          {session?.class_description ? <Text style={styles.description}>{session.class_description}</Text> : null}
        </View>
      </View>
    </SafeAreaView>
  )
}

export default ClassSessionScreen

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.white,
  },
  navs: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  backBtn: {
    paddingRight: 8,
  },
  spacer: {
    width: 36,
  },
  title: {
    color: AppColors.blue,
    fontFamily: 'Montserrat',
    fontSize: 28,
  },
  body: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  card: {
    backgroundColor: AppColors.grey,
    borderRadius: 20,
    padding: 18,
  },
  className: {
    color: AppColors.blue,
    fontFamily: 'Montserrat',
    fontSize: 24,
    marginBottom: 8,
  },
  summary: {
    color: AppColors.primary,
    fontFamily: 'Montserrat',
    fontSize: 16,
    marginBottom: 12,
  },
  detail: {
    color: AppColors.primary,
    fontFamily: 'Montserrat',
    fontSize: 14,
    marginTop: 6,
  },
  description: {
    color: AppColors.primary,
    fontFamily: 'Montserrat',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 14,
  },
})
