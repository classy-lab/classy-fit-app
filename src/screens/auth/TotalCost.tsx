import { StyleSheet, Text, View, Image, TouchableOpacity, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { AppColors } from '../../styles/colors'
import { useFonts } from 'expo-font'
import { s } from 'react-native-size-matters'
import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import Feather from '@expo/vector-icons/Feather'
import TabNavigator from '../TabNavigator'

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
          <View style={styles.signOut}>
            <Text style={styles.signOutText}>Sign out</Text>
            <View style={styles.circle}>
              <MaterialIcons name="logout" color={AppColors.white} size={18} onPress={() => { navigation.navigate('SignoutScreen') }} />
            </View>
          </View>
        </View>
        <ScrollView>
          <View style={styles.headingContainer}>
            <Text style={styles.title}>Total Cost</Text>
            <Text style={styles.totalCost}>$40.00</Text>

            <View style={styles.loginBtnContainer}>
              <TouchableOpacity
                style={styles.loginBtn}
                title="loginSubmit"
                activeOpacity={0.7}
              // onPress={handleSubmit(onSubmit)}
              >
                <Text style={styles.loginBtnText}>Pay with Debit or Credit Card</Text>
              </TouchableOpacity>
            </View>

            <Image style={styles.paymentIcons} source={require('../../assets/images/paymentIcons.png')} />
          </View>
          <View style={styles.body}>


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
    flex: 1,
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
    paddingLeft: 3
  },
  headingContainer: {
    alignItems: 'center',
    marginBottom: 20
  },
  title: {
    color: AppColors.primary,
    fontFamily: 'Montserrat',
    fontSize: 32,
    marginTop: 60,
  },
  totalCost: {
    fontSize: 32,
    color: AppColors.blue,
    fontFamily: 'Montserrat',
    marginTop: 8
  },
  body: {
    paddingLeft: 24,
    paddingRight: 24,
    marginBottom: 8,
  },
  loginBtnContainer: {
    alignItems: 'center',
    marginTop: 16
  },
  loginBtn: {
    backgroundColor: AppColors.blue,
    borderRadius: 40,
    width: 250,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginBtnText: {
    color: AppColors.white,
    fontSize: 14,
    fontFamily: 'Montserrat-Medium'
  },
  paymentIcons: {
    marginTop: 24
  }
})
