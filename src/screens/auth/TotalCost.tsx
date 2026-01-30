import { StyleSheet, Text, View, Dimensions, ScrollView, TouchableOpacity, Image } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import Feather from '@expo/vector-icons/Feather'
import { AppColors } from '../../styles/colors'
import { useFonts } from 'expo-font'
import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import TabNavigator from '../TabNavigator'

const windowHeight = Dimensions.get('window').height

const TotalCost = () => {
  const navigation = useNavigation()
  const [fontsLoaded] = useFonts({
    "Montserrat": require("../../assets/fonts/montserrat/Montserrat-Regular.ttf"),
    "Montserrat-Bold": require("../../assets/fonts/montserrat/Montserrat-Bold.ttf")
  })

  return (
    <>
      <SafeAreaView style={styles.container}>
        <View style={styles.navs}>
          <Feather name="arrow-left" color={AppColors.blue} size={36} onPress={() => { navigation.goBack() }} />
        </View>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.headingContainer}>

          </View>
          <View style={styles.body}>
            <Text style={styles.title}>Total Cost</Text>
            <Text style={styles.totalCost}>$40.00</Text>

            <View style={styles.loginBtnContainer}>
              <TouchableOpacity
                style={styles.registerBtn}
                title="loginSubmit"
                activeOpacity={0.7}
              // onPress={handleSubmit(onSubmit)}
              >
                <Text style={styles.registerBtnText}>Pay with Debit or Credit Card</Text>
              </TouchableOpacity>
            </View>

            <Image style={styles.paymentIcons} source={require('../../assets/images/paymentIcons.png')} />
          </View>
        </ScrollView>
        <TabNavigator />
      </SafeAreaView>
    </>
  )
}

export default TotalCost

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
  body: {
    paddingLeft: 24,
    paddingRight: 24,
    marginBottom: 8,
    flex: 1,
    height: windowHeight,
    alignItems: 'center'
    // borderWidth: 1, borderColor: 'red',
  },
  title: {
    color: AppColors.primary,
    fontFamily: 'Montserrat',
    fontSize: 32,
    marginTop: 60,
  },
  totalCost: {
    fontSize: 32,
    fontFamily: 'Montserrat',
    color: AppColors.blue,
    marginTop: 8
  },
  registerBtn: {
    backgroundColor: AppColors.blue,
    borderRadius: 40,
    width: 250,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 24
  },
  registerBtnText: {
    fontFamily: 'Montserrat',
    color: '#fff',
    fontSize: 12
  },
  scrollView: {
  }
})
