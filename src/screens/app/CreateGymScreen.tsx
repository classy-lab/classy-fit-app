import React, { useContext, useMemo, useState } from 'react'
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
import Feather from '@expo/vector-icons/Feather'
import { showMessage } from 'react-native-flash-message'
import { AppColors } from '../../styles/colors'
import { UserContext } from '../../context/UserContext'
import SignOut from '../../components/utils/SignOut'

type RefreshTokens = {
  access_token?: string
  refresh_token?: string
}

type UserContextValue = {
  setUser: (value: Record<string, any> | null | ((prev: Record<string, any> | null) => Record<string, any> | null)) => void
  tokens?: RefreshTokens | null
  setTokens: (value: RefreshTokens | null | ((prev: RefreshTokens | null) => RefreshTokens | null)) => void
  webServer: string
}

type CreateGymNavigation = {
  navigate: (screen: string, params?: Record<string, any>) => void
  goBack: () => void
}

type GymFormValues = {
  gym_name: string
  gym_type: string
  phone: string
  email: string
  address_line_1: string
  address_line_2: string
  city: string
  state: string
  postal_code: string
  country: string
  timezone: string
  website_url: string
  about: string
}

type CreateGymResponse = {
  status?: string
  message?: string
  gym?: Record<string, any>
  membership?: Record<string, any>
  user?: Record<string, any>
  errors?: string[]
}

type FieldConfig = {
  name: keyof GymFormValues
  label: string
  placeholder: string
  keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'url'
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters'
  multiline?: boolean
  numberOfLines?: number
}

const createGymSchema = yup.object({
  gym_name: yup.string().trim().required('Gym name is required').max(255, 'Gym name must be 255 characters or fewer'),
  gym_type: yup.string().trim().max(100, 'Gym type must be 100 characters or fewer'),
  phone: yup.string().trim().max(50, 'Phone must be 50 characters or fewer'),
  email: yup
    .string()
    .trim()
    .max(255, 'Email must be 255 characters or fewer')
    .test('email-format', 'Email must be a valid email address', (value) => !value || yup.string().email().isValidSync(value)),
  address_line_1: yup.string().trim().max(255, 'Address line 1 must be 255 characters or fewer'),
  address_line_2: yup.string().trim().max(255, 'Address line 2 must be 255 characters or fewer'),
  city: yup.string().trim().max(100, 'City must be 100 characters or fewer'),
  state: yup.string().trim().max(100, 'State must be 100 characters or fewer'),
  postal_code: yup.string().trim().max(20, 'Postal code must be 20 characters or fewer'),
  country: yup.string().trim().max(100, 'Country must be 100 characters or fewer'),
  timezone: yup.string().trim().max(100, 'Timezone must be 100 characters or fewer'),
  website_url: yup
    .string()
    .trim()
    .max(255, 'Website URL must be 255 characters or fewer')
    .test('website-url-format', 'Website URL must be a valid URL', (value) => !value || yup.string().url().isValidSync(value)),
  about: yup.string().trim().max(5000, 'About must be 5000 characters or fewer'),
})

const fieldConfigs: FieldConfig[] = [
  { name: 'gym_name', label: 'Gym Name', placeholder: 'Classy Fit', autoCapitalize: 'words' },
  { name: 'gym_type', label: 'Gym Type', placeholder: 'Strength, Fitness, CrossFit', autoCapitalize: 'words' },
  { name: 'phone', label: 'Phone', placeholder: '(518) 610-8009', keyboardType: 'phone-pad' },
  { name: 'email', label: 'Email', placeholder: 'hello@example.com', keyboardType: 'email-address', autoCapitalize: 'none' },
  { name: 'address_line_1', label: 'Address Line 1', placeholder: '3143 US Route 9', autoCapitalize: 'words' },
  { name: 'address_line_2', label: 'Address Line 2', placeholder: 'Suite #4', autoCapitalize: 'words' },
  { name: 'city', label: 'City', placeholder: 'Valatie', autoCapitalize: 'words' },
  { name: 'state', label: 'State', placeholder: 'NY', autoCapitalize: 'characters' },
  { name: 'postal_code', label: 'Postal Code', placeholder: '12184' },
  { name: 'country', label: 'Country', placeholder: 'United States', autoCapitalize: 'words' },
  { name: 'timezone', label: 'Timezone', placeholder: 'America/New_York', autoCapitalize: 'none' },
  { name: 'website_url', label: 'Website URL', placeholder: 'https://example.com', keyboardType: 'url', autoCapitalize: 'none' },
  { name: 'about', label: 'About', placeholder: 'Tell people about your gym', multiline: true, numberOfLines: 5, autoCapitalize: 'sentences' },
]

const defaultValues: GymFormValues = {
  gym_name: '',
  gym_type: '',
  phone: '',
  email: '',
  address_line_1: '',
  address_line_2: '',
  city: '',
  state: '',
  postal_code: '',
  country: '',
  timezone: '',
  website_url: '',
  about: '',
}

const CreateGymScreen = ({ navigation }: { navigation: CreateGymNavigation }) => {
  const { setUser, tokens, setTokens, webServer } = useContext(UserContext) as UserContextValue
  const [submitting, setSubmitting] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const formDefaults = useMemo(() => defaultValues, [])

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<GymFormValues>({
    resolver: yupResolver(createGymSchema) as any,
    defaultValues: formDefaults,
    mode: 'onSubmit',
  })

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

  const performAuthenticatedRequest = async (endpoint: string, init: RequestInit = {}): Promise<Response | null> => {
    if (!tokens?.access_token) {
      return null
    }

    const requestWithToken = async (accessToken: string) =>
      fetch(endpoint, {
        ...init,
        headers: {
          'Content-Type': 'application/json',
          ...(init.headers ?? {}),
          Authorization: `Bearer ${accessToken}`,
        },
      })

    let response = await requestWithToken(tokens.access_token)

    if (response.status === 401 || response.status === 403) {
      const refreshedAccessToken = await refreshAccessToken()
      if (!refreshedAccessToken) {
        return response
      }

      response = await requestWithToken(refreshedAccessToken)
    }

    return response
  }

  const onSubmit = async (formData: GymFormValues) => {
    if (submitting) {
      return
    }

    if (!tokens?.access_token) {
      const message = 'Please sign in again to create a gym.'
      setFeedback({ type: 'error', message })
      showMessage({ message: 'Create failed', description: message, type: 'danger' })
      return
    }

    setSubmitting(true)
    setFeedback(null)

    try {
      const response = await performAuthenticatedRequest(`${webServer}/api/v1/gyms`, {
        method: 'POST',
        body: JSON.stringify(formData),
      })

      if (!response) {
        const message = 'Please sign in again to create a gym.'
        setFeedback({ type: 'error', message })
        showMessage({ message: 'Create failed', description: message, type: 'danger' })
        return
      }

      const responseText = await response.text()
      let responseBody: CreateGymResponse = {}
      if (responseText) {
        try {
          responseBody = JSON.parse(responseText)
        } catch {
          responseBody = { message: responseText }
        }
      }

      if (response.status === 200 || response.status === 201) {
        const nextUser = responseBody?.user
        const nextGym = responseBody?.gym

        if (nextUser) {
          setUser((prev) => ({
            ...(prev ?? {}),
            ...nextUser,
          }))
        } else if (nextGym) {
          setUser((prev) => ({
            ...(prev ?? {}),
            gym_id: nextGym.gym_id,
            gym_name: nextGym.gym_name,
            role: 'owner',
          }))
        }

        const message = responseBody?.message || 'Gym created successfully.'
        setFeedback({ type: 'success', message })
        showMessage({
          message: 'Gym created',
          description: message,
          type: 'success',
        })
        navigation.navigate('HomeTab', { screen: 'DashboardScreen' })
        return
      }

      const message = responseBody?.message || responseBody?.errors?.[0] || 'Unable to create gym.'
      setFeedback({ type: 'error', message })
      showMessage({
        message: 'Create failed',
        description: message,
        type: 'danger',
      })
    } catch (error) {
      const message = 'Unable to create gym right now.'
      setFeedback({ type: 'error', message })
      showMessage({
        message: 'Create failed',
        description: message,
        type: 'danger',
      })
      console.error('Create gym failed:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const fieldErrors = errors as Record<string, { message?: string } | undefined>

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.navs}>
        <Feather name="arrow-left" color={AppColors.blue} size={36} onPress={() => navigation.goBack()} />
        <SignOut />
      </View>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={styles.headingContainer}>
            <Text style={styles.title}>Create Gym</Text>
            <Text style={styles.subtitle}>Create a new gym and switch your account context right away.</Text>
          </View>

          {feedback ? (
            <View
              style={[
                styles.feedbackBox,
                feedback.type === 'success' ? styles.feedbackSuccess : styles.feedbackError,
              ]}
            >
              <Text
                style={[
                  styles.feedbackText,
                  feedback.type === 'success' ? styles.feedbackSuccessText : styles.feedbackErrorText,
                ]}
              >
                {feedback.message}
              </Text>
            </View>
          ) : null}

          <View style={styles.form}>
            {fieldConfigs.map((field) => (
              <View key={field.name} style={styles.field}>
                <Text style={styles.label}>
                  {field.label}
                  {field.name === 'gym_name' ? ' *' : ''}
                </Text>
                <Controller
                  control={control}
                  name={field.name}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      style={[
                        styles.input,
                        field.multiline && styles.textArea,
                        fieldErrors[field.name]?.message ? styles.inputError : null,
                      ]}
                      placeholder={field.placeholder}
                      placeholderTextColor={AppColors.grey3}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      keyboardType={field.keyboardType}
                      autoCapitalize={field.autoCapitalize ?? 'none'}
                      multiline={field.multiline}
                      numberOfLines={field.numberOfLines}
                      textAlignVertical={field.multiline ? 'top' : 'center'}
                    />
                  )}
                />
                {fieldErrors[field.name]?.message ? (
                  <Text style={styles.errorText}>{fieldErrors[field.name]?.message}</Text>
                ) : null}
              </View>
            ))}

            <TouchableOpacity
              style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
              onPress={handleSubmit(onSubmit as any)}
              disabled={submitting}
              activeOpacity={0.85}
            >
              {submitting ? (
                <ActivityIndicator color={AppColors.white} />
              ) : (
                <Text style={styles.submitButtonText}>Create Gym</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

export default CreateGymScreen

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: AppColors.white,
  },
  navs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  headingContainer: {
    paddingHorizontal: 24,
    marginTop: 12,
    marginBottom: 16,
  },
  title: {
    color: AppColors.blue,
    fontFamily: 'Montserrat',
    fontSize: 32,
    textAlign: 'center',
  },
  subtitle: {
    color: AppColors.primary,
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    marginTop: 8,
    fontFamily: 'Montserrat',
  },
  feedbackBox: {
    marginHorizontal: 24,
    marginBottom: 16,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
  },
  feedbackSuccess: {
    backgroundColor: '#eef8f1',
    borderColor: '#8ad19b',
  },
  feedbackError: {
    backgroundColor: '#fceff0',
    borderColor: '#f4a3aa',
  },
  feedbackText: {
    fontFamily: 'Montserrat',
    fontSize: 14,
    lineHeight: 20,
  },
  feedbackSuccessText: {
    color: '#1f7a3b',
  },
  feedbackErrorText: {
    color: '#a61d24',
  },
  form: {
    paddingHorizontal: 24,
    gap: 14,
  },
  field: {
    gap: 8,
  },
  label: {
    color: AppColors.primary,
    fontSize: 14,
    fontFamily: 'Montserrat',
  },
  input: {
    borderWidth: 1,
    borderColor: AppColors.grey2,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: AppColors.primary,
    fontSize: 14,
    fontFamily: 'Montserrat',
    backgroundColor: AppColors.white,
    minHeight: 48,
  },
  textArea: {
    minHeight: 120,
    paddingTop: 12,
  },
  inputError: {
    borderColor: '#d14343',
  },
  errorText: {
    color: '#d14343',
    fontSize: 12,
    fontFamily: 'Montserrat',
  },
  submitButton: {
    marginTop: 8,
    backgroundColor: AppColors.blue,
    borderRadius: 40,
    minHeight: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: AppColors.white,
    fontSize: 16,
    fontFamily: 'Montserrat',
  },
})
