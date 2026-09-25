import { useCallback, useContext, useEffect, useMemo, useState } from 'react'
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
import { Controller, useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { SelectList } from 'react-native-dropdown-select-list'
import { Feather } from '@expo/vector-icons'
import { showMessage } from 'react-native-flash-message'
import { AppColors } from '../../styles/colors'
import { UserContext } from '../../context/UserContext'
import DateOfBirthField from '../../components/forms/input_fields/DateOfBirthField'
import TimePickerField from '../../components/forms/input_fields/TimePickerField'
import { performAuthenticatedRequest as performAuthenticatedRequestWithRefresh } from '../../utils/authenticatedRequest'

type RefreshTokens = {
  access_token?: string
  refresh_token?: string
}

type UserContextValue = {
  user?: {
    gym_id?: number | string
  } | null
  tokens?: RefreshTokens | null
  setTokens: (value: RefreshTokens | null | ((prev: RefreshTokens | null) => RefreshTokens | null)) => void
  webServer: string
}

type EditClassSessionRoute = {
  params?: {
    classUid?: number | string
    sessionUid?: number | string
    session?: ClassSessionRecord | null
  }
}

type EditClassSessionNavigation = {
  goBack: () => void
}

type TrainerOption = {
  key: string
  value: string
}

type ClassSessionRecord = {
  uid?: number
  session_uid?: number
  gym_id?: number
  class_uid?: number
  class_name?: string
  class_description?: string | null
  duration_minutes?: number
  trainer_gym_user_id?: number | null
  trainer_user_uid?: number | null
  trainer_display_name?: string | null
  start_at?: string | null
  end_at?: string | null
  location?: string | null
  additional_notes?: string | null
  capacity?: number | null
  booked_count?: number
  active_booking_count?: number
  available_capacity?: number | null
  price?: number | string | null
  currency_code?: string | null
  status?: string | null
}

type SessionDetailResponse = {
  message?: string
  errors?: string[]
  session?: ClassSessionRecord
}

type TrainerResponse = {
  trainers?: Array<{
    gym_user_id?: number | string
    uid?: number | string
    fname?: string
    lname?: string
  }>
}

type EditClassSessionFormInput = {
  start_date: string
  start_time: string
  end_date: string
  end_time: string
  trainer_gym_user_id: string
  location: string
  additional_notes: string
  capacity: string
  price: string
  currency_code: string
  status: 'scheduled' | 'cancelled' | 'completed'
}

type EditClassSessionFormValues = {
  start_date?: string
  start_time?: string
  end_date?: string
  end_time?: string
  trainer_gym_user_id?: string
  location?: string
  additional_notes?: string
  capacity?: string
  price?: string
  currency_code?: string
  status?: 'scheduled' | 'cancelled' | 'completed'
}

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/

const sessionSchema = yup.object({
  start_date: yup
    .string()
    .trim()
    .required('Start date is required')
    .matches(DATE_PATTERN, 'Start date must use YYYY-MM-DD'),
  start_time: yup
    .string()
    .trim()
    .required('Start time is required')
    .matches(TIME_PATTERN, 'Start time must use HH:MM'),
  end_date: yup
    .string()
    .trim()
    .required('End date is required')
    .matches(DATE_PATTERN, 'End date must use YYYY-MM-DD'),
  end_time: yup
    .string()
    .trim()
    .required('End time is required')
    .matches(TIME_PATTERN, 'End time must use HH:MM'),
  trainer_gym_user_id: yup.string().trim().nullable(),
  location: yup.string().trim().nullable().max(255, 'Location must be 255 characters or fewer'),
  additional_notes: yup.string().trim().nullable(),
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
  status: yup
    .mixed<'scheduled' | 'cancelled' | 'completed'>()
    .oneOf(['scheduled', 'cancelled', 'completed'])
    .required('Status is required'),
})

const parseDateTime = (value?: string | null) => {
  if (!value) {
    return null
  }

  const normalized = String(value).includes('T') ? String(value) : String(value).replace(' ', 'T')
  const date = new Date(normalized)
  return Number.isNaN(date.getTime()) ? null : date
}

const formatDateValue = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const formatTimeValue = (date: Date) => {
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
}

const splitDateTime = (value?: string | null) => {
  const parsed = parseDateTime(value)
  if (!parsed) {
    return {
      date: '',
      time: '',
    }
  }

  return {
    date: formatDateValue(parsed),
    time: formatTimeValue(parsed),
  }
}

const buildDateTimeValue = (dateValue: string, timeValue: string) => {
  const date = String(dateValue ?? '').trim()
  const time = String(timeValue ?? '').trim()
  if (!date || !time) {
    return null
  }

  return `${date} ${time.length === 5 ? `${time}:00` : time}`
}

const renderSessionStatusLabel = (status?: string | null) => {
  const normalized = String(status ?? '').trim().toLowerCase()
  if (!normalized) {
    return 'Unknown'
  }

  return normalized.charAt(0).toUpperCase() + normalized.slice(1)
}

const renderPrice = (priceValue?: number | string | null, currencyCode?: string | null) => {
  const price = Number(priceValue ?? 0)
  if (price <= 0) {
    return 'Free'
  }

  const currency = String(currencyCode ?? '').trim().toUpperCase()
  return `${price.toFixed(2)} ${currency}`.trim()
}

const EditClassSessionScreen = ({ navigation, route }: { navigation: EditClassSessionNavigation; route: EditClassSessionRoute }) => {
  const { user, tokens, setTokens, webServer } = useContext(UserContext) as UserContextValue
  const classUid = Number(route?.params?.classUid ?? 0)
  const sessionUid = Number(route?.params?.sessionUid ?? 0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [loadingError, setLoadingError] = useState('')
  const [serverMessage, setServerMessage] = useState('')
  const [trainerOptions, setTrainerOptions] = useState<TrainerOption[]>([])
  const [activeBookingCount, setActiveBookingCount] = useState(0)
  const [currentSession, setCurrentSession] = useState<ClassSessionRecord | null>(route?.params?.session ?? null)

  const defaultValues = useMemo<EditClassSessionFormInput>(
    () => ({
      start_date: '',
      start_time: '',
      end_date: '',
      end_time: '',
      trainer_gym_user_id: '',
      location: '',
      additional_notes: '',
      capacity: '',
      price: '',
      currency_code: 'USD',
      status: 'scheduled',
    }),
    []
  )

  const {
    control,
    handleSubmit,
    reset,
    getValues,
    watch,
    formState: { errors },
  } = useForm<EditClassSessionFormInput, unknown, EditClassSessionFormValues>({
    resolver: yupResolver(sessionSchema),
    defaultValues,
    mode: 'onSubmit',
  })

  const trainerValue = watch('trainer_gym_user_id')
  const statusValue = watch('status')

  const performAuthenticatedRequest = useCallback(
    async (endpoint: string, init: RequestInit = {}): Promise<Response | null> => {
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

  const readResponseBody = useCallback(async (response: Response): Promise<SessionDetailResponse> => {
    const responseText = await response.text()
    if (!responseText) {
      return {}
    }

    try {
      return JSON.parse(responseText) as SessionDetailResponse
    } catch {
      return { message: responseText }
    }
  }, [])

  const normalizeSessionToForm = useCallback((session: ClassSessionRecord) => {
    const start = splitDateTime(session?.start_at)
    const end = splitDateTime(session?.end_at)

    reset({
      start_date: start.date,
      start_time: start.time,
      end_date: end.date,
      end_time: end.time,
      trainer_gym_user_id:
        session?.trainer_gym_user_id !== null && session?.trainer_gym_user_id !== undefined
          ? String(session.trainer_gym_user_id)
          : '',
      location: String(session?.location ?? ''),
      additional_notes: String(session?.additional_notes ?? ''),
      capacity: session?.capacity !== null && session?.capacity !== undefined ? String(session.capacity) : '',
      price: session?.price !== null && session?.price !== undefined ? Number(session.price).toFixed(2) : '',
      currency_code: String(session?.currency_code ?? 'USD').trim().toUpperCase() || 'USD',
      status: (String(session?.status ?? 'scheduled').trim().toLowerCase() as EditClassSessionFormInput['status']) || 'scheduled',
    })
    setActiveBookingCount(Number(session?.active_booking_count ?? 0))
  }, [reset])

  const loadTrainers = useCallback(async () => {
    if (!user?.gym_id || !tokens?.access_token) {
      setTrainerOptions([])
      return
    }

    const response = await performAuthenticatedRequest(`${webServer}/api/v1/gyms/${user.gym_id}/staff`)
    if (!response) {
      setTrainerOptions([])
      return
    }

    if (response.status !== 200) {
      setTrainerOptions([])
      return
    }

    const payload = (await response.json()) as TrainerResponse
    const options = Array.isArray(payload?.trainers)
      ? payload.trainers
          .map((trainer) => {
            const gymUserId = trainer.gym_user_id ?? trainer.uid
            const firstName = String(trainer.fname ?? '').trim()
            const lastName = String(trainer.lname ?? '').trim()
            const fullName = `${firstName} ${lastName}`.trim()
            return gymUserId
              ? {
                  key: String(gymUserId),
                  value: fullName || `Trainer ${gymUserId}`,
                }
              : null
          })
          .filter((trainer): trainer is TrainerOption => trainer !== null)
      : []

    setTrainerOptions(options)
  }, [performAuthenticatedRequest, tokens?.access_token, user?.gym_id, webServer])

  const loadSession = useCallback(async () => {
    if (!classUid || !sessionUid || Number.isNaN(classUid) || Number.isNaN(sessionUid)) {
      setLoading(false)
      setLoadingError('Invalid class session selected.')
      return
    }

    if (!tokens?.access_token) {
      setLoading(false)
      setLoadingError('Please sign in again to edit this session.')
      return
    }

    setLoading(true)
    setLoadingError('')
    setServerMessage('')

    try {
      const response = await performAuthenticatedRequest(`${webServer}/api/v1/classes/${classUid}/sessions/${sessionUid}`)
      if (!response) {
        setLoading(false)
        setLoadingError('Please sign in again to edit this session.')
        return
      }

      const responseBody = await readResponseBody(response)

      if (response.status === 401 || response.status === 403) {
        const message = 'Your session expired. Please sign in again.'
        setLoading(false)
        setLoadingError(message)
        showMessage({
          message: 'Authentication required',
          description: message,
          type: 'danger',
        })
        return
      }

      if (response.status !== 200) {
        const message = responseBody?.message || 'Unable to load class session.'
        setLoading(false)
        setLoadingError(message)
        showMessage({
          message: 'Class session unavailable',
          description: message,
          type: 'danger',
        })
        return
      }

      const session = responseBody?.session
      if (!session) {
        setLoading(false)
        setLoadingError('Session data is unavailable.')
        return
      }

      setCurrentSession(session)
      normalizeSessionToForm(session)
      setLoading(false)
    } catch {
      const message = 'Failed to load class session.'
      setLoading(false)
      setLoadingError(message)
      showMessage({
        message: 'Class session unavailable',
        description: message,
        type: 'danger',
      })
    }
  }, [classUid, normalizeSessionToForm, performAuthenticatedRequest, readResponseBody, sessionUid, tokens?.access_token, webServer])

  useEffect(() => {
    void loadTrainers()
  }, [loadTrainers])

  useEffect(() => {
    void loadSession()
  }, [loadSession])

  const onSubmit = useCallback(
    async (formData: EditClassSessionFormValues) => {
      if (saving) {
        return
      }

      if (!classUid || !sessionUid || Number.isNaN(classUid) || Number.isNaN(sessionUid)) {
        setLoadingError('Invalid class session selected.')
        return
      }

      setSaving(true)
      setServerMessage('')

      try {
        const startAt = buildDateTimeValue(String(formData.start_date ?? ''), String(formData.start_time ?? ''))
        const endAt = buildDateTimeValue(String(formData.end_date ?? ''), String(formData.end_time ?? ''))
        const trainerValueNormalized = String(formData.trainer_gym_user_id ?? '').trim()
        const locationValue = String(formData.location ?? '').trim()
        const notesValue = String(formData.additional_notes ?? '').trim()

        if (!startAt || !endAt) {
          setServerMessage('Start and end date/time are required.')
          setSaving(false)
          return
        }

        if (new Date(startAt.replace(' ', 'T')).getTime() >= new Date(endAt.replace(' ', 'T')).getTime()) {
          setServerMessage('Start at must be before end at.')
          setSaving(false)
          return
        }

        const requestedCapacity = Number.parseInt(String(formData.capacity ?? ''), 10)
        if (!Number.isInteger(requestedCapacity) || requestedCapacity <= 0) {
          setServerMessage('Capacity must be greater than 0.')
          setSaving(false)
          return
        }

        if (requestedCapacity < activeBookingCount) {
          setServerMessage('Capacity cannot be lower than the number of active bookings.')
          setSaving(false)
          return
        }

        if (trainerValueNormalized !== '' && !trainerOptions.some((option) => option.key === trainerValueNormalized)) {
          setServerMessage('Selected trainer must belong to this gym and be active.')
          setSaving(false)
          return
        }

        const response = await performAuthenticatedRequest(`${webServer}/api/v1/classes/${classUid}/sessions/${sessionUid}`, {
          method: 'PUT',
          body: JSON.stringify({
            start_at: startAt,
            end_at: endAt,
            trainer_gym_user_id: trainerValueNormalized === '' ? null : Number.parseInt(trainerValueNormalized, 10),
            location: locationValue === '' ? null : locationValue,
            additional_notes: notesValue === '' ? null : notesValue,
            capacity: requestedCapacity,
            price: Number.parseFloat(String(formData.price ?? '')),
            currency_code: String(formData.currency_code ?? 'USD').trim().toUpperCase(),
            status: formData.status ?? 'scheduled',
          }),
        })

        if (!response) {
          const message = 'Please sign in again to update class sessions.'
          setServerMessage(message)
          showMessage({
            message: 'Update failed',
            description: message,
            type: 'danger',
          })
          return
        }

        const responseBody = await readResponseBody(response)

        if (response.status === 200) {
          const updatedSession = responseBody?.session
          if (updatedSession) {
            setCurrentSession(updatedSession)
            normalizeSessionToForm(updatedSession)
          }

          showMessage({
            message: 'Session updated',
            description: responseBody?.message || 'The class session has been updated successfully.',
            type: 'success',
          })
          navigation.goBack()
          return
        }

        if (response.status === 401 || response.status === 403) {
          const message = responseBody?.message || 'Your session expired. Please sign in again.'
          setServerMessage(message)
          showMessage({
            message: 'Authentication required',
            description: message,
            type: 'danger',
          })
          return
        }

        if (response.status === 404) {
          const message = responseBody?.message || 'Class or session not found.'
          setServerMessage(message)
          showMessage({
            message: 'Not found',
            description: message,
            type: 'danger',
          })
          return
        }

        if (response.status === 409) {
          const message = responseBody?.message || 'Unable to update class session due to a capacity conflict.'
          setServerMessage(message)
          showMessage({
            message: 'Capacity conflict',
            description: message,
            type: 'danger',
          })
          return
        }

        if (response.status === 400) {
          const message =
            Array.isArray(responseBody?.errors) && responseBody.errors.length > 0
              ? responseBody.errors[0]
              : responseBody?.message || 'Please check the session details and try again.'
          setServerMessage(message)
          showMessage({
            message: 'Validation error',
            description: message,
            type: 'danger',
          })
          return
        }

        const message = responseBody?.message || 'Unable to update class session.'
        setServerMessage(message)
        showMessage({
          message: 'Update failed',
          description: message,
          type: 'danger',
        })
      } catch {
        const message = 'Network error while updating class session.'
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
    [activeBookingCount, classUid, navigation, normalizeSessionToForm, performAuthenticatedRequest, readResponseBody, saving, sessionUid, trainerOptions]
  )

  const clearTrainer = () => {
    reset({
      ...getValues(),
      trainer_gym_user_id: '',
    })
  }

  if (loading && loadingError === '') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.navs}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Feather name="arrow-left" color={AppColors.blue} size={36} />
          </TouchableOpacity>
          <Text style={styles.title}>Edit Session</Text>
          <View style={styles.spacer} />
        </View>
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={AppColors.blue} />
          <Text style={styles.stateText}>Loading session...</Text>
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
        <Text style={styles.title}>Edit Session</Text>
        <View style={styles.spacer} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {loadingError ? (
            <View style={styles.errorCard}>
              <Text style={styles.errorTitle}>Unable to load session</Text>
              <Text style={styles.errorText}>{loadingError}</Text>
              <TouchableOpacity style={styles.retryBtn} onPress={() => void loadSession()}>
                <Text style={styles.retryBtnText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.card}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionHeaderText}>
                  <Text style={styles.sectionTitle}>{currentSession?.class_name || 'Class session'}</Text>
                  <Text style={styles.sectionSubtitle}>
                    {renderPrice(currentSession?.price, currentSession?.currency_code)}
                  </Text>
                </View>
                <View
                  style={[
                    styles.statusPill,
                    statusValue === 'scheduled'
                      ? styles.statusScheduled
                      : statusValue === 'completed'
                        ? styles.statusCompleted
                        : styles.statusCancelled,
                  ]}
                >
                  <Text style={styles.statusText}>{renderSessionStatusLabel(statusValue)}</Text>
                </View>
              </View>

              {serverMessage ? (
                <View style={styles.inlineMessage}>
                  <Text style={styles.inlineMessageText}>{serverMessage}</Text>
                </View>
              ) : null}

              <View style={styles.row}>
                <View style={[styles.field, styles.rowField]}>
                  <Text style={styles.label}>Start Date</Text>
                  <Controller
                    control={control}
                    name="start_date"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <DateOfBirthField
                        value={value}
                        onChange={onChange}
                        onBlur={onBlur}
                        placeholder="Select start date"
                        title="Select start date"
                        maximumDate={null}
                      />
                    )}
                  />
                  {errors.start_date ? <Text style={styles.errorText}>{errors.start_date.message}</Text> : null}
                </View>

                <View style={[styles.field, styles.rowField]}>
                  <Text style={styles.label}>Start Time</Text>
                  <Controller
                    control={control}
                    name="start_time"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <TimePickerField
                        value={value}
                        onChange={onChange}
                        onBlur={onBlur}
                        placeholder="Select start time"
                        title="Select start time"
                      />
                    )}
                  />
                  {errors.start_time ? <Text style={styles.errorText}>{errors.start_time.message}</Text> : null}
                </View>
              </View>

              <View style={styles.row}>
                <View style={[styles.field, styles.rowField]}>
                  <Text style={styles.label}>End Date</Text>
                  <Controller
                    control={control}
                    name="end_date"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <DateOfBirthField
                        value={value}
                        onChange={onChange}
                        onBlur={onBlur}
                        placeholder="Select end date"
                        title="Select end date"
                        maximumDate={null}
                      />
                    )}
                  />
                  {errors.end_date ? <Text style={styles.errorText}>{errors.end_date.message}</Text> : null}
                </View>

                <View style={[styles.field, styles.rowField]}>
                  <Text style={styles.label}>End Time</Text>
                  <Controller
                    control={control}
                    name="end_time"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <TimePickerField
                        value={value}
                        onChange={onChange}
                        onBlur={onBlur}
                        placeholder="Select end time"
                        title="Select end time"
                      />
                    )}
                  />
                  {errors.end_time ? <Text style={styles.errorText}>{errors.end_time.message}</Text> : null}
                </View>
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Trainer</Text>
                <Controller
                  control={control}
                  name="trainer_gym_user_id"
                  render={({ field: { onChange, value } }) => {
                    const selectedTrainer = trainerOptions.find((trainer) => trainer.key === value)

                    return (
                      <>
                        <SelectList
                          key={`trainer-${value || 'empty'}`}
                          setSelected={(selectedValue) => onChange(String(selectedValue ?? ''))}
                          data={trainerOptions}
                          save="key"
                          placeholder="Select trainer (optional)"
                          boxStyles={styles.selectBox}
                          dropdownStyles={styles.selectDropdown}
                          search={false}
                          {...(selectedTrainer ? { defaultOption: selectedTrainer } : {})}
                        />
                        {value ? (
                          <TouchableOpacity style={styles.clearLink} onPress={clearTrainer}>
                            <Text style={styles.clearLinkText}>Clear trainer</Text>
                          </TouchableOpacity>
                        ) : null}
                      </>
                    )
                  }}
                />
                {trainerOptions.length === 0 ? <Text style={styles.helperText}>No trainers available for this gym.</Text> : null}
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Location</Text>
                <Controller
                  control={control}
                  name="location"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      value={value}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      placeholder="Optional location"
                      placeholderTextColor={AppColors.grey3}
                      style={styles.input}
                      maxLength={255}
                    />
                  )}
                />
                {errors.location ? <Text style={styles.errorText}>{errors.location.message}</Text> : null}
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Additional Notes</Text>
                <Controller
                  control={control}
                  name="additional_notes"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      value={value}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      placeholder="Optional notes for this session"
                      placeholderTextColor={AppColors.grey3}
                      style={[styles.input, styles.multilineInput]}
                      multiline
                      textAlignVertical="top"
                    />
                  )}
                />
                {errors.additional_notes ? <Text style={styles.errorText}>{errors.additional_notes.message}</Text> : null}
              </View>

              <View style={styles.row}>
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
              </View>

              <View style={styles.row}>
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

                <View style={[styles.field, styles.rowField]}>
                  <Text style={styles.label}>Status</Text>
                  <View style={styles.segmentedControl}>
                    {(['scheduled', 'cancelled', 'completed'] as const).map((option) => (
                      <Controller
                        key={option}
                        control={control}
                        name="status"
                        render={({ field: { onChange, value } }) => {
                          const selected = value === option
                          return (
                            <TouchableOpacity
                              style={[styles.segmentButton, selected ? styles.segmentButtonSelected : null]}
                              onPress={() => onChange(option)}
                            >
                              <Text style={[styles.segmentButtonText, selected ? styles.segmentButtonTextSelected : null]}>
                                {option.charAt(0).toUpperCase() + option.slice(1)}
                              </Text>
                            </TouchableOpacity>
                          )
                        }}
                      />
                    ))}
                  </View>
                  {errors.status ? <Text style={styles.errorText}>{errors.status.message}</Text> : null}
                </View>
              </View>

              <View style={styles.noticeBox}>
                <Text style={styles.noticeText}>
                  Active bookings: {activeBookingCount}
                  {currentSession?.available_capacity !== null && currentSession?.available_capacity !== undefined
                    ? ` · Available capacity: ${currentSession.available_capacity}`
                    : ''}
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.saveButton, saving ? styles.saveButtonDisabled : null]}
                onPress={handleSubmit(onSubmit)}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color={AppColors.white} />
                ) : (
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

export default EditClassSessionScreen

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
    gap: 12,
  },
  sectionHeaderText: {
    flex: 1,
  },
  sectionTitle: {
    color: AppColors.blue,
    fontFamily: 'Montserrat-Bold',
    fontSize: 20,
    marginBottom: 6,
  },
  sectionSubtitle: {
    color: AppColors.primary,
    fontFamily: 'Montserrat',
    fontSize: 14,
  },
  inlineMessage: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 12,
    marginTop: 14,
  },
  inlineMessageText: {
    color: AppColors.primary,
    fontFamily: 'Montserrat',
    fontSize: 14,
    lineHeight: 20,
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
  field: {
    marginTop: 14,
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
    minHeight: 96,
  },
  selectBox: {
    borderRadius: 12,
    borderColor: AppColors.grey,
    minHeight: 48,
  },
  selectDropdown: {
    borderRadius: 12,
    borderColor: AppColors.grey,
  },
  helperText: {
    color: AppColors.grey3,
    fontFamily: 'Montserrat',
    fontSize: 12,
    marginTop: 8,
  },
  clearLink: {
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  clearLinkText: {
    color: AppColors.blue,
    fontFamily: 'Montserrat',
    fontSize: 12,
    textDecorationLine: 'underline',
  },
  segmentedControl: {
    flexDirection: 'row',
    gap: 8,
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
    fontSize: 12,
  },
  segmentButtonTextSelected: {
    color: AppColors.white,
  },
  noticeBox: {
    backgroundColor: '#FEF3C7',
    borderRadius: 14,
    padding: 12,
    marginTop: 16,
  },
  noticeText: {
    color: AppColors.primary,
    fontFamily: 'Montserrat',
    fontSize: 14,
    lineHeight: 20,
  },
  saveButton: {
    backgroundColor: AppColors.blue,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    marginTop: 18,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: AppColors.white,
    fontFamily: 'Montserrat',
    fontSize: 16,
  },
  statusPill: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
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
  statusActive: {
    backgroundColor: '#E8F5E9',
  },
  statusInactive: {
    backgroundColor: '#F3F4F6',
  },
})
