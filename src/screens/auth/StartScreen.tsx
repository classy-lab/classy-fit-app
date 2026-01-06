import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
} from 'react-native'
import { AppColors } from '../../styles/colors'
import { useNavigation } from '@react-navigation/native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useFonts } from 'expo-font'
import VectorImageSvg from '../../components/svg/VectorImageSvg'
import PinkLeafSvg from '../../assets/svg/PinkLeafSvg'

const StartScreen = () => {
  const navigation = useNavigation()
  const [fontsLoaded] = useFonts({
    "Montserrat": require("../../assets/fonts/montserrat/Montserrat-Regular.ttf")
  })

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.hamburgerIcon}>
        <Ionicons color={AppColors.hamburgerIconColor} name="menu" size={40} onPress={() => navigation.openDrawer()} />
      </View>
      <View style={styles.headingContainer}>
        <Text style={styles.title}>Classy Gym</Text>
        <PinkLeafSvg style={styles.pinkLeaf} />
      </View>
      <View style={styles.row}>
        <View style={styles.box}><Text>Gym</Text></View>
        <View style={styles.box}><Text>Classes</Text></View>
      </View>
      <View style={styles.row}>
        <View style={styles.box}><Text>Training</Text></View>
      </View>
      <Text style={styles.subTitle}>Helping gyms and workouts be productive for everyone</Text>
      <View style={styles.row}>
        <TouchableOpacity
          style={styles.registerBtn}
          title="Register"
          onPress={() => { navigation.navigate('RegisterScreen') }}
          activeOpacity={0.7}
        >
          <Text style={styles.registerBtnText}>
            Register
          </Text>
        </TouchableOpacity>
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
        <VectorImageSvg />
      </View>
    </SafeAreaView>
  )
}

export default StartScreen

const styles = StyleSheet.create({
  container: {
    backgroundColor: AppColors.white,
    flex: 1,
    alignItems: 'center',
    width: "100%",
    padding: 8,
    // borderWidth: 1, borderColor: 'red'
  },
  hamburgerIcon: {
    width: '100%',
    alignItems: 'flex-end',
    marginRight: 24
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
    right: -72
  },
  row: {
    flexDirection: "row",
    justifyContent: 'space-evenly',
    width: 311,
    marginBottom: 10,
  },
  box: {
    backgroundColor: AppColors.grey,
    width: 90,
    height: 90,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center"
  },
  subTitle: {
    fontFamily: "Montserrat",
    color: AppColors.blue,
    fontSize: 14,
    lineHeight: 24,
    textAlign: 'center',
    marginTop: 24,
    marginBottom: 24,
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
    color: AppColors.white,
    fontSize: 14
  },
  loginBtn: {
    backgroundColor: AppColors.white,
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
    flexGrow: 1,
    justifyContent: 'flex-end',
  }
})
