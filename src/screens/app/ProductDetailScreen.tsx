// @ts-nocheck
import { StyleSheet, Text, View, ScrollView, Image, useWindowDimensions, TouchableOpacity } from 'react-native'
import { useState, useEffect, useContext } from 'react'
import { webServer, user, tokens, setTokens } from '../../config'
import { SafeAreaView } from 'react-native-safe-area-context'
import Feather from '@expo/vector-icons/Feather'
import { AppColors } from '../../styles/colors'
import { s } from 'react-native-size-matters'
import ProductSizepicker from '../../components/forms/ProductSizePicker'
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
      try {
        const response = await fetch(`${webServer}/api/v1/gyms/${user.gym_id}/products/${route.params.product.pid}`, {// http://localhost:8080/classy-api/api/v1/gyms/1/products/5
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
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
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
                <Text style={styles.formLabel}>Description</Text>
                <ScrollView style={styles.descriptionScroll} showsVerticalScrollIndicator={true}>
                  <RenderHtml
                    contentWidth={width - 48}
                    source={{ html: product?.description || '<p>No description available.</p>' }}
                    tagsStyles={tagsStyles}
                    baseStyle={styles.productDesc}
                  />
                </ScrollView>
              </View>
              <View style={styles.inputField}>
                <Text style={styles.formLabel}>Size</Text>
                <ProductSizepicker size={product?.size} />
              </View>
              <View style={styles.inputField}>
                <Text style={styles.formLabel}>SKU</Text>
                <InputField value={product?.sku} />
              </View>
              <View style={styles.inputField}>
                <Text style={styles.formLabel}>Color</Text>
                <InputField value={product?.color} />
              </View>
              <View style={styles.inputField}>
                <Text style={styles.formLabel}>Brand</Text>
                <InputField value={product?.brand} />
              </View>
              <View style={styles.inputField}>
                <Text style={styles.formLabel}>Price</Text>
                <InputField value={product?.price} />
              </View>
              <View style={styles.inputField}>
                <Text style={styles.formLabel}>Sale Price</Text>
                <InputField value={product?.sale_price} />
              </View>
              <View style={styles.inputField}>
                <Text style={styles.formLabel}>Cost Price</Text>
                <InputField value={product?.cost_price} />
              </View>
              <View style={styles.inputField}>
                <Text style={styles.formLabel}>Quantity</Text>
                <QuantityPicker quantity={product?.quantity_in_stock} />
              </View>
              <View style={styles.inputField}>
                <Text style={styles.formLabel}>Weight</Text>
                <QuantityPicker quantity={product?.weight} />
              </View>
              <View style={styles.row}>
                <TouchableOpacity
                  style={styles.registerBtn}
                  title="Add to Cart"
                  onPress={() => { handleSubmit() }}
                >
                  <Text style={styles.registerBtnText}>Add to Cart</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.loginBtn}
                  title="View Cart"
                  onPress={() => { navigation.navigate('ViewCartScreen') }}
                >
                  <Text style={styles.loginBtnText}>View Cart</Text>
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
    marginTop: 24,
    marginBottom: 24,
    height: 200,
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
    marginBottom: 24,
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
  },
  loginBtnText: {
    color: AppColors.blue,
    fontSize: 16
  },
})

const tagsStyles = {
  p: {
    color: '#333333',
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
    color: AppColors.blue,
    lineHeight: 20,
  },
};
