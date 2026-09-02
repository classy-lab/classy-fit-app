// @ts-nocheck
import {
  Alert,
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { useContext, useEffect, useRef, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import Feather from '@expo/vector-icons/Feather'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { Controller, useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { SelectList } from 'react-native-dropdown-select-list'
import { RichEditor, RichToolbar, actions } from 'react-native-pell-rich-editor'
import ImagePicker from 'react-native-image-crop-picker'
import { hideMessage, showMessage } from 'react-native-flash-message'
import { AppColors } from '../../styles/colors'
import { UserContext } from '../../context/UserContext'
import DateOfBirthField from '../../components/forms/input_fields/DateOfBirthField'

const MAX_EQUIPMENT_IMAGE_BYTES = 10 * 1024 * 1024

const CATEGORY_OPTIONS = [
  { key: '1', value: 'Cardio' },
  { key: '2', value: 'Strength' },
  { key: '3', value: 'Free Weights' },
]

const STATUS_OPTIONS = [
  { key: 'active', value: 'Active' },
  { key: 'maintenance', value: 'Maintenance' },
  { key: 'out_of_service', value: 'Out of Service' },
  { key: 'retired', value: 'Retired' },
]

const CONDITION_OPTIONS = [
  { key: 'excellent', value: 'Excellent' },
  { key: 'good', value: 'Good' },
  { key: 'fair', value: 'Fair' },
  { key: 'poor', value: 'Poor' },
]

const nullablePositiveNumber = (label: string) =>
  yup
    .string()
    .nullable()
    .test('positive-number', `${label} must be greater than 0`, (value) => {
      if (value == null || String(value).trim() === '') return true
      const numberValue = Number(value)
      return Number.isFinite(numberValue) && numberValue > 0
    })

const nullableNonNegativeNumber = (label: string) =>
  yup
    .string()
    .nullable()
    .test('non-negative-number', `${label} must be 0 or greater`, (value) => {
      if (value == null || String(value).trim() === '') return true
      const numberValue = Number(value)
      return Number.isFinite(numberValue) && numberValue >= 0
    })

const editEquipmentSchema = yup.object({
  equipment_category_uid: yup
    .string()
    .oneOf(['1', '2', '3'], 'Category is required')
    .required('Category is required'),
  title: yup.string().trim().required('Title is required'),
  description: yup
    .string()
    .trim()
    .required('Description is required')
    .test('not-empty-html', 'Description is required', (value) => {
      if (!value) return false

      const plainText = value
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .trim()

      return plainText.length > 0
    }),
  brand: yup.string().trim().required('Brand is required'),
  model: yup.string().trim().required('Model is required'),
  serial_number: yup.string().nullable(),
  asset_tag: yup.string().nullable(),
  quantity: yup
    .string()
    .required('Quantity is required')
    .test('positive-integer', 'Quantity must be at least 1', (value) => {
      if (!value) return false
      const quantity = Number(value)
      return Number.isInteger(quantity) && quantity >= 1
    }),
  color: yup.string().nullable(),
  location: yup.string().trim().required('Location is required'),
  purchase_date: yup.string().nullable(),
  purchase_price: nullableNonNegativeNumber('Purchase price'),
  warranty_expiration_date: yup.string().nullable(),
  status: yup
    .string()
    .oneOf(['active', 'maintenance', 'out_of_service', 'retired'], 'Invalid status')
    .required('Status is required'),
  equipment_condition: yup
    .string()
    .oneOf(['excellent', 'good', 'fair', 'poor'], 'Invalid equipment condition')
    .required('Condition is required'),
  maintenance_interval_days: nullablePositiveNumber('Maintenance interval'),
  notes: yup.string().nullable(),
})

type EditEquipmentFormValues = {
  equipment_category_uid: string
  title: string
  description: string
  brand: string
  model: string
  serial_number: string
  asset_tag: string
  quantity: string
  color: string
  location: string
  purchase_date: string
  purchase_price: string
  warranty_expiration_date: string
  status: string
  equipment_condition: string
  maintenance_interval_days: string
  notes: string
}

const DEFAULT_FORM_VALUES: EditEquipmentFormValues = {
  equipment_category_uid: '',
  title: '',
  description: '',
  brand: '',
  model: '',
  serial_number: '',
  asset_tag: '',
  quantity: '1',
  color: '',
  location: '',
  purchase_date: '',
  purchase_price: '',
  warranty_expiration_date: '',
  status: 'active',
  equipment_condition: '',
  maintenance_interval_days: '',
  notes: '',
}

const TEXT_FIELDS = [
  ['title', 'Title:', 'Enter equipment title', { autoCapitalize: 'words' }],
  ['brand', 'Brand:', 'Enter brand', { autoCapitalize: 'words' }],
  ['model', 'Model:', 'Enter model', { autoCapitalize: 'characters' }],
  ['serial_number', 'Serial Number:', 'Enter serial number', { autoCapitalize: 'characters' }],
  ['asset_tag', 'Asset Tag:', 'Enter asset tag', { autoCapitalize: 'characters' }],
  ['quantity', 'Quantity:', 'Enter quantity', { keyboardType: 'number-pad', autoCapitalize: 'none' }],
  ['color', 'Color:', 'Enter color', { autoCapitalize: 'words' }],
  ['location', 'Location:', 'Enter gym location', { autoCapitalize: 'words' }],
  ['purchase_price', 'Purchase Price:', 'Enter purchase price', { keyboardType: 'decimal-pad', autoCapitalize: 'none' }],
  ['maintenance_interval_days', 'Maintenance Interval (Days):', 'Example: 90', { keyboardType: 'number-pad', autoCapitalize: 'none' }],
  ['notes', 'Notes:', 'Enter notes'],
]

const DATE_FIELDS = {
  purchase_date: ['purchase_date', 'Purchase Date:', 'Select purchase date', new Date()],
  warranty_expiration_date: [
    'warranty_expiration_date',
    'Warranty Expiration Date:',
    'Select warranty expiration date',
    null,
  ],
}

const RICH_EDITOR_ACTIONS = [
  actions.setBold,
  actions.setItalic,
  actions.setUnderline,
  actions.setStrikethrough,
  actions.insertBulletsList,
  actions.insertOrderedList,
  actions.insertLink,
  actions.undo,
  actions.redo,
]

const resolveEquipmentImageUri = (webServer: string, imageUrl?: string) => {
  const normalized = String(imageUrl ?? '').trim()
  if (!normalized) return ''
  if (/^https?:\/\//i.test(normalized) || normalized.startsWith('file://')) return normalized
  return `${webServer}/api/${normalized.replace(/^\/?(api\/)?/, '')}`
}

const buildImageSlots = (images = [], webServer: string) => {
  const sorted = [...images].sort((a, b) => Number(a?.sort_order ?? 999) - Number(b?.sort_order ?? 999))
  const slots = sorted.slice(0, 5).map((img, i) => ({
    id: `existing-${img?.uid || i}`,
    isPlaceholder: false,
    image_url: img?.image_url || '',
    source: { uri: resolveEquipmentImageUri(webServer, img?.image_url) },
  }))

  for (let i = slots.length; i < 5; i++) {
    slots.push({ id: `placeholder-${i}`, iconName: 'image-outline', isPlaceholder: true })
  }
  return slots
}

const emptyImageSlots = () => {
  const slots = []
  for (let i = 0; i < 5; i++) {
    slots.push({ id: `placeholder-${i}`, iconName: 'image-outline', isPlaceholder: true })
  }
  return slots
}

const optionForValue = (options, value) =>
  options.find((option) => option.key === String(value ?? ''))

const normalizeDateValue = (value: any) => {
  const normalized = String(value ?? '').trim()
  return normalized.length >= 10 ? normalized.slice(0, 10) : normalized
}

const equipmentToFormValues = (equipment: any): EditEquipmentFormValues => ({
  ...DEFAULT_FORM_VALUES,
  equipment_category_uid: String(equipment?.equipment_category_uid ?? ''),
  title: String(equipment?.title ?? ''),
  description: String(equipment?.description ?? ''),
  brand: String(equipment?.brand ?? ''),
  model: String(equipment?.model ?? ''),
  serial_number: String(equipment?.serial_number ?? ''),
  asset_tag: String(equipment?.asset_tag ?? ''),
  quantity: String(equipment?.quantity ?? '1'),
  color: String(equipment?.color ?? ''),
  location: String(equipment?.location ?? ''),
  purchase_date: normalizeDateValue(equipment?.purchase_date),
  purchase_price: equipment?.purchase_price == null ? '' : String(equipment.purchase_price),
  warranty_expiration_date: normalizeDateValue(equipment?.warranty_expiration_date),
  status: String(equipment?.status ?? 'active'),
  equipment_condition: String(equipment?.equipment_condition ?? ''),
  maintenance_interval_days:
    equipment?.maintenance_interval_days == null ? '' : String(equipment.maintenance_interval_days),
  notes: String(equipment?.notes ?? ''),
})

const buildRequestPayload = (formData: EditEquipmentFormValues) =>
  Object.fromEntries(
    Object.entries(formData).map(([key, value]) => [
      key,
      String(value ?? '').trim(),
    ])
  )

const buildEquipmentFormData = (
  formData: EditEquipmentFormValues,
  existingImages: Array<string>,
  newImages: Array<any>
) => {
  const requestPayload = new FormData()
  const fields = buildRequestPayload(formData)

  Object.entries(fields).forEach(([key, value]) => {
    requestPayload.append(key, String(value ?? ''))
  })

  requestPayload.append('image_update', '1')

  existingImages.forEach((imageUrl) => {
    requestPayload.append('image_urls[]', imageUrl)
  })

  newImages.forEach((imageFile) => {
    requestPayload.append('new_images[]', imageFile as any)
  })

  return requestPayload
}

const parseResponseJson = async (response: Response) => {
  const rawResponse = await response.text()
  return rawResponse ? JSON.parse(rawResponse) : {}
}

const showErrorMessage = (description: string, autoHide = true) =>
  showMessage({
    message: 'Action Failed',
    description,
    type: 'danger',
    icon: 'danger',
    autoHide,
  })

const EquipmentEditScreen = ({ navigation, route }) => {
  const { user, tokens, setTokens, webServer } = useContext(UserContext)
  const routeEquipment = route?.params?.equipment || {}
  const equipmentId = route?.params?.equipmentId ?? routeEquipment?.uid
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [descriptionHtml, setDescriptionHtml] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [imageError, setImageError] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const richText = useRef(null)
  const lastSyncedHtmlRef = useRef('')

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EditEquipmentFormValues>({
    resolver: yupResolver(editEquipmentSchema),
    defaultValues: DEFAULT_FORM_VALUES,
  })

  const [equipmentImages, setEquipmentImages] = useState(emptyImageSlots())

  const pickImage = async (targetIndex: number) => {
    try {
      const selectedAsset = await ImagePicker.openPicker({
        cropping: true,
        width: 380,
        height: 380,
        compressImageQuality: 0.7,
        forceJpg: true,
        mediaType: 'photo',
      })

      const mimeType = String(selectedAsset?.mime || '').toLowerCase()
      const fileName = String(selectedAsset?.filename || selectedAsset?.path || '').toLowerCase()
      const fileSize = Number(
        (selectedAsset as any)?.fileSize ?? (selectedAsset as any)?.size ?? 0
      )
      const hasAllowedExtension =
        fileName.endsWith('.jpg') ||
        fileName.endsWith('.jpeg') ||
        fileName.endsWith('.png') ||
        fileName.endsWith('.webp')
      const hasAllowedMimeType =
        mimeType === 'image/jpeg' ||
        mimeType === 'image/png' ||
        mimeType === 'image/webp'

      if (!hasAllowedMimeType && !hasAllowedExtension) {
        Alert.alert('Unsupported Format', 'Please select a JPEG, PNG, or WebP image.')
        return
      }

      if (fileSize > MAX_EQUIPMENT_IMAGE_BYTES) {
        Alert.alert('Image Too Large', 'Please select an image that is 10 MB or less.')
        return
      }

      const nextImage = {
        id: `picked-${Date.now()}-${targetIndex}`,
        isPlaceholder: false,
        source: { uri: selectedAsset.path },
        image_url: selectedAsset.path,
        localAsset: selectedAsset,
      }

      setEquipmentImages((prev) => {
        const next = [...prev]
        next[targetIndex] = nextImage
        return next
      })
      setImageError('')
      setSelectedImageIndex(targetIndex)
    } catch (error) {
      console.log('Equipment image selection cancelled or failed:', error)
    }
  }

  const removeImage = (targetIndex: number) => {
    setEquipmentImages((prev) => {
      const next = [...prev]
      next[targetIndex] = {
        id: `placeholder-${targetIndex}`,
        iconName: 'image-outline',
        isPlaceholder: true,
      }
      return next
    })
    setSelectedImageIndex((current) => (current === targetIndex ? 0 : current))
  }

  const hydrateForm = (payload: any) => {
    const formValues = equipmentToFormValues(payload)

    reset(formValues)
    setDescriptionHtml(formValues.description)
    setEquipmentImages(buildImageSlots(payload?.images || [], webServer))
    setSelectedImageIndex(0)
    setImageError('')
  }

  useEffect(() => {
    const fetchEquipment = async () => {
      if (!equipmentId) {
        setIsLoading(false)
        showErrorMessage('Missing equipment id. Please reopen this equipment from the list.')
        return
      }

      try {
        setIsLoading(true)

        const response = await fetch(
          `${webServer}/api/v1/gyms/${user.gym_id}/equipment/${equipmentId}`,
          {
            headers: {
              Authorization: 'Bearer ' + tokens.access_token,
            },
          }
        )

        const obj = await parseResponseJson(response)

        if (response.status === 200) {
          const payload = obj?.data || {}
          hydrateForm(payload)
          return
        }

        if (response.status === 401) {
          const refreshResponse = await fetch(`${webServer}/api/v1/refresh`, {
            method: 'POST',
            body: JSON.stringify({
              token: tokens.refresh_token,
            }),
          })
          const refreshObj = await refreshResponse.json()

          if (refreshResponse.status === 200) {
            setTokens((prev: any) => ({
              ...prev,
              access_token: refreshObj.access_token,
              refresh_token: refreshObj.refresh_token,
            }))
            return
          }
        }

        showErrorMessage(obj?.message || 'Unable to load equipment. Please try again.', false)
      } catch (error) {
        console.log('EquipmentEditScreen equipment error: ', error)
        showErrorMessage('Unable to load equipment. Please check your connection and try again.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchEquipment()
  }, [tokens?.access_token, tokens?.refresh_token, equipmentId, reset, webServer, user?.gym_id])

  useEffect(() => {
    if (!richText.current?.setContentHTML) {
      return
    }

    if (descriptionHtml === lastSyncedHtmlRef.current) {
      return
    }

    lastSyncedHtmlRef.current = descriptionHtml
    richText.current.setContentHTML(descriptionHtml || '')
  }, [descriptionHtml])

  const onSubmit = async (formData: EditEquipmentFormValues) => {
    if (isSubmitting) return

    const existingImages = equipmentImages
      .filter((image) => !image?.isPlaceholder && !image?.localAsset && image?.image_url)
      .map((image) => image.image_url)
    const existingImageCount = existingImages.length
    const newImages = equipmentImages
      .filter((image) => !image?.isPlaceholder && image?.localAsset?.path)
      .map((image, index) => {
        const localAsset = image.localAsset
        const mimeType = localAsset?.mime || 'image/jpeg'

        let extension = 'jpg'
        if (mimeType === 'image/png') extension = 'png'
        if (mimeType === 'image/webp') extension = 'webp'

        return {
          uri: localAsset.path,
          type: mimeType,
          name: localAsset?.filename || `equipment-image-${index + 1}.${extension}`,
        }
      })

    if (existingImageCount + newImages.length < 1) {
      setImageError('At least one image is required')
      return
    }

    try {
      setIsSubmitting(true)
      setImageError('')

      const originalImageCount = (equipment?.images || []).length
      const hasNewImages = newImages.length > 0
      const imagesWereRemoved = existingImageCount < originalImageCount
      const imagesChanged = hasNewImages || imagesWereRemoved

      const requestPayload = imagesChanged
        ? buildEquipmentFormData(formData, existingImages, newImages)
        : buildRequestPayload(formData)

      const response = await fetch(
        `${webServer}/api/v1/gyms/${user.gym_id}/equipment/${equipmentId}`,
        {
          method: imagesChanged ? 'POST' : 'PUT',
          headers: imagesChanged
            ? { Authorization: 'Bearer ' + tokens.access_token }
            : {
                Authorization: 'Bearer ' + tokens.access_token,
                'Content-Type': 'application/json',
              },
          body: imagesChanged ? requestPayload : JSON.stringify(requestPayload),
        }
      )

      const obj = await parseResponseJson(response)

      if (response.status === 200) {
        const updatedEquipment = obj?.data || {
          ...(routeEquipment || {}),
          ...buildRequestPayload(formData),
        }

        showMessage({
          message: 'Success',
          description: obj?.message || 'Equipment updated successfully.',
          type: 'success',
          icon: 'success',
          duration: 3000,
          autoHide: true,
          onPress: () => hideMessage(),
        })

        if (navigation.canGoBack()) {
          navigation.goBack()
        } else {
          navigation.navigate('EquipmentDetailScreen', {
            equipmentId,
            equipment: updatedEquipment,
          })
        }
        return
      }

      const errorDetails = Array.isArray(obj?.errors) ? obj.errors.join('\n') : ''
      const errorMsg = errorDetails || obj?.message || `Something went wrong while updating equipment (${response.status}).`
      console.log('Equipment update error response:', obj)
      console.log('Detailed validation errors:', obj?.errors)
      showErrorMessage(errorMsg, false)
    } catch (error) {
      console.log('Update equipment request failed:', error)
      showErrorMessage('Network error while updating equipment.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteEquipment = async () => {
    if (isDeleting || !equipmentId) return

    try {
      setIsDeleting(true)

      const response = await fetch(
        `${webServer}/api/v1/gyms/${user.gym_id}/equipment/${equipmentId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: 'Bearer ' + tokens.access_token,
          },
        }
      )

      const obj = await parseResponseJson(response)

      if (response.status === 200) {
        showMessage({
          message: 'Success',
          description: obj?.message || 'Equipment deleted successfully.',
          type: 'success',
          icon: 'success',
          duration: 3000,
          autoHide: true,
          onPress: () => hideMessage(),
        })

        navigation.navigate('GymEquipmentScreen')
        return
      }

      showErrorMessage(
        obj?.message || `Something went wrong while deleting equipment (${response.status}).`,
        false
      )
    } catch (error) {
      console.log('Delete equipment request failed:', error)
      showErrorMessage('Network error while deleting equipment.')
    } finally {
      setIsDeleting(false)
    }
  }

  const renderTextField = (
    name: keyof EditEquipmentFormValues,
    label: string,
    placeholder: string,
    options: any = {}
  ) => (
    <View style={styles.inputField}>
      <Text style={styles.formLabel}>{label}</Text>
      <Controller
        control={control}
        name={name}
        render={({ field: { onChange, value } }) => (
          <TextInput
            style={styles.textField}
            value={value}
            onChangeText={onChange}
            placeholder={placeholder}
            placeholderTextColor={AppColors.grey2}
            autoCapitalize={options.autoCapitalize || 'sentences'}
            keyboardType={options.keyboardType || 'default'}
            returnKeyType="done"
          />
        )}
      />
      {errors?.[name]?.message ? (
        <Text style={styles.errorText}>{String(errors[name]?.message)}</Text>
      ) : null}
    </View>
  )

  const renderSelectField = (
    name: keyof EditEquipmentFormValues,
    label: string,
    placeholder: string,
    data: Array<{ key: string; value: string }>
  ) => (
    <View style={styles.inputField}>
      <Text style={styles.formLabel}>{label}</Text>
      <Controller
        control={control}
        name={name}
        render={({ field: { onChange, value } }) => (
          <SelectList
            setSelected={onChange}
            data={data}
            save="key"
            placeholder={placeholder}
            defaultOption={optionForValue(data, value)}
            search={false}
            boxStyles={styles.selectBox}
            dropdownStyles={styles.selectDropdown}
            inputStyles={styles.selectInput}
            dropdownTextStyles={styles.selectDropdownText}
          />
        )}
      />
      {errors?.[name]?.message ? (
        <Text style={styles.errorText}>{String(errors[name]?.message)}</Text>
      ) : null}
    </View>
  )

  const renderDateField = (
    name: keyof EditEquipmentFormValues,
    label: string,
    placeholder: string,
    maximumDate?: Date | null
  ) => (
    <View style={styles.inputField}>
      <Text style={styles.formLabel}>{label}</Text>
      <Controller
        control={control}
        name={name}
        render={({ field: { onChange, onBlur, value } }) => (
          <DateOfBirthField
            value={value}
            onChange={onChange}
            onBlur={onBlur}
            placeholder={placeholder}
            title={label.replace(':', '')}
            maximumDate={maximumDate}
          />
        )}
      />
      {errors?.[name]?.message ? (
        <Text style={styles.errorText}>{String(errors[name]?.message)}</Text>
      ) : null}
    </View>
  )

  const selectedImage = equipmentImages?.[selectedImageIndex]

  return (
    <>
      <SafeAreaView style={styles.container}>
        <View style={styles.navs}>
          <Feather
            name="arrow-left"
            color={AppColors.blue}
            size={36}
            onPress={() => {
              if (navigation.canGoBack()) {
                navigation.goBack()
              }
            }}
          />
        </View>

        {isLoading ? (
          <ActivityIndicator size="large" color={AppColors.blue} style={styles.loadingIndicator} />
        ) : (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.headingContainer}>
              <Text style={styles.title}>Edit Equipment</Text>
            </View>

            <View style={styles.body}>
              <View>
                <View style={styles.heroImageContainer}>
                  {selectedImage && !selectedImage?.isPlaceholder ? (
                    <Image
                      style={styles.heroImage}
                      source={{ uri: selectedImage?.source?.uri }}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.placeholderHero}>
                      <MaterialCommunityIcons
                        name="image-outline"
                        size={88}
                        color={AppColors.blue}
                      />
                    </View>
                  )}
                </View>

                <View style={styles.heroImageThumbnails}>
                  {equipmentImages.map((image, index) => (
                    <View key={image.id} style={styles.thumbnailWrapper}>
                      <TouchableOpacity
                        onPress={() => {
                          setSelectedImageIndex(index)
                          pickImage(index)
                        }}
                      >
                        {image.isPlaceholder ? (
                          <View
                            style={[
                              styles.thumbnail,
                              styles.placeholderThumbnail,
                              selectedImageIndex === index && styles.selectedThumbnail,
                            ]}
                          >
                            <MaterialCommunityIcons
                              name={image.iconName || 'image-outline'}
                              size={24}
                              color={AppColors.blue}
                            />
                          </View>
                        ) : (
                          <Image
                            style={[
                              styles.thumbnail,
                              selectedImageIndex === index && styles.selectedThumbnail,
                            ]}
                            source={image.source}
                            resizeMode="cover"
                          />
                        )}
                      </TouchableOpacity>
                      {!image.isPlaceholder && (
                        <TouchableOpacity
                          style={styles.removeImageBtn}
                          onPress={() => removeImage(index)}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <MaterialCommunityIcons name="close" size={14} color="#fff" />
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}
                </View>
                <Text style={styles.imageHelpText}>
                  Up to 5 JPEG, PNG, or WebP images. Maximum 10 MB each.
                </Text>
                <Text style={styles.imageHelpText}>
                  Existing images are preserved. New images fill empty slots.
                </Text>
                {imageError ? <Text style={styles.imageErrorText}>{imageError}</Text> : null}
              </View>

              <View style={styles.content}>
                {renderTextField(...TEXT_FIELDS[0])}

                <View style={styles.descriptionBlock}>
                  <Text style={styles.formLabel}>Description:</Text>
                  <RichToolbar
                    editor={richText}
                    style={styles.richToolbar}
                    iconTint={AppColors.blue}
                    selectedIconTint={AppColors.white}
                    selectedButtonStyle={styles.richToolbarSelectedButton}
                    actions={RICH_EDITOR_ACTIONS}
                  />
                  <View style={styles.richEditorContainer}>
                    <Controller
                      control={control}
                      name="description"
                      render={({ field: { onChange } }) => (
                        <RichEditor
                          ref={richText}
                          useContainer={false}
                          style={styles.richEditor}
                          initialContentHTML={descriptionHtml}
                          initialHeight={36}
                          placeholder="Enter description"
                          editorStyle={{
                            backgroundColor: AppColors.grey,
                            color: AppColors.blue,
                            placeholderColor: AppColors.grey2,
                            contentCSSText: 'font-size: 14px; line-height: 18px; min-height: 28px;',
                          }}
                          onChange={(value) => {
                            lastSyncedHtmlRef.current = value
                            setDescriptionHtml(value)
                            onChange(value)
                          }}
                        />
                      )}
                    />
                  </View>
                  {errors?.description?.message ? (
                    <Text style={styles.errorText}>{String(errors.description.message)}</Text>
                  ) : null}
                </View>

                {renderSelectField(
                  'equipment_category_uid',
                  'Category:',
                  'Select category',
                  CATEGORY_OPTIONS
                )}
                {TEXT_FIELDS.slice(1, 8).map(([name, label, placeholder, options]) =>
                  renderTextField(name, label, placeholder, options)
                )}
                {renderDateField(...DATE_FIELDS.purchase_date)}
                {renderTextField(...TEXT_FIELDS[8])}
                {renderDateField(...DATE_FIELDS.warranty_expiration_date)}
                {renderSelectField('status', 'Status:', 'Select status', STATUS_OPTIONS)}
                {renderSelectField(
                  'equipment_condition',
                  'Condition:',
                  'Select condition',
                  CONDITION_OPTIONS
                )}
                {TEXT_FIELDS.slice(9).map((field) => renderTextField(...field))}

                <View style={styles.row}>
                  <TouchableOpacity
                    style={[styles.primaryBtn, isSubmitting && styles.disabledBtn]}
                    onPress={handleSubmit(onSubmit)}
                    disabled={isSubmitting}
                  >
                    <Text style={styles.primaryBtnText}>
                      {isSubmitting ? 'Saving...' : 'Save Changes'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.secondaryBtn, isDeleting && styles.disabledBtn]}
                    onPress={() => {
                      Alert.alert(
                        'Delete Equipment',
                        'Are you sure you want to delete this equipment? This cannot be undone.',
                        [
                          { text: 'Cancel', style: 'cancel' },
                          { text: 'Delete', style: 'destructive', onPress: handleDeleteEquipment },
                        ]
                      )
                    }}
                    disabled={isSubmitting || isDeleting}
                  >
                    <Text style={styles.secondaryBtnText}>
                      {isDeleting ? 'Deleting...' : 'Delete Equipment'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </ScrollView>
        )}
      </SafeAreaView>
    </>
  )
}

export default EquipmentEditScreen

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.white,
  },
  navs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingLeft: 24,
    paddingRight: 24,
  },
  headingContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    color: AppColors.blue,
    fontSize: 32,
    marginTop: 60,
  },
  body: {
    paddingLeft: 24,
    paddingRight: 24,
    marginBottom: 24,
  },
  scrollView: {},
  scrollContent: {
    paddingBottom: 40,
  },
  loadingIndicator: {
    marginTop: 80,
  },
  heroImageContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  heroImage: {
    width: 232,
    height: 232,
    borderRadius: 12,
  },
  placeholderHero: {
    width: 232,
    height: 232,
    borderRadius: 12,
    backgroundColor: AppColors.grey,
    borderWidth: 1,
    borderColor: AppColors.textInputBorderColor,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroImageThumbnails: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    flexWrap: 'wrap',
    rowGap: 8,
  },
  thumbnailWrapper: {
    position: 'relative',
  },
  removeImageBtn: {
    position: 'absolute',
    top: -6,
    right: 2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: AppColors.blue,
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbnail: {
    width: 56,
    height: 56,
    marginRight: 8,
    borderRadius: 8,
  },
  placeholderThumbnail: {
    backgroundColor: AppColors.grey,
    borderWidth: 1,
    borderColor: AppColors.textInputBorderColor,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedThumbnail: {
    borderWidth: 2,
    borderColor: AppColors.blue,
  },
  imageHelpText: {
    marginTop: 10,
    color: AppColors.grey2,
    fontSize: 12,
    textAlign: 'center',
  },
  imageErrorText: {
    color: AppColors.red,
    fontSize: 12,
    marginTop: 6,
    textAlign: 'center',
  },
  content: {
    marginTop: 24,
  },
  descriptionBlock: {
    marginTop: 16,
    marginBottom: 8,
  },
  formLabel: {
    marginBottom: 8,
  },
  inputField: {
    marginBottom: 8,
  },
  textField: {
    marginTop: 5,
    borderWidth: 1,
    borderColor: AppColors.textInputBorderColor,
    backgroundColor: AppColors.grey,
    paddingLeft: 12,
    height: 48,
    borderRadius: 8,
    color: AppColors.blue,
  },
  selectBox: {
    marginTop: 5,
    borderWidth: 1,
    borderColor: AppColors.textInputBorderColor,
    backgroundColor: AppColors.grey,
    minHeight: 48,
    borderRadius: 8,
    paddingLeft: 12,
  },
  selectDropdown: {
    borderColor: AppColors.grey2,
    borderWidth: 1,
    marginTop: 8,
    backgroundColor: AppColors.white,
  },
  selectInput: {
    color: AppColors.blue,
  },
  selectDropdownText: {
    color: AppColors.blue,
  },
  errorText: {
    color: AppColors.red,
    fontSize: 12,
    marginTop: 4,
  },
  richEditorContainer: {
    height: 260,
    borderWidth: 1,
    borderColor: AppColors.textInputBorderColor,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: AppColors.grey,
  },
  richEditor: {
    flex: 1,
    backgroundColor: AppColors.grey,
  },
  richToolbar: {
    marginBottom: 8,
    borderWidth: 1,
    borderColor: AppColors.textInputBorderColor,
    borderRadius: 8,
    backgroundColor: AppColors.grey,
  },
  richToolbarSelectedButton: {
    backgroundColor: AppColors.blue,
    borderRadius: 6,
  },
  row: {
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 16,
  },
  primaryBtn: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: AppColors.blue,
    borderRadius: 40,
    width: 248,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  primaryBtnText: {
    color: AppColors.blue,
    fontSize: 16,
  },
  secondaryBtn: {
    backgroundColor: AppColors.blue,
    borderRadius: 40,
    width: 248,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  secondaryBtnText: {
    fontSize: 16,
    color: '#fff',
  },
  disabledBtn: {
    opacity: 0.6,
  },
})
