import { useContext, useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
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
import { showMessage } from 'react-native-flash-message'
import Feather from '@expo/vector-icons/Feather'
import { SelectList } from 'react-native-dropdown-select-list'
import { AppColors } from '../../styles/colors'
import { UserContext } from '../../context/UserContext'
import DateOfBirthField from '../../components/forms/input_fields/DateOfBirthField'
import TimePickerField from '../../components/forms/input_fields/TimePickerField'

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
  user?: {
    gym_id?: number | string
  } | null
  tokens?: RefreshTokens | null
  setTokens: (value: RefreshTokens | null | ((prev: RefreshTokens | null) => RefreshTokens | null)) => void
  webServer: string
}

type AddClassNavigation = {
  goBack: () => void
}

type AddClassFormValues = {
  name?: string
  description?: string
  duration_minutes?: string
  capacity?: string
  price?: string
  currency_code?: string
  status?: 'active' | 'inactive'
  session_start_date?: string
  session_start_time?: string
  session_end_date?: string
  session_end_time?: string
  session_capacity?: string
  session_price?: string
  session_status?: 'scheduled' | 'cancelled' | 'completed'
  trainer_gym_user_id?: string
  location?: string
  additional_notes?: string
}

type AddClassFormInput = {
  name: string
  description: string
  duration_minutes: string
  capacity: string
  price: string
  currency_code: string
  status: 'active' | 'inactive'
  session_start_date: string
  session_start_time: string
  session_end_date: string
  session_end_time: string
  session_capacity: string
  session_price: string
  session_status: 'scheduled' | 'cancelled' | 'completed'
  trainer_gym_user_id: string
  location: string
  additional_notes: string
}

type TrainerOption = {
  key: string
  value: string
}

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/

const addClassSchema = yup.object({
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
      if (!/^\d+$/.test(String(value ?? ''))) return true
      return Number(value) > 0
    }),
  capacity: yup
    .string()
    .trim()
    .required('Capacity is required')
    .test('capacity-integer', 'Capacity must be a whole number', (value) => /^\d+$/.test(String(value ?? '')))
    .test('capacity-positive', 'Capacity must be greater than 0', (value) => {
      if (!/^\d+$/.test(String(value ?? ''))) return true
      return Number(value) > 0
    }),
  price: yup
    .string()
    .trim()
    .required('Price is required')
    .test('price-format', 'Price must be a valid amount', (value) => /^\d+(\.\d{1,2})?$/.test(String(value ?? '')))
    .test('price-nonnegative', 'Price must be greater than or equal to 0', (value) => {
      if (!/^\d+(\.\d{1,2})?$/.test(String(value ?? ''))) return true
      return Number(value) >= 0
    }),
  currency_code: yup
    .string()
    .trim()
    .required('Currency is required')
    .matches(/^[A-Z]{3}$/, 'Currency must be 3 uppercase letters'),
  status: yup.mixed<'active' | 'inactive'>().oneOf(['active', 'inactive']).required('Status is required'),
  session_start_date: yup
    .string()
    .trim()
    .required('Session start date is required')
    .matches(DATE_PATTERN, 'Session start date must use YYYY-MM-DD'),
  session_start_time: yup
    .string()
    .trim()
    .required('Session start time is required')
    .matches(TIME_PATTERN, 'Session start time must use HH:MM'),
  session_end_date: yup
    .string()
    .trim()
    .required('Session end date is required')
    .matches(DATE_PATTERN, 'Session end date must use YYYY-MM-DD'),
  session_end_time: yup
    .string()
    .trim()
    .required('Session end time is required')
    .matches(TIME_PATTERN, 'Session end time must use HH:MM'),
  session_capacity: yup
    .string()
    .trim()
    .nullable()
    .test('session-capacity-integer', 'Session capacity must be a whole number', (value) => {
      if (!value) return true
      return /^\d+$/.test(String(value))
    })
    .test('session-capacity-positive', 'Session capacity must be greater than 0', (value) => {
      if (!value || !/^\d+$/.test(String(value))) return true
      return Number(value) > 0
    }),
  session_price: yup
    .string()
    .trim()
    .nullable()
    .test('session-price-format', 'Session price must be a valid amount', (value) => {
      if (!value) return true
      return /^\d+(\.\d{1,2})?$/.test(String(value))
    })
    .test('session-price-nonnegative', 'Session price must be greater than or equal to 0', (value) => {
      if (!value || !/^\d+(\.\d{1,2})?$/.test(String(value))) return true
      return Number(value) >= 0
    }),
  session_status: yup
    .mixed<'scheduled' | 'cancelled' | 'completed'>()
    .oneOf(['scheduled', 'cancelled', 'completed'])
    .required('Session status is required'),
  trainer_gym_user_id: yup.string().trim().nullable(),
  location: yup
    .string()
    .trim()
    .nullable()
    .max(255, 'Location must be 255 characters or fewer'),
  additional_notes: yup
    .string()
    .trim()
    .nullable(),
})

const AddClassScreen = ({ navigation }: { navigation: AddClassNavigation }) => {
  const { user, tokens, setTokens, webServer } = useContext(UserContext) as UserContextValue
  const [submitting, setSubmitting] = useState(false)
  const [serverMessage, setServerMessage] = useState('')
  const [trainerOptions, setTrainerOptions] = useState<TrainerOption[]>([])

  const defaultValues = useMemo<AddClassFormInput>(() => ({
    name: '',
    description: '',
    duration_minutes: '',
    capacity: '',
    price: '',
    currency_code: 'USD',
    status: 'active',
    session_start_date: '',
    session_start_time: '',
    session_end_date: '',
    session_end_time: '',
    session_capacity: '',
    session_price: '',
    session_status: 'scheduled',
    trainer_gym_user_id: '',
    location: '',
    additional_notes: '',
  }), [])

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<AddClassFormInput, unknown, AddClassFormValues>({
    resolver: yupResolver(addClassSchema),
    defaultValues,
    mode: 'onSubmit',
  })

  const statusValue = watch('status')
  const sessionStatusValue = watch('session_status')

  useEffect(() => {
    if (!user?.gym_id || !tokens?.access_token) {
      setTrainerOptions([])
      return
    }

    let isMounted = true

    const fetchTrainers = async () => {
      const response = await performAuthenticatedRequest(`${webServer}/api/v1/gyms/${user.gym_id}/staff`)
      if (!response) {
        if (isMounted) {
          setTrainerOptions([])
        }
        return
      }

      if (response.status !== 200) {
        if (isMounted) {
          setTrainerOptions([])
        }
        return
      }

      const payload = await response.json()
      const options = Array.isArray(payload?.trainers)
        ? payload.trainers
          .map((trainer: { gym_user_id?: number | string; fname?: string; lname?: string; uid?: number | string }) => {
            const gymUserId = trainer.gym_user_id ?? trainer.uid
            const firstName = String(trainer.fname ?? '').trim()
            const lastName = String(trainer.lname ?? '').trim()
            const fullName = `${firstName} ${lastName}`.trim()
            return gymUserId ? {
              key: String(gymUserId),
              value: fullName || `Trainer ${gymUserId}`,
            } : null
          })
          .filter((trainer: TrainerOption | null): trainer is TrainerOption => trainer !== null)
        : []

      if (isMounted) {
        setTrainerOptions(options)
      }
    }

    void fetchTrainers()

    return () => {
      isMounted = false
    }
  }, [tokens?.access_token, user?.gym_id, webServer])

  const performAuthenticatedRequest = async (
    endpoint: string,
    init = {} as RequestInit
  ): Promise<Response | null> => {
    return performAuthenticatedRequestWithRefresh({
      endpoint,
      init,
      accessToken: tokens?.access_token ?? null,
      refreshToken: tokens?.refresh_token ?? null,
      webServer,
      setTokens,
    })
  }

  const buildDateTimeValue = (dateValue: string, timeValue: string) => {
    const normalizedTime = timeValue.trim().length === 5 ? `${timeValue.trim()}:00` : timeValue.trim()
    return `${dateValue.trim()} ${normalizedTime}`
  }

  const onSubmit = async (formData: AddClassFormValues) => {
    if (submitting) {
      return
    }

    setSubmitting(true)
    setServerMessage('')

    try {
      const classPayload = {
        name: String(formData.name ?? '').trim(),
        description: String(formData.description ?? '').trim(),
        duration_minutes: Number.parseInt(formData.duration_minutes, 10),
        capacity: Number.parseInt(formData.capacity, 10),
        price: Number.parseFloat(formData.price),
        currency_code: String(formData.currency_code ?? 'USD').trim().toUpperCase(),
        status: formData.status,
      }

      const sessionCapacity = String(formData.session_capacity ?? '').trim()
      const sessionPrice = String(formData.session_price ?? '').trim()
      const sessionTrainer = String(formData.trainer_gym_user_id ?? '').trim()
      const location = String(formData.location ?? '').trim()
      const additionalNotes = String(formData.additional_notes ?? '').trim()
      const sessionPayload = {
        start_at: buildDateTimeValue(String(formData.session_start_date ?? ''), String(formData.session_start_time ?? '')),
        end_at: buildDateTimeValue(String(formData.session_end_date ?? ''), String(formData.session_end_time ?? '')),
        trainer_gym_user_id: sessionTrainer === '' ? null : Number.parseInt(sessionTrainer, 10),
        location: location === '' ? null : location,
        additional_notes: additionalNotes === '' ? null : additionalNotes,
        capacity: sessionCapacity === '' ? Number.parseInt(formData.capacity, 10) : Number.parseInt(sessionCapacity, 10),
        price: sessionPrice === '' ? Number.parseFloat(formData.price) : Number.parseFloat(sessionPrice),
        currency_code: String(formData.currency_code ?? 'USD').trim().toUpperCase(),
        status: formData.session_status ?? 'scheduled',
      }

      const response = await performAuthenticatedRequest(`${webServer}/api/v1/classes/with-session`, {
        method: 'POST',
        body: JSON.stringify({
          class: classPayload,
          session: sessionPayload,
        }),
      })

      if (!response) {
        setServerMessage('Please sign in again to create classes.')
        showMessage({
          message: 'Create failed',
          description: 'Please sign in again to create classes.',
          type: 'danger',
        })
        return
      }

      const responseText = await response.text()
      let responseBody: { message?: string; errors?: string[] } = {}
      if (responseText) {
        try {
          responseBody = JSON.parse(responseText)
        } catch {
          responseBody = { message: responseText }
        }
      }

      if (response.status === 201) {
        showMessage({
          message: 'Class created',
          description: responseBody?.message || 'Your class and first session have been created successfully.',
          type: 'success',
        })
        navigation.goBack()
        return
      }

      if (response.status === 401) {
        const message = 'Please sign in again to create classes.'
        setServerMessage(message)
        showMessage({
          message: 'Authentication required',
          description: message,
          type: 'danger',
        })
        return
      }

      if (response.status === 400) {
        const message = Array.isArray(responseBody?.errors) && responseBody.errors.length > 0
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

      if (response.status === 403) {
        const message = responseBody?.message || 'You do not have permission to create classes.'
        setServerMessage(message)
        showMessage({
          message: 'Permission denied',
          description: message,
          type: 'danger',
        })
        return
      }

      if (response.status === 409) {
        const message = responseBody?.message || 'A class with this name already exists for this gym.'
        setServerMessage(message)
        showMessage({
          message: 'Duplicate class',
          description: message,
          type: 'danger',
        })
        return
      }

      const message = responseBody?.message || 'Unable to create class.'
      setServerMessage(message)
      showMessage({
        message: 'Create failed',
        description: message,
        type: 'danger',
      })
    } catch {
      const message = 'Unable to create class.'
      setServerMessage(message)
      showMessage({
        message: 'Create failed',
        description: message,
        type: 'danger',
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.navs}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="arrow-left" color={AppColors.blue} size={36} />
        </TouchableOpacity>
        <Text style={styles.title}>Add Class</Text>
        <View style={styles.spacer} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Class Information</Text>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Class Name</Text>
              <Controller
                control={control}
                name="name"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    value={value}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    placeholder="Enter class name"
                    placeholderTextColor={AppColors.grey3}
                    style={styles.input}
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
                    placeholder="Enter class description"
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
                <Text style={styles.label}>Duration</Text>
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
                <Text style={styles.label}>Currency</Text>
                <View style={[styles.input, styles.readOnlyInput]}>
                  <Text style={styles.readOnlyText}>USD</Text>
                </View>
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Status</Text>
              <View style={styles.segmentedControl}>
                {(['active', 'inactive'] as const).map((option) => {
                  const selected = statusValue === option
                  return (
                    <Controller
                      key={option}
                      control={control}
                      name="status"
                      render={({ field: { onChange } }) => (
                        <TouchableOpacity
                          style={[styles.segmentButton, selected ? styles.segmentButtonSelected : null]}
                          onPress={() => onChange(option)}
                        >
                          <Text style={[styles.segmentButtonText, selected ? styles.segmentButtonTextSelected : null]}>
                            {option.charAt(0).toUpperCase() + option.slice(1)}
                          </Text>
                        </TouchableOpacity>
                      )}
                    />
                  )
                })}
              </View>
              {errors.status ? <Text style={styles.errorText}>{errors.status.message}</Text> : null}
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>First Session</Text>
            </View>

            <View style={styles.row}>
              <View style={[styles.field, styles.rowField]}>
                <Text style={styles.label}>Start Date</Text>
                <Controller
                  control={control}
                  name="session_start_date"
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
                {errors.session_start_date ? <Text style={styles.errorText}>{errors.session_start_date.message}</Text> : null}
              </View>

              <View style={[styles.field, styles.rowField]}>
                <Text style={styles.label}>Start Time</Text>
                <Controller
                  control={control}
                  name="session_start_time"
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
                {errors.session_start_time ? <Text style={styles.errorText}>{errors.session_start_time.message}</Text> : null}
              </View>
            </View>

            <View style={styles.row}>
              <View style={[styles.field, styles.rowField]}>
                <Text style={styles.label}>End Date</Text>
                <Controller
                  control={control}
                  name="session_end_date"
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
                {errors.session_end_date ? <Text style={styles.errorText}>{errors.session_end_date.message}</Text> : null}
              </View>

              <View style={[styles.field, styles.rowField]}>
                <Text style={styles.label}>End Time</Text>
                <Controller
                  control={control}
                  name="session_end_time"
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
                {errors.session_end_time ? <Text style={styles.errorText}>{errors.session_end_time.message}</Text> : null}
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
                    <SelectList
                      setSelected={(selectedValue) => onChange(String(selectedValue ?? ''))}
                      data={trainerOptions}
                      save="key"
                      placeholder="Select trainer (optional)"
                      boxStyles={styles.selectBox}
                      dropdownStyles={styles.selectDropdown}
                      search={false}
                      {...(selectedTrainer ? { defaultOption: selectedTrainer } : {})}
                    />
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
                    placeholder="Optional notes for the first session"
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
                <Text style={styles.label}>Session Capacity</Text>
                <Controller
                  control={control}
                  name="session_capacity"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      value={value}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      placeholder="Defaults to class capacity"
                      placeholderTextColor={AppColors.grey3}
                      style={styles.input}
                      keyboardType="number-pad"
                    />
                  )}
                />
                {errors.session_capacity ? <Text style={styles.errorText}>{errors.session_capacity.message}</Text> : null}
              </View>

              <View style={[styles.field, styles.rowField]}>
                <Text style={styles.label}>Session Price</Text>
                <Controller
                  control={control}
                  name="session_price"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      value={value}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      placeholder="Defaults to class price"
                      placeholderTextColor={AppColors.grey3}
                      style={styles.input}
                      keyboardType="decimal-pad"
                    />
                  )}
                />
                {errors.session_price ? <Text style={styles.errorText}>{errors.session_price.message}</Text> : null}
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Session Status</Text>
              <View style={styles.segmentedControl}>
                {(['scheduled', 'cancelled', 'completed'] as const).map((option) => {
                  const selected = sessionStatusValue === option
                  return (
                    <Controller
                      key={option}
                      control={control}
                      name="session_status"
                      render={({ field: { onChange } }) => (
                        <TouchableOpacity
                          style={[styles.segmentButton, selected ? styles.segmentButtonSelected : null]}
                          onPress={() => onChange(option)}
                        >
                          <Text style={[styles.segmentButtonText, selected ? styles.segmentButtonTextSelected : null]}>
                            {option.charAt(0).toUpperCase() + option.slice(1)}
                          </Text>
                        </TouchableOpacity>
                      )}
                    />
                  )
                })}
              </View>
              {errors.session_status ? <Text style={styles.errorText}>{errors.session_status.message}</Text> : null}
            </View>

            {serverMessage ? <Text style={styles.serverMessage}>{serverMessage}</Text> : null}

            <TouchableOpacity
              style={[styles.submitButton, submitting ? styles.submitButtonDisabled : null]}
              onPress={handleSubmit(onSubmit)}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color={AppColors.white} />
              ) : (
                <Text style={styles.submitButtonText}>Create Class</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

export default AddClassScreen

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.grey,
  },
  flex: {
    flex: 1,
  },
  navs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingLeft: 24,
    paddingRight: 24,
    paddingTop: 8,
    paddingBottom: 8,
  },
  backBtn: {
    width: 36,
  },
  spacer: {
    width: 36,
  },
  title: {
    color: AppColors.blue,
    fontFamily: 'Montserrat',
    fontSize: 28,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 28,
  },
  card: {
    borderWidth: 1,
    borderColor: AppColors.grey,
    borderRadius: 20,
    padding: 18,
    backgroundColor: AppColors.white,
    marginTop: 12,
  },
  sectionHeader: {
    marginTop: 12,
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.grey,
  },
  sectionTitle: {
    color: AppColors.blue,
    fontSize: 20,
  },
  field: {
    marginBottom: 18,
  },
  label: {
    color: AppColors.blue,
    fontSize: 14,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: AppColors.grey,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: AppColors.blue,
    fontSize: 16,
    backgroundColor: AppColors.grey,
  },
  multilineInput: {
    minHeight: 110,
  },
  readOnlyInput: {
    justifyContent: 'center',
  },
  readOnlyText: {
    color: AppColors.blue,
    fontSize: 16,
  },
  selectBox: {
    borderWidth: 1,
    borderColor: AppColors.grey,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: AppColors.grey,
  },
  selectDropdown: {
    borderWidth: 1,
    borderColor: AppColors.grey2,
    marginTop: 8,
    borderRadius: 12,
  },
  helperText: {
    color: AppColors.grey3,
    fontSize: 12,
    marginTop: 6,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  rowField: {
    flex: 1,
  },
  errorText: {
    color: AppColors.red,
    fontSize: 12,
    marginTop: 6,
  },
  segmentedControl: {
    flexDirection: 'row',
    gap: 12,
  },
  segmentButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: AppColors.grey,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: AppColors.white,
  },
  segmentButtonSelected: {
    borderColor: AppColors.blue,
    backgroundColor: AppColors.grey,
  },
  segmentButtonText: {
    color: AppColors.primary,
    fontSize: 15,
  },
  segmentButtonTextSelected: {
    color: AppColors.blue,
  },
  serverMessage: {
    color: AppColors.red,
    fontSize: 14,
    marginBottom: 16,
  },
  submitButton: {
    backgroundColor: AppColors.blue,
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: AppColors.primary,
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
    height: 50,
  },
  submitButtonDisabled: {
    opacity: 0.75,
  },
  submitButtonText: {
    color: AppColors.white,
    fontSize: 16,
  },
})