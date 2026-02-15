import { StyleSheet, Text, View, ScrollView, Image, useWindowDimensions } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import Feather from '@expo/vector-icons/Feather'
import Ionicons from '@expo/vector-icons/Ionicons'
import { AppColors } from '../../styles/colors'
import MaterialIcons from '@expo/vector-icons/MaterialIcons'

const ProductDetailScreen = () => {
  const { height } = useWindowDimensions()
  const navigation = useNavigation()

  return (
    <>
      <SafeAreaView style={styles.container}>
        <View style={styles.navs}>
          <Feather name="arrow-left" color={AppColors.blue} size={36} onPress={() => { navigation.goBack() }} />
        </View>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={[styles.body, { height: height }]}>
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
    marginBottom: 8,
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
    fontSize: 32,
    color: AppColors.blue
  }
})
