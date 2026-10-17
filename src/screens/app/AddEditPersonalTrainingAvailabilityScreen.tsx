import { useContext, useEffect, useMemo, useState } from 'react'
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
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
  trainer_gym_user_id?: number
  trainer_display_name?: string | null
  day_of_week: number
  start_time_local: string
  end_time_local: string
  effective_start_date: string
  effective_end_date?: string | null
  status: string
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

type AddEditPersonalTrainingAvailabilityNavigation = {
  goBack: () => void
}

type AddEditPersonalTrainingAvailabilityRoute = {
  params?: {
    availability?: AvailabilityRule
    gymTimezone?: string | null
  } | null
}

type AvailabilityFormValues = {
  trainer_gym_user_id?: string
  day_of_week?: string
  start_time_local?: string
  end_time_local?: string
  effective_start_date?: string
  effective_end_date?: string
  status?: 'active' | 'inactive'
}

type AvailabilityFormInput = {
  trainer_gym_user_id: string
  day_of_week: string
  start_time_local: string
  end_time_local: string
  effective_start_date: string
  effective_end_date: string
  status: 'active' | 'inactive'
}

type TrainerOption = {
  key: string
  value: string
}

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/

// ISO weekdays, matching the API: 1 = Monday ... 7 = Sunday.
const WEEKDAYS = [
  { day: '1', label: 'Mon' },
  { day: '2', label: 'Tue' },
  { day: '3', label: 'Wed' },
  { day: '4', label: 'Thu' },
  { day: '5', label: 'Fri' },
  { day: '6', label: 'Sat' },
  { day: '7', label: 'Sun' },
]

const formatDateValue = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const toPickerDate = (value?: string) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value ?? ''))
  return match ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])) : undefined
}

const availabilitySchema = yup
  .object({
    trainer_gym_user_id: yup.string().trim(),
    day_of_week: yup
      .string()
      .trim()
      .required('Day is required')
      .matches(/^[1-7]$/, 'Day must be Monday through Sunday'),
    start_time_local: yup
      .string()
      .trim()
      .required('Start time is required')
      .matches(TIME_PATTERN, 'Start time must use HH:MM'),
    end_time_local: yup
      .string()
      .trim()
      .required('End time is required')
      .matches(TIME_PATTERN, 'End time must use HH:MM'),
    effective_start_date: yup
      .string()
      .trim()
      .required('Effective start date is required')
      .matches(DATE_PATTERN, 'Effective start date must use YYYY-MM-DD'),
    effective_end_date: yup
      .string()
      .trim()
      .test('end-date-format', 'Effective end date must use YYYY-MM-DD', (value) => !value || DATE_PATTERN.test(value)),
    status: yup
      .mixed<'active' | 'inactive'>()
      .oneOf(['active', 'inactive'])
      .required('Status is required'),
  })
  .test('availability-ranges', 'Invalid availability range', function (values) {
    const startTime = String(values?.start_time_local ?? '').trim()
    const endTime = String(values?.end_time_local ?? '').trim()
    if (TIME_PATTERN.test(startTime) && TIME_PATTERN.test(endTime) && startTime >= endTime) {
      return this.createError({
        path: 'end_time_local',
        message: 'Start time must be before end time',
      })
    }

    const startDate = String(values?.effective_start_date ?? '').trim()
    const endDate = String(values?.effective_end_date ?? '').trim()
    if (DATE_PATTERN.test(startDate) && DATE_PATTERN.test(endDate) && endDate < startDate) {
      return this.createError({
        path: 'effective_end_date',
        message: 'End date must not be before the start date',
      })
    }

    return true
  })

const AddEditPersonalTrainingAvailabilityScreen = ({
  navigation,
  route,
}: {
  navigation: AddEditPersonalTrainingAvailabilityNavigation
  route: AddEditPersonalTrainingAvailabilityRoute
}) => {
  const { user, tokens, setTokens, webServer } = useContext(UserContext) as UserContextValue
  const availability = route?.params?.availability ?? null
  const gymTimezone = route?.params?.gymTimezone ?? null
  const availabilityUid = Number(availability?.uid ?? 0)
  const isEdit = availabilityUid > 0
  const [submitting, setSubmitting] = useState(false)
  const [serverMessage, setServerMessage] = useState('')
  const [trainerOptions, setTrainerOptions] = useState<TrainerOption[]>([])

  const canManage = canManagePersonalTraining(user?.role)
  const isOwner = isOwnerRole(user?.role)

  const defaultValues = useMemo<AvailabilityFormInput>(() => ({
    trainer_gym_user_id: '',
    day_of_week: availability ? String(availability.day_of_week) : '1',
    start_time_local: String(availability?.start_time_local ?? '').slice(0, 5),
    end_time_local: String(availability?.end_time_local ?? '').slice(0, 5),
    effective_start_date: availability ? String(availability.effective_start_date ?? '').slice(0, 10) : formatDateValue(new Date()),
    effective_end_date: String(availability?.effective_end_date ?? '').slice(0, 10),
    status: String(availability?.status ?? 'active').trim().toLowerCase() === 'inactive' ? 'inactive' : 'active',
  }), [availability])

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    setError,
    formState: { errors },
  } = useForm<AvailabilityFormInput, unknown, AvailabilityFormValues>({
    resolver: yupResolver(availabilitySchema),
    defaultValues,
    mode: 'onSubmit',
  })

  const effectiveStartDate = watch('effective_start_date')
  const effectiveEndDate = watch('effective_end_date')

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

  // Only an Owner adding availability picks a trainer. A Trainer is always pinned to themselves by the API,
  // and the trainer of an existing rule is not editable.
  useEffect(() => {
    if (!isOwner || isEdit || !user?.gym_id || !tokens?.access_token) {
      setTrainerOptions([])
      return
    }

    let isMounted = true

    const fetchTrainers = async () => {
      const response = await performAuthenticatedRequest(`${webServer}/api/v1/gyms/${user.gym_id}/staff`)
      if (!response || response.status !== 200) {
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

              return gymUserId
                ? {
                    key: String(gymUserId),
                    value: fullName || `Trainer ${gymUserId}`,
                  }
                : null
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
  }, [isOwner, isEdit, tokens?.access_token, user?.gym_id, webServer])

  const onSubmit = async (formData: AvailabilityFormValues) => {
    if (submitting) {
      return
    }

    const actionLabel = isEdit ? 'Update' : 'Create'

    if (!tokens?.access_token) {
      const message = `Please sign in again to ${isEdit ? 'update' : 'create'} availability.`
      setServerMessage(message)
      showMessage({
        message: `${actionLabel} failed`,
        description: message,
        type: 'danger',
      })
      return
    }

    const trainerGymUserId = String(formData.trainer_gym_user_id ?? '').trim()
    const selectsTrainer = isOwner && !isEdit
    if (selectsTrainer && !/^\d+$/.test(trainerGymUserId)) {
      setError('trainer_gym_user_id', { message: 'Trainer is required' })
      return
    }

    setSubmitting(true)
    setServerMessage('')

    try {
      const endDate = String(formData.effective_end_date ?? '').trim()

      // Times are gym-local wall-clock values and are sent exactly as picked (no UTC conversion).
      const payload = {
        ...(selectsTrainer ? { trainer_gym_user_id: Number.parseInt(trainerGymUserId, 10) } : {}),
        day_of_week: Number.parseInt(String(formData.day_of_week ?? ''), 10),
        start_time_local: String(formData.start_time_local ?? '').trim(),
        end_time_local: String(formData.end_time_local ?? '').trim(),
        effective_start_date: String(formData.effective_start_date ?? '').trim(),
        effective_end_date: endDate === '' ? null : endDate,
        status: formData.status ?? 'active',
      }

      const endpoint = isEdit
        ? `${webServer}/api/v1/personal-training/availability/${availabilityUid}`
        : `${webServer}/api/v1/personal-training/availability`

      const response = await performAuthenticatedRequest(endpoint, {
        method: isEdit ? 'PUT' : 'POST',
        body: JSON.stringify(payload),
      })

      if (!response) {
        const message = `Please sign in again to ${isEdit ? 'update' : 'create'} availability.`
        setServerMessage(message)
        showMessage({
          message: `${actionLabel} failed`,
          description: message,
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

      if (response.status === (isEdit ? 200 : 201)) {
        showMessage({
          message: isEdit ? 'Availability updated' : 'Availability created',
          description: responseBody?.message || 'Your availability was saved successfully.',
          type: 'success',
        })
        navigation.goBack()
        return
      }

      if (response.status === 400) {
        const message = Array.isArray(responseBody?.errors) && responseBody.errors.length > 0
          ? responseBody.errors[0]
          : responseBody?.message || 'Please check the availability details and try again.'
        setServerMessage(message)
        showMessage({
          message: 'Validation error',
          description: message,
          type: 'danger',
        })
        return
      }

      if (response.status === 401) {
        const message = `Please sign in again to ${isEdit ? 'update' : 'create'} availability.`
        setServerMessage(message)
        showMessage({
          message: 'Authentication required',
          description: message,
          type: 'danger',
        })
        return
      }

      if (response.status === 403) {
        const message = responseBody?.message || 'You do not have permission to manage this availability.'
        setServerMessage(message)
        showMessage({
          message: 'Permission denied',
          description: message,
          type: 'danger',
        })
        return
      }

      if (response.status === 404) {
        const message = responseBody?.message || 'This availability no longer exists.'
        showMessage({
          message: 'Availability not found',
          description: message,
          type: 'danger',
        })
        navigation.goBack()
        return
      }

      // 409: the window overlaps another active window for this trainer.
      const message = responseBody?.message || `Unable to ${isEdit ? 'update' : 'create'} availability.`
      setServerMessage(message)
      showMessage({
        message: response.status === 409 ? 'Availability overlaps' : `${actionLabel} failed`,
        description: message,
        type: 'danger',
      })
    } catch {
      const message = `Unable to ${isEdit ? 'update' : 'create'} availability.`
      setServerMessage(message)
      showMessage({
        message: `${actionLabel} failed`,
        description: message,
        type: 'danger',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const screenTitle = isEdit ? 'Edit Availability' : 'Add Availability'

  if (!canManage) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.navs}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Feather name="arrow-left" color={AppColors.blue} size={36} />
          </TouchableOpacity>
          <Text style={styles.title}>{screenTitle}</Text>
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
        <Text style={styles.title}>{screenTitle}</Text>
        <View style={styles.spacer} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Weekly Availability</Text>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Trainer</Text>
              {isOwner && !isEdit ? (
                <>
                  <Controller
                    control={control}
                    name="trainer_gym_user_id"
                    render={({ field: { onChange } }) => (
                      <SelectList
                        setSelected={(selectedValue) => onChange(String(selectedValue ?? ''))}
                        data={trainerOptions}
                        save="key"
                        placeholder="Select trainer"
                        boxStyles={styles.selectBox}
                        dropdownStyles={styles.selectDropdown}
                        search={false}
                      />
                    )}
                  />
                  {trainerOptions.length === 0 ? <Text style={styles.helperText}>No trainers available for this gym.</Text> : null}
                </>
              ) : (
                <>
                  <View style={[styles.input, styles.readOnlyInput]}>
                    <Text style={styles.readOnlyText}>
                      {isOwner ? String(availability?.trainer_display_name ?? '').trim() || 'Trainer' : 'You'}
                    </Text>
                  </View>
                  <Text style={styles.helperText}>
                    {isEdit ? 'The trainer of an existing availability cannot be changed.' : 'Availability you add is for you.'}
                  </Text>
                </>
              )}
              {errors.trainer_gym_user_id ? <Text style={styles.errorText}>{errors.trainer_gym_user_id.message}</Text> : null}
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Day of Week</Text>
              <Controller
                control={control}
                name="day_of_week"
                render={({ field: { onChange, value } }) => (
                  <View style={styles.dayChips}>
                    {WEEKDAYS.map((option) => {
                      const selected = value === option.day
                      return (
                        <TouchableOpacity
                          key={option.day}
                          style={[styles.dayChip, selected ? styles.dayChipSelected : null]}
                          onPress={() => onChange(option.day)}
                        >
                          <Text style={[styles.dayChipText, selected ? styles.dayChipTextSelected : null]}>{option.label}</Text>
                        </TouchableOpacity>
                      )
                    })}
                  </View>
                )}
              />
              {errors.day_of_week ? <Text style={styles.errorText}>{errors.day_of_week.message}</Text> : null}
            </View>

            <View style={styles.row}>
              <View style={[styles.field, styles.rowField]}>
                <Text style={styles.label}>Start Time</Text>
                <Controller
                  control={control}
                  name="start_time_local"
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
                {errors.start_time_local ? <Text style={styles.errorText}>{errors.start_time_local.message}</Text> : null}
              </View>

              <View style={[styles.field, styles.rowField]}>
                <Text style={styles.label}>End Time</Text>
                <Controller
                  control={control}
                  name="end_time_local"
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
                {errors.end_time_local ? <Text style={styles.errorText}>{errors.end_time_local.message}</Text> : null}
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Effective Start Date</Text>
              <Controller
                control={control}
                name="effective_start_date"
                render={({ field: { onChange, onBlur, value } }) => (
                  <DateOfBirthField
                    value={value}
                    onChange={onChange}
                    onBlur={onBlur}
                    placeholder="Select start date"
                    title="Select effective start date"
                    maximumDate={null}
                  />
                )}
              />
              {errors.effective_start_date ? <Text style={styles.errorText}>{errors.effective_start_date.message}</Text> : null}
            </View>

            <View style={styles.field}>
              <View style={styles.labelRow}>
                <Text style={styles.labelInline}>Effective End Date (optional)</Text>
                {effectiveEndDate ? (
                  <TouchableOpacity onPress={() => setValue('effective_end_date', '')}>
                    <Text style={styles.clearText}>Clear</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
              <Controller
                control={control}
                name="effective_end_date"
                render={({ field: { onChange, onBlur, value } }) => (
                  <DateOfBirthField
                    value={value}
                    onChange={onChange}
                    onBlur={onBlur}
                    placeholder="No end date"
                    title="Select effective end date"
                    maximumDate={null}
                    minimumDate={toPickerDate(effectiveStartDate)}
                  />
                )}
              />
              {errors.effective_end_date ? <Text style={styles.errorText}>{errors.effective_end_date.message}</Text> : null}
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Status</Text>
              <Controller
                control={control}
                name="status"
                render={({ field: { onChange, value } }) => (
                  <View style={styles.segmentedControl}>
                    {(['active', 'inactive'] as const).map((option) => {
                      const selected = value === option
                      return (
                        <TouchableOpacity
                          key={option}
                          style={[styles.segmentButton, selected ? styles.segmentButtonSelected : null]}
                          onPress={() => onChange(option)}
                        >
                          <Text style={[styles.segmentButtonText, selected ? styles.segmentButtonTextSelected : null]}>
                            {option.charAt(0).toUpperCase() + option.slice(1)}
                          </Text>
                        </TouchableOpacity>
                      )
                    })}
                  </View>
                )}
              />
              {errors.status ? <Text style={styles.errorText}>{errors.status.message}</Text> : null}
            </View>

            {serverMessage ? <Text style={styles.serverMessage}>{serverMessage}</Text> : null}
          </View>

          <TouchableOpacity
            style={[styles.submitButton, submitting ? styles.submitButtonDisabled : null]}
            onPress={handleSubmit(onSubmit)}
            disabled={submitting}
          >
            <View style={styles.submitButtonInner}>
              <Feather name={submitting ? 'loader' : 'check'} color={AppColors.white} size={18} />
              <Text style={styles.submitButtonText}>{submitting ? 'Saving...' : 'Save'}</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
            disabled={submitting}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>

          <Text style={styles.footerNote}>
            Times are shown in Eastern Time (America/New_York).{' '}
            Windows for the same trainer on the same day cannot overlap.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

export default AddEditPersonalTrainingAvailabilityScreen

const styles = StyleSheet.create({
  container: {
    backgroundColor: AppColors.grey,
    flex: 1,
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
  centerState: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 20,
    color: AppColors.blue,
    textAlign: 'center',
    fontFamily: 'Montserrat',
  },
  stateText: {
    marginTop: 12,
    fontSize: 16,
    color: AppColors.grey3,
    textAlign: 'center',
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
  card: {
    backgroundColor: AppColors.white,
    borderRadius: 18,
    padding: 18,
    borderColor: AppColors.grey,
    borderWidth: 1,
  },
  sectionHeader: {
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    color: AppColors.blue,
    fontFamily: 'Montserrat',
  },
  field: {
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  rowField: {
    flex: 1,
  },
  label: {
    fontSize: 13,
    color: AppColors.blue,
    marginBottom: 8,
    fontFamily: 'Montserrat',
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  labelInline: {
    fontSize: 13,
    color: AppColors.blue,
    fontFamily: 'Montserrat',
  },
  clearText: {
    fontSize: 13,
    color: AppColors.red,
    fontFamily: 'Montserrat',
  },
  input: {
    borderColor: AppColors.grey,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 14 : 12,
    backgroundColor: AppColors.grey,
    color: AppColors.primary,
    fontFamily: 'Montserrat',
  },
  readOnlyInput: {
    justifyContent: 'center',
  },
  readOnlyText: {
    color: AppColors.primary,
    fontFamily: 'Montserrat',
  },
  selectBox: {
    borderRadius: 14,
    borderColor: AppColors.grey,
    borderWidth: 1,
    backgroundColor: AppColors.grey,
    paddingHorizontal: 14,
    paddingVertical: 14,
    minHeight: 54,
  },
  selectDropdown: {
    borderRadius: 14,
    borderColor: AppColors.grey,
  },
  helperText: {
    marginTop: 6,
    color: AppColors.grey3,
    fontSize: 12,
    fontFamily: 'Montserrat',
  },
  errorText: {
    color: AppColors.red,
    fontSize: 12,
    marginTop: 6,
    fontFamily: 'Montserrat',
  },
  dayChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dayChip: {
    minWidth: 62,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: AppColors.grey,
    backgroundColor: AppColors.grey,
    alignItems: 'center',
  },
  dayChipSelected: {
    backgroundColor: AppColors.blue,
    borderColor: AppColors.blue,
  },
  dayChipText: {
    color: AppColors.blue,
    fontFamily: 'Montserrat',
  },
  dayChipTextSelected: {
    color: AppColors.white,
  },
  segmentedControl: {
    flexDirection: 'row',
    gap: 10,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: AppColors.grey,
    backgroundColor: AppColors.grey,
    alignItems: 'center',
  },
  segmentButtonSelected: {
    backgroundColor: AppColors.blue,
    borderColor: AppColors.blue,
  },
  segmentButtonText: {
    color: AppColors.blue,
    fontFamily: 'Montserrat',
  },
  segmentButtonTextSelected: {
    color: AppColors.white,
  },
  serverMessage: {
    marginTop: 4,
    color: AppColors.red,
    fontSize: 13,
    fontFamily: 'Montserrat',
  },
  submitButton: {
    marginTop: 16,
    marginHorizontal: 16,
    backgroundColor: AppColors.blue,
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
  },
  submitButtonDisabled: {
    opacity: 0.72,
  },
  submitButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  submitButtonText: {
    color: AppColors.white,
    fontSize: 16,
    fontFamily: 'Montserrat',
  },
  cancelButton: {
    marginTop: 12,
    marginHorizontal: 16,
    borderColor: AppColors.blue,
    borderWidth: 1,
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppColors.white,
  },
  cancelButtonText: {
    color: AppColors.blue,
    fontSize: 16,
    fontFamily: 'Montserrat',
  },
  footerNote: {
    marginTop: 12,
    marginHorizontal: 18,
    color: AppColors.grey3,
    fontSize: 12,
    lineHeight: 18,
    fontFamily: 'Montserrat',
  },
})