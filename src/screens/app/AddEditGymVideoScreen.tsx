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
import Feather from '@expo/vector-icons/Feather'
import { showMessage } from 'react-native-flash-message'
import { AppColors } from '../../styles/colors'
import { UserContext } from '../../context/UserContext'
import {
  createGymVideo,
  fetchGymVideoByUid,
  getGymVideoCategoryLabel,
  gymVideoCategories,
  gymVideoStatusOptions,
  gymVideoTypeOptions,
  isValidGymVideoHttpsUrl,
  isValidGymVideoUrl,
  normalizeGymVideoCategory,
  normalizeGymVideoStatus,
  normalizeGymVideoType,
  updateGymVideo,
  type GymVideoCategory,
  type GymVideoRecord,
  type GymVideoStatus,
  type GymVideoType,
} from '../../utils/gymVideosApi'
import SignOut from '../../components/utils/SignOut'

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

type GymVideoFormValues = {
  title: string
  description: string
  category: GymVideoCategory
  video_type: GymVideoType
  video_url: string
  thumbnail_url: string
  status: GymVideoStatus
}

type GymVideoFormInputs = {
  title?: string
  description?: string
  category?: GymVideoCategory
  video_type?: GymVideoType
  video_url?: string
  thumbnail_url?: string
  status?: GymVideoStatus
}

type RouteParams = {
  videoUid?: number | string
}

const gymVideoSchema = yup.object({
  title: yup
    .string()
    .trim()
    .required('Title is required')
    .max(150, 'Title must be 150 characters or fewer'),
  description: yup
    .string()
    .trim()
    .nullable()
    .max(1000, 'Description must be 1000 characters or fewer'),
  category: yup
    .mixed<GymVideoCategory>()
    .oneOf(gymVideoCategories.map((option) => option.key) as GymVideoCategory[], 'Select a valid category')
    .required('Category is required'),
  video_type: yup
    .mixed<GymVideoType>()
    .oneOf(gymVideoTypeOptions.map((option) => option.key) as GymVideoType[], 'Select a valid video type')
    .required('Video type is required'),
  video_url: yup
    .string()
    .trim()
    .required('Video URL is required')
    .test('video-url', 'Enter a valid YouTube or HTTPS video URL', (value, context) => {
      const type = String(context.parent?.video_type ?? '').trim().toLowerCase() as GymVideoType
      return isValidGymVideoUrl(String(value ?? ''), type)
    }),
  thumbnail_url: yup
    .string()
    .trim()
    .nullable()
    .test('thumbnail-url', 'Thumbnail URL must use HTTPS', (value) => {
      if (!value) {
        return true
      }

      return isValidGymVideoHttpsUrl(String(value))
    }),
  status: yup
    .mixed<GymVideoStatus>()
    .oneOf(gymVideoStatusOptions.map((option) => option.key) as GymVideoStatus[], 'Select a valid status')
    .required('Status is required'),
})

const defaultValues: GymVideoFormValues = {
  title: '',
  description: '',
  category: 'workout_suggestions',
  video_type: 'youtube',
  video_url: '',
  thumbnail_url: '',
  status: 'draft',
}

const toFormValues = (video: GymVideoRecord): GymVideoFormValues => ({
  title: String(video.title ?? ''),
  description: String(video.description ?? ''),
  category: normalizeGymVideoCategory(video.category),
  video_type: normalizeGymVideoType(video.video_type),
  video_url: String(video.video_url ?? ''),
  thumbnail_url: String(video.thumbnail_url ?? ''),
  status: normalizeGymVideoStatus(video.status),
})

const AddEditGymVideoScreen = ({ navigation, route }: { navigation: any; route: { params?: RouteParams } }) => {
  const { user, tokens, setTokens, webServer } = useContext(UserContext) as UserContextValue
  const [submitting, setSubmitting] = useState(false)
  const [loadingVideo, setLoadingVideo] = useState(false)
  const [serverMessage, setServerMessage] = useState('')
  const [loadErrorMessage, setLoadErrorMessage] = useState('')
  const [reloadCounter, setReloadCounter] = useState(0)

  const isOwner = String(user?.role ?? '').trim().toLowerCase() === 'owner'
  const gymId = user?.gym_id ?? null
  const videoUid = route?.params?.videoUid ?? null
  const isEditing = videoUid !== null && videoUid !== undefined && String(videoUid).trim() !== ''

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<GymVideoFormValues, unknown, GymVideoFormInputs>({
    resolver: yupResolver(gymVideoSchema),
    defaultValues,
    mode: 'onSubmit',
  })

  const selectedVideoType = watch('video_type')
  useEffect(() => {
    if (!isOwner) {
      return
    }

    if (!isEditing || !gymId || !tokens?.access_token) {
      setLoadingVideo(false)
      reset(defaultValues)
      setLoadErrorMessage('')
      return
    }

    let isMounted = true
    setLoadingVideo(true)
    setLoadErrorMessage('')

    const loadVideo = async () => {
      try {
        const result = await fetchGymVideoByUid({
          webServer,
          gymId,
          videoUid: String(videoUid),
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          setTokens,
        })

        if (!isMounted) {
          return
        }

        if (!result.ok) {
          const failure = result as { ok: false; message: string }
          setLoadErrorMessage(failure.message)
          setLoadingVideo(false)
          return
        }

        setLoadErrorMessage('')
        setServerMessage('')
        reset(toFormValues(result.video))
        setLoadingVideo(false)
      } catch {
        if (isMounted) {
          setLoadErrorMessage('Unable to load this video right now.')
          setLoadingVideo(false)
        }
      }
    }

    void loadVideo()

    return () => {
      isMounted = false
    }
  }, [gymId, isEditing, isOwner, reloadCounter, reset, setTokens, tokens?.access_token, tokens?.refresh_token, videoUid, webServer])

  const videoTypeLabel = useMemo(() => {
    return gymVideoTypeOptions.find((option) => option.key === selectedVideoType)?.value ?? 'Video'
  }, [selectedVideoType])

  const title = isEditing ? 'Edit Gym Video' : 'Add Gym Video'
  const submitLabel = isEditing ? 'Save Changes' : 'Create Video'
  const renderTopNav = () => (
    <View style={styles.navs}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
        <Feather name="arrow-left" color={AppColors.blue} size={36} />
      </TouchableOpacity>
      <SignOut />
    </View>
  )

  const onSubmit = useCallback(async (formData: GymVideoFormValues) => {
    if (submitting) {
      return
    }

    if (!isOwner || !gymId || !tokens?.access_token) {
      setServerMessage('Please sign in again to manage gym videos.')
      showMessage({
        message: 'Permission required',
        description: 'Please sign in again to manage gym videos.',
        type: 'danger',
      })
      return
    }

    const payload = {
      title: String(formData.title ?? '').trim(),
      description: String(formData.description ?? '').trim() || null,
      category: formData.category,
      video_type: formData.video_type,
      video_url: String(formData.video_url ?? '').trim(),
      thumbnail_url: String(formData.thumbnail_url ?? '').trim() || null,
      status: formData.status,
    }

    setSubmitting(true)
    setServerMessage('')

    try {
      const request = isEditing
        ? updateGymVideo({
          webServer,
          gymId,
          videoUid: String(videoUid),
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          setTokens,
          payload,
        })
        : createGymVideo({
          webServer,
          gymId,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          setTokens,
          payload,
        })

      const result = await request

      if (!result.ok) {
        const failure = result as { ok: false; message: string; errors?: string[] }
        const message = failure.errors?.[0] || failure.message
        setServerMessage(message)
        showMessage({
          message: isEditing ? 'Update failed' : 'Create failed',
          description: message,
          type: 'danger',
        })
        return
      }

      showMessage({
        message: isEditing ? 'Video updated' : 'Video created',
        description: result.message || `The gym ${isEditing ? 'video was updated' : 'video was created'} successfully.`,
        type: 'success',
      })
      navigation.goBack()
    } finally {
      setSubmitting(false)
    }
  }, [gymId, isEditing, navigation, setTokens, submitting, tokens?.access_token, tokens?.refresh_token, videoUid, webServer, isOwner])

  if (!isOwner) {
    return (
      <SafeAreaView style={styles.safeArea}>
        {renderTopNav()}
        <View style={styles.accessDeniedContainer}>
          <Feather name="lock" size={34} color={AppColors.blue} />
          <Text style={styles.accessDeniedTitle}>Owner access required</Text>
          <Text style={styles.accessDeniedText}>
            Only gym owners can create or edit videos.
          </Text>
        </View>
      </SafeAreaView>
    )
  }

  if (isEditing && loadErrorMessage && !loadingVideo) {
    return (
      <SafeAreaView style={styles.safeArea}>
        {renderTopNav()}
        <View style={styles.accessDeniedContainer}>
          <Feather name="alert-triangle" size={34} color="#c2410c" />
          <Text style={styles.accessDeniedTitle}>Unable to load video</Text>
          <Text style={styles.accessDeniedText}>{loadErrorMessage}</Text>
          <View style={styles.errorActionRow}>
            <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
              <Text style={styles.cancelButtonText}>Go Back</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.submitButton}
              onPress={() => setReloadCounter((value) => value + 1)}
            >
              <Text style={styles.submitButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {renderTopNav()}
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>
              Add videos for workouts, equipment usage, safety, or recovery guidance.
            </Text>
          </View>

          {loadingVideo ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={AppColors.blue} />
            </View>
          ) : (
            <>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Title</Text>
                <Controller
                  control={control}
                  name="title"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      style={[styles.input, errors.title ? styles.inputError : null]}
                      value={value}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      placeholder="Strength Training Essentials"
                      placeholderTextColor="#9ca3af"
                    />
                  )}
                />
                {errors.title ? <Text style={styles.errorText}>{errors.title.message}</Text> : null}
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Description</Text>
                <Controller
                  control={control}
                  name="description"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      style={[styles.input, styles.textArea, errors.description ? styles.inputError : null]}
                      value={value}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      placeholder="Share what members will learn from this video."
                      placeholderTextColor="#9ca3af"
                      multiline
                      numberOfLines={4}
                      textAlignVertical="top"
                    />
                  )}
                />
                {errors.description ? <Text style={styles.errorText}>{errors.description.message}</Text> : null}
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Category</Text>
                <Controller
                  control={control}
                  name="category"
                  render={({ field: { onChange, value } }) => (
                    <SelectList
                      setSelected={onChange}
                      data={gymVideoCategories.map((option) => ({ key: option.key, value: option.label }))}
                      save="key"
                      defaultOption={{ key: value, value: getGymVideoCategoryLabel(value) }}
                      placeholder="Select a category"
                      boxStyles={StyleSheet.flatten([styles.selectBox, errors.category ? styles.inputError : null])}
                      inputStyles={styles.selectInput}
                      dropdownStyles={styles.dropdown}
                      dropdownTextStyles={styles.dropdownText}
                      search={false}
                    />
                  )}
                />
                {errors.category ? <Text style={styles.errorText}>{errors.category.message}</Text> : null}
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Video Type</Text>
                <Controller
                  control={control}
                  name="video_type"
                  render={({ field: { onChange, value } }) => (
                    <SelectList
                      setSelected={onChange}
                      data={gymVideoTypeOptions}
                      save="key"
                      defaultOption={gymVideoTypeOptions.find((option) => option.key === value)}
                      placeholder="Select a video type"
                      boxStyles={StyleSheet.flatten([styles.selectBox, errors.video_type ? styles.inputError : null])}
                      inputStyles={styles.selectInput}
                      dropdownStyles={styles.dropdown}
                      dropdownTextStyles={styles.dropdownText}
                      search={false}
                    />
                  )}
                />
                {errors.video_type ? <Text style={styles.errorText}>{errors.video_type.message}</Text> : null}
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Video URL</Text>
                <Controller
                  control={control}
                  name="video_url"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      style={[styles.input, errors.video_url ? styles.inputError : null]}
                      value={value}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      placeholder={selectedVideoType === 'youtube' ? 'https://www.youtube.com/watch?v=...' : 'https://...'}
                      placeholderTextColor="#9ca3af"
                      autoCapitalize="none"
                      keyboardType="url"
                    />
                  )}
                />
                <Text style={styles.helperText}>
                  {videoTypeLabel} videos must use a valid HTTPS link.
                </Text>
                {errors.video_url ? <Text style={styles.errorText}>{errors.video_url.message}</Text> : null}
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Thumbnail URL</Text>
                <Controller
                  control={control}
                  name="thumbnail_url"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      style={[styles.input, errors.thumbnail_url ? styles.inputError : null]}
                      value={value}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      placeholder="Optional HTTPS thumbnail URL"
                      placeholderTextColor="#9ca3af"
                      autoCapitalize="none"
                      keyboardType="url"
                    />
                  )}
                />
                {errors.thumbnail_url ? <Text style={styles.errorText}>{errors.thumbnail_url.message}</Text> : null}
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Status</Text>
                <Controller
                  control={control}
                  name="status"
                  render={({ field: { onChange, value } }) => (
                    <SelectList
                      setSelected={onChange}
                      data={gymVideoStatusOptions}
                      save="key"
                      defaultOption={gymVideoStatusOptions.find((option) => option.key === value)}
                      placeholder="Select a status"
                      boxStyles={StyleSheet.flatten([styles.selectBox, errors.status ? styles.inputError : null])}
                      inputStyles={styles.selectInput}
                      dropdownStyles={styles.dropdown}
                      dropdownTextStyles={styles.dropdownText}
                      search={false}
                    />
                  )}
                />
                {errors.status ? <Text style={styles.errorText}>{errors.status.message}</Text> : null}
              </View>

              {serverMessage ? <Text style={styles.serverMessage}>{serverMessage}</Text> : null}

              <View style={styles.buttonRow}>
                <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.submitButton, submitting ? styles.disabledButton : null]}
                  disabled={submitting}
                  onPress={handleSubmit(onSubmit)}
                >
                  {submitting ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.submitButtonText}>{submitLabel}</Text>
                  )}
                </TouchableOpacity>
              </View>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

export default AddEditGymVideoScreen

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: AppColors.white,
  },
  navs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  backBtn: {
    alignSelf: 'flex-start',
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
  },
  header: {
    marginBottom: 18,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: AppColors.primary,
  },
  subtitle: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
    color: AppColors.primary,
    opacity: 0.75,
  },
  loadingContainer: {
    minHeight: 320,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 8,
    fontSize: 14,
    fontWeight: '600',
    color: AppColors.primary,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: AppColors.primary,
    backgroundColor: '#fff',
  },
  textArea: {
    minHeight: 110,
  },
  inputError: {
    borderColor: '#dc2626',
  },
  errorText: {
    marginTop: 6,
    color: '#dc2626',
    fontSize: 13,
  },
  helperText: {
    marginTop: 6,
    color: AppColors.primary,
    opacity: 0.6,
    fontSize: 12,
  },
  selectBox: {
    borderRadius: 14,
    borderColor: '#d1d5db',
    minHeight: 52,
    backgroundColor: '#fff',
  },
  selectInput: {
    color: AppColors.primary,
    fontSize: 16,
  },
  dropdown: {
    borderRadius: 14,
    borderColor: '#d1d5db',
  },
  dropdownText: {
    color: AppColors.primary,
  },
  serverMessage: {
    marginTop: 4,
    color: '#dc2626',
    fontSize: 14,
    lineHeight: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: AppColors.blue,
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    color: AppColors.blue,
    fontWeight: '700',
  },
  submitButton: {
    flex: 1,
    backgroundColor: AppColors.blue,
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  disabledButton: {
    opacity: 0.7,
  },
  accessDeniedContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  accessDeniedTitle: {
    marginTop: 12,
    fontSize: 20,
    fontWeight: '700',
    color: AppColors.primary,
  },
  accessDeniedText: {
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
    color: AppColors.primary,
    opacity: 0.75,
  },
  errorActionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 18,
  },
})
