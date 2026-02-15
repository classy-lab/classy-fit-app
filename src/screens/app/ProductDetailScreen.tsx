import { StyleSheet, Text, View, ScrollView, Image, useWindowDimensions, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import Feather from '@expo/vector-icons/Feather'
import Ionicons from '@expo/vector-icons/Ionicons'
import { AppColors } from '../../styles/colors'
import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import { s } from 'react-native-size-matters'
import ProductSizepicker from '../../components/forms/ProductSizePicker'
import QuantityPicker from '../../components/forms/QuantityPicker'
import ColorPicker from '../../components/forms/ColorPicker'

const ProductDetailScreen = () => {
  const { height } = useWindowDimensions()
  const navigation = useNavigation()

  const handleSubmit = () => {
    console.log('handleSubmit() pressed')
  }

  return (
    <>
      <SafeAreaView style={styles.container}>
        <View style={styles.navs}>
          <Feather name="arrow-left" color={AppColors.blue} size={36} onPress={() => { navigation.goBack() }} />
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
              <Text style={styles.productTitle}>Boxing Gloves</Text>
              <Text style={styles.productDesc}>
                About this item:{'\n'}
                Enhanced Protection and Comfort. The updated design features a three-layer foam construction, providing superior cushioning and impact absorption during training sessions. The curved anatomical grip ensures a snug fit, allowing for optimal hand positioning and reduced fatigue. This thoughtful design enables athletes to maintain proper form throughout extended workout periods, enhancing both performance and safety.{'\n'}
                Cost: $40.00 USD{'\n'}
                Material: Synthetic{'\n'}
                Glove Type: Bag{'\n'}
                Brand Name: Everlast{'\n'}
                Warranty Description: 120 days{'\n'}
                Model Name: Prostyle 2{'\n'}
                Manufacturer: Everlast{'\n'}
                Part Number: 925330-70{'\n'}
                Item Dimensions LxWxH: 11.81 x 6.69 x 4.72 inches{'\n'}
                Item Weight: 1.3 Pounds
              </Text>
              <View style={styles.selectList}>
                <Text style={styles.formLabel}>Size</Text>
                <ProductSizepicker />
              </View>
              <View style={styles.selectList}>
                <Text style={styles.formLabel}>Quantity</Text>
                <QuantityPicker />
              </View>
              <View style={styles.selectList}>
                <Text style={styles.formLabel}>Color</Text>
                <ColorPicker />
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
                  onPress={() => { handleSubmit() }}
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
    // flex: 1,
    // borderWidth: 1, borderColor: 'red',
  },
  heroImageContainer: {
    alignItems: 'center',
    marginBottom: 16,
    // borderWidth: 1, borderColor: 'red',
  },
  heroImage: {
    width: 232,
  },
  heroImageThumbnails: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    // borderWidth: 1, borderColor: 'red',
  },
  thumbnail: {
    marginRight: 8,
    // borderWidth: 1, borderColor: 'blue',
  },
  content: {
    marginTop: 24,
  },
  productTitle: {
    fontSize: s(32),
    color: AppColors.blue
  },
  productDesc: {
    marginTop: s(24),
    lineHeight: s(24),
    marginBottom: s(24)
  },
  formLabel: {
    marginBottom: s(8)
  },
  selectList: {
    marginBottom: s(24)
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
