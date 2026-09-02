// @ts-nocheck
import { Alert, Image, StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput } from 'react-native'
import { useState, useContext, useRef } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import Feather from '@expo/vector-icons/Feather'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { AppColors } from '../../styles/colors'
import { UserContext } from '../../context/UserContext'
import { RichEditor, RichToolbar, actions } from 'react-native-pell-rich-editor'
import ImagePicker from 'react-native-image-crop-picker'
import { Controller, useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import {
  showMessage,
  hideMessage,
} from "react-native-flash-message"

const MAX_PRODUCT_IMAGE_BYTES = 5 * 1024 * 1024
const PRODUCT_IMAGE_PLACEHOLDER_COUNT = 5
const MAX_DECIMAL_10_2 = 99999999.99

const optionalText = (label: string, maxLength: number) =>
  yup
    .string()
    .trim()
    .max(maxLength, `${label} must be ${maxLength} characters or less`)
    .nullable()

const requiredMoney = (label: string) =>
  yup
    .string()
    .trim()
    .required(`${label} is required`)
    .test('decimal', `${label} must be a valid amount`, (value) => {
      if (!value) return false
      return /^\d+(\.\d{1,2})?$/.test(value)
    })
    .test('decimal-range', `${label} must be between 0 and ${MAX_DECIMAL_10_2}`, (value) => {
      if (!value || !/^\d+(\.\d{1,2})?$/.test(value)) return true
      const amount = Number(value)
      return Number.isFinite(amount) && amount >= 0 && amount <= MAX_DECIMAL_10_2
    })

const optionalMoney = (label: string) =>
  yup
    .string()
    .trim()
    .nullable()
    .test('decimal', `${label} must be a valid amount`, (value) => {
      if (value == null || value === '') return true
      return /^\d+(\.\d{1,2})?$/.test(value)
    })
    .test('decimal-range', `${label} must be between 0 and ${MAX_DECIMAL_10_2}`, (value) => {
      if (value == null || value === '' || !/^\d+(\.\d{1,2})?$/.test(value)) return true
      const amount = Number(value)
      return Number.isFinite(amount) && amount >= 0 && amount <= MAX_DECIMAL_10_2
    })

const requiredUnsignedInteger = (label: string) =>
  yup
    .string()
    .trim()
    .required(`${label} is required`)
    .test('integer', `${label} must be a whole number`, (value) => /^\d+$/.test(String(value ?? '')))
    .test('int-range', `${label} must be between 0 and 4294967295`, (value) => {
      if (!/^\d+$/.test(String(value ?? ''))) return true
      const integerValue = Number(value)
      return Number.isInteger(integerValue) && integerValue >= 0 && integerValue <= 4294967295
    })

const addProductSchema = yup.object({
  title: yup
    .string()
    .trim()
    .required('Title is required')
    .max(255, 'Title must be 255 characters or less'),
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
  sku: optionalText('SKU', 100),
  brand: optionalText('Brand', 100),
  price: requiredMoney('Price'),
  sale_price: optionalMoney('Sale price'),
  cost_price: optionalMoney('Cost price'),
  quantity_in_stock: requiredUnsignedInteger('Quantity'),
  reorder_level: requiredUnsignedInteger('Reorder level'),
  weight: requiredMoney('Weight'),
  size: optionalText('Size', 50),
  color: optionalText('Color', 50),
})

type AddProductFormValues = {
  title: string
  description: string
  sku: string
  brand: string
  price: string
  sale_price: string
  cost_price: string
  quantity_in_stock: string
  reorder_level: string
  weight: string
  size: string
  color: string
}

const AddProductScreen = ({ navigation }) => {
  const { user } = useContext(UserContext)
  const { tokens, setTokens } = useContext(UserContext)
  const { webServer } = useContext(UserContext)
  const [descriptionHtml, setDescriptionHtml] = useState('')
  const richText = useRef(null)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [imageError, setImageError] = useState('')
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<AddProductFormValues>({
    resolver: yupResolver(addProductSchema),
    defaultValues: {
      title: '',
      description: '',
      sku: '',
      brand: '',
      price: '',
      sale_price: '',
      cost_price: '',
      quantity_in_stock: '',
      reorder_level: '',
      weight: '',
      size: '',
      color: '',
    },
  })
  const [productImages, setProductImages] = useState(
    Array.from({ length: PRODUCT_IMAGE_PLACEHOLDER_COUNT }, (_, index) => ({
      id: `placeholder-${index}`,
      iconName: 'image-outline',
      isPlaceholder: true,
    }))
  )

  const pickImage = async (targetIndex: number) => {
    try {
      const selectedAsset = await ImagePicker.openPicker({
        cropping: true,
        width: 380,
        height: 380,
        compressImageQuality: 0.7,
        forceJpg: true,
        mediaType: "photo",
      })

      const mimeType = String(selectedAsset?.mime || '').toLowerCase()
      const fileName = String(selectedAsset?.filename || selectedAsset?.path || '').toLowerCase()
      const fileSize = Number((selectedAsset as any)?.fileSize ?? (selectedAsset as any)?.size ?? 0)
      const hasAllowedExtension =
        fileName.endsWith('.jpg') || fileName.endsWith('.jpeg') || fileName.endsWith('.png')
      const hasAllowedMimeType = mimeType === 'image/jpeg' || mimeType === 'image/png'

      if (!hasAllowedMimeType && !hasAllowedExtension) {
        Alert.alert('Unsupported Format', 'Please select a JPEG or PNG image.')
        return
      }

      if (fileSize > MAX_PRODUCT_IMAGE_BYTES) {
        Alert.alert('Image Too Large', 'Please select an image that is 5 MB or less.')
        return
      }

      const nextImage = {
        id: `picked-${Date.now()}-${targetIndex}`,
        isPlaceholder: false,
        source: { uri: selectedAsset.path },
        image_url: selectedAsset.path,
        localAsset: selectedAsset,
      }

      setProductImages((prev) => {
        const next = [...prev]
        next[targetIndex] = nextImage
        return next
      })
      setImageError('')
      setSelectedImageIndex(targetIndex)
    } catch (error) {
      console.log('Image selection cancelled or failed:', error)
    }
  }

  const onSubmit = async (formData: AddProductFormValues) => {
    try {
      const newImages = productImages
        .filter((image) => !image?.isPlaceholder && image?.localAsset?.path)
        .map((image, index) => {
          const localAsset = image.localAsset
          const mimeType = localAsset?.mime || 'image/jpeg'
          const extension = mimeType === 'image/png' ? 'png' : 'jpg'
          const fileName = localAsset?.filename || `product-image-${index}.${extension}`

          return {
            uri: localAsset.path,
            type: mimeType,
            name: fileName,
          }
        })

      if (newImages.length < 1) {
        setImageError('At least one image is required')
        return
      }

      setImageError('')

      const requestPayload = new FormData()
      requestPayload.append('title', String(formData.title ?? '').trim())
      requestPayload.append('description', String(descriptionHtml ?? '').trim())
      requestPayload.append('sku', String(formData.sku ?? '').trim())
      requestPayload.append('brand', String(formData.brand ?? '').trim())
      requestPayload.append('price', String(formData.price ?? '').trim())
      requestPayload.append('sale_price', String(formData.sale_price ?? '').trim())
      requestPayload.append('cost_price', String(formData.cost_price ?? '').trim())
      requestPayload.append('quantity_in_stock', String(formData.quantity_in_stock ?? '').trim())
      requestPayload.append('reorder_level', String(formData.reorder_level ?? '').trim())
      requestPayload.append('weight', String(formData.weight ?? '').trim())
      requestPayload.append('size', String(formData.size ?? '').trim())
      requestPayload.append('color', String(formData.color ?? '').trim())

      newImages.forEach((imageFile) => {
        requestPayload.append('images[]', imageFile as any)
      })

      console.log('Submitting new product with images:', {
        imageCount: newImages.length,
        imageNames: newImages.map((image) => image.name),
      })

      const response = await fetch(
        `${webServer}/api/v1/gyms/${user.gym_id}/products`,
        {
          method: "POST",
          headers: {
            Authorization: "Bearer " + tokens.access_token,
          },
          body: requestPayload,
        }
      )

      const rawResponse = await response.text()
      const obj = rawResponse ? JSON.parse(rawResponse) : {}
      console.log("apiResponse: " + JSON.stringify(rawResponse))

      if (response.status === 201 || response.status === 200) {
        showMessage({
          message: "Success",
          description: obj.message || "Product created successfully.",
          type: "success",
          icon: "success",
          duration: 3000,
          autoHide: true,
          onPress: () => hideMessage(),
        })
        navigation.navigate('ProductsScreen')
        return
      }

      showMessage({
        message: "Action Failed",
        description: obj.message || "Something went wrong while creating this product.",
        type: "danger",
        icon: "danger",
        autoHide: false,
      })
    } catch (error) {
      console.log('Create product request failed:', error)
      showMessage({
        message: "Action Failed",
        description: "Network error while creating product.",
        type: "danger",
        icon: "danger",
      })
    }
  }

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
                return
              }

              navigation.navigate('ProductsScreen')
            }}
          />
        </View>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headingContainer}>
            <Text style={styles.title}>Add Product</Text>
          </View>
          <View style={styles.body}>
            <View>
              <View style={styles.heroImageContainer}>
                {productImages[0]?.isPlaceholder ? (
                  <View style={styles.placeholderHero}>
                    <MaterialCommunityIcons
                      name={productImages[0]?.iconName}
                      size={88}
                      color={AppColors.blue}
                    />
                  </View>
                ) : (
                  <Image
                    style={styles.heroImage}
                    source={productImages[0]?.source}
                    resizeMode="cover"
                  />
                )}
              </View>
              <View style={styles.heroImageThumbnails}>
                {productImages.map((image, index) => (
                  <TouchableOpacity
                    key={image.id}
                    onPress={() => pickImage(index)}
                  >
                    {image.isPlaceholder ? (
                      <View
                        style={[
                          styles.thumbnail,
                          styles.placeholderThumbnail,
                        ]}
                      >
                        <MaterialCommunityIcons
                          name={image.iconName}
                          size={24}
                          color={AppColors.blue}
                        />
                      </View>
                    ) : (
                      <Image
                        style={styles.thumbnail}
                        source={image.source}
                        resizeMode="cover"
                      />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
              {imageError ? (
                <Text style={styles.imageErrorText}>{imageError}</Text>
              ) : null}
            </View>
            <View style={styles.content}>
              <View style={styles.inputField}>
                <Text style={styles.formLabel}>Title:</Text>
                <Controller
                  control={control}
                  name="title"
                  render={({ field: { onChange, value } }) => (
                    <>
                      <TextInput
                        style={styles.textField}
                        value={value}
                        onChangeText={onChange}
                        placeholder="Enter title"
                        placeholderTextColor={AppColors.grey2}
                        autoCapitalize="words"
                        returnKeyType="done"
                      />
                      {errors.title && (
                        <Text style={{ color: 'red', fontSize: 12 }}>
                          {errors.title.message}
                        </Text>
                      )}
                    </>
                  )}
                />
              </View>
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
                    actions.checkboxList,
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
                          contentCSSText: 'font-size: 14px; line-height: 18px; min-height: 28px;'
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
              <View style={styles.inputField}>
                <Text style={styles.formLabel}>SKU:</Text>
                <Controller
                  control={control}
                  name="sku"
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      style={styles.textField}
                      value={value}
                      onChangeText={onChange}
                      placeholder="Enter SKU"
                      placeholderTextColor={AppColors.grey2}
                      autoCapitalize="characters"
                      returnKeyType="done"
                    />
                  )}
                />
                {errors.sku && (
                  <Text style={styles.errorText}>{errors.sku.message}</Text>
                )}
              </View>
              <View style={styles.inputField}>
                <Text style={styles.formLabel}>Brand:</Text>
                <Controller
                  control={control}
                  name="brand"
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      style={styles.textField}
                      value={value}
                      onChangeText={onChange}
                      placeholder="Enter brand"
                      placeholderTextColor={AppColors.grey2}
                      autoCapitalize="words"
                      returnKeyType="done"
                    />
                  )}
                />
                {errors.brand && (
                  <Text style={styles.errorText}>{errors.brand.message}</Text>
                )}
              </View>
              <View style={styles.inputField}>
                <Text style={styles.formLabel}>Price:</Text>
                <Controller
                  control={control}
                  name="price"
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      style={styles.textField}
                      value={value}
                      onChangeText={onChange}
                      placeholder="Enter price"
                      placeholderTextColor={AppColors.grey2}
                      keyboardType="decimal-pad"
                      returnKeyType="done"
                    />
                  )}
                />
                {errors.price && (
                  <Text style={styles.errorText}>{errors.price.message}</Text>
                )}
              </View>
              <View style={styles.inputField}>
                <Text style={styles.formLabel}>Sale Price:</Text>
                <Controller
                  control={control}
                  name="sale_price"
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      style={styles.textField}
                      value={value}
                      onChangeText={onChange}
                      placeholder="Enter sale price"
                      placeholderTextColor={AppColors.grey2}
                      keyboardType="decimal-pad"
                      returnKeyType="done"
                    />
                  )}
                />
                {errors.sale_price && (
                  <Text style={styles.errorText}>{errors.sale_price.message}</Text>
                )}
              </View>
              <View style={styles.inputField}>
                <Text style={styles.formLabel}>Cost Price:</Text>
                <Controller
                  control={control}
                  name="cost_price"
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      style={styles.textField}
                      value={value}
                      onChangeText={onChange}
                      placeholder="Enter cost price"
                      placeholderTextColor={AppColors.grey2}
                      keyboardType="decimal-pad"
                      returnKeyType="done"
                    />
                  )}
                />
                {errors.cost_price && (
                  <Text style={styles.errorText}>{errors.cost_price.message}</Text>
                )}
              </View>
              <View style={styles.inputField}>
                <Text style={styles.formLabel}>Quantity:</Text>
                <Controller
                  control={control}
                  name="quantity_in_stock"
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      style={styles.textField}
                      value={value}
                      onChangeText={onChange}
                      placeholder="Enter quantity"
                      placeholderTextColor={AppColors.grey2}
                      keyboardType="number-pad"
                      returnKeyType="done"
                    />
                  )}
                />
                {errors.quantity_in_stock && (
                  <Text style={styles.errorText}>{errors.quantity_in_stock.message}</Text>
                )}
              </View>
              <View style={styles.inputField}>
                <Text style={styles.formLabel}>Reorder Level:</Text>
                <Controller
                  control={control}
                  name="reorder_level"
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      style={styles.textField}
                      value={value}
                      onChangeText={onChange}
                      placeholder="Enter reorder level"
                      placeholderTextColor={AppColors.grey2}
                      keyboardType="number-pad"
                      returnKeyType="done"
                    />
                  )}
                />
                {errors.reorder_level && (
                  <Text style={styles.errorText}>{errors.reorder_level.message}</Text>
                )}
              </View>
              <View style={styles.inputField}>
                <Text style={styles.formLabel}>Weight:</Text>
                <Controller
                  control={control}
                  name="weight"
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      style={styles.textField}
                      value={value}
                      onChangeText={onChange}
                      placeholder="Enter weight"
                      placeholderTextColor={AppColors.grey2}
                      keyboardType="decimal-pad"
                      returnKeyType="done"
                    />
                  )}
                />
                {errors.weight && (
                  <Text style={styles.errorText}>{errors.weight.message}</Text>
                )}
              </View>
              <View style={styles.inputField}>
                <Text style={styles.formLabel}>Size</Text>
                <Controller
                  control={control}
                  name="size"
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      style={styles.textField}
                      value={value}
                      onChangeText={onChange}
                      placeholder="Enter size"
                      placeholderTextColor={AppColors.grey2}
                      autoCapitalize="characters"
                      returnKeyType="done"
                    />
                  )}
                />
                {errors.size && (
                  <Text style={styles.errorText}>{errors.size.message}</Text>
                )}
              </View>
              <View style={styles.inputField}>
                <Text style={styles.formLabel}>Color</Text>
                <Controller
                  control={control}
                  name="color"
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      style={styles.textField}
                      value={value}
                      onChangeText={onChange}
                      placeholder="Enter color"
                      placeholderTextColor={AppColors.grey2}
                      autoCapitalize="words"
                      returnKeyType="done"
                    />
                  )}
                />
                {errors.color && (
                  <Text style={styles.errorText}>{errors.color.message}</Text>
                )}
              </View>
              <View style={styles.row}>
                <TouchableOpacity
                  style={styles.loginBtn}
                  title="Add Product"
                  onPress={handleSubmit(onSubmit)}
                >
                  <Text style={styles.loginBtnText}>Create Product</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.registerBtn}
                  title="Cancel"
                  onPress={() => {
                    if (navigation.canGoBack()) {
                      navigation.goBack()
                    }
                  }}>
                  <Text style={styles.registerBtnText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  )
}

export default AddProductScreen

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
  signOut: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  signOutText: {
    marginLeft: 10,
    marginRight: 4,
    color: AppColors.blue,
    fontSize: 14
  },
  circle: {
    width: 30,
    height: 30,
    borderRadius: '50%',
    backgroundColor: AppColors.blue,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headingContainer: {
    alignItems: 'center',
    marginBottom: 20
  },
  title: {
    color: AppColors.blue,
    fontSize: 32,
    marginTop: 60,
  },
  pinkLeaf: {
    position: 'relative',
    zIndex: -1,
    top: -68,
    right: -40
  },
  body: {
    paddingLeft: 24,
    paddingRight: 24,
    marginBottom: 24,
  },
  scrollView: {},
  scrollContent: {
    paddingBottom: 24,
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
  imageErrorText: {
    color: AppColors.red,
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
  },
  content: {
    marginTop: 24,
  },
  productTitle: {
    fontSize: 20,
    color: AppColors.blue
  },
  descriptionBlock: {
    marginTop: 16,
    marginBottom: 8,
  },
  descriptionScroll: {
    flex: 1,
    lineHeight: 24,
  },
  productDesc: {
    lineHeight: 24,
    color: '#333',
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
  richEditorContainer: {
    height: 400,
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
    height: 120
  },
  registerBtn: {
    backgroundColor: AppColors.blue,
    borderRadius: 40,
    width: 248,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8
  },
  registerBtnText: {
    fontSize: 16,
    color: '#fff'
  },
  loginBtn: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: AppColors.blue,
    borderRadius: 40,
    width: 248,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 8
  },
  loginBtnText: {
    color: AppColors.blue,
    fontSize: 16
  },
})
