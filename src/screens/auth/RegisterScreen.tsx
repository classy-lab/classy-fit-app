import { StyleSheet, Text, View, Dimensions, ScrollView } from 'react-native'
import { AppColors } from '../../styles/colors'
import { useNavigation } from '@react-navigation/native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Ionicons from '@expo/vector-icons/Ionicons'
import Feather from '@expo/vector-icons/Feather'
import VectorImageSvg from '../../components/svg/VectorImageSvg'
import { s, vs } from 'react-native-size-matters'
import RegisterForm from '../../components/forms/RegisterForm'
import ProfileImage from '../../components/svg/ProfileImage'

const windowWidth = Dimensions.get('window').width;

const RegisterScreen = () => {
  const navigation = useNavigation()
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.navs}>
        <Feather name="arrow-left" color={AppColors.blue} size={36} onPress={() => { navigation.goBack() }} />
        <Ionicons color={AppColors.hamburgerIconColor} name="menu" size={40} onPress={() => navigation.openDrawer()} />
      </View>
      <ScrollView showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false} >
        <View style={styles.headingContainer}>
          <Text style={styles.title}>Register</Text>
          <Text style={styles.subHead}>Create an account to start.</Text>
          <ProfileImage style={styles.card} />
        </View>
        <RegisterForm />
        <View style={styles.vectorImageSvg}>
          <VectorImageSvg />
        </View>
      </ScrollView>
    </SafeAreaView >
  )
}

export default RegisterScreen

const styles = StyleSheet.create({
  container: {
    backgroundColor: AppColors.white,
    flex: 1,
    alignItems: 'center',
    width: "100%",
    padding: 8
  },
  card: { alignSelf: 'center' },
  navs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  headingContainer: {
    width: windowWidth - 64,
    marginTop: s(24),
    // borderWidth: 1, borderColor: 'red'
  },
  avatarBoyKidSvg: {
    marginTop: s(16),
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
