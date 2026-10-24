import { useCallback, useContext, useState } from 'react'
import {
  Alert,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useFocusEffect } from '@react-navigation/native'
import { Feather } from '@expo/vector-icons'
import { showMessage } from 'react-native-flash-message'
import { AppColors } from '../../styles/colors'
import { formatUsd } from '../../utils/currency'
import { UserContext } from '../../context/UserContext'
import { canManagePersonalTraining, isOwnerRole } from '../../utils/roleAccess'

const normalizeToken = (value) => String(value ?? '').trim()

const tokenRefreshMessagePattern = /\b(?:token\s+has\s+expired|expired\s+(?:access\s+)?token|invalid\s+(?:access\s+)?token|token\s+is\s+invalid|jwt\s+expired|access\s+token\s+expired|authentication\s+token\s+expired)\b/i

const extractResponseText = async (response: Response): Promise<string> => {
  try {
    return await response.clone().text()
  } catch {
    return ''
  }
}

const extractMessageCandidates = (responseText: string): string[] => {
  const trimmed = String(responseText ?? '').trim()
  if (!trimmed) return []

  try {
    const parsed = JSON.parse(trimmed) as unknown
    if (typeof parsed === 'string') return [parsed]
    if (parsed && typeof parsed === 'object') {
      const payload = parsed as Record<string, unknown>
      const candidates: string[] = []
      if (typeof payload.message === 'string') candidates.push(payload.message)
      if (typeof payload.error === 'string') candidates.push(payload.error)
      if (Array.isArray(payload.errors)) {
        for (const error of payload.errors) {
          if (typeof error === 'string') candidates.push(error)
        }
      }
      if (candidates.length > 0) return candidates
    }
  } catch {
    // Fall through to the raw text below.
  }

  return [trimmed]
}

const shouldRefreshAuthResponse = async (response: Response): Promise<boolean> => {
  if (!response || response.ok) return false
  if (response.status === 401) return true
  if (response.status !== 400 && response.status !== 403) return false
  const responseText = await extractResponseText(response)
  const candidates = extractMessageCandidates(responseText)
  return candidates.some((candidate) => tokenRefreshMessagePattern.test(candidate))
}

const refreshAccessTokenWithRefresh = async ({
  refreshToken,
  webServer,
  setTokens,
}) => {
  const effectiveRefreshToken = normalizeToken(refreshToken)
  if (!effectiveRefreshToken) {
    return null
  }

  const refreshResponse = await fetch(`${webServer}/api/v1/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      token: effectiveRefreshToken,
    }),
  })

  if (!refreshResponse.ok) {
    return null
  }

  const refreshObj = await refreshResponse.json()
  if (!refreshObj?.access_token || !refreshObj?.refresh_token) {
    return null
  }

  const nextTokens = {
    access_token: refreshObj.access_token,
    refresh_token: refreshObj.refresh_token,
  }

  setTokens((prev) => ({
    ...(prev ?? {}),
    access_token: nextTokens.access_token,
    refresh_token: nextTokens.refresh_token,
  }))

  return nextTokens.access_token
}

const performAuthenticatedRequestWithRefresh = async ({
  endpoint,
  init = {} as RequestInit,
  accessToken,
  refreshToken,
  webServer,
  setTokens,
}) => {
  const requestAccessToken = normalizeToken(accessToken)
  if (!requestAccessToken) {
    return null
  }

  const requestWithToken = async (token) => {
    const headers = new Headers(init.headers ?? undefined)
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json')
    }
    headers.set('Authorization', `Bearer ${token}`)

    return fetch(endpoint, {
      ...init,
      headers,
    })
  }

  const response = await requestWithToken(requestAccessToken)
  if (response.ok) {
    return response
  }

  if (!(await shouldRefreshAuthResponse(response))) {
    return response
  }

  const refreshedAccessToken = await refreshAccessTokenWithRefresh({
    refreshToken,
    webServer,
    setTokens,
  })

  if (!refreshedAccessToken) {
    return response
  }

  return requestWithToken(refreshedAccessToken)
}

type RefreshTokens = {
  access_token?: string
  refresh_token?: string
}

type AvailabilityRule = {
  uid: number
  gym_id?: number
  trainer_gym_user_id?: number
  trainer_display_name?: string | null
  day_of_week: number
  start_time_local: string
  end_time_local: string
  effective_start_date: string
  effective_end_date?: string | null
  trainer_hourly_price?: number | null
  trainer_hourly_currency_code?: string | null
  status: string
}

type UserContextValue = {
  user?: {
    role?: string | null
  } | null
  tokens?: RefreshTokens | null
  setTokens: (value: RefreshTokens | null | ((prev: RefreshTokens | null) => RefreshTokens | null)) => void
  webServer: string
}

type MyPersonalTrainingAvailabilityNavigation = {
  goBack: () => void
  navigate: {
    (screen: 'AddEditPersonalTrainingAvailabilityScreen', params?: { availability?: AvailabilityRule; gymTimezone?: string | null }): void
    (screen: 'StaffTab', params: { screen: 'StaffScreen' }): void
  }
}

type LoadOptions = {
  isRefresh?: boolean
}

// ISO weekdays, matching the API: 1 = Monday ... 7 = Sunday.
const WEEKDAYS = [
  { day: 1, label: 'Monday' },
  { day: 2, label: 'Tuesday' },
  { day: 3, label: 'Wednesday' },
  { day: 4, label: 'Thursday' },
  { day: 5, label: 'Friday' },
  { day: 6, label: 'Saturday' },
  { day: 7, label: 'Sunday' },
]

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// Availability times and dates are gym-local wall-clock values, so they are formatted from the
// strings themselves and never go through Date (which would apply the device timezone).
const formatLocalTime = (value?: string | null) => {
  const match = /^(\d{2}):(\d{2})/.exec(String(value ?? ''))
  if (!match) {
    return 'Unknown time'
  }

  const hours = Number(match[1])
  return `${hours % 12 || 12}:${match[2]} ${hours >= 12 ? 'PM' : 'AM'}`
}

const formatLocalDate = (value?: string | null) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value ?? ''))
  if (!match) {
    return 'Unknown date'
  }

  return `${MONTHS[Number(match[2]) - 1]} ${Number(match[3])}, ${match[1]}`
}

const MyPersonalTrainingAvailabilityScreen = ({ navigation }: { navigation: MyPersonalTrainingAvailabilityNavigation }) => {
  const { user, tokens, setTokens, webServer } = useContext(UserContext) as UserContextValue
  const [rules, setRules] = useState<AvailabilityRule[]>([])
  const [gymTimezone, setGymTimezone] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [deletingRuleUid, setDeletingRuleUid] = useState<number | null>(null)

  const canManage = canManagePersonalTraining(user?.role)
  const isOwner = isOwnerRole(user?.role)

  const performAuthenticatedRequest = async (endpoint: string, init = {} as RequestInit) => {
    return performAuthenticatedRequestWithRefresh({
      endpoint,
      init,
      accessToken: tokens?.access_token ?? null,
      refreshToken: tokens?.refresh_token ?? null,
      webServer,
      setTokens,
    })
  }

  const loadRules = useCallback(
    async ({ isRefresh = false }: LoadOptions = {}) => {
      if (!canManage) {
        setLoading(false)
        setRefreshing(false)
        return
      }

      if (!tokens?.access_token) {
        setErrorMessage('Please sign in again to view your availability.')
        setRules([])
        setLoading(false)
        setRefreshing(false)
        return
      }

      if (isRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }

      setErrorMessage('')

      try {
        const response = await performAuthenticatedRequest(`${webServer}/api/v1/personal-training/availability`)
        if (!response) {
          setErrorMessage('Please sign in again to view your availability.')
          setRules([])
          return
        }

        const responseText = await response.text()
        let responseBody: { message?: string; data?: AvailabilityRule[]; gym_timezone?: string | null } = {}
        if (responseText) {
          try {
            responseBody = JSON.parse(responseText)
          } catch {
            responseBody = { message: responseText }
          }
        }

        if (response.status !== 200) {
          const message = responseBody?.message || 'Unable to load availability.'
          setErrorMessage(message)
          setRules([])
          showMessage({
            message: 'Availability unavailable',
            description: message,
            type: 'danger',
          })
          return
        }

        setRules(Array.isArray(responseBody?.data) ? responseBody.data : [])
        setGymTimezone(responseBody?.gym_timezone ?? null)
      } catch {
        const message = 'Failed to load availability.'
        setErrorMessage(message)
        setRules([])
        showMessage({
          message: 'Availability unavailable',
          description: message,
          type: 'danger',
        })
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [canManage, tokens?.access_token, webServer, setTokens]
  )

  useFocusEffect(
    useCallback(() => {
      void loadRules()
    }, [loadRules])
  )

  const onRefresh = () => {
    void loadRules({ isRefresh: true })
  }

  const deleteRule = useCallback(
    async (ruleUid: number) => {
      if (!ruleUid || deletingRuleUid !== null) {
        return
      }

      setDeletingRuleUid(ruleUid)

      try {
        const response = await performAuthenticatedRequest(
          `${webServer}/api/v1/personal-training/availability/${ruleUid}`,
          {
            method: 'DELETE',
          }
        )

        if (!response) {
          showMessage({
            message: 'Authentication required',
            description: 'Please sign in again to delete availability.',
            type: 'danger',
          })
          return
        }

        const responseText = await response.text()
        let responseBody: { message?: string } = {}
        if (responseText) {
          try {
            responseBody = JSON.parse(responseText)
          } catch {
            responseBody = { message: responseText }
          }
        }

        if (response.status === 200) {
          showMessage({
            message: 'Availability deleted',
            description: responseBody?.message || 'The availability was deleted successfully.',
            type: 'success',
          })
          await loadRules()
          return
        }

        const message = responseBody?.message || 'Unable to delete availability.'

        if (response.status === 404) {
          // Already gone (for example deleted on another device); refresh to match the server.
          showMessage({
            message: 'Availability not found',
            description: message,
            type: 'danger',
          })
          await loadRules()
          return
        }

        if (response.status === 401) {
          showMessage({
            message: 'Authentication required',
            description: 'Please sign in again to delete availability.',
            type: 'danger',
          })
          return
        }

        if (response.status === 403) {
          showMessage({
            message: 'Permission denied',
            description: message,
            type: 'danger',
          })
          return
        }

        showMessage({
          message: 'Delete failed',
          description: message,
          type: 'danger',
        })
      } catch {
        showMessage({
          message: 'Delete failed',
          description: 'Unable to delete availability.',
          type: 'danger',
        })
      } finally {
        setDeletingRuleUid((current) => (current === ruleUid ? null : current))
      }
    },
    [deletingRuleUid, loadRules, performAuthenticatedRequest, webServer]
  )

  const confirmDeleteRule = (rule: AvailabilityRule, dayLabel: string) => {
    if (!rule.uid || deletingRuleUid !== null) {
      return
    }

    Alert.alert(
      'Delete availability?',
      `This will permanently delete ${dayLabel} ${formatLocalTime(rule.start_time_local)} - ${formatLocalTime(rule.end_time_local)}. This cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void deleteRule(rule.uid)
          },
        },
      ],
      { cancelable: true }
    )
  }

  const groupedRules = WEEKDAYS.map(({ day, label }) => ({
    day,
    label,
    rules: rules
      .filter((rule) => Number(rule.day_of_week) === day)
      .sort(
        (a, b) =>
          String(a.start_time_local).localeCompare(String(b.start_time_local)) ||
          Number(a.trainer_gym_user_id ?? 0) - Number(b.trainer_gym_user_id ?? 0)
      ),
  })).filter((group) => group.rules.length > 0)

  // The effective rate comes from the API (the same one used when sessions are generated), one entry per trainer.
  const trainerRates = Object.values(
    rules.reduce<Record<string, { trainerGymUserId: number; name: string; price: number | null }>>((groups, rule) => {
      const trainerGymUserId = Number(rule.trainer_gym_user_id ?? 0)
      const key = String(trainerGymUserId)
      const price = rule.trainer_hourly_price === null || rule.trainer_hourly_price === undefined
        ? null
        : Number(rule.trainer_hourly_price)
      groups[key] = {
        trainerGymUserId,
        name: String(rule.trainer_display_name ?? '').trim() || `Trainer ${trainerGymUserId}`,
        price: groups[key]?.price ?? price,
      }
      return groups
    }, {})
  ).sort((a, b) => a.name.localeCompare(b.name))

  if (!canManage) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.navs}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Feather name="arrow-left" color={AppColors.blue} size={36} />
          </TouchableOpacity>
          <Text style={styles.title}>Trainer Availability</Text>
          <View style={styles.spacer} />
        </View>

        <View style={styles.centerState}>
          <Text style={styles.emptyTitle}>Staff access required</Text>
          <Text style={styles.stateText}>This screen is only available to gym owners and trainers.</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.navs}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="arrow-left" color={AppColors.blue} size={36} />
        </TouchableOpacity>
        <Text style={styles.title}>Trainer Availability</Text>
        <View style={styles.spacer} />
      </View>

      <View style={styles.actionsBar}>
        <TouchableOpacity
          style={styles.addButton}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('AddEditPersonalTrainingAvailabilityScreen', { gymTimezone })}
        >
          <Feather name="plus" color={AppColors.white} size={18} />
          <Text style={styles.addButtonText}>Add Availability</Text>
        </TouchableOpacity>
        <Text style={styles.timezoneNote}>
          {gymTimezone ? `Times are in your gym's local time (${gymTimezone}).` : "Times are in your gym's local time."}
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={AppColors.blue} />}
      >
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>How availability works</Text>
          <Text style={styles.infoText}>
            {isOwner
              ? 'Availability is a weekly schedule of when each trainer is free, for example Saturdays 9:00 AM to 12:00 PM. '
              : 'Availability is a weekly schedule of when you are free, for example Saturdays 9:00 AM to 12:00 PM. '}
            It does not create sessions by itself.
          </Text>
          <Text style={styles.infoText}>
            To make it bookable, go back to Personal Training and press Generate Upcoming Sessions. That creates
            one-hour sessions for today and the next 27 days (28 calendar days in total). Press it again later to add
            dates further ahead.
          </Text>
          <Text style={styles.infoText}>
            {isOwner
              ? "Each session is priced at the trainer's standard hourly rate. A trainer with no rate set is skipped when sessions are generated."
              : 'Each session is priced at your standard hourly rate. If no rate is set, your availability is skipped when sessions are generated.'}
          </Text>
          <View style={styles.rateBox}>
            <Text style={styles.rateBoxTitle}>{isOwner ? 'Trainer hourly rates' : 'Your hourly rate'}</Text>
            {trainerRates.length === 0 ? (
              <Text style={styles.rateBoxText}>
                {isOwner
                  ? 'Rates appear here once a trainer has availability.'
                  : 'Your rate appears here once you have availability. You can also see it on your Staff profile.'}
              </Text>
            ) : (
              trainerRates.map((trainer) => (
                <Text key={trainer.trainerGymUserId} style={styles.rateBoxText}>
                  {isOwner ? `${trainer.name}: ` : ''}
                  {trainer.price === null ? 'No rate set' : `${formatUsd(trainer.price)} per hour`}
                </Text>
              ))
            )}
            {isOwner ? (
              <>
                <Text style={styles.rateBoxHint}>
                  Only owners can change a trainer's rate. To change one, open Staff, tap the trainer, and edit
                  "Personal Training Hourly Rate" at the bottom of their profile.
                </Text>
                <TouchableOpacity
                  style={styles.rateLink}
                  activeOpacity={0.85}
                  onPress={() => navigation.navigate('StaffTab', { screen: 'StaffScreen' })}
                >
                  <Feather name="users" color={AppColors.blue} size={16} />
                  <Text style={styles.rateLinkText}>Open Staff</Text>
                </TouchableOpacity>
              </>
            ) : (
              <Text style={styles.rateBoxHint}>Only your gym owner can change this rate.</Text>
            )}
          </View>
          <Text style={styles.infoText}>
            Changing or deleting availability does not change sessions that already exist. To remove those, cancel them on
            the Personal Training screen.
          </Text>
        </View>

        {loading ? (
          <View style={styles.centerState}>
            <ActivityIndicator size="large" color={AppColors.blue} />
            <Text style={styles.stateText}>Loading availability...</Text>
          </View>
        ) : errorMessage ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorTitle}>Unable to load availability</Text>
            <Text style={styles.errorText}>{errorMessage}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => loadRules()}>
              <Text style={styles.retryBtnText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : groupedRules.length === 0 ? (
          <View style={styles.centerState}>
            <Text style={styles.emptyTitle}>No availability yet</Text>
            <Text style={styles.stateText}>Use Add Availability to set the weekly hours you are available.</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {groupedRules.map((group) => (
              <View key={group.day} style={styles.dayGroup}>
                <Text style={styles.sectionTitle}>{group.label}</Text>
                {group.rules.map((rule) => {
                  const isActive = String(rule.status).trim().toLowerCase() === 'active'
                  const deleting = deletingRuleUid === rule.uid
                  const trainerName = String(rule.trainer_display_name ?? '').trim()

                  return (
                    <View key={rule.uid} style={[styles.card, !isActive && styles.cardInactive]}>
                      <View style={styles.cardHeader}>
                        <View style={styles.cardHeaderText}>
                          <Text style={styles.cardTitle}>
                            {formatLocalTime(rule.start_time_local)} - {formatLocalTime(rule.end_time_local)}
                          </Text>
                        </View>
                        <View style={[styles.statusPill, isActive ? styles.statusActive : styles.statusInactive]}>
                          <Text style={styles.statusText}>{isActive ? 'Active' : 'Inactive'}</Text>
                        </View>
                      </View>

                      <View style={styles.metaGrid}>
                        {isOwner ? (
                          <View style={styles.metaItem}>
                            <Text style={styles.metaLabel}>Trainer</Text>
                            <Text style={styles.metaValue}>{trainerName || 'Unknown trainer'}</Text>
                          </View>
                        ) : null}
                        <View style={styles.metaItem}>
                          <Text style={styles.metaLabel}>Hourly rate</Text>
                          <Text style={styles.metaValue}>
                            {rule.trainer_hourly_price != null
                              ? `${formatUsd(rule.trainer_hourly_price)} per hour`
                              : 'No standard hourly rate set.'}
                          </Text>
                        </View>
                        <View style={styles.metaItem}>
                          <Text style={styles.metaLabel}>From</Text>
                          <Text style={styles.metaValue}>{formatLocalDate(rule.effective_start_date)}</Text>
                        </View>
                        <View style={styles.metaItem}>
                          <Text style={styles.metaLabel}>Until</Text>
                          <Text style={styles.metaValue}>
                            {rule.effective_end_date ? formatLocalDate(rule.effective_end_date) : 'No end date'}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.cardActions}>
                        <TouchableOpacity
                          style={styles.editButton}
                          activeOpacity={0.85}
                          onPress={() =>
                            navigation.navigate('AddEditPersonalTrainingAvailabilityScreen', {
                              availability: rule,
                              gymTimezone,
                            })
                          }
                          disabled={deleting}
                        >
                          <Feather name="edit-2" color={AppColors.blue} size={16} />
                          <Text style={styles.editButtonText}>Edit</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.deleteButton, deleting ? styles.deleteButtonDisabled : null]}
                          activeOpacity={0.85}
                          onPress={() => confirmDeleteRule(rule, group.label)}
                          disabled={deleting || deletingRuleUid !== null}
                        >
                          <Feather name="trash-2" color={AppColors.white} size={16} />
                          <Text style={styles.deleteButtonText}>{deleting ? 'Deleting...' : 'Delete'}</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )
                })}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

export default MyPersonalTrainingAvailabilityScreen

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
  actionsBar: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 6,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: AppColors.blue,
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 14,
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
    opacity: 0.92,
  },
  addButtonText: {
    color: AppColors.white,
    fontSize: 16,
    fontFamily: 'Montserrat',
  },
  timezoneNote: {
    marginTop: 10,
    marginHorizontal: 4,
    color: AppColors.grey3,
    fontSize: 12,
    fontFamily: 'Montserrat',
  },
  cardActions: {
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: 10,
    flexWrap: 'wrap',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderColor: AppColors.blue,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: AppColors.white,
  },
  editButtonText: {
    color: AppColors.blue,
    fontSize: 14,
    fontFamily: 'Montserrat',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderColor: AppColors.red,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: AppColors.red,
  },
  deleteButtonDisabled: {
    opacity: 0.75,
  },
  deleteButtonText: {
    color: AppColors.white,
    fontSize: 14,
    fontFamily: 'Montserrat',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 28,
  },
  centerState: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  stateText: {
    marginTop: 12,
    fontSize: 16,
    color: AppColors.grey3,
    textAlign: 'center',
    fontFamily: 'Montserrat',
  },
  emptyTitle: {
    fontSize: 20,
    color: AppColors.blue,
    textAlign: 'center',
    fontFamily: 'Montserrat',
  },
  errorCard: {
    backgroundColor: AppColors.white,
    borderColor: AppColors.grey,
    borderWidth: 1,
    borderRadius: 18,
    padding: 20,
    marginVertical: 20,
  },
  errorTitle: {
    fontSize: 16,
    color: AppColors.blue,
    marginBottom: 8,
    fontFamily: 'Montserrat',
  },
  errorText: {
    fontSize: 14,
    color: AppColors.grey3,
    marginBottom: 12,
    fontFamily: 'Montserrat',
  },
  retryBtn: {
    backgroundColor: AppColors.blue,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  retryBtnText: {
    color: AppColors.white,
    fontSize: 14,
    fontFamily: 'Montserrat',
  },
  list: {
    gap: 14,
  },
  dayGroup: {
    gap: 14,
  },
  sectionTitle: {
    fontSize: 20,
    color: AppColors.blue,
    fontFamily: 'Montserrat',
  },
  infoCard: {
    backgroundColor: AppColors.white,
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    borderColor: AppColors.blue,
    borderWidth: 1,
  },
  infoTitle: {
    fontSize: 16,
    color: AppColors.blue,
    marginBottom: 8,
    fontFamily: 'Montserrat',
  },
  infoText: {
    fontSize: 13,
    lineHeight: 19,
    color: AppColors.primary,
    marginBottom: 8,
    fontFamily: 'Montserrat',
  },
  rateBox: {
    backgroundColor: AppColors.grey,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  rateBoxTitle: {
    fontSize: 13,
    color: AppColors.blue,
    marginBottom: 6,
    fontFamily: 'Montserrat',
  },
  rateBoxText: {
    fontSize: 13,
    lineHeight: 19,
    color: AppColors.primary,
    fontFamily: 'Montserrat',
  },
  rateBoxHint: {
    fontSize: 12,
    lineHeight: 18,
    color: AppColors.grey3,
    marginTop: 8,
    fontFamily: 'Montserrat',
  },
  rateLink: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 8,
    marginTop: 10,
    borderWidth: 1,
    borderColor: AppColors.blue,
    borderRadius: 999,
    backgroundColor: AppColors.white,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  rateLinkText: {
    fontSize: 13,
    color: AppColors.blue,
    fontFamily: 'Montserrat',
  },
  card: {
    backgroundColor: AppColors.white,
    borderRadius: 18,
    padding: 18,
    borderColor: AppColors.grey,
    borderWidth: 1,
  },
  cardInactive: {
    opacity: 0.7,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 12,
  },
  cardHeaderText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    color: AppColors.blue,
    fontFamily: 'Montserrat',
  },
  statusPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  statusActive: {
    backgroundColor: AppColors.blue,
  },
  statusInactive: {
    backgroundColor: AppColors.grey3,
  },
  statusText: {
    color: AppColors.white,
    fontSize: 12,
    fontFamily: 'Montserrat',
  },
  metaGrid: {
    marginTop: 8,
  },
  metaItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    gap: 12,
  },
  metaLabel: {
    fontSize: 12,
    color: AppColors.grey3,
    textTransform: 'uppercase',
    fontFamily: 'Montserrat',
  },
  metaValue: {
    fontSize: 12,
    color: AppColors.blue,
    textAlign: 'right',
    flexShrink: 1,
    fontFamily: 'Montserrat',
  },
})