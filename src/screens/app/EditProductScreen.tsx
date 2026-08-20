// @ts-nocheck
import { StyleSheet, Text, View, ScrollView, Image, TouchableOpacity, TextInput } from 'react-native'
import { useState, useEffect, useContext, useRef } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import Feather from '@expo/vector-icons/Feather'
import { AppColors } from '../../styles/colors'
import { UserContext } from '../../context/UserContext'
import { RichEditor, RichToolbar, actions } from 'react-native-pell-rich-editor'
import { Controller, useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import {
  showMessage,
  hideMessage,
} from "react-native-flash-message";

const editProductSchema = yup.object({
  title: yup.string().trim().required('Title is required'),
  description: yup.string().nullable(),
  sku: yup.string().nullable(),
  brand: yup.string().nullable(),
  price: yup.string().nullable(),
  sale_price: yup.string().nullable(),
  cost_price: yup.string().nullable(),
  quantity_in_stock: yup.string().nullable(),
  weight: yup.string().nullable(),
  size: yup.string().nullable(),
  color: yup.string().nullable(),
});

type EditProductFormValues = {
  title: string;
  description: string;
  sku: string;
  brand: string;
  price: string;
  sale_price: string;
  cost_price: string;
  quantity_in_stock: string;
  weight: string;
  size: string;
  color: string;
};

const EditProductScreen = ({ navigation, route }) => {
  const { user } = useContext(UserContext);
  const { tokens, setTokens } = useContext(UserContext);
  const { webServer } = useContext(UserContext);
  const [product, setProduct] = useState({});
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [descriptionHtml, setDescriptionHtml] = useState('');
  const richText = useRef(null);
  const getTextValue = (value) => String(value ?? '');
  const toNullableValue = (value: string) => {
    const normalizedValue = String(value ?? '').trim();
    return normalizedValue === '' ? null : normalizedValue;
  };
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EditProductFormValues>({
    resolver: yupResolver(editProductSchema),
    defaultValues: {
      title: '',
      description: '',
      sku: '',
      brand: '',
      price: '',
      sale_price: '',
      cost_price: '',
      quantity_in_stock: '',
      weight: '',
      size: '',
      color: '',
    },
  });
  const productIdentifier =
    route?.params?.product?.pid ||
    route?.params?.product?.uid ||
    product?.pid ||
    product?.uid;

  const handleDeleteProduct = async () => {
    const currentProductId = productIdentifier || route?.params?.product?.uid;
    console.log('handleDeleteProduct() pressed for product id:', currentProductId)
    // testing
    if (!currentProductId) {
      console.log('Delete product failed: missing product id');
      return;
    }

    try {
      const response = await fetch(
        `${webServer}/api/v1/gyms/${user.gym_id}/products/${currentProductId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: "Bearer " + tokens.access_token,
          },
        }
      );

      const obj = await response.json();
      console.log("apiResponse: " + JSON.stringify(obj));

      if (response.status === 200) {
        showMessage({
          message: "Success",
          description:
            obj.message || "Your action was confirmed successfully!",
          type: "success",
          icon: "success",
          duration: 3000,
          autoHide: true,
          onPress: () => hideMessage(),
        });
        navigation.navigate('ProductsScreen');
      } else {
        showMessage({
          message: "Action Failed",
          description: obj.message || "Something went wrong.",
          type: "danger", // Automatically styles background to red
          icon: "danger",
          autoHide: false,
        });
      }
    } catch (error) {
      console.log('Delete product request failed:', error);
    }
  };

  const onSubmit = async (formData: EditProductFormValues) => {

    console.log('onSubmit() called with formData:', formData);
    return;

    const currentProductId = productIdentifier || route?.params?.product?.uid;

    if (!currentProductId) {
      showMessage({
        message: "Action Failed",
        description: "Missing product id. Please reopen this product from the list.",
        type: "danger",
      });
      return;
    }

    try {
      const response = await fetch(
        `${webServer}/api/v1/gyms/${user.gym_id}/products/${currentProductId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + tokens.access_token,
          },
          body: JSON.stringify({
            title: toNullableValue(formData.title),
            description: toNullableValue(formData.description),
            sku: toNullableValue(formData.sku),
            brand: toNullableValue(formData.brand),
            price: toNullableValue(formData.price),
            sale_price: toNullableValue(formData.sale_price),
            cost_price: toNullableValue(formData.cost_price),
            quantity_in_stock: toNullableValue(formData.quantity_in_stock),
            weight: toNullableValue(formData.weight),
            size: toNullableValue(formData.size),
            color: toNullableValue(formData.color),
          }),
        }
      );

      const rawResponse = await response.text();
      const obj = rawResponse ? JSON.parse(rawResponse) : {};
      console.log("apiResponse: " + JSON.stringify(obj));

      if (response.status === 200) {
        showMessage({
          message: "Success",
          description: obj.message || "Product updated successfully.",
          type: "success",
          icon: "success",
          duration: 3000,
          autoHide: true,
          onPress: () => hideMessage(),
        });
        navigation.goBack();
        return;
      }

      showMessage({
        message: "Action Failed",
        description: obj.message || "Something went wrong while updating this product.",
        type: "danger",
        icon: "danger",
        autoHide: false,
      });
    } catch (error) {
      console.log('Update product request failed:', error);
      showMessage({
        message: "Action Failed",
        description: "Network error while updating product.",
        type: "danger",
        icon: "danger",
      });
    }
  };

  useEffect(() => {
    const fetchProduct = async () => {
      try {                           // http://localhost:8080/classy-api/api/v1/gyms/1/products/5
        const currentProductId = productIdentifier || route?.params?.product?.uid;
        if (!currentProductId) {
          return;
        }

        const response = await fetch(`${webServer}/api/v1/gyms/${user.gym_id}/products/${currentProductId}`, {
          headers: {
            Authorization: "Bearer " + tokens.access_token,
          },
        });

        const data = await response.json();

        if (response.status === 200) {
          setProduct(data.data);
          const nextDescription = getTextValue(data?.data?.description);
          setDescriptionHtml(nextDescription);
          reset({
            title: getTextValue(data?.data?.title),
            description: nextDescription,
            sku: getTextValue(data?.data?.sku),
            brand: getTextValue(data?.data?.brand),
            price: getTextValue(data?.data?.price),
            sale_price: getTextValue(data?.data?.sale_price),
            cost_price: getTextValue(data?.data?.cost_price),
            quantity_in_stock: getTextValue(data?.data?.quantity_in_stock),
            weight: getTextValue(data?.data?.weight),
            size: getTextValue(data?.data?.size),
            color: getTextValue(data?.data?.color),
          });
          setSelectedImageIndex(0);
        }
        else {
          console.log("Access token expired, requesting new one - useFocusEffect()");

          const response = await fetch(`${webServer}/api/refresh.php`, {
            method: "POST",
            body: JSON.stringify({
              token: tokens.refresh_token,
            }),
          });

          const obj = await response.json();

          if (response.status === 200) {
            console.log("Got new access token and refresh token");
            setTokens((prev: any) => ({
              ...prev,
              access_token: obj.access_token,
              refresh_token: obj.refresh_token,
            }));
          }
        }
      } catch (error) {
        console.log('ProductDetailScreen product error: ', error);
      }
    }
    fetchProduct();
    // console.log(product.images[0]?.image_url);
  }, [tokens?.access_token, tokens?.refresh_token, productIdentifier, reset]);

  useEffect(() => {
    if (richText.current?.setContentHTML) {
      richText.current.setContentHTML(descriptionHtml || '');
    }
  }, [descriptionHtml]);

  const selectedImage = product?.images?.[selectedImageIndex]?.image_url || product?.images?.[0]?.image_url || null;

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
                navigation.goBack();
                return;
              }

              navigation.navigate('ProductDetailScreen', {
                product: {
                  ...(route?.params?.product || {}),
                  ...(product || {}),
                  pid: productIdentifier,
                },
              });
            }}
          />
        </View>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headingContainer}>
            <Text style={styles.title}>Edit Product</Text>
          </View>
          <View style={styles.body}>
            <View>
              <View style={styles.heroImageContainer}>
                <Image
                  style={styles.heroImage}
                  source={{ uri: selectedImage }}
                  resizeMode="cover"
                />
              </View>
              {product?.images?.length > 0 && (
                <View style={styles.heroImageThumbnails}>
                  {product.images.map((image, index) => (
                    <TouchableOpacity key={`${image?.image_url || index}`} onPress={() => setSelectedImageIndex(index)}>
                      <Image
                        style={[
                          styles.thumbnail,
                          selectedImageIndex === index && styles.selectedThumbnail,
                        ]}
                        source={{ uri: image?.image_url || null }}
                        resizeMode="cover"
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
            <View style={styles.content}>
              <View style={styles.inputField}>
                <Text style={styles.formLabel}>Title:</Text>
                <Controller
                  control={control}
                  name="title"
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      style={styles.textField}
                      value={value}
                      onChangeText={onChange}
                      placeholder="Enter title"
                      placeholderTextColor={AppColors.grey2}
                      autoCapitalize="words"
                      returnKeyType="done"
                    />
                  )}
                />
                {errors?.title?.message ? (
                  <Text style={styles.errorText}>{errors.title.message}</Text>
                ) : null}
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
                          setDescriptionHtml(value);
                          onChange(value);
                        }}
                      />
                    )}
                  />
                </View>
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
              </View>
              <View style={styles.row}>
                <TouchableOpacity
                  style={styles.loginBtn}
                  title="Save Product"
                  onPress={handleSubmit(onSubmit)}
                >
                  <Text style={styles.loginBtnText}>Save Product</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.registerBtn}
                  title="Edit Product"
                  onPress={() => { handleDeleteProduct() }}>
                  <Text style={styles.registerBtnText}>Delete Product</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  )
}

export default EditProductScreen

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
  heroImageThumbnails: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
  },
  thumbnail: {
    width: 56,
    height: 56,
    marginRight: 8,
    borderRadius: 8,
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
    // height: 200,
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
  errorText: {
    marginTop: 4,
    color: AppColors.red,
    fontSize: 12,
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

const tagsStyles = {
  p: {
    color: AppColors.primary,
    lineHeight: 20,
    marginBottom: 10,
  },
  h1: {
    color: '#111111',
    marginBottom: 15,
  },
  ul: {
    marginBottom: 10,
  },
  li: {
    color: AppColors.primary,
    lineHeight: 20,
  },
};
