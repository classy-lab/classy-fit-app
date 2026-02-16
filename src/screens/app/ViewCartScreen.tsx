import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Image } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AppColors } from '../../styles/colors'
import { useNavigation } from '@react-navigation/native'
import Feather from '@expo/vector-icons/Feather'

const ViewCartScreen = () => {
  const navigation = useNavigation()

  return (
    <>
      <SafeAreaView style={styles.container}>
        <View style={styles.navs}>
          <Feather name="arrow-left" color={AppColors.blue} size={36} onPress={() => { navigation.goBack() }} />
        </View>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.headingContainer}>
            <Text style={styles.title}>Total Cost</Text>
          </View>
          <View style={[styles.body]}>
            <Text style={styles.bodyText}>
              $40.00 USD
            </Text>
            <View style={styles.row}>
              <TouchableOpacity
                style={styles.registerBtn}
                title="Proceed to Checkout"
                onPress={() => { console.log('Proceed to Checkout pressed') }}
              >
                <Text style={styles.registerBtnText}>Proceed to Checkout</Text>
              </TouchableOpacity>
            </View>
            <Image style={styles.paymentIcons} source={require('../../assets/images/products/payment-icons.png')} />
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  )
}

export default ViewCartScreen

const styles = StyleSheet.create({
  container: {
    backgroundColor: AppColors.white,
    flex: 1,
    // borderWidth: 1, borderColor: 'red'
  },
  navs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingLeft: 24,
    paddingRight: 24,
  },
  headingContainer: {
    alignItems: 'center',
    marginBottom: 20
  },
  title: {
    color: AppColors.primary,
    fontSize: 32,
    marginTop: 60,
  },
  body: {
    paddingLeft: 24,
    paddingRight: 24,
    // flex: 1,
  },
  bodyText: {
    color: AppColors.blue,
    fontSize: 32,
    marginTop: 8,
    marginBottom: 8,
    textAlign: 'center'
  },
  row: {
    alignItems: 'center',
    marginTop: 24,
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
  paymentIcons: {
    marginTop: 24,
    alignSelf: 'center'
  }
})
