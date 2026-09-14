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

const ClassBookingSuccessScreen = ({ navigation, route }) => {
  const session = route?.params?.session ?? {}
  const isPaid = !!route?.params?.isPaid
  const booking = route?.params?.booking

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.navs}>
        <TouchableOpacity onPress={() => navigation.navigate('ClassesScreen')} style={styles.backBtn}>
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
            {isPaid ? 'Payment complete' : 'Class booked'}
          </Text>
          <Text style={styles.message}>
            {isPaid
              ? 'Your payment was submitted successfully. Your booking will finalize shortly.'
              : 'Your class has been booked successfully.'}
          </Text>

          <Text style={styles.className}>{session?.class_name || 'Class session'}</Text>
          <Text style={styles.detail}>Date: {formatDate(session?.start_at)}</Text>
          <Text style={styles.detail}>Time: {formatTime(session?.start_at)} - {formatTime(session?.end_at)}</Text>
          {booking?.uid ? <Text style={styles.detail}>Booking UID: {booking.uid}</Text> : null}

          <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.navigate('ClassesScreen')}>
            <Text style={styles.primaryBtnText}>Back to Classes</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  )
}

export default ClassBookingSuccessScreen

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
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  card: {
    backgroundColor: AppColors.grey,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
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
    fontSize: 24,
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    color: AppColors.primary,
    fontFamily: 'Montserrat',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 18,
  },
  className: {
    color: AppColors.blue,
    fontFamily: 'Montserrat',
    fontSize: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  detail: {
    color: AppColors.primary,
    fontFamily: 'Montserrat',
    fontSize: 14,
    marginTop: 6,
    textAlign: 'center',
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
