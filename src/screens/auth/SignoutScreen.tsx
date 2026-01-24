import { StyleSheet, Text, View, Dimensions, ScrollView, TouchableOpacity, Image } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import Feather from '@expo/vector-icons/Feather'
import { AppColors } from '../../styles/colors'
import { useFonts } from 'expo-font'
import PinkLeafSvg from '../../assets/svg/PinkLeafSvg'
import Ionicons from '@expo/vector-icons/Ionicons'
import TabNavigator from '../TabNavigator'
import DesignerSvg from '../../components/svg/DesignerSvg'

const windowHeight = Dimensions.get('window').height

const SignoutScreen = () => {
  const navigation = useNavigation()
  const [fontsLoaded] = useFonts({
    "Montserrat": require("../../assets/fonts/montserrat/Montserrat-Regular.ttf"),
    "Montserrat-Bold": require("../../assets/fonts/montserrat/Montserrat-Bold.ttf")
  })

  return (
    <>
      <SafeAreaView style={styles.container}>
        <View style={styles.navs}>
          <Ionicons color={AppColors.hamburgerIconColor} name="menu" size={40} onPress={() => navigation.openDrawer()} />
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.headingContainer}>
            <Text style={styles.title}>Signed Out</Text>
            <PinkLeafSvg style={styles.pinkLeaf} />
          </View>
          <View style={styles.body}>

            <Text style={styles.bodyText}>
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

          </View>
        </ScrollView>
        <TabNavigator />
      </SafeAreaView>
    </>
  )
}

export default SignoutScreen

const styles = StyleSheet.create({
  container: {
    backgroundColor: AppColors.white,
  },
  navs: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
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
    fontFamily: 'Montserrat',
    fontSize: 32,
    marginTop: 20,
  },
  pinkLeaf: {
    position: 'absolute',
    // zIndex: -1,
    // top: 0,
    right: 88
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
  bodyText: {
    color: AppColors.blue,
    fontSize: 20,
    lineHeight: 32,
    textAlign: 'center',
    marginBottom: 24
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
    marginBottom: 80,
  },
  loginBtnText: {
    color: AppColors.blue,
    fontSize: 16
  },
  imageContainer: {
    marginBottom: 8,
    alignItems: 'center',
    // borderWidth: 1, borderColor: 'red',
  },
  scrollView: {
  }
})
