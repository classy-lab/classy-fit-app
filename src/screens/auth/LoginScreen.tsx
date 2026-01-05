import {
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { AppColors } from '../../styles/colors'
import { useNavigation } from '@react-navigation/native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useFonts } from 'expo-font'
import VectorImageSvg from '../../components/svg/VectorImageSvg'
import AvatarBoyKid from '../../assets/svg/AvatarBoyKidSvg'
import { s, vs } from 'react-native-size-matters'
import LoginForm from '../../components/forms/LoginForm'

const LoginScreen = () => {
  const navigation = useNavigation()
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.hamburgerIcon}>
        <Ionicons color={AppColors.hamburgerIconColor} name="menu" size={40} onPress={() => navigation.openDrawer()} />
      </View>
      <View style={styles.headingContainer}>
        <AvatarBoyKid style={styles.avatarBoyKidSvg} />
        <Text style={styles.title}>Sign In</Text>
        <Text style={styles.subHead}>Please sign in to proceed to your account.</Text>
      </View>
      <View>
        <LoginForm />
      </View>
      <View style={styles.vectorImageSvg}>
        <VectorImageSvg />
      </View>
    </SafeAreaView>
  )
}

export default LoginScreen

const styles = StyleSheet.create({
  container: {
    backgroundColor: AppColors.white,
    flex: 1,
    alignItems: 'center',
    width: "100%",
    padding: 8,
    paddingLeft: s(32),
    paddingRight: s(32)
  },
  hamburgerIcon: {
    width: '100%',
    alignItems: 'flex-end',
    marginRight: 24
  },
  headingContainer: {
    marginTop: 24,
    width: '100%',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  avatarBoyKidSvg: {
  },
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
