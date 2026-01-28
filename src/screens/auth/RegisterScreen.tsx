import { StyleSheet, Text, View, Dimensions, ScrollView } from 'react-native'
import { AppColors } from '../../styles/colors'
import { useNavigation } from '@react-navigation/native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Ionicons from '@expo/vector-icons/Ionicons'
import Feather from '@expo/vector-icons/Feather'
import { s, vs } from 'react-native-size-matters'
import VectorImageSvg from '../../components/svg/VectorImageSvg'
import RegisterForm from '../../components/forms/RegisterForm'
import ProfileImage from '../../components/svg/ProfileImage'

const windowHeight = Dimensions.get('window').height

const RegisterScreen = () => {
  const navigation = useNavigation()
  return (
    <>
      <SafeAreaView style={styles.container}>
        <View style={styles.navs}>
          <Feather name="arrow-left" color={AppColors.blue} size={36} onPress={() => { navigation.goBack() }} />
          <Ionicons color={AppColors.hamburgerIconColor} name="menu" size={40} onPress={() => navigation.openDrawer()} />
        </View>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.headingContainer}>
            <Text style={styles.title}>Register</Text>
            <Text style={styles.subHead}>Create an account to start.</Text>
            <ProfileImage style={styles.card} />
          </View>
          <View style={styles.body}>
            <RegisterForm />
          </View>
          <View style={styles.imageContainer}>
            <VectorImageSvg />
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  )
}

export default RegisterScreen

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
    marginBottom: 8,
    flex: 1,
    // height: windowHeight,
    // borderWidth: 1, borderColor: 'red',
  },
  imageContainer: {
    marginBottom: 8
    // borderWidth: 1, bordeerColor: 'red',
  },
  card: { alignSelf: 'center', marginTop: s(16) },
  subHead: {
    fontFamily: 'Montserrat',
    fontSize: s(20),
    lineHeight: s(24)
  },
  scrollView: {
  }
})
