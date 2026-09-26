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
import { SelectList } from 'react-native-dropdown-select-list'
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
  contact_name: string
  gym_type: string
  phone: string
  email: string
  address_line_1: string
  address_line_2: string
  city: string
  state: string
  postal_code: string
  country: string
  photo_url: string
  website_url: string
  about: string
}

type GymTypeOption = {
  key: string
  value: string
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
  required?: boolean
  keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'url'
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters'
  multiline?: boolean
  numberOfLines?: number
}

type SectionConfig = {
  title: string
  description: string
  fields: Array<keyof GymFormValues>
}

const createGymSchema = yup.object({
  gym_name: yup.string().trim().required('Gym name is required').max(255, 'Gym name must be 255 characters or fewer'),
  contact_name: yup.string().trim().required('Owner / contact full name is required').max(255, 'Owner / contact full name must be 255 characters or fewer'),
  gym_type: yup.string().trim().required('Gym type is required').max(100, 'Gym type must be 100 characters or fewer'),
  phone: yup.string().trim().required('Phone is required').max(30, 'Phone must be 30 characters or fewer'),
  email: yup
    .string()
    .trim()
    .required('Business email address is required')
    .max(255, 'Email must be 255 characters or fewer')
    .test('email-format', 'Email must be a valid email address', (value) => !value || yup.string().email().isValidSync(value)),
  address_line_1: yup.string().trim().required('Address line 1 is required').max(256, 'Address line 1 must be 256 characters or fewer'),
  address_line_2: yup.string().trim().max(255, 'Address line 2 must be 255 characters or fewer'),
  city: yup.string().trim().required('City is required').max(100, 'City must be 100 characters or fewer'),
  state: yup.string().trim().required('State / province is required').max(100, 'State / province must be 100 characters or fewer'),
  postal_code: yup.string().trim().max(20, 'Postal code must be 20 characters or fewer'),
  country: yup.string().trim().required('Country is required').max(100, 'Country must be 100 characters or fewer'),
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
  about: yup.string().trim().required('About is required').max(5000, 'About must be 5000 characters or fewer'),
})

const fieldConfigs: FieldConfig[] = [
  { name: 'gym_name', label: 'Gym Name', placeholder: 'Classy Fit', required: true, autoCapitalize: 'words' },
  { name: 'contact_name', label: 'Owner / Contact Full Name', placeholder: 'Jordan Smith', required: true, autoCapitalize: 'words' },
  { name: 'phone', label: 'Phone', placeholder: '(518) 610-8009', required: true, keyboardType: 'phone-pad' },
  { name: 'email', label: 'Business Email Address', placeholder: 'hello@example.com', required: true, keyboardType: 'email-address', autoCapitalize: 'none' },
  { name: 'address_line_1', label: 'Address Line 1', placeholder: '3143 US Route 9', required: true, autoCapitalize: 'words' },
  { name: 'address_line_2', label: 'Address Line 2', placeholder: 'Suite #4', autoCapitalize: 'words' },
  { name: 'city', label: 'City', placeholder: 'Valatie', required: true, autoCapitalize: 'words' },
  { name: 'postal_code', label: 'Postal Code', placeholder: '12184' },
  { name: 'photo_url', label: 'Gym Photo/Logo URL', placeholder: 'https://example.com/logo.png', keyboardType: 'url', autoCapitalize: 'none' },
  { name: 'website_url', label: 'Website URL', placeholder: 'https://example.com', keyboardType: 'url', autoCapitalize: 'none' },
  { name: 'about', label: 'About', placeholder: 'Tell people about your gym', required: true, multiline: true, numberOfLines: 5, autoCapitalize: 'sentences' },
]

const formSections: SectionConfig[] = [
  {
    title: 'Gym basics',
    description: 'Start with the details members and partners will recognize first.',
    fields: ['gym_name', 'contact_name', 'gym_type', 'phone', 'email'],
  },
  {
    title: 'Location',
    description: 'Add the primary address so members know where to find you.',
    fields: ['address_line_1', 'address_line_2', 'city', 'state', 'postal_code', 'country'],
  },
  {
    title: 'Brand presence',
    description: 'Share the story and links that help your gym stand out.',
    fields: ['photo_url', 'website_url', 'about'],
  },
]

const GYM_TYPE_OPTIONS: GymTypeOption[] = [
  { key: 'Commercial / Fitness Gym', value: 'Commercial / Fitness Gym' },
  { key: 'Boutique Fitness Studio', value: 'Boutique Fitness Studio' },
  { key: 'Personal Training Studio', value: 'Personal Training Studio' },
  { key: 'CrossFit / Functional Fitness', value: 'CrossFit / Functional Fitness' },
  { key: 'Yoga / Pilates Studio', value: 'Yoga / Pilates Studio' },
  { key: 'Martial Arts / Boxing Gym', value: 'Martial Arts / Boxing Gym' },
  { key: 'Other', value: 'Other' },
]

const US_STATE_OPTIONS = [
  'Alabama',
  'Alaska',
  'Arizona',
  'Arkansas',
  'California',
  'Colorado',
  'Connecticut',
  'Delaware',
  'District of Columbia',
  'Florida',
  'Georgia',
  'Hawaii',
  'Idaho',
  'Illinois',
  'Indiana',
  'Iowa',
  'Kansas',
  'Kentucky',
  'Louisiana',
  'Maine',
  'Maryland',
  'Massachusetts',
  'Michigan',
  'Minnesota',
  'Mississippi',
  'Missouri',
  'Montana',
  'Nebraska',
  'Nevada',
  'New Hampshire',
  'New Jersey',
  'New Mexico',
  'New York',
  'North Carolina',
  'North Dakota',
  'Ohio',
  'Oklahoma',
  'Oregon',
  'Pennsylvania',
  'Rhode Island',
  'South Carolina',
  'South Dakota',
  'Tennessee',
  'Texas',
  'Utah',
  'Vermont',
  'Virginia',
  'Washington',
  'West Virginia',
  'Wisconsin',
  'Wyoming',
]

const defaultValues: GymFormValues = {
  gym_name: '',
  contact_name: '',
  gym_type: '',
  phone: '',
  email: '',
  address_line_1: '',
  address_line_2: '',
  city: '',
  state: '',
  postal_code: '',
  country: 'United States',
  photo_url: '',
  website_url: '',
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
      const payload = {
        ...formData,
        gym_type: formData.gym_type.trim() ? formData.gym_type.trim() : null,
      }

      const response = await fetch(`${webServer}/api/v1/gyms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
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
            <View style={styles.heroCard}>
              <View style={styles.heroTopRow}>
                <View style={styles.heroIconWrap}>
                  <Feather name="home" color={AppColors.white} size={24} />
                </View>
                <View style={styles.heroCopy}>
                  <Text style={styles.heroEyebrow}>Owner setup</Text>
                  <Text style={styles.title}>Register your gym</Text>
                </View>
              </View>
              <Text style={styles.subHead}>
                Create a polished gym profile that helps owners get started quickly. Fields marked with * are required.
              </Text>
              <View style={styles.heroStatsRow}>
                <View style={styles.heroStatPill}>
                  <Ionicons name="shield-checkmark-outline" color={AppColors.blue} size={16} />
                  <Text style={styles.heroStatText}>Owner-led setup</Text>
                </View>
                <View style={styles.heroStatPill}>
                  <Ionicons name="location-outline" color={AppColors.blue} size={16} />
                  <Text style={styles.heroStatText}>Location ready</Text>
                </View>
                <View style={styles.heroStatPill}>
                  <Ionicons name="sparkles-outline" color={AppColors.blue} size={16} />
                  <Text style={styles.heroStatText}>Fast submission</Text>
                </View>
              </View>
            </View>

            <View style={styles.infoCard}>
              <View style={styles.infoHeader}>
                <Ionicons name="information-circle-outline" color={AppColors.blue} size={20} />
                <Text style={styles.infoTitle}>What you’ll need</Text>
              </View>
              <Text style={styles.infoText}>
                Have your gym name, business contact details, address, and a short description ready. A website and logo URL can be added now or later.
              </Text>
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

            {formSections.map((section, index) => (
              <View key={section.title} style={[styles.formCard, index > 0 && styles.formCardSpacer]}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>{section.title}</Text>
                  <Text style={styles.sectionDescription}>{section.description}</Text>
                </View>

                {section.fields.map((fieldName) => {
                  if (fieldName === 'gym_type') {
                    return (
                      <View key={fieldName} style={styles.field}>
                        <Text style={styles.label}>Gym Type *</Text>
                        <Controller
                          control={control}
                          name="gym_type"
                          render={({ field: { onChange, value } }) => {
                            const selectedGymType = GYM_TYPE_OPTIONS.find((option) => option.value === value)

                            return (
                              <SelectList
                                setSelected={(selectedValue) => onChange(String(selectedValue))}
                                data={GYM_TYPE_OPTIONS}
                                save="value"
                                placeholder="Select gym type"
                                defaultOption={
                                  selectedGymType
                                    ? { key: selectedGymType.key, value: selectedGymType.value }
                                    : undefined
                                }
                                boxStyles={{
                                  borderColor: AppColors.textInputBorderColor,
                                  borderWidth: 1,
                                  borderRadius: 14,
                                  minHeight: 48,
                                  paddingHorizontal: 12,
                                }}
                                dropdownStyles={{
                                  borderColor: AppColors.grey2,
                                  borderWidth: 1,
                                  marginTop: 8,
                                  backgroundColor: 'white',
                                  borderRadius: 14,
                                }}
                                inputStyles={{
                                  color: AppColors.primary,
                                  fontFamily: 'Montserrat',
                                }}
                                dropdownTextStyles={{
                                  color: AppColors.primary,
                                  fontFamily: 'Montserrat',
                                }}
                              />
                            )
                          }}
                        />
                        {fieldErrors.gym_type?.message ? <Text style={styles.errorText}>{fieldErrors.gym_type.message}</Text> : null}
                      </View>
                    )
                  }

                  if (fieldName === 'state') {
                    return (
                      <View key={fieldName} style={styles.field}>
                        <Text style={styles.label}>State / Province *</Text>
                        <Controller
                          control={control}
                          name="state"
                          render={({ field: { onChange, value } }) => {
                            const selectedState = US_STATE_OPTIONS.includes(value) ? value : undefined

                            return (
                              <SelectList
                                setSelected={(selectedValue) => onChange(String(selectedValue))}
                                data={US_STATE_OPTIONS.map((state) => ({ key: state, value: state }))}
                                save="value"
                                placeholder="Select a state"
                                defaultOption={selectedState ? { key: selectedState, value: selectedState } : undefined}
                                boxStyles={{
                                  borderColor: AppColors.textInputBorderColor,
                                  borderWidth: 1,
                                  borderRadius: 14,
                                  minHeight: 48,
                                  paddingHorizontal: 12,
                                }}
                                dropdownStyles={{
                                  borderColor: AppColors.grey2,
                                  borderWidth: 1,
                                  marginTop: 8,
                                  backgroundColor: 'white',
                                  borderRadius: 14,
                                }}
                                inputStyles={{
                                  color: AppColors.primary,
                                  fontFamily: 'Montserrat',
                                }}
                                dropdownTextStyles={{
                                  color: AppColors.primary,
                                  fontFamily: 'Montserrat',
                                }}
                              />
                            )
                          }}
                        />
                        {fieldErrors.state?.message ? <Text style={styles.errorText}>{fieldErrors.state.message}</Text> : null}
                      </View>
                    )
                  }

                  if (fieldName === 'country') {
                    return (
                      <View key={fieldName} style={styles.field}>
                        <Text style={styles.label}>Country *</Text>
                        <TextInput
                          style={[styles.input, styles.disabledInput]}
                          value="United States"
                          editable={false}
                          selectTextOnFocus={false}
                          pointerEvents="none"
                        />
                        {fieldErrors.country?.message ? <Text style={styles.errorText}>{fieldErrors.country.message}</Text> : null}
                      </View>
                    )
                  }

                  const field = fieldConfigs.find((item) => item.name === fieldName)
                  if (!field) {
                    return null
                  }

                  return (
                    <View key={field.name} style={styles.field}>
                      <Text style={styles.label}>
                        {field.label}
                        {field.required ? ' *' : ''}
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
                  )
                })}
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
                <View style={styles.submitButtonContent}>
                  <Feather name="check-circle" color={AppColors.white} size={18} />
                  <Text style={styles.submitButtonText}>Create Gym</Text>
                </View>
              )}
            </TouchableOpacity>
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
  heroCard: {
    backgroundColor: AppColors.blue,
    borderRadius: 28,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  heroIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  heroCopy: {
    flex: 1,
  },
  heroEyebrow: {
    color: 'rgba(255,255,255,0.8)',
    fontFamily: 'Montserrat',
    fontSize: 12,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  title: {
    color: AppColors.white,
    fontFamily: 'Montserrat',
    fontSize: 32,
    lineHeight: 38,
    marginBottom: 4,
  },
  subHead: {
    fontFamily: 'Montserrat',
    fontSize: 16,
    lineHeight: 24,
    color: 'rgba(255,255,255,0.92)',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 28,
  },
  scrollView: {},
  heroStatsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 16,
  },
  heroStatPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: AppColors.white,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  heroStatText: {
    color: AppColors.blue,
    fontFamily: 'Montserrat',
    fontSize: 12,
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: AppColors.grey4,
    borderRadius: 24,
    padding: 16,
    marginBottom: 16,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoTitle: {
    color: AppColors.primary,
    fontFamily: 'Montserrat',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 8,
  },
  infoText: {
    color: AppColors.primary,
    fontFamily: 'Montserrat',
    fontSize: 14,
    lineHeight: 21,
  },
  formCard: {
    backgroundColor: AppColors.white,
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  formCardSpacer: {
    marginTop: 14,
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    color: AppColors.primary,
    fontFamily: 'Montserrat',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 4,
  },
  sectionDescription: {
    color: AppColors.grey3,
    fontFamily: 'Montserrat',
    fontSize: 13,
    lineHeight: 19,
  },
  field: {
    marginBottom: 14,
  },
  label: {
    color: AppColors.primary,
    fontFamily: 'Montserrat',
    fontSize: 14,
    marginBottom: 6,
  },
  input: {
    borderColor: AppColors.textInputBorderColor,
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
  disabledInput: {
    backgroundColor: '#F9FAFB',
    color: AppColors.grey3,
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
    marginTop: 18,
    backgroundColor: AppColors.blue,
    borderRadius: 999,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: AppColors.blue,
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  submitButtonDisabled: {
    opacity: 0.75,
  },
  submitButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  submitButtonText: {
    color: AppColors.white,
    fontSize: 16,
    fontFamily: 'Montserrat',
    fontWeight: '700',
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
