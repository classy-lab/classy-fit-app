import { StyleSheet, Text, View, ScrollView, Image, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Feather from '@expo/vector-icons/Feather'
import { AppColors } from '../../styles/colors'
import { s } from 'react-native-size-matters'
import ProductSizepicker from '../../components/forms/ProductSizePicker'
import QuantityPicker from '../../components/forms/QuantityPicker'
import ColorPicker from '../../components/forms/ColorPicker'

const TreadmillEquipmentScreen = ({ navigation, route }) => {

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
                <Image style={styles.heroImage} source={require('../../assets/images/equipment/treadmill1.jpg')} />
              </View>
              <View style={styles.heroImageThumbnails}>
                <Image style={styles.thumbnail} source={require('../../assets/images/equipment/treadmill2.jpg')} />
                <Image style={styles.thumbnail} source={require('../../assets/images/equipment/treadmill3.jpg')} />
                <Image style={styles.thumbnail} source={require('../../assets/images/equipment/treadmill4.jpg')} />
                <Image style={styles.thumbnail} source={require('../../assets/images/equipment/treadmill5.jpg')} />
                <Image style={styles.thumbnail} source={require('../../assets/images/equipment/treadmill6.jpg')} />
              </View>
            </View>
            <View style={styles.content}>
              <Text style={styles.productTitle}>AF 111N Motorized Treadmill</Text>
              <Text style={styles.productDesc}>
                About this item:{'\n'}
                Manufacturer: Aerofit{'\n'}
                Model Name: Prostyle 2{'\n'}
                Cost: $52000{'\n'}
                Warranty Description: 120 days{'\n'}
                Dimension:84″(L) X 35″(W) X 67″(H).{'\n'}
                Motor: AC Motor, 5.0 HP Continuous Duty, 10.0 HP Peak Duty.{'\n'}
                Speed: 1.0 To 24 Kmph.{'\n'}
                Elevation:-3% Decline To 20% Incline.{'\n'}
                Running Surface:64″ (L) X 23.5″ (W).{'\n'}
                Programs:76 Programs (64 Preset, 3 User, 3 HR, 5 Fat & 1 Manual){'\n'}
                Display:LED window display.{'\n'}
                Display Feedback: Speed, Time, Distance, Calories, Incline, Pulse.{'\n'}
                Extra Features: Wireless Charging, Bluetooth Connectivity, USB, Aux&Speakers.{'\n'}
                Power Requirement: 220V AC.{'\n'}
                Max User Weight: 180 Kgs.{'\n'}
                Website: https://aerofit.co/product/af-111n-motorized-treadmill/
              </Text>
              <View style={styles.selectList}>
                <Text style={styles.formLabel}>Type</Text>
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
                // onPress={() => { handleSubmit() }}
                >
                  <Text style={styles.registerBtnText}>Contact Manufacturer</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.loginBtn}
                  title="View Cart"
                // onPress={() => { navigation.navigate('ViewCartScreen') }}
                >
                  <Text style={styles.loginBtnText}>Contact Repair Technician</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  )
}

export default TreadmillEquipmentScreen

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
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
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
