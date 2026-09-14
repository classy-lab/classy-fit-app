import { useContext, useMemo, useState } from 'react'
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
import { AppColors } from '../../styles/colors'
import { UserContext } from '../../context/UserContext'

type RefreshTokens = {
  access_token?: string
  refresh_token?: string
}

type UserContextValue = {
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
}

type AddClassFormInput = {
  name: string
  description: string
  duration_minutes: string
  capacity: string
  price: string
  currency_code: string
  status: 'active' | 'inactive'
}

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
})

const AddClassScreen = ({ navigation }: { navigation: AddClassNavigation }) => {
  const { tokens, setTokens, webServer } = useContext(UserContext) as UserContextValue
  const [submitting, setSubmitting] = useState(false)
  const [serverMessage, setServerMessage] = useState('')

  const defaultValues = useMemo<AddClassFormInput>(() => ({
    name: '',
    description: '',
    duration_minutes: '',
    capacity: '',
    price: '',
    currency_code: 'USD',
    status: 'active',
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

    if (response.status === 401) {
      const refreshedAccessToken = await refreshAccessToken()
      if (!refreshedAccessToken) {
        return response
      }

      accessToken = refreshedAccessToken
      response = await requestWithToken(accessToken)
    }

    return response
  }

  const onSubmit = async (formData: AddClassFormValues) => {
    if (submitting) {
      return
    }

    setSubmitting(true)
    setServerMessage('')

    try {
      const payload = {
        name: String(formData.name ?? '').trim(),
        description: String(formData.description ?? '').trim(),
        duration_minutes: Number.parseInt(formData.duration_minutes, 10),
        capacity: Number.parseInt(formData.capacity, 10),
        price: Number.parseFloat(formData.price),
        currency_code: String(formData.currency_code ?? 'USD').trim().toUpperCase(),
        status: formData.status,
      }

      const response = await performAuthenticatedRequest(`${webServer}/api/v1/classes`, {
        method: 'POST',
        body: JSON.stringify(payload),
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
          description: responseBody?.message || 'Your class has been created successfully.',
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
    backgroundColor: AppColors.white,
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
    paddingBottom: 24,
  },
  card: {
    borderWidth: 1,
    borderColor: AppColors.grey,
    borderRadius: 16,
    padding: 16,
    backgroundColor: AppColors.white,
    marginTop: 12,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    color: AppColors.blue,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: AppColors.grey,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: AppColors.blue,
    fontSize: 16,
    backgroundColor: AppColors.white,
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
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  rowField: {
    flex: 1,
  },
  errorText: {
    color: '#C0392B',
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
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: AppColors.white,
  },
  segmentButtonSelected: {
    borderColor: AppColors.blue,
    backgroundColor: '#EAF1FF',
  },
  segmentButtonText: {
    color: AppColors.primary,
    fontSize: 15,
    fontWeight: '600',
  },
  segmentButtonTextSelected: {
    color: AppColors.blue,
  },
  serverMessage: {
    color: '#C0392B',
    fontSize: 14,
    marginBottom: 16,
  },
  submitButton: {
    backgroundColor: AppColors.blue,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.75,
  },
  submitButtonText: {
    color: AppColors.white,
    fontSize: 16,
    fontWeight: '700',
  },
})
