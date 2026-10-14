import { useCallback, useContext, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useFocusEffect } from '@react-navigation/native'
import { Controller, useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { Feather } from '@expo/vector-icons'
import { showMessage } from 'react-native-flash-message'
import { AppColors } from '../../styles/colors'
import { UserContext } from '../../context/UserContext'

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
  if (!trimmed) {
    return []
  }

  try {
    const parsed = JSON.parse(trimmed) as unknown
    if (typeof parsed === 'string') {
      return [parsed]
    }

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

      if (candidates.length > 0) {
        return candidates
      }
    }
  } catch {
    // Fall through to the raw text below.
  }

  return [trimmed]
}

const shouldRefreshAuthResponse = async (response: Response): Promise<boolean> => {
  if (!response || response.ok) {
    return false
  }

  if (response.status === 401) {
    return true
  }

  if (response.status !== 400 && response.status !== 403) {
    return false
  }

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

  console.log('Access token expired, requesting new one - performAuthenticatedRequestWithRefresh()')
  const refreshedAccessToken = await refreshAccessTokenWithRefresh({
    refreshToken,
    webServer,
    setTokens,
  })

  if (!refreshedAccessToken) {
    return null
  }

  return requestWithToken(refreshedAccessToken)
}

type RefreshTokens = {
  access_token?: string
  refresh_token?: string
}

type UserContextValue = {
  tokens?: RefreshTokens | null
  setTokens: (value: RefreshTokens | null | ((prev: RefreshTokens | null) => RefreshTokens | null)) => void
  webServer: string
}

type EditClassRoute = {
  params?: {
    classUid?: number | string
  }
}

type EditClassNavigation = {
  goBack: () => void
  navigate: (screen: 'EditClassSessionScreen' | 'AddClassSessionScreen', params?: Record<string, unknown>) => void
}

type ClassRecord = {
  uid: number
  gym_id: number
  name: string
  description: string | null
  duration_minutes: number
  capacity: number
  price: number | string
  currency_code: string
  status: 'active' | 'inactive' | string
  created_at: string | null
  updated_at: string | null
}

type ClassSessionRecord = {
  uid?: number
  session_uid?: number
  class_uid?: number
  class_name?: string
  class_description?: string | null
  duration_minutes?: number
  trainer_gym_user_id?: number | null
  trainer_display_name?: string | null
  start_at?: string | null
  end_at?: string | null
  location?: string | null
  additional_notes?: string | null
  capacity?: number | null
  price?: number | string | null
  currency_code?: string | null
  status?: string
  booked_count?: number
  active_booking_count?: number
  available_capacity?: number | null
}

type EditClassFormValues = {
  name?: string
  description?: string
  duration_minutes?: string
  capacity?: string
  price?: string
  currency_code?: string
  status?: 'active' | 'inactive'
}

type EditClassFormInput = {
  name: string
  description: string
  duration_minutes: string
  capacity: string
  price: string
  currency_code: string
  status: 'active' | 'inactive'
}

type ApiResponseBody = {
  message?: string
  errors?: string[]
  class?: ClassRecord
  data?: ClassSessionRecord[]
}

const classSchema = yup.object({
  name: yup
    .string()
    .trim()
    .required('Class name is required')
    .max(100, 'Class name must be 100 characters or fewer'),
  description: yup
    .string()
    .trim()
    .max(1000, 'Description must be 1000 characters or fewer')
    .nullable(),
  duration_minutes: yup
    .string()
    .trim()
    .required('Duration is required')
    .test('duration-integer', 'Duration must be a whole number', (value) => /^\d+$/.test(String(value ?? '')))
    .test('duration-positive', 'Duration must be greater than 0', (value) => {
      if (!/^\d+$/.test(String(value ?? ''))) {
        return true
      }
      return Number(value) > 0
    }),
  capacity: yup
    .string()
    .trim()
    .required('Capacity is required')
    .test('capacity-integer', 'Capacity must be a whole number', (value) => /^\d+$/.test(String(value ?? '')))
    .test('capacity-positive', 'Capacity must be greater than 0', (value) => {
      if (!/^\d+$/.test(String(value ?? ''))) {
        return true
      }
      return Number(value) > 0
    }),
  price: yup
    .string()
    .trim()
    .required('Price is required')
    .test('price-format', 'Price must be a valid amount', (value) => /^\d+(\.\d{1,2})?$/.test(String(value ?? '')))
    .test('price-nonnegative', 'Price must be greater than or equal to 0', (value) => {
      if (!/^\d+(\.\d{1,2})?$/.test(String(value ?? ''))) {
        return true
      }
      return Number(value) >= 0
    }),
  currency_code: yup
    .string()
    .trim()
    .required('Currency code is required')
    .matches(/^[A-Z]{3}$/, 'Currency code must be 3 uppercase letters'),
  status: yup.mixed<'active' | 'inactive'>().oneOf(['active', 'inactive']).required('Status is required'),
})

const parseDateTime = (value?: string | null) => {
  if (!value) {
    return null
  }

  const normalized = String(value).includes('T') ? String(value) : String(value).replace(' ', 'T')
  const date = new Date(normalized)
  return Number.isNaN(date.getTime()) ? null : date
}

const formatDate = (value?: string | null) => {
  const date = parseDateTime(value)
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

const formatTime = (value?: string | null) => {
  const date = parseDateTime(value)
  if (!date) {
    return 'Unknown time'
  }

  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

const normalizeStatus = (value?: string | null) => {
  const normalized = String(value ?? '').trim().toLowerCase()
  return normalized === 'inactive' ? 'inactive' : 'active'
}

const formatPrice = (value?: number | string | null, currencyCode?: string | null) => {
  const price = Number(value ?? 0)
  if (price <= 0) {
    return 'Free'
  }

  const currency = String(currencyCode ?? '').trim().toUpperCase()
  return `${price.toFixed(2)} ${currency}`.trim()
}

const isUpcomingSession = (session: ClassSessionRecord) => {
  const parsed = parseDateTime(session?.start_at)
  if (!parsed) {
    return false
  }

  return parsed.getTime() >= Date.now()
}

const EditClassScreen = ({ navigation, route }: { navigation: EditClassNavigation; route: EditClassRoute }) => {
  const { tokens, setTokens, webServer } = useContext(UserContext) as UserContextValue
  const classUid = Number(route?.params?.classUid ?? 0)
  const [classLoading, setClassLoading] = useState(true)
  const [sessionsLoading, setSessionsLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [classLoadError, setClassLoadError] = useState('')
  const [sessionsLoadError, setSessionsLoadError] = useState('')
  const [serverMessage, setServerMessage] = useState('')
  const [sessions, setSessions] = useState<ClassSessionRecord[]>([])
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming')

  const defaultValues = useMemo<EditClassFormValues>(
    () => ({
      name: '',
      description: '',
      duration_minutes: '',
      capacity: '',
      price: '',
      currency_code: 'USD',
      status: 'active',
    }),
    []
  )

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<EditClassFormInput, unknown, EditClassFormValues>({
    resolver: yupResolver(classSchema),
    defaultValues,
    mode: 'onSubmit',
  })

  const performAuthenticatedRequest = useCallback(
    async (endpoint: string, init = {} as RequestInit): Promise<Response | null> => {
      return performAuthenticatedRequestWithRefresh({
        endpoint,
        init,
        accessToken: tokens?.access_token ?? null,
        refreshToken: tokens?.refresh_token ?? null,
        webServer,
        setTokens,
      })
    },
    [setTokens, tokens?.access_token, tokens?.refresh_token, webServer]
  )

  const readResponseBody = useCallback(async (response: Response): Promise<ApiResponseBody> => {
    const responseText = await response.text()
    if (!responseText) {
      return {}
    }

    try {
      return JSON.parse(responseText) as ApiResponseBody
    } catch {
      return { message: responseText }
    }
  }, [])

  const applyClassToForm = useCallback(
    (classData: ClassRecord) => {
      reset({
        name: String(classData.name ?? ''),
        description: String(classData.description ?? ''),
        duration_minutes: String(classData.duration_minutes ?? ''),
        capacity: String(classData.capacity ?? ''),
        price: Number(classData.price ?? 0).toFixed(2),
        currency_code: String(classData.currency_code ?? 'USD').trim().toUpperCase(),
        status: normalizeStatus(classData.status),
      })
    },
    [reset]
  )

  const loadSessions = useCallback(async () => {
    if (!classUid || !tokens?.access_token) {
      setSessions([])
      setSessionsLoadError('Please sign in again to view class sessions.')
      setSessionsLoading(false)
      return
    }

    setSessionsLoading(true)
    setSessionsLoadError('')

    try {
      const response = await performAuthenticatedRequest(`${webServer}/api/v1/classes/${classUid}/sessions`)
      if (!response) {
        setSessions([])
        setSessionsLoadError('Please sign in again to view class sessions.')
        return
      }

      const responseBody = await readResponseBody(response)

      if (response.status === 401 || response.status === 403) {
        const message = 'Your session expired. Please sign in again.'
        setSessions([])
        setSessionsLoadError(message)
        showMessage({
          message: 'Authentication required',
          description: message,
          type: 'danger',
        })
        return
      }

      if (response.status !== 200) {
        const message = responseBody?.message || 'Unable to load class sessions.'
        setSessions([])
        setSessionsLoadError(message)
        showMessage({
          message: 'Class sessions unavailable',
          description: message,
          type: 'danger',
        })
        return
      }

      setSessions(Array.isArray(responseBody?.data) ? responseBody.data : [])
    } catch {
      const message = 'Failed to load class sessions.'
      setSessions([])
      setSessionsLoadError(message)
      showMessage({
        message: 'Class sessions unavailable',
        description: message,
        type: 'danger',
      })
    } finally {
      setSessionsLoading(false)
    }
  }, [classUid, performAuthenticatedRequest, readResponseBody, tokens?.access_token, webServer])

  const loadClass = useCallback(async () => {
    if (!classUid || Number.isNaN(classUid) || classUid <= 0) {
      setClassLoading(false)
      setSessionsLoading(false)
      setClassLoadError('Invalid class selected.')
      return
    }

    if (!tokens?.access_token) {
      setClassLoading(false)
      setSessionsLoading(false)
      setClassLoadError('Please sign in again to edit this class.')
      return
    }

    setClassLoading(true)
    setClassLoadError('')
    setServerMessage('')

    try {
      const response = await performAuthenticatedRequest(`${webServer}/api/v1/classes/${classUid}`)
      if (!response) {
        setClassLoading(false)
        setSessionsLoading(false)
        setClassLoadError('Please sign in again to edit this class.')
        return
      }

      const responseBody = await readResponseBody(response)

      if (response.status === 401 || response.status === 403) {
        const message = 'Your session expired. Please sign in again.'
        setClassLoading(false)
        setSessionsLoading(false)
        setClassLoadError(message)
        showMessage({
          message: 'Authentication required',
          description: message,
          type: 'danger',
        })
        return
      }

      if (response.status !== 200) {
        const message = responseBody?.message || 'Unable to load class.'
        setClassLoading(false)
        setSessionsLoading(false)
        setClassLoadError(message)
        showMessage({
          message: 'Class unavailable',
          description: message,
          type: 'danger',
        })
        return
      }

      const classData = responseBody?.class
      if (!classData) {
        setClassLoading(false)
        setSessionsLoading(false)
        setClassLoadError('Class data is unavailable.')
        return
      }

      applyClassToForm(classData)
      setClassLoading(false)
      void loadSessions()
    } catch {
      const message = 'Failed to load class.'
      setClassLoading(false)
      setSessionsLoading(false)
      setClassLoadError(message)
      showMessage({
        message: 'Class unavailable',
        description: message,
        type: 'danger',
      })
    }
  }, [applyClassToForm, classUid, loadSessions, performAuthenticatedRequest, readResponseBody, tokens?.access_token, webServer])

  useFocusEffect(
    useCallback(() => {
      void loadClass()
    }, [loadClass])
  )

  const handleEditSession = (session: ClassSessionRecord) => {
    navigation.navigate('EditClassSessionScreen', {
      classUid,
      sessionUid: session?.session_uid ?? session?.uid,
      session,
    })
  }

  const handleAddSession = () => {
    navigation.navigate('AddClassSessionScreen', {
      classUid,
    })
  }

  const onSubmit = useCallback(
    async (formData: EditClassFormValues) => {
      if (saving) {
        return
      }

      if (!classUid || Number.isNaN(classUid) || classUid <= 0) {
        setClassLoadError('Invalid class selected.')
        return
      }

      setSaving(true)
      setServerMessage('')

      try {
        const response = await performAuthenticatedRequest(`${webServer}/api/v1/classes/${classUid}`, {
          method: 'PUT',
          body: JSON.stringify({
            name: String(formData.name ?? '').trim(),
            description: String(formData.description ?? '').trim(),
            duration_minutes: Number.parseInt(String(formData.duration_minutes ?? ''), 10),
            capacity: Number.parseInt(String(formData.capacity ?? ''), 10),
            price: Number.parseFloat(String(formData.price ?? '')),
            currency_code: String(formData.currency_code ?? 'USD').trim().toUpperCase(),
            status: formData.status,
          }),
        })

        if (!response) {
          const message = 'Please sign in again to update classes.'
          setServerMessage(message)
          showMessage({
            message: 'Update failed',
            description: message,
            type: 'danger',
          })
          return
        }

        const responseBody = await readResponseBody(response)

        if (response.status === 401 || response.status === 403) {
          const message = 'Your session expired. Please sign in again.'
          setServerMessage(message)
          showMessage({
            message: 'Authentication required',
            description: message,
            type: 'danger',
          })
          return
        }

        if (response.status === 200) {
          const updatedClass = responseBody?.class
          if (updatedClass) {
            applyClassToForm(updatedClass)
          }

          showMessage({
            message: 'Class updated',
            description: responseBody?.message || 'The class has been updated successfully.',
            type: 'success',
          })
          return
        }

        if (response.status === 401 || response.status === 403) {
          const message = responseBody?.message || 'Please sign in again to update classes.'
          setServerMessage(message)
          showMessage({
            message: 'Authentication required',
            description: message,
            type: 'danger',
          })
          return
        }

        if (response.status === 409) {
          const message = responseBody?.message || 'A class with this name already exists for this gym.'
          setServerMessage(message)
          showMessage({
            message: 'Duplicate class name',
            description: message,
            type: 'danger',
          })
          return
        }

        if (response.status === 400) {
          const message =
            Array.isArray(responseBody?.errors) && responseBody.errors.length > 0
              ? responseBody.errors[0]
              : responseBody?.message || 'Please check the class details and try again.'
          setServerMessage(message)
          showMessage({
            message: 'Validation error',
            description: message,
            type: 'danger',
          })
          return
        }

        const message = responseBody?.message || 'Unable to update class.'
        setServerMessage(message)
        showMessage({
          message: 'Update failed',
          description: message,
          type: 'danger',
        })
      } catch {
        const message = 'Network error while updating class.'
        setServerMessage(message)
        showMessage({
          message: 'Update failed',
          description: message,
          type: 'danger',
        })
      } finally {
        setSaving(false)
      }
    },
    [applyClassToForm, classUid, performAuthenticatedRequest, readResponseBody, saving, webServer]
  )

  const statusValue = watch('status')

  const renderSessionStatusLabel = (status?: string | null) => {
    const normalized = String(status ?? '').trim().toLowerCase()
    if (!normalized) {
      return 'Unknown'
    }

    return normalized.charAt(0).toUpperCase() + normalized.slice(1)
  }

  const renderSessionPrice = (session: ClassSessionRecord) => {
    const price = Number(session?.price ?? 0)
    if (price <= 0) {
      return 'Free'
    }

    const currency = String(session?.currency_code ?? '').trim().toUpperCase()
    return `${price.toFixed(2)} ${currency}`.trim()
  }

  const upcomingSessions = useMemo(() => sessions.filter(isUpcomingSession), [sessions])
  const pastSessions = useMemo(() => sessions.filter((session) => !isUpcomingSession(session)), [sessions])
  const visibleSessions = activeTab === 'upcoming' ? upcomingSessions : pastSessions
  const activeSessionsLabel = activeTab === 'upcoming' ? 'Upcoming' : 'Past'

  if (classLoading && classLoadError === '') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.navs}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Feather name="arrow-left" color={AppColors.blue} size={36} />
          </TouchableOpacity>
          <Text style={styles.title}>Edit Class</Text>
          <View style={styles.spacer} />
        </View>

        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={AppColors.blue} />
          <Text style={styles.stateText}>Loading class...</Text>
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
        <Text style={styles.title}>Edit Class</Text>
        <View style={styles.spacer} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {classLoadError ? (
            <View style={styles.errorCard}>
              <Text style={styles.errorTitle}>Unable to load class</Text>
              <Text style={styles.errorText}>{classLoadError}</Text>
              <TouchableOpacity style={styles.retryBtn} onPress={() => void loadClass()}>
                <Text style={styles.retryBtnText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={styles.card}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Class Details</Text>
                  <View style={[styles.statusPill, statusValue === 'active' ? styles.statusActive : styles.statusInactive]}>
                    <Text style={styles.statusText}>{statusValue ? statusValue.charAt(0).toUpperCase() + statusValue.slice(1) : 'Active'}</Text>
                  </View>
                </View>

                {serverMessage ? (
                  <View style={styles.inlineMessage}>
                    <Text style={styles.inlineMessageText}>{serverMessage}</Text>
                  </View>
                ) : null}

                <View style={styles.field}>
                  <Text style={styles.label}>Name</Text>
                  <Controller
                    control={control}
                    name="name"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <TextInput
                        value={value}
                        onBlur={onBlur}
                        onChangeText={onChange}
                        placeholder="Class name"
                        placeholderTextColor={AppColors.grey3}
                        style={styles.input}
                        autoCapitalize="words"
                      />
                    )}
                  />
                  {errors.name ? <Text style={styles.errorText}>{errors.name.message}</Text> : null}
                </View>

                <View style={styles.field}>
                  <Text style={styles.label}>Description</Text>
                  <Controller
                    control={control}
                    name="description"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <TextInput
                        value={value}
                        onBlur={onBlur}
                        onChangeText={onChange}
                        placeholder="Optional class description"
                        placeholderTextColor={AppColors.grey3}
                        style={[styles.input, styles.multilineInput]}
                        multiline
                        textAlignVertical="top"
                      />
                    )}
                  />
                  {errors.description ? <Text style={styles.errorText}>{errors.description.message}</Text> : null}
                </View>

                <View style={styles.row}>
                  <View style={[styles.field, styles.rowField]}>
                    <Text style={styles.label}>Duration Minutes</Text>
                    <Controller
                      control={control}
                      name="duration_minutes"
                      render={({ field: { onChange, onBlur, value } }) => (
                        <TextInput
                          value={value}
                          onBlur={onBlur}
                          onChangeText={onChange}
                          placeholder="60"
                          placeholderTextColor={AppColors.grey3}
                          style={styles.input}
                          keyboardType="number-pad"
                        />
                      )}
                    />
                    {errors.duration_minutes ? <Text style={styles.errorText}>{errors.duration_minutes.message}</Text> : null}
                  </View>

                  <View style={[styles.field, styles.rowField]}>
                    <Text style={styles.label}>Capacity</Text>
                    <Controller
                      control={control}
                      name="capacity"
                      render={({ field: { onChange, onBlur, value } }) => (
                        <TextInput
                          value={value}
                          onBlur={onBlur}
                          onChangeText={onChange}
                          placeholder="10"
                          placeholderTextColor={AppColors.grey3}
                          style={styles.input}
                          keyboardType="number-pad"
                        />
                      )}
                    />
                    {errors.capacity ? <Text style={styles.errorText}>{errors.capacity.message}</Text> : null}
                  </View>
                </View>

                <View style={styles.row}>
                  <View style={[styles.field, styles.rowField]}>
                    <Text style={styles.label}>Price</Text>
                    <Controller
                      control={control}
                      name="price"
                      render={({ field: { onChange, onBlur, value } }) => (
                        <TextInput
                          value={value}
                          onBlur={onBlur}
                          onChangeText={onChange}
                          placeholder="0.00"
                          placeholderTextColor={AppColors.grey3}
                          style={styles.input}
                          keyboardType="decimal-pad"
                        />
                      )}
                    />
                    {errors.price ? <Text style={styles.errorText}>{errors.price.message}</Text> : null}
                  </View>

                  <View style={[styles.field, styles.rowField]}>
                    <Text style={styles.label}>Currency Code</Text>
                    <Controller
                      control={control}
                      name="currency_code"
                      render={({ field: { onChange, onBlur, value } }) => (
                        <TextInput
                          value={value}
                          onBlur={onBlur}
                          onChangeText={(text) => onChange(text.toUpperCase())}
                          placeholder="USD"
                          placeholderTextColor={AppColors.grey3}
                          style={styles.input}
                          autoCapitalize="characters"
                          maxLength={3}
                        />
                      )}
                    />
                    {errors.currency_code ? <Text style={styles.errorText}>{errors.currency_code.message}</Text> : null}
                  </View>
                </View>

                <View style={styles.field}>
                  <Text style={styles.label}>Status</Text>
                  <View style={styles.segmentedControl}>
                    {(['active', 'inactive'] as const).map((option) => {
                      return (
                        <Controller
                          key={option}
                          control={control}
                          name="status"
                          render={({ field: { onChange, value } }) => {
                            const isSelected = value === option
                            return (
                              <TouchableOpacity
                                style={[styles.segmentButton, isSelected ? styles.segmentButtonSelected : null]}
                                onPress={() => onChange(option)}
                              >
                                <Text
                                  style={[
                                    styles.segmentButtonText,
                                    isSelected ? styles.segmentButtonTextSelected : null,
                                  ]}
                                >
                                  {option.charAt(0).toUpperCase() + option.slice(1)}
                                </Text>
                              </TouchableOpacity>
                            )
                          }}
                        />
                      )
                    })}
                  </View>
                  {errors.status ? <Text style={styles.errorText}>{errors.status.message}</Text> : null}
                </View>

                <TouchableOpacity style={[styles.saveButton, saving ? styles.saveButtonDisabled : null]} onPress={handleSubmit(onSubmit)} disabled={saving}>
                  {saving ? (
                    <ActivityIndicator color={AppColors.white} />
                  ) : (
                    <Text style={styles.saveButtonText}>Save Changes</Text>
                  )}
                </TouchableOpacity>
              </View>

              <View style={styles.sectionHeader}>
                <View style={styles.sectionHeaderText}>
                  <Text style={styles.sectionTitle}>Sessions</Text>
                </View>
                <View style={styles.sessionsHeaderActions}>
                  <TouchableOpacity style={styles.addSessionButton} onPress={handleAddSession}>
                    <Feather name="plus" color={AppColors.white} size={16} />
                    <Text style={styles.addSessionButtonText}>Add Session</Text>
                  </TouchableOpacity>
                  {sessionsLoading ? <ActivityIndicator color={AppColors.blue} /> : null}
                </View>
              </View>

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
              </View>

              {sessionsLoadError ? (
                <View style={styles.errorCard}>
                  <Text style={styles.errorTitle}>Unable to load sessions</Text>
                  <Text style={styles.errorText}>{sessionsLoadError}</Text>
                  <TouchableOpacity style={styles.retryBtn} onPress={() => void loadSessions()}>
                    <Text style={styles.retryBtnText}>Try Again</Text>
                  </TouchableOpacity>
                </View>
              ) : sessions.length === 0 && !sessionsLoading ? (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyTitle}>No sessions yet</Text>
                  <Text style={styles.stateText}>This class does not have any sessions yet.</Text>
                </View>
              ) : visibleSessions.length === 0 && !sessionsLoading ? (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyTitle}>{activeSessionsLabel} sessions</Text>
                  <Text style={styles.stateText}>
                    {activeTab === 'upcoming'
                      ? 'No upcoming sessions right now. Add a new session to get started.'
                      : 'No past sessions yet.'}
                  </Text>
                </View>
              ) : (
                <View style={styles.sessionList}>
                  <Text style={styles.sectionTitle}>{activeSessionsLabel} sessions</Text>
                  {visibleSessions.map((session) => {
                    const price = Number(session?.price ?? 0)
                    const trainer = String(session?.trainer_display_name ?? '').trim()
                    const location = String(session?.location ?? '').trim()
                    const notes = String(session?.additional_notes ?? '').trim()
                    const status = String(session?.status ?? '').trim().toLowerCase()

                    return (
                      <View key={String(session?.session_uid ?? session?.uid ?? `${session?.class_uid}-${session?.start_at}`)} style={styles.sessionCard}>
                        <View style={styles.sessionHeader}>
                          <View style={styles.sessionHeaderText}>
                            <Text style={styles.sessionTitle}>{formatDate(session?.start_at)}</Text>
                            <Text style={styles.sessionSubtitle}>
                              {formatTime(session?.start_at)} - {formatTime(session?.end_at)}
                            </Text>
                          </View>
                          <View
                            style={[
                              styles.statusPill,
                              status === 'scheduled'
                                ? styles.statusScheduled
                                : status === 'completed'
                                  ? styles.statusCompleted
                                  : styles.statusCancelled,
                            ]}
                          >
                            <Text style={styles.statusText}>{renderSessionStatusLabel(status)}</Text>
                          </View>
                        </View>

                        <View style={styles.sessionMetaGrid}>
                          <View style={styles.metaItem}>
                            <Text style={styles.metaLabel}>Trainer</Text>
                            <Text style={styles.metaValue}>{trainer || 'TBA'}</Text>
                          </View>

                          <View style={styles.metaItem}>
                            <Text style={styles.metaLabel}>Price</Text>
                            <Text style={styles.metaValue}>{formatPrice(session?.price, session?.currency_code)}</Text>
                          </View>
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

                        <TouchableOpacity style={styles.sessionEditButton} onPress={() => handleEditSession(session)}>
                          <Feather name="edit-2" color={AppColors.blue} size={16} />
                          <Text style={styles.sessionEditButtonText}>Edit Session</Text>
                        </TouchableOpacity>
                      </View>
                    )
                  })}
                </View>
              )}
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

export default EditClassScreen

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.white,
  },
  flex: {
    flex: 1,
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 28,
  },
  centerState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  stateText: {
    color: AppColors.grey3,
    fontFamily: 'Montserrat',
    fontSize: 14,
    marginTop: 12,
    textAlign: 'center',
  },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  emptyTitle: {
    color: AppColors.blue,
    fontFamily: 'Montserrat',
    fontSize: 18,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorCard: {
    backgroundColor: AppColors.grey,
    borderRadius: 18,
    padding: 18,
    marginTop: 12,
  },
  errorTitle: {
    color: AppColors.blue,
    fontFamily: 'Montserrat',
    fontSize: 18,
    marginBottom: 8,
  },
  errorText: {
    color: AppColors.grey3,
    fontFamily: 'Montserrat',
    fontSize: 14,
    lineHeight: 20,
  },
  retryBtn: {
    marginTop: 16,
    backgroundColor: AppColors.blue,
    borderRadius: 999,
    alignSelf: 'flex-start',
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  retryBtnText: {
    color: AppColors.white,
    fontFamily: 'Montserrat',
    fontSize: 14,
  },
  card: {
    backgroundColor: AppColors.grey,
    borderRadius: 20,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginTop: 18,
    marginBottom: 12,
  },
  sectionHeaderText: {
    flex: 1,
    marginRight: 12,
  },
  sessionsHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sectionTitle: {
    color: AppColors.blue,
    fontFamily: 'Montserrat',
    fontSize: 20,
  },
  filterBar: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
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
    backgroundColor: AppColors.blue,
    borderColor: AppColors.blue,
  },
  filterButtonText: {
    color: AppColors.primary,
    fontFamily: 'Montserrat',
    fontSize: 14,
  },
  filterButtonTextActive: {
    color: AppColors.white,
  },
  addSessionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: AppColors.blue,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  addSessionButtonText: {
    color: AppColors.white,
    fontFamily: 'Montserrat',
    fontSize: 13,
  },
  inlineMessage: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  inlineMessageText: {
    color: AppColors.primary,
    fontFamily: 'Montserrat',
    fontSize: 14,
    lineHeight: 20,
  },
  field: {
    marginTop: 14,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 14,
  },
  rowField: {
    flex: 1,
    marginTop: 0,
  },
  label: {
    color: AppColors.blue,
    fontFamily: 'Montserrat',
    fontSize: 14,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: AppColors.grey,
    borderRadius: 12,
    minHeight: 48,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: AppColors.primary,
    fontFamily: 'Montserrat',
    backgroundColor: AppColors.white,
  },
  multilineInput: {
    minHeight: 100,
  },
  segmentedControl: {
    flexDirection: 'row',
    gap: 10,
  },
  segmentButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: AppColors.grey,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: AppColors.white,
  },
  segmentButtonSelected: {
    backgroundColor: AppColors.blue,
    borderColor: AppColors.blue,
  },
  segmentButtonText: {
    color: AppColors.primary,
    fontFamily: 'Montserrat',
    fontSize: 14,
  },
  segmentButtonTextSelected: {
    color: AppColors.white,
  },
  saveButton: {
    backgroundColor: AppColors.blue,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
    marginTop: 22,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: AppColors.white,
    fontSize: 16,
  },
  statusPill: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  statusActive: {
    backgroundColor: '#E8F5E9',
  },
  statusInactive: {
    backgroundColor: '#F3F4F6',
  },
  statusScheduled: {
    backgroundColor: '#E8F5E9',
  },
  statusCompleted: {
    backgroundColor: '#DBEAFE',
  },
  statusCancelled: {
    backgroundColor: '#F3F4F6',
  },
  statusText: {
    color: AppColors.blue,
    fontFamily: 'Montserrat',
    fontSize: 12,
  },
  sessionList: {
    gap: 14,
    marginTop: 2,
  },
  sessionCard: {
    backgroundColor: AppColors.grey,
    borderRadius: 18,
    padding: 16,
  },
  sessionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  sessionHeaderText: {
    flex: 1,
  },
  sessionTitle: {
    color: AppColors.blue,
    fontFamily: 'Montserrat-Bold',
    fontSize: 18,
    marginBottom: 4,
  },
  sessionSubtitle: {
    color: AppColors.primary,
    fontFamily: 'Montserrat',
    fontSize: 14,
  },
  sessionMetaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 16,
  },
  metaItem: {
    width: '48%',
  },
  metaLabel: {
    color: AppColors.grey3,
    fontFamily: 'Montserrat',
    fontSize: 12,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  metaValue: {
    color: AppColors.primary,
    fontFamily: 'Montserrat',
    fontSize: 14,
    lineHeight: 20,
  },
  detailSection: {
    marginTop: 12,
  },
  detailValue: {
    color: AppColors.primary,
    fontFamily: 'Montserrat',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
  },
  sessionEditButton: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: AppColors.blue,
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: AppColors.white,
    height: 50,
  },
  sessionEditButtonText: {
    color: AppColors.blue,
    fontFamily: 'Montserrat',
    fontSize: 14,
  },
})