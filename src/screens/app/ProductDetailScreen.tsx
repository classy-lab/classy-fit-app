// @ts-nocheck
import { StyleSheet, Text, View, ScrollView, Image, useWindowDimensions, TouchableOpacity } from 'react-native'
import { useState, useEffect, useContext } from 'react'
import { webServer, user, tokens, setTokens } from '../../config'
import { SafeAreaView } from 'react-native-safe-area-context'
import Feather from '@expo/vector-icons/Feather'
import { AppColors } from '../../styles/colors'
import { s } from 'react-native-size-matters'
import ProductSizePicker from '../../components/forms/ProductSizePicker'
import QuantityPicker from '../../components/forms/QuantityPicker'
import InputField from '../../components/forms/InputField'
import { UserContext } from '../../context/UserContext'
import RenderHtml from 'react-native-render-html';
import App from '../../../App'

const ProductDetailScreen = ({ navigation, route }) => {
  const { width } = useWindowDimensions();
  const { user } = useContext(UserContext);
  const { tokens, setTokens } = useContext(UserContext);
  const { webServer } = useContext(UserContext);
  const [product, setProduct] = useState({});

  const handleSubmit = () => {
    // console.log('handleSubmit() pressed')
  }

  useEffect(() => {
    const fetchProduct = async () => {
      try {                           // http://localhost:8080/classy-api/api/v1/gyms/1/products/5
        const response = await fetch(`${webServer}/api/v1/gyms/${user.gym_id}/products/${route.params.product.pid}`, {
          headers: {
            Authorization: "Bearer " + tokens.access_token,
          },
        });

        const data = await response.json();

        if (response.status === 200) {
          setProduct(data.data);
        }
        else {
          console.log("Access token expired, requesting new one - useFocusEffect()");

          const response = await fetch(`${webServer}/api/refresh.php`, {
            method: "POST",
            body: JSON.stringify({
              token: tokens.refresh_token,
            }),
          });

          const json = await response.text();
          const obj = JSON.parse(json);

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
    console.log(product);
  }, [tokens?.access_token, tokens?.refresh_token]);

  return (
    <>
      <SafeAreaView style={styles.container}>
        <View style={styles.navs}>
          <Feather name="arrow-left" color={AppColors.blue} size={36} onPress={() => navigation.navigate('ProductsScreen')} />
        </View>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.body}>
            <View>
              <View style={styles.heroImageContainer}>
                <Image style={styles.heroImage} source={require('../../assets/images/products/boxingGloves.jpg')} />
              </View>
              <View style={styles.heroImageThumbnails}>
                <Image style={styles.thumbnail} source={require('../../assets/images/products/boxingGloves2.jpg')} />
                <Image style={styles.thumbnail} source={require('../../assets/images/products/boxingGloves3.jpg')} />
                <Image style={styles.thumbnail} source={require('../../assets/images/products/boxingGloves4.jpg')} />
                <Image style={styles.thumbnail} source={require('../../assets/images/products/boxingGloves5.jpg')} />
              </View>
            </View>
            <View style={styles.content}>
              <Text style={styles.productTitle}>{product?.title}</Text>
              <View style={styles.descriptionBlock}>
                <Text style={styles.formLabel}>Description:</Text>
                {/* <ScrollView style={styles.descriptionScroll} showsVerticalScrollIndicator={false}> */}
                <RenderHtml
                  contentWidth={width - 48}
                  source={{ html: product?.description || '<p>No description available.</p>' }}
                  tagsStyles={tagsStyles}
                  baseStyle={styles.productDesc}
                />
                {/* </ScrollView> */}
              </View>
              <View style={styles.inputField}>
                <Text style={styles.formLabel}>SKU: {product?.sku}</Text>
                {/* <InputField value={product?.sku} /> */}
              </View>
              <View style={styles.inputField}>
                <Text style={styles.formLabel}>Brand: {product?.brand}</Text>
                {/* <InputField value={product?.brand} /> */}
              </View>
              <View style={styles.inputField}>
                <Text style={styles.formLabel}>Price: {product?.price}</Text>
                {/* <InputField value={product?.price} /> */}
              </View>
              <View style={styles.inputField}>
                <Text style={styles.formLabel}>Sale Price: {product?.sale_price}</Text>
                {/* <InputField value={product?.sale_price} /> */}
              </View>
              <View style={styles.inputField}>
                <Text style={styles.formLabel}>Cost Price: {product?.cost_price}</Text>
                {/* <InputField value={product?.cost_price} /> */}
              </View>
              <View style={styles.inputField}>
                <Text style={styles.formLabel}>Quantity: {product?.quantity_in_stock}</Text>
                {/* <QuantityPicker quantity={product?.quantity_in_stock} /> */}
              </View>
              <View style={styles.inputField}>
                <Text style={styles.formLabel}>Weight: {product?.weight}</Text>
                {/* <QuantityPicker quantity={product?.weight} /> */}
              </View>
              <View style={styles.inputField}>
                <Text style={styles.formLabel}>Size</Text>
                <ProductSizePicker size={product?.size} />
              </View>
              <View style={styles.inputField}>
                <Text style={styles.formLabel}>Color</Text>
                <InputField value={product?.color} />
              </View>
              <View style={styles.row}>
                <TouchableOpacity
                  style={styles.loginBtn}
                  title="Add to Cart"
                  onPress={() => { handleSubmit() }}
                >
                  <Text style={styles.loginBtnText}>Add to Cart</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.registerBtn}
                  title="View Cart"
                  onPress={() => { navigation.navigate('ViewCartScreen') }}
                >
                  <Text style={styles.registerBtnText}>View Cart</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.registerBtn}
                  title="Edit Product"
                  onPress={() => { navigation.navigate('EditProductScreen') }}
                >
                  <Text style={styles.registerBtnText}>Edit Product</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  )
}

export default ProductDetailScreen

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
    paddingBottom: 120,
  },
  heroImageContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  heroImage: {
    width: 232,
  },
  heroImageThumbnails: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
  },
  thumbnail: {
    marginRight: 8,
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
