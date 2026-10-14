// @ts-nocheck
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

const normalizeToken = (value) => String(value ?? '').trim()

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

  if (response.status !== 401) {
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

type UserContextValue = {
  user?: {
    gym_id?: number | string
    role?: string | null
  } | null
  tokens?: RefreshTokens | null
  setTokens: (value: RefreshTokens | null | ((prev: RefreshTokens | null) => RefreshTokens | null)) => void
  webServer: string
}

type AddClassSessionRoute = {
  params?: {
    classUid?: number | string
  }
}

type AddClassSessionNavigation = {
  goBack: () => void
}

type TrainerOption = {
  key: string
  value: string
}

type ClassRecord = {
  uid?: number
  name?: string
  description?: string | null
  capacity?: number | null
  price?: number | string | null
  currency_code?: string | null
  status?: string | null
}

type ClassResponse = {
  class?: ClassRecord
  message?: string
}

type SessionCreateFormInput = {
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

type SessionCreateFormValues = Partial<SessionCreateFormInput>

type TrainerResponse = {
  trainers?: Array<{
    gym_user_id?: number | string
    uid?: number | string
    fname?: string
    lname?: string
  }>
}

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/

const getTodayDateValue = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const sessionSchema = yup
  .object({
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
  .test('start-before-end', 'Start must be before end', function (values) {
    const startDate = String(values?.start_date ?? '').trim()
    const startTime = String(values?.start_time ?? '').trim()
    const endDate = String(values?.end_date ?? '').trim()
    const endTime = String(values?.end_time ?? '').trim()

    if (
      !DATE_PATTERN.test(startDate) ||
      !TIME_PATTERN.test(startTime) ||
      !DATE_PATTERN.test(endDate) ||
      !TIME_PATTERN.test(endTime)
    ) {
      return true
    }

    const startAt = new Date(`${startDate}T${startTime.length === 5 ? `${startTime}:00` : startTime}`)
    const endAt = new Date(`${endDate}T${endTime.length === 5 ? `${endTime}:00` : endTime}`)

    if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime())) {
      return true
    }

    if (startAt.getTime() >= endAt.getTime()) {
      return this.createError({
        path: 'end_time',
        message: 'Start must be before end',
      })
    }

    return true
  })

const buildDateTimeValue = (dateValue: string, timeValue: string) => {
  const date = String(dateValue ?? '').trim()
  const time = String(timeValue ?? '').trim()
  if (!date || !time) {
    return null
  }

  return `${date} ${time.length === 5 ? `${time}:00` : time}`
}

const AddClassSessionScreen = ({ navigation, route }: { navigation: AddClassSessionNavigation; route: AddClassSessionRoute }) => {
  const { user, tokens, setTokens, webServer } = useContext(UserContext) as UserContextValue
  const classUid = Number(route?.params?.classUid ?? 0)
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadingError, setLoadingError] = useState('')
  const [serverMessage, setServerMessage] = useState('')
  const [trainerOptions, setTrainerOptions] = useState<TrainerOption[]>([])
  const [classInfo, setClassInfo] = useState<ClassRecord | null>(null)

  const isOwner = String(user?.role ?? '').trim().toLowerCase() === 'owner'

  const defaultValues = useMemo<SessionCreateFormInput>(() => ({
    start_date: getTodayDateValue(),
    start_time: '',
    end_date: getTodayDateValue(),
    end_time: '',
    trainer_gym_user_id: '',
    location: '',
    additional_notes: '',
    capacity: '',
    price: '',
    currency_code: 'USD',
    status: 'scheduled',
  }), [])

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<SessionCreateFormInput, unknown, SessionCreateFormValues>({
    resolver: yupResolver(sessionSchema),
    defaultValues,
    mode: 'onSubmit',
  })

  const statusValue = watch('status')

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

  const readResponseBody = useCallback(async (response: Response) => {
    const responseText = await response.text()
    if (!responseText) {
      return {}
    }

    try {
      return JSON.parse(responseText)
    } catch {
      return { message: responseText }
    }
  }, [])

  const loadClassAndTrainers = useCallback(async () => {
    if (!classUid || Number.isNaN(classUid) || classUid <= 0) {
      setLoading(false)
      setLoadingError('Invalid class selected.')
      return
    }

    if (!tokens?.access_token || !user?.gym_id) {
      setLoading(false)
      setLoadingError('Please sign in again to create class sessions.')
      return
    }

    setLoading(true)
    setLoadingError('')
    setServerMessage('')

    try {
      const [classResponse, staffResponse] = await Promise.all([
        performAuthenticatedRequest(`${webServer}/api/v1/classes/${classUid}`),
        performAuthenticatedRequest(`${webServer}/api/v1/gyms/${user.gym_id}/staff`),
      ])

      if (!classResponse) {
        setLoadingError('Please sign in again to create class sessions.')
        return
      }

      const classBody: ClassResponse = await readResponseBody(classResponse)
      if (classResponse.status === 401 || classResponse.status === 403) {
        const message = classBody?.message || 'Your session expired. Please sign in again.'
        setLoadingError(message)
        showMessage({
          message: 'Authentication required',
          description: message,
          type: 'danger',
        })
        return
      }

      if (classResponse.status !== 200 || !classBody?.class) {
        const message = classBody?.message || 'Unable to load class.'
        setLoadingError(message)
        showMessage({
          message: 'Class unavailable',
          description: message,
          type: 'danger',
        })
        return
      }

      setClassInfo(classBody.class)
      reset({
        ...defaultValues,
        capacity: String(classBody.class.capacity ?? ''),
        price: Number(classBody.class.price ?? 0).toFixed(2),
        currency_code: String(classBody.class.currency_code ?? 'USD').trim().toUpperCase(),
      })

      if (!staffResponse) {
        setTrainerOptions([])
        return
      }

      if (staffResponse.status === 401 || staffResponse.status === 403) {
        const staffBody = await readResponseBody(staffResponse)
        const message = staffBody?.message || 'Unable to load trainers.'
        setTrainerOptions([])
        setLoadingError(message)
        showMessage({
          message: 'Trainers unavailable',
          description: message,
          type: 'danger',
        })
        return
      }

      if (staffResponse.status === 200) {
        const payload = (await readResponseBody(staffResponse)) as TrainerResponse
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
      } else {
        setTrainerOptions([])
      }
    } catch {
      setLoadingError('Unable to load class session data.')
      showMessage({
        message: 'Class session unavailable',
        description: 'Unable to load class session data.',
        type: 'danger',
      })
    } finally {
      setLoading(false)
    }
  }, [classUid, defaultValues, performAuthenticatedRequest, readResponseBody, reset, tokens?.access_token, user?.gym_id, webServer])

  useEffect(() => {
    void loadClassAndTrainers()
  }, [loadClassAndTrainers])

  const onSubmit = useCallback(
    async (formData: SessionCreateFormInput) => {
      if (submitting) {
        return
      }

      if (!classUid || Number.isNaN(classUid) || classUid <= 0) {
        setLoadingError('Invalid class selected.')
        return
      }

      setSubmitting(true)
      setServerMessage('')

      try {
        const payload = {
          start_at: buildDateTimeValue(String(formData.start_date ?? ''), String(formData.start_time ?? '')),
          end_at: buildDateTimeValue(String(formData.end_date ?? ''), String(formData.end_time ?? '')),
          trainer_gym_user_id:
            String(formData.trainer_gym_user_id ?? '').trim() === ''
              ? null
              : Number.parseInt(String(formData.trainer_gym_user_id ?? ''), 10),
          location: String(formData.location ?? '').trim() === '' ? null : String(formData.location ?? '').trim(),
          additional_notes:
            String(formData.additional_notes ?? '').trim() === ''
              ? null
              : String(formData.additional_notes ?? '').trim(),
          capacity: Number.parseInt(String(formData.capacity ?? ''), 10),
          price: Number.parseFloat(String(formData.price ?? '0')),
          currency_code: String(formData.currency_code ?? 'USD').trim().toUpperCase(),
          status: formData.status ?? 'scheduled',
        }

        const response = await performAuthenticatedRequest(`${webServer}/api/v1/classes/${classUid}/sessions`, {
          method: 'POST',
          body: JSON.stringify(payload),
        })

        if (!response) {
          const message = 'Please sign in again to create class sessions.'
          setServerMessage(message)
          showMessage({
            message: 'Create failed',
            description: message,
            type: 'danger',
          })
          return
        }

        const responseBody = await readResponseBody(response)

        if (response.status === 201) {
          showMessage({
            message: 'Class session created',
            description: responseBody?.message || 'The class session was created successfully.',
            type: 'success',
          })
          navigation.goBack()
          return
        }

        if (response.status === 400) {
          const message = Array.isArray(responseBody?.errors) && responseBody.errors.length > 0
            ? responseBody.errors[0]
            : responseBody?.message || 'Please check the class session details and try again.'
          setServerMessage(message)
          showMessage({
            message: 'Validation error',
            description: message,
            type: 'danger',
          })
          return
        }

        if (response.status === 401) {
          const message = responseBody?.message || 'Please sign in again to create class sessions.'
          setServerMessage(message)
          showMessage({
            message: 'Authentication required',
            description: message,
            type: 'danger',
          })
          return
        }

        if (response.status === 403) {
          const message = responseBody?.message || 'You do not have permission to create class sessions.'
          setServerMessage(message)
          showMessage({
            message: 'Permission denied',
            description: message,
            type: 'danger',
          })
          return
        }

        if (response.status === 409) {
          const message = responseBody?.message || 'Unable to create class session.'
          setServerMessage(message)
          showMessage({
            message: 'Create failed',
            description: message,
            type: 'danger',
          })
          return
        }

        const message = responseBody?.message || 'Unable to create class session.'
        setServerMessage(message)
        showMessage({
          message: 'Create failed',
          description: message,
          type: 'danger',
        })
      } catch {
        const message = 'Unable to create class session.'
        setServerMessage(message)
        showMessage({
          message: 'Create failed',
          description: message,
          type: 'danger',
        })
      } finally {
        setSubmitting(false)
      }
    },
    [classUid, performAuthenticatedRequest, readResponseBody, submitting, webServer, navigation]
  )

  if (!isOwner) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.navs}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Feather name="arrow-left" color={AppColors.blue} size={36} />
          </TouchableOpacity>
          <Text style={styles.title}>Add Session</Text>
          <View style={styles.spacer} />
        </View>

        <View style={styles.centerState}>
          <Text style={styles.emptyTitle}>Owner access required</Text>
          <Text style={styles.stateText}>This screen is only available to gym owners.</Text>
        </View>
      </SafeAreaView>
    )
  }

  if (loading && loadingError === '') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.navs}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Feather name="arrow-left" color={AppColors.blue} size={36} />
          </TouchableOpacity>
          <Text style={styles.title}>Add Session</Text>
          <View style={styles.spacer} />
        </View>

        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={AppColors.blue} />
          <Text style={styles.stateText}>Loading class session form...</Text>
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
        <Text style={styles.title}>Add Session</Text>
        <View style={styles.spacer} />
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {loadingError ? (
            <View style={styles.errorCard}>
              <Text style={styles.errorTitle}>Unable to load class</Text>
              <Text style={styles.errorText}>{loadingError}</Text>
              <TouchableOpacity style={styles.retryBtn} onPress={() => void loadClassAndTrainers()}>
                <Text style={styles.retryBtnText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.card}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Class Session</Text>
                <View style={[styles.statusPill, statusValue === 'scheduled' ? styles.statusScheduled : statusValue === 'completed' ? styles.statusCompleted : styles.statusCancelled]}>
                  <Text style={styles.statusText}>{statusValue ? statusValue.charAt(0).toUpperCase() + statusValue.slice(1) : 'Scheduled'}</Text>
                </View>
              </View>

              {classInfo?.name ? (
                <View style={styles.inlineMessage}>
                  <Text style={styles.inlineMessageText}>{classInfo.name}</Text>
                </View>
              ) : null}

              {serverMessage ? (
                <View style={styles.inlineMessage}>
                  <Text style={styles.inlineMessageText}>{serverMessage}</Text>
                </View>
              ) : null}

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
                        data={[{ key: '', value: 'TBA' }, ...trainerOptions]}
                        save="key"
                        placeholder="Select trainer"
                        boxStyles={styles.selectBox}
                        dropdownStyles={styles.selectDropdown}
                        search={false}
                        {...(selectedTrainer ? { defaultOption: selectedTrainer } : {})}
                      />
                    )
                  }}
                />
                {trainerOptions.length === 0 ? <Text style={styles.helperText}>No trainers available for this gym.</Text> : null}
                {errors.trainer_gym_user_id ? <Text style={styles.errorText}>{errors.trainer_gym_user_id.message}</Text> : null}
              </View>

              <View style={styles.row}>
                <View style={[styles.field, styles.rowField]}>
                  <Text style={styles.label}>Start Date</Text>
                  <Controller
                    control={control}
                    name="start_date"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <DateOfBirthField value={value} onChange={onChange} onBlur={onBlur} />
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
                      <TimePickerField value={value} onChange={onChange} onBlur={onBlur} />
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
                      <DateOfBirthField value={value} onChange={onChange} onBlur={onBlur} />
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
                      <TimePickerField value={value} onChange={onChange} onBlur={onBlur} />
                    )}
                  />
                  {errors.end_time ? <Text style={styles.errorText}>{errors.end_time.message}</Text> : null}
                </View>
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
                    />
                  )}
                />
                {errors.location ? <Text style={styles.errorText}>{errors.location.message}</Text> : null}
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
                          const isSelected = value === option
                          return (
                            <TouchableOpacity
                              style={[styles.segmentButton, isSelected ? styles.segmentButtonSelected : null]}
                              onPress={() => onChange(option)}
                            >
                              <Text style={[styles.segmentButtonText, isSelected ? styles.segmentButtonTextSelected : null]}>
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
                      placeholder="Optional notes"
                      placeholderTextColor={AppColors.grey3}
                      style={[styles.input, styles.multilineInput]}
                      multiline
                      textAlignVertical="top"
                    />
                  )}
                />
                {errors.additional_notes ? <Text style={styles.errorText}>{errors.additional_notes.message}</Text> : null}
              </View>

              <TouchableOpacity style={[styles.saveButton, submitting ? styles.saveButtonDisabled : null]} onPress={handleSubmit(onSubmit)} disabled={submitting}>
                {submitting ? (
                  <ActivityIndicator color={AppColors.white} />
                ) : (
                  <Text style={styles.saveButtonText}>Create Session</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

export default AddClassSessionScreen

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
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    color: AppColors.blue,
    fontFamily: 'Montserrat',
    fontSize: 20,
  },
  statusPill: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  statusScheduled: {
    backgroundColor: AppColors.blue,
  },
  statusCancelled: {
    backgroundColor: AppColors.grey3,
  },
  statusCompleted: {
    backgroundColor: AppColors.grey3,
  },
  statusText: {
    color: AppColors.white,
    fontFamily: 'Montserrat',
    fontSize: 12,
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
    flexWrap: 'wrap',
  },
  segmentButton: {
    backgroundColor: AppColors.white,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: AppColors.grey,
  },
  segmentButtonSelected: {
    backgroundColor: AppColors.blue,
    borderColor: AppColors.blue,
  },
  segmentButtonText: {
    color: AppColors.primary,
    fontFamily: 'Montserrat',
    fontSize: 13,
  },
  segmentButtonTextSelected: {
    color: AppColors.white,
  },
  helperText: {
    color: AppColors.grey3,
    fontFamily: 'Montserrat',
    fontSize: 12,
    marginTop: 8,
  },
  saveButton: {
    backgroundColor: AppColors.blue,
    borderRadius: 999,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: AppColors.white,
    fontFamily: 'Montserrat',
    fontSize: 16,
  },
  selectBox: {
    borderColor: AppColors.grey,
    borderWidth: 1,
    borderRadius: 12,
    backgroundColor: AppColors.white,
    minHeight: 48,
  },
  selectDropdown: {
    borderColor: AppColors.grey,
    backgroundColor: AppColors.white,
  },
})