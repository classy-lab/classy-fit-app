import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Feather } from '@expo/vector-icons'
import { AppColors } from '../../styles/colors'
import { formatUsdOrFree } from '../../utils/currency'

type MembershipPurchaseSuccessMembership = {
  uid?: number | string
  plan_name?: string | null
  membership_plan_name?: string | null
  name?: string | null
  duration_months?: number | string | null
  price?: number | string | null
  currency_code?: string | null
  start_at?: string | null
  end_at?: string | null
  status?: string | null
}

type MembershipPurchaseSuccessNavigation = {
  navigate: (screen: 'MembershipPlansScreen') => void
}

type MembershipPurchaseSuccessRoute = {
  params?: {
    membership?: MembershipPurchaseSuccessMembership | null
    isPaid?: boolean
    idempotencyKey?: string
  } | null
}

const parseDate = (value?: string | null) => {
  if (!value) {
    return null
  }

  const normalized = String(value).includes('T') ? String(value) : String(value).replace(' ', 'T')
  const date = new Date(normalized)
  return Number.isNaN(date.getTime()) ? null : date
}

const formatDate = (value?: string | null) => {
  const date = parseDate(value)
  if (!date) {
    return 'Unknown date'
  }

  return new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

const formatDurationLabel = (durationMonths?: number | string | null) => {
  const months = Number(durationMonths ?? 0)
  if (!Number.isFinite(months) || months <= 0) {
    return 'Unknown duration'
  }

  return months === 1 ? '1 month' : `${months} months`
}

const formatPrice = (price?: number | string | null) => formatUsdOrFree(price)

const MembershipPurchaseSuccessScreen = ({
  navigation,
  route,
}: {
  navigation: MembershipPurchaseSuccessNavigation
  route: MembershipPurchaseSuccessRoute
}) => {
  const membership = route?.params?.membership
  const isPaid = !!route?.params?.isPaid
  const membershipName = String(
    membership?.plan_name ?? membership?.membership_plan_name ?? membership?.name ?? 'Membership'
  ).trim()
  const durationLabel = formatDurationLabel(membership?.duration_months)
  const priceLabel = formatPrice(membership?.price)
  const startDate = formatDate(membership?.start_at)
  const endDate = formatDate(membership?.end_at)
  const note = isPaid
    ? 'Your payment was submitted successfully. Membership activation will be confirmed by Stripe processing and webhook reconciliation.'
    : 'Your membership request was submitted successfully. Activation will be confirmed by the payment processing flow.'

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.navs}>
        <TouchableOpacity onPress={() => navigation.navigate('MembershipPlansScreen')} style={styles.backBtn}>
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
          <Text style={styles.heading}>{isPaid ? 'Payment submitted' : 'Membership submitted'}</Text>
          <Text style={styles.message}>{note}</Text>

          <Text style={styles.membershipName}>{membershipName}</Text>
          <Text style={styles.detail}>Duration: {durationLabel}</Text>
          <Text style={styles.detail}>Price: {priceLabel}</Text>
          <Text style={styles.detail}>Start date: {startDate}</Text>
          <Text style={styles.detail}>End date: {endDate}</Text>

          <View style={styles.noteCard}>
            <Text style={styles.noteLabel}>Activation note</Text>
            <Text style={styles.noteText}>
              Membership activation is confirmed by the backend payment processing flow. Please allow a moment for the
              webhook to finalize the status.
            </Text>
          </View>

          <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.navigate('MembershipPlansScreen')}>
            <Text style={styles.primaryBtnText}>Back to Membership Plans</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  )
}

export default MembershipPurchaseSuccessScreen

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
  membershipName: {
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
  noteCard: {
    width: '100%',
    marginTop: 16,
    backgroundColor: AppColors.grey,
    borderRadius: 16,
    padding: 14,
  },
  noteLabel: {
    color: AppColors.grey3,
    fontFamily: 'Montserrat',
    fontSize: 12,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  noteText: {
    color: AppColors.primary,
    fontFamily: 'Montserrat',
    fontSize: 14,
    lineHeight: 20,
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
