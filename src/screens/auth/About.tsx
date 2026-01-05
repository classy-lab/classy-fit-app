import { StyleSheet, Text, View, Image } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import Ionicons from '@expo/vector-icons/Ionicons'
import Entypo from '@expo/vector-icons/Entypo'
import { AppColors } from '../../styles/colors'
import { useFonts } from 'expo-font'
import WorkoutSvg from '../../components/svg/WorkoutSvg'
import PinkLeafSvg from '../../assets/svg/PinkLeafSvg'

const About = () => {
  const navigation = useNavigation()
  const [fontsLoaded] = useFonts({
    "Montserrat": require("../../assets/fonts/montserrat/Montserrat-Regular.ttf"),
    "Montserrat-Bold": require("../../assets/fonts/montserrat/Montserrat-Bold.ttf")
  })

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.navs}>
        <Entypo name="chevron-small-left" color={AppColors.blue} size={40} onPress={() => { navigation.goBack() }} />
        <Ionicons color={AppColors.hamburgerIconColor} name="menu" size={40} onPress={() => navigation.openDrawer()} />
      </View>
      <View style={styles.headingContainer}>
        <Text style={styles.title}>About</Text>
        <PinkLeafSvg style={styles.pinkLeaf} />
      </View>
      <Text style={styles.body}>
        V-fitness Center & Gym in Koheda has a wide range of products and / or services to cater to the varied requirements of their customers. The staff at this establishment are courteous and prompt at providing any assistance. They readily answer any queries or questions that you may have. This establishment is functional from 05:30 - 21:00.
      </Text>
      <View style={styles.imageContainer}>
        <WorkoutSvg />
      </View>
    </SafeAreaView >
  )
}

export default About

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
    // borderWidth: 1, borderColor: 'red'
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
    lineHeight: 24,
    color: AppColors.primary,
    marginLeft: 24,
    marginRight: 24,
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
    flexGrow: 1,
    justifyContent: 'flex-end',
    marginBottom: 8
  }
})
