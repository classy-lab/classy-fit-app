// @ts-nocheck
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
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

const PersonalTrainingBookingSuccessScreen = ({ navigation, route }) => {
  const session = route?.params?.session ?? {}
  const isPaid = !!route?.params?.isPaid
  const booking = route?.params?.booking
  const trainer = String(session?.trainer_display_name ?? booking?.trainer_display_name ?? '').trim()
  const location = String(session?.location ?? booking?.location ?? '').trim()
  const price = Number(booking?.price ?? session?.price ?? 0)
  const isFree = price <= 0
  const currency = String(booking?.currency_code ?? session?.currency_code ?? '').trim().toUpperCase()

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.navs}>
        <TouchableOpacity onPress={() => navigation.navigate('PersonalTrainingSessionsScreen')} style={styles.backBtn}>
          <Feather name="arrow-left" color={AppColors.blue} size={36} />
        </TouchableOpacity>
        <Text style={styles.title}>Success</Text>
        <View style={styles.spacer} />
      </View>

      <View style={styles.body}>
        <View style={styles.card}>
          <View style={styles.iconCircle}>
            <Feather name="check" color={AppColors.white} size={28} />
          </View>
          <Text style={styles.heading}>
            {isPaid ? 'Payment complete' : 'Session booked'}
          </Text>
          <Text style={styles.message}>
            {isPaid
              ? 'Your payment was submitted successfully. Your booking will finalize shortly.'
              : 'Your personal training session has been booked successfully.'}
          </Text>

          <Text style={styles.sessionName}>Personal Training Session</Text>
          {trainer ? <Text style={styles.detail}>Trainer: {trainer}</Text> : null}
          <Text style={styles.detail}>Date: {formatDate(session?.start_at)}</Text>
          <Text style={styles.detail}>Time: {formatTime(session?.start_at)} - {formatTime(session?.end_at)}</Text>
          {location ? <Text style={styles.detail}>Location: {location}</Text> : null}
          <Text style={styles.detail}>{isFree ? 'Free' : `${Number(price).toFixed(2)} ${currency}`}</Text>
          {booking?.booking_uid ? <Text style={styles.detail}>Booking UID: {booking.booking_uid}</Text> : null}

          <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.navigate('PersonalTrainingSessionsScreen')}>
            <Text style={styles.primaryBtnText}>Back to Sessions</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  )
}

export default PersonalTrainingBookingSuccessScreen

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.grey,
  },
  navs: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: AppColors.white,
    borderBottomColor: AppColors.grey,
    borderBottomWidth: 1,
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
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  card: {
    backgroundColor: AppColors.white,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: AppColors.grey,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: AppColors.blue,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  heading: {
    color: AppColors.blue,
    fontFamily: 'Montserrat',
    fontSize: 26,
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    color: AppColors.grey3,
    fontFamily: 'Montserrat',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 18,
  },
  sessionName: {
    color: AppColors.blue,
    fontFamily: 'Montserrat',
    fontSize: 22,
    marginBottom: 10,
    textAlign: 'center',
  },
  detail: {
    color: AppColors.primary,
    fontFamily: 'Montserrat',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    backgroundColor: AppColors.grey,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    width: '100%',
  },
  primaryBtn: {
    marginTop: 20,
    backgroundColor: AppColors.blue,
    borderRadius: 999,
    minHeight: 50,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
  },
  primaryBtnText: {
    color: AppColors.white,
    fontFamily: 'Montserrat',
    fontSize: 16,
  },
})
