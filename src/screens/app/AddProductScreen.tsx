// @ts-nocheck
import { Alert, Image, StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput } from 'react-native'
import { useState, useContext, useRef } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import Feather from '@expo/vector-icons/Feather'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { AppColors } from '../../styles/colors'
import QuantityPicker from '../../components/forms/QuantityPicker'
import { UserContext } from '../../context/UserContext'
import { RichEditor, RichToolbar, actions } from 'react-native-pell-rich-editor'
import * as ImagePicker from 'expo-image-picker'

const placeholderImages = [
  'image-outline',
  'image-outline', 'image-outline', 'image-outline', 'image-outline',
]

const AddProductScreen = ({ navigation }) => {
  const { user } = useContext(UserContext)
  const { tokens, setTokens } = useContext(UserContext)
  const { webServer } = useContext(UserContext)
  const [product, setProduct] = useState({})
  const [descriptionHtml, setDescriptionHtml] = useState('')
  const [productImages, setProductImages] = useState(
    placeholderImages.map((iconName, index) => ({
      id: `placeholder-${index}`,
      iconName,
      isPlaceholder: true,
    }))
  )
  const richText = useRef(null)

  const getTextValue = (value) => String(value ?? '')

  const handleProductFieldChange = (field, value) => {
    setProduct((prev: any) => ({
      ...prev,
      [field]: value,
    }))
  }

  const pickImage = async (targetIndex) => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync()

    if (!permissionResult.granted) {
      Alert.alert('Permission required', 'Permission to access the media library is required.')
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    })

    if (!result.canceled) {
      const nextImage = {
        id: `picked-${Date.now()}`,
        source: { uri: result.assets[0].uri },
        isPlaceholder: false,
      }

      setProductImages((prev) => {
        const next = [...prev]
        next[targetIndex] = nextImage
        return next
      })
    }
  }

  const handleSubmit = () => {
    console.log('Add product submit', {
      gym_id: user?.gym_id,
      product,
      descriptionHtml,
      webServer,
      tokens,
      setTokens,
    })
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
            </View>
            <View style={styles.content}>
              <View style={styles.inputField}>
                <Text style={styles.formLabel}>Title:</Text>
                <TextInput
                  style={styles.textField}
                  value={getTextValue(product?.title)}
                  onChangeText={(value) => handleProductFieldChange('title', value)}
                  placeholder="Enter title"
                  placeholderTextColor={AppColors.grey2}
                  autoCapitalize="words"
                  returnKeyType="done"
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
                      handleProductFieldChange('description', value)
                    }}
                  />
                </View>
              </View>
              <View style={styles.inputField}>
                <Text style={styles.formLabel}>SKU:</Text>
                <TextInput
                  style={styles.textField}
                  value={getTextValue(product?.sku)}
                  onChangeText={(value) => handleProductFieldChange('sku', value)}
                  placeholder="Enter SKU"
                  placeholderTextColor={AppColors.grey2}
                  autoCapitalize="characters"
                  returnKeyType="done"
                />
              </View>
              <View style={styles.inputField}>
                <Text style={styles.formLabel}>Brand:</Text>
                <TextInput
                  style={styles.textField}
                  value={getTextValue(product?.brand)}
                  onChangeText={(value) => handleProductFieldChange('brand', value)}
                  placeholder="Enter brand"
                  placeholderTextColor={AppColors.grey2}
                  autoCapitalize="words"
                  returnKeyType="done"
                />
              </View>
              <View style={styles.inputField}>
                <Text style={styles.formLabel}>Price:</Text>
                <TextInput
                  style={styles.textField}
                  value={getTextValue(product?.price)}
                  onChangeText={(value) => handleProductFieldChange('price', value)}
                  placeholder="Enter price"
                  placeholderTextColor={AppColors.grey2}
                  keyboardType="decimal-pad"
                  returnKeyType="done"
                />
              </View>
              <View style={styles.inputField}>
                <Text style={styles.formLabel}>Sale Price:</Text>
                <TextInput
                  style={styles.textField}
                  value={getTextValue(product?.sale_price)}
                  onChangeText={(value) => handleProductFieldChange('sale_price', value)}
                  placeholder="Enter sale price"
                  placeholderTextColor={AppColors.grey2}
                  keyboardType="decimal-pad"
                  returnKeyType="done"
                />
              </View>
              <View style={styles.inputField}>
                <Text style={styles.formLabel}>Cost Price:</Text>
                <TextInput
                  style={styles.textField}
                  value={getTextValue(product?.cost_price)}
                  onChangeText={(value) => handleProductFieldChange('cost_price', value)}
                  placeholder="Enter cost price"
                  placeholderTextColor={AppColors.grey2}
                  keyboardType="decimal-pad"
                  returnKeyType="done"
                />
              </View>
              <View style={styles.inputField}>
                <Text style={styles.formLabel}>Quantity:</Text>
                <QuantityPicker quantity={product?.quantity_in_stock} />
              </View>
              <View style={styles.inputField}>
                <Text style={styles.formLabel}>Weight:</Text>
                <QuantityPicker quantity={product?.weight} />
              </View>
              <View style={styles.inputField}>
                <Text style={styles.formLabel}>Size</Text>
                <TextInput
                  style={styles.textField}
                  value={getTextValue(product?.size)}
                  onChangeText={(value) => handleProductFieldChange('size', value)}
                  placeholder="Enter size"
                  placeholderTextColor={AppColors.grey2}
                  autoCapitalize="characters"
                  returnKeyType="done"
                />
              </View>
              <View style={styles.inputField}>
                <Text style={styles.formLabel}>Color</Text>
                <TextInput
                  style={styles.textField}
                  value={getTextValue(product?.color)}
                  onChangeText={(value) => handleProductFieldChange('color', value)}
                  placeholder="Enter color"
                  placeholderTextColor={AppColors.grey2}
                  autoCapitalize="words"
                  returnKeyType="done"
                />
              </View>
              <View style={styles.row}>
                <TouchableOpacity
                  style={styles.loginBtn}
                  title="Add Product"
                  onPress={() => { handleSubmit() }}
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
