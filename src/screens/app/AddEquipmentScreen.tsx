// @ts-nocheck
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { useContext, useRef, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import Feather from '@expo/vector-icons/Feather'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { Controller, useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import ImagePicker from 'react-native-image-crop-picker'
import { RichEditor, RichToolbar, actions } from 'react-native-pell-rich-editor'
import { SelectList } from 'react-native-dropdown-select-list'
import { hideMessage, showMessage } from 'react-native-flash-message'
import { AppColors } from '../../styles/colors'
import { UserContext } from '../../context/UserContext'
import DateOfBirthField from '../../components/forms/input_fields/DateOfBirthField'

const MAX_EQUIPMENT_IMAGE_BYTES = 10 * 1024 * 1024
const EQUIPMENT_IMAGE_PLACEHOLDER_COUNT = 5

const STATUS_VALUES = ['active', 'maintenance', 'out_of_service', 'retired']
const CONDITION_VALUES = ['excellent', 'good', 'fair', 'poor']

const CATEGORY_OPTIONS = [
  { key: '1', value: 'Cardio' },
  { key: '2', value: 'Strength' },
  { key: '3', value: 'Free Weights' },
]

const toTitleCase = (value: string) =>
  value
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')

const STATUS_OPTIONS = STATUS_VALUES.map((value) => ({ key: value, value: toTitleCase(value) }))
const CONDITION_OPTIONS = CONDITION_VALUES.map((value) => ({ key: value, value: toTitleCase(value) }))

const optionForValue = (options: Array<{ key: string; value: string }>, value: any) =>
  options.find((option) => option.key === String(value ?? ''))

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

const addEquipmentSchema = yup.object({
  equipment_category_uid: yup
    .string()
    .oneOf(['1', '2', '3'], 'Category is required')
    .required('Category is required'),
  title: yup.string().trim().required('Title is required'),
  description: yup
    .string()
    .trim()
    .required("Description is required")
    .test(
      "not-empty-html",
      "Description is required",
      (value) => {
        if (!value) return false;

        // Strip HTML tags and &nbsp; so an empty RichEditor
        // value such as <p><br></p> does not pass validation.
        const plainText = value
          .replace(/<[^>]*>/g, "")
          .replace(/&nbsp;/g, " ")
          .trim();

        return plainText.length > 0;
      }
    ),
  brand: yup.string().trim().required("Brand is required").nullable(),
  model: yup.string().trim()
    .required("Model is required").nullable(),
  serial_number: yup.string().nullable(),
  asset_tag: yup.string().nullable(),
  quantity: yup
    .string()
    .required("Quantity is required")
    .test(
      "positive-integer",
      "Quantity must be at least 1",
      (value) => {
        if (!value) return false;
        const quantity = Number(value);
        return Number.isInteger(quantity) && quantity >= 1;
      }
    ),
  color: yup.string().nullable(),
  location: yup
    .string()
    .trim()
    .required("Location is required"),
  purchase_date: yup.string().nullable(),
  purchase_price: nullableNonNegativeNumber('Purchase price'),
  warranty_expiration_date: yup.string().nullable(),
  status: yup
    .string()
    .oneOf(
      ["active", "maintenance", "out_of_service", "retired"],
      "Invalid status"
    )
    .required("Status is required"),
  equipment_condition: yup
    .string()
    .oneOf(
      ["excellent", "good", "fair", "poor"],
      "Invalid equipment condition"
    )
    .required("Condition is required"),
  maintenance_interval_days: nullablePositiveNumber('Maintenance interval'),
  notes: yup.string().nullable(),
})

type AddEquipmentFormValues = {
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

const AddEquipmentScreen = ({ navigation }) => {
  const { user, tokens, webServer } = useContext(UserContext)
  const [descriptionHtml, setDescriptionHtml] = useState('')
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [imageError, setImageError] = useState('')
  const richText = useRef(null)

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<AddEquipmentFormValues>({
    resolver: yupResolver(addEquipmentSchema),
    defaultValues: {
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
    },
  })

  const [equipmentImages, setEquipmentImages] = useState(
    Array.from({ length: EQUIPMENT_IMAGE_PLACEHOLDER_COUNT }, (_, index) => ({
      id: `placeholder-${index}`,
      iconName: 'image-outline',
      isPlaceholder: true,
    }))
  )

  const pickImage = async (targetIndex: number) => {
    try {
      const selectedAsset = await ImagePicker.openPicker({
        cropping: true,
        width: 1200,
        height: 1200,
        compressImageQuality: 0.8,
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
        Alert.alert(
          'Unsupported Format',
          'Please select a JPEG, PNG, or WebP image.'
        )
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
        id: `placeholder-${targetIndex}-${Date.now()}`,
        iconName: 'image-outline',
        isPlaceholder: true,
      }
      return next
    })

    if (selectedImageIndex === targetIndex) {
      setSelectedImageIndex(0)
    }
  }

  const appendNullableField = (formData: FormData, key: string, value: any) => {
    const normalized = String(value ?? '').trim()
    if (normalized !== '') {
      formData.append(key, normalized)
    }
  }

  const collectNewImages = () =>
    equipmentImages
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

  const onSubmit = async (formData: AddEquipmentFormValues) => {
    if (isSubmitting) return

    const newImages = collectNewImages()

    if (newImages.length < 1) {
      setImageError('At least one image is required')
      return
    }

    try {
      setIsSubmitting(true)
      setImageError('')

      const requestPayload = new FormData()

      requestPayload.append('title', String(formData.title ?? '').trim())
      requestPayload.append('description', String(descriptionHtml ?? '').trim())
      requestPayload.append('quantity', String(formData.quantity ?? '1').trim())
      requestPayload.append('status', String(formData.status ?? 'active').trim().toLowerCase())

      appendNullableField(requestPayload, 'equipment_category_uid', formData.equipment_category_uid)
      appendNullableField(requestPayload, 'brand', formData.brand)
      appendNullableField(requestPayload, 'model', formData.model)
      appendNullableField(requestPayload, 'serial_number', formData.serial_number)
      appendNullableField(requestPayload, 'asset_tag', formData.asset_tag)
      appendNullableField(requestPayload, 'color', formData.color)
      appendNullableField(requestPayload, 'location', formData.location)
      appendNullableField(requestPayload, 'purchase_date', formData.purchase_date)
      appendNullableField(requestPayload, 'purchase_price', formData.purchase_price)
      appendNullableField(
        requestPayload,
        'warranty_expiration_date',
        formData.warranty_expiration_date
      )
      appendNullableField(
        requestPayload,
        'equipment_condition',
        String(formData.equipment_condition ?? '').trim().toLowerCase()
      )
      appendNullableField(
        requestPayload,
        'maintenance_interval_days',
        formData.maintenance_interval_days
      )
      appendNullableField(requestPayload, 'notes', formData.notes)

      newImages.forEach((imageFile) => {
        requestPayload.append('images[]', imageFile as any)
      })

      console.log('Submitting new equipment:', {
        gymId: user?.gym_id,
        imageCount: newImages.length,
        imageNames: newImages.map((image) => image.name),
      })

      const response = await fetch(
        `${webServer}/api/v1/gyms/${user.gym_id}/equipment`,
        {
          method: 'POST',
          headers: {
            Authorization: 'Bearer ' + tokens.access_token,
          },
          body: requestPayload,
        }
      )

      const rawResponse = await response.text()
      let obj: any = {}

      try {
        obj = rawResponse ? JSON.parse(rawResponse) : {}
      } catch (parseError) {
        console.log('Could not parse equipment response as JSON:', rawResponse)
      }

      if (response.status === 201 || response.status === 200) {
        showMessage({
          message: 'Success',
          description: obj?.message || 'Equipment created successfully.',
          type: 'success',
          icon: 'success',
          duration: 3000,
          autoHide: true,
          onPress: () => hideMessage(),
        })

        if (navigation.canGoBack()) {
          navigation.goBack()
        } else {
          navigation.navigate('EquipmentScreen')
        }
        return
      }

      showMessage({
        message: 'Action Failed',
        description:
          obj?.message || `Something went wrong while creating equipment (${response.status}).`,
        type: 'danger',
        icon: 'danger',
        autoHide: false,
      })
    } catch (error) {
      console.log('Create equipment request failed:', error)
      showMessage({
        message: 'Action Failed',
        description: 'Network error while creating equipment.',
        type: 'danger',
        icon: 'danger',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedImage = equipmentImages?.[selectedImageIndex]

  const renderTextField = (
    name: keyof AddEquipmentFormValues,
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

  const renderDateField = (
    name: keyof AddEquipmentFormValues,
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

  const renderSelectField = (
    name: keyof AddEquipmentFormValues,
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

  return (
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

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headingContainer}>
          <Text style={styles.title}>Add Equipment</Text>
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

                  {!image.isPlaceholder ? (
                    <TouchableOpacity
                      style={styles.removeImageButton}
                      onPress={() => removeImage(index)}
                    >
                      <Feather name="x" size={12} color={AppColors.white} />
                    </TouchableOpacity>
                  ) : null}
                </View>
              ))}
            </View>
            <Text style={styles.imageHelpText}>Up to 5 JPEG, PNG, or WebP images. Maximum 10 MB each.</Text>
            {imageError ? (
              <Text style={styles.imageErrorText}>{imageError}</Text>
            ) : null}
          </View>

          <View style={styles.content}>
            {renderTextField('title', 'Title:', 'Enter equipment title', {
              autoCapitalize: 'words',
            })}

            <View style={styles.descriptionBlock}>
              <Text style={styles.formLabel}>Description:</Text>
              <RichToolbar
                editor={richText}
                style={styles.richToolbar}
                iconTint={AppColors.blue}
                selectedIconTint={AppColors.white}
                selectedButtonStyle={styles.richToolbarSelectedButton}
                actions={[
                  actions.setBold,
                  actions.setItalic,
                  actions.setUnderline,
                  actions.setStrikethrough,
                  actions.insertBulletsList,
                  actions.insertOrderedList,
                  actions.insertLink,
                  actions.undo,
                  actions.redo,
                ]}
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
                        setDescriptionHtml(value)
                        onChange(value)
                      }}
                    />
                  )}
                />
              </View>
              {errors.description && (
                <Text style={styles.errorText}>{errors.description.message}</Text>
              )}
            </View>

            {renderSelectField(
              'equipment_category_uid',
              'Category:',
              'Select category',
              CATEGORY_OPTIONS
            )}
            {renderTextField('brand', 'Brand:', 'Enter brand', { autoCapitalize: 'words' })}
            {renderTextField('model', 'Model:', 'Enter model', { autoCapitalize: 'characters' })}
            {renderTextField('serial_number', 'Serial Number:', 'Enter serial number', {
              autoCapitalize: 'characters',
            })}
            {renderTextField('asset_tag', 'Asset Tag:', 'Enter asset tag', {
              autoCapitalize: 'characters',
            })}
            {renderTextField('quantity', 'Quantity:', 'Enter quantity', {
              keyboardType: 'number-pad',
              autoCapitalize: 'none',
            })}
            {renderTextField('color', 'Color:', 'Enter color', { autoCapitalize: 'words' })}
            {renderTextField('location', 'Location:', 'Enter gym location', {
              autoCapitalize: 'words',
            })}
            {renderDateField('purchase_date', 'Purchase Date:', 'Select purchase date', new Date())}
            {renderTextField('purchase_price', 'Purchase Price:', 'Enter purchase price', {
              keyboardType: 'decimal-pad',
              autoCapitalize: 'none',
            })}
            {renderDateField(
              'warranty_expiration_date',
              'Warranty Expiration Date:',
              'Select warranty expiration date',
              null
            )}
            {renderSelectField('status', 'Status:', 'Select status', STATUS_OPTIONS)}
            {renderSelectField(
              'equipment_condition',
              'Condition:',
              'Select condition',
              CONDITION_OPTIONS
            )}
            {renderTextField(
              'maintenance_interval_days',
              'Maintenance Interval (Days):',
              'Example: 90',
              { keyboardType: 'number-pad', autoCapitalize: 'none' }
            )}
            {renderTextField('notes', 'Notes:', 'Enter notes')}

            <View style={styles.row}>
              <TouchableOpacity
                style={[styles.primaryBtn, isSubmitting && styles.disabledBtn]}
                onPress={() => {
                  if (collectNewImages().length < 1) {
                    setImageError('At least one image is required')
                  } else {
                    setImageError('')
                  }
                  handleSubmit(onSubmit)()
                }}
                disabled={isSubmitting}
              >
                <Text style={styles.primaryBtnText}>
                  {isSubmitting ? 'Creating...' : 'Create Equipment'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={() => {
                  if (navigation.canGoBack()) {
                    navigation.goBack()
                  }
                }}
                disabled={isSubmitting}
              >
                <Text style={styles.secondaryBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

export default AddEquipmentScreen

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
  removeImageButton: {
    position: 'absolute',
    top: -5,
    right: 2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: AppColors.blue,
    justifyContent: 'center',
    alignItems: 'center',
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
    marginTop: 8,
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
  errorText: {
    color: AppColors.red,
    fontSize: 12,
    marginTop: 4,
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
  fieldHelpText: {
    marginTop: -4,
    marginBottom: 12,
    color: AppColors.grey2,
    fontSize: 12,
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
