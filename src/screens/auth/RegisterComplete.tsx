import { StyleSheet, Text, View, ScrollView, TouchableOpacity, useWindowDimensions } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import Feather from '@expo/vector-icons/Feather'
import Ionicons from '@expo/vector-icons/Ionicons'
import { AppColors } from '../../styles/colors'
import { useFonts } from 'expo-font'
import HealthyLifestyleSvg from '../../components/svg/HealthyLifestyleSvg'

const RegisterComplete = () => {
  const { height, width } = useWindowDimensions()
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
          <Ionicons color={AppColors.hamburgerIconColor} name="menu" size={40} onPress={() => navigation.openDrawer()} />
        </View>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.headingContainer}>
            <Text style={styles.title}>Thank you!</Text>
          </View>
          <View style={[styles.body, { height: height }]}>
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
            <View style={styles.imageContainer}>
              <HealthyLifestyleSvg />
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  )
}

export default RegisterComplete

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
  headingContainer: {
    alignItems: 'center',
    marginBottom: 20
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
    paddingLeft: 24,
    paddingRight: 24,
  },
  bodyText: {
    marginBottom: 8,
    // flex: 1,
    // borderWidth: 1, borderColor: 'red',
    fontFamily: "Montserrat",
    lineHeight: 32,
    color: AppColors.blue,
    fontSize: 20,
    textAlign: 'center'
  },
  loginBtn: {
    backgroundColor: AppColors.blue,
    borderRadius: 40,
    width: 140,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: 32
  },
  loginBtnText: {
    color: '#fff',
    fontSize: 14
  },
  imageContainer: {
    marginTop: 20,
    alignItems: 'center'
    // borderWidth: 1, bordeerColor: 'red',
  },
  scrollView: {
  }
})
