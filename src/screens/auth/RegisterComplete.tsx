import { StyleSheet, Text, View, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import Ionicons from '@expo/vector-icons/Ionicons'
import Feather from '@expo/vector-icons/Feather'
import { AppColors } from '../../styles/colors'
import { useFonts } from 'expo-font'
import HealthyLifestyleSvg from '../../components/svg/HealthyLifestyleSvg'
import PinkLeafSvg from '../../assets/svg/PinkLeafSvg'
import { s, vs } from 'react-native-size-matters'

const RegisterComplete = () => {
  const navigation = useNavigation()
  const [fontsLoaded] = useFonts({
    "Montserrat": require("../../assets/fonts/montserrat/Montserrat-Regular.ttf"),
    "Montserrat-Bold": require("../../assets/fonts/montserrat/Montserrat-Bold.ttf")
  })

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.navs}>
        <Feather name="arrow-left" color={AppColors.blue} size={36} onPress={() => { navigation.goBack() }} />
        <Ionicons color={AppColors.hamburgerIconColor} name="menu" size={40} onPress={() => navigation.openDrawer()} />
      </View>
      <View style={styles.headingContainer}>
        <Text style={styles.title}>Thank you!</Text>
        <PinkLeafSvg style={styles.pinkLeaf} />
      </View>
      <View style={styles.body}>
        <Text style={styles.bodyText}>
          Your account has been created.{"\n"}Please check your email and click on activation link to activate your account.
        </Text>
        <TouchableOpacity
          style={styles.loginBtn}
          title="Login"
          onPress={() => { navigation.navigate('LoginScreen') }}
          activeOpacity={0.7}
        >
          <Text style={styles.loginBtnText}>
            Login
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.imageContainer}>
        <HealthyLifestyleSvg />
      </View>
    </SafeAreaView >
  )
}

export default RegisterComplete

const styles = StyleSheet.create({
  container: {
    backgroundColor: AppColors.white,
    flex: 1,
    alignItems: 'center',
    width: "100%",
    paddingLeft: 24,
    paddingRight: 24,
  },
  navs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  headingContainer: {
    width: 375,
    alignItems: 'center'
  },
  title: {
    color: AppColors.blue,
    fontFamily: 'Montserrat',
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
    // borderWidth: 1, bordeerColor: 'red',
    flex: 1,
    marginBottom: 32,
    alignItems: 'center'
  },
  bodyText: {
    fontFamily: "Montserrat",
    lineHeight: s(32),
    color: AppColors.blue,
    fontSize: s(20),
    textAlign: 'center'
  },
  loginBtn: {
    backgroundColor: AppColors.blue,
    borderRadius: 40,
    width: 140,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32
  },
  loginBtnText: {
    color: '#fff',
    fontSize: 14
  },
  imageContainer: {
    marginBottom: 8,
    // borderWidth: 1, bordeerColor: 'red',
  }
})
