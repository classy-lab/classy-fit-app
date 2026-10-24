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
import { formatUsdOrFree } from '../../utils/currency'
import { formatEasternDate, formatEasternTime, parseApiDateTime } from '../../utils/easternTime'
import { UserContext } from '../../context/UserContext'
import { getOwnerPersonalTrainingTitle } from '../../components/utils/personalTrainingDisplay'
import { canManagePersonalTraining } from '../../utils/roleAccess'

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

type SessionStatus = 'scheduled' | 'cancelled' | 'completed' | string

type ManagedPersonalTrainingSession = {
  uid?: number
  session_uid?: number
  gym_id?: number
  trainer_gym_user_id?: number | null
  trainer_display_name?: string | null
  location?: string | null
  additional_notes?: string | null
  start_at?: string | null
  end_at?: string | null
  price?: number | string | null
  currency_code?: string | null
  status?: SessionStatus
  booked_count?: number | null
  is_available?: boolean | null
  is_generated?: boolean | null
  created_at?: string | null
  updated_at?: string | null
}

type UserContextValue = {
  user?: {
    role?: string | null
  } | null
  tokens?: RefreshTokens | null
  setTokens: (value: RefreshTokens | null | ((prev: RefreshTokens | null) => RefreshTokens | null)) => void
  webServer: string
}

type PersonalTrainingManagementNavigation = {
  goBack: () => void
  navigate: (
    screen: 'AddPersonalTrainingSessionScreen' | 'EditPersonalTrainingSessionScreen' | 'MyPersonalTrainingAvailabilityScreen',
    params?: { sessionUid?: number }
  ) => void
}

type LoadOptions = {
  isRefresh?: boolean
}

type GenerationTotals = {
  rules_examined?: number
  sessions_generated?: number
  sessions_reactivated?: number
  already_generated?: number
  conflicts?: number
  missing_pricing?: number
  invalid_timezone?: number
  other_errors?: number
}

const pluralize = (count: number, singular: string, plural = `${singular}s`) =>
  `${count} ${count === 1 ? singular : plural}`

const buildGenerationSummary = (totals: GenerationTotals) => {
  const created = Number(totals.sessions_generated ?? 0)
  const reopened = Number(totals.sessions_reactivated ?? 0)
  const generated = created + reopened
  const alreadyGenerated = Number(totals.already_generated ?? 0)
  const conflicts = Number(totals.conflicts ?? 0)
  const missingPricing = Number(totals.missing_pricing ?? 0)
  const invalidTimezone = Number(totals.invalid_timezone ?? 0)
  const otherErrors = Number(totals.other_errors ?? 0)
  const hasProblems = missingPricing + invalidTimezone + otherErrors + conflicts > 0

  const lines: string[] = []
  if (Number(totals.rules_examined ?? 0) === 0) {
    lines.push('No active availability rules were found to generate sessions from.')
  } else if (generated > 0) {
    lines.push(`${pluralize(generated, 'session')} generated.`)
    if (reopened > 0) lines.push(`${reopened} of them reopened from previously cancelled sessions.`)
    if (alreadyGenerated > 0) lines.push(`${alreadyGenerated} already existed.`)
  } else if (!hasProblems) {
    lines.push('Upcoming sessions are already generated.')
  }
  if (conflicts > 0) {
    lines.push(`${pluralize(conflicts, 'slot')} skipped because ${conflicts === 1 ? 'it overlaps' : 'they overlap'} an existing session.`)
  }
  if (missingPricing > 0) {
    lines.push(`${pluralize(missingPricing, 'rule')} skipped because the trainer has no standard hourly rate set. Set it from the trainer's staff profile.`)
  }
  if (invalidTimezone > 0) {
    lines.push(`${pluralize(invalidTimezone, 'rule')} skipped because the gym time zone is missing or invalid.`)
  }
  if (otherErrors > 0) lines.push(`${pluralize(otherErrors, 'error')} occurred while generating.`)

  return { description: lines.join('\n'), hasProblems }
}

const formatDate = (value?: string | null) => {
  return formatEasternDate(value)
}

const formatTime = (value?: string | null) => {
  return formatEasternTime(value)
}

const renderStatusLabel = (status?: SessionStatus) => {
  const normalized = String(status ?? 'scheduled').trim().toLowerCase()
  if (!normalized) {
    return 'Unknown'
  }

  return normalized.charAt(0).toUpperCase() + normalized.slice(1)
}

const renderBookingState = (session: ManagedPersonalTrainingSession) => {
  if (session?.booked_count === undefined || session?.booked_count === null) {
    return null
  }

  if (Number(session.booked_count) > 0) {
    return 'Booked'
  }

  return session?.is_available ? 'Available' : 'Not available'
}

const PersonalTrainingManagementScreen = ({ navigation }: { navigation: PersonalTrainingManagementNavigation }) => {
  const { user, tokens, setTokens, webServer } = useContext(UserContext) as UserContextValue
  const [sessions, setSessions] = useState<ManagedPersonalTrainingSession[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [deletingSessionUid, setDeletingSessionUid] = useState<number | null>(null)
  const [cancellingSessionUid, setCancellingSessionUid] = useState<number | null>(null)
  const [generating, setGenerating] = useState(false)
  const [bulkCancellingTrainer, setBulkCancellingTrainer] = useState<number | null>(null)
  const [deletingCancelled, setDeletingCancelled] = useState(false)
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past' | 'cancelled'>('upcoming')

  const canManage = canManagePersonalTraining(user?.role)

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

  const loadSessions = useCallback(
    async ({ isRefresh = false }: LoadOptions = {}) => {
      if (!tokens?.access_token) {
        setErrorMessage('Please sign in again to view personal training sessions.')
        setSessions([])
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
          const response = await performAuthenticatedRequest(`${webServer}/api/v1/personal-training/management/sessions`)
          if (!response) {
            setErrorMessage('Please sign in again to view personal training sessions.')
            setSessions([])
          return
        }

        const responseText = await response.text()
        let responseBody: { message?: string; data?: ManagedPersonalTrainingSession[] } = {}
        if (responseText) {
          try {
            responseBody = JSON.parse(responseText)
          } catch {
            responseBody = { message: responseText }
          }
        }

        if (response.status !== 200) {
          const message = responseBody?.message || 'Unable to load personal training sessions.'
          setErrorMessage(message)
          setSessions([])
          showMessage({
            message: 'Personal training unavailable',
            description: message,
            type: 'danger',
          })
          return
        }

        setSessions(Array.isArray(responseBody?.data) ? responseBody.data : [])
      } catch {
        const message = 'Failed to load personal training sessions.'
        setErrorMessage(message)
        setSessions([])
        showMessage({
          message: 'Personal training unavailable',
          description: message,
          type: 'danger',
        })
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [tokens?.access_token, webServer, setTokens]
  )

  useFocusEffect(
    useCallback(() => {
      void loadSessions()
    }, [loadSessions])
  )

  const onRefresh = () => {
    void loadSessions({ isRefresh: true })
  }

  const generateUpcomingSessions = async () => {
    if (generating) {
      return
    }

    setGenerating(true)

    try {
      const generateSessions = async (accessToken: string) => {
        const headers = new Headers()
        headers.set('Authorization', `Bearer ${accessToken}`)

        return fetch(`${webServer}/api/v1/personal-training/management/sessions/generate`, {
          method: 'POST',
          headers,
        })
      }

      const parseResponseBody = async (response: Response) => {
        const responseText = await response.text()
        if (!responseText) {
          return {}
        }

        try {
          return JSON.parse(responseText)
        } catch {
          return { message: responseText }
        }
      }

      let response = await generateSessions(String(tokens?.access_token ?? '').trim())
      let responseBody: { message?: string; totals?: GenerationTotals } = await parseResponseBody(response)

      if (response.status !== 200) {
        console.log('Access token expired, requesting new one - generateUpcomingSessions()')

        const refreshResponse = await fetch(`${webServer}/api/v1/refresh`, {
          method: 'POST',
          body: JSON.stringify({
            token: tokens?.refresh_token,
          }),
        })

        const refreshObj = await refreshResponse.json()

        if (refreshResponse.status === 200) {
          console.log('Got new access token and refresh token')
          setTokens((prev: RefreshTokens | null) => ({
            ...(prev ?? {}),
            access_token: refreshObj.access_token,
            refresh_token: refreshObj.refresh_token,
          }))

          response = await generateSessions(String(refreshObj.access_token ?? '').trim())
          responseBody = await parseResponseBody(response)
        } else {
          showMessage({
            message: 'Authentication required',
            description: 'Please sign in again to generate personal training sessions.',
            type: 'danger',
          })
          return
        }
      }

      if (response.status === 200 && responseBody?.totals) {
        const summary = buildGenerationSummary(responseBody.totals)
        showMessage({
          message: summary.hasProblems ? 'Sessions generated with warnings' : 'Sessions up to date',
          description: summary.description,
          type: summary.hasProblems ? 'warning' : 'success',
          duration: 6000,
        })
        await loadSessions()
        return
      }

      const message = responseBody?.message || 'Unable to generate personal training sessions.'

      if (response.status === 403) {
        showMessage({
          message: 'Permission denied',
          description: message,
          type: 'danger',
        })
        return
      }

      showMessage({
        message: 'Generate failed',
        description: message,
        type: 'danger',
      })
    } catch {
      showMessage({
        message: 'Generate failed',
        description: 'Unable to generate personal training sessions.',
        type: 'danger',
      })
    } finally {
      setGenerating(false)
    }
  }

  const deleteSession = useCallback(
    async (sessionUid: number) => {
      if (!sessionUid || deletingSessionUid !== null) {
        return
      }

      setDeletingSessionUid(sessionUid)

      try {
        const response = await performAuthenticatedRequest(
          `${webServer}/api/v1/personal-training/sessions/${sessionUid}`,
          {
            method: 'DELETE',
          }
        )

        if (!response) {
          const message = 'Please sign in again to delete personal training sessions.'
          showMessage({
            message: 'Delete failed',
            description: message,
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
            message: 'Personal training session deleted',
            description: responseBody?.message || 'The personal training session was deleted successfully.',
            type: 'success',
          })
          await loadSessions()
          return
        }

        const message =
          responseBody?.message ||
          'Unable to delete personal training session.'

        if (response.status === 409) {
          showMessage({
            message: 'Delete blocked',
            description: message,
            type: 'danger',
          })
          return
        }

        if (response.status === 401) {
          showMessage({
            message: 'Authentication required',
            description: 'Please sign in again to delete personal training sessions.',
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
          description: 'Unable to delete personal training session.',
          type: 'danger',
        })
      } finally {
        setDeletingSessionUid((current) => (current === sessionUid ? null : current))
      }
    },
    [deletingSessionUid, loadSessions, performAuthenticatedRequest, webServer]
  )

  const confirmDeleteSession = (sessionUid: number, sessionLabel: string) => {
    if (!sessionUid || deletingSessionUid !== null) {
      return
    }

    Alert.alert(
      'Delete personal training session?',
      `This will permanently delete ${sessionLabel}. This cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void deleteSession(sessionUid)
          },
        },
      ],
      { cancelable: true }
    )
  }

  const cancelSession = useCallback(
    async (sessionUid: number) => {
      if (!sessionUid || cancellingSessionUid !== null) {
        return
      }

      setCancellingSessionUid(sessionUid)

      try {
        const response = await performAuthenticatedRequest(
          `${webServer}/api/v1/personal-training/sessions/${sessionUid}`,
          {
            method: 'PUT',
            body: JSON.stringify({ status: 'cancelled' }),
          }
        )

        if (!response) {
          showMessage({
            message: 'Authentication required',
            description: 'Please sign in again to cancel personal training sessions.',
            type: 'danger',
          })
          return
        }

        const responseText = await response.text()
        let responseBody: {
          message?: string
          error?: string
          session_cancelled?: boolean
          cancellation?: { bookings_cancelled?: number; payments_refunded?: number; payments_canceled?: number }
        } = {}
        if (responseText) {
          try {
            responseBody = JSON.parse(responseText)
          } catch {
            responseBody = { message: responseText }
          }
        }

        if (response.status === 200) {
          const cancellation = responseBody?.cancellation
          showMessage({
            message: 'Session cancelled',
            description:
              Number(cancellation?.payments_refunded ?? 0) > 0
                ? 'The session was cancelled and the member\'s payment was refunded.'
                : Number(cancellation?.bookings_cancelled ?? 0) > 0
                  ? 'The session was cancelled along with the member\'s booking.'
                  : 'The personal training session was cancelled.',
            type: 'success',
          })
          await loadSessions()
          return
        }

        if (
          (response.status === 409 || response.status === 500) &&
          responseBody?.error === 'Cancellation Incomplete' &&
          responseBody?.session_cancelled === true
        ) {
          showMessage({
            message: 'Session cancelled, payment needs attention',
            description:
              'The session was cancelled, but the member\'s payment or refund did not finish processing. The booking is still open. Use Retry Cancellation on the session to try again.',
            type: 'danger',
            autoHide: false,
          })
          await loadSessions()
          return
        }

        const message = responseBody?.message || 'Unable to cancel personal training session.'

        if (response.status === 401) {
          showMessage({
            message: 'Authentication required',
            description: 'Please sign in again to cancel personal training sessions.',
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
          message: 'Cancel failed',
          description: message,
          type: 'danger',
        })
      } catch {
        showMessage({
          message: 'Cancel failed',
          description: 'Unable to cancel personal training session.',
          type: 'danger',
        })
      } finally {
        setCancellingSessionUid((current) => (current === sessionUid ? null : current))
      }
    },
    [cancellingSessionUid, loadSessions, performAuthenticatedRequest, webServer]
  )

  const confirmCancelSession = (sessionUid: number, isBooked: boolean, isRetry: boolean) => {
    if (!sessionUid || cancellingSessionUid !== null) {
      return
    }

    Alert.alert(
      isRetry ? 'Retry cancellation?' : 'Cancel personal training session?',
      isBooked
        ? 'A member has booked this session. Cancelling will cancel their booking and cancel or refund their payment. This cannot simply be undone.'
        : 'This session will be cancelled and can no longer be booked. Any booking or payment on it will be cancelled or refunded. This cannot simply be undone.',
      [
        {
          text: 'Keep Session',
          style: 'cancel',
        },
        {
          text: isRetry ? 'Retry Cancellation' : 'Cancel Session',
          style: 'destructive',
          onPress: () => {
            void cancelSession(sessionUid)
          },
        },
      ],
      { cancelable: true }
    )
  }

  const renderPrice = (session: ManagedPersonalTrainingSession) => formatUsdOrFree(session?.price)

  // Cancels one trainer's upcoming generated sessions that nobody has booked. Booked and manual sessions are kept.
  const cancelUnbookedForTrainer = async (trainerGymUserId: number) => {
    if (bulkCancellingTrainer !== null) {
      return
    }

    setBulkCancellingTrainer(trainerGymUserId)

    try {
      const response = await performAuthenticatedRequest(
        `${webServer}/api/v1/personal-training/management/sessions/cancel-unbooked`,
        {
          method: 'POST',
          body: JSON.stringify({ trainer_gym_user_id: trainerGymUserId }),
        }
      )

      if (!response) {
        showMessage({
          message: 'Authentication required',
          description: 'Please sign in again to cancel personal training sessions.',
          type: 'danger',
        })
        return
      }

      const responseText = await response.text()
      let responseBody: { message?: string; cancelled?: number; skipped_booked?: number; settlement_failed?: number } = {}
      if (responseText) {
        try {
          responseBody = JSON.parse(responseText)
        } catch {
          responseBody = { message: responseText }
        }
      }

      if (response.status === 200) {
        const cancelled = Number(responseBody?.cancelled ?? 0)
        const skipped = Number(responseBody?.skipped_booked ?? 0)
        showMessage({
          message: cancelled > 0 ? 'Sessions cancelled' : 'Nothing to cancel',
          description:
            `${pluralize(cancelled, 'unbooked session')} cancelled.` +
            (skipped > 0 ? ` ${pluralize(skipped, 'session')} kept because of a booking.` : ''),
          type: 'success',
        })
        await loadSessions()
        return
      }

      showMessage({
        message: 'Cancel failed',
        description: responseBody?.message || 'Unable to cancel the unbooked sessions.',
        type: 'danger',
      })
    } catch {
      showMessage({
        message: 'Cancel failed',
        description: 'Unable to cancel the unbooked sessions.',
        type: 'danger',
      })
    } finally {
      setBulkCancellingTrainer(null)
    }
  }

  // Permanently removes cancelled sessions that never had a booking. Ones with booking history are kept.
  const deleteAllCancelledSessions = async () => {
    if (deletingCancelled) {
      return
    }

    setDeletingCancelled(true)

    try {
      const response = await performAuthenticatedRequest(
        `${webServer}/api/v1/personal-training/management/sessions/delete-cancelled`,
        { method: 'POST', body: JSON.stringify({}) }
      )

      if (!response) {
        showMessage({
          message: 'Authentication required',
          description: 'Please sign in again to delete personal training sessions.',
          type: 'danger',
        })
        return
      }

      const responseText = await response.text()
      let responseBody: { message?: string; deleted?: number; kept_with_booking_history?: number } = {}
      if (responseText) {
        try {
          responseBody = JSON.parse(responseText)
        } catch {
          responseBody = { message: responseText }
        }
      }

      if (response.status === 200) {
        const deleted = Number(responseBody?.deleted ?? 0)
        const kept = Number(responseBody?.kept_with_booking_history ?? 0)
        showMessage({
          message: deleted > 0 ? 'Cancelled sessions deleted' : 'Nothing to delete',
          description:
            `${pluralize(deleted, 'cancelled session')} deleted.` +
            (kept > 0 ? ` ${pluralize(kept, 'session')} kept because they have booking history.` : ''),
          type: 'success',
        })
        await loadSessions()
        return
      }

      showMessage({
        message: 'Delete failed',
        description: responseBody?.message || 'Unable to delete the cancelled sessions.',
        type: 'danger',
      })
    } catch {
      showMessage({
        message: 'Delete failed',
        description: 'Unable to delete the cancelled sessions.',
        type: 'danger',
      })
    } finally {
      setDeletingCancelled(false)
    }
  }

  const confirmDeleteAllCancelled = (count: number) => {
    if (deletingCancelled) {
      return
    }

    Alert.alert(
      'Delete all cancelled sessions?',
      `This permanently deletes up to ${pluralize(count, 'cancelled session')}. Sessions that have booking history are kept so payment records stay intact. If a trainer still has availability covering these times, Generate Upcoming Sessions can create them again, so remove that availability first. This cannot be undone.`,
      [
        { text: 'Keep Them', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: () => {
            void deleteAllCancelledSessions()
          },
        },
      ],
      { cancelable: true }
    )
  }

  const confirmCancelUnbooked = (trainer: { trainerGymUserId: number; name: string; count: number }) => {
    if (bulkCancellingTrainer !== null) {
      return
    }

    Alert.alert(
      'Cancel unbooked sessions?',
      `This cancels ${pluralize(trainer.count, 'upcoming unbooked session')} for ${trainer.name}. Sessions that someone has booked, and sessions you added by hand, are not changed. Cancelled sessions cannot be re-created by the generator.`,
      [
        { text: 'Keep Sessions', style: 'cancel' },
        {
          text: 'Cancel Sessions',
          style: 'destructive',
          onPress: () => {
            void cancelUnbookedForTrainer(trainer.trainerGymUserId)
          },
        },
      ],
      { cancelable: true }
    )
  }

  const isUpcomingSession = (session: ManagedPersonalTrainingSession) => {
    const sessionDate = parseApiDateTime(session?.start_at)
    if (!sessionDate) {
      return false
    }

    return sessionDate.getTime() > Date.now()
  }

  // A cancelled session with nothing left to settle belongs under Cancelled. One that still has a booking stays in
  // Upcoming/Past because it needs "Retry Cancellation".
  const isSettledCancelled = (session: ManagedPersonalTrainingSession) =>
    String(session?.status ?? '').trim().toLowerCase() === 'cancelled' && Number(session?.booked_count ?? 0) === 0

  const cancelledSessions = sessions.filter(isSettledCancelled)
  const activeSessions = sessions.filter((session) => !isSettledCancelled(session))
  const upcomingSessions = activeSessions.filter(isUpcomingSession)
  const pastSessions = activeSessions.filter((session) => !isUpcomingSession(session))
  const visibleSessions =
    activeTab === 'upcoming' ? upcomingSessions : activeTab === 'cancelled' ? cancelledSessions : pastSessions
  const activeSessionsLabel = activeTab === 'upcoming' ? 'Upcoming' : activeTab === 'cancelled' ? 'Cancelled' : 'Past'

  const unbookedByTrainer = Object.values(
    upcomingSessions
      .filter(
        (session) =>
          session?.is_generated === true &&
          String(session?.status ?? '').trim().toLowerCase() === 'scheduled' &&
          Number(session?.booked_count ?? 0) === 0 &&
          Number(session?.trainer_gym_user_id ?? 0) > 0
      )
      .reduce<Record<string, { trainerGymUserId: number; name: string; count: number }>>((groups, session) => {
        const trainerGymUserId = Number(session.trainer_gym_user_id)
        const key = String(trainerGymUserId)
        const name = String(session?.trainer_display_name ?? '').trim() || `Trainer ${trainerGymUserId}`
        groups[key] = { trainerGymUserId, name, count: (groups[key]?.count ?? 0) + 1 }
        return groups
      }, {})
  ).sort((a, b) => a.name.localeCompare(b.name))

  const sessionCount = sessions.length

  if (!canManage) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.navs}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Feather name="arrow-left" color={AppColors.blue} size={36} />
          </TouchableOpacity>
          <Text style={styles.title}>Personal Training</Text>
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
        <Text style={styles.title}>Personal Training</Text>
        <View style={styles.spacer} />
      </View>

      {canManage ? (
        <View style={styles.actionsBar}>
          <TouchableOpacity
            style={styles.addButton}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('AddPersonalTrainingSessionScreen')}
          >
            <Feather name="plus" color={AppColors.white} size={18} />
            <Text style={styles.addButtonText}>Add Session</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.availabilityButton}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('MyPersonalTrainingAvailabilityScreen')}
          >
            <Feather name="calendar" color={AppColors.blue} size={18} />
            <Text style={styles.availabilityButtonText}>Trainer Availability</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.availabilityButton, generating && styles.buttonDisabled]}
            activeOpacity={0.85}
            disabled={generating}
            onPress={() => void generateUpcomingSessions()}
          >
            {generating ? (
              <ActivityIndicator size="small" color={AppColors.blue} />
            ) : (
              <Feather name="refresh-cw" color={AppColors.blue} size={18} />
            )}
            <Text style={styles.availabilityButtonText}>
              {generating ? 'Generating...' : 'Generate Upcoming Sessions'}
            </Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={AppColors.blue} />}
      >
        {loading ? (
          <View style={styles.centerState}>
            <ActivityIndicator size="large" color={AppColors.blue} />
            <Text style={styles.stateText}>Loading personal training sessions...</Text>
          </View>
        ) : errorMessage ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorTitle}>Unable to load personal training sessions</Text>
            <Text style={styles.errorText}>{errorMessage}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => loadSessions()}>
              <Text style={styles.retryBtnText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : sessionCount === 0 ? (
          <View style={styles.centerState}>
            <Text style={styles.emptyTitle}>No personal training sessions yet</Text>
            <Text style={styles.stateText}>Use the backend to create sessions and they will appear here.</Text>
          </View>
        ) : (
          <>
            {unbookedByTrainer.length > 0 ? (
              <View style={styles.bulkCard}>
                <Text style={styles.bulkTitle}>Unbooked generated sessions</Text>
                <Text style={styles.bulkHint}>
                  Created from availability and not booked by anyone. Use this after removing availability to clear the
                  sessions it already generated. Booked sessions are never changed.
                </Text>
                {unbookedByTrainer.map((trainer) => {
                  const busy = bulkCancellingTrainer === trainer.trainerGymUserId

                  return (
                    <View key={trainer.trainerGymUserId} style={styles.bulkRow}>
                      <Text style={styles.bulkRowText}>
                        {trainer.name}: {pluralize(trainer.count, 'session')}
                      </Text>
                      <TouchableOpacity
                        style={[styles.bulkButton, bulkCancellingTrainer !== null && styles.buttonDisabled]}
                        activeOpacity={0.85}
                        disabled={bulkCancellingTrainer !== null}
                        onPress={() => confirmCancelUnbooked(trainer)}
                      >
                        <Text style={styles.bulkButtonText}>{busy ? 'Cancelling...' : 'Cancel all'}</Text>
                      </TouchableOpacity>
                    </View>
                  )
                })}
              </View>
            ) : null}
            <View style={styles.filterBar}>
              <TouchableOpacity
                style={[styles.filterButton, activeTab === 'upcoming' && styles.filterButtonActive]}
                onPress={() => setActiveTab('upcoming')}
              >
                <Text style={[styles.filterButtonText, activeTab === 'upcoming' && styles.filterButtonTextActive]}>
                  Upcoming ({upcomingSessions.length})
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterButton, activeTab === 'past' && styles.filterButtonActive]}
                onPress={() => setActiveTab('past')}
              >
                <Text style={[styles.filterButtonText, activeTab === 'past' && styles.filterButtonTextActive]}>
                  Past ({pastSessions.length})
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterButton, activeTab === 'cancelled' && styles.filterButtonActive]}
                onPress={() => setActiveTab('cancelled')}
              >
                <Text style={[styles.filterButtonText, activeTab === 'cancelled' && styles.filterButtonTextActive]}>
                  Cancelled ({cancelledSessions.length})
                </Text>
              </TouchableOpacity>
            </View>

            {activeTab === 'cancelled' && cancelledSessions.length > 0 ? (
              <TouchableOpacity
                style={[styles.deleteAllButton, deletingCancelled && styles.buttonDisabled]}
                activeOpacity={0.85}
                disabled={deletingCancelled}
                onPress={() => confirmDeleteAllCancelled(cancelledSessions.length)}
              >
                <Feather name="trash-2" color={AppColors.white} size={16} />
                <Text style={styles.deleteAllButtonText}>
                  {deletingCancelled ? 'Deleting...' : `Delete all cancelled sessions (${cancelledSessions.length})`}
                </Text>
              </TouchableOpacity>
            ) : null}

            {visibleSessions.length > 0 ? (
              <View style={styles.list}>
                <Text style={styles.sectionTitle}>{activeSessionsLabel} sessions</Text>
                {visibleSessions.map((session, index) => {
                  const sessionUid = Number(session?.uid ?? session?.session_uid ?? 0)
                  const priceLabel = renderPrice(session)
                  const status = String(session?.status ?? 'scheduled').trim().toLowerCase()
                  const location = String(session?.location ?? '').trim()
                  const notes = String(session?.additional_notes ?? '').trim()
                  const trainerDisplayName = String(session?.trainer_display_name ?? '').trim()
                  const deleting = deletingSessionUid === sessionUid
                  const bookingState = renderBookingState(session)
                  const bookedCount = Number(session?.booked_count ?? 0)
                  const cancelling = cancellingSessionUid === sessionUid
                  // A cancelled session that still has a booking means refund processing did not finish.
                  const isCancelRetry = status === 'cancelled' && bookedCount > 0
                  const canCancel = (status === 'scheduled' && isUpcomingSession(session)) || isCancelRetry
                  const statusStyle =
                    status === 'cancelled'
                      ? styles.statusCancelled
                      : status === 'completed'
                        ? styles.statusCompleted
                        : styles.statusScheduled

                  return (
                    <View
                      key={sessionUid || `${session?.trainer_gym_user_id ?? 'trainer'}-${session?.start_at ?? index}`}
                      style={[styles.card, activeTab === 'past' && styles.cardPast]}
                    >
                      <View style={styles.cardHeader}>
                        <View style={styles.cardHeaderText}>
                          <Text style={styles.cardTitle}>{getOwnerPersonalTrainingTitle(trainerDisplayName)}</Text>
                          <Text style={styles.cardSubtitle}>{priceLabel}</Text>
                        </View>
                        <View style={[styles.statusPill, statusStyle]}>
                          <Text style={styles.statusText}>{renderStatusLabel(status)}</Text>
                        </View>
                      </View>

                      <View style={styles.metaGrid}>
                        <View style={styles.metaItem}>
                          <Text style={styles.metaLabel}>Date</Text>
                          <Text style={styles.metaValue}>{formatDate(session?.start_at)}</Text>
                        </View>
                        <View style={styles.metaItem}>
                          <Text style={styles.metaLabel}>Time</Text>
                          <Text style={styles.metaValue}>
                            {formatTime(session?.start_at)} - {formatTime(session?.end_at)}
                          </Text>
                        </View>
                        {bookingState ? (
                          <View style={styles.metaItem}>
                            <Text style={styles.metaLabel}>Booking</Text>
                            <Text style={styles.metaValue}>{bookingState}</Text>
                          </View>
                        ) : null}
                      </View>

                      {location ? (
                        <View style={styles.detailSection}>
                          <Text style={styles.metaLabel}>Location</Text>
                          <Text style={styles.detailValue}>{location}</Text>
                        </View>
                      ) : null}

                      {notes ? (
                        <View style={styles.detailSection}>
                          <Text style={styles.metaLabel}>Additional Notes</Text>
                          <Text style={styles.detailValue}>{notes}</Text>
                        </View>
                      ) : null}

                      <View style={styles.cardActions}>
                        {canManage ? (
                          <TouchableOpacity
                            style={styles.editButton}
                            activeOpacity={0.85}
                            onPress={() => navigation.navigate('EditPersonalTrainingSessionScreen', { sessionUid })}
                            disabled={!sessionUid || deleting || cancelling}
                          >
                            <Feather name="edit-2" color={AppColors.blue} size={16} />
                            <Text style={styles.editButtonText}>Edit</Text>
                          </TouchableOpacity>
                        ) : null}

                        {canCancel ? (
                          <TouchableOpacity
                            style={[styles.cancelSessionButton, cancelling ? styles.cancelSessionButtonDisabled : null]}
                            activeOpacity={0.85}
                            onPress={() => confirmCancelSession(sessionUid, bookedCount > 0, isCancelRetry)}
                            disabled={!sessionUid || deleting || cancelling}
                          >
                            {cancelling ? (
                              <ActivityIndicator size="small" color={AppColors.red} />
                            ) : (
                              <Feather name="x-circle" color={AppColors.red} size={16} />
                            )}
                            <Text style={styles.cancelSessionButtonText}>
                              {cancelling ? 'Cancelling...' : isCancelRetry ? 'Retry Cancellation' : 'Cancel Session'}
                            </Text>
                          </TouchableOpacity>
                        ) : null}

                        <TouchableOpacity
                          style={[styles.deleteButton, deleting ? styles.deleteButtonDisabled : null]}
                          activeOpacity={0.85}
                          onPress={() =>
                            confirmDeleteSession(sessionUid, `${trainerDisplayName || 'this personal training session'}`)
                          }
                          disabled={!sessionUid || deleting || cancelling}
                        >
                          {deleting ? (
                            <ActivityIndicator size="small" color={AppColors.white} />
                          ) : (
                            <Feather name="trash-2" color={AppColors.white} size={16} />
                          )}
                          <Text style={styles.deleteButtonText}>{deleting ? 'Deleting...' : 'Delete'}</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )
                })}
              </View>
            ) : (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>{activeSessionsLabel} sessions</Text>
                <Text style={styles.stateText}>
                  {activeTab === 'upcoming'
                    ? 'No upcoming personal training sessions right now. Add a new session to get started.'
                    : activeTab === 'cancelled'
                      ? 'No cancelled personal training sessions.'
                      : 'No past personal training sessions yet.'}
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

export default PersonalTrainingManagementScreen

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
  availabilityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 10,
    backgroundColor: AppColors.white,
    borderColor: AppColors.blue,
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  availabilityButtonText: {
    color: AppColors.blue,
    fontSize: 16,
    fontFamily: 'Montserrat',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  deleteAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: AppColors.red,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 14,
  },
  deleteAllButtonText: {
    color: AppColors.white,
    fontSize: 14,
    fontFamily: 'Montserrat',
  },
  bulkCard: {
    backgroundColor: AppColors.white,
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
  },
  bulkTitle: {
    color: AppColors.primary,
    fontSize: 16,
    fontFamily: 'Montserrat',
  },
  bulkHint: {
    marginTop: 6,
    color: AppColors.grey3,
    fontSize: 12,
    fontFamily: 'Montserrat',
  },
  bulkRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  bulkRowText: {
    flex: 1,
    color: AppColors.primary,
    fontSize: 14,
    fontFamily: 'Montserrat',
  },
  bulkButton: {
    borderColor: AppColors.red,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bulkButtonText: {
    color: AppColors.red,
    fontSize: 14,
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
  cancelSessionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderColor: AppColors.red,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: AppColors.white,
  },
  cancelSessionButtonDisabled: {
    opacity: 0.75,
  },
  cancelSessionButtonText: {
    color: AppColors.red,
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
  emptyCard: {
    backgroundColor: AppColors.white,
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: AppColors.grey,
    marginTop: 16,
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
  card: {
    backgroundColor: AppColors.white,
    borderRadius: 18,
    padding: 18,
    borderColor: AppColors.grey,
    borderWidth: 1,
  },
  cardPast: {
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
    marginBottom: 4,
    fontFamily: 'Montserrat',
  },
  cardSubtitle: {
    fontSize: 13,
    color: AppColors.white,
    backgroundColor: AppColors.blue,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    alignSelf: 'flex-start',
    fontFamily: 'Montserrat',
  },
  statusPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  statusScheduled: {
    backgroundColor: AppColors.blue,
  },
  statusCancelled: {
    backgroundColor: AppColors.red,
  },
  statusCompleted: {
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
  detailSection: {
    marginTop: 8,
  },
  detailValue: {
    marginTop: 4,
    fontSize: 12,
    color: AppColors.primary,
    fontFamily: 'Montserrat',
  },
  sectionTitle: {
    fontSize: 20,
    color: AppColors.blue,
    marginBottom: 14,
    fontFamily: 'Montserrat',
  },
  filterBar: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    marginBottom: 6,
  },
  filterButton: {
    flex: 1,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: AppColors.grey,
    backgroundColor: AppColors.white,
    paddingVertical: 12,
    alignItems: 'center',
  },
  filterButtonActive: {
    borderColor: AppColors.blue,
    backgroundColor: AppColors.blue,
  },
  filterButtonText: {
    color: AppColors.primary,
    fontSize: 14,
    fontFamily: 'Montserrat',
  },
  filterButtonTextActive: {
    color: AppColors.white,
  },
})