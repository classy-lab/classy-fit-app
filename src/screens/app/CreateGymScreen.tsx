import React, { useContext, useMemo, useState } from 'react'
import * as yup from 'yup'
import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Platform,
  ActivityIndicator,
  KeyboardAvoidingView,
  StyleSheet,
} from 'react-native'
import { AppColors } from '../../styles/colors'
import { useNavigation } from '@react-navigation/native'
import { UserContext } from '../../context/UserContext'
import { SafeAreaView } from 'react-native-safe-area-context'
import Feather from '@expo/vector-icons/Feather'
import Ionicons from '@expo/vector-icons/Ionicons'
import { showMessage } from 'react-native-flash-message'

type RefreshTokens = {
  access_token?: string
  refresh_token?: string
}

type UserContextValue = {
  webServer: string
}

type CreateGymNavigation = {
  navigate: (screen: string, params?: Record<string, any>) => void
  goBack: () => void
  getParent?: () => { openDrawer?: () => void } | null
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
  photo_url: string
  website_url: string
  gym_hours: string
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
  photo_url: yup
    .string()
    .trim()
    .max(255, 'Photo URL must be 255 characters or fewer')
    .test('photo-url-format', 'Photo URL must be a valid URL', (value) => !value || yup.string().url().isValidSync(value)),
  website_url: yup
    .string()
    .trim()
    .max(255, 'Website URL must be 255 characters or fewer')
    .test('website-url-format', 'Website URL must be a valid URL', (value) => !value || yup.string().url().isValidSync(value)),
  gym_hours: yup.string().trim().max(10000, 'Gym hours must be 10000 characters or fewer'),
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
  { name: 'photo_url', label: 'Gym Photo/Logo URL', placeholder: 'https://example.com/logo.png', keyboardType: 'url', autoCapitalize: 'none' },
  { name: 'website_url', label: 'Website URL', placeholder: 'https://example.com', keyboardType: 'url', autoCapitalize: 'none' },
  { name: 'gym_hours', label: 'Gym Hours (JSON)', placeholder: '{"monday":{"open":"5:30am","close":"9:00pm"}}', multiline: true, numberOfLines: 5, autoCapitalize: 'none' },
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
  photo_url: '',
  website_url: '',
  gym_hours: '',
  about: '',
}

const CreateGymScreen = ({ navigation }: { navigation: CreateGymNavigation }) => {
  const { webServer } = useContext(UserContext) as UserContextValue
  const [submitting, setSubmitting] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const formDefaults = useMemo(() => defaultValues, [])
  const handleOpenDrawer = () => {
    const parent = (navigation as any).getParent?.()
    if (typeof parent?.openDrawer === 'function') {
      parent.openDrawer()
    }
  }

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<GymFormValues>({
    resolver: yupResolver(createGymSchema) as any,
    defaultValues: formDefaults,
    mode: 'onSubmit',
  })

  const onSubmit = async (formData: GymFormValues) => {
    if (submitting) {
      return
    }

    setSubmitting(true)
    setFeedback(null)

    try {
      const response = await fetch(`${webServer}/api/v1/gyms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const responseText = await response.text()
      let responseBody: CreateGymResponse = {}
      if (responseText) {
        try {
          responseBody = JSON.parse(responseText)
        } catch {
          responseBody = { message: responseText }
        }
      }

      if (response.status === 200 || response.status === 201 || response.status === 202) {
        const message = responseBody?.message || 'Gym created successfully.'
        setFeedback({ type: 'success', message })
        showMessage({
          message: 'Gym registration received',
          description: message,
          type: 'success',
        })
        reset(defaultValues)
        navigation.goBack()
        return
      }

      const message = responseBody?.message || responseBody?.errors?.[0] || 'Unable to submit gym registration.'
      setFeedback({ type: 'error', message })
      showMessage({
        message: 'Create failed',
        description: message,
        type: 'danger',
      })
    } catch (error) {
      const message = 'Unable to submit gym registration right now.'
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
    <>
      <SafeAreaView style={styles.container}>
        <View style={styles.navs}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={10} accessibilityRole="button" accessibilityLabel="Go back">
            <Feather name="arrow-left" color={AppColors.blue} size={36} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleOpenDrawer} hitSlop={10} accessibilityRole="button" accessibilityLabel="Open menu">
            <Ionicons color={AppColors.hamburgerIconColor} name="menu" size={40} />
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
          <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.headingContainer}>
              <Text style={styles.title}>Create Gym</Text>
              <Text style={styles.subHead}>Create a new gym and switch your account context right away.</Text>
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

            <View style={styles.formCard}>
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
                  {field.name === 'gym_hours' ? (
                    <Text style={styles.helperText}>Enter valid JSON, for example: {"{\"monday\":{\"open\":\"5:30am\",\"close\":\"9:00pm\"}}"}</Text>
                  ) : null}
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
    </>
  )
}

export default CreateGymScreen

const styles = StyleSheet.create({
  container: {
    backgroundColor: AppColors.white,
    flex: 1,
  },
  navs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingLeft: 24,
    paddingRight: 24,
    alignItems: 'center',
    marginTop: 8,
  },
  flex: {
    flex: 1,
  },
  headingContainer: {
    alignItems: 'center',
    marginBottom: 18,
    paddingHorizontal: 16,
  },
  title: {
    color: AppColors.blue,
    fontFamily: 'Montserrat',
    fontSize: 32,
    marginTop: 34,
    marginBottom: 8,
  },
  subHead: {
    fontFamily: 'Montserrat',
    fontSize: 16,
    lineHeight: 24,
    color: AppColors.primary,
    textAlign: 'center',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 28,
  },
  scrollView: {},
  formCard: {
    backgroundColor: AppColors.white,
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 8,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  field: {
    marginBottom: 14,
  },
  label: {
    color: AppColors.blue,
    fontFamily: 'Montserrat',
    fontSize: 14,
    marginBottom: 6,
  },
  input: {
    borderColor: AppColors.grey,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: 'Montserrat',
    color: AppColors.primary,
    backgroundColor: AppColors.white,
    minHeight: 48,
  },
  textArea: {
    minHeight: 110,
    paddingTop: 12,
  },
  inputError: {
    borderColor: '#B91C1C',
  },
  errorText: {
    marginTop: 4,
    color: '#B91C1C',
    fontSize: 12,
    fontFamily: 'Montserrat',
  },
  helperText: {
    marginTop: 4,
    color: AppColors.primary,
    fontSize: 12,
    lineHeight: 18,
    fontFamily: 'Montserrat',
  },
  submitButton: {
    marginTop: 8,
    backgroundColor: AppColors.blue,
    borderRadius: 999,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.75,
  },
  submitButtonText: {
    color: AppColors.white,
    fontSize: 16,
    fontFamily: 'Montserrat',
  },
  feedbackBox: {
    marginBottom: 16,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  feedbackSuccess: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#10B981',
  },
  feedbackError: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#F87171',
  },
  feedbackText: {
    fontFamily: 'Montserrat',
    fontSize: 14,
    lineHeight: 20,
  },
  feedbackSuccessText: {
    color: '#065F46',
  },
  feedbackErrorText: {
    color: '#991B1B',
  },
})
