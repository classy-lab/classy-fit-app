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

const ThankYou = () => {
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
            <Text style={styles.title}>Thank you!</Text>
          </View>
          <View style={styles.body}>

            <Text style={styles.bodyText}>
              Your Order is complete. Your Order number is: {'\n'}
              <Text style={styles.boldText}>100</Text> {'\n'}
              A confirmation email has been sent to: <Text style={styles.boldText}>emma56@gmail.com</Text>
            </Text>

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

export default ThankYou

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
    height: windowHeight,
    alignItems: 'center'
    // borderWidth: 1, borderColor: 'red',
  },
  bodyText: {
    color: AppColors.primary,
    fontSize: 16,
    textAlign: 'center',
    marginTop: 40
  },
  boldText: {
    fontFamily: 'Montserrat-Bold'
  },
  imageContainer: {
    marginBottom: 8,
    alignItems: 'center',
    marginTop: 132
    // borderWidth: 1, borderColor: 'red',
  },
  scrollView: {
  }
})
