import { useContext, useMemo, useState } from 'react'
import {
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
import Feather from '@expo/vector-icons/Feather'
import { showMessage } from 'react-native-flash-message'
import { AppColors } from '../../styles/colors'
import { UserContext } from '../../context/UserContext'

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

  console.log('Access token expired, requesting new one - performAuthenticatedRequestWithRefresh()')
  const refreshedAccessToken = await refreshAccessTokenWithRefresh({
    refreshToken,
    webServer,
    setTokens,
  })

  if (!refreshedAccessToken) {
    return response
  }

  const retryResponse = await requestWithToken(refreshedAccessToken)
  return retryResponse
}

type RefreshTokens = {
  access_token?: string
  refresh_token?: string
}

type UserContextValue = {
  user?: {
    role?: string | null
  } | null
  tokens?: RefreshTokens | null
  setTokens: (value: RefreshTokens | null | ((prev: RefreshTokens | null) => RefreshTokens | null)) => void
  webServer: string
}

type AddMembershipPlanNavigation = {
  goBack: () => void
}

type MembershipPlanFormValues = {
  name?: string
  description?: string
  duration_months?: string
  price?: string
  currency_code?: string
  status?: 'active' | 'inactive'
}

type MembershipPlanFormInput = {
  name: string
  description: string
  duration_months: string
  price: string
  currency_code: string
  status: 'active' | 'inactive'
}

type MembershipPlanResponse = {
  status?: string
  message?: string
  plan?: {
    uid?: number
    gym_id?: number
    name?: string
    description?: string | null
    duration_months?: number
    price?: number | string
    currency_code?: string
    status?: string
    created_at?: string | null
    updated_at?: string | null
  }
  errors?: string[]
}

const durationOptions = [
  { key: '1', value: '1 Month' },
  { key: '3', value: '3 Months' },
  { key: '6', value: '6 Months' },
  { key: '12', value: '12 Months' },
]

const statusOptions = [
  { key: 'active', value: 'Active' },
  { key: 'inactive', value: 'Inactive' },
]

const durationLabels: Record<string, string> = {
  '1': '1 Month',
  '3': '3 Months',
  '6': '6 Months',
  '12': '12 Months',
}

const addMembershipPlanSchema = yup.object({
  name: yup
    .string()
    .trim()
    .required('Name is required')
    .max(100, 'Name must be 100 characters or fewer'),
  description: yup
    .string()
    .trim()
    .nullable()
    .max(1000, 'Description must be 1000 characters or fewer'),
  duration_months: yup
    .string()
    .trim()
    .required('Duration is required')
    .oneOf(['1', '3', '6', '12'], 'Duration must be 1, 3, 6, or 12 months'),
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
    .matches(/^[A-Z]{3}$/, 'Currency must be 3 uppercase letters'),
  status: yup
    .mixed<'active' | 'inactive'>()
    .oneOf(['active', 'inactive'])
    .required('Status is required'),
})

const AddMembershipPlanScreen = ({ navigation }: { navigation: AddMembershipPlanNavigation }) => {
  const { user, tokens, setTokens, webServer } = useContext(UserContext) as UserContextValue
  const [submitting, setSubmitting] = useState(false)
  const [serverMessage, setServerMessage] = useState('')

  const isOwner = String(user?.role ?? '').trim().toLowerCase() === 'owner'

  const defaultValues = useMemo<MembershipPlanFormInput>(() => ({
    name: '',
    description: '',
    duration_months: '1',
    price: '',
    currency_code: 'USD',
    status: 'active',
  }), [])

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<MembershipPlanFormInput, unknown, MembershipPlanFormValues>({
    resolver: yupResolver(addMembershipPlanSchema),
    defaultValues,
    mode: 'onSubmit',
  })

  const selectedDuration = watch('duration_months')
  const statusValue = watch('status')

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

  const onSubmit = async (formData: MembershipPlanFormValues) => {
    if (submitting) {
      return
    }

    if (!tokens?.access_token || !isOwner) {
      setServerMessage('Please sign in again to create membership plans.')
      showMessage({
        message: 'Create failed',
        description: 'Please sign in again to create membership plans.',
        type: 'danger',
      })
      return
    }

    setSubmitting(true)
    setServerMessage('')

    try {
      const payload = {
        name: String(formData.name ?? '').trim(),
        description: String(formData.description ?? '').trim() || null,
        duration_months: Number.parseInt(String(formData.duration_months ?? ''), 10),
        price: Number.parseFloat(String(formData.price ?? '0')),
        currency_code: String(formData.currency_code ?? 'USD').trim().toUpperCase(),
        status: formData.status ?? 'active',
      }

      const response = await performAuthenticatedRequest(`${webServer}/api/v1/membership-plans`, {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      if (!response) {
        const message = 'Please sign in again to create membership plans.'
        setServerMessage(message)
        showMessage({
          message: 'Create failed',
          description: message,
          type: 'danger',
        })
        return
      }

      const responseText = await response.text()
      let responseBody: MembershipPlanResponse = {}
      if (responseText) {
        try {
          responseBody = JSON.parse(responseText)
        } catch {
          responseBody = { message: responseText }
        }
      }

      if (response.status === 201) {
        showMessage({
          message: 'Membership plan created',
          description: responseBody?.message || 'The membership plan was created successfully.',
          type: 'success',
        })
        navigation.goBack()
        return
      }

      if (response.status === 400) {
        const message = Array.isArray(responseBody?.errors) && responseBody.errors.length > 0
          ? responseBody.errors[0]
          : responseBody?.message || 'Please check the membership plan details and try again.'
        setServerMessage(message)
        showMessage({
          message: 'Validation error',
          description: message,
          type: 'danger',
        })
        return
      }

      if (response.status === 401) {
        const message = 'Please sign in again to create membership plans.'
        setServerMessage(message)
        showMessage({
          message: 'Authentication required',
          description: message,
          type: 'danger',
        })
        return
      }

      if (response.status === 403) {
        const message = responseBody?.message || 'You do not have permission to create membership plans.'
        setServerMessage(message)
        showMessage({
          message: 'Permission denied',
          description: message,
          type: 'danger',
        })
        return
      }

      if (response.status === 409) {
        const message = responseBody?.message || 'A membership plan with this duration already exists for this gym.'
        setServerMessage(message)
        showMessage({
          message: 'Duplicate plan',
          description: message,
          type: 'danger',
        })
        return
      }

      const message = responseBody?.message || 'Unable to create membership plan.'
      setServerMessage(message)
      showMessage({
        message: 'Create failed',
        description: message,
        type: 'danger',
      })
    } catch {
      const message = 'Unable to create membership plan.'
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
          <Text style={styles.title}>Add Membership Plan</Text>
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
        <Text style={styles.title}>Add Membership Plan</Text>
        <View style={styles.spacer} />
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Plan Information</Text>
            </View>

            {serverMessage ? <Text style={styles.serverMessage}>{serverMessage}</Text> : null}

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
                    placeholder="Enter plan name"
                    placeholderTextColor={AppColors.grey3}
                    style={styles.input}
                    maxLength={100}
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
                    placeholder="Optional description"
                    placeholderTextColor={AppColors.grey3}
                    style={[styles.input, styles.multilineInput]}
                    multiline
                    textAlignVertical="top"
                    maxLength={1000}
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
                  name="duration_months"
                  render={({ field: { onChange, value } }) => {
                    const selectedDuration = durationOptions.find((option) => option.key === value)

                    return (
                      <SelectList
                        setSelected={(selectedValue) => onChange(String(selectedValue ?? ''))}
                        data={durationOptions}
                        save="key"
                        placeholder="Select duration"
                        boxStyles={styles.selectBox}
                        dropdownStyles={styles.selectDropdown}
                        search={false}
                        {...(selectedDuration ? { defaultOption: selectedDuration } : {})}
                      />
                    )
                  }}
                />
                {errors.duration_months ? <Text style={styles.errorText}>{errors.duration_months.message}</Text> : null}
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
                <Text style={styles.label}>Currency</Text>
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
                  {(statusOptions as Array<{ key: 'active' | 'inactive'; value: string }>).map((option) => {
                    const selected = statusValue === option.key
                    return (
                      <Controller
                        key={option.key}
                        control={control}
                        name="status"
                        render={({ field: { onChange } }) => (
                          <TouchableOpacity
                            style={[styles.segmentButton, selected ? styles.segmentButtonSelected : null]}
                            onPress={() => onChange(option.key)}
                          >
                            <Text style={[styles.segmentButtonText, selected ? styles.segmentButtonTextSelected : null]}>
                              {option.value}
                            </Text>
                          </TouchableOpacity>
                        )}
                      />
                    )
                  })}
                </View>
                {errors.status ? <Text style={styles.errorText}>{errors.status.message}</Text> : null}
              </View>
            </View>

            <View style={styles.helperCard}>
              <Text style={styles.helperTitle}>
                {durationLabels[selectedDuration] || 'Membership duration'}
              </Text>
              <Text style={styles.helperText}>
                Choose one of the four supported membership durations. The new plan will be available to members right away when set to active.
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.submitButton, submitting ? styles.buttonDisabled : null]}
              onPress={handleSubmit(onSubmit)}
              disabled={submitting}
            >
              {submitting ? (
                <Text style={styles.submitButtonText}>Saving...</Text>
              ) : (
                <>
                  <Feather name="check" color={AppColors.white} size={18} />
                  <Text style={styles.submitButtonText}>Create Membership Plan</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

export default AddMembershipPlanScreen

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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 6,
  },
  backBtn: {
    paddingRight: 8,
    paddingVertical: 4,
  },
  title: {
    color: AppColors.blue,
    fontSize: 24,
    flex: 1,
    textAlign: 'center',
  },
  spacer: {
    width: 44,
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
    color: AppColors.blue,
    fontSize: 18,
  },
  serverMessage: {
    color: AppColors.red,
    marginBottom: 12,
    fontSize: 14,
    lineHeight: 20,
  },
  field: {
    marginBottom: 14,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  rowField: {
    flex: 1,
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
    color: AppColors.primary,
    backgroundColor: AppColors.white,
    fontSize: 15,
  },
  multilineInput: {
    minHeight: 110,
    textAlignVertical: 'top',
  },
  selectBox: {
    borderWidth: 1,
    borderColor: AppColors.grey,
    borderRadius: 14,
    backgroundColor: AppColors.white,
    minHeight: 48,
    paddingHorizontal: 14,
  },
  selectDropdown: {
    borderWidth: 1,
    borderColor: AppColors.grey,
    borderRadius: 14,
    backgroundColor: AppColors.white,
  },
  segmentedControl: {
    flexDirection: 'row',
    gap: 8,
  },
  segmentButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: AppColors.grey2,
    borderRadius: 999,
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppColors.white,
  },
  segmentButtonSelected: {
    backgroundColor: AppColors.blue,
    borderColor: AppColors.blue,
  },
  segmentButtonText: {
    color: AppColors.blue,
    fontSize: 14,
  },
  segmentButtonTextSelected: {
    color: AppColors.white,
  },
  helperCard: {
    backgroundColor: AppColors.grey,
    borderRadius: 14,
    padding: 14,
    marginBottom: 18,
  },
  helperTitle: {
    color: AppColors.blue,
    fontSize: 15,
    marginBottom: 6,
  },
  helperText: {
    color: AppColors.grey3,
    fontSize: 13,
    lineHeight: 18,
  },
  errorText: {
    color: AppColors.red,
    marginTop: 8,
    fontSize: 13,
  },
  submitButton: {
    backgroundColor: AppColors.blue,
    borderRadius: 999,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitButtonText: {
    color: AppColors.white,
    fontSize: 15,
  },
  buttonDisabled: {
    opacity: 0.75,
  },
  centerState: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 16,
  },
  emptyTitle: {
    fontSize: 20,
    color: AppColors.blue,
    textAlign: 'center',
  },
  stateText: {
    marginTop: 12,
    fontSize: 16,
    color: AppColors.grey3,
    textAlign: 'center',
    lineHeight: 22,
  },
})