import { StyleSheet, Text, View, Image, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import Ionicons from '@expo/vector-icons/Ionicons'
import Feather from '@expo/vector-icons/Feather'
import { AppColors } from '../../styles/colors'
import { useFonts } from 'expo-font'
import PinkLeafSvg from '../../assets/svg/PinkLeafSvg'
import { s, vs } from 'react-native-size-matters'
import DesignerSvg from '../../components/svg/DesignerSvg'

const SignoutScreen = () => {
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
        <Text style={styles.title}>Signout</Text>
        <PinkLeafSvg style={styles.pinkLeaf} />
      </View>
      <Text style={styles.body}>
        You have successfully signed out of your account.
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
        <DesignerSvg />
      </View>
    </SafeAreaView >
  )
}

export default SignoutScreen

const styles = StyleSheet.create({
  container: {
    backgroundColor: AppColors.white,
    flex: 1,
    alignItems: 'center',
    width: "100%",
    padding: 8
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
    fontFamily: "Montserrat",
    lineHeight: s(32),
    color: AppColors.blue,
    marginLeft: 24,
    marginRight: 24,
    margingBottom: 40,
    fontSize: s(20)
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
    // margingTop: 40, borderWidth: 1, borderColor: 'red'
  },
  loginBtnText: {
    color: AppColors.blue,
    fontSize: 14
  },
  imageContainer: {
    flexGrow: 1,
    justifyContent: 'flex-end',
    marginBottom: 8
  }
})
