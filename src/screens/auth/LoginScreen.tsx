import { StyleSheet, Text, View, Image, Dimensions } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import Ionicons from '@expo/vector-icons/Ionicons'
import Feather from '@expo/vector-icons/Feather'
import { AppColors } from '../../styles/colors'
import { useFonts } from 'expo-font'
import VectorImageSvg from '../../components/svg/VectorImageSvg'
import AvatarBoyKid from '../../assets/svg/AvatarBoyKidSvg'
import { s, vs } from 'react-native-size-matters'
import LoginForm from '../../components/forms/LoginForm'

const windowWidth = Dimensions.get('window').width;

const LoginScreen = () => {
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
        <AvatarBoyKid style={styles.avatarBoyKidSvg} />
        <Text style={styles.title}>Sign In</Text>
        <Text style={styles.subHead}>Please sign in to proceed to your account.</Text>
      </View>
      <LoginForm />
      <View style={styles.body}>

      </View>
      <View style={styles.imageContainer}>
        <VectorImageSvg />
      </View>
    </SafeAreaView >
  )
}

export default LoginScreen

const styles = StyleSheet.create({
  container: {
    backgroundColor: AppColors.white,
    flex: 1,
    // justifyContent: 'flex-end',
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
    width: windowWidth - 64,
    marginTop: s(24)
  },
  title: {
    color: AppColors.blue,
    fontFamily: 'Montserrat',
    fontSize: s(32),
    marginTop: s(20),
    marginBottom: s(10)
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
  },
  bodyText: {
    fontSize: s(14),
    fontFamily: "Montserrat",
    lineHeight: 24,
    color: AppColors.primary,
  },
  registerBtn: {
    backgroundColor: AppColors.blue,
    borderRadius: 40,
    width: 140,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerBtnText: {
    color: '#fff',
    fontSize: 14
  },
  loginBtn: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: AppColors.blue,
    borderRadius: 40,
    width: 140,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginBtnText: {
    color: AppColors.blue,
    fontSize: 14
  },
  imageContainer: {
    marginBottom: 8
    // borderWidth: 1, bordeerColor: 'red',
  },
  subHead: {
    fontFamily: 'Montserrat',
    fontSize: s(20),
    lineHeight: s(24)
  }
})
