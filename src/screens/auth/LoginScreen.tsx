import { StyleSheet, Text, View, Dimensions } from 'react-native'
import { AppColors } from '../../styles/colors'
import { useNavigation } from '@react-navigation/native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Ionicons from '@expo/vector-icons/Ionicons'
import Entypo from '@expo/vector-icons/Entypo'
import { useFonts } from 'expo-font'
import VectorImageSvg from '../../components/svg/VectorImageSvg'
import AvatarBoyKid from '../../assets/svg/AvatarBoyKidSvg'
import { s, vs } from 'react-native-size-matters'
import LoginForm from '../../components/forms/LoginForm'

const windowWidth = Dimensions.get('window').width;

const LoginScreen = () => {
  const navigation = useNavigation()
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.navs}>
        <Entypo name="chevron-small-left" color={AppColors.blue} size={40} onPress={() => { navigation.goBack() }} />
        <Ionicons color={AppColors.hamburgerIconColor} name="menu" size={40} onPress={() => navigation.openDrawer()} />
      </View>
      <View style={styles.headingContainer}>
        <AvatarBoyKid style={styles.avatarBoyKidSvg} />
        <Text style={styles.title}>Sign In</Text>
        <Text style={styles.subHead}>Please sign in to proceed to your account.</Text>
      </View>
      <LoginForm />
      <View style={styles.vectorImageSvg}>
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
    width: windowWidth - 64,
    marginTop: s(24)
  },
  avatarBoyKidSvg: {},
  title: {
    color: AppColors.blue,
    fontFamily: 'Montserrat',
    fontSize: s(32),
    marginTop: s(20),
    marginBottom: s(10)
  },
  subHead: {
    fontFamily: 'Montserrat',
    fontSize: s(20),
    lineHeight: s(24)
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
    width: 300,
    marginBottom: 10,
  },
  vectorImageSvg: {
    flexGrow: 1,
    justifyContent: 'flex-end',
  }
})
