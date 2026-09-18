import { useContext, useEffect, useMemo, useState } from 'react'
import {
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

type AddPersonalTrainingSessionNavigation = {
  goBack: () => void
}

type AddPersonalTrainingSessionFormValues = {
  trainer_gym_user_id?: string
  session_start_date?: string
  session_start_time?: string
  session_end_date?: string
  session_end_time?: string
  price?: string
  currency_code?: string
  location?: string
  additional_notes?: string
  status?: 'scheduled' | 'cancelled' | 'completed'
}

type AddPersonalTrainingSessionFormInput = {
  trainer_gym_user_id: string
  session_start_date: string
  session_start_time: string
  session_end_date: string
  session_end_time: string
  price: string
  currency_code: string
  location: string
  additional_notes: string
  status: 'scheduled' | 'cancelled' | 'completed'
}

type TrainerOption = {
  key: string
  value: string
}

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/
const CURRENCY_PATTERN = /^[A-Z]{3}$/

const addPersonalTrainingSessionSchema = yup.object({
  trainer_gym_user_id: yup
    .string()
    .trim()
    .required('Trainer is required')
    .test('trainer-integer', 'Trainer must be a valid gym user id', (value) => /^\d+$/.test(String(value ?? ''))),
  session_start_date: yup
    .string()
    .trim()
    .required('Start date is required')
    .matches(DATE_PATTERN, 'Start date must use YYYY-MM-DD'),
  session_start_time: yup
    .string()
    .trim()
    .required('Start time is required')
    .matches(TIME_PATTERN, 'Start time must use HH:MM'),
  session_end_date: yup
    .string()
    .trim()
    .required('End date is required')
    .matches(DATE_PATTERN, 'End date must use YYYY-MM-DD'),
  session_end_time: yup
    .string()
    .trim()
    .required('End time is required')
    .matches(TIME_PATTERN, 'End time must use HH:MM'),
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
    .required('Currency is required')
    .matches(CURRENCY_PATTERN, 'Currency must be 3 uppercase letters'),
  location: yup
    .string()
    .trim()
    .nullable()
    .max(255, 'Location must be 255 characters or fewer'),
  additional_notes: yup
    .string()
    .trim()
    .nullable(),
  status: yup
    .mixed<'scheduled' | 'cancelled' | 'completed'>()
    .oneOf(['scheduled', 'cancelled', 'completed'])
    .required('Status is required'),
})

const AddPersonalTrainingSessionScreen = ({ navigation }: { navigation: AddPersonalTrainingSessionNavigation }) => {
  const { user, tokens, setTokens, webServer } = useContext(UserContext) as UserContextValue
  const [submitting, setSubmitting] = useState(false)
  const [serverMessage, setServerMessage] = useState('')
  const [trainerOptions, setTrainerOptions] = useState<TrainerOption[]>([])

  const isOwner = String(user?.role ?? '').trim().toLowerCase() === 'owner'

  const defaultValues = useMemo<AddPersonalTrainingSessionFormInput>(() => ({
    trainer_gym_user_id: '',
    session_start_date: '',
    session_start_time: '',
    session_end_date: '',
    session_end_time: '',
    price: '',
    currency_code: 'USD',
    location: '',
    additional_notes: '',
    status: 'scheduled',
  }), [])

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<AddPersonalTrainingSessionFormInput, unknown, AddPersonalTrainingSessionFormValues>({
    resolver: yupResolver(addPersonalTrainingSessionSchema),
    defaultValues,
    mode: 'onSubmit',
  })

  const statusValue = watch('status')

  const refreshAccessToken = async (): Promise<string | null> => {
    if (!tokens?.refresh_token) {
      return null
    }

    const refreshResponse = await fetch(`${webServer}/api/v1/refresh`, {
      method: 'POST',
      body: JSON.stringify({
        token: tokens.refresh_token,
      }),
    })

    if (refreshResponse.status !== 200) {
      return null
    }

    const refreshObj = await refreshResponse.json()
    if (!refreshObj?.access_token || !refreshObj?.refresh_token) {
      return null
    }

    setTokens((prev) => ({
      ...prev,
      access_token: refreshObj.access_token,
      refresh_token: refreshObj.refresh_token,
    }))

    return refreshObj.access_token
  }

  const performAuthenticatedRequest = async (
    endpoint: string,
    init: RequestInit = {}
  ): Promise<Response | null> => {
    if (!tokens?.access_token) {
      return null
    }

    const requestWithToken = async (accessToken: string) => {
      return fetch(endpoint, {
        ...init,
        headers: {
          'Content-Type': 'application/json',
          ...(init.headers ?? {}),
          Authorization: `Bearer ${accessToken}`,
        },
      })
    }

    let accessToken = tokens.access_token
    let response = await requestWithToken(accessToken)

    if (response.status === 401 || response.status === 403) {
      const refreshedAccessToken = await refreshAccessToken()
      if (!refreshedAccessToken) {
        return response
      }

      accessToken = refreshedAccessToken
      response = await requestWithToken(accessToken)
    }

    return response
  }

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
  }, [tokens?.access_token, user?.gym_id, webServer])

  const buildDateTimeValue = (dateValue: string, timeValue: string) => {
    const normalizedTime = timeValue.trim().length === 5 ? `${timeValue.trim()}:00` : timeValue.trim()
    return `${dateValue.trim()} ${normalizedTime}`
  }

  const onSubmit = async (formData: AddPersonalTrainingSessionFormValues) => {
    if (submitting) {
      return
    }

    if (!user?.gym_id || !tokens?.access_token) {
      setServerMessage('Please sign in again to create personal training sessions.')
      showMessage({
        message: 'Create failed',
        description: 'Please sign in again to create personal training sessions.',
        type: 'danger',
      })
      return
    }

    setSubmitting(true)
    setServerMessage('')

    try {
      const trainerGymUserId = String(formData.trainer_gym_user_id ?? '').trim()
      const location = String(formData.location ?? '').trim()
      const additionalNotes = String(formData.additional_notes ?? '').trim()

      const payload = {
        trainer_gym_user_id: trainerGymUserId === '' ? null : Number.parseInt(trainerGymUserId, 10),
        start_at: buildDateTimeValue(String(formData.session_start_date ?? ''), String(formData.session_start_time ?? '')),
        end_at: buildDateTimeValue(String(formData.session_end_date ?? ''), String(formData.session_end_time ?? '')),
        price: Number.parseFloat(String(formData.price ?? '0')),
        currency_code: String(formData.currency_code ?? 'USD').trim().toUpperCase(),
        location: location === '' ? null : location,
        additional_notes: additionalNotes === '' ? null : additionalNotes,
        status: formData.status ?? 'scheduled',
      }

      const response = await performAuthenticatedRequest(`${webServer}/api/v1/personal-training/sessions`, {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      if (!response) {
        setServerMessage('Please sign in again to create personal training sessions.')
        showMessage({
          message: 'Create failed',
          description: 'Please sign in again to create personal training sessions.',
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
          message: 'Personal training session created',
          description: responseBody?.message || 'The personal training session was created successfully.',
          type: 'success',
        })
        navigation.goBack()
        return
      }

      if (response.status === 400) {
        const message = Array.isArray(responseBody?.errors) && responseBody.errors.length > 0
          ? responseBody.errors[0]
          : responseBody?.message || 'Please check the personal training session details and try again.'
        setServerMessage(message)
        showMessage({
          message: 'Validation error',
          description: message,
          type: 'danger',
        })
        return
      }

      if (response.status === 401) {
        const message = 'Please sign in again to create personal training sessions.'
        setServerMessage(message)
        showMessage({
          message: 'Authentication required',
          description: message,
          type: 'danger',
        })
        return
      }

      if (response.status === 403) {
        const message = responseBody?.message || 'You do not have permission to create personal training sessions.'
        setServerMessage(message)
        showMessage({
          message: 'Permission denied',
          description: message,
          type: 'danger',
        })
        return
      }

      if (response.status === 409) {
        const message = responseBody?.message || 'Unable to create personal training session.'
        setServerMessage(message)
        showMessage({
          message: 'Create failed',
          description: message,
          type: 'danger',
        })
        return
      }

      const message = responseBody?.message || 'Unable to create personal training session.'
      setServerMessage(message)
      showMessage({
        message: 'Create failed',
        description: message,
        type: 'danger',
      })
    } catch {
      const message = 'Unable to create personal training session.'
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.navs}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="arrow-left" color={AppColors.blue} size={36} />
        </TouchableOpacity>
        <Text style={styles.title}>Add Session</Text>
        <View style={styles.spacer} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Session Information</Text>
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

            <View style={styles.field}>
              <Text style={styles.label}>Status</Text>
              <View style={styles.segmentedControl}>
                {(['scheduled', 'cancelled', 'completed'] as const).map((option) => {
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

            {serverMessage ? <Text style={styles.serverMessage}>{serverMessage}</Text> : null}
          </View>

          <TouchableOpacity
            style={[styles.submitButton, submitting ? styles.submitButtonDisabled : null]}
            onPress={handleSubmit(onSubmit)}
            disabled={submitting}
          >
            {submitting ? (
              <View style={styles.submitButtonInner}>
                <Feather name="loader" color={AppColors.white} size={18} />
                <Text style={styles.submitButtonText}>Creating...</Text>
              </View>
            ) : (
              <View style={styles.submitButtonInner}>
                <Feather name="plus" color={AppColors.white} size={18} />
                <Text style={styles.submitButtonText}>Create Session</Text>
              </View>
            )}
          </TouchableOpacity>

          <Text style={styles.footerNote}>
            Trainers must be active Trainer users in this gym. Session status defaults to scheduled.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

export default AddPersonalTrainingSessionScreen

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
    fontWeight: '600',
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
    fontWeight: '700',
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
    fontWeight: '600',
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
  multilineInput: {
    minHeight: 96,
  },
  readOnlyInput: {
    justifyContent: 'center',
  },
  readOnlyText: {
    color: AppColors.primary,
    fontFamily: 'Montserrat',
    fontWeight: '600',
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
    fontWeight: '700',
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
    fontWeight: '700',
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
